
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, GraduationCap } from "lucide-react";
import { AddTeacherModal } from "@/components/teacher/AddTeacherModal";
import { EditTeacherModal } from "@/components/teacher/EditTeacherModal";
import { Badge } from "@/components/ui/badge";

interface Teacher {
  id: string;
  name: string;
  created_at: string;
}

const TeachersPage = () => {
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [showEditTeacher, setShowEditTeacher] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teachers, isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Teacher[];
    }
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: async (teacherId: string) => {
      const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', teacherId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "تم حذف المعلم بنجاح",
        description: "تم حذف المعلم من النظام",
      });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (error) => {
      toast({
        title: "خطأ في حذف المعلم",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const canManage = profile?.user_role === 'owner' || profile?.user_role === 'manager';

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        userRole={profile?.user_role} 
        userName={profile?.full_name || profile?.email || undefined}
      />
      
      <main className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">إدارة المعلمين</h1>
            <p className="text-muted-foreground mt-2">
              عرض وإدارة المعلمين في النظام
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              <span className="font-semibold">{teachers?.length || 0} معلم</span>
            </div>
            {canManage && (
              <Button
                onClick={() => setShowAddTeacher(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                إضافة معلم جديد
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>قائمة المعلمين</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p>جاري تحميل المعلمين...</p>
              </div>
            ) : teachers?.length === 0 ? (
              <div className="text-center py-8">
                <GraduationCap className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">لا يوجد معلمين</h3>
                <p className="text-muted-foreground mb-4">
                  لم يتم إضافة أي معلمين بعد
                </p>
                {canManage && (
                  <Button onClick={() => setShowAddTeacher(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    إضافة أول معلم
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">اسم المعلم</TableHead>
                    <TableHead className="text-right">تاريخ الإضافة</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    {canManage && <TableHead className="text-right">الإجراءات</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers?.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium">
                        {teacher.name}
                      </TableCell>
                      <TableCell>
                        {new Date(teacher.created_at).toLocaleDateString('ar-SA')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-green-600">
                          نشط
                        </Badge>
                      </TableCell>
                      {canManage && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedTeacher(teacher);
                                setShowEditTeacher(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteTeacherMutation.mutate(teacher.id)}
                              disabled={deleteTeacherMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {canManage && (
          <>
            <AddTeacherModal 
              isOpen={showAddTeacher}
              onClose={() => setShowAddTeacher(false)}
            />
            <EditTeacherModal
              isOpen={showEditTeacher}
              onClose={() => setShowEditTeacher(false)}
              teacher={selectedTeacher}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default TeachersPage;
