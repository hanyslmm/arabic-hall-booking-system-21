import { supabase } from "@/integrations/supabase/client";

export type Hall = {
  id: string;
  name: string;
  capacity: number;
  operating_start_time?: string | null;
  operating_end_time?: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export const getHalls = async (): Promise<Hall[]> => {
  const { data, error } = await supabase.from("halls").select("*").order("name");
  if (error) throw error;
  return data as Hall[];
};

export const addHall = async (hall: Omit<Hall, "id" | "created_at" | "updated_at">) => {
  const { data, error } = await supabase
    .from("halls")
    .insert([hall])
    .select()
    .single();
  if (error) throw error;
  return data as Hall;
};

export const updateHall = async (id: string, updates: Partial<Hall>) => {
  const { data, error } = await supabase
    .from("halls")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Hall;
};

export const deleteHall = async (id: string) => {
  const { error } = await supabase.from("halls").delete().eq("id", id);
  if (error) throw error;
  return id;
};
