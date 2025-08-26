import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Key } from "lucide-react";

interface StudentPasswordResetButtonProps {
  studentId: string;
  studentName: string;
}

export function StudentPasswordResetButton({ studentId, studentName }: StudentPasswordResetButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('auto_reset_student_password', {
        p_student_id: studentId
      });
      
      if (error) throw error;
      
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || 'Reset failed');
      
      return result;
    },
    onSuccess: (data: any) => {
      toast({
        title: "تم إعادة تعيين كلمة المرور",
        description: `تم تحديث كلمة مرور ${studentName} بنجاح. اسم المستخدم: ${data.username || 'غير متوفر'}`
      });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إعادة تعيين كلمة المرور",
        variant: "destructive"
      });
    }
  });

  return (
    <Button 
      size="sm" 
      variant="outline" 
      onClick={() => resetPasswordMutation.mutate()}
      disabled={resetPasswordMutation.isPending}
    >
      <Key className="h-3 w-3 ml-1" />
      {resetPasswordMutation.isPending ? "جاري التحديث..." : "إعادة تعيين كلمة المرور"}
    </Button>
  );
}