import { supabase } from "@/integrations/supabase/client";

export interface MonthBasedQuery {
  month: number;
  year: number;
  fallbackToPrevious?: boolean;
}

export const monthBasedApi = {
  /**
   * Get data for a specific month with fallback to previous months for configuration
   */
  async getMonthBasedData(
    table: string,
    options: MonthBasedQuery,
    select: string = '*',
    additionalFilters?: Record<string, any>
  ) {
    const { month, year, fallbackToPrevious = true } = options;
    
    // For financial data, always use exact month
    const isFinancialData = ['payment_records', 'expenses', 'transactions'].includes(table);
    
    if (isFinancialData || !fallbackToPrevious) {
      return await this.getExactMonthData(table, month, year, select, additionalFilters);
    }
    
    // For configuration data, try current month first, then fallback to previous months
    let currentMonth = month;
    let currentYear = year;
    
    for (let i = 0; i < 6; i++) { // Try up to 6 months back
      const data = await this.getExactMonthData(table, currentMonth, currentYear, select, additionalFilters);
      
      if (data.length > 0) {
        return data;
      }
      
      // Move to previous month
      currentMonth--;
      if (currentMonth < 1) {
        currentMonth = 12;
        currentYear--;
      }
    }
    
    // If no data found in the last 6 months, return empty array
    return [];
  },
  
  /**
   * Get data for exact month without fallback
   */
  async getExactMonthData(
    table: string,
    month: number,
    year: number,
    select: string = '*',
    additionalFilters?: Record<string, any>
  ) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    
    let query = (supabase as any).from(table).select(select);
    
    // Apply date filters based on common date column names
    const dateColumns = ['created_at', 'date', 'registration_date', 'start_date', 'payment_date'];
    let dateColumnUsed = false;
    
    for (const dateCol of dateColumns) {
      if (!dateColumnUsed) {
        try {
          query = query.gte(dateCol, startDate).lt(dateCol, endDate);
          dateColumnUsed = true;
          break;
        } catch {
          // Column doesn't exist, try next one
          continue;
        }
      }
    }
    
    // Apply additional filters
    if (additionalFilters) {
      Object.entries(additionalFilters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  },
  
  /**
   * Get financial summary for a specific month (no fallback)
   */
  async getFinancialSummary(month: number, year: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    
    // Get payments (income)
    const { data: paymentsData } = await supabase
      .from('payment_records')
      .select('amount')
      .gte('payment_date', startDate)
      .lt('payment_date', endDate);
    
    const totalIncome = (paymentsData || []).reduce((sum: number, record: any) => sum + (Number(record.amount) || 0), 0);
    
    // Get expenses
    const { data: expensesData } = await supabase
      .from('expenses')
      .select('amount')
      .gte('date', startDate)
      .lt('date', endDate);
    
    const totalExpenses = (expensesData || []).reduce((sum: number, record: any) => sum + (Number(record.amount) || 0), 0);
    
    return {
      totalIncome,
      totalExpenses,
      profit: totalIncome - totalExpenses
    };
  },
  
  /**
   * Get configuration data with month-based fallback
   */
  async getConfigurationData(
    table: string,
    month: number,
    year: number,
    select: string = '*',
    additionalFilters?: Record<string, any>
  ) {
    return this.getMonthBasedData(table, { month, year, fallbackToPrevious: true }, select, additionalFilters);
  }
};