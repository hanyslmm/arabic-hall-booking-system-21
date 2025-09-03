import { useAuth } from "@/hooks/useAuth";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { ReceptionistDashboard } from "@/components/receptionist/ReceptionistDashboard";
import { DailyFinanceCards } from "@/components/dashboard/DailyFinanceCards";
import { QuickExpenseButton } from "@/components/dashboard/QuickExpenseButton";
import { useMonthContext } from "@/hooks/useMonthNavigation";

export default function Index() {
  const { profile } = useAuth();
  const { getDateRange } = useMonthContext();
  
  const isAdmin = profile?.role === 'admin';
  const canViewFinance = isAdmin || profile?.role === 'manager';
  
  const { startDate } = getDateRange();

  return (
    <div className="min-h-screen bg-background">
      {isAdmin ? (
        <div className="space-y-6">
          <DailyFinanceCards selectedDate={startDate} />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <QuickExpenseButton />
          </div>
          <AdminDashboard />
        </div>
      ) : canViewFinance ? (
        <div className="space-y-6">
          <DailyFinanceCards selectedDate={startDate} />
          <ReceptionistDashboard />
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">مرحباً بك</h1>
            <p className="text-muted-foreground">
              يرجى التواصل مع الإدارة للحصول على الصلاحيات المناسبة
            </p>
          </div>
        </div>
      )}
    </div>
  );
}