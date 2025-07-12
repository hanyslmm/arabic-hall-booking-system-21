
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Users, GraduationCap } from "lucide-react";
import { formatShortArabicDate, formatArabicTime } from "@/utils/dateUtils";

interface HallScheduleModalProps {
  hallId: string | null;
  hallName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface BookingWithDetails {
  id: string;
  start_time: string;
  days_of_week: string[];
  start_date: string;
  end_date: string | null;
  number_of_students: number;
  status: string;
  teachers: { name: string };
  academic_stages: { name: string };
}

const DAYS_MAP = {
  sunday: 'الأحد',
  monday: 'الاثنين',
  tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء',
  thursday: 'الخميس',
  friday: 'الجمعة',
  saturday: 'السبت',
};

export const HallScheduleModal = ({ hallId, hallName, isOpen, onClose }: HallScheduleModalProps) => {
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['hall-schedule', hallId],
    queryFn: async () => {
      if (!hallId) return [];
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          teachers(name),
          academic_stages(name)
        `)
        .eq('hall_id', hallId)
        .eq('status', 'active')
        .order('start_time');
      
      if (error) throw error;
      return data as BookingWithDetails[];
    },
    enabled: !!hallId,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            جدول أوقات قاعة {hallName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <p>جاري تحميل الجدول...</p>
            </div>
          ) : bookings && bookings.length > 0 ? (
            <div className="grid gap-4">
              {bookings.map((booking) => (
                <Card key={booking.id} className="border-r-4 border-r-primary">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        {formatArabicTime(booking.start_time)}
                      </CardTitle>
                      <Badge variant="outline" className="bg-success/10 text-success border-success">
                        نشط
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">المعلم:</span>
                        <span className="font-medium">{booking.teachers.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">عدد الطلاب:</span>
                        <span className="font-medium">{booking.number_of_students}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">المرحلة:</span>
                        <span className="font-medium">{booking.academic_stages.name}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">أيام الأسبوع:</span>
                        <div className="flex flex-wrap gap-1">
                          {booking.days_of_week.map((day) => (
                            <Badge key={day} variant="secondary" className="text-xs">
                              {DAYS_MAP[day as keyof typeof DAYS_MAP] || day}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          من: <span className="font-medium">{formatShortArabicDate(booking.start_date)}</span>
                        </span>
                        {booking.end_date && (
                          <span className="text-muted-foreground">
                            إلى: <span className="font-medium">{formatShortArabicDate(booking.end_date)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">لا توجد حجوزات نشطة لهذه القاعة</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
