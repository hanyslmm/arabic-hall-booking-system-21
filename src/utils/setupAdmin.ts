import { supabase } from "@/integrations/supabase/client";

export const setupAdminAccount = async () => {
  try {
    // Create admin user with email format required by Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: "admin@example.com", // This allows login with username "admin"
      password: "admin123",
      options: {
        data: {
          full_name: "System Administrator"
        }
      }
    });

    if (authError) {
      if (authError.message.includes("already registered")) {
        console.log("Admin account already exists");
        return { success: true, message: "Admin account already exists" };
      }
      throw authError;
    }

    if (!authData.user) {
      throw new Error("Failed to create admin user");
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

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Don't throw error if profile already exists
      if (!profileError.message.includes("duplicate")) {
        throw profileError;
      }
    }

    return { 
      success: true, 
      message: "Admin account created successfully! You can now login with username: admin and password: admin123" 
    };

  } catch (error: any) {
    console.error("Setup admin error:", error);
    return { 
      success: false, 
      message: error.message || "Failed to create admin account" 
    };
  }
};
