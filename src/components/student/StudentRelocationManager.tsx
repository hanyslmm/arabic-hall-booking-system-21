import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, ArrowRight, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function StudentRelocationManager() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedNewBooking, setSelectedNewBooking] = useState<string>("");

  // Get all student registrations with current booking details
  const { data: studentRegistrations = [] } = useQuery({
    queryKey: ['student-registrations-relocation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_registrations')
        .select(`
          id,
          students(id, name, serial_number),
          bookings(
            id,
            class_code,
            halls(name),
            teachers(name),
            academic_stages(name)
          )
        `)
        .eq('payment_status', 'paid'); // Only show paid registrations
      
      if (error) throw error;
      return data;
    }
  });

  // Get available bookings for relocation
  const { data: availableBookings = [] } = useQuery({
    queryKey: ['available-bookings-relocation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          class_code,
          halls(name),
          teachers(name),
          academic_stages(name),
          number_of_students
        `)
        .eq('status', 'active');
      
      if (error) throw error;
      return data;
    }
  });

  // Relocate student mutation
  const relocateStudentMutation = useMutation({
    mutationFn: async ({ registrationId, newBookingId }: { registrationId: string; newBookingId: string }) => {
      // Get the current registration details
      const { data: currentReg, error: getCurrentError } = await supabase
        .from('student_registrations')
        .select('*')
        .eq('id', registrationId)
        .single();
      
      if (getCurrentError) throw getCurrentError;

      // Create new registration record for the new booking (historical tracking)
      const { data: newReg, error: createError } = await supabase
        .from('student_registrations')
        .insert({
          student_id: currentReg.student_id,
          booking_id: newBookingId,
          total_fees: currentReg.total_fees,
          paid_amount: currentReg.paid_amount,
          payment_status: currentReg.payment_status,
          notes: `تم النقل من الحجز ${currentReg.booking_id} في ${new Date().toLocaleDateString('ar-SA')}`
        });
      
      if (createError) throw createError;

      // Mark old registration as transferred
      const { error: updateError } = await supabase
        .from('student_registrations')
        .update({
          notes: `تم النقل إلى حجز جديد في ${new Date().toLocaleDateString('ar-SA')}`,
          // Keep the old registration for historical purposes but mark it
        })
        .eq('id', registrationId);
      
      if (updateError) throw updateError;

      return newReg;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-registrations-relocation'] });
      toast.success('تم نقل الطالب بنجاح');
      setSelectedStudent("");
      setSelectedNewBooking("");
    },
    onError: (error) => {
      console.error('Relocation error:', error);
      toast.error('حدث خطأ في نقل الطالب');
    }
  });

  const selectedRegistration = studentRegistrations.find(reg => reg.id === selectedStudent);
  const selectedNewBookingData = availableBookings.find(booking => booking.id === selectedNewBooking);

  const handleRelocation = () => {
    if (!selectedStudent || !selectedNewBooking) {
      toast.error('يرجى اختيار الطالب والحجز الجديد');
      return;
    }

    relocateStudentMutation.mutate({
      registrationId: selectedStudent,
      newBookingId: selectedNewBooking
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold">نقل الطلاب بين القاعات</h2>
      </div>

      {/* Student Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            اختيار الطالب للنقل
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="student-select" className="text-sm font-medium">الطالب</label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger id="student-select">
                <SelectValue placeholder="اختر الطالب" />
              </SelectTrigger>
              <SelectContent>
                {studentRegistrations.map((registration) => (
                  <SelectItem key={registration.id} value={registration.id}>
                    {registration.students?.name} - {registration.bookings?.class_code} ({registration.bookings?.halls?.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRegistration && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">التفاصيل الحالية:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>الطالب: {selectedRegistration.students?.name}</div>
                <div>الرقم التسلسلي: {selectedRegistration.students?.serial_number}</div>
                <div>القاعة: {selectedRegistration.bookings?.halls?.name}</div>
                <div>المدرس: {selectedRegistration.bookings?.teachers?.name}</div>
                <div>المرحلة: {selectedRegistration.bookings?.academic_stages?.name}</div>
                <div>
                  <Badge variant="outline">
                    {selectedRegistration.bookings?.class_code}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Booking Selection */}
      {selectedStudent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              اختيار الحجز الجديد
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="booking-select" className="text-sm font-medium">الحجز الجديد</label>
              <Select value={selectedNewBooking} onValueChange={setSelectedNewBooking}>
                <SelectTrigger id="booking-select">
                  <SelectValue placeholder="اختر الحجز الجديد" />
                </SelectTrigger>
                <SelectContent>
                  {availableBookings
                    .filter(booking => booking.id !== selectedRegistration?.bookings?.id) // Exclude current booking
                    .map((booking) => (
                    <SelectItem key={booking.id} value={booking.id}>
                      {booking.class_code} - {booking.teachers?.name} - {booking.halls?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedNewBookingData && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">تفاصيل الحجز الجديد:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>القاعة: {selectedNewBookingData.halls?.name}</div>
                  <div>المدرس: {selectedNewBookingData.teachers?.name}</div>
                  <div>المرحلة: {selectedNewBookingData.academic_stages?.name}</div>
                  <div>عدد الطلاب: {selectedNewBookingData.number_of_students}</div>
                </div>
              </div>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  disabled={!selectedStudent || !selectedNewBooking || relocateStudentMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  تأكيد النقل
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>تأكيد نقل الطالب</AlertDialogTitle>
                  <AlertDialogDescription>
                    هل أنت متأكد من نقل الطالب {selectedRegistration?.students?.name} 
                    من {selectedRegistration?.bookings?.class_code} 
                    إلى {selectedNewBookingData?.class_code}؟
                    <br />
                    <br />
                    سيتم الاحتفاظ بالسجل التاريخي للطالب.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRelocation}>
                    تأكيد النقل
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
