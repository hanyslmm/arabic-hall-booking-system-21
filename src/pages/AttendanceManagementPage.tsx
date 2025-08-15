import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Users, Clock, CheckCircle, XCircle, Filter } from 'lucide-react';
import { format, startOfWeek, addDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';

interface Student {
  id: string;
  name: string;
  serial_number: string;
  mobile_phone: string;
  parent_phone?: string;
}

interface Booking {
  id: string;
  teacher_id: string;
  teacher: { name: string };
  hall: { name: string };
  subject: { name: string };
  days_of_week: string[];
  start_time: string;
  class_code: string;
}

interface StudentRegistration {
  id: string;
  student: Student;
  booking: Booking;
}

interface AttendanceRecord {
  id: string;
  student_registration_id: string;
  attendance_date: string;
  status: 'present' | 'absent';
  notes?: string;
}

const AttendanceManagementPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedClass, setSelectedClass] = useState<string>('all');

  // Get today's day of week in Arabic format
  const getDayOfWeek = (date: string) => {
    const dayNames = {
      'sunday': 'الأحد',
      'monday': 'الاثنين', 
      'tuesday': 'الثلاثاء',
      'wednesday': 'الأربعاء',
      'thursday': 'الخميس',
      'friday': 'الجمعة',
      'saturday': 'السبت'
    };
    
    const dateObj = new Date(date);
    const englishDay = format(dateObj, 'EEEE').toLowerCase();
    return dayNames[englishDay as keyof typeof dayNames] || englishDay;
  };

  // Get English day name for filtering
  const getEnglishDayName = (date: string) => {
    const dateObj = new Date(date);
    return format(dateObj, 'EEEE').toLowerCase();
  };

  // Fetch student registrations for the selected date
  const { data: studentRegistrations = [], isLoading } = useQuery({
    queryKey: ['student-registrations', selectedDate, selectedClass],
    queryFn: async () => {
      const dayOfWeek = getEnglishDayName(selectedDate);
      
      let query = supabase
        .from('student_registrations')
        .select(`
          id,
          student:students(id, name, serial_number, mobile_phone, parent_phone),
          booking:bookings(
            id,
            teacher_id,
            days_of_week,
            start_time,
            class_code,
            teacher:teachers(name),
            hall:halls(name),
            academic_stage:academic_stages(name)
          )
        `)
        .eq('booking.status', 'active');

      const { data, error } = await query;
      if (error) throw error;

      // Filter by day of week and selected class
      return data?.filter((reg: any) => {
        const hasMatchingDay = reg.booking?.days_of_week?.includes(dayOfWeek);
        const matchesClass = selectedClass === 'all' || reg.booking?.id === selectedClass;
        return hasMatchingDay && matchesClass;
      }) || [];
    }
  });

  // Fetch attendance records for the selected date
  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ['attendance-records', selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('attendance_date', selectedDate);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch available classes/bookings for filter
  const { data: availableClasses = [] } = useQuery({
    queryKey: ['available-classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          class_code,
          teacher:teachers(name),
          hall:halls(name),
          academic_stage:academic_stages(name)
        `)
        .eq('status', 'active');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Create or update attendance record
  const attendanceMutation = useMutation({
    mutationFn: async ({ 
      studentRegistrationId, 
      status, 
      notes = '' 
    }: { 
      studentRegistrationId: string; 
      status: 'present' | 'absent'; 
      notes?: string;
    }) => {
      // Check if attendance record already exists
      const existingRecord = attendanceRecords.find(
        record => record.student_registration_id === studentRegistrationId
      );

      if (existingRecord) {
        // Update existing record
        const { data, error } = await supabase
          .from('attendance_records')
          .update({ 
            status, 
            notes,
            created_by: (await supabase.auth.getUser()).data.user?.id 
          })
          .eq('id', existingRecord.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('attendance_records')
          .insert({
            student_registration_id: studentRegistrationId,
            attendance_date: selectedDate,
            status,
            notes,
            created_by: (await supabase.auth.getUser()).data.user?.id
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-records', selectedDate] });
      toast({
        title: "تم تسجيل الحضور",
        description: "تم تحديث سجل الحضور بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ في تسجيل الحضور",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const getAttendanceStatus = (studentRegistrationId: string) => {
    const record = attendanceRecords.find(
      record => record.student_registration_id === studentRegistrationId
    );
    return record?.status || 'not_recorded';
  };

  const handleAttendanceToggle = (studentRegistrationId: string, currentStatus: string) => {
    let newStatus: 'present' | 'absent';
    
    if (currentStatus === 'not_recorded' || currentStatus === 'absent') {
      newStatus = 'present';
    } else {
      newStatus = 'absent';
    }

    attendanceMutation.mutate({ studentRegistrationId, status: newStatus });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 border-green-200';
      case 'absent': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-4 h-4" />;
      case 'absent': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present': return 'حاضر';
      case 'absent': return 'غائب';
      default: return 'لم يتم التسجيل';
    }
  };

  return (
    <UnifiedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة الحضور</h1>
          <p className="text-muted-foreground">
            تسجيل وإدارة حضور الطلاب للفصول اليومية
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              تصفية البيانات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">التاريخ</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="class">الفصل</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفصل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الفصول</SelectItem>
                    {availableClasses.map((cls: any) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.class_code} - {cls.teacher?.name} - {cls.hall?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>اليوم المحدد</Label>
                <div className="p-2 bg-muted rounded-md text-center">
                  <span className="font-medium">{getDayOfWeek(selectedDate)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              قائمة الطلاب ({studentRegistrations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">جاري التحميل...</div>
            ) : studentRegistrations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد فصول مجدولة لهذا اليوم
              </div>
            ) : (
              <div className="space-y-4">
                {studentRegistrations.map((registration: any) => {
                  const attendanceStatus = getAttendanceStatus(registration.id);
                  return (
                    <div
                      key={registration.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="font-medium">{registration.student?.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              رقم التسلسل: {registration.student?.serial_number}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>الفصل: {registration.booking?.class_code}</span>
                          <span>المعلم: {registration.booking?.teacher?.name}</span>
                          <span>القاعة: {registration.booking?.hall?.name}</span>
                          <span>الوقت: {registration.booking?.start_time}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <span>جوال الطالب:</span>
                          <span className="font-mono">{registration.student?.mobile_phone}</span>
                          {registration.student?.parent_phone && (
                            <>
                              <Separator orientation="vertical" className="h-4" />
                              <span>جوال الولي:</span>
                              <span className="font-mono">{registration.student.parent_phone}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge className={`${getStatusColor(attendanceStatus)} flex items-center gap-1`}>
                          {getStatusIcon(attendanceStatus)}
                          {getStatusText(attendanceStatus)}
                        </Badge>
                        
                        <Button
                          variant={attendanceStatus === 'present' ? 'outline' : 'default'}
                          size="sm"
                          onClick={() => handleAttendanceToggle(registration.id, attendanceStatus)}
                          disabled={attendanceMutation.isPending}
                        >
                          {attendanceStatus === 'present' ? 'تعيين غياب' : 'تعيين حضور'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </UnifiedLayout>
  );
};

export default AttendanceManagementPage;