import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Users, UserCog } from "lucide-react";
import { AddUserModal } from "@/components/user/AddUserModal";
import { formatShortArabicDate } from "@/utils/dateUtils";

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  user_role: 'owner' | 'manager' | 'space_manager';
  role: 'USER' | 'ADMIN';
  created_at: string;
}

const UsersPage = () => {
  const { profile, canManageUsers, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddUserOpen, setAddUserOpen] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, user_role, role, created_at')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UserProfile[];
    }
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole, appRole }: { userId: string; newRole: 'owner' | 'manager' | 'space_manager'; appRole?: 'USER' | 'ADMIN' }) => {
      const updateData: any = { user_role: newRole };
      if (appRole !== undefined) {
        updateData.role = appRole;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "تم تحديث الدور بنجاح",
        description: "تم تحديث دور المستخدم في النظام",
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      toast({
        title: "خطأ في تحديث الدور",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'destructive';
      case 'manager':
        return 'default';
      case 'space_manager':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'مالك';
      case 'manager':
        return 'مدير';
      case 'space_manager':
        return 'مدير قاعات';
      default:
        return 'مستخدم';
    }
  };

  if (!canManageUsers) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar 
          userRole={profile?.user_role} 
          userName={profile?.full_name || profile?.email || undefined}
          isAdmin={isAdmin}
        />
        <main className="container mx-auto p-4">
          <Card>
            <CardContent className="p-8 text-center">
              <UserCog className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">غير مصرح</h2>
              <p className="text-muted-foreground">
                هذه الصفحة متاحة للمالكين فقط
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
        <Navbar 
          userRole={profile?.user_role} 
          userName={profile?.full_name || profile?.email || undefined}
          isAdmin={isAdmin}
        />
      <main className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">إدارة المستخدمين</h1>
            <p className="text-muted-foreground mt-2">
              إدارة المستخدمين وأدوارهم في النظام
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span className="font-semibold">{users?.length || 0} مستخدم</span>
            <Button onClick={() => setAddUserOpen(true)} variant="default" size="sm">
              إضافة مستخدم
            </Button>
          </div>
        </div>
        <AddUserModal isOpen={isAddUserOpen} onClose={() => setAddUserOpen(false)} />
        <Card>
          <CardHeader>
            <CardTitle>قائمة المستخدمين</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p>جاري تحميل المستخدمين...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">البريد الإلكتروني</TableHead>
                    <TableHead className="text-right">الدور</TableHead>
                    <TableHead className="text-right">الصلاحيات</TableHead>
                    <TableHead className="text-right">تاريخ التسجيل</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name || 'غير محدد'}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.user_role)}>
                          {getRoleLabel(user.user_role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'outline'}>
                          {user.role === 'ADMIN' ? 'مدير' : 'مستخدم'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatShortArabicDate(user.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Select
                            value={user.user_role}
                            onValueChange={(value) => 
                              updateUserRoleMutation.mutate({ 
                                userId: user.id, 
                                newRole: value as 'owner' | 'manager' | 'space_manager' 
                              })
                            }
                            disabled={user.id === profile?.id}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="space_manager">مدير قاعات</SelectItem>
                              <SelectItem value="manager">مدير</SelectItem>
                              <SelectItem value="owner">مالك</SelectItem>
                            </SelectContent>
                          </Select>
                          {profile?.role === 'ADMIN' && (
                            <Button
                              size="sm"
                              variant={user.role === 'ADMIN' ? "destructive" : "outline"}
                              onClick={() => 
                                updateUserRoleMutation.mutate({ 
                                  userId: user.id, 
                                  newRole: user.user_role,
                                  appRole: user.role === 'ADMIN' ? 'USER' : 'ADMIN'
                                })
                              }
                              disabled={user.id === profile?.id}
                            >
                              {user.role === 'ADMIN' ? 'إزالة صلاحية' : 'إضافة صلاحية'}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UsersPage;
