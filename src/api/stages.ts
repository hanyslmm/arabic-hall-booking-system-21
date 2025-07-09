import { supabase } from "@/integrations/supabase/client";

export type Stage = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  // Add other fields as needed
};

export const getStages = async (): Promise<Stage[]> => {
  const { data, error } = await supabase.from("academic_stages").select("*").order("name");
  if (error) throw error;
  return data as Stage[];
};

export const addStage = async (stage: Omit<Stage, "id" | "created_by" | "created_at">) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("غير مصرح");
  const { data, error } = await supabase
    .from("academic_stages")
    .insert([{ ...stage, created_by: user.user.id }])
    .select()
    .single();
  if (error) throw error;
  return data as Stage;
};

export const updateStage = async (id: string, updates: Partial<Stage>) => {
  const { data, error } = await supabase
    .from("academic_stages")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Stage;
};

export const deleteStage = async (id: string) => {
  const { error } = await supabase.from("academic_stages").delete().eq("id", id);
  if (error) throw error;
  return id;
};
