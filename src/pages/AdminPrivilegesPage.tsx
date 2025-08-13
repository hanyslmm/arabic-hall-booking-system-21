import { UnifiedLayout } from "@/components/layout/UnifiedLayout";
import { UserPrivilegeManager } from "@/components/admin/UserPrivilegeManager";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const AdminPrivilegesPage = () => {
  const { profile, isAdmin } = useAuth();

  return (
    <UnifiedLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
              <Shield className="h-8 w-8" />
              إدارة الصلاحيات الإدارية
            </h1>
            <p className="text-muted-foreground text-lg">
              ترقية المستخدمين وإدارة الصلاحيات
            </p>
          </div>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="ml-2 h-4 w-4" />
              العودة إلى لوحة التحكم
            </Link>
          </Button>
        </div>
        
        <div className="max-w-2xl">
          <UserPrivilegeManager />
          
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>معلومات مهمة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">المستخدمون المطلوب ترقيتهم:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>admin@admin.com - مدير النظام الرئيسي</li>
                  <li>hanyslmm@gmail.com - هاني سالم</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">أنواع الصلاحيات:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>owner:</strong> مالك النظام - صلاحيات كاملة</li>
                  <li><strong>manager:</strong> مدير - صلاحيات إدارية</li>
                  <li><strong>space_manager:</strong> مدير قاعات - إدارة القاعات فقط</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">أنواع الأدوار:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>ADMIN:</strong> دور إداري في التطبيق</li>
                  <li><strong>USER:</strong> مستخدم عادي</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </UnifiedLayout>
  );
};

export default AdminPrivilegesPage;
