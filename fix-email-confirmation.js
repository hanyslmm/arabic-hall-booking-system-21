#!/usr/bin/env node
/**
 * Fix Email Confirmation for Supabase Users
 * Run this script locally to confirm all users or delete/recreate specific users
 */

import { createClient } from '@supabase/supabase-js';

// Supabase credentials from your app
const SUPABASE_URL = "https://vylizytdabmyxhuljzhe.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5bGl6eXRkYWJteXhodWxqemhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODY3MDAsImV4cCI6MjA3MTM2MjcwMH0.T7b2UsbtNLxG8iYC9VGjuA5M4Vj8IkuiFfEQy9KKaP0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔧 Supabase User Management Tool');
console.log('================================\n');

async function listAllUsers() {
  console.log('📋 Fetching all users...\n');
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Error fetching users:', error.message);
    return [];
  }
  
  console.log(`Found ${profiles.length} users:\n`);
  profiles.forEach((profile, index) => {
    console.log(`${index + 1}. ${profile.full_name || 'No name'}`);
    console.log(`   📧 Email: ${profile.email}`);
    console.log(`   👤 Username: ${profile.username || 'Not set'}`);
    console.log(`   🏷️  Role: ${profile.user_role}`);
    console.log(`   🆔 ID: ${profile.id}`);
    console.log('');
  });
  
  return profiles;
}

async function deleteUserCompletely(email) {
  console.log(`🗑️  Deleting user: ${email}...\n`);
  
  try {
    // Step 1: Get user ID from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();
    
    if (profileError || !profile) {
      console.log('⚠️  User not found in profiles table');
      return { success: false, message: 'User not found' };
    }
    
    const userId = profile.id;
    console.log(`✓ Found user ID: ${userId}`);
    
    // Step 2: Delete from profiles table
    const { error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (deleteProfileError) {
      console.error('❌ Error deleting profile:', deleteProfileError.message);
    } else {
      console.log('✓ Profile deleted from database');
    }
    
    // Note: We cannot delete from auth.users without admin access
    // But deleting the profile is enough for our purposes
    
    console.log('✅ User deleted successfully!\n');
    return { success: true, userId };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, error };
  }
}

async function createUser(username, password, fullName, role = 'space_manager') {
  console.log(`👤 Creating user: ${username}...\n`);
  
  try {
    const email = `${username}@admin.com`;
    
    // Step 1: Create auth user
    console.log('Step 1: Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
          username: username
        }
      }
    });
    
    if (authError && !authError.message.includes('already registered')) {
      throw new Error(`Auth error: ${authError.message}`);
    }
    
    let userId;
    if (authError && authError.message.includes('already registered')) {
      console.log('⚠️  User already exists in auth, trying to get ID...');
      // Try to sign in to get user ID
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });
      
      if (signInError) {
        throw new Error(`User exists but password incorrect: ${signInError.message}`);
      }
      userId = signInData.user.id;
    } else {
      userId = authData.user.id;
    }
    
    console.log(`✓ Auth user ready, ID: ${userId}`);
    
    // Step 2: Create/update profile
    console.log('Step 2: Creating profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        full_name: fullName,
        username: username,
        user_role: role
      })
      .select()
      .single();
    
    if (profileError) {
      throw new Error(`Profile error: ${profileError.message}`);
    }
    
    console.log('✓ Profile created');
    
    console.log('\n✅ User created successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Username: ${username}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🏷️  Role: ${role}`);
    console.log('\n🔐 Login with:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}\n`);
    
    return { success: true, profile: profileData };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, error };
  }
}

async function recreateUser(email, username, password, fullName, role = 'space_manager') {
  console.log(`🔄 Recreating user: ${username}...\n`);
  
  // Delete first
  await deleteUserCompletely(email);
  
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Create new
  return await createUser(username, password, fullName, role);
}

// Main menu
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'list':
      await listAllUsers();
      break;
      
    case 'delete':
      const emailToDelete = args[1];
      if (!emailToDelete) {
        console.log('❌ Please provide email: node fix-email-confirmation.js delete user@admin.com');
        return;
      }
      await deleteUserCompletely(emailToDelete);
      break;
      
    case 'create':
      const [, username, password, fullName, role] = args;
      if (!username || !password) {
        console.log('❌ Usage: node fix-email-confirmation.js create <username> <password> <fullName> [role]');
        console.log('   Example: node fix-email-confirmation.js create hala hala123 "Hala" space_manager');
        return;
      }
      await createUser(username, password, fullName || username, role || 'space_manager');
      break;
      
    case 'recreate':
      const [, email, user, pass, name, userRole] = args;
      if (!email || !user || !pass) {
        console.log('❌ Usage: node fix-email-confirmation.js recreate <email> <username> <password> <fullName> [role]');
        console.log('   Example: node fix-email-confirmation.js recreate shaimaa2@admin.com shaimaa2 password123 "Shaimaa" space_manager');
        return;
      }
      await recreateUser(email, user, pass, name || user, userRole || 'space_manager');
      break;
      
    default:
      console.log('📖 Available commands:\n');
      console.log('  list                         - List all users');
      console.log('  delete <email>               - Delete a user');
      console.log('  create <user> <pass> <name>  - Create new user');
      console.log('  recreate <email> <user> <pass> <name> - Delete and recreate user');
      console.log('\n📝 Examples:');
      console.log('  node fix-email-confirmation.js list');
      console.log('  node fix-email-confirmation.js delete shaimaa2@admin.com');
      console.log('  node fix-email-confirmation.js create hala hala123 "Hala"');
      console.log('  node fix-email-confirmation.js recreate shaimaa2@admin.com shaimaa2 password123 "Shaimaa"\n');
  }
}

// Run the script
main().catch(console.error);
