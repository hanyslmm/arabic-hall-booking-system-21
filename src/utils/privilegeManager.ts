import { supabase } from "@/integrations/supabase/client";

export async function upgradeUserToOwner(email: string) {
  try {
    console.log(`Upgrading user ${email} to owner...`);
    
    // Get current user session to work with authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Error getting current user:', authError);
      return { success: false, error: 'User not authenticated' };
    }

    console.log('Working with user:', user.id, 'email:', user.email);

    // Update or insert profile with owner role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: email,
        user_role: 'owner',
        full_name: email.split('@')[0], // Use email prefix as name if not set
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return { success: false, error: profileError.message };
    }

    console.log('Profile updated successfully:', profile);
    return { success: true, profile };

  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

export async function checkUserPrivileges(email: string) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return { success: false, error: error.message };
    }

    console.log(`User ${email} privileges:`, profile);
    return { success: true, profile };

  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

// Helper function to upgrade specific admin users
export async function upgradeAdminUsers() {
  const adminEmails = ['admin@admin.com', 'hanyslmm@gmail.com'];
  
  for (const email of adminEmails) {
    console.log(`\n=== Upgrading ${email} ===`);
    const result = await upgradeUserToOwner(email);
    
    if (result.success) {
      console.log(`✅ Successfully upgraded ${email} to owner`);
    } else {
      console.log(`❌ Failed to upgrade ${email}: ${result.error}`);
    }
  }
}
