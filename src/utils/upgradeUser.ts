import { supabase } from "@/integrations/supabase/client";

export const upgradeUserToAdmin = async (email: string) => {
  try {
    console.log(`Upgrading user ${email} to admin...`);

    // First, check if the user exists in profiles
    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, full_name, user_role")
      .eq("email", email)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw new Error(`Error checking profile: ${profileError.message}`);
    }

    if (existingProfile) {
      // User exists, update their role to owner
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          user_role: "owner",
          full_name: existingProfile.full_name || "System Administrator"
        })
        .eq("email", email);

      if (updateError) {
        throw new Error(`Failed to update user role: ${updateError.message}`);
      }

      return {
        success: true,
        message: `Successfully upgraded ${email} to owner privileges!`
      };
    } else {
      // User doesn't exist in profiles, check if they exist in auth
      // This would require admin access to auth.users table
      return {
        success: false,
        message: `User ${email} not found in profiles table. They may need to login first to create their profile.`
      };
    }

  } catch (error: any) {
    console.error("Upgrade user error:", error);
    return {
      success: false,
      message: error.message || "Failed to upgrade user to admin"
    };
  }
};

export const createAdminProfileForEmail = async (email: string) => {
  try {
    console.log(`Creating admin profile for ${email}...`);

    // First check if profile exists
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (existing) {
      // Update existing profile
      const { error } = await supabase
        .from("profiles")
        .update({
          user_role: "owner",
          full_name: "System Administrator"
        })
        .eq("email", email);

      if (error) {
        throw new Error(`Failed to update profile: ${error.message}`);
      }
    } else {
      // Create new profile (need a valid UUID for id)
      const tempId = crypto.randomUUID();
      const { error } = await supabase
        .from("profiles")
        .insert({
          id: tempId,
          email: email,
          full_name: "System Administrator",
          user_role: "owner"
        });

      if (error) {
        throw new Error(`Failed to create profile: ${error.message}`);
      }
    }

    return {
      success: true,
      message: `Successfully created/updated admin profile for ${email}!`
    };

  } catch (error: any) {
    console.error("Create admin profile error:", error);
    return {
      success: false,
      message: error.message || "Failed to create admin profile"
    };
  }
};

export const checkUserPrivileges = async (email: string) => {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, user_role")
      .eq("email", email)
      .single();

    if (error) {
      return {
        exists: false,
        message: `User ${email} not found in profiles`
      };
    }

    return {
      exists: true,
      profile: profile,
      isOwner: profile.user_role === 'owner',
      isManager: profile.user_role === 'manager' || profile.user_role === 'owner',
      message: `User ${email} has role: ${profile.user_role}`
    };

  } catch (error: any) {
    return {
      exists: false,
      message: error.message || "Error checking user privileges"
    };
  }
};
