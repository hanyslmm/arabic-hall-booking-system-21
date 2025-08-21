import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function AttendanceManagementPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة الحضور</h1>
          <p className="text-muted-foreground">
            متابعة حضور وغياب الطلاب في الدورات
          </p>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>ملاحظة:</strong> ميزة إدارة الحضور غير متوفرة في النسخة المبسطة من النظام.
            هذه الميزة تتطلب جداول قاعدة بيانات إضافية غير موجودة في التكوين الحالي.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>ميزات إدارة الحضور المتاحة في النسخة الكاملة</CardTitle>
            <CardDescription>
              الميزات التي ستكون متوفرة عند تطوير النسخة الكاملة من النظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">تسجيل الحضور</h3>
                <p className="text-sm text-muted-foreground">
                  تسجيل حضور وغياب الطلاب بشكل يومي
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">التقارير</h3>
                <p className="text-sm text-muted-foreground">
                  إنشاء تقارير شاملة عن معدلات الحضور
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">الإشعارات</h3>
                <p className="text-sm text-muted-foreground">
                  إرسال تنبيهات عند الغياب المتكرر
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">الإحصائيات</h3>
                <p className="text-sm text-muted-foreground">
                  عرض إحصائيات مفصلة لكل طالب ودورة
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}