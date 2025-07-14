
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, GraduationCap, Building, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

interface StatsCardsProps {
  averageOccupancy?: number;
}

export const StatsCards = ({ averageOccupancy = 0 }: StatsCardsProps) => {
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [
        { count: hallsCount },
        { count: teachersCount },
        { count: stagesCount },
        { count: bookingsCount },
        workingHoursData,
        bookingsData
      ] = await Promise.all([
        supabase.from('halls').select('*', { count: 'exact', head: true }),
        supabase.from('teachers').select('*', { count: 'exact', head: true }),
        supabase.from('academic_stages').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('working_hours').select('*'),
        supabase.from('bookings').select('hall_id, start_time, days_of_week').eq('status', 'active')
      ]);

      // Calculate occupancy ratio
      const totalWorkingHours = workingHoursData.data?.length || 0;
      const totalBookedSlots = bookingsData.data?.reduce((acc: number, booking: any) => {
        return acc + (booking.days_of_week?.length || 0);
      }, 0) || 0;
      
      const occupancyRatio = totalWorkingHours > 0 ? Math.round((totalBookedSlots / totalWorkingHours) * 100) : 0;

      return {
        halls: hallsCount || 0,
        teachers: teachersCount || 0,
        stages: stagesCount || 0,
        activeBookings: bookingsCount || 0,
        occupancyRatio
      };
    }
  });

  const statsData = [
    {
      title: "إجمالي القاعات",
      value: stats?.halls || 0,
      icon: Building,
      color: "text-primary",
      onClick: () => navigate('/halls')
    },
    {
      title: "المعلمين",
      value: stats?.teachers || 0,
      icon: GraduationCap,
      color: "text-success",
      onClick: () => navigate('/teachers')
    },
    {
      title: "المراحل الدراسية",
      value: stats?.stages || 0,
      icon: Users,
      color: "text-warning",
      onClick: () => navigate('/stages')
    },
    {
      title: "الحجوزات النشطة",
      value: stats?.activeBookings || 0,
      icon: Calendar,
      color: "text-destructive",
      onClick: () => navigate('/bookings')
    },
    {
      title: "نسبة الاشغال",
      value: `${averageOccupancy}%`,
      icon: Activity,
      color: "text-orange-600",
      onClick: () => navigate('/halls')
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {statsData.map((stat, index) => (
        <Card 
          key={index} 
          className="card-elevated cursor-pointer hover:shadow-lg transition-shadow"
          onClick={stat.onClick}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stat.value}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              انقر للعرض التفصيلي
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
