import { supabase } from "@/integrations/supabase/client";

/**
 * Script to check and upgrade user privileges for admin access
 * This will give admin privileges to specific users
 */

const ADMIN_EMAILS = [
  "admin@admin.com",
  "hanyslmm@gmail.com"
];

export const checkAndUpgradeUserPrivileges = async () => {
  try {
    console.log("Checking user privileges...");
    
    // First, let's check all current profiles
    const { data: allProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('*');
    
    if (fetchError) {
      console.error("Error fetching profiles:", fetchError);
      throw fetchError;
    }
    
    console.log("Current profiles:", allProfiles);
    
    // Check each admin email
    for (const email of ADMIN_EMAILS) {
      console.log(`Checking user: ${email}`);
      
      // Find user by email
      const existingProfile = allProfiles?.find(p => p.email === email);
      
      if (existingProfile) {
        console.log(`Found existing profile for ${email}:`, existingProfile);
        
        // Update their privileges to full admin
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({
            user_role: 'owner',
            role: 'ADMIN',
            full_name: existingProfile.full_name || 'Administrator'
          })
          .eq('id', existingProfile.id)
          .select()
          .single();
        
        if (updateError) {
          console.error(`Error updating profile for ${email}:`, updateError);
        } else {
          console.log(`Successfully upgraded ${email} to admin:`, updatedProfile);
        }
      } else {
        console.log(`No profile found for ${email}. They may need to log in first to create a profile.`);
      }
    }
    
    // Check if there are users in auth.users who don't have profiles
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log("Could not fetch auth users (need admin privileges):", authError.message);
    } else {
      console.log("Auth users:", authUsers.users.map(u => ({ id: u.id, email: u.email })));
      
      // Check for missing profiles
      for (const authUser of authUsers.users) {
        if (ADMIN_EMAILS.includes(authUser.email || '')) {
          const hasProfile = allProfiles?.find(p => p.id === authUser.id);
          
          if (!hasProfile) {
            console.log(`Creating missing profile for ${authUser.email}`);
            
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: authUser.id,
                email: authUser.email,
                full_name: authUser.user_metadata?.full_name || 'Administrator',
                user_role: 'owner',
                role: 'ADMIN'
              })
              .select()
              .single();
            
            if (createError) {
              console.error(`Error creating profile for ${authUser.email}:`, createError);
            } else {
              console.log(`Created admin profile for ${authUser.email}:`, newProfile);
            }
          }
        }
      }
    }
    
    return {
      success: true,
      message: "User privilege check and upgrade completed!"
    };
    
  } catch (error) {
    console.error("Error in privilege upgrade:", error);
    return {
      success: false,
      message: error.message || "Failed to upgrade user privileges",
      error
    };
  }
};

/**
 * Force create admin profiles for users who might be missing them
 */
export const forceCreateAdminProfiles = async () => {
  try {
    console.log("Force creating admin profiles...");
    
    // Get current session to understand current user
    const { data: session } = await supabase.auth.getSession();
    console.log("Current session user:", session.session?.user?.email);
    
    for (const email of ADMIN_EMAILS) {
      console.log(`Processing ${email}...`);
      
      // Try to find existing profile
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();
      
      if (existingProfile) {
        console.log(`Profile exists for ${email}, updating...`);
        
        const { data: updated, error: updateError } = await supabase
          .from('profiles')
          .update({
            user_role: 'owner',
            role: 'ADMIN'
          })
          .eq('email', email)
          .select()
          .single();
        
        if (updateError) {
          console.error(`Update error for ${email}:`, updateError);
        } else {
          console.log(`Updated ${email} successfully:`, updated);
        }
      } else {
        console.log(`No profile found for ${email}, they need to log in first or we need their user ID`);
      }
    }
    
    return { success: true, message: "Admin profiles processed" };
    
  } catch (error) {
    console.error("Error in force create:", error);
    return { success: false, error };
  }
};

// Expose functions to window for browser console access
if (typeof window !== "undefined") {
  (window as any).checkAndUpgradeUserPrivileges = checkAndUpgradeUserPrivileges;
  (window as any).forceCreateAdminProfiles = forceCreateAdminProfiles;
  console.log("Admin upgrade functions available:");
  console.log("- checkAndUpgradeUserPrivileges()");
  console.log("- forceCreateAdminProfiles()");
}
