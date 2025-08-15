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
   * Get hall occupancy data for the dashboard grid
   */
  async getHallOccupancy(): Promise<HallOccupancy[]> {
    const clampPercentage = (value: number) => {
      if (!isFinite(value) || isNaN(value)) return 0;
      return Math.max(0, Math.min(100, Number(value)));
    };

    try {
      // Try the occupancy RPC function first
      const { data, error } = await supabase.rpc('get_hall_actual_occupancy_updated');
      if (error) throw error;
      
      if (data) {
        return (data as any[]).map((row) => ({
          hall_id: row.hall_id,
          name: row.hall_name ?? row.name ?? '',
          occupancy_percentage: clampPercentage(Number(row.occupancy_percentage ?? 0)),
        }));
      }
    } catch (error) {
      console.warn('RPC function failed, using fallback calculation:', error);
    }

    // Fallback: Calculate occupancy manually
    try {
      const { data, error } = await supabase
        .from('halls')
        .select(`
          id,
          name,
          capacity,
          bookings!inner(
            id,
            student_registrations(count)
          )
        `)
        .eq('bookings.status', 'active');

      if (error) throw error;

      const getCount = (sr: any) => {
        if (typeof sr === 'number') return sr;
        if (Array.isArray(sr)) return Number(sr[0]?.count ?? 0);
        if (sr && typeof sr === 'object') return Number(sr.count ?? 0);
        return 0;
      };

      return (data || []).map((hall: any) => {
        const activeBookings = (hall.bookings || []).length;
        const studentsAcrossBookings = (hall.bookings || []).reduce(
          (sum: number, booking: any) => sum + getCount(booking.student_registrations), 
          0
        );
        const denom = activeBookings > 0 ? hall.capacity * activeBookings : hall.capacity;
        const percentage = denom > 0 ? (studentsAcrossBookings / denom) * 100 : 0;
        
        return { 
          hall_id: hall.id, 
          name: hall.name, 
          occupancy_percentage: clampPercentage(Number(percentage.toFixed(1))) 
        };
      });
    } catch (error) {
      console.error('Error calculating hall occupancy:', error);
      throw new Error('فشل في حساب إشغال القاعات');
    }
  },
};