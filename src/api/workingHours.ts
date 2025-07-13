import { supabase } from "@/integrations/supabase/client";

export interface WorkingHour {
  id: string;
  hall_id: string;
  day_of_week: number; // 0=Sunday, 6=Saturday
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

export const getWorkingHours = async (hallId?: string): Promise<WorkingHour[]> => {
  let query = supabase.from("working_hours").select("*");
  
  if (hallId) {
    query = query.eq("hall_id", hallId);
  }
  
  const { data, error } = await query.order("day_of_week").order("start_time");
  
  if (error) {
    console.error("Error fetching working hours:", error);
    throw error;
  }

  return data as WorkingHour[];
};

export const addWorkingHour = async (workingHour: Omit<WorkingHour, "id" | "created_at" | "updated_at">) => {
  const { data, error } = await supabase
    .from("working_hours")
    .insert([workingHour])
    .select()
    .single();
  
  if (error) throw error;
  return data as WorkingHour;
};

export const updateWorkingHour = async (id: string, updates: Partial<WorkingHour>) => {
  const { data, error } = await supabase
    .from("working_hours")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  
  if (error) throw error;
  return data as WorkingHour;
};

export const deleteWorkingHour = async (id: string) => {
  const { error } = await supabase.from("working_hours").delete().eq("id", id);
  if (error) throw error;
  return id;
};

export const getDayName = (dayOfWeek: number): string => {
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[dayOfWeek] || '';
};