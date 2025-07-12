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
  const { data, error } = await supabase
    .from("teachers")
    .select(`
      *,
      subjects:subject_id(name),
      teacher_academic_stages(
        academic_stages(name)
      )
    `)
    .order("name");
  
  if (error) {
    console.error("Error fetching teachers:", error);
    throw error;
  }

  return data as any[];
};

export const addTeacher = async (teacher: Omit<Teacher, "id" | "created_by" | "created_at" | "updated_at" | "subjects" | "teacher_academic_stages">) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("غير مصرح");
  
  const teacherData: any = {
    name: teacher.name,
    created_by: user.user.id,
    mobile_phone: teacher.mobile_phone || null,
    subject_id: teacher.subject_id || null,
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
  const updateData: any = {};
  
  if (updates.name !== undefined) {
    updateData.name = updates.name;
  }
  if (updates.mobile_phone !== undefined) {
    updateData.mobile_phone = updates.mobile_phone;
  }
  if (updates.subject_id !== undefined) {
    updateData.subject_id = updates.subject_id;
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

export const addTeacherAcademicStages = async (teacherId: string, stageIds: string[]) => {
  if (stageIds.length === 0) return;
  
  const academicStagePromises = stageIds.map(async (stageId) => {
    return supabase
      .from('teacher_academic_stages')
      .insert({ teacher_id: teacherId, academic_stage_id: stageId });
  });
  await Promise.all(academicStagePromises);
};

export const updateTeacherAcademicStages = async (teacherId: string, stageIds: string[]) => {
  // First, remove existing stages
  await supabase
    .from('teacher_academic_stages')
    .delete()
    .eq('teacher_id', teacherId);
  
  // Then add new stages
  if (stageIds.length > 0) {
    await addTeacherAcademicStages(teacherId, stageIds);
  }
};
