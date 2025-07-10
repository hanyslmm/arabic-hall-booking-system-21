import { supabase } from "@/integrations/supabase/client";

export const setupAdminAccount = async () => {
  try {
    // First, try to sign in to see if account already exists
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: "admin@example.com",
      password: "admin123"
    });

    if (signInData.user && !signInError) {
      // Account exists and login successful
      return { success: true, message: "Admin account already exists and is working" };
    }

    // If login failed, try to create the account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: "admin@example.com",
      password: "admin123",
      options: {
        data: {
          full_name: "System Administrator"
        },
        emailRedirectTo: undefined // Disable email confirmation
      }
    });

    if (authError) {
      if (authError.message.includes("already registered")) {
        // Account exists but password might be different
        return { 
          success: false, 
          message: "Admin account exists but password might be incorrect. Please contact system administrator." 
        };
      }
      throw authError;
    }

    if (!authData.user) {
      throw new Error("Failed to create admin user");
    }

    // If signup was successful, confirm the user (bypass email confirmation)
    if (authData.user && !authData.user.email_confirmed_at) {
      // For development purposes, we'll create the profile anyway
      console.log("User created but may need email confirmation");
    }

    // Create profile with owner role
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: authData.user.id,
        email: "admin@example.com",
        full_name: "System Administrator",
        user_role: "owner"
      });

    if (profileError && !profileError.message.includes("duplicate")) {
      console.error("Profile creation error:", profileError);
      // Continue anyway, profile might be created by trigger
    }

    // Try to sign in again to verify the account works
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: "admin@example.com",
      password: "admin123"
    });

    if (verifyError) {
      return { 
        success: false, 
        message: `Account created but login failed: ${verifyError.message}. You may need to check email confirmation settings.` 
      };
    }

    return { 
      success: true, 
      message: "Admin account created and verified successfully! You can now login with username: admin and password: admin123" 
    };

  } catch (error: any) {
    console.error("Setup admin error:", error);
    return { 
      success: false, 
      message: error.message || "Failed to create admin account" 
    };
  }
};

export const checkExistingUsers = async () => {
  try {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("email, user_role")
      .limit(10);

    if (error) {
      console.error("Error checking profiles:", error);
      return [];
    }

    return profiles || [];
  } catch (error) {
    console.error("Error checking existing users:", error);
    return [];
  }
};

// Alternative method: Create user via direct profile insertion (for development)
export const createAdminProfileDirectly = async () => {
  try {
    // Generate a fake UUID for admin user (this is for development/testing only)
    const adminId = "00000000-0000-0000-0000-000000000001";
    
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: adminId,
        email: "admin@example.com",
        full_name: "System Administrator",
        user_role: "owner"
      });

    if (error) {
      throw error;
    }

    return { 
      success: true, 
      message: "Admin profile created directly. Note: This is for development only." 
    };
  } catch (error: any) {
    return { 
      success: false, 
      message: error.message || "Failed to create admin profile directly" 
    };
  }
};
