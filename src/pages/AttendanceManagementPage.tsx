import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, CheckCircle, XCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { UnifiedLayout } from "@/components/layout/UnifiedLayout";
import { toast } from "sonner";

export default function AttendanceManagementPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedBooking, setSelectedBooking] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Get active bookings
  const { data: bookings = [] } = useQuery({
    queryKey: ['attendance-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          class_code,
          halls(name),
          teachers(name),
          academic_stages(name)
        `)
        .eq('status', 'active');
      
      if (error) throw error;
      return data;
    }
  });

  // Get students for selected booking
  const { data: students = [] } = useQuery({
    queryKey: ['attendance-students', selectedBooking],
    queryFn: async () => {
      if (!selectedBooking) return [];
      
      const { data, error } = await supabase
        .from('student_registrations')
        .select(`
          id,
          students(id, name, serial_number)
        `)
        .eq('booking_id', selectedBooking);
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBooking
  });

  // Get attendance records for selected date and booking
  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ['attendance-records', selectedBooking, selectedDate],
    queryFn: async () => {
      if (!selectedBooking) return [];
      
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('date', selectedDate)
        .in('student_registration_id', students.map(s => s.id));
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBooking && students.length > 0
  });

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: async ({ studentRegistrationId, status, notes }: { 
      studentRegistrationId: string; 
      status: 'present' | 'absent' | 'late'; 
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('attendance_records')
        .upsert({
          student_registration_id: studentRegistrationId,
          date: selectedDate,
          status,
          notes,
          created_by: profile?.id
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      toast.success('تم تسجيل الحضور بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ في تسجيل الحضور');
    }
  });

  const getAttendanceStatus = (studentRegistrationId: string) => {
    return attendanceRecords.find(record => record.student_registration_id === studentRegistrationId)?.status;
  };

  const getStatusBadge = (status?: 'present' | 'absent' | 'late') => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800">حاضر</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-800">غائب</Badge>;
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-800">متأخر</Badge>;
      default:
        return <Badge variant="secondary">لم يتم التسجيل</Badge>;
    }
  };

  const attendanceStats = {
    total: students.length,
    present: attendanceRecords.filter(r => r.status === 'present').length,
    absent: attendanceRecords.filter(r => r.status === 'absent').length,
    late: attendanceRecords.filter(r => r.status === 'late').length
  };

  return (
    <UnifiedLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">إدارة الحضور</h1>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedBooking} onValueChange={setSelectedBooking}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="اختر الفصل" />
            </SelectTrigger>
            <SelectContent>
              {bookings.map((booking) => (
                <SelectItem key={booking.id} value={booking.id}>
                  {booking.class_code} - {booking.teachers?.name} - {booking.halls?.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedBooking && (
          <>
            {/* Attendance Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي الطلاب</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{attendanceStats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">الحاضرون</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{attendanceStats.present}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">الغائبون</CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{attendanceStats.absent}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">المتأخرون</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{attendanceStats.late}</div>
                </CardContent>
              </Card>
            </div>

            {/* Students List */}
            <Card>
              <CardHeader>
                <CardTitle>قائمة الطلاب</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">{student.students?.name}</p>
                          <p className="text-sm text-muted-foreground">الرقم التسلسلي: {student.students?.serial_number}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getStatusBadge(getAttendanceStatus(student.id))}
                        
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant={getAttendanceStatus(student.id) === 'present' ? 'default' : 'outline'}
                            onClick={() => markAttendanceMutation.mutate({
                              studentRegistrationId: student.id,
                              status: 'present'
                            })}
                          >
                            حاضر
                          </Button>
                          
                          <Button
                            size="sm"
                            variant={getAttendanceStatus(student.id) === 'late' ? 'default' : 'outline'}
                            onClick={() => markAttendanceMutation.mutate({
                              studentRegistrationId: student.id,
                              status: 'late'
                            })}
                          >
                            متأخر
                          </Button>
                          
                          <Button
                            size="sm"
                            variant={getAttendanceStatus(student.id) === 'absent' ? 'destructive' : 'outline'}
                            onClick={() => markAttendanceMutation.mutate({
                              studentRegistrationId: student.id,
                              status: 'absent'
                            })}
                          >
                            غائب
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </UnifiedLayout>
  );
}