import { supabase } from "@/integrations/supabase/client";

export type Teacher = {
  id: string;
  name: string;
  mobile_phone?: string | null;
  subject_id?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Relations
  subjects?: { name: string } | null;
  teacher_academic_stages?: Array<{
    academic_stages: { name: string };
  }>;
};

export const getTeachers = async (): Promise<Teacher[]> => {
  // For now, just get basic teacher data since the migration hasn't been applied yet
  const { data, error } = await supabase
    .from("teachers")
    .select("*")
    .order("name");
  if (error) throw error;
  return data as Teacher[];
};

export const addTeacher = async (teacher: Omit<Teacher, "id" | "created_by" | "created_at" | "updated_at" | "subjects" | "teacher_academic_stages">) => {
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
