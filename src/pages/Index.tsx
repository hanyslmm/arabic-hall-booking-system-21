import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { ReceptionistDashboard } from "@/components/receptionist/ReceptionistDashboard";
import { DailyFinanceCards } from "@/components/dashboard/DailyFinanceCards";
import { UserPermissionsDebug } from "@/components/debug/UserPermissionsDebug";

export default function Index() {
  const { profile } = useAuth();
  
  const isAdmin = profile?.role === 'ADMIN' || ['owner', 'manager'].includes(profile?.user_role || '');
  const isSpaceManager = profile?.user_role === 'space_manager';
  const canViewFinance = isAdmin || isSpaceManager;

  return (
    <div className="min-h-screen bg-background">
      <UserPermissionsDebug />
      {isAdmin ? (
        <div className="space-y-6">
          <DailyFinanceCards />
          <AdminDashboard />
        </div>
      ) : isSpaceManager ? (
        <div className="space-y-6">
          <DailyFinanceCards />
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