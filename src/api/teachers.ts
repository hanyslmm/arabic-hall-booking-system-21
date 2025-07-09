import { supabase } from "@/integrations/supabase/client";

export type Teacher = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  // Add other fields as needed
};

export const getTeachers = async (): Promise<Teacher[]> => {
  const { data, error } = await supabase.from("teachers").select("*").order("name");
  if (error) throw error;
  return data as Teacher[];
};

export const addTeacher = async (teacher: Omit<Teacher, "id" | "created_by" | "created_at">) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("غير مصرح");
  const { data, error } = await supabase
    .from("teachers")
    .insert([{ ...teacher, created_by: user.user.id }])
    .select()
    .single();
  if (error) throw error;
  return data as Teacher;
};

export const updateTeacher = async (id: string, updates: Partial<Teacher>) => {
  const { data, error } = await supabase
    .from("teachers")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Teacher;
};

export const deleteTeacher = async (id: string) => {
  const { error } = await supabase.from("teachers").delete().eq("id", id);
  if (error) throw error;
  return id;
};
