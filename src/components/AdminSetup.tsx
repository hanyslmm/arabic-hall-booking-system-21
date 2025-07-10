import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setupAdminAccount } from "@/utils/setupAdmin";
import { useToast } from "@/hooks/use-toast";

export const AdminSetup = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const { toast } = useToast();

  const handleSetupAdmin = async () => {
    setIsCreating(true);
    const result = await setupAdminAccount();
    
    if (result.success) {
      toast({
        title: "تم إنشاء حساب المدير بنجاح",
        description: "يمكنك الآن تسجيل الدخول باستخدام: admin / admin123",
      });
      setIsCompleted(true);
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
