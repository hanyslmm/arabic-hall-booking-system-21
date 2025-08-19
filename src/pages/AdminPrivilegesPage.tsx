import { UnifiedLayout } from "@/components/layout/UnifiedLayout";
import { UserPrivilegeManager } from "@/components/admin/UserPrivilegeManager";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AdminPrivilegesPage = () => {
  const { profile, isAdmin } = useAuth();

  if (!isAdmin && profile?.user_role !== 'owner' && profile?.user_role !== 'manager') {
    return (
      <UnifiedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Shield className="h-5 w-5" />
                وصول غير مصرح
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                ليس لديك صلاحية للوصول إلى هذه الصفحة. يجب أن تكون مالك النظام أو مدير.
              </p>
              <Button asChild className="w-full">
                <Link to="/">
                  <ArrowRight className="ml-2 h-4 w-4" />
                  العودة إلى الصفحة الرئيسية
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                إدارة صلاحيات المستخدمين
              </CardTitle>
              <CardDescription>
                منح وإدارة صلاحيات المستخدمين في النظام
              </CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link to="/">
                <ArrowRight className="ml-2 h-4 w-4" />
                العودة للوحة التحكم
              </Link>
            </Button>
          </CardHeader>
        </Card>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>تنبيه مهم:</strong> تأكد من أن المستخدم قد قام بتسجيل الدخول مرة واحدة على الأقل قبل منحه صلاحيات جديدة.
            هذا ضروري لإنشاء ملفه الشخصي في النظام.
          </AlertDescription>
        </Alert>

        <UserPrivilegeManager />

        <Card>
          <CardHeader>
            <CardTitle>معلومات الأدوار والصلاحيات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">أنواع الأدوار المتاحة:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium text-destructive">مالك النظام (Owner)</h4>
                  <p className="text-sm text-muted-foreground">صلاحيات كاملة للنظام</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium">مدير (Manager)</h4>
                  <p className="text-sm text-muted-foreground">صلاحيات إدارية شاملة</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium">مدير قاعات (Space Manager)</h4>
                  <p className="text-sm text-muted-foreground">إدارة القاعات والحجوزات فقط</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium">قراءة فقط (Read Only)</h4>
                  <p className="text-sm text-muted-foreground">عرض البيانات بدون تعديل</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">المستخدمون المطلوب ترقيتهم:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>admin@admin.com - مدير النظام الرئيسي</li>
                <li>hanyslmm@gmail.com - هاني سالم</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedLayout>
  );
};

export default AdminPrivilegesPage;