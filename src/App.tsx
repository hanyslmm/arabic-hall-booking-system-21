
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { GlobalNotifications } from "@/components/notifications/GlobalNotifications";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { MonthProvider } from "@/components/providers/MonthProvider";
import { UnifiedLayout } from "@/components/layout/UnifiedLayout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { ConfigurationCheck } from "@/components/ConfigurationCheck";
import { AuditLogProvider } from "@/components/audit/AuditLogProvider";
import { StyleShowcase } from "./components/StyleShowcase";
import { ReceptionistDashboard } from "./components/receptionist/ReceptionistDashboard";
import { AdminDashboard } from "./components/dashboard/AdminDashboard";
import { ReactNode, Suspense, useEffect } from "react";
import { Loader2 } from "lucide-react";

// Lazy imports for better performance
import {
  LazyBookingPage,
  LazyUsersPage,
  LazyTeachersPage,
  LazyHallsPage,
  LazyStagesPage,
  LazySubjectsPage,
  LazyBookingsPage,
  LazyStudentsPage,
  LazyStudentRegistrationsPage,
  LazyClassManagementPage,
  LazyAttendanceManagementPage,
  LazyMonthlyReportsPage,
  LazyMonthlyFeeManager,
  LazyStudentRelocationManager,
  
  LazyAdminPrivilegesPage,
  LazyDailyExpensesPage,
  LazyExpensesPage,
  LazyDailySettlementPage,
  LazyActualLiquidityPage,
  LazyTeacherDashboard,
  LazyStudentLoginPage,
  LazyStudentDashboard,
  LazyNotFound
} from "@/utils/lazyLoading";

import LoginPage from "./pages/LoginPage";
import SimpleStudentDashboard from "./pages/SimpleStudentDashboard";
import { SettingsPage } from "./pages/SettingsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { AuditLogPage } from "./pages/AuditLogPage";
import DiagnosticsPage from "./pages/DiagnosticsPage";
import { StudentRouteGuard } from "./components/auth/StudentRouteGuard";
import { FeatureRouteGuard } from "./components/auth/FeatureRouteGuard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Loading component with spinner
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">جاري التحميل...</p>
      </div>
    </div>
  );
}

function RootRoute() {
  const { user, loading, profile, isAdmin, isOwner, canManageUsers } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = profile?.role;
  const isOwnerOrAdmin = isAdmin || isOwner || canManageUsers;

  let dashboard: ReactNode = <ReceptionistDashboard />;
  if (role === "teacher") {
    dashboard = <LazyTeacherDashboard />;
  } else if (isOwnerOrAdmin) {
    dashboard = <AdminDashboard />;
  }

  // Return just the dashboard; layout is applied at the router level
  return <>{dashboard}</>;
}

function ProtectedLayout() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <StudentRouteGuard>
      <Suspense fallback={<LoadingScreen />}>
        <UnifiedLayout>
          <Outlet />
        </UnifiedLayout>
      </Suspense>
    </StudentRouteGuard>
  );
}

// Component to handle toast events
function ToastEventListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleShowToast = (event: CustomEvent) => {
      const { title, description, variant } = event.detail;
      toast({
        title,
        description,
        variant: variant || "default",
      });
    };

    window.addEventListener('showToast' as any, handleShowToast);
    return () => {
      window.removeEventListener('showToast' as any, handleShowToast);
    };
  }, [toast]);

  return null;
}

const App = () => {
   // Check if Supabase is configured
   if (!isSupabaseConfigured) {
     return <ConfigurationCheck />;
   }
 
   return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <MonthProvider>
          <AuditLogProvider>
            <TooltipProvider>
              <ToastEventListener />
              <Toaster />
              <Sonner />
              <BrowserRouter>
              <Routes>
                <Route path="/login" element={<StudentRouteGuard><LoginPage /></StudentRouteGuard>} />
                <Route path="/student-login" element={<LazyStudentLoginPage />} />
                <Route path="/simple-student-dashboard" element={<SimpleStudentDashboard />} />

                {/* Protected routes with a single, top-level layout */}
                <Route element={<ProtectedLayout />}>
                  <Route index element={<RootRoute />} />
                  <Route path="booking" element={<LazyBookingPage />} />
                  
                  {/* Student Management - Restricted for Phase 1 */}
                  <Route path="students" element={
                    <FeatureRouteGuard 
                      feature="student-management" 
                      featureName="إدارة الطلاب"
                      description="إدارة بيانات الطلاب والتسجيلات"
                      estimatedTime="المرحلة الثانية"
                    >
                      <LazyStudentsPage />
                    </FeatureRouteGuard>
                  } />
                  <Route path="student-registrations" element={
                    <FeatureRouteGuard 
                      feature="student-management" 
                      featureName="تسجيل الطلاب"
                      description="تسجيل الطلاب الجدد في النظام"
                      estimatedTime="المرحلة الثانية"
                    >
                      <LazyStudentRegistrationsPage />
                    </FeatureRouteGuard>
                  } />
                  
                  {/* Teacher Management - Restricted for Phase 1 */}
                  <Route path="teachers" element={
                    <FeatureRouteGuard 
                      feature="teacher-management" 
                      featureName="إدارة المعلمين"
                      description="إدارة بيانات المعلمين والمواد الدراسية"
                      estimatedTime="المرحلة الثانية"
                    >
                      <LazyTeachersPage />
                    </FeatureRouteGuard>
                  } />
                  <Route path="stages" element={
                    <FeatureRouteGuard 
                      feature="teacher-management" 
                      featureName="المراحل التعليمية"
                      description="إدارة المراحل التعليمية"
                      estimatedTime="المرحلة الثانية"
                    >
                      <LazyStagesPage />
                    </FeatureRouteGuard>
                  } />
                  <Route path="subjects" element={
                    <FeatureRouteGuard 
                      feature="teacher-management" 
                      featureName="المواد الدراسية"
                      description="إدارة المواد الدراسية"
                      estimatedTime="المرحلة الثانية"
                    >
                      <LazySubjectsPage />
                    </FeatureRouteGuard>
                  } />
                  
                  {/* Hall Management - Always Available for Target Roles */}
                  <Route path="halls" element={<LazyHallsPage />} />
                  
                  {/* Bookings - Always Available */}
                  <Route path="bookings" element={<LazyBookingsPage />} />
                  
                  {/* Financial Reports - Restricted for Phase 1 */}
                  <Route path="reports" element={
                    <FeatureRouteGuard 
                      feature="financial-reports" 
                      featureName="التقارير المالية"
                      description="التقارير المالية والإحصائيات"
                      estimatedTime="المرحلة الثالثة"
                    >
                      <ReportsPage />
                    </FeatureRouteGuard>
                  } />
                  <Route path="expenses" element={
                    <FeatureRouteGuard 
                      feature="expense-management" 
                      featureName="إدارة المصروفات"
                      description="إدارة المصروفات والتكاليف"
                      estimatedTime="المرحلة الثالثة"
                    >
                      <LazyExpensesPage />
                    </FeatureRouteGuard>
                  } />
                  <Route path="daily-expenses" element={
                    <FeatureRouteGuard 
                      feature="expense-management" 
                      featureName="المصروفات اليومية"
                      description="تسجيل وإدارة المصروفات اليومية"
                      estimatedTime="المرحلة الثالثة"
                    >
                      <LazyDailyExpensesPage />
                    </FeatureRouteGuard>
                  } />
                  
                  {/* Daily Settlement - Available for Target Roles */}
                  <Route path="daily-settlement" element={<LazyDailySettlementPage />} />
                  
                  {/* System Management - Restricted for Phase 1 */}
                  <Route path="users" element={
                    <FeatureRouteGuard 
                      feature="user-management" 
                      featureName="إدارة المستخدمين"
                      description="إدارة حسابات المستخدمين والصلاحيات"
                      estimatedTime="المرحلة الرابعة"
                    >
                      <LazyUsersPage />
                    </FeatureRouteGuard>
                  } />
                  <Route path="admin-privileges" element={
                    <FeatureRouteGuard 
                      feature="system-management" 
                      featureName="صلاحيات المدراء"
                      description="إدارة صلاحيات المدراء والمستخدمين"
                      estimatedTime="المرحلة الرابعة"
                    >
                      <LazyAdminPrivilegesPage />
                    </FeatureRouteGuard>
                  } />
                  <Route path="settings" element={
                    <FeatureRouteGuard 
                      feature="settings" 
                      featureName="إعدادات النظام"
                      description="إعدادات النظام العامة"
                      estimatedTime="المرحلة الرابعة"
                    >
                      <SettingsPage />
                    </FeatureRouteGuard>
                  } />
                  <Route path="audit-logs" element={
                    <FeatureRouteGuard 
                      feature="audit-logs" 
                      featureName="سجل التدقيق"
                      description="سجل أنشطة المستخدمين والتدقيق"
                      estimatedTime="المرحلة الرابعة"
                    >
                      <AuditLogPage />
                    </FeatureRouteGuard>
                  } />
                  
                  {/* Other routes - Always Available */}
          <Route path="monthly-reports" element={<LazyMonthlyReportsPage />} />
          <Route path="monthly-fee-manager" element={<LazyMonthlyFeeManager />} />
          <Route path="student-relocation" element={<LazyStudentRelocationManager />} />
          <Route path="attendance" element={<LazyAttendanceManagementPage />} />
                  <Route path="class-management/:bookingId" element={<LazyClassManagementPage />} />
                  <Route path="actual-liquidity" element={<LazyActualLiquidityPage />} />
                  <Route path="student-dashboard" element={<LazyStudentDashboard />} />
                  <Route path="simple-student-dashboard" element={<SimpleStudentDashboard />} />
                  <Route path="diagnostics" element={<DiagnosticsPage />} />
                  <Route path="style-showcase" element={<StyleShowcase />} />

                  {/* Catch-all inside protected layout */}
                  <Route path="*" element={<LazyNotFound />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
          <GlobalNotifications />
        </AuditLogProvider>
      </MonthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
  );
}

export default App;
