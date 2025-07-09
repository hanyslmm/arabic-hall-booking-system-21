import { supabase } from "@/integrations/supabase/client";

export type User = {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  created_at: string;
  // Add other fields as needed
};

export const getUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from("users").select("*").order("full_name");
  if (error) throw error;
  return data as User[];
};

export const addUser = async (user: Omit<User, "id" | "created_at">) => {
  const { data, error } = await supabase
    .from("users")
    .insert([user])
    .select()
    .single();
  if (error) throw error;
  return data as User;
};

export const updateUser = async (id: string, updates: Partial<User>) => {
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as User;
};

export const deleteUser = async (id: string) => {
  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) throw error;
  return id;
};
