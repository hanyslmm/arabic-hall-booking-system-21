import { supabase } from "@/integrations/supabase/client";
import { Teacher, TeacherFormData } from "@/types";

export const getTeachers = async (): Promise<Teacher[]> => {
  const { data, error } = await supabase
    .from("teachers")
    .select(`
      *,
      subjects:teacher_subjects(subjects(name, id))
    `)
    .order("name");
  
  if (error) {
    console.error("Error fetching teachers:", error);
    throw error;
  }

  return data as Teacher[];
};

export const addTeacher = async (teacherData: TeacherFormData & { teacher_code: string }) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("غير مصرح");
  
  const { data, error } = await supabase
    .from("teachers")
    .insert([{ 
      name: teacherData.name,
      teacher_code: teacherData.teacher_code,
      mobile_phone: teacherData.mobile_phone || null,
      created_by: user.user.id 
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data as Teacher;
};

export const updateTeacher = async (id: string, updates: Partial<TeacherFormData & { default_class_fee: number; teacher_code: string }>) => {
  const updateData: any = {};
  
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.teacher_code !== undefined) updateData.teacher_code = updates.teacher_code;
  if (updates.mobile_phone !== undefined) updateData.mobile_phone = updates.mobile_phone;
  if ((updates as any).default_class_fee !== undefined) updateData.default_class_fee = (updates as any).default_class_fee;
  
  // If no fields to update, short-circuit and return a minimal object
  if (Object.keys(updateData).length === 0) {
    return { id } as unknown as Teacher;
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

export const setTeacherSubjects = async (teacherId: string, subjectIds: string[]) => {
  try {
    console.log('setTeacherSubjects called with:', { teacherId, subjectIds });
    
    // Delete existing links first
    const { error: delErr } = await supabase
      .from('teacher_subjects')
      .delete()
      .eq('teacher_id', teacherId);
    
    if (delErr) {
      console.error('Error deleting teacher subjects:', delErr);
      throw delErr;
    }
    console.log('Deleted existing teacher subjects');

    if (subjectIds.length === 0) {
      console.log('No subjects to insert, returning');
      return;
    }

    const insertData = subjectIds.map((sid) => ({ teacher_id: teacherId, subject_id: sid }));
    console.log('Inserting teacher subjects:', insertData);
    
    const { error: insErr } = await supabase
      .from('teacher_subjects')
      .insert(insertData);
    
    if (insErr) {
      console.error('Error inserting teacher subjects:', insErr);
      throw insErr;
    }
    console.log('Teacher subjects inserted successfully');
  } catch (err: any) {
    const message = String(err?.message || err);
    const code = err?.code || '';
    console.error('setTeacherSubjects error:', err);
    
    // Soft-fail ONLY when the table is missing; for permission errors, surface to the user
    // PGRST205/42P01 = table not found
    if (
      message.includes('relation "teacher_subjects" does not exist') ||
      code === 'PGRST205' ||
      code === '42P01'
    ) {
      console.warn('Skipping teacher-subjects update (table missing):', message);
      return;
    }
    console.error('Re-throwing error:', err);
    throw err;
  }
};

export const applyTeacherDefaultFee = async (
  teacherId: string,
  fee: number,
  bookingIds?: string[],
  options?: { applyToCurrentMonth?: boolean }
) => {
  // 1) Update the teacher default
  const { error: teacherErr } = await supabase
    .from('teachers')
    .update({ default_class_fee: fee })
    .eq('id', teacherId);
  if (teacherErr) throw teacherErr;

  // 2) Update bookings for the current and upcoming months only
  //    Do NOT touch past months, and do NOT override custom-fee bookings (if the flag exists)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startStr = `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}-01`;

  // Fetch candidate bookings by teacher (or by explicit selection)
  let allBookings: any[] = [];
  if (bookingIds && bookingIds.length > 0) {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, start_date, end_date, teacher_id, is_custom_fee')
      .in('id', bookingIds);
    if (error) throw error;
    allBookings = data || [];
  } else {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, start_date, end_date, teacher_id, is_custom_fee')
      .eq('teacher_id', teacherId);
    if (error) throw error;
    allBookings = data || [];
  }

  const idsToUpdate = (allBookings || []).filter((b: any) => {
    const startDate = new Date(b.start_date);
    const endDate = b.end_date ? new Date(b.end_date) : null;
    const isOngoingThisMonth = startDate <= new Date(now.getFullYear(), now.getMonth() + 1, 0) && (!endDate || endDate >= startOfMonth);
    const isInFuture = startDate >= startOfMonth;
    const isEligible = (isOngoingThisMonth || isInFuture) && (b.is_custom_fee !== true);
    return isEligible;
  }).map((b: any) => b.id);

  if (idsToUpdate.length > 0) {
    const { error: updErr } = await supabase
      .from('bookings')
      .update({ class_fees: fee })
      .in('id', idsToUpdate);
    if (updErr) throw updErr;
  }

  // Optionally update current month registrations to reflect the new fee
  if (options?.applyToCurrentMonth && idsToUpdate.length > 0) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-01`;
    const nextStr = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`;

    const { data: regs, error: regsErr } = await supabase
      .from('student_registrations')
      .select('id, paid_amount')
      .in('booking_id', idsToUpdate)
      .gte('registration_date', startStr)
      .lt('registration_date', nextStr);
    if (regsErr) throw regsErr;

    const updates = (regs as Array<{ id: string; paid_amount: number | null }> ) || [];
    for (const r of updates) {
      const paidAmount = Number(r.paid_amount || 0);
      const newStatus = paidAmount === 0 ? 'pending' : (paidAmount >= fee ? 'paid' : 'partial');
      const { error: uErr } = await supabase
        .from('student_registrations')
        .update({ total_fees: fee, payment_status: newStatus })
        .eq('id', r.id);
      if (uErr) throw uErr;
    }
  }
};

export const deleteTeacher = async (id: string) => {
  const { error } = await supabase.from("teachers").delete().eq("id", id);
  if (error) throw error;
  return id;
};

export const addTeacherAcademicStages = async (teacherId: string, stageIds: string[]) => {
  if (stageIds.length === 0) return;
  
  const insertData = stageIds.map(stageId => ({
    teacher_id: teacherId,
    academic_stage_id: stageId
  }));
  
  console.log('Inserting teacher academic stages:', insertData);
  
  const { error } = await supabase
    .from('teacher_academic_stages')
    .insert(insertData);
  
  if (error) {
    console.error('Error inserting teacher academic stages:', error);
    throw error;
  }
  
  console.log('Teacher academic stages inserted successfully');
};

export const updateTeacherAcademicStages = async (teacherId: string, stageIds: string[]) => {
  try {
    console.log('updateTeacherAcademicStages called with:', { teacherId, stageIds });
    
    // First, delete existing associations
    const { error: delErr } = await supabase
      .from('teacher_academic_stages')
      .delete()
      .eq('teacher_id', teacherId);
    
    if (delErr) {
      console.error('Error deleting teacher academic stages:', delErr);
      throw delErr;
    }
    console.log('Deleted existing teacher academic stages');

    // Then add new associations if any
    if (stageIds.length > 0) {
      await addTeacherAcademicStages(teacherId, stageIds);
      console.log('Academic stages added successfully');
    }
  } catch (err: any) {
    // ALWAYS soft-fail on any error to avoid blocking teacher updates
    // This feature is optional and should never prevent core teacher data from saving
    console.warn('Skipping academic stages update (non-fatal error):', err?.message || err);
    return;
  }
};