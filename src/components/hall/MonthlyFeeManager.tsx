import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function MonthlyFeeManager() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [newFee, setNewFee] = useState<string>("");

  // Get all teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers-fee-management'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, name, default_class_fee');
      
      if (error) throw error;
      return data;
    }
  });

  // Get fee history for selected teacher
  const { data: feeHistory = [] } = useQuery({
    queryKey: ['teacher-fee-history', selectedTeacher],
    queryFn: async () => {
      if (!selectedTeacher) return [];
      
      // This would require a new table to track fee changes over time
      // For now, we'll show current fee from bookings
      const { data, error } = await supabase
        .from('bookings')
        .select('id, class_fees, created_at, start_date')
        .eq('teacher_id', selectedTeacher)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedTeacher
  });

  // Update teacher default fee
  const updateTeacherFeeMutation = useMutation({
    mutationFn: async ({ teacherId, newFee }: { teacherId: string; newFee: number }) => {
      const { data, error } = await supabase
        .from('teachers')
        .update({ default_class_fee: newFee })
        .eq('id', teacherId);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers-fee-management'] });
      toast.success('تم تحديث الرسوم بنجاح');
      setNewFee("");
    },
    onError: () => {
      toast.error('حدث خطأ في تحديث الرسوم');
    }
  });

  const selectedTeacherData = teachers.find(t => t.id === selectedTeacher);

  const handleUpdateFee = () => {
    if (!selectedTeacher || !newFee) {
      toast.error('يرجى اختيار المدرس وإدخال الرسوم الجديدة');
      return;
    }

    const feeAmount = parseFloat(newFee);
    if (isNaN(feeAmount) || feeAmount < 0) {
      toast.error('يرجى إدخال قيمة صحيحة للرسوم');
      return;
    }

    updateTeacherFeeMutation.mutate({
      teacherId: selectedTeacher,
      newFee: feeAmount
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold">إدارة الرسوم الشهرية</h2>
      </div>

      {/* Teacher Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            تحديث رسوم المدرس
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="teacher-select">اختر المدرس</Label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger id="teacher-select">
                  <SelectValue placeholder="اختر المدرس" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-fee">الرسوم الجديدة</Label>
              <Input
                id="new-fee"
                type="number"
                value={newFee}
                onChange={(e) => setNewFee(e.target.value)}
                placeholder="أدخل الرسوم الجديدة"
              />
            </div>
          </div>

          {selectedTeacherData && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">{selectedTeacherData.name}</p>
                <p className="text-sm text-muted-foreground">
                  الرسوم الحالية: {selectedTeacherData.default_class_fee} ريال
                </p>
              </div>
              <Badge variant="secondary">
                {selectedTeacherData.default_class_fee || 0} ريال
              </Badge>
            </div>
          )}

          <Button 
            onClick={handleUpdateFee}
            disabled={!selectedTeacher || !newFee || updateTeacherFeeMutation.isPending}
            className="w-full sm:w-auto"
          >
            تحديث الرسوم
          </Button>
        </CardContent>
      </Card>

      {/* Fee History */}
      {selectedTeacher && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              تاريخ الرسوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feeHistory.length > 0 ? (
              <div className="space-y-2">
                {feeHistory.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">رسوم الحصة</p>
                      <p className="text-sm text-muted-foreground">
                        تاريخ البدء: {new Date(booking.start_date).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {booking.class_fees || 0} ريال
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                لا توجد بيانات رسوم متاحة
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}