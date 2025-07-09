import { supabase } from "@/integrations/supabase/client";

export type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  user_role: 'owner' | 'manager' | 'space_manager';
  created_at: string;
};

export type CreateUserData = {
  email: string;
  password: string;
  full_name: string;
  user_role: 'owner' | 'manager' | 'space_manager';
};

export const getUsers = async (): Promise<UserProfile[]> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as UserProfile[];
};

export const createUser = async (userData: CreateUserData): Promise<UserProfile> => {
  // Create user with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    user_metadata: {
      full_name: userData.full_name,
      user_role: userData.user_role,
    },
  });

  if (authError) throw authError;

  // The profile should be created automatically via database trigger
  // Wait a moment and then fetch the profile
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (profileError) {
    // If profile doesn't exist, create it manually
    const { data: newProfile, error: createProfileError } = await supabase
      .from("profiles")
      .insert([{
        id: authData.user.id,
        email: userData.email,
        full_name: userData.full_name,
        user_role: userData.user_role,
      }])
      .select()
      .single();

    if (createProfileError) throw createProfileError;
    return newProfile as UserProfile;
  }

  return profile as UserProfile;
};

export const updateUserRole = async (userId: string, newRole: 'owner' | 'manager' | 'space_manager') => {
  const { data, error } = await supabase
    .from("profiles")
    .update({ user_role: newRole })
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data as UserProfile;
};

export const deleteUser = async (userId: string) => {
  // Delete from auth (this should cascade to profiles)
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  if (authError) throw authError;
  return userId;
};
