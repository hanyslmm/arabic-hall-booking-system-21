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
  try {
    // Try to get teachers with related data first
    const { data: teachersWithRelations, error: relationsError } = await supabase
      .from("teachers")
      .select(`
        *,
        subjects:subject_id(name),
        teacher_academic_stages(
          academic_stages(name)
        )
      `)
      .order("name");
    
    if (!relationsError && teachersWithRelations) {
      return teachersWithRelations as any[];
    }
  } catch (e) {
    // If the above fails (missing tables/columns), fall back to basic query
    console.warn("Failed to fetch teachers with relations, falling back to basic query:", e);
  }
  
  // Fallback: just get basic teacher data
  const { data, error } = await supabase
    .from("teachers")
    .select("*")
    .order("name");
  
  if (error) {
    console.error("Error fetching teachers:", error);
    throw error;
  }

  return data as Teacher[];
};

export const addTeacher = async (teacher: Omit<Teacher, "id" | "created_by" | "created_at" | "updated_at" | "subjects" | "teacher_academic_stages">) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("غير مصرح");
  
  // Build teacher data, including optional fields if they exist in the schema
  const teacherData: any = {
    name: teacher.name,
    created_by: user.user.id
  };
  
  // Try to include new fields, but don't fail if they don't exist
  if (teacher.mobile_phone !== undefined) {
    teacherData.mobile_phone = teacher.mobile_phone;
  }
  if (teacher.subject_id !== undefined) {
    teacherData.subject_id = teacher.subject_id;
  }
  
  const { data, error } = await supabase
    .from("teachers")
    .insert([teacherData])
    .select()
    .single();
  
  if (error) throw error;
  return data as Teacher;
};

export const updateTeacher = async (id: string, updates: Partial<Teacher>) => {
  // Build update data, including optional fields if they exist in the schema
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
  try {
    const academicStagePromises = stageIds.map(async (stageId) => {
      return (supabase as any)
        .from('teacher_academic_stages')
        .insert({ teacher_id: teacherId, academic_stage_id: stageId });
    });
    await Promise.all(academicStagePromises);
  } catch (error) {
    console.warn("Failed to add teacher academic stages - table may not exist:", error);
    // Don't throw error, just log warning
  }
};

export const updateTeacherAcademicStages = async (teacherId: string, stageIds: string[]) => {
  try {
    // First, remove existing stages
    await (supabase as any)
      .from('teacher_academic_stages')
      .delete()
      .eq('teacher_id', teacherId);
    
    // Then add new stages
    if (stageIds.length > 0) {
      await addTeacherAcademicStages(teacherId, stageIds);
    }
  } catch (error) {
    console.warn("Failed to update teacher academic stages - table may not exist:", error);
    // Don't throw error, just log warning
  }
};
