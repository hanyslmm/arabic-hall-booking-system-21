import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Plus, UserPlus, Key } from 'lucide-react';
import { createUser } from '@/api/users';
import { getTeachers } from '@/api/teachers';
import { supabase } from '@/integrations/supabase/client';

interface TeacherAccountManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CreateTeacherAccountData {
  teacher_id: string;
  username: string;
  password: string;
  email?: string;
}

export function TeacherAccountManager({ isOpen, onClose }: TeacherAccountManagerProps) {
  const [formData, setFormData] = useState<CreateTeacherAccountData>({
    teacher_id: '',
    username: '',
    password: '',
    email: ''
  });
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: getTeachers
  });

  // Fetch existing teacher accounts
  const { data: teacherAccounts = [] } = useQuery({
    queryKey: ['teacher-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, username, email, full_name, teacher_id,
          teachers(name)
        `)
        .eq('user_role', 'teacher');
      
      if (error) throw error;
      return data;
    }
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: CreateTeacherAccountData) => {
      // Create user account
      const user = await createUser({
        username: data.username,
        password: data.password,
        email: data.email || `${data.username}@teacher.local`,
        full_name: teachers.find(t => t.id === data.teacher_id)?.name || data.username,
        user_role: 'teacher'
      });

      // Link teacher to profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ teacher_id: data.teacher_id })
        .eq('id', user.id);

      if (updateError) throw updateError;

      return user;
    },
    onSuccess: () => {
      toast({ title: 'تم إنشاء حساب المعلم بنجاح' });
      queryClient.invalidateQueries({ queryKey: ['teacher-accounts'] });
      handleClose();
    },
    onError: (error: any) => {
      toast({ 
        title: 'خطأ في إنشاء الحساب', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.teacher_id || !formData.username || !formData.password) {
      toast({ 
        title: 'خطأ في البيانات', 
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive' 
      });
      return;
    }

    createAccountMutation.mutate(formData);
  };

  const handleClose = () => {
    setFormData({
      teacher_id: '',
      username: '',
      password: '',
      email: ''
    });
    onClose();
  };

  const teachersWithoutAccounts = teachers.filter(teacher => 
    !teacherAccounts.some(account => account.teacher_id === teacher.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            إدارة حسابات المعلمين
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Account Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                إنشاء حساب جديد
              </CardTitle>
              <CardDescription>
                إنشاء حساب دخول للمعلم لرؤية إحصائياته وطلابه
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="teacher">المعلم</Label>
                  <Select 
                    value={formData.teacher_id} 
                    onValueChange={(value) => {
                      const teacher = teachers.find(t => t.id === value);
                      setFormData(prev => ({ 
                        ...prev, 
                        teacher_id: value,
                        username: teacher?.name?.replace(/\s+/g, '').toLowerCase() || ''
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المعلم" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachersWithoutAccounts.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="username">اسم المستخدم</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="username"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">البريد الإلكتروني (اختياري)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="teacher@example.com"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">كلمة المرور</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generatePassword}
                      className="flex items-center gap-2"
                    >
                      <Key className="h-3 w-3" />
                      توليد تلقائي
                    </Button>
                  </div>
                  <Input
                    id="password"
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="كلمة المرور"
                    required
                  />
                </div>

                {formData.password && (
                  <Alert>
                    <AlertDescription>
                      تأكد من حفظ كلمة المرور وتسليمها للمعلم: <strong>{formData.password}</strong>
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  disabled={createAccountMutation.isPending}
                  className="w-full"
                >
                  {createAccountMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Existing Accounts */}
          <Card>
            <CardHeader>
              <CardTitle>الحسابات الموجودة</CardTitle>
              <CardDescription>
                حسابات المعلمين المُنشأة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teacherAccounts.length > 0 ? (
                  teacherAccounts.map((account: any) => (
                    <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{account.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          اسم المستخدم: {account.username}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          البريد: {account.email}
                        </div>
                      </div>
                      <Badge variant="default">معلم</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    لا توجد حسابات معلمين مُنشأة
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
