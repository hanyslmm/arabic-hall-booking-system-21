import { supabase } from "@/integrations/supabase/client";

export interface DailySettlement {
  id: string;
  created_by: string;
  settlement_date: string;
  type: 'income' | 'expense';
  amount: number;
  source_type: string;
  source_id?: string;
  source_name: string;
  category?: string;
  subject_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSettlementData {
  settlement_date: string;
  type: 'income' | 'expense';
  amount: number;
  source_type: string;
  source_id?: string;
  source_name: string;
  category?: string;
  subject_id?: string;
  notes?: string;
}

export const dailySettlementsApi = {
  async getAll(startDate?: string, endDate?: string): Promise<DailySettlement[]> {
    let query = supabase
      .from('daily_settlements')
      .select('*')
      .order('settlement_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('settlement_date', startDate);
    }
    if (endDate) {
      query = query.lte('settlement_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as DailySettlement[];
  },

  async getByDate(date: string): Promise<DailySettlement[]> {
    const { data, error } = await supabase
      .from('daily_settlements')
      .select('*')
      .eq('settlement_date', date)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as DailySettlement[];
  },

  async getByCreator(creatorId: string, startDate?: string, endDate?: string): Promise<DailySettlement[]> {
    let query = supabase
      .from('daily_settlements')
      .select('*')
      .eq('created_by', creatorId)
      .order('settlement_date', { ascending: false });

    if (startDate) {
      query = query.gte('settlement_date', startDate);
    }
    if (endDate) {
      query = query.lte('settlement_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as DailySettlement[];
  },

  async create(settlementData: CreateSettlementData): Promise<DailySettlement> {
    const { data, error } = await supabase
      .from('daily_settlements')
      .insert([{
        ...settlementData,
        created_by: (await supabase.auth.getUser()).data.user?.id!
      }])
      .select()
      .single();

    if (error) throw error;
    return data as DailySettlement;
  },

  async update(id: string, updates: Partial<CreateSettlementData>): Promise<DailySettlement> {
    const { data, error } = await supabase
      .from('daily_settlements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as DailySettlement;
  },

  async delete(id: string): Promise<boolean> {
    // Return deleted rows to verify something was actually removed
    const { data, error } = await supabase
      .from('daily_settlements')
      .delete()
      .eq('id', id)
      .select('id');

    if (error) throw error;
    return Array.isArray(data) && data.length > 0;
  },

  // Change request APIs
  async requestEdit(settlementId: string, changes: Partial<CreateSettlementData> & { reason?: string }) {
    const sb: any = supabase;
    const userRes = await supabase.auth.getUser();
    const userId = userRes.data.user?.id!;
    let requesterName: string | null = null;
    try {
      const { data: prof } = await sb.from('profiles').select('full_name, username').eq('id', userId).single();
      requesterName = prof?.full_name || prof?.username || null;
    } catch {}

    const { data, error } = await sb
      .from('settlement_change_requests')
      .insert([{ 
        settlement_id: settlementId, 
        requested_by: userId,
        request_type: 'edit',
        payload: { ...changes, requester_name: requesterName },
        reason: changes.reason ?? null,
        status: 'pending'
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async requestDelete(settlementId: string, reason?: string) {
    const sb: any = supabase;
    const userRes = await supabase.auth.getUser();
    const userId = userRes.data.user?.id!;
    let requesterName: string | null = null;
    try {
      const { data: prof } = await sb.from('profiles').select('full_name, username').eq('id', userId).single();
      requesterName = prof?.full_name || prof?.username || null;
    } catch {}

    const { data, error } = await sb
      .from('settlement_change_requests')
      .insert([{ 
        settlement_id: settlementId, 
        requested_by: userId,
        request_type: 'delete',
        payload: { requester_name: requesterName },
        reason: reason ?? null,
        status: 'pending'
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async listRequestsForDate(date: string) {
    const sb: any = supabase;
    const { data, error } = await sb
      .from('settlement_change_requests')
      .select('*, daily_settlements!inner(settlement_date), profiles!requester (full_name, username)')
      .eq('daily_settlements.settlement_date', date)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async listRequests({ date, userId, status }: { date?: string; userId?: string; status?: 'pending'|'approved'|'rejected'|'all' }) {
    const sb: any = supabase;
    let query = sb
      .from('settlement_change_requests')
      .select('*, daily_settlements!inner(settlement_date), requester:profiles!settlement_change_requests_requested_by_fkey (full_name, username)')
      .order('created_at', { ascending: false });

    if (date) {
      query = query.eq('daily_settlements.settlement_date', date);
    }
    if (userId) {
      query = query.eq('requested_by', userId);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async approveRequest(id: string) {
    const sb: any = supabase;
    const { data, error } = await sb
      .from('settlement_change_requests')
      .update({ status: 'approved', reviewed_by: (await supabase.auth.getUser()).data.user?.id!, reviewed_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async rejectRequest(id: string) {
    const sb: any = supabase;
    const { data, error } = await sb
      .from('settlement_change_requests')
      .update({ status: 'rejected', reviewed_by: (await supabase.auth.getUser()).data.user?.id!, reviewed_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getDailySummary(date: string): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
    incomeCount: number;
    expenseCount: number;
  }> {
    const settlements = await this.getByDate(date);
    
    const income = settlements.filter(s => s.type === 'income');
    const expenses = settlements.filter(s => s.type === 'expense');
    
    const totalIncome = income.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
    
    return {
      totalIncome,
      totalExpenses,
      netAmount: totalIncome - totalExpenses,
      incomeCount: income.length,
      expenseCount: expenses.length
    };
  },

  async getTeacherContributions(startDate?: string, endDate?: string): Promise<Array<{
    teacher_name: string;
    teacher_id: string | null;
    total_amount: number;
    transaction_count: number;
  }>> {
    let query = supabase
      .from('daily_settlements')
      .select('source_name, source_id, amount')
      .eq('type', 'income')
      .eq('source_type', 'teacher');

    if (startDate) {
      query = query.gte('settlement_date', startDate);
    }
    if (endDate) {
      query = query.lte('settlement_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Group by teacher
    const contributions = new Map<string, {
      teacher_name: string;
      teacher_id: string | null;
      total_amount: number;
      transaction_count: number;
    }>();

    data?.forEach(settlement => {
      const key = settlement.source_id || settlement.source_name;
      if (contributions.has(key)) {
        const existing = contributions.get(key)!;
        existing.total_amount += Number(settlement.amount);
        existing.transaction_count += 1;
      } else {
        contributions.set(key, {
          teacher_name: settlement.source_name,
          teacher_id: settlement.source_id,
          total_amount: Number(settlement.amount),
          transaction_count: 1
        });
      }
    });

    return Array.from(contributions.values()).sort((a, b) => b.total_amount - a.total_amount);
  }
};