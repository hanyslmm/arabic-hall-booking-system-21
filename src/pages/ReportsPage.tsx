
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Download, BarChart3, Users, Calendar, Building2 } from "lucide-react";
import { format } from "date-fns";

interface BookingReport {
  id: string;
  hall_name: string;
  teacher_name: string;
  stage_name: string;
  start_time: string;
  days_of_week: string[];
  number_of_students: number;
  status: string;
  created_at: string;
}

interface DashboardStats {
  totalBookings: number;
  activeBookings: number;
  totalTeachers: number;
  totalHalls: number;
}

export function ReportsPage() {
  const { user, isAdmin, isOwner, canManageUsers, loading } = useAuth();

  const hasAdminAccess = isAdmin || isOwner || canManageUsers;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">جاري التحميل...</div>
        </div>
      </AppLayout>
    );
  }

  if (!user || !hasAdminAccess) {
    return <Navigate to="/login" replace />;
  }

  // Fetch dashboard statistics
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [bookingsRes, teachersRes, hallsRes] = await Promise.all([
        supabase.from('bookings').select('id, status'),
        supabase.from('teachers').select('id'),
        supabase.from('halls').select('id')
      ]);

      const totalBookings = bookingsRes.data?.length || 0;
      const activeBookings = bookingsRes.data?.filter(b => b.status === 'active').length || 0;
      const totalTeachers = teachersRes.data?.length || 0;
      const totalHalls = hallsRes.data?.length || 0;

      return {
        totalBookings,
        activeBookings,
        totalTeachers,
        totalHalls
      } as DashboardStats;
    }
  });

  // Fetch all bookings with related data
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          start_time,
          days_of_week,
          number_of_students,
          status,
          created_at,
          halls!inner(name),
          teachers!inner(name),
          academic_stages!inner(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(booking => ({
        id: booking.id,
        hall_name: booking.halls.name,
        teacher_name: booking.teachers.name,
        stage_name: booking.academic_stages.name,
        start_time: booking.start_time,
        days_of_week: booking.days_of_week,
        number_of_students: booking.number_of_students,
        status: booking.status,
        created_at: booking.created_at
      })) as BookingReport[];
    }
  });

  const getDaysInArabic = (days: string[]) => {
    const dayMap: { [key: string]: string } = {
      'sunday': 'الأحد',
      'monday': 'الاثنين',
      'tuesday': 'الثلاثاء',
      'wednesday': 'الأربعاء',
      'thursday': 'الخميس',
      'friday': 'الجمعة',
      'saturday': 'السبت'
    };
    return days.map(day => dayMap[day] || day).join(', ');
  };

  const getStatusInArabic = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'active': 'نشط',
      'cancelled': 'ملغي',
      'completed': 'مكتمل'
    };
    return statusMap[status] || status;
  };

  const exportToCSV = () => {
    if (!bookings || bookings.length === 0) return;

    const headers = [
      'ID',
      'اسم القاعة',
      'اسم المدرس',
      'المرحلة الدراسية',
      'وقت البداية',
      'الأيام',
      'عدد الطلاب',
      'الحالة',
      'تاريخ الإنشاء'
    ];

    const csvContent = [
      headers.join(','),
      ...bookings.map(booking => [
        booking.id,
        booking.hall_name,
        booking.teacher_name,
        booking.stage_name,
        booking.start_time,
        `"${getDaysInArabic(booking.days_of_week)}"`,
        booking.number_of_students,
        getStatusInArabic(booking.status),
        format(new Date(booking.created_at), 'yyyy-MM-dd HH:mm:ss')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bookings-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">جاري التحميل...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">التقارير والإحصائيات</h1>
          <Button onClick={exportToCSV} disabled={!bookings || bookings.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            تصدير إلى CSV
          </Button>
        </div>

        {/* Dashboard Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الحجوزات</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalBookings || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الحجوزات النشطة</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeBookings || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">عدد المعلمين</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalTeachers || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">عدد القاعات</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalHalls || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Bookings Report Table */}
        <Card>
          <CardHeader>
            <CardTitle>تقرير الحجوزات التفصيلي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>القاعة</TableHead>
                    <TableHead>المدرس</TableHead>
                    <TableHead>المرحلة</TableHead>
                    <TableHead>الوقت</TableHead>
                    <TableHead>الأيام</TableHead>
                    <TableHead>عدد الطلاب</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ الإنشاء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings?.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>{booking.hall_name}</TableCell>
                      <TableCell>{booking.teacher_name}</TableCell>
                      <TableCell>{booking.stage_name}</TableCell>
                      <TableCell>{booking.start_time}</TableCell>
                      <TableCell>{getDaysInArabic(booking.days_of_week)}</TableCell>
                      <TableCell>{booking.number_of_students}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          booking.status === 'active' ? 'bg-green-100 text-green-800' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {getStatusInArabic(booking.status)}
                        </span>
                      </TableCell>
                      <TableCell>{format(new Date(booking.created_at), 'yyyy-MM-dd HH:mm')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {(!bookings || bookings.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد حجوزات للعرض
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
