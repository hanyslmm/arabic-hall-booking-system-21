import { useAuth } from "@/hooks/useAuth";
import LoginPage from "@/pages/LoginPage";
import { AuthForm } from "@/components/auth/AuthForm";
import { Navbar } from "@/components/layout/Navbar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { HallsGrid } from "@/components/dashboard/HallsGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { AdminSetup } from "@/components/AdminSetup";
import { UserUpgrade } from "@/components/UserUpgrade";

const Index = () => {
  const { user, profile, loading, isAdmin } = useAuth();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Add error boundary logic
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

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
        <AdminSetup />
        <UserUpgrade />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {isAdmin ? (
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
