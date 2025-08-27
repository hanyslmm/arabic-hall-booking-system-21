import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MobileInput } from "@/components/ui/mobile-input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, LogOut, Key, GraduationCap, QrCode, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function SimpleStudentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Fetch student dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["student-dashboard", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase.rpc('get_student_dashboard_data', {
        student_auth_id: user.id
      });
      
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!user?.id
  });

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

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
      <div className="container mx-auto px-3 py-4 space-y-4">
        {/* QR Code Card - Priority for mobile */}
        <Card className="border-2 border-primary/30 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl flex items-center justify-center gap-2">
              <QrCode className="h-6 w-6" />
              رمز الطالب
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="bg-white p-6 rounded-xl inline-block shadow-md">
              <QRCodeSVG
                value={(dashboardData?.qr_code_data as any)?.qr_data || studentSerialNumber}
                size={200}
                level="M"
                includeMargin={true}
              />
            </div>
            <div className="mt-4">
              <p className="text-lg font-bold text-primary">
                {(dashboardData?.student_info as any)?.name || "الطالب"}
              </p>
              <p className="text-muted-foreground">
                الرقم التسلسلي: {studentSerialNumber}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Current Month Attendance Summary */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              ملخص الحضور - الشهر الحالي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {(dashboardData?.attendance_summary as any)?.current_month_attendance || 0}
                </div>
                <div className="text-sm text-muted-foreground">أيام الحضور</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {(dashboardData?.attendance_summary as any)?.total_sessions || 0}
                </div>
                <div className="text-sm text-muted-foreground">إجمالي الأيام</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registered Classes */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="h-5 w-5" />
              الفصول المسجلة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData?.registrations && Array.isArray(dashboardData.registrations) && dashboardData.registrations.length > 0 ? (
              (dashboardData.registrations as any[]).map((registration: any) => (
                <Card key={registration.id} className="border border-muted">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Class Info */}
                      <div>
                        <h4 className="font-semibold text-primary">
                          {registration.booking?.class_code}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          المدرس: {registration.booking?.teacher?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          القاعة: {registration.booking?.hall?.name} | المرحلة: {registration.booking?.stage?.name}
                        </p>
                      </div>
                      
                      {/* Payment Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">حالة الدفع:</span>
                        <Badge variant={
                          registration.payment_status === 'paid' ? 'default' : 
                          registration.payment_status === 'partial' ? 'secondary' : 'destructive'
                        } className="flex items-center gap-1">
                          {registration.payment_status === 'paid' ? (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              مدفوع
                            </>
                          ) : registration.payment_status === 'partial' ? (
                            <>
                              <Clock className="h-3 w-3" />
                              جزئي ({registration.paid_amount} من {registration.total_fees})
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" />
                              غير مدفوع
                            </>
                          )}
                        </Badge>
                      </div>
                      
                      {/* Schedule */}
                      <div className="text-sm text-muted-foreground">
                        الأيام: {registration.booking?.days_of_week?.join(', ')} | 
                        الوقت: {registration.booking?.start_time}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد فصول مسجلة حالياً
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Key className="h-5 w-5" />
              إعدادات الحساب
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => setIsChangePasswordOpen(true)}
              className="w-full h-12 text-base"
              variant="outline"
            >
              <Key className="h-5 w-5 ml-2" />
              تغيير كلمة المرور
            </Button>
            <Button
              onClick={handleSignOut}
              variant="destructive"
              className="w-full h-12 text-base"
            >
              <LogOut className="h-5 w-5 ml-2" />
              تسجيل الخروج
            </Button>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground text-sm">
                للحصول على معلومات إضافية أو المساعدة
              </p>
              <p className="font-semibold text-primary">
                يرجى التواصل مع الإدارة
              </p>
            </div>
          </CardContent>
        </Card>
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
              <MobileInput
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
              <MobileInput
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