import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { HallScheduleModal } from "@/components/hall/HallScheduleModal";
import { useAuth } from "@/hooks/useAuth";
import { getHalls } from "@/api/halls";

interface Hall {
  id: string;
  name: string;
  capacity: number;
}

interface OccupancyData {
  hall_id: string;
  hall_name: string;
  occupancy_percentage: number;
  occupied_slots: number;
  available_slots: number;
  working_hours_per_day: number;
  working_days_per_week: number;
}

interface HallsGridProps {
  occupancyData?: OccupancyData[];
}

export const HallsGrid = ({ occupancyData }: HallsGridProps) => {
  const [selectedHall, setSelectedHall] = useState<{ id: string; name: string } | null>(null);
  const { user } = useAuth();

  const { data: halls, isLoading, error } = useQuery({
    queryKey: ['halls'],
    queryFn: getHalls,
    enabled: !!user,
    staleTime: 30_000,
  });

  const getCapacityVariant = (capacity: number) => {
    if (capacity >= 70) return 'capacity-high';
    if (capacity >= 40) return 'capacity-medium';
    return 'capacity-low';
  };

  const getCapacityLabel = (capacity: number) => {
    if (capacity >= 70) return 'سعة كبيرة';
    if (capacity >= 40) return 'سعة متوسطة';
    return 'سعة صغيرة';
  };

  const getOccupancyForHall = (hallId: string) => {
    const hallOccupancy = occupancyData?.find(item => item.hall_id === hallId);
    
    if (!hallOccupancy) {
      return {
        percentage: 0,
        occupied_slots: 0,
        available_slots: 24,
        working_hours_per_day: 12,
        working_days_per_week: 2,
      };
    }
    
    // Use the actual data from the RPC function
    const occupied = Number(hallOccupancy.occupied_slots || 0);
    const available = Number(hallOccupancy.available_slots || 24);
    const percentage = Number(hallOccupancy.occupancy_percentage || 0);
    
    return {
      percentage,
      occupied_slots: occupied,
      available_slots: available,
      working_hours_per_day: Number(hallOccupancy.working_hours_per_day || 12),
      working_days_per_week: Number(hallOccupancy.working_days_per_week || 2),
    };
  };

  const getOccupancyColor = (percentage: number): string => {
    if (percentage >= 80) return 'text-red-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const handleHallClick = (hall: Hall) => {
    setSelectedHall({ id: hall.id, name: hall.name });
  };

  if (isLoading) {
    return (
      <div className="responsive-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} variant="elevated" className="animate-pulse">
            <CardHeader className="pb-4">
              <div className="skeleton-animate h-6 w-24 rounded"></div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="skeleton-animate h-4 w-20 rounded"></div>
              <div className="skeleton-animate h-4 w-16 rounded"></div>
              <div className="skeleton-animate h-8 w-full rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">خطأ في تحميل البيانات</p>
      </div>
    );
  }

  if (!halls || halls.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Users className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">لا توجد قاعات</h3>
        <p className="text-muted-foreground">لم يتم إضافة أي قاعات بعد</p>
      </div>
    );
  }

  return (
    <>
      <div className="responsive-grid">
        {halls?.map((hall) => {
          const occupancy = getOccupancyForHall(hall.id);
          return (
            <Card
              key={hall.id}
              variant="interactive"
              className="group relative overflow-hidden border-l-4 border-l-primary hover:border-l-primary-glow transition-all duration-300"
              onClick={() => handleHallClick(hall)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <CardHeader className="pb-4 relative z-10">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-200">
                    {hall.name}
                  </CardTitle>
                  <Badge 
                    className={`${getCapacityVariant(hall.capacity)} text-xs font-medium`}
                  >
                    {getCapacityLabel(hall.capacity)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4 relative z-10">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground">السعة الكاملة</div>
                      <div className="text-sm font-semibold">{hall.capacity} طالب</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-info/10 text-info">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground">الساعات المتاحة</div>
                      <div className="text-sm font-semibold">{occupancy.available_slots} ساعة/أسبوع</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-warning/10 text-warning">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground">الساعات المحجوزة</div>
                      <div className="text-sm font-semibold">{occupancy.occupied_slots} ساعة</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">نسبة الإشغال</span>
                    <span className={`text-sm font-bold px-2 py-1 rounded-full ${
                      occupancy.percentage >= 80 ? 'bg-destructive/10 text-destructive' :
                      occupancy.percentage >= 50 ? 'bg-warning/10 text-warning' : 
                      'bg-success/10 text-success'
                    }`}>
                      %{occupancy.percentage}
                    </span>
                  </div>
                  <div className="relative w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out relative ${
                        occupancy.percentage >= 80 ? 'bg-gradient-to-r from-destructive/80 to-destructive' :
                        occupancy.percentage >= 50 ? 'bg-gradient-to-r from-warning/80 to-warning' : 
                        'bg-gradient-to-r from-success/80 to-success'
                      }`}
                      style={{ width: `${Math.min(occupancy.percentage, 100)}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedHall && (
        <HallScheduleModal
          hallId={selectedHall.id}
          hallName={selectedHall.name}
          isOpen={!!selectedHall}
          onClose={() => setSelectedHall(null)}
        />
      )}
    </>
  );
};