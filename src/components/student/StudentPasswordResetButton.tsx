import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Key } from "lucide-react";

interface StudentPasswordResetButtonProps {
  studentId: string;
  studentName: string;
}

interface ResetPasswordResponse {
  success: boolean;
  error?: string;
  message?: string;
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
      
      const response = data as unknown as ResetPasswordResponse;
      if (!response.success) throw new Error(response.error);
      
      return response;
    },
    onSuccess: () => {
      toast({
        title: "تم إعادة تعيين كلمة المرور",
        description: `تم إعادة تعيين كلمة مرور ${studentName} إلى رقم الهاتف المسجل`
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

  const handleResetPassword = () => {
    resetPasswordMutation.mutate();
  };

  return (
    <Button 
      size="sm" 
      variant="outline"
      onClick={handleResetPassword}
      disabled={resetPasswordMutation.isPending}
    >
      <Key className="h-3 w-3 ml-1" />
      {resetPasswordMutation.isPending ? "جاري إعادة التعيين..." : "إعادة تعيين كلمة المرور"}
    </Button>
  );
}