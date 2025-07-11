
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Users, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Booking {
  id: string;
  start_date: string;
  end_date: string | null;
  start_time: string;
  days_of_week: string[];
  number_of_students: number;
  status: 'active' | 'cancelled' | 'completed';
  created_at: string;
  halls: {
    name: string;
    capacity: number;
  };
  teachers: {
    name: string;
  };
  academic_stages: {
    name: string;
  };
}

const BookingsPage = () => {
  const { profile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          halls(name, capacity),
          teachers(name),
          academic_stages(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Booking[];
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">ملغي</Badge>;
      case 'completed':
        return <Badge variant="secondary">مكتمل</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDaysInArabic = (days: string[]) => {
    const dayMap: Record<string, string> = {
      'sunday': 'الأحد',
      'monday': 'الإثنين',
      'tuesday': 'الثلاثاء',
      'wednesday': 'الأربعاء',
      'thursday': 'الخميس',
      'friday': 'الجمعة',
      'saturday': 'السبت'
    };
    return days.map(day => dayMap[day] || day).join(', ');
  };

  const canManage = profile?.user_role === 'owner' || profile?.user_role === 'manager' || isAdmin;

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        userRole={profile?.user_role} 
        userName={profile?.full_name || profile?.email || undefined}
        isAdmin={isAdmin}
      />
      
      <main className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">الحجوزات النشطة</h1>
            <p className="text-muted-foreground mt-2">
              عرض وإدارة حجوزات القاعات
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span className="font-semibold">{bookings?.length || 0} حجز</span>
            </div>
            {canManage && (
              <Button onClick={() => navigate('/booking')}>
                حجز جديد
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>قائمة الحجوزات</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p>جاري تحميل الحجوزات...</p>
              </div>
            ) : bookings?.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">لا توجد حجوزات</h3>
                <p className="text-muted-foreground mb-4">
                  لم يتم إنشاء أي حجوزات بعد
                </p>
                {canManage && (
                  <Button onClick={() => navigate('/booking')}>
                    إنشاء حجز جديد
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">القاعة</TableHead>
                      <TableHead className="text-right">المعلم</TableHead>
                      <TableHead className="text-right">المرحلة</TableHead>
                      <TableHead className="text-right">التوقيت</TableHead>
                      <TableHead className="text-right">الأيام</TableHead>
                      <TableHead className="text-right">عدد الطلاب</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings?.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {booking.halls.name}
                          </div>
                        </TableCell>
                        <TableCell>{booking.teachers.name}</TableCell>
                        <TableCell>{booking.academic_stages.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {booking.start_time}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getDaysInArabic(booking.days_of_week)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {booking.number_of_students}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(booking.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default BookingsPage;
