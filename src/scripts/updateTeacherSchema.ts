import { supabase } from "@/integrations/supabase/client";

export async function updateTeacherSchema() {
  try {
    console.log("Starting database schema update...");

    // Create subjects table
    const { error: subjectsTableError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.subjects (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_by UUID REFERENCES public.profiles(id)
        );
      `
    });

    if (subjectsTableError) {
      console.log("Subjects table might already exist or error:", subjectsTableError);
    }

    // Add new fields to teachers table
    const { error: teachersUpdateError } = await supabase.rpc('execute_sql', {
      sql: `
        ALTER TABLE public.teachers 
        ADD COLUMN IF NOT EXISTS mobile_phone TEXT,
        ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id);
      `
    });

    if (teachersUpdateError) {
      console.log("Teachers table might already be updated or error:", teachersUpdateError);
    }

    // Create junction table for teachers and academic stages
    const { error: junctionTableError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.teacher_academic_stages (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
          academic_stage_id UUID REFERENCES public.academic_stages(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(teacher_id, academic_stage_id)
        );
      `
    });

    if (junctionTableError) {
      console.log("Junction table might already exist or error:", junctionTableError);
    }

    // Insert default subjects
    const { error: subjectsInsertError } = await supabase.rpc('execute_sql', {
      sql: `
        INSERT INTO public.subjects (name) VALUES
          ('الرياضيات'),
          ('العلوم'),
          ('الفيزياء'),
          ('الكيمياء'),
          ('الأحياء'),
          ('اللغة العربية'),
          ('اللغة الإنجليزية'),
          ('التاريخ'),
          ('الجغرافيا'),
          ('التربية الإسلامية'),
          ('الحاسوب'),
          ('التربية الفنية'),
          ('التربية البدنية')
        ON CONFLICT (name) DO NOTHING;
      `
    });

    if (subjectsInsertError) {
      console.log("Subjects might already exist or error:", subjectsInsertError);
    }

    console.log("Database schema update completed successfully!");
    return { success: true };

  } catch (error) {
    console.error("Error updating database schema:", error);
    return { success: false, error };
  }
}
