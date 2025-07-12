
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { ar } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { formatArabicDate } from "@/utils/dateUtils";

const bookingSchema = z.object({
  hall_id: z.string().min(1, "يرجى اختيار القاعة"),
  teacher_id: z.string().min(1, "يرجى اختيار المعلم"),
  academic_stage_id: z.string().min(1, "يرجى اختيار المرحلة الدراسية"),
  number_of_students: z.number().min(1, "يجب أن يكون عدد الطلاب أكبر من صفر"),
  start_time: z.string().min(1, "يرجى اختيار وقت البداية"),
  start_date: z.date({ required_error: "يرجى اختيار تاريخ البداية" }),
  end_date: z.date().optional(),
  days_of_week: z.array(z.string()).min(1, "يرجى اختيار يوم واحد على الأقل"),
});

type BookingFormData = z.infer<typeof bookingSchema>;

const DAYS_OF_WEEK = [
  { value: 'sunday', label: 'الأحد' },
  { value: 'monday', label: 'الاثنين' },
  { value: 'tuesday', label: 'الثلاثاء' },
  { value: 'wednesday', label: 'الأربعاء' },
  { value: 'thursday', label: 'الخميس' },
  { value: 'friday', label: 'الجمعة' },
  { value: 'saturday', label: 'السبت' },
];

interface BookingFormProps {
  onSuccess?: () => void;
}

export const BookingForm = ({ onSuccess }: BookingFormProps) => {
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      number_of_students: 1,
      days_of_week: [],
    },
  });

  // Fetch halls
  const { data: halls } = useQuery({
    queryKey: ['halls'],
    queryFn: async () => {
      const { data, error } = await supabase.from('halls').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch teachers
  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('teachers').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch academic stages
  const { data: academicStages } = useQuery({
    queryKey: ['academic-stages'],
    queryFn: async () => {
      const { data, error } = await supabase.from('academic_stages').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('غير مصرح');

      const bookingData = {
        hall_id: data.hall_id,
        teacher_id: data.teacher_id,
        academic_stage_id: data.academic_stage_id,
        number_of_students: data.number_of_students,
        start_time: data.start_time,
        start_date: format(data.start_date, 'yyyy-MM-dd'),
        end_date: data.end_date ? format(data.end_date, 'yyyy-MM-dd') : null,
        days_of_week: data.days_of_week,
        created_by: user.user.id,
        status: 'active' as const,
      };

      const { data: result, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: "تم إنشاء الحجز بنجاح",
        description: "تم حفظ الحجز في النظام",
      });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      form.reset();
      setSelectedDays([]);
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "خطأ في إنشاء الحجز",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDayToggle = (day: string) => {
    const updatedDays = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day];
    
    setSelectedDays(updatedDays);
    form.setValue('days_of_week', updatedDays);
  };

  const onSubmit = (data: BookingFormData) => {
    createBookingMutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">حجز قاعة جديد</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Hall Selection */}
          <div className="space-y-2">
            <Label htmlFor="hall_id">القاعة</Label>
            <Select onValueChange={(value) => form.setValue('hall_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر القاعة" />
              </SelectTrigger>
              <SelectContent>
                {halls?.map((hall) => (
                  <SelectItem key={hall.id} value={hall.id}>
                    {hall.name} (سعة {hall.capacity} طالب)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.hall_id && (
              <p className="text-sm text-destructive">{form.formState.errors.hall_id.message}</p>
            )}
          </div>

          {/* Teacher Selection */}
          <div className="space-y-2">
            <Label htmlFor="teacher_id">المعلم</Label>
            <Select onValueChange={(value) => form.setValue('teacher_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المعلم" />
              </SelectTrigger>
              <SelectContent>
                {teachers?.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.teacher_id && (
              <p className="text-sm text-destructive">{form.formState.errors.teacher_id.message}</p>
            )}
          </div>

          {/* Academic Stage Selection */}
          <div className="space-y-2">
            <Label htmlFor="academic_stage_id">المرحلة الدراسية</Label>
            <Select onValueChange={(value) => form.setValue('academic_stage_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المرحلة الدراسية" />
              </SelectTrigger>
              <SelectContent>
                {academicStages?.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.academic_stage_id && (
              <p className="text-sm text-destructive">{form.formState.errors.academic_stage_id.message}</p>
            )}
          </div>

          {/* Number of Students */}
          <div className="space-y-2">
            <Label htmlFor="number_of_students">عدد الطلاب</Label>
            <Input
              type="number"
              min="1"
              {...form.register('number_of_students', { valueAsNumber: true })}
            />
            {form.formState.errors.number_of_students && (
              <p className="text-sm text-destructive">{form.formState.errors.number_of_students.message}</p>
            )}
          </div>

          {/* Start Time */}
          <div className="space-y-2">
            <Label htmlFor="start_time">وقت البداية</Label>
            <Input
              type="time"
              {...form.register('start_time')}
            />
            {form.formState.errors.start_time && (
              <p className="text-sm text-destructive">{form.formState.errors.start_time.message}</p>
            )}
          </div>

          {/* Days of Week */}
          <div className="space-y-2">
            <Label>أيام الأسبوع</Label>
            <div className="grid grid-cols-2 gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.value} className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id={day.value}
                    checked={selectedDays.includes(day.value)}
                    onCheckedChange={() => handleDayToggle(day.value)}
                  />
                  <Label htmlFor={day.value}>{day.label}</Label>
                </div>
              ))}
            </div>
            {form.formState.errors.days_of_week && (
              <p className="text-sm text-destructive">{form.formState.errors.days_of_week.message}</p>
            )}
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label>تاريخ البداية</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !form.watch('start_date') && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch('start_date') ? formatArabicDate(form.watch('start_date')) : <span>اختر التاريخ</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.watch('start_date')}
                  onSelect={(date) => form.setValue('start_date', date!)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {form.formState.errors.start_date && (
              <p className="text-sm text-destructive">{form.formState.errors.start_date.message}</p>
            )}
          </div>

          {/* End Date (Optional) */}
          <div className="space-y-2">
            <Label>تاريخ النهاية (اختياري)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !form.watch('end_date') && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch('end_date') ? formatArabicDate(form.watch('end_date')) : <span>اختر التاريخ (اختياري)</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.watch('end_date')}
                  onSelect={(date) => form.setValue('end_date', date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createBookingMutation.isPending}
          >
            {createBookingMutation.isPending ? "جاري الحفظ..." : "حفظ الحجز"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
