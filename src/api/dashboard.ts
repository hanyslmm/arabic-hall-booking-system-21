// Dedicated API layer for dashboard data fetching
import { supabase } from "@/integrations/supabase/client";
import { fetchMonthlyEarnings } from "@/utils/finance";

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  occupancy: number;
}

export interface HallOccupancy {
  hall_id: string;
  name: string;
  occupancy_percentage: number;
  occupied_slots: number;
  available_slots: number;
  working_hours_per_day: number;
  working_days_per_week: number;
}

export const dashboardApi = {
  /**
   * Get financial summary for a specific month and year
   */
  async getFinancialSummary(month: number, year: number): Promise<FinancialSummary> {
    try {
      // Use the existing robust monthly earnings function
      const totalIncome = await fetchMonthlyEarnings(month, year);
      const totalExpenses = 0; // No expenses table yet

      // Calculate occupancy: proportion of halls with active bookings in the month
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonthExclusive = new Date(year, month, 1);
      const startStr = `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}-${String(startOfMonth.getDate()).padStart(2, '0')}`;
      const endStr = `${endOfMonthExclusive.getFullYear()}-${String(endOfMonthExclusive.getMonth() + 1).padStart(2, '0')}-${String(endOfMonthExclusive.getDate()).padStart(2, '0')}`;

      // Count total halls
      const { count: hallsCount } = await supabase
        .from('halls')
        .select('id', { count: 'exact', head: true });

      // Fetch bookings that overlap with this month
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('hall_id, start_date, end_date, status')
        .lte('start_date', endStr);

      if (bookingsError) throw bookingsError;

      const activeOverlapping = (bookingsData || []).filter((b: any) => {
        if (b.status && String(b.status).toLowerCase() === 'cancelled') return false;
        const endDate = b.end_date ? new Date(b.end_date) : null;
        return !endDate || endDate >= startOfMonth;
      });

      const uniqueHallIds = new Set<string>(activeOverlapping.map((b: any) => b.hall_id));
      const occupancy = hallsCount && hallsCount > 0 ? (uniqueHallIds.size / hallsCount) * 100 : 0;

      return {
        totalIncome,
        totalExpenses,
        occupancy,
      };
    } catch (error) {
      console.error('Error fetching financial summary:', error);
      throw new Error('فشل في جلب الملخص المالي');
    }
  },

  /**
   * Get hall time slot occupancy data for the dashboard grid
   */
  async getHallOccupancy(): Promise<HallOccupancy[]> {
    try {
      // Use the new time slot occupancy function
      const { data, error } = await supabase.rpc('get_hall_time_slot_occupancy');
      if (error) throw error;
      
      return (data as any[]).map((row) => ({
        hall_id: row.hall_id,
        name: row.hall_name,
        occupancy_percentage: Number(row.occupancy_percentage || 0),
        occupied_slots: Number(row.occupied_slots || 0),
        available_slots: Number(row.available_slots || 0),
        working_hours_per_day: Number(row.working_hours_per_day || 0),
        working_days_per_week: Number(row.working_days_per_week || 0),
      }));
    } catch (error) {
      console.error('Error fetching hall time slot occupancy:', error);
      throw new Error('فشل في حساب إشغال الفترات الزمنية للقاعات');
    }
  },
};