import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, LogOut, Key, GraduationCap } from "lucide-react";

export default function SimpleStudentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "تم تغيير كلمة المرور",
        description: "تم تحديث كلمة المرور بنجاح"
      });
      setIsChangePasswordOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: `فشل في تغيير كلمة المرور: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Check if user is a student
  if (user && !user.email?.includes("@student.local")) {
    return <Navigate to="/" replace />;
  }

  if (!user) {
    return <Navigate to="/student-login" replace />;
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/student-login");
  };

  const handleChangePassword = () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمات المرور غير متطابقة",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 3) {
      toast({
        title: "خطأ",
        description: "كلمة المرور يجب أن تكون 3 أحرف على الأقل",
        variant: "destructive"
      });
      return;
    }

    changePasswordMutation.mutate(newPassword);
  };

  // Extract student info from email
  const studentSerialNumber = user.email?.split('@')[0] || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-lg border-b-2 border-primary/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">Science Club</h1>
                <p className="text-muted-foreground">منطقة الطالب</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold">مرحباً</p>
                <p className="text-sm text-muted-foreground">
                  الرقم التسلسلي: {studentSerialNumber}
                </p>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <User className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Welcome Card */}
          <Card className="border-2 border-primary/20 shadow-lg">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-3xl text-primary">
                مرحباً بك في منطقة الطلاب
              </CardTitle>
              <p className="text-muted-foreground text-lg">
                يمكنك إدارة حسابك من هنا
              </p>
            </CardHeader>
          </Card>

          {/* Actions Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                إعدادات الحساب
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="h-16 text-lg"
                  variant="outline"
                >
                  <Key className="h-6 w-6 ml-3" />
                  تغيير كلمة المرور
                </Button>
                <Button
                  onClick={handleSignOut}
                  variant="destructive"
                  className="h-16 text-lg"
                >
                  <LogOut className="h-6 w-6 ml-3" />
                  تسجيل الخروج
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-primary/5 border-primary/20 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  للحصول على معلومات إضافية أو المساعدة
                </p>
                <p className="font-semibold text-primary">
                  يرجى التواصل مع الإدارة
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">تغيير كلمة المرور</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-base">كلمة المرور الجديدة</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الجديدة"
                className="mt-1"
                dir="rtl"
              />
            </div>
            <div>
              <Label className="text-base">تأكيد كلمة المرور</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد إدخال كلمة المرور"
                className="mt-1"
                dir="rtl"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsChangePasswordOpen(false);
                  setNewPassword("");
                  setConfirmPassword("");
                }}
              >
                إلغاء
              </Button>
              <Button 
                onClick={handleChangePassword}
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? "جاري التحديث..." : "تحديث"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}