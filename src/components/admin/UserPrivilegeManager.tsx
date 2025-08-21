import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User, Shield, UserCheck, Eye, Settings, Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'manager' | 'user';
  created_at: string;
}

export const UserPrivilegeManager = () => {
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<'admin' | 'manager' | 'user'>('user');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const { toast } = useToast();

  const roleDisplayNames = {
    admin: 'مدير النظام',
    manager: 'مدير',
    user: 'مستخدم'
  };

  const roleVariants = {
    admin: 'destructive' as const,
    manager: 'default' as const,
    user: 'outline' as const
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data as UserProfile[] || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل قائمة المستخدمين",
        variant: "destructive",
      });
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleGrantPrivileges = async () => {
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
      // First check if user exists
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('email', email.trim())
        .single();

      if (userError && userError.code !== 'PGRST116') {
        throw new Error('خطأ في البحث عن المستخدم');
      }

      if (!existingUser) {
        toast({
          title: "المستخدم غير موجود",
          description: "يجب على المستخدم تسجيل الدخول أولاً لإنشاء حسابه",
          variant: "destructive",
        });
        return;
      }

      // Update user role
      const { data: updatedUser, error: updateError } = await supabase
        .from('profiles')
        .update({ 
          role: selectedRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) throw updateError;

      toast({
        title: "نجح التحديث",
        description: `تم منح صلاحيات ${roleDisplayNames[selectedRole]} للمستخدم ${email}`,
      });
      
      setEmail("");
      await loadUsers();

    } catch (error: any) {
      console.error('Error granting privileges:', error);
      toast({
        title: "فشل التحديث",
        description: error.message || "حدث خطأ أثناء تحديث صلاحيات المستخدم",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpgrade = async () => {
    setLoading(true);
    try {
      const { data: allUsers, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .neq('role', 'admin');

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'manager' })
        .neq('role', 'admin');

      if (updateError) throw updateError;

      toast({
        title: "نجح التحديث الشامل",
        description: `تم ترقية ${allUsers?.length || 0} مستخدم إلى مدير`,
      });

      await loadUsers();

    } catch (error: any) {
      console.error('Error in bulk upgrade:', error);
      toast({
        title: "فشل التحديث الشامل",
        description: error.message || "حدث خطأ أثناء الترقية الشاملة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">إدارة صلاحيات المستخدمين</h2>
        <p className="text-muted-foreground">منح وإدارة صلاحيات المستخدمين في النظام</p>
      </div>

      {/* Grant Privileges Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            منح صلاحيات جديدة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني للمستخدم</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="أدخل البريد الإلكتروني"
              dir="ltr"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">نوع الصلاحية</Label>
            <Select value={selectedRole} onValueChange={(value: any) => setSelectedRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع الصلاحية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">مدير النظام - صلاحيات كاملة</SelectItem>
                <SelectItem value="manager">مدير - صلاحيات إدارية</SelectItem>
                <SelectItem value="user">مستخدم - صلاحيات محدودة</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button
            onClick={handleGrantPrivileges}
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            منح الصلاحيات
          </Button>
        </CardContent>
      </Card>

      {/* Bulk Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            العمليات الشاملة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ترقية جميع المستخدمين الحاليين إلى صلاحيات مدير (باستثناء المديرين)
            </p>
            <Button
              onClick={handleBulkUpgrade}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ترقية جميع المستخدمين إلى مدير
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            قائمة المستخدمين ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="mr-2">جاري تحميل المستخدمين...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد مستخدمون في النظام
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{user.full_name || 'بدون اسم'}</div>
                      <div className="text-sm text-muted-foreground" dir="ltr">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={roleVariants[user.role]}>
                      {roleDisplayNames[user.role]}
                    </Badge>
                    {(user.role === 'admin' || user.role === 'manager') && (
                      <UserCheck className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};