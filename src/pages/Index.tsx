import { useAuth } from "@/hooks/useAuth";
import LoginPage from "@/pages/LoginPage";
import { Navbar } from "@/components/layout/Navbar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { HallsGrid } from "@/components/dashboard/HallsGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import AdminSetup from "@/components/AdminSetup";
import { UserUpgrade } from "@/components/UserUpgrade";

const Index = () => {
  const { user, profile, loading, isAdmin, isOwner, canManageUsers } = useAuth();
  const [hasError, setHasError] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  useEffect(() => {
    // Add error boundary logic
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    
    // Only show debug panel in development mode and for specific conditions
    const isDevelopment = import.meta.env.DEV;
    const isDebugUser = user?.email === 'admin@admin.com' || user?.email === 'hanyslmm@gmail.com';
    
    if (isDevelopment && isDebugUser && !isAdmin && !isOwner) {
      setShowDebugPanel(true);
    }
    return () => window.removeEventListener('error', handleError);
  }, [user, loading]);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">حدث خطأ غير متوقع</h1>
          <p className="text-muted-foreground mb-4">يرجى تحديث الصفحة والمحاولة مرة أخرى</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            تحديث الصفحة
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4 space-y-6">
          <Skeleton className="h-16 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <LoginPage />
        {import.meta.env.DEV && (
          <>
            <AdminSetup />
            <UserUpgrade />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Only show debug panel in development for specific users who need privilege upgrade */}
      {showDebugPanel && import.meta.env.DEV && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            <p className="text-sm">Debug mode detected. Need admin access?</p>
            <button 
              onClick={() => window.location.href = '/admin-privileges'}
              className="mt-2 bg-yellow-500 text-white px-3 py-1 rounded text-sm"
            >
              Fix Privileges
            </button>
          </div>
        </div>
      )}
      
      {(isAdmin || isOwner || canManageUsers) ? (
        <AdminSidebar>
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-primary">
                مرحباً بك في نادي العلوم
              </h1>
              <p className="text-muted-foreground text-lg">
                نظام إدارة وحجز القاعات التعليمية
              </p>
            </div>
            <StatsCards />
            <HallsGrid />
          </div>
        </AdminSidebar>
      ) : (
        <>
          <Navbar 
            userRole={profile?.user_role} 
            userName={profile?.full_name || profile?.email || undefined}
            isAdmin={isAdmin}
          />
          
          <main className="container mx-auto p-4 space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-primary">
                مرحباً بك في نادي العلوم
              </h1>
              <p className="text-muted-foreground text-lg">
                نظام إدارة وحجز القاعات التعليمية
              </p>
            </div>
            
            <StatsCards />
            <HallsGrid />
          </main>
        </>
      )}
    </div>
  );
};

export default Index;