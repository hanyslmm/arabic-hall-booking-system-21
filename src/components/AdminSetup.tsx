import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setupAdminAccount, checkExistingUsers, forceCreateAdminProfile } from "@/utils/setupAdmin";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const AdminSetup = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [existingUsers, setExistingUsers] = useState<any[]>([]);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    checkExistingUsers().then(setExistingUsers);
    
    // Add debug info about Supabase connection
    setDebugInfo(`Supabase URL: ${import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Not Set'}`);
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

  const handleForceCreateProfile = async () => {
    setIsCreating(true);
    const result = await forceCreateAdminProfile();
    
    toast({
      title: result.success ? "تم إنشاء الملف الشخصي" : "خطأ",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });
    
    if (result.success) {
      checkExistingUsers().then(setExistingUsers);
    }
    setIsCreating(false);
  };

  const handleTestLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: "admin@example.com",
        password: "admin123"
      });

      if (error) {
        toast({
          title: "فشل تسجيل الدخول التجريبي",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "نجح تسجيل الدخول التجريبي",
          description: "حساب المدير يعمل بشكل صحيح!",
        });
        setIsCompleted(true);
      }
    } catch (error: any) {
      toast({
        title: "خطأ في الاختبار",
        description: error.message,
        variant: "destructive",
      });
    }
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
      <CardContent className="text-center space-y-4">
        <p className="mb-4">إنشاء حساب المدير الأول للنظام</p>
        
        {existingUsers.length > 0 && (
          <div className="text-sm text-muted-foreground">
            <p>يوجد {existingUsers.length} مستخدم في النظام</p>
          </div>
        )}

        <div className="space-y-2">
          <Button 
            onClick={handleSetupAdmin} 
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? "جاري الإنشاء..." : "إنشاء حساب المدير"}
          </Button>

          <Button 
            onClick={handleTestLogin} 
            disabled={isCreating}
            variant="outline"
            className="w-full"
          >
            اختبار تسجيل الدخول
          </Button>

          <Button 
            onClick={handleForceCreateProfile} 
            disabled={isCreating}
            variant="secondary"
            className="w-full text-xs"
          >
            إنشاء ملف شخصي فقط
          </Button>
        </div>

        {debugInfo && (
          <div className="text-xs text-muted-foreground mt-4">
            <p>{debugInfo}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
