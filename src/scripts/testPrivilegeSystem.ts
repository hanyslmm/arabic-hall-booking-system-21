import { 
  grantAdminPrivileges, 
  grantReadOnlyPrivileges, 
  getAllUsers, 
  upgradeAllExistingUsers,
  isCurrentUserAdmin
} from "@/utils/privilegeManager";

// Test script for the new privilege system
export async function testPrivilegeSystem() {
  console.log("🧪 Testing the new privilege system...");
  
  try {
    // Test 1: Check current user admin status
    console.log("\n1. Testing current user admin check...");
    const isAdmin = await isCurrentUserAdmin();
    console.log(`Current user is admin: ${isAdmin}`);
    
    // Test 2: Get all users
    console.log("\n2. Getting all users...");
    const users = await getAllUsers();
    console.log(`Found ${users.length} users:`, users.map(u => ({ email: u.email, role: u.user_role })));
    
    // Test 3: Grant admin privileges to specific users
    console.log("\n3. Testing admin privilege granting...");
    const adminEmails = ['admin@admin.com', 'hanyslmm@gmail.com'];
    
    for (const email of adminEmails) {
      console.log(`\nGranting admin privileges to ${email}...`);
      const result = await grantAdminPrivileges(email);
      console.log(`Result:`, result);
    }
    
    // Test 4: Create a read-only user (example)
    console.log("\n4. Testing read-only privilege granting...");
    const readOnlyEmail = 'readonly@example.com';
    const readOnlyResult = await grantReadOnlyPrivileges(readOnlyEmail);
    console.log(`Read-only result:`, readOnlyResult);
    
    // Test 5: Upgrade all existing users (if needed)
    console.log("\n5. Testing bulk upgrade...");
    const upgradeResults = await upgradeAllExistingUsers();
    console.log(`Upgrade results:`, upgradeResults);
    
    console.log("\n✅ Privilege system testing completed!");
    
  } catch (error) {
    console.error("❌ Error testing privilege system:", error);
  }
}

// Run the test if this file is executed directly
if (import.meta.hot) {
  testPrivilegeSystem();
}
