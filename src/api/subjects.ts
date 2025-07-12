import { supabase } from "@/integrations/supabase/client";

export interface Subject {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export const getSubjects = async (): Promise<Subject[]> => {
  const { data, error } = await (supabase as any)
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

  const { data, error } = await (supabase as any)
    .from("subjects")
    .insert([{ ...subject, created_by: user.user.id }])
    .select()
    .single();
  if (error) throw error;
  return data as Subject;
};

export const updateSubject = async (id: string, updates: { name?: string }) => {
  const { data, error } = await (supabase as any)
    .from("subjects")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Subject;
};

export const deleteSubject = async (id: string) => {
  const { error } = await (supabase as any).from("subjects").delete().eq("id", id);
  if (error) throw error;
  return id;
};
