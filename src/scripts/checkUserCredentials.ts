import { supabase } from "@/integrations/supabase/client";

/**
 * Script to check existing users and help with login credentials
 */
export const checkUserCredentials = async () => {
  try {
    console.log("🔍 Checking existing users in the system...");
    
    // Get all profiles from the database
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return;
    }
    
    console.log(`\n📋 Found ${profiles?.length || 0} users in the system:`);
    console.log("=" * 80);
    
    profiles?.forEach((profile, index) => {
      console.log(`\n${index + 1}. User Profile:`);
      console.log(`   📧 Email: ${profile.email}`);
      console.log(`   👤 Full Name: ${profile.full_name || 'Not set'}`);
      console.log(`   🏷️  Username: ${profile.username || 'Not set'}`);
      console.log(`   🔑 Role: ${profile.user_role || 'Not set'}`);
      console.log(`   📅 Created: ${new Date(profile.created_at).toLocaleDateString()}`);
      console.log(`   🆔 ID: ${profile.id}`);
    });
    
    // Look specifically for "hala" user
    console.log("\n🔍 Searching for 'hala' user specifically...");
    const halaUsers = profiles?.filter(profile => 
      profile.full_name?.toLowerCase().includes('hala') ||
      profile.email?.toLowerCase().includes('hala') ||
      profile.username?.toLowerCase().includes('hala')
    );
    
    if (halaUsers && halaUsers.length > 0) {
      console.log(`\n✅ Found ${halaUsers.length} user(s) matching 'hala':`);
      halaUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. Hala User Details:`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👤 Full Name: ${user.full_name || 'Not set'}`);
        console.log(`   🏷️  Username: ${user.username || 'Not set'}`);
        console.log(`   🔑 Role: ${user.user_role || 'Not set'}`);
        
        // Provide login instructions
        console.log(`\n   🔐 LOGIN INSTRUCTIONS:`);
        console.log(`   Username: ${user.email}`);
        console.log(`   OR try: ${user.username || user.email.split('@')[0]}`);
        console.log(`   Password: [The password you set: hala123]`);
      });
    } else {
      console.log("\n❌ No user found matching 'hala'");
      console.log("\n💡 Possible solutions:");
      console.log("1. Check if the user was created with a different name");
      console.log("2. Create a new user with username 'hala'");
      console.log("3. Check the exact spelling in the database");
    }
    
    // Show all space_manager users (hall managers)
    console.log("\n🏢 Hall Managers (space_manager role):");
    const hallManagers = profiles?.filter(profile => profile.user_role === 'space_manager');
    if (hallManagers && hallManagers.length > 0) {
      hallManagers.forEach((manager, index) => {
        console.log(`\n${index + 1}. Hall Manager:`);
        console.log(`   📧 Email: ${manager.email}`);
        console.log(`   👤 Full Name: ${manager.full_name || 'Not set'}`);
        console.log(`   🏷️  Username: ${manager.username || 'Not set'}`);
        console.log(`   🔐 Login: ${manager.email} or ${manager.username || manager.email.split('@')[0]}`);
      });
    } else {
      console.log("   No hall managers found");
    }
    
    // Show all manager users (general managers)
    console.log("\n👔 General Managers (manager role):");
    const generalManagers = profiles?.filter(profile => profile.user_role === 'manager');
    if (generalManagers && generalManagers.length > 0) {
      generalManagers.forEach((manager, index) => {
        console.log(`\n${index + 1}. General Manager:`);
        console.log(`   📧 Email: ${manager.email}`);
        console.log(`   👤 Full Name: ${manager.full_name || 'Not set'}`);
        console.log(`   🏷️  Username: ${manager.username || 'Not set'}`);
        console.log(`   🔐 Login: ${manager.email} or ${manager.username || manager.email.split('@')[0]}`);
      });
    } else {
      console.log("   No general managers found");
    }
    
    console.log("\n" + "=" * 80);
    console.log("✅ User check completed!");
    
  } catch (error) {
    console.error("❌ Error checking users:", error);
  }
};

// Run the check if this file is executed directly
if (import.meta.hot) {
  checkUserCredentials();
}
