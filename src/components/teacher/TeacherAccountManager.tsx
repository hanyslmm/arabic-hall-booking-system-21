import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export const TeacherAccountManager = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">إدارة حسابات المعلمين</h2>
        <p className="text-muted-foreground">
          إنشاء وإدارة حسابات المعلمين في النظام
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>ملاحظة:</strong> ميزة إدارة حسابات المعلمين غير متوفرة في النسخة المبسطة من النظام.
          هذه الميزة تتطلب ربط جداول المعلمين بجدول المستخدمين وهو غير متوفر في التكوين الحالي.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>الميزات المتوفرة في النسخة الكاملة</CardTitle>
          <CardDescription>
            الميزات التي ستكون متوفرة عند تطوير النسخة الكاملة من النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">إنشاء حسابات</h3>
              <p className="text-sm text-muted-foreground">
                إنشاء حسابات دخول للمعلمين تلقائياً
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">إدارة الأذونات</h3>
              <p className="text-sm text-muted-foreground">
                تحديد صلاحيات المعلمين في النظام
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">إعادة تعيين كلمة المرور</h3>
              <p className="text-sm text-muted-foreground">
                إعادة تعيين أو تغيير كلمات مرور المعلمين
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">ربط الحسابات</h3>
              <p className="text-sm text-muted-foreground">
                ربط حسابات المعلمين ببياناتهم الشخصية
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};