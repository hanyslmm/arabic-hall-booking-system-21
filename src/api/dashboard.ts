// Dedicated API layer for dashboard data fetching
import { supabase } from "@/integrations/supabase/client";
import { fetchMonthlyEarnings } from "@/utils/finance";
import { monthBasedApi } from "@/utils/monthBasedApi";

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
   * Get financial summary for a specific month and year using month-based API
   */
  async getFinancialSummary(month: number, year: number): Promise<FinancialSummary> {
    try {
      // Use the month-based API for financial summary
      const summary = await monthBasedApi.getFinancialSummary(month, year);
      
      // Calculate occupancy using month-based booking data
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonthExclusive = new Date(year, month, 1);
      const startStr = `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}-${String(startOfMonth.getDate()).padStart(2, '0')}`;
      const endStr = `${endOfMonthExclusive.getFullYear()}-${String(endOfMonthExclusive.getMonth() + 1).padStart(2, '0')}-${String(endOfMonthExclusive.getDate()).padStart(2, '0')}`;

      // Count total halls
      const { count: hallsCount } = await supabase
        .from('halls')
        .select('id', { count: 'exact', head: true });

      // Get active bookings for the month using configuration data (with fallback)
      const bookingsData = await monthBasedApi.getConfigurationData(
        'bookings',
        month,
        year,
        'hall_id, start_date, end_date, status',
        { status: 'active' }
      );

      const activeOverlapping = (bookingsData || []).filter((b: any) => {
        const startDate = new Date(b.start_date);
        const endDate = b.end_date ? new Date(b.end_date) : null;
        return startDate <= endOfMonthExclusive && (!endDate || endDate >= startOfMonth);
      });

      const uniqueHallIds = new Set<string>(activeOverlapping.map((b: any) => b.hall_id));
      const occupancy = hallsCount && hallsCount > 0 ? (uniqueHallIds.size / hallsCount) * 100 : 0;

      return {
        totalIncome: summary.totalIncome,
        totalExpenses: summary.totalExpenses,
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