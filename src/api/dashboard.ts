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
  hall_name: string;
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
      
      // Get expenses using RPC function
      let totalExpenses = 0;
      try {
        const { data, error } = await supabase.rpc('get_monthly_expenses', {
          p_month: month,
          p_year: year
        });
        if (!error) {
          totalExpenses = Number(data || 0);
        }
      } catch (expenseError) {
        console.warn('Could not fetch expenses:', expenseError);
      }

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
   * Get hall time slot occupancy data using actual booking data
   */
  async getHallOccupancy(): Promise<HallOccupancy[]> {
    try {
      // Use the new RPC function to get real occupancy data
      const { data, error } = await supabase.rpc('get_hall_occupancy_data');
      
      if (error) throw error;
      
      return (data || []).map((hall: any) => ({
        hall_id: hall.hall_id,
        hall_name: hall.hall_name,
        occupancy_percentage: Number(hall.occupancy_percentage || 0),
        occupied_slots: Number(hall.occupied_slots || 0),
        available_slots: Number(hall.available_slots || 24),
        working_hours_per_day: Number(hall.working_hours_per_day || 12),
        working_days_per_week: Number(hall.working_days_per_week || 2),
      }));
    } catch (error) {
      console.error('Error fetching hall occupancy:', error);
      throw new Error('فشل في حساب إشغال القاعات');
    }
  },
};