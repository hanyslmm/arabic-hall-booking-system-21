import { supabase } from "@/integrations/supabase/client";

export const setupAdminAccount = async () => {
  try {
    console.log("Starting admin account setup...");

    // Step 1: Try to sign in first to check if account exists
    const { data: existingUser, error: signInError } = await supabase.auth.signInWithPassword({
      email: "admin@example.com",
      password: "admin123"
    });

    if (existingUser.user && !signInError) {
      console.log("Admin account already exists and works!");
      return { success: true, message: "Admin account already exists and is ready to use!" };
    }

    console.log("Admin account doesn't exist or can't login, creating new account...");

    // Step 2: Create the admin account using the admin API
    // We'll use a service role or admin privileges to create the user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: "admin@example.com",
      password: "admin123",
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        full_name: "System Administrator"
      }
    });

    if (createError) {
      console.error("Error creating user with admin API:", createError);
      
      // Fallback: Try regular signup with auto-confirm
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: "admin@example.com",
        password: "admin123",
        options: {
          data: {
            full_name: "System Administrator"
          }
        }
      });

      if (signupError) {
        throw new Error(`Failed to create admin account: ${signupError.message}`);
      }

      if (!signupData.user) {
        throw new Error("Failed to create admin user - no user returned");
      }

      console.log("User created via signup:", signupData.user.id);

      // Create profile for the new user
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: signupData.user.id,
          email: "admin@example.com",
          full_name: "System Administrator",
          user_role: "owner"
        });

      if (profileError && !profileError.message.includes("duplicate")) {
        console.error("Profile creation error:", profileError);
      }

      return { 
        success: true, 
        message: "Admin account created successfully! You can now login with admin/admin123" 
      };
    }

    // If admin.createUser worked
    if (newUser.user) {
      console.log("User created via admin API:", newUser.user.id);

      // Create profile for the new user
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: newUser.user.id,
          email: "admin@example.com",
          full_name: "System Administrator",
          user_role: "owner"
        });

      if (profileError && !profileError.message.includes("duplicate")) {
        console.error("Profile creation error:", profileError);
      }

      // Verify the account works by trying to sign in
      const { data: verifyLogin, error: verifyError } = await supabase.auth.signInWithPassword({
        email: "admin@example.com",
        password: "admin123"
      });

      if (verifyError) {
        console.error("Login verification failed:", verifyError);
        return { 
          success: false, 
          message: `Account created but login verification failed: ${verifyError.message}` 
        };
      }

      return { 
        success: true, 
        message: "Admin account created and verified successfully! You can now login with admin/admin123" 
      };
    }

    throw new Error("Unknown error occurred during account creation");

  } catch (error: any) {
    console.error("Setup admin error:", error);
    return { 
      success: false, 
      message: `Failed to create admin account: ${error.message}` 
    };
  }
};

// Check existing users for debugging
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

// Force create admin profile (if user exists in auth but no profile)
export const forceCreateAdminProfile = async () => {
  try {
    // Try to get current user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (user) {
      // Create profile for current user
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          email: user.email,
          full_name: "System Administrator",
          user_role: "owner"
        });

      if (profileError) {
        throw profileError;
      }

      return { success: true, message: "Admin profile created for existing user" };
    }

    return { success: false, message: "No authenticated user found" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};
