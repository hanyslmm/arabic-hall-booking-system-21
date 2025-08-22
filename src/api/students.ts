import { supabase } from "@/integrations/supabase/client";
import { StudentRegistration, PaymentRecord } from "@/types";

export interface AttendanceRecord {
  id: string;
  student_registration_id: string;
  attendance_date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  created_at: string;
  created_by?: string;
}

// Students API
export const studentsApi = {
  async getAll(): Promise<Student[]> {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getPaginated(params: { page: number; pageSize: number; searchTerm?: string; sortKey?: string; sortDirection?: 'asc' | 'desc' }): Promise<{ data: Student[]; total: number; }>{
    const { page, pageSize, searchTerm, sortKey, sortDirection } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Allowlist of sortable columns to prevent SQL errors or misuse
    const allowedSortKeys = new Set<string>(["created_at", "name", "serial_number", "mobile_phone"]);
    const effectiveSortKey = (sortKey && allowedSortKeys.has(sortKey)) ? sortKey : "created_at";
    const effectiveAscending = (sortDirection || 'desc') === 'asc';

    let query = supabase
      .from("students")
      .select("*", { count: 'exact' })
      .order(effectiveSortKey, { ascending: effectiveAscending })
      .range(from, to);

    if (searchTerm && searchTerm.trim().length > 0) {
      const term = searchTerm.trim();
      // Search by serial_number, name, or mobile_phone
      query = query.or(
        `serial_number.ilike.%${term}%,name.ilike.%${term}%,mobile_phone.ilike.%${term}%`
      );
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data || [], total: count || 0 };
  },

  async create(studentData: {
    name: string;
    mobile_phone?: string;
    academic_stage_id?: string;
    serial_number?: string;
  }): Promise<Student> {
    const { data, error } = await supabase
      .from("students")
      .insert([studentData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Student>): Promise<Student> {
    const { data, error } = await supabase
      .from("students")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<string> {
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) throw error;
    return id;
  },

  async search(term: string): Promise<Student[]> {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .or(`serial_number.ilike.%${term}%,name.ilike.%${term}%,mobile_phone.ilike.%${term}%`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async searchBySerialExact(term: string): Promise<Student[]> {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("serial_number", term)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async searchFlexible(term: string): Promise<Student[]> {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .or(`serial_number.ilike.%${term}%,name.ilike.%${term}%,mobile_phone.ilike.%${term}%`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },
  
  async getById(id: string): Promise<Student | null> {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return data;
  },

  async bulkCreate(students: {
    name: string;
    mobile_phone?: string;
    academic_stage_id?: string;
  }[]): Promise<Student[]> {
    const { data, error } = await supabase
      .from("students")
      .insert(students)
      .select();
    
    if (error) throw error;
    return data || [];
  }
};

export interface Student {
  id: string;
  name: string;
  mobile_phone?: string;
  serial_number?: string;
  academic_stage_id?: string;
  created_at: string;
}

// Attendance API (simplified for now)
export const attendanceApi = {
  async getByRegistration(registrationId: string): Promise<any[]> {
    // Attendance functionality not implemented in simplified schema
    console.log('Attendance not implemented in simplified schema');
    return [];
  },
  
  async create(attendanceData: any): Promise<any> {
    console.log('Attendance not implemented in simplified schema');
    return Promise.resolve();
  },
  
  async update(id: string, updates: any): Promise<any> {
    console.log('Attendance not implemented in simplified schema');
    return Promise.resolve();
  },
  
  async markPresentForDate(registrationId: string, date: string): Promise<any> {
    console.log('Attendance not implemented in simplified schema');
    return Promise.resolve();
  }
};

export const getStudents = studentsApi.getAll;

// Student Registrations API
export const studentRegistrationsApi = {
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from("student_registrations")
      .select(`
        *,
        students(*),
        bookings(
          *,
          halls(name),
          teachers(name),
          academic_stages(name)
        )
      `)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getByBooking(bookingId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("student_registrations")
      .select(`
        *,
        students(*),
        payment_records(amount, payment_date)
      `)
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getByStudentWithPayments(studentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("student_registrations")
      .select(`
        *,
        students(*),
        bookings(
          *,
          halls(name),
          teachers(name),
          academic_stages(name)
        ),
        payment_records(amount, payment_date)
      `)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async countByBookingId(bookingId: string): Promise<number> {
    const { count, error } = await supabase
      .from("student_registrations")
      .select("id", { count: 'exact', head: true })
      .eq("booking_id", bookingId);
    if (error) throw error;
    return count || 0;
  },

  async countByBookingIds(bookingIds: string[]): Promise<Record<string, number>> {
    if (!bookingIds || bookingIds.length === 0) return {};
    const { data, error } = await supabase
      .from("student_registrations")
      .select("booking_id")
      .in("booking_id", bookingIds);
    if (error) throw error;
    const map: Record<string, number> = {};
    (data || []).forEach((row: any) => {
      map[row.booking_id] = (map[row.booking_id] || 0) + 1;
    });
    return map;
  },

  async create(registrationData: {
    student_id: string;
    booking_id: string;
    total_fees?: number;
  }): Promise<any> {
    const { data, error } = await supabase
      .from("student_registrations")
      .insert([registrationData])
      .select(`
        *,
        students(*),
        bookings(
          *,
          halls(name),
          teachers(name),
          academic_stages(name)
        )
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<{
    total_fees: number;
  }>): Promise<any> {
    const { data, error } = await supabase
      .from("student_registrations")
      .update(updates)
      .eq("id", id)
      .select(`
        *,
        students(*),
        bookings(
          *,
          halls(name),
          teachers(name),
          academic_stages(name)
        )
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<string> {
    const { error } = await supabase.from("student_registrations").delete().eq("id", id);
    if (error) throw error;
    return id;
  },

  async getByMonth(year: number, month: number): Promise<any[]> {
    // Create start and end dates for the month
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
    
    const { data, error } = await supabase
      .from("student_registrations")
      .select(`
        *,
        students(*),
        bookings(
          *,
          halls(name),
          teachers(name),
          academic_stages(name)
        )
      `)
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async updateFeesWithStatus(registrationId: string, newFees: number): Promise<any> {
    // Fetch current paid_amount to compute payment_status
    const { data: current, error: fetchError } = await supabase
      .from("student_registrations")
      .select("id, paid_amount")
      .eq("id", registrationId)
      .single();
    if (fetchError) throw fetchError;

    const paidAmount = current?.paid_amount || 0;
    const newStatus = paidAmount === 0 ? 'pending' : (paidAmount >= newFees ? 'paid' : 'partial');

    const { data, error } = await supabase
      .from("student_registrations")
      .update({ total_fees: newFees, payment_status: newStatus })
      .eq("id", registrationId)
      .select(`
        *,
        students(*),
        bookings(
          *,
          halls(name),
          teachers(name),
          academic_stages(name)
        )
      `)
      .single();
    if (error) throw error;
    return data;
  },
};

// Payments API
export const paymentsApi = {
  async getByRegistration(registrationId: string): Promise<PaymentRecord[]> {
    const { data, error } = await supabase
      .from("payment_records")
      .select("*")
      .eq("student_registration_id", registrationId)
      .order("payment_date", { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(paymentData: {
    student_registration_id: string;
    amount: number;
    payment_date?: string;
    payment_method?: string;
    notes?: string;
  }): Promise<PaymentRecord> {
    const { data, error } = await supabase
      .from("payment_records")
      .insert([paymentData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<{
    amount: number;
    payment_date: string;
    payment_method: string;
    notes: string;
  }>): Promise<PaymentRecord> {
    const { data, error } = await supabase
      .from("payment_records")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<string> {
    const { error } = await supabase.from("payment_records").delete().eq("id", id);
    if (error) throw error;
    return id;
  }
};