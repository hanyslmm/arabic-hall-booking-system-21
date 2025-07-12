import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatShortArabicDate } from "@/utils/dateUtils";

interface Subject {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

const SubjectsPage = () => {
  const { profile, user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectName, setSubjectName] = useState("");

  // Mock data for now - will be replaced with real API calls after migration
  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: async (): Promise<Subject[]> => {
      // Mock data
      return [
        { id: "1", name: "الرياضيات", created_at: "2025-01-01", updated_at: "2025-01-01", created_by: "user1" },
        { id: "2", name: "العلوم", created_at: "2025-01-01", updated_at: "2025-01-01", created_by: "user1" },
        { id: "3", name: "الفيزياء", created_at: "2025-01-01", updated_at: "2025-01-01", created_by: "user1" },
        { id: "4", name: "الكيمياء", created_at: "2025-01-01", updated_at: "2025-01-01", created_by: "user1" },
        { id: "5", name: "الأحياء", created_at: "2025-01-01", updated_at: "2025-01-01", created_by: "user1" },
        { id: "6", name: "اللغة العربية", created_at: "2025-01-01", updated_at: "2025-01-01", created_by: "user1" },
        { id: "7", name: "اللغة الإنجليزية", created_at: "2025-01-01", updated_at: "2025-01-01", created_by: "user1" },
      ];
    },
  });

  const createSubjectMutation = useMutation({
    mutationFn: async (name: string) => {
      // Mock implementation
      toast({
        title: "ملاحظة",
        description: "سيتم تنفيذ إضافة المواد الدراسية بعد تحديث قاعدة البيانات",
      });
      return { id: Date.now().toString(), name, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: "user" };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setShowAddModal(false);
      setSubjectName("");
    },
  });

  const updateSubjectMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      // Mock implementation
      toast({
        title: "ملاحظة",
        description: "سيتم تنفيذ تحديث المواد الدراسية بعد تحديث قاعدة البيانات",
      });
      return { id, name };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setEditingSubject(null);
      setSubjectName("");
    },
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: async (id: string) => {
      // Mock implementation
      toast({
        title: "ملاحظة",
        description: "سيتم تنفيذ حذف المواد الدراسية بعد تحديث قاعدة البيانات",
      });
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });

  const handleSubmit = () => {
    if (!subjectName.trim()) return;

    if (editingSubject) {
      updateSubjectMutation.mutate({ id: editingSubject.id, name: subjectName });
    } else {
      createSubjectMutation.mutate(subjectName);
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setSubjectName(subject.name);
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذه المادة؟")) {
      deleteSubjectMutation.mutate(id);
    }
  };

  const canManage = profile?.user_role === 'owner' || profile?.user_role === 'manager' || isAdmin;

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        userRole={profile?.user_role} 
        userName={profile?.full_name || profile?.email || undefined}
        isAdmin={isAdmin}
      />
      
      <AdminLayout>
        <main className="flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">المواد الدراسية</h1>
              <p className="text-muted-foreground mt-2">
                إدارة المواد الدراسية المتاحة في النظام
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                <span className="font-semibold">{subjects?.length || 0} مادة</span>
              </div>
              {canManage && (
                <Button 
                  onClick={() => {
                    setEditingSubject(null);
                    setSubjectName("");
                    setShowAddModal(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة مادة
                </Button>
              )}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>قائمة المواد الدراسية</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p>جاري تحميل المواد الدراسية...</p>
                </div>
              ) : subjects?.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">لا توجد مواد دراسية</h3>
                  <p className="text-muted-foreground mb-4">
                    لم يتم إضافة أي مواد دراسية بعد
                  </p>
                  {canManage && (
                    <Button 
                      onClick={() => {
                        setEditingSubject(null);
                        setSubjectName("");
                        setShowAddModal(true);
                      }}
                    >
                      إضافة مادة جديدة
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">اسم المادة</TableHead>
                        <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                        {canManage && (
                          <TableHead className="text-right">الإجراءات</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjects?.map((subject) => (
                        <TableRow key={subject.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-muted-foreground" />
                              {subject.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatShortArabicDate(subject.created_at)}
                          </TableCell>
                          {canManage && (
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(subject)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(subject.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </AdminLayout>

      {/* Add/Edit Subject Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingSubject ? "تعديل المادة الدراسية" : "إضافة مادة دراسية جديدة"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject_name">اسم المادة</Label>
              <Input
                id="subject_name"
                placeholder="أدخل اسم المادة"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowAddModal(false);
                  setEditingSubject(null);
                  setSubjectName("");
                }}
              >
                إلغاء
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!subjectName.trim() || createSubjectMutation.isPending || updateSubjectMutation.isPending}
              >
                {createSubjectMutation.isPending || updateSubjectMutation.isPending 
                  ? "جاري الحفظ..." 
                  : editingSubject ? "تحديث" : "حفظ"
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubjectsPage;
