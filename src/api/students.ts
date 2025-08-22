import { supabase } from '@/integrations/supabase';

export interface Student {
  id: number;
  name: string;
  mobile_phone: string;
  serial_number: string;
  created_at: string;
}

interface GetPaginatedParams {
  page: number;
  pageSize: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const studentsApi = {
  getPaginated: async ({ page, pageSize, searchTerm, sortBy = 'created_at', sortOrder = 'desc' }: GetPaginatedParams) => {
    let query = supabase.from('students').select('*', { count: 'exact' });

    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,mobile_phone.ilike.%${searchTerm}%,serial_number.ilike.%${searchTerm}%`);
    }

    if (sortBy) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    const { data, error, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);

    if (error) throw error;
    return { data, total: count };
  },

  search: async (searchTerm: string) => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,mobile_phone.ilike.%${searchTerm}%,serial_number.ilike.%${searchTerm}%`)
      .limit(50);
    if (error) throw error;
    return data;
  },

  delete: async (id: number) => {
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) throw error;
  },
};