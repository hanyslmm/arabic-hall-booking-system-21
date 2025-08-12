import { supabase } from "@/integrations/supabase/client";

export interface TeacherStatistics {
  total_students: number;
  total_classes: number;
  total_earnings: number;
  monthly_earnings: number;
  pending_payments: number;
  attendance_rate: number;
}

export interface TeacherLoginData {
  username: string;
  password: string;
}

export interface TeacherProfile {
  id: string;
  username: string;
  teacher_id: string;
  teacher_name: string;
  user_role: 'teacher';
}

export const teacherAuthApi = {
  // Get teacher statistics
  getStatistics: async (teacherId: string): Promise<TeacherStatistics> => {
    const { data, error } = await supabase.rpc('get_teacher_statistics', {
      p_teacher_id: teacherId
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return {
      total_students: Number(row?.total_students || 0),
      total_classes: Number(row?.total_classes || 0),
      total_earnings: Number(row?.total_earnings || 0),
      monthly_earnings: Number(row?.monthly_earnings || 0),
      pending_payments: Number(row?.pending_payments || 0),
      attendance_rate: Number(row?.attendance_rate || 85)
    };
  },

  // Get teacher bookings - fixed to filter by current teacher
  getMyBookings: async (teacherId: string) => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        halls(name),
        teachers(name),
        academic_stages(name)
      `)
      .eq('teacher_id', teacherId)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get teacher student registrations - fixed to filter by current teacher
  getMyStudentRegistrations: async (teacherId: string) => {
    const { data, error } = await supabase
      .from('student_registrations')
      .select(`
        *,
        students(name, mobile_phone, serial_number),
        bookings!inner(class_code, start_time, days_of_week, teacher_id),
        payment_records(amount, payment_date)
      `)
      .eq('bookings.teacher_id', teacherId)
      .order('registration_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get teacher payment records - fixed to filter by current teacher
  getMyPaymentRecords: async (teacherId: string) => {
    const { data, error } = await supabase
      .from('payment_records')
      .select(`
        *,
        student_registrations!inner(
          students(name, mobile_phone),
          bookings!inner(class_code, teacher_id)
        )
      `)
      .eq('student_registrations.bookings.teacher_id', teacherId)
      .order('payment_date', { ascending: false });

    if (error) throw error;
    return data;
  }
};