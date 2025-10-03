import { supabase } from "@/integrations/supabase/client";

export const settingsApi = {
  async getExpenseCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'expense_categories')
      .maybeSingle();
    if (error) throw error;
    try {
      const parsed = data?.value ? JSON.parse(data.value) : null;
      if (Array.isArray(parsed)) return parsed as string[];
    } catch {}
    // Fallback defaults
    return [
      'المياه والكهرباء',
      'الصيانة',
      'الرواتب',
      'التنظيف',
      'القرطاسية',
      'الأمن',
      'أخرى'
    ];
  },

  async setExpenseCategories(categories: string[]): Promise<void> {
    const value = JSON.stringify(categories);
    // Try update; if no row, insert
    const { data: updated, error: upError } = await supabase
      .from('settings')
      .update({ value })
      .eq('key', 'expense_categories')
      .select('key');
    if (upError) throw upError;
    if (!updated || updated.length === 0) {
      const { error: insError } = await supabase
        .from('settings')
        .insert({ key: 'expense_categories', value });
      if (insError) throw insError;
    }
  }
};


