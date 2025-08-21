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
  email?: string;
  full_name?: string;
  phone?: string;
  user_role: 'owner' | 'manager' | 'space_manager' | 'teacher' | 'read_only';
  teacher_id?: string;
};

export type UpdateUserData = {
  full_name?: string;
  phone?: string;
  email?: string;
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
    console.log('Creating user directly in database:', userData);

    // Generate a unique ID for the user
    const userId = crypto.randomUUID();
    
    // Create user profile directly in profiles table
    const profileData = {
      id: userId,
      email: userData.email || null,
      full_name: userData.full_name || null,
      phone: userData.phone || null,
      user_role: userData.user_role,
      username: userData.username,
      teacher_id: userData.user_role === 'teacher' ? userData.teacher_id : null,
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      throw new Error(profileError.message || 'Failed to create user profile');
    }

    console.log('User created successfully:', profile);
    
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
    console.error('Create user error:', error);
    throw new Error(error.message || 'Failed to create user');
  }
};

export const updateUser = async (userId: string, userData: UpdateUserData): Promise<UserProfile> => {
  try {
    console.log('Updating user directly in database:', { userId, userData });

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (userData.full_name !== undefined) updateData.full_name = userData.full_name;
    if (userData.phone !== undefined) updateData.phone = userData.phone;
    if (userData.email !== undefined) updateData.email = userData.email;
    if (userData.user_role !== undefined) updateData.user_role = userData.user_role;
    if ((userData as any).teacher_id !== undefined) updateData.teacher_id = (userData as any).teacher_id;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (profileError) {
      console.error('Profile update error:', profileError);
      throw new Error(profileError.message || 'Failed to update user profile');
    }

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
