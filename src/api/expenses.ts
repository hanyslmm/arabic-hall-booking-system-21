import { supabase } from "@/integrations/supabase/client";
import { createRecord, updateRecord, deleteRecord, fetchRecords, ApiError } from "@/lib/api";

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  payment_method: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseData {
  description: string;
  amount: number;
  category: string;
  date?: string;
  payment_method?: string;
  notes?: string;
}

export const expensesApi = {
  // Get all expenses with optional date filtering
  async getAll(startDate?: string, endDate?: string): Promise<Expense[]> {
    try {
      let query = supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Expense[];
    } catch (error) {
      throw new ApiError("فشل في جلب المصروفات", error);
    }
  },

  // Get expenses for a specific month
  async getByMonth(month: number, year: number): Promise<Expense[]> {
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];
      return this.getAll(startDate, endDate);
    } catch (error) {
      throw new ApiError("فشل في جلب مصروفات الشهر", error);
    }
  },

  // Get total expenses for a specific month using RPC function
  async getMonthlyTotal(month: number, year: number): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('get_monthly_expenses', {
          p_month: month,
          p_year: year
        });
      
      if (error) throw error;
      return Number(data || 0);
    } catch (error) {
      throw new ApiError("فشل في حساب إجمالي المصروفات", error);
    }
  },

  // Create new expense
  async create(expenseData: CreateExpenseData): Promise<Expense> {
    return createRecord<Expense>('expenses', expenseData, true);
  },

  // Update expense
  async update(id: string, updates: Partial<CreateExpenseData>): Promise<Expense> {
    return updateRecord<Expense>('expenses', id, updates);
  },

  // Delete expense
  async delete(id: string): Promise<string> {
    return deleteRecord('expenses', id);
  },

  // Get expense categories (predefined list)
  getCategories(): string[] {
    return [
      'رواتب',
      'إيجار',
      'مرافق',
      'صيانة',
      'مواد تنظيف',
      'قرطاسية',
      'تسويق',
      'نقل ومواصلات',
      'وجبات وضيافة',
      'أخرى'
    ];
  },

  // Get payment methods
  getPaymentMethods(): { value: string; label: string }[] {
    return [
      { value: 'cash', label: 'نقداً' },
      { value: 'card', label: 'بطاقة ائتمان' },
      { value: 'transfer', label: 'تحويل بنكي' },
      { value: 'check', label: 'شيك' },
      { value: 'other', label: 'أخرى' }
    ];
  }
};