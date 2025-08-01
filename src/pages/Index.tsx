import { useAuth } from "@/hooks/useAuth";
import LoginPage from "@/pages/LoginPage";
import { UnifiedLayout } from "@/components/layout/UnifiedLayout";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { HallsGrid } from "@/components/dashboard/HallsGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState, useMemo } from "react";
import AdminSetup from "@/components/AdminSetup";
import { UserUpgrade } from "@/components/UserUpgrade";
import { APP_CONFIG } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { STALE_TIME, RETRY_CONFIG } from "@/utils/constants";

const Index = () => {
  const { user, loading } = useAuth();
  const [hasError, setHasError] = useState(false);

  // Fetch actual occupancy data based on student registrations
  const { data: occupancyData } = useQuery({
    queryKey: ['hall-actual-occupancy'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_hall_actual_occupancy_updated');
      if (error) throw error;
      return data as Array<{ hall_id: string; hall_name: string; capacity: number; registered_students: number; occupancy_percentage: number }>;
    },
    enabled: !!user,
    staleTime: STALE_TIME.LONG,
    retry: RETRY_CONFIG.DEFAULT,
  });

  // Calculate average occupancy with memoization
  const averageOccupancy = useMemo(() => {
    return occupancyData && occupancyData.length > 0 
      ? Math.round(occupancyData.reduce((sum, hall) => sum + hall.occupancy_percentage, 0) / occupancyData.length)
      : 0;
  }, [occupancyData]);
  useEffect(() => {
    // Add error boundary logic
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    
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
    return <LoginPage />;
  }

  return (
    <UnifiedLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">لوحة التحكم</h1>
        </div>

        <StatsCards averageOccupancy={averageOccupancy} />

        <HallsGrid occupancyData={occupancyData?.map(h => ({ 
          hall_id: h.hall_id, 
          name: h.hall_name, 
          occupancy_percentage: h.occupancy_percentage 
        })) || []} />
      </div>
    </UnifiedLayout>
  );
};

export default Index;