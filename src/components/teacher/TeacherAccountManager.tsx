import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  UserPlus, 
  Settings, 
  Key, 
  Link, 
  Shield, 
  Users, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Teacher {
  id: string;
  name: string;
  teacher_code?: string;
  mobile_phone?: string;
}

interface Profile {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  teacher_id?: string;
  username?: string;
}

interface TeacherAccount {
  teacher: Teacher;
  profile?: Profile;
  hasAccount: boolean;
}

export const TeacherAccountManager = () => {
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showLinkAccount, setShowLinkAccount] = useState(false);
  const [newAccountData, setNewAccountData] = useState({
    email: '',
    password: '',
    username: ''
  });
  const [linkAccountEmail, setLinkAccountEmail] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all teachers
  const { data: teachers, isLoading: loadingTeachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('teachers').select('*').order('name');
      if (error) throw error;
      return data as Teacher[];
    }
  });

  // Get all profiles
  const { data: profiles, isLoading: loadingProfiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data as Profile[];
    }
  });

  // Combine teachers with their accounts
  const teacherAccounts: TeacherAccount[] = (teachers || []).map(teacher => {
    const profile = profiles?.find(p => p.teacher_id === teacher.id);
    return {
      teacher,
      profile,
      hasAccount: !!profile
    };
  });

  // Create new user account
  const createAccountMutation = useMutation({
    mutationFn: async ({ teacher, accountData }: { teacher: Teacher; accountData: typeof newAccountData }) => {
      // Create user through Supabase auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: accountData.email,
        password: accountData.password,
        email_confirm: true,
        user_metadata: {
          full_name: teacher.name,
          role: 'teacher'
        }
      });

      if (authError) throw authError;

      // Update profile to link with teacher
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          teacher_id: teacher.id,
          role: 'teacher',
          username: accountData.username || null,
          full_name: teacher.name
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      return { user: authData.user, teacher };
    },
    onSuccess: ({ teacher }) => {
      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: `تم إنشاء حساب للمعلم ${teacher.name}`,
      });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      setShowCreateAccount(false);
      setNewAccountData({ email: '', password: '', username: '' });
      setSelectedTeacher(null);
    },
    onError: (error) => {
      toast({
        title: "خطأ في إنشاء الحساب",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  });

  // Link existing account
  const linkAccountMutation = useMutation({
    mutationFn: async ({ teacher, email }: { teacher: Teacher; email: string }) => {
      // Find user by email
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;

      const user = users.users.find((u: any) => u.email === email);
      if (!user) throw new Error('لم يتم العثور على مستخدم بهذا البريد الإلكتروني');

      // Link profile to teacher
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          teacher_id: teacher.id,
          role: 'teacher',
          full_name: teacher.name
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      return { user, teacher };
    },
    onSuccess: ({ teacher }) => {
      toast({
        title: "تم ربط الحساب بنجاح",
        description: `تم ربط الحساب بالمعلم ${teacher.name}`,
      });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      setShowLinkAccount(false);
      setLinkAccountEmail('');
      setSelectedTeacher(null);
    },
    onError: (error) => {
      toast({
        title: "خطأ في ربط الحساب",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  });

  // Reset password
  const resetPasswordMutation = useMutation({
    mutationFn: async (profile: Profile) => {
      if (!profile.email) throw new Error('البريد الإلكتروني غير محدد');
      
      const { error } = await supabase.auth.resetPasswordForEmail(profile.email);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "تم إرسال رابط إعادة تعيين كلمة المرور",
        description: "تم إرسال رابط إعادة تعيين كلمة المرور إلى البريد الإلكتروني",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ في إرسال رابط إعادة تعيين كلمة المرور",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  });

  if (loadingTeachers || loadingProfiles) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">إدارة حسابات المعلمين</h2>
          <p className="text-muted-foreground">
            إنشاء وإدارة حسابات المعلمين في النظام
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="outline" className="gap-1">
            <CheckCircle className="h-3 w-3 text-green-600" />
            {teacherAccounts.filter(ta => ta.hasAccount).length} لديهم حسابات
          </Badge>
          <Badge variant="outline" className="gap-1">
            <XCircle className="h-3 w-3 text-red-600" />
            {teacherAccounts.filter(ta => !ta.hasAccount).length} بدون حسابات
          </Badge>
        </div>
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teacherAccounts.map((teacherAccount) => (
          <Card key={teacherAccount.teacher.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{teacherAccount.teacher.name}</CardTitle>
                  <CardDescription className="text-sm">
                    كود: {teacherAccount.teacher.teacher_code || 'غير محدد'}
                  </CardDescription>
                </div>
                {teacherAccount.hasAccount ? (
                  <Badge className="gap-1 bg-green-100 text-green-800 hover:bg-green-100">
                    <CheckCircle className="h-3 w-3" />
                    متصل
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-orange-600 border-orange-600">
                    <AlertCircle className="h-3 w-3" />
                    غير متصل
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {teacherAccount.hasAccount && teacherAccount.profile ? (
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">البريد: </span>
                    {teacherAccount.profile.email}
                  </div>
                  {teacherAccount.profile.username && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">اسم المستخدم: </span>
                      {teacherAccount.profile.username}
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resetPasswordMutation.mutate(teacherAccount.profile!)}
                    disabled={resetPasswordMutation.isPending}
                    className="w-full gap-2"
                  >
                    <Key className="h-3 w-3" />
                    إعادة تعيين كلمة المرور
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedTeacher(teacherAccount.teacher);
                      setShowCreateAccount(true);
                    }}
                    className="w-full gap-2"
                  >
                    <UserPlus className="h-3 w-3" />
                    إنشاء حساب جديد
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedTeacher(teacherAccount.teacher);
                      setShowLinkAccount(true);
                    }}
                    className="w-full gap-2"
                  >
                    <Link className="h-3 w-3" />
                    ربط حساب موجود
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {teacherAccounts.length === 0 && (
        <Card>
          <CardContent className="text-center p-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا يوجد معلمون في النظام</p>
          </CardContent>
        </Card>
      )}

      {/* Create Account Modal */}
      <Dialog open={showCreateAccount} onOpenChange={setShowCreateAccount}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إنشاء حساب جديد للمعلم</DialogTitle>
          </DialogHeader>
          
          {selectedTeacher && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedTeacher.name}</p>
                <p className="text-sm text-muted-foreground">
                  كود المعلم: {selectedTeacher.teacher_code || 'غير محدد'}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newAccountData.email}
                    onChange={(e) => setNewAccountData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="teacher@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="username">اسم المستخدم (اختياري)</Label>
                  <Input
                    id="username"
                    value={newAccountData.username}
                    onChange={(e) => setNewAccountData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="معرف فريد للدخول"
                  />
                </div>

                <div>
                  <Label htmlFor="password">كلمة المرور</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newAccountData.password}
                    onChange={(e) => setNewAccountData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="كلمة مرور قوية"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateAccount(false)}>
                  إلغاء
                </Button>
                <Button
                  onClick={() => createAccountMutation.mutate({
                    teacher: selectedTeacher,
                    accountData: newAccountData
                  })}
                  disabled={
                    createAccountMutation.isPending ||
                    !newAccountData.email ||
                    !newAccountData.password
                  }
                >
                  {createAccountMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  إنشاء الحساب
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Link Account Modal */}
      <Dialog open={showLinkAccount} onOpenChange={setShowLinkAccount}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ربط حساب موجود بالمعلم</DialogTitle>
          </DialogHeader>
          
          {selectedTeacher && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedTeacher.name}</p>
                <p className="text-sm text-muted-foreground">
                  كود المعلم: {selectedTeacher.teacher_code || 'غير محدد'}
                </p>
              </div>

              <div>
                <Label htmlFor="link-email">البريد الإلكتروني للحساب الموجود</Label>
                <Input
                  id="link-email"
                  type="email"
                  value={linkAccountEmail}
                  onChange={(e) => setLinkAccountEmail(e.target.value)}
                  placeholder="البريد الإلكتروني المسجل"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowLinkAccount(false)}>
                  إلغاء
                </Button>
                <Button
                  onClick={() => linkAccountMutation.mutate({
                    teacher: selectedTeacher,
                    email: linkAccountEmail
                  })}
                  disabled={linkAccountMutation.isPending || !linkAccountEmail}
                >
                  {linkAccountMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link className="h-4 w-4" />
                  )}
                  ربط الحساب
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};