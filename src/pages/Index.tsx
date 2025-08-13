import { useAuth } from "@/hooks/useAuth";
import { UnifiedLayout } from "@/components/layout/UnifiedLayout";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const Index = () => {
  const { user, loading, profile } = useAuth();
  const [hasError, setHasError] = useState(false);
  
  console.log('Index component rendering...', { user: !!user, loading });

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
    console.log('No user, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  console.log('User authenticated, showing dashboard');
  
  // Teachers get their own dashboard through UnifiedLayout, so return empty content
  if (profile?.user_role === 'teacher') {
    return <UnifiedLayout><div /></UnifiedLayout>;
  }
  
  return (
    <UnifiedLayout>
      <AdminDashboard />
    </UnifiedLayout>
  );
};

export default Index;