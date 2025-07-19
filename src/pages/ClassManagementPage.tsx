import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Navbar } from '@/components/layout/Navbar';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ArrowLeft, Plus, Save, DollarSign, Users, Calendar } from 'lucide-react';
import { bookingsApi } from '@/api/bookings';
import { studentRegistrationsApi, attendanceApi, paymentsApi } from '@/api/students';
import { studentsApi } from '@/api/students';
import { format } from 'date-fns';

interface AttendanceRecord {
  student_registration_id: string;
  attendance_date: string;
  status: 'present' | 'absent' | 'late';
  notes?: string;
}

interface PaymentRecord {
  student_registration_id: string;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'card' | 'transfer' | 'other';
  reference_number?: string;
  notes?: string;
}

export default function ClassManagementPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceRecord>>({});
  const [paymentData, setPaymentData] = useState<Record<string, PaymentRecord>>({});
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [customFees, setCustomFees] = useState<Record<string, number>>({});

  // Fetch booking details
  const { data: booking, isLoading: isLoadingBooking } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingsApi.getById(bookingId!),
    enabled: !!bookingId,
  });

  // Fetch registrations for this booking
  const { data: registrations, isLoading: isLoadingRegistrations } = useQuery({
    queryKey: ['registrations', bookingId],
    queryFn: () => studentRegistrationsApi.getByBooking(bookingId!),
    enabled: !!bookingId,
  });

  // Fetch all students for adding new ones
  const { data: allStudents } = useQuery({
    queryKey: ['students'],
    queryFn: studentsApi.getAll,
  });

  // Add student to class mutation
  const addStudentMutation = useMutation({
    mutationFn: (data: { student_id: string; booking_id: string; total_fees: number }) =>
      studentRegistrationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations', bookingId] });
      setIsAddStudentOpen(false);
      setSelectedStudentId('');
      toast({ title: 'تم إضافة الطالب بنجاح' });
    },
    onError: () => {
      toast({ title: 'خطأ في إضافة الطالب', variant: 'destructive' });
    },
  });

  // Remove student mutation
  const removeStudentMutation = useMutation({
    mutationFn: studentRegistrationsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations', bookingId] });
      toast({ title: 'تم حذف الطالب بنجاح' });
    },
    onError: () => {
      toast({ title: 'خطأ في حذف الطالب', variant: 'destructive' });
    },
  });

  // Save attendance mutation
  const saveAttendanceMutation = useMutation({
    mutationFn: attendanceApi.bulkCreate,
    onSuccess: () => {
      toast({ title: 'تم حفظ الحضور بنجاح' });
      setAttendanceData({});
    },
    onError: () => {
      toast({ title: 'خطأ في حفظ الحضور', variant: 'destructive' });
    },
  });

  // Save payment mutation
  const savePaymentMutation = useMutation({
    mutationFn: paymentsApi.bulkCreate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations', bookingId] });
      toast({ title: 'تم حفظ المدفوعات بنجاح' });
      setPaymentData({});
    },
    onError: () => {
      toast({ title: 'خطأ في حفظ المدفوعات', variant: 'destructive' });
    },
  });

  const handleAttendanceChange = (registrationId: string, status: 'present' | 'absent' | 'late') => {
    setAttendanceData(prev => ({
      ...prev,
      [registrationId]: {
        student_registration_id: registrationId,
        attendance_date: format(new Date(), 'yyyy-MM-dd'),
        status,
      }
    }));
  };

  const handlePaymentChange = (registrationId: string, amount: number) => {
    setPaymentData(prev => ({
      ...prev,
      [registrationId]: {
        student_registration_id: registrationId,
        amount,
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        payment_method: 'cash',
      }
    }));
  };

  const handleAddStudent = () => {
    if (!selectedStudentId || !booking) return;
    
    const fees = customFees[selectedStudentId] || booking.class_fees || 0;
    
    addStudentMutation.mutate({
      student_id: selectedStudentId,
      booking_id: bookingId!,
      total_fees: fees,
    });
  };

  const saveAttendance = () => {
    const records = Object.values(attendanceData);
    if (records.length === 0) {
      toast({ title: 'لا توجد بيانات حضور للحفظ', variant: 'destructive' });
      return;
    }
    saveAttendanceMutation.mutate(records);
  };

  const savePayments = () => {
    const records = Object.values(paymentData);
    if (records.length === 0) {
      toast({ title: 'لا توجد مدفوعات للحفظ', variant: 'destructive' });
      return;
    }
    savePaymentMutation.mutate(records);
  };

  if (isLoadingBooking || isLoadingRegistrations) {
    return <LoadingSpinner />;
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">الحجز غير موجود</h1>
          </div>
        </div>
      </div>
    );
  }

  const availableStudents = allStudents?.filter(student => 
    !registrations?.some(reg => reg.student?.id === student.id)
  ) || [];

  const totalPaid = registrations?.reduce((sum, reg) => sum + (reg.paid_amount || 0), 0) || 0;
  const totalFees = registrations?.reduce((sum, reg) => sum + (reg.total_fees || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/bookings')}>
            <ArrowLeft className="h-4 w-4 ml-2" />
            العودة للحجوزات
          </Button>
          <h1 className="text-3xl font-bold">إدارة الصف</h1>
        </div>

        {/* Class Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              معلومات الصف
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">القاعة</Label>
                <p className="text-lg">{booking.halls?.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">المدرس</Label>
                <p className="text-lg">{booking.teachers?.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">الوقت</Label>
                <p className="text-lg">{booking.start_time}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">الأيام</Label>
                <p className="text-lg">{booking.days_of_week?.join(', ')}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">رسوم الصف</Label>
                <p className="text-lg">{booking.class_fees || 0} ر.س</p>
              </div>
              <div>
                <Label className="text-sm font-medium">عدد الطلاب</Label>
                <p className="text-lg">{registrations?.length || 0} طالب</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              الملخص المالي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">إجمالي الرسوم</p>
                <p className="text-2xl font-bold text-primary">{totalFees} ر.س</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">المدفوع</p>
                <p className="text-2xl font-bold text-green-600">{totalPaid} ر.س</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">المتبقي</p>
                <p className="text-2xl font-bold text-orange-600">{totalFees - totalPaid} ر.س</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Management */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              إدارة الطلاب
            </CardTitle>
            <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة طالب
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إضافة طالب للصف</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>اختر الطالب</Label>
                    <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر طالب" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStudents.map(student => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name} - {student.serial_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedStudentId && (
                    <div>
                      <Label>الرسوم (اختياري - سيتم استخدام رسوم الصف الافتراضية)</Label>
                      <Input
                        type="number"
                        placeholder={`${booking.class_fees || 0}`}
                        value={customFees[selectedStudentId] || ''}
                        onChange={(e) => setCustomFees(prev => ({
                          ...prev,
                          [selectedStudentId]: Number(e.target.value) || 0
                        }))}
                      />
                    </div>
                  )}
                  <Button 
                    onClick={handleAddStudent} 
                    disabled={!selectedStudentId || addStudentMutation.isPending}
                    className="w-full"
                  >
                    إضافة الطالب
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {registrations && registrations.length > 0 ? (
              <div className="space-y-4">
                {/* Attendance Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">تسجيل الحضور</h3>
                  <Button onClick={saveAttendance} disabled={Object.keys(attendanceData).length === 0}>
                    <Save className="h-4 w-4 ml-2" />
                    حفظ الحضور
                  </Button>
                </div>

                {/* Students Table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-right p-3">الطالب</th>
                        <th className="text-right p-3">الرقم التسلسلي</th>
                        <th className="text-right p-3">الرسوم</th>
                        <th className="text-right p-3">المدفوع</th>
                        <th className="text-right p-3">الحالة</th>
                        <th className="text-center p-3">الحضور اليوم</th>
                        <th className="text-center p-3">دفع اليوم</th>
                        <th className="text-center p-3">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.map((registration) => (
                        <tr key={registration.id} className="border-t">
                          <td className="p-3">{registration.student?.name}</td>
                          <td className="p-3">{registration.student?.serial_number}</td>
                          <td className="p-3">{registration.total_fees} ر.س</td>
                          <td className="p-3">{registration.paid_amount} ر.س</td>
                          <td className="p-3">
                            <Badge 
                              variant={
                                registration.payment_status === 'paid' ? 'default' :
                                registration.payment_status === 'partial' ? 'secondary' : 'destructive'
                              }
                            >
                              {registration.payment_status === 'paid' ? 'مدفوع' :
                               registration.payment_status === 'partial' ? 'جزئي' : 'غير مدفوع'}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {['present', 'absent', 'late'].map((status) => (
                                <label key={status} className="flex items-center gap-1 text-sm">
                                  <Checkbox
                                    checked={attendanceData[registration.id]?.status === status}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        handleAttendanceChange(registration.id, status as any);
                                      }
                                    }}
                                  />
                                  {status === 'present' ? 'حاضر' : 
                                   status === 'absent' ? 'غائب' : 'متأخر'}
                                </label>
                              ))}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <Input
                              type="number"
                              placeholder="المبلغ"
                              className="w-20 mx-auto"
                              value={paymentData[registration.id]?.amount || ''}
                              onChange={(e) => handlePaymentChange(registration.id, Number(e.target.value) || 0)}
                            />
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeStudentMutation.mutate(registration.id)}
                            >
                              حذف
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Payment Actions */}
                <div className="flex justify-end">
                  <Button 
                    onClick={savePayments} 
                    disabled={Object.keys(paymentData).length === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-4 w-4 ml-2" />
                    حفظ المدفوعات
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">لا يوجد طلاب مسجلين في هذا الصف</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}