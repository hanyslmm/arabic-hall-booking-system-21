import { supabase } from "@/integrations/supabase/client";

export interface StudentAccount {
  id: string;
  student_id: string;
  auth_user_id: string;
  username: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export const studentAccountsApi = {
  // Reset student password (admin only)
  async resetPassword(studentId: string, newPassword: string): Promise<void> {
    // First get the student account
    const { data: account, error: accountError } = await supabase
      .from('student_accounts')
      .select('auth_user_id, username')
      .eq('student_id', studentId)
      .single();

    if (accountError) throw accountError;
    if (!account) throw new Error('Student account not found');

    // Update the auth user password using edge function
    const { error } = await supabase.functions.invoke('reset-student-password', {
      body: {
        student_auth_id: account.auth_user_id,
        new_password: newPassword
      }
    });

    if (error) throw error;
  },

  // Get student account by student ID
  async getByStudentId(studentId: string): Promise<StudentAccount | null> {
    const { data, error } = await supabase
      .from('student_accounts')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }
    
    return data;
  },

  // Deactivate student account
  async deactivate(studentId: string): Promise<void> {
    const { error } = await supabase
      .from('student_accounts')
      .update({ is_active: false })
      .eq('student_id', studentId);

    if (error) throw error;
  },

  // Activate student account
  async activate(studentId: string): Promise<void> {
    const { error } = await supabase
      .from('student_accounts')
      .update({ is_active: true })
      .eq('student_id', studentId);

    if (error) throw error;
  }
};