import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { upgradeUserToAdmin, checkUserPrivileges, createAdminProfileForEmail } from "@/utils/upgradeUser";
import { useToast } from "@/hooks/use-toast";

export const UserUpgrade = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const { toast } = useToast();

  const targetEmail = "hanyslmm@gmail.com";

  const handleCheckUser = async () => {
    setIsProcessing(true);
    const result = await checkUserPrivileges(targetEmail);
    setUserInfo(result);
    
    toast({
      title: result.exists ? "تم العثور على المستخدم" : "المستخدم غير موجود",
      description: result.message,
      variant: result.exists ? "default" : "destructive",
    });
    setIsProcessing(false);
  };

  const handleUpgradeUser = async () => {
    setIsProcessing(true);
    const result = await upgradeUserToAdmin(targetEmail);
    
    toast({
      title: result.success ? "تم ترقية المستخدم" : "فشل في الترقية",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });

    if (result.success) {
      handleCheckUser(); // Refresh user info
    }
    setIsProcessing(false);
  };

  const handleCreateAdminProfile = async () => {
    setIsProcessing(true);
    const result = await createAdminProfileForEmail(targetEmail);
    
    toast({
      title: result.success ? "تم إنشاء الملف الشخصي" : "فشل في الإنشاء",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });

    if (result.success) {
      handleCheckUser(); // Refresh user info
    }
    setIsProcessing(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-center">ترقية المستخدم إلى مدير</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <p className="font-semibold">البريد الإلكتروني:</p>
          <p className="text-muted-foreground">{targetEmail}</p>
        </div>

        {userInfo && (
          <div className="p-3 bg-muted rounded-lg text-sm">
            <p><strong>موجود:</strong> {userInfo.exists ? "نعم" : "لا"}</p>
            {userInfo.profile && (
              <>
                <p><strong>الاسم:</strong> {userInfo.profile.full_name || "غير محدد"}</p>
                <p><strong>الدور:</strong> {userInfo.profile.user_role}</p>
                <p><strong>مدير:</strong> {userInfo.isOwner ? "نعم" : "لا"}</p>
              </>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Button 
            onClick={handleCheckUser} 
            disabled={isProcessing}
            variant="outline"
            className="w-full"
          >
            {isProcessing ? "جاري البحث..." : "التحقق من المستخدم"}
          </Button>

          <Button 
            onClick={handleUpgradeUser} 
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? "جاري الترقية..." : "ترقية إلى مدير"}
          </Button>

          <Button 
            onClick={handleCreateAdminProfile} 
            disabled={isProcessing}
            variant="secondary"
            className="w-full"
          >
            {isProcessing ? "جاري الإنشاء..." : "إنشاء ملف مدير جديد"}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>سيتم منح هذا المستخدم صلاحيات المالك الكاملة في النظام</p>
        </div>
      </CardContent>
    </Card>
  );
};
