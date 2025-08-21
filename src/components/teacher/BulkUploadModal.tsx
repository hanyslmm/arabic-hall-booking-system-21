import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface BulkUploadModalProps {
  children: React.ReactNode;
}

export const BulkUploadModal = ({ children }: BulkUploadModalProps) => {
  return (
    <Dialog>
      {children}
      <DialogContent className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>رفع بيانات جماعي - المعلمون</CardTitle>
            <CardDescription>
              رفع بيانات متعددة للمعلمين من ملف Excel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>ملاحظة:</strong> ميزة الرفع الجماعي غير متوفرة في النسخة المبسطة من النظام.
                هذه الميزة تتطلب جداول إضافية لإدارة الحضور والبيانات المعقدة.
              </AlertDescription>
            </Alert>
            
            <div className="mt-4 space-y-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">الميزات المتوفرة في النسخة الكاملة:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>رفع قوائم المعلمين من ملفات Excel</li>
                  <li>إنشاء الحسابات تلقائياً</li>
                  <li>ربط المعلمين بالمواد الدراسية</li>
                  <li>إنشاء أكواد تعريف المعلمين</li>
                  <li>تسجيل بيانات الحضور والغياب</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};