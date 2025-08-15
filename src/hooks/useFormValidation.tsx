import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z, ZodSchema } from "zod";
import { useToast } from "@/hooks/use-toast";

interface UseFormValidationOptions<T extends Record<string, any>> {
  schema: ZodSchema<T>;
  defaultValues?: Partial<T>;
  onSubmit: (data: T) => Promise<void> | void;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useFormValidation<T extends Record<string, any>>({
  schema,
  defaultValues,
  onSubmit,
  onSuccess,
  onError,
  successMessage = "تم الحفظ بنجاح",
  errorMessage = "حدث خطأ أثناء الحفظ"
}: UseFormValidationOptions<T>) {
  const { toast } = useToast();
  
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
      
      toast({
        title: "نجح العملية",
        description: successMessage,
        variant: "default",
      });
      
      onSuccess?.(data);
    } catch (error) {
      console.error('Form submission error:', error);
      
      toast({
        title: "فشل العملية",
        description: errorMessage,
        variant: "destructive",
      });
      
      onError?.(error);
    }
  });

  return {
    ...form,
    handleSubmit,
    isSubmitting: form.formState.isSubmitting,
  };
}

// Common validation schemas
export const validationSchemas = {
  user: z.object({
    full_name: z.string().min(2, "يجب أن يكون الاسم أكثر من حرفين"),
    email: z.string().email("البريد الإلكتروني غير صحيح").optional(),
    user_role: z.enum(["owner", "manager", "space_manager", "teacher"]),
    username: z.string().min(3, "اسم المستخدم يجب أن يكون أكثر من 3 أحرف").optional(),
  }),
  
  teacher: z.object({
    name: z.string().min(2, "يجب أن يكون اسم المعلم أكثر من حرفين"),
    mobile_phone: z.string().optional(),
    subject_id: z.string().uuid("يجب اختيار مادة دراسية").optional(),
  }),
  
  student: z.object({
    name: z.string().min(2, "يجب أن يكون اسم الطالب أكثر من حرفين"),
    serial_number: z.string().min(1, "الرقم التسلسلي مطلوب"),
    mobile_phone: z.string().optional(),
    guardian_phone: z.string().optional(),
  }),
  
  booking: z.object({
    hall_id: z.string().uuid("يجب اختيار قاعة"),
    teacher_id: z.string().uuid("يجب اختيار معلم"),
    start_date: z.date({ required_error: "تاريخ البداية مطلوب" }),
    end_date: z.date().optional(),
    class_fees: z.number().min(0, "الرسوم يجب أن تكون أكبر من أو تساوي صفر"),
  }),
  
  hall: z.object({
    name: z.string().min(2, "يجب أن يكون اسم القاعة أكثر من حرفين"),
    capacity: z.number().min(1, "السعة يجب أن تكون أكبر من صفر"),
  }),
  
  subject: z.object({
    name: z.string().min(2, "يجب أن يكون اسم المادة أكثر من حرفين"),
  }),
};