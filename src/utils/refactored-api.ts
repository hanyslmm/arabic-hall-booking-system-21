// Refactored API utilities with specific implementations
import { supabase } from "@/integrations/supabase/client";
import { Teacher, Hall, Subject, AcademicStage, Booking } from "@/types";

// Teachers API
export const teachersApi = {
  async getAll(): Promise<Teacher[]> {
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
    
    if (error) throw error;
    return data as Teacher[];
  },

  async create(teacherData: { name: string; mobile_phone?: string; subject_id?: string }) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("غير مصرح");
    
    const { data, error } = await supabase
      .from("teachers")
      .insert([{ ...teacherData, created_by: user.user.id }])
      .select()
      .single();
    
    if (error) throw error;
    return data as Teacher;
  },

  async update(id: string, updates: Partial<{ name: string; mobile_phone: string; subject_id: string }>) {
    const { data, error } = await supabase
      .from("teachers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Teacher;
  },

  async delete(id: string) {
    const { error } = await supabase.from("teachers").delete().eq("id", id);
    if (error) throw error;
    return id;
  }
};

// Halls API
export const hallsApi = {
  async getAll(): Promise<Hall[]> {
    const { data, error } = await supabase.from("halls").select("*").order("name");
    if (error) throw error;
    return data as Hall[];
  },

  async create(hallData: { name: string; capacity: number }) {
    const { data, error } = await supabase
      .from("halls")
      .insert([hallData])
      .select()
      .single();
    
    if (error) throw error;
    return data as Hall;
  },

  async update(id: string, updates: Partial<{ name: string; capacity: number }>) {
    const { data, error } = await supabase
      .from("halls")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Hall;
  },

  async delete(id: string) {
    const { error } = await supabase.from("halls").delete().eq("id", id);
    if (error) throw error;
    return id;
  }
};

// Subjects API
export const subjectsApi = {
  async getAll(): Promise<Subject[]> {
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .order("name");

    if (error) throw error;
    return data as Subject[];
  },

  async create(subjectData: { name: string }) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("غير مصرح");

    const { data, error } = await supabase
      .from("subjects")
      .insert([{ ...subjectData, created_by: user.user.id }])
      .select()
      .single();
    
    if (error) throw error;
    return data as Subject;
  },

  async update(id: string, updates: { name?: string }) {
    const { data, error } = await supabase
      .from("subjects")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Subject;
  },

  async delete(id: string) {
    const { error } = await supabase.from("subjects").delete().eq("id", id);
    if (error) throw error;
    return id;
  }
};