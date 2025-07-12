import { supabase } from "@/integrations/supabase/client";

export type Teacher = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export const getTeachers = async (): Promise<Teacher[]> => {
  try {
    // Try to get teachers with the basic fields first
    const { data, error } = await supabase
      .from("teachers")
      .select("*")
      .order("name");
    
    if (error) {
      console.error("Error fetching teachers:", error);
      throw error;
    }

    return data as Teacher[];
  } catch (error) {
    console.error("Failed to fetch teachers:", error);
    throw error;
  }
};

export const addTeacher = async (teacher: Omit<Teacher, "id" | "created_by" | "created_at" | "updated_at" | "subjects" | "teacher_academic_stages">) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("غير مصرح");
  
  // Only include basic required fields that we know exist
  const teacherData: any = {
    name: teacher.name,
    created_by: user.user.id
  };
  
  const { data, error } = await supabase
    .from("teachers")
    .insert([teacherData])
    .select()
    .single();
  
  if (error) throw error;
  return data as Teacher;
};

export const updateTeacher = async (id: string, updates: Partial<Teacher>) => {
  // Only include basic fields that we know exist
  const updateData: any = {};
  
  if (updates.name !== undefined) {
    updateData.name = updates.name;
  }
  
  const { data, error } = await supabase
    .from("teachers")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Teacher;
};

export const deleteTeacher = async (id: string) => {
  const { error } = await (supabase as any).from("teachers").delete().eq("id", id);
  if (error) throw error;
  return id;
};
