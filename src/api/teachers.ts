import { supabase } from "@/integrations/supabase/client";
import { Teacher, TeacherFormData } from "@/types";

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

  return data as Teacher[];
};

export const addTeacher = async (teacherData: TeacherFormData) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("غير مصرح");
  
  const { data, error } = await supabase
    .from("teachers")
    .insert([{ 
      name: teacherData.name,
      teacher_code: teacherData.teacher_code || null,
      mobile_phone: teacherData.mobile_phone || null,
      subject_id: teacherData.subject_id || null,
      created_by: user.user.id 
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data as Teacher;
};

export const updateTeacher = async (id: string, updates: Partial<TeacherFormData & { default_class_fee: number }>) => {
  const updateData: any = {};
  
  if (updates.name !== undefined) updateData.name = updates.name;
  if ((updates as any).teacher_code !== undefined) updateData.teacher_code = (updates as any).teacher_code;
  if (updates.mobile_phone !== undefined) updateData.mobile_phone = updates.mobile_phone;
  if (updates.subject_id !== undefined) updateData.subject_id = updates.subject_id;
  if ((updates as any).default_class_fee !== undefined) updateData.default_class_fee = (updates as any).default_class_fee;
  
  const { data, error } = await supabase
    .from("teachers")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Teacher;
};

export const applyTeacherDefaultFee = async (teacherId: string, fee: number) => {
  // Simple implementation without RPC function
  const { error } = await supabase
    .from('teachers')
    .update({ default_class_fee: fee })
    .eq('id', teacherId);
  
  if (error) throw error;
};

export const deleteTeacher = async (id: string) => {
  const { error } = await supabase.from("teachers").delete().eq("id", id);
  if (error) throw error;
  return id;
};

export const addTeacherAcademicStages = async (teacherId: string, stageIds: string[]) => {
  if (stageIds.length === 0) return;
  
  const stageData = stageIds.map(stageId => ({
    teacher_id: teacherId,
    academic_stage_id: stageId
  }));
  
  const { error } = await supabase
    .from('teacher_academic_stages')
    .insert(stageData);
    
  if (error) throw error;
};

export const updateTeacherAcademicStages = async (teacherId: string, stageIds: string[]) => {
  // First delete existing associations
  await supabase
    .from('teacher_academic_stages')
    .delete()
    .eq('teacher_id', teacherId);
    
  // Then add new associations
  if (stageIds.length > 0) {
    await addTeacherAcademicStages(teacherId, stageIds);
  }
};
