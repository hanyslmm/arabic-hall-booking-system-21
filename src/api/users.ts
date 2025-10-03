import { supabase } from "@/integrations/supabase/client";

export type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  user_role: 'owner' | 'manager' | 'space_manager' | 'teacher' | 'read_only';
created_at: string;
username?: string | null;
teacher_id?: string | null;
};

export type CreateUserData = {
  username: string;
  password: string;
  email?: string | null;
  full_name?: string;
  phone?: string | null;
  user_role: 'owner' | 'manager' | 'space_manager' | 'teacher' | 'read_only';
  teacher_id?: string;
};

export type UpdateUserData = {
  full_name?: string;
  phone?: string | null;
  email?: string | null;
  user_role?: 'owner' | 'manager' | 'space_manager' | 'teacher' | 'read_only';
  password?: string;
};

export const getUsers = async (): Promise<UserProfile[]> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
// Map profiles to UserProfile type - profiles table doesn't have phone field
return data.map((profile: any) => ({
  ...profile,
  phone: null
})) as UserProfile[];
};

export const createUser = async (userData: CreateUserData): Promise<UserProfile> => {
  try {
    console.log('Creating user via Edge Function (create-user):', userData);

    // Determine an email to use for auth: provided email or username@admin.com
    const effectiveEmail = (userData.email && userData.email.trim().length > 0)
      ? userData.email
      : `${userData.username}@admin.com`;

    // Always use Edge Function for proper email confirmation
    const { data, error } = await (supabase as any).functions.invoke('create-user', {
      body: {
        email: effectiveEmail,
        password: userData.password,
        full_name: userData.full_name,
        phone: userData.phone,
        user_role: userData.user_role,
        username: userData.username,
        teacher_id: userData.user_role === 'teacher' ? (userData.teacher_id ?? null) : null
      }
    });

    if (error) {
      console.error('Edge Function create-user failed:', error);
      throw new Error(error.message || 'Failed to create user');
    }

    if (!data?.profile) {
      throw new Error('No profile data returned from edge function');
    }

    const profileData = data.profile;
    console.log('User created successfully with confirmed email:', profileData);
    
    return {
      id: profileData.id,
      email: profileData.email,
      full_name: profileData.full_name,
      phone: profileData.phone ?? null,
      user_role: profileData.user_role,
      created_at: profileData.created_at,
      username: profileData.username ?? userData.username,
      teacher_id: profileData.teacher_id ?? null,
    } as UserProfile;

  } catch (error: any) {
    console.error('Create user error:', error);
    throw new Error(error.message || 'Failed to create user');
  }
};

export const updateUser = async (userId: string, userData: UpdateUserData): Promise<UserProfile> => {
  try {
    console.log('Updating user via Edge Function (update-user):', { userId, userData });

    // Use edge function to update user (handles auth password updates properly)
    const { data, error } = await (supabase as any).functions.invoke('update-user', {
      body: {
        user_id: userId,
        email: userData.email || undefined,
        password: userData.password || undefined,
        full_name: userData.full_name,
        phone: userData.phone,
        user_role: userData.user_role,
        teacher_id: (userData as any).teacher_id,
        confirm_email: true,
      }
    });

    if (error) {
      console.error('Edge Function update-user failed:', error);
      throw new Error(error.message || 'Failed to update user');
    }

    if (!data?.profile) {
      throw new Error('No profile data returned from edge function');
    }

    const profile = data.profile;
    console.log('User updated successfully:', profile);
    
    return {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      phone: profile.phone,
      user_role: profile.user_role,
      created_at: profile.created_at,
      username: profile.username,
      teacher_id: profile.teacher_id
    } as UserProfile;
    
  } catch (error: any) {
    console.error('Update user error:', error);
    throw new Error(error.message || 'Failed to update user');
  }
};

export const updateUserRole = async (userId: string, newRole: 'owner' | 'manager' | 'space_manager' | 'teacher' | 'read_only') => {
  try {
    console.log('Updating user role directly in database:', { userId, newRole });

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({ 
        user_role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (profileError) {
      console.error('Role update error:', profileError);
      throw new Error(profileError.message || 'Failed to update user role');
    }

    console.log('User role updated successfully:', profile);
    
    return {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      phone: profile.phone,
      user_role: profile.user_role,
      created_at: profile.created_at,
      username: profile.username,
      teacher_id: profile.teacher_id
    } as UserProfile;
    
  } catch (error: any) {
    console.error('Update user role error:', error);
    throw new Error(error.message || 'Failed to update user role');
  }
};

export const deleteUser = async (userId: string) => {
  try {
    console.log('Deleting user directly from database:', userId);

    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Profile deletion error:', profileError);
      throw new Error(profileError.message || 'Failed to delete user profile');
    }

    console.log('User deleted successfully:', userId);
    return userId;
    
  } catch (error: any) {
    console.error('Delete user error:', error);
    throw new Error(error.message || 'Failed to delete user');
  }
};
