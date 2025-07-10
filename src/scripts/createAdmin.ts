import { supabase } from "@/integrations/supabase/client";

/**
 * One-time setup script to create an initial admin account
 * Email: admin
 * Password: admin123
 * Role: owner
 */
export const createInitialAdmin = async () => {
  try {
    console.log("Creating initial admin account...");
    
    // Step 1: Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: "admin@admin.com", // Using a proper email format
      password: "admin123",
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error("Failed to create user");
    }

    console.log("Auth user created:", authData.user.id);

    // Step 2: Create profile with owner role
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .insert([
        {
          id: authData.user.id,
          email: "admin@admin.com",
          full_name: "System Administrator",
          user_role: "owner",
        },
      ])
      .select()
      .single();

    if (profileError) {
      console.error("Error creating profile:", profileError);
      throw profileError;
    }

    console.log("Profile created:", profileData);
    
    return {
      success: true,
      message: "Admin account created successfully!",
      user: authData.user,
      profile: profileData,
    };
  } catch (error) {
    console.error("Failed to create admin account:", error);
    return {
      success: false,
      message: error.message || "Failed to create admin account",
      error,
    };
  }
};

// If running this file directly in development
if (typeof window !== "undefined" && window.location.hostname === "localhost") {
  // Expose function to window for manual execution in browser console
  (window as any).createInitialAdmin = createInitialAdmin;
  console.log("Admin setup function available. Run 'createInitialAdmin()' in console to create admin account.");
}
