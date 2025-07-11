import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { upgradeUserToAdmin, checkUserPrivileges, upgradeMultipleUsers } from "@/utils/userPrivileges";
import { Shield, User, UserCheck } from "lucide-react";

export const UserPrivilegeManager = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkLoading, setCheckLoading] = useState(false);
  const [upgradeAllLoading, setUpgradeAllLoading] = useState(false);
  const { toast } = useToast();

  const handleUpgradeUser = async () => {
    if (!email.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال البريد الإلكتروني",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await upgradeUserToAdmin(email.trim());
      
      if (result.success) {
        toast({
          title: "نجح التحديث",
          description: result.message,
        });
        setEmail("");
      } else {
        toast({
          title: "فشل التحديث",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث المستخدم",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckUser = async () => {
    if (!email.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال البريد الإلكتروني",
        variant: "destructive",
      });
      return;
    }

    setCheckLoading(true);
    try {
      const user = await checkUserPrivileges(email.trim());
      
      if (user) {
        toast({
          title: "معلومات المستخدم",
          description: `البريد: ${user.email}\nالدور: ${user.user_role}\nالصلاحية: ${user.role}`,
        });
      } else {
        toast({
          title: "المستخدم غير موجود",
          description: "لم يتم العثور على المستخدم",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء البحث عن المستخدم",
        variant: "destructive",
      });
    } finally {
      setCheckLoading(false);
    }
  };

  const handleUpgradeKnownUsers = async () => {
    setUpgradeAllLoading(true);
    try {
      const emails = ["admin@admin.com", "anyslmm@gmail.com"];
      const results = await upgradeMultipleUsers(emails);
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;
      
      toast({
        title: "تم تحديث المستخدمين",
        description: `نجح: ${successCount}, فشل: ${failCount}`,
      });
      
      // Show detailed results
      results.forEach(result => {
        console.log(`${result.email}: ${result.success ? 'Success' : 'Failed'} - ${result.message}`);
      });
      
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث المستخدمين",
        variant: "destructive",
      });
    } finally {
      setUpgradeAllLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          إدارة صلاحيات المستخدمين
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            type="email"
            placeholder="البريد الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            dir="ltr"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleCheckUser}
            disabled={checkLoading}
            variant="outline"
            className="flex-1"
          >
            <User className="h-4 w-4 mr-2" />
            {checkLoading ? "جاري البحث..." : "فحص المستخدم"}
          </Button>
          
          <Button
            onClick={handleUpgradeUser}
            disabled={loading}
            className="flex-1"
          >
            <UserCheck className="h-4 w-4 mr-2" />
            {loading ? "جاري التحديث..." : "ترقية لأدمن"}
          </Button>
        </div>
        
        <div className="pt-4 border-t">
          <Button
            onClick={handleUpgradeKnownUsers}
            disabled={upgradeAllLoading}
            variant="secondary"
            className="w-full"
          >
            <Shield className="h-4 w-4 mr-2" />
            {upgradeAllLoading ? "جاري التحديث..." : "ترقية admin و anyslmm@gmail.com"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
