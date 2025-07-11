import { supabase } from "@/integrations/supabase/client";

export const checkUserPrivileges = async (email: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, user_role, role')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error checking user privileges:', error);
    return null;
  }
};

export const upgradeUserToAdmin = async (email: string) => {
  try {
    // First, get the user by email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single();

    if (userError) {
      throw new Error(`User not found: ${userError.message}`);
    }

    // Update the user to have admin privileges
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        user_role: 'owner',
        role: 'ADMIN',
        full_name: email === 'admin@admin.com' ? 'System Administrator' : 
                   email === 'anyslmm@gmail.com' ? 'Hany Salem' : 
                   'Administrator'
      })
      .eq('id', userData.id);

    if (updateError) {
      throw new Error(`Failed to update user: ${updateError.message}`);
    }

    return {
      success: true,
      message: `User ${email} has been upgraded to admin with owner privileges.`,
      userId: userData.id
    };
  } catch (error) {
    console.error('Error upgrading user:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      userId: null
    };
  }
};

export const upgradeMultipleUsers = async (emails: string[]) => {
  const results = [];
  
  for (const email of emails) {
    const result = await upgradeUserToAdmin(email);
    results.push({ email, ...result });
  }
  
  return results;
};
