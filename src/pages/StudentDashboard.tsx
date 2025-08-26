import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { Download, User, Calendar, DollarSign, BookOpen, LogOut, Key, Smartphone } from "lucide-react";

interface StudentDashboardData {
  student_info: {
    id: string;
    name: string;
    serial_number: string;
    mobile_phone: string;
    academic_stage_id: string;
  };
  registrations: Array<{
    id: string;
    total_fees: number;
    paid_amount: number;
    payment_status: string;
    booking: {
      class_code: string;
      start_time: string;
      days_of_week: string[];
      teacher: { name: string };
      hall: { name: string };
      stage: { name: string };
    };
  }>;
  attendance_summary: {
    current_month_attendance: number;
    total_sessions: number;
  };
  qr_code_data: {
    qr_data: string;
    student_name: string;
    mobile_phone: string;
  };
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Fetch student dashboard data
  const { data: studentData, isLoading } = useQuery({
    queryKey: ['student-dashboard', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const { data, error } = await supabase.rpc('get_student_dashboard_data', {
        student_auth_id: user.id
      });
      
      if (error) throw error;
      return data?.[0] as StudentDashboardData;
    },
    enabled: !!user?.id,
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
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تغيير كلمة المرور",
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-4">لم يتم العثور على بيانات الطالب</h2>
              <p className="text-muted-foreground mb-4">يرجى التواصل مع الإدارة</p>
              <Button onClick={() => supabase.auth.signOut()}>
                تسجيل الخروج
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/student-login");
  };

  const downloadQRCode = () => {
    const svg = qrCodeRef.current?.querySelector('svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      canvas.width = 200;
      canvas.height = 200;
      
      img.onload = () => {
        ctx?.drawImage(img, 0, 0);
        const url = canvas.toDataURL();
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-code-${studentData.student_info.serial_number}.png`;
        a.click();
        
        toast({
          title: "تم التحميل",
          description: "تم تحميل رمز QR بنجاح"
        });
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    }
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

    if (newPassword.length < 6) {
      toast({
        title: "خطأ",
        description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
        variant: "destructive"
      });
      return;
    }

    changePasswordMutation.mutate(newPassword);
  };

  const attendancePercentage = studentData.attendance_summary.total_sessions > 0 
    ? Math.round((studentData.attendance_summary.current_month_attendance / studentData.attendance_summary.total_sessions) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">مرحباً، {studentData.student_info.name}</h1>
                <p className="text-sm text-muted-foreground">
                  الرقم التسلسلي: {studentData.student_info.serial_number}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChangePasswordOpen(true)}
              >
                <Key className="h-4 w-4 ml-2" />
                تغيير كلمة المرور
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 ml-2" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* QR Code Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              رمز QR الخاص بك
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div ref={qrCodeRef} className="flex-shrink-0">
                <QRCodeSVG
                  value={studentData.qr_code_data.qr_data}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{studentData.qr_code_data.student_name}</h3>
                  <p className="text-muted-foreground">
                    الرقم التسلسلي: {studentData.qr_code_data.qr_data}
                  </p>
                  <p className="text-muted-foreground">
                    الهاتف: {studentData.qr_code_data.mobile_phone}
                  </p>
                </div>
                <Button onClick={downloadQRCode}>
                  <Download className="h-4 w-4 ml-2" />
                  تحميل رمز QR
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المجموعات المسجل بها</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentData.registrations.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الحضور هذا الشهر</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {studentData.attendance_summary.current_month_attendance}/{studentData.attendance_summary.total_sessions}
              </div>
              <p className="text-xs text-muted-foreground">
                نسبة الحضور: {attendancePercentage}%
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">حالة المدفوعات</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {studentData.registrations.filter(r => r.payment_status === 'paid').length} مدفوع
                / {studentData.registrations.length} إجمالي
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Registrations */}
        <Card>
          <CardHeader>
            <CardTitle>المجموعات والدورات المسجل بها</CardTitle>
          </CardHeader>
          <CardContent>
            {studentData.registrations.length > 0 ? (
              <div className="space-y-4">
                {studentData.registrations.map((registration) => (
                  <div key={registration.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{registration.booking.class_code}</h3>
                      <Badge variant={
                        registration.payment_status === 'paid' ? 'default' : 
                        registration.payment_status === 'partial' ? 'secondary' : 
                        'destructive'
                      }>
                        {registration.payment_status === 'paid' ? 'مدفوع' : 
                         registration.payment_status === 'partial' ? 'دفع جزئي' : 
                         'غير مدفوع'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>المعلم:</strong> {registration.booking.teacher.name}</p>
                        <p><strong>القاعة:</strong> {registration.booking.hall.name}</p>
                        <p><strong>المرحلة:</strong> {registration.booking.stage.name}</p>
                      </div>
                      <div>
                        <p><strong>وقت البدء:</strong> {registration.booking.start_time}</p>
                        <p><strong>أيام الأسبوع:</strong> {registration.booking.days_of_week.join(', ')}</p>
                        <p><strong>الرسوم:</strong> {registration.total_fees} LE</p>
                        <p><strong>المدفوع:</strong> {registration.paid_amount} LE</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا توجد مجموعات مسجل بها</h3>
                <p className="text-muted-foreground">يرجى التواصل مع الإدارة للتسجيل في المجموعات</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغيير كلمة المرور</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>كلمة المرور الجديدة</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الجديدة"
              />
            </div>
            <div>
              <Label>تأكيد كلمة المرور</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد إدخال كلمة المرور"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
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
                {changePasswordMutation.isPending ? "جاري التحديث..." : "تحديث كلمة المرور"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}