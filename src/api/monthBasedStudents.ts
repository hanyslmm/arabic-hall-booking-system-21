import { supabase } from "@/integrations/supabase/client";
import { monthBasedApi } from "@/utils/monthBasedApi";

export interface Student {
  id: string;
  name: string;
  mobile_phone?: string;
  parent_phone?: string;
  serial_number?: string;
  city?: string;
  created_at: string;
  academic_stage_id?: string;
}

export interface StudentRegistration {
  id: string;
  student_id: string;
  booking_id: string;
  total_fees: number;
  paid_amount: number;
  payment_status: 'pending' | 'partial' | 'paid';
  registration_date: string;
  created_at: string;
  notes?: string;
}

export const monthBasedStudentsApi = {
  /**
   * Get students registered in a specific month with fallback
   */
  async getStudentsForMonth(month: number, year: number): Promise<Student[]> {
    return monthBasedApi.getConfigurationData(
      'students',
      month,
      year
    );
  },

  /**
   * Get student registrations for a specific month (no fallback - financial data)
   */
  async getRegistrationsForMonth(month: number, year: number): Promise<StudentRegistration[]> {
    return monthBasedApi.getExactMonthData(
      'student_registrations',
      month,
      year,
      `
        *,
        students(name, serial_number, mobile_phone),
        bookings(class_code, halls(name), teachers(name))
      `
    );
  },

  /**
   * Get registrations by payment status for a specific month
   */
  async getRegistrationsByPaymentStatus(
    paymentStatus: 'pending' | 'partial' | 'paid',
    month: number,
    year: number
  ): Promise<StudentRegistration[]> {
    return monthBasedApi.getExactMonthData(
      'student_registrations',
      month,
      year,
      `
        *,
        students(name, serial_number, mobile_phone),
        bookings(class_code, halls(name), teachers(name))
      `,
      { payment_status: paymentStatus }
    );
  },

  /**
   * Get registrations for a specific booking in a month
   */
  async getRegistrationsByBooking(bookingId: string, month: number, year: number): Promise<StudentRegistration[]> {
    return monthBasedApi.getExactMonthData(
      'student_registrations',
      month,
      year,
      `
        *,
        students(name, serial_number, mobile_phone)
      `,
      { booking_id: bookingId }
    );
  }
};