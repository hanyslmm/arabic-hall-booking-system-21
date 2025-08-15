import { supabase } from "@/integrations/supabase/client";

export type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  user_role: 'owner' | 'manager' | 'space_manager' | 'teacher';
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
  user_role: 'owner' | 'manager' | 'space_manager' | 'teacher';
};

export type UpdateUserData = {
  full_name?: string;
  phone?: string;
  email?: string;
  user_role?: 'owner' | 'manager' | 'space_manager' | 'teacher';
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
  // Use Edge Function to create user with proper admin permissions
  const response = await supabase.functions.invoke('create-user', {
    body: {
      username: userData.username,
      password: userData.password,
      email: userData.email,
      full_name: userData.full_name,
      phone: userData.phone,
      user_role: userData.user_role,
      teacher_id: userData.user_role === 'teacher' ? userData.teacher_id : undefined,
    },
  });

  if (response.error) {
    console.error('Edge Function error:', response.error);
    throw new Error(response.error.message || 'Failed to create user');
  }

  if (!response.data?.success) {
    throw new Error(response.data?.error || 'Failed to create user');
  }

  return response.data.user as UserProfile;
};

export const updateUser = async (userId: string, userData: UpdateUserData): Promise<UserProfile> => {
  const body: any = {
    userId,
    full_name: userData.full_name,
    phone: userData.phone,
    email: userData.email,
    user_role: userData.user_role,
  };
  
  // Include teacher_id if provided
  if ((userData as any).teacher_id !== undefined) {
    body.teacher_id = (userData as any).teacher_id;
  }
  
  // Include password if provided and not empty
  if (userData.password && userData.password.trim() !== '') {
    body.password = userData.password;
  }

  const response = await supabase.functions.invoke('update-user', { body });
  
  if (response.error) {
    console.error('Edge Function error:', response.error);
    throw new Error(response.error.message || 'Failed to update user');
  }
  
  if (!response.data?.success) {
    throw new Error(response.data?.error || 'Failed to update user');
  }
  
  return response.data.user as UserProfile;
};

export const updateUserRole = async (userId: string, newRole: 'owner' | 'manager' | 'space_manager' | 'teacher') => {
  const response = await supabase.functions.invoke('update-user', {
    body: { userId, user_role: newRole }
  });
  if (response.error) throw response.error;
  return response.data.user as UserProfile;
};

export const deleteUser = async (userId: string) => {
  // Delete from auth (this should cascade to profiles)
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  if (authError) throw authError;
  return userId;
};
