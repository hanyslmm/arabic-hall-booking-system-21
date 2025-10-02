import { supabase } from "@/integrations/supabase/client";

/**
 * Script to create the "hala" hall manager user
 */
export const createHalaUser = async () => {
  try {
    console.log("👤 Creating Hala user (Hall Manager)...");
    
    // Step 1: Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: "hala@admin.com",
      password: "hala123",
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error("Failed to create user");
    }

    console.log("✅ Auth user created:", authData.user.id);

    // Step 2: Create profile with space_manager role (Hall Manager)
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .insert([
        {
          id: authData.user.id,
          email: "hala@admin.com",
          full_name: "Hala",
          username: "hala",
          user_role: "space_manager", // Hall Manager role
        },
      ])
      .select()
      .single();

    if (profileError) {
      console.error("Error creating profile:", profileError);
      throw profileError;
    }

    console.log("✅ Profile created:", profileData);
    
    console.log("\n🎉 Hala user created successfully!");
    console.log("📧 Email: hala@admin.com");
    console.log("👤 Username: hala");
    console.log("🔑 Password: hala123");
    console.log("🏷️  Role: space_manager (Hall Manager)");
    
    console.log("\n🔐 Login Instructions:");
    console.log("1. Go to: http://localhost:8080/login");
    console.log("2. Username: hala");
    console.log("3. Password: hala123");
    console.log("4. OR use: hala@admin.com / hala123");
    
    return {
      success: true,
      message: "Hala user created successfully!",
      user: authData.user,
      profile: profileData,
    };
  } catch (error: any) {
    console.error("❌ Failed to create Hala user:", error);
    return {
      success: false,
      message: error.message || "Failed to create Hala user",
      error,
    };
  }
};

// Run the script if this file is executed directly
if (import.meta.hot) {
  createHalaUser();
}
