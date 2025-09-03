import { supabase } from "@/integrations/supabase/client";
import { monthBasedApi } from "@/utils/monthBasedApi";

export interface Booking {
  id: string;
  start_date: string;
  end_date: string | null;
  start_time: string;
  days_of_week: string[];
  number_of_students: number;
  class_code?: string;
  status: 'active' | 'cancelled' | 'completed';
  created_at: string;
  halls?: { name: string; capacity: number };
  teachers?: { name: string; teacher_code?: string };
  academic_stages?: { name: string };
  class_fees?: number;
}

export const monthBasedBookingsApi = {
  /**
   * Get bookings for a specific month with fallback to previous months
   */
  async getBookingsForMonth(month: number, year: number): Promise<Booking[]> {
    return monthBasedApi.getConfigurationData(
      'bookings',
      month,
      year,
      `
        *,
        halls(name, capacity),
        teachers(name, teacher_code),
        academic_stages(name)
      `
    );
  },

  /**
   * Get active bookings for a specific month with fallback
   */
  async getActiveBookingsForMonth(month: number, year: number): Promise<Booking[]> {
    return monthBasedApi.getConfigurationData(
      'bookings',
      month,
      year,
      `
        *,
        halls(name, capacity),
        teachers(name, teacher_code),
        academic_stages(name)
      `,
      { status: 'active' }
    );
  },

  /**
   * Get bookings by hall for a specific month
   */
  async getBookingsByHall(hallId: string, month: number, year: number): Promise<Booking[]> {
    return monthBasedApi.getConfigurationData(
      'bookings',
      month,
      year,
      `
        *,
        halls(name, capacity),
        teachers(name, teacher_code),
        academic_stages(name)
      `,
      { hall_id: hallId, status: 'active' }
    );
  },

  /**
   * Get bookings by teacher for a specific month
   */
  async getBookingsByTeacher(teacherId: string, month: number, year: number): Promise<Booking[]> {
    return monthBasedApi.getConfigurationData(
      'bookings',
      month,
      year,
      `
        *,
        halls(name, capacity),
        teachers(name, teacher_code),
        academic_stages(name)
      `,
      { teacher_id: teacherId, status: 'active' }
    );
  }
};