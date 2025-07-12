import { supabase } from "@/integrations/supabase/client";

export interface Subject {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export const getSubjects = async (): Promise<Subject[]> => {
  try {
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .order("name");
    if (error) {
      // If subjects table doesn't exist, return mock data
      console.warn("Subjects table not found, using mock data:", error);
      return [
        { id: "1", name: "الرياضيات", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: "" },
        { id: "2", name: "العلوم", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: "" },
        { id: "3", name: "اللغة العربية", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: "" },
        { id: "4", name: "اللغة الإنجليزية", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: "" },
        { id: "5", name: "التاريخ", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: "" },
      ];
    }
    return data as Subject[];
  } catch (e) {
    console.warn("Error fetching subjects, using mock data:", e);
    return [
      { id: "1", name: "الرياضيات", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: "" },
      { id: "2", name: "العلوم", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: "" },
      { id: "3", name: "اللغة العربية", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: "" },
      { id: "4", name: "اللغة الإنجليزية", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: "" },
      { id: "5", name: "التاريخ", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: "" },
    ];
  }
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
