import { supabase } from "@/integrations/supabase/client";

export interface Subject {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// Fallback subjects data in case the database table doesn't exist yet
const fallbackSubjects: Subject[] = [
  { id: "1", name: "الرياضيات", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: "system" },
  { id: "2", name: "العلوم", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: "system" },
  { id: "3", name: "الفيزياء", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: "system" },
  { id: "4", name: "الكيمياء", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: "system" },
  { id: "5", name: "الأحياء", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: "system" },
  { id: "6", name: "اللغة العربية", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: "system" },
  { id: "7", name: "اللغة الإنجليزية", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: "system" },
  { id: "8", name: "التاريخ", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: "system" },
  { id: "9", name: "الجغرافيا", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: "system" },
  { id: "10", name: "التربية الإسلامية", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: "system" },
  { id: "11", name: "الحاسوب", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: "system" },
  { id: "12", name: "التربية الفنية", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: "system" },
];

export const getSubjects = async (): Promise<Subject[]> => {
  try {
    const { data, error } = await (supabase as any)
      .from("subjects")
      .select("*")
      .order("name");

    if (error) {
      console.warn("Subjects table not found, using fallback data:", error);
      return fallbackSubjects;
    }

    return data as Subject[];
  } catch (error) {
    console.warn("Error fetching subjects, using fallback data:", error);
    return fallbackSubjects;
  }
};

export const addSubject = async (subject: { name: string }) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("غير مصرح");

    const { data, error } = await (supabase as any)
      .from("subjects")
      .insert([{ ...subject, created_by: user.user.id }])
      .select()
      .single();
    
    if (error) {
      console.warn("Cannot add subject - table may not exist:", error);
      throw new Error("لا يمكن إضافة المادة في الوقت الحالي");
    }
    
    return data as Subject;
  } catch (error) {
    console.warn("Error adding subject:", error);
    throw new Error("لا يمكن إضافة المادة في الوقت الحالي");
  }
};

export const updateSubject = async (id: string, updates: { name?: string }) => {
  try {
    const { data, error } = await (supabase as any)
      .from("subjects")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      console.warn("Cannot update subject - table may not exist:", error);
      throw new Error("لا يمكن تحديث المادة في الوقت الحالي");
    }
    
    return data as Subject;
  } catch (error) {
    console.warn("Error updating subject:", error);
    throw new Error("لا يمكن تحديث المادة في الوقت الحالي");
  }
};

export const deleteSubject = async (id: string) => {
  try {
    const { error } = await (supabase as any).from("subjects").delete().eq("id", id);
    
    if (error) {
      console.warn("Cannot delete subject - table may not exist:", error);
      throw new Error("لا يمكن حذف المادة في الوقت الحالي");
    }
    
    return id;
  } catch (error) {
    console.warn("Error deleting subject:", error);
    throw new Error("لا يمكن حذف المادة في الوقت الحالي");
  }
};
