import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, GraduationCap, Building } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const StatsCards = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [
        { count: hallsCount },
        { count: teachersCount },
        { count: stagesCount },
        { count: bookingsCount }
      ] = await Promise.all([
        supabase.from('halls').select('*', { count: 'exact', head: true }),
        supabase.from('teachers').select('*', { count: 'exact', head: true }),
        supabase.from('academic_stages').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'active')
      ]);

      return {
        halls: hallsCount || 0,
        teachers: teachersCount || 0,
        stages: stagesCount || 0,
        activeBookings: bookingsCount || 0
      };
    }
  });

  const statsData = [
    {
      title: "إجمالي القاعات",
      value: stats?.halls || 0,
      icon: Building,
      color: "text-primary"
    },
    {
      title: "المعلمين",
      value: stats?.teachers || 0,
      icon: GraduationCap,
      color: "text-success"
    },
    {
      title: "المراحل الدراسية",
      value: stats?.stages || 0,
      icon: Users,
      color: "text-warning"
    },
    {
      title: "الحجوزات النشطة",
      value: stats?.activeBookings || 0,
      icon: Calendar,
      color: "text-destructive"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsData.map((stat, index) => (
        <Card key={index} className="card-elevated">
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
};