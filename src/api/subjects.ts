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
  const { data, error } = await supabase
    .from("subjects")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching subjects:", error);
    throw error;
  }

  return data as Subject[];
};

export const addSubject = async (subject: { name: string }) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("غير مصرح");

  const { data, error } = await supabase
    .from("subjects")
    .insert([{ ...subject, created_by: user.user.id }])
    .select()
    .single();
  
  if (error) throw error;
  return data as Subject;
};

export const updateSubject = async (id: string, updates: { name?: string }) => {
  const { data, error } = await supabase
    .from("subjects")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Subject;
};

export const deleteSubject = async (id: string) => {
  const { error } = await supabase.from("subjects").delete().eq("id", id);
  if (error) throw error;
  return id;
};
