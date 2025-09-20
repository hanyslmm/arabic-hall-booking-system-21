import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Users, RefreshCw, AlertTriangle } from 'lucide-react';
import { createMonthlyStudentRegistrations, resetAllBookingsToNextMonth } from '@/utils/monthlyStudentReset';

interface MonthlyTransitionManagerProps {
  bookingId?: string;
  isGlobal?: boolean;
}

export function MonthlyTransitionManager({ bookingId, isGlobal = false }: MonthlyTransitionManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [targetMonth, setTargetMonth] = useState(new Date().getMonth() + 1);
  const [targetYear, setTargetYear] = useState(new Date().getFullYear());
  const [resetAttendance, setResetAttendance] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const months = [
    { value: 1, label: 'يناير' },
    { value: 2, label: 'فبراير' },
    { value: 3, label: 'مارس' },
    { value: 4, label: 'أبريل' },
    { value: 5, label: 'مايو' },
    { value: 6, label: 'يونيو' },
    { value: 7, label: 'يوليو' },
    { value: 8, label: 'أغسطس' },
    { value: 9, label: 'سبتمبر' },
    { value: 10, label: 'أكتوبر' },
    { value: 11, label: 'نوفمبر' },
    { value: 12, label: 'ديسمبر' },
  ];

  const years = Array.from({ length: 3 }, (_, i) => {
    const year = new Date().getFullYear() + i;
    return { value: year, label: year.toString() };
  });

  const handleTransition = async () => {
    if (isGlobal) {
      await handleGlobalTransition();
    } else if (bookingId) {
      await handleSingleBookingTransition();
    }
  };

  const handleSingleBookingTransition = async () => {
    setIsProcessing(true);
    try {
      const result = await createMonthlyStudentRegistrations({
        targetMonth,
        targetYear,
        bookingId: bookingId!,
        resetAttendance
      });

      if (result.success) {
        toast({
          title: 'تم إنشاء تسجيلات الشهر بنجاح',
          description: `تم إنشاء ${result.registrationsCreated} تسجيل جديد للشهر المحدد`
        });
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['registrations', bookingId] });
        queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      } else {
        toast({
          title: 'خطأ في إنشاء تسجيلات الشهر',
          description: result.error || 'حدث خطأ غير متوقع',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'خطأ في إنشاء تسجيلات الشهر',
        description: 'حدث خطأ غير متوقع',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
      setIsOpen(false);
    }
  };

  const handleGlobalTransition = async () => {
    setIsProcessing(true);
    try {
      const result = await resetAllBookingsToNextMonth();

      if (result.success) {
        toast({
          title: 'تم إنشاء تسجيلات الشهر لجميع المجموعات',
          description: `تم معالجة ${result.bookingsProcessed} مجموعة وإنشاء ${result.totalRegistrationsCreated} تسجيل جديد`
        });
        
        // Invalidate all relevant queries
        queryClient.invalidateQueries({ queryKey: ['registrations'] });
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
        queryClient.invalidateQueries({ queryKey: ['booking'] });
      } else {
        toast({
          title: 'خطأ في إنشاء تسجيلات الشهر',
          description: result.errors.join(', '),
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'خطأ في إنشاء تسجيلات الشهر',
        description: 'حدث خطأ غير متوقع',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <RefreshCw className="h-4 w-4 ml-2" />
          {isGlobal ? 'إنشاء تسجيلات الشهر الجديد لجميع المجموعات' : 'إنشاء تسجيلات الشهر الجديد'}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {isGlobal ? 'إنشاء تسجيلات الشهر الجديد' : 'إنشاء تسجيلات الشهر الجديد للمجموعة'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">تنبيه مهم:</p>
                <p>سيتم إنشاء تسجيلات جديدة للطلاب للشهر المحدد مع إعادة تعيين حالة الدفع إلى "معلق"</p>
              </div>
            </div>
          </div>

          {!isGlobal && (
            <div className="space-y-2">
              <label className="text-sm font-medium">الشهر المستهدف</label>
              <Select value={targetMonth.toString()} onValueChange={(value) => setTargetMonth(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!isGlobal && (
            <div className="space-y-2">
              <label className="text-sm font-medium">السنة المستهدفة</label>
              <Select value={targetYear.toString()} onValueChange={(value) => setTargetYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year.value} value={year.value.toString()}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="reset-attendance" 
              checked={resetAttendance}
              onCheckedChange={(checked) => setResetAttendance(checked as boolean)}
            />
            <label htmlFor="reset-attendance" className="text-sm font-medium">
              إعادة تعيين سجلات الحضور للشهر الجديد
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleTransition} 
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                  جاري المعالجة...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 ml-2" />
                  {isGlobal ? 'إنشاء لجميع المجموعات' : 'إنشاء للمجموعة'}
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
