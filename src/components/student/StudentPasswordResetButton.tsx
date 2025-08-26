import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { studentAccountsApi } from "@/api/studentAccounts";
import { Key } from "lucide-react";

interface StudentPasswordResetButtonProps {
  studentId: string;
  studentName: string;
}

export function StudentPasswordResetButton({ studentId, studentName }: StudentPasswordResetButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resetPasswordMutation = useMutation({
    mutationFn: (password: string) => studentAccountsApi.resetPassword(studentId, password),
    onSuccess: () => {
      toast({
        title: "تم إعادة تعيين كلمة المرور",
        description: `تم تحديث كلمة مرور ${studentName} بنجاح`
      });
      setIsOpen(false);
      setNewPassword("");
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
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "خطأ",
        description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
        variant: "destructive"
      });
      return;
    }

    resetPasswordMutation.mutate(newPassword);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Key className="h-3 w-3 ml-1" />
          إعادة تعيين كلمة المرور
        </Button>
      </DialogTrigger>
      
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إعادة تعيين كلمة المرور للطالب: {studentName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>كلمة المرور الجديدة</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="أدخل كلمة المرور الجديدة (6 أحرف على الأقل)"
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsOpen(false);
                setNewPassword("");
              }}
            >
              إلغاء
            </Button>
            <Button 
              onClick={handleResetPassword}
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? "جاري التحديث..." : "إعادة تعيين كلمة المرور"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}