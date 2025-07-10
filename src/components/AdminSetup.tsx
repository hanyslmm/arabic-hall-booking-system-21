import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setupAdminAccount, checkExistingUsers } from "@/utils/setupAdmin";
import { useToast } from "@/hooks/use-toast";

export const AdminSetup = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [existingUsers, setExistingUsers] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing users on component mount
    checkExistingUsers().then(setExistingUsers);
  }, []);

  const handleSetupAdmin = async () => {
    setIsCreating(true);
    const result = await setupAdminAccount();
    
    if (result.success) {
      toast({
        title: "تم إنشاء حساب المدير بنجاح",
        description: "يمكنك الآن تسجيل الدخول باستخدام: admin / admin123",
      });
      setIsCompleted(true);
      // Refresh existing users list
      checkExistingUsers().then(setExistingUsers);
    } else {
      toast({
        title: "خطأ في إنشاء حساب المدير",
        description: result.message,
        variant: "destructive",
      });
    }
    setIsCreating(false);
  };

  if (isCompleted) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle className="text-center text-green-600">تم إنشاء حساب المدير</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">يمكنك الآن تسجيل الدخول باستخدام:</p>
          <p className="font-bold">اسم المستخدم: admin</p>
          <p className="font-bold">كلمة المرور: admin123</p>
          {existingUsers.length > 0 && (
            <div className="mt-4 text-sm">
              <p>المستخدمون الموجودون: {existingUsers.length}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-center">إعداد حساب المدير</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="mb-4">إنشاء حساب المدير الأول للنظام</p>
        {existingUsers.length > 0 && (
          <div className="mb-4 text-sm text-muted-foreground">
            <p>يوجد {existingUsers.length} مستخدم في النظام</p>
          </div>
        )}
        <Button 
          onClick={handleSetupAdmin} 
          disabled={isCreating}
          className="w-full"
        >
          {isCreating ? "جاري الإنشاء..." : "إنشاء حساب المدير"}
        </Button>
      </CardContent>
    </Card>
  );
};
