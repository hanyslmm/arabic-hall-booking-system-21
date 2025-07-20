
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UnifiedLayout } from "@/components/layout/UnifiedLayout";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { CardDescription } from "@/components/ui/card";

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
      <UnifiedLayout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner />
        </div>
      </UnifiedLayout>
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

  // Fetch all bookings with financial data
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['financial-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          start_date,
          class_fee,
          student_count,
          halls(name),
          teachers(full_name),
          subjects(name),
          created_at
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Calculate total revenue
  const totalRevenue = bookings?.reduce((sum, booking) => sum + (booking.class_fee || 0), 0) || 0;

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
      <UnifiedLayout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner />
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">التقارير المالية</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">إجمالي الإيرادات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {totalRevenue.toLocaleString()} جنيه
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                من جميع الحجوزات
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">عدد الحجوزات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {bookings?.length || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                إجمالي الحجوزات
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">متوسط قيمة الحجز</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {bookings?.length ? Math.round(totalRevenue / bookings.length).toLocaleString() : 0} جنيه
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                للحجز الواحد
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>تقرير مفصل بالحجوزات</CardTitle>
            <CardDescription>
              جميع الحجوزات مع تفاصيل الأسعار
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>القاعة</TableHead>
                    <TableHead>المعلم</TableHead>
                    <TableHead>المادة</TableHead>
                    <TableHead>عدد الطلاب</TableHead>
                    <TableHead>السعر</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings?.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        {format(new Date(booking.start_date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>{booking.halls?.name}</TableCell>
                      <TableCell>{booking.teachers?.full_name}</TableCell>
                      <TableCell>{booking.subjects?.name}</TableCell>
                      <TableCell>{booking.student_count || 0}</TableCell>
                      <TableCell className="font-semibold">
                        {(booking.class_fee || 0).toLocaleString()} جنيه
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {bookings?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">لا توجد حجوزات</h3>
                <p>لم يتم إنشاء أي حجوزات بعد</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </UnifiedLayout>
  );
}
