import { createContext, useContext, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AuditLogContextType {
  logAction: (action: string, details?: any) => Promise<void>;
}

const AuditLogContext = createContext<AuditLogContextType | undefined>(undefined);

export const useAuditLog = () => {
  const context = useContext(AuditLogContext);
  if (!context) {
    throw new Error('useAuditLog must be used within an AuditLogProvider');
  }
  return context;
};

interface AuditLogProviderProps {
  children: React.ReactNode;
}

export function AuditLogProvider({ children }: AuditLogProviderProps) {
  const logAction = useCallback(async (action: string, details?: any) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      await supabase.from('audit_logs').insert({
        actor_user_id: user.user.id,
        action,
        details: details || {},
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log audit action:', error);
      // Don't throw error to avoid breaking app functionality
    }
  }, []);

  return (
    <AuditLogContext.Provider value={{ logAction }}>
      {children}
    </AuditLogContext.Provider>
  );
}