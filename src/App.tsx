
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { GlobalNotifications } from "@/components/notifications/GlobalNotifications";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
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
  LazyClassFinancialReportsPage,
  LazyAdminPrivilegesPage,
  LazyDailyExpensesPage,
  LazyExpensesPage,
  LazyTeacherDashboard,
  LazyStudentLoginPage,
  LazyStudentDashboard,
  LazyNotFound
} from "@/utils/lazyLoading";

import LoginPage from "./pages/LoginPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { AuditLogPage } from "./pages/AuditLogPage";
import DiagnosticsPage from "./pages/DiagnosticsPage";

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
    <Suspense fallback={<LoadingScreen />}>
      <UnifiedLayout>
        <Outlet />
      </UnifiedLayout>
    </Suspense>
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
        <AuditLogProvider>
          <TooltipProvider>
            <ToastEventListener />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/student-login" element={<LazyStudentLoginPage />} />

                {/* Protected routes with a single, top-level layout */}
                <Route element={<ProtectedLayout />}>
                  <Route index element={<RootRoute />} />
                  <Route path="booking" element={<LazyBookingPage />} />
                  <Route path="users" element={<LazyUsersPage />} />
                  <Route path="teachers" element={<LazyTeachersPage />} />
                  <Route path="halls" element={<LazyHallsPage />} />
                  <Route path="stages" element={<LazyStagesPage />} />
                  <Route path="subjects" element={<LazySubjectsPage />} />
                  <Route path="bookings" element={<LazyBookingsPage />} />
                  <Route path="students" element={<LazyStudentsPage />} />
                  <Route path="student-registrations" element={<LazyStudentRegistrationsPage />} />
          <Route path="monthly-reports" element={<LazyMonthlyReportsPage />} />
          <Route path="monthly-fee-manager" element={<LazyMonthlyFeeManager />} />
          <Route path="student-relocation" element={<LazyStudentRelocationManager />} />
          <Route path="attendance" element={<LazyAttendanceManagementPage />} />
                  <Route path="class-management/:bookingId" element={<LazyClassManagementPage />} />
                  <Route path="financial-reports" element={<LazyClassFinancialReportsPage />} />
                  <Route path="admin-privileges" element={<LazyAdminPrivilegesPage />} />
                  <Route path="expenses" element={<LazyExpensesPage />} />
                  <Route path="daily-expenses" element={<LazyDailyExpensesPage />} />
                  <Route path="student-dashboard" element={<LazyStudentDashboard />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="audit-logs" element={<AuditLogPage />} />
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
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
