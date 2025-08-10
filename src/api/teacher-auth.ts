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
    
    return {
      total_students: Number(data[0]?.total_students || 0),
      total_classes: Number(data[0]?.total_classes || 0),
      total_earnings: Number(data[0]?.total_earnings || 0),
      monthly_earnings: Number(data[0]?.monthly_earnings || 0),
      pending_payments: Number(data[0]?.pending_payments || 0),
      attendance_rate: Number(data[0]?.attendance_rate || 85)
    };
  },

  // Get teacher bookings
  getMyBookings: async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        halls(name),
        teachers(name),
        academic_stages(name)
      `)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get teacher student registrations
  getMyStudentRegistrations: async () => {
    const { data, error } = await supabase
      .from('student_registrations')
      .select(`
        *,
        students(name, mobile_phone, serial_number),
        bookings(class_code, start_time, days_of_week),
        payment_records(amount, payment_date)
      `)
      .order('registration_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get teacher payment records
  getMyPaymentRecords: async () => {
    const { data, error } = await supabase
      .from('payment_records')
      .select(`
        *,
        student_registrations(
          students(name, mobile_phone),
          bookings(class_code)
        )
      `)
      .order('payment_date', { ascending: false });

    if (error) throw error;
    return data;
  }
};