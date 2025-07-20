import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UnifiedLayout } from "@/components/layout/UnifiedLayout";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, MoreHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Subject {
  id: string;
  name: string;
  code?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

const SubjectsPage = () => {
  const { profile, user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectName, setSubjectName] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    code: "",
    description: ""
  });

  // Mock data for now - will be replaced with real API calls after migration
  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: async (): Promise<Subject[]> => {
      // Mock data
      return [
        { id: "1", name: "الرياضيات", code: "MATH", description: "مادة الرياضيات", created_at: "2025-01-01", updated_at: "2025-01-01", created_by: "user1" },
        { id: "2", name: "العلوم", code: "SCI", description: "مادة العلوم", created_at: "2025-01-01", updated_at: "2025-01-01", created_by: "user1" },
        { id: "3", name: "الفيزياء", code: "PHY", description: "مادة الفيزياء", created_at: "2025-01-01", updated_at: "2025-01-01", created_by: "user1" },
        { id: "4", name: "الكيمياء", code: "CHEM", description: "مادة الكيمياء", created_at: "2025-01-01", updated_at: "2025-01-01", created_by: "user1" },
        { id: "5", name: "الأحياء", code: "BIO", description: "مادة الأحياء", created_at: "2025-01-01", updated_at: "2025-01-01", created_by: "user1" },
        { id: "6", name: "اللغة العربية", code: "AR", description: "مادة اللغة العربية", created_at: "2025-01-01", updated_at: "2025-01-01", created_by: "user1" },
        { id: "7", name: "اللغة الإنجليزية", code: "EN", description: "مادة اللغة الإنجليزية", created_at: "2025-01-01", updated_at: "2025-01-01", created_by: "user1" },
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Subject> }) => {
      // Mock implementation
      toast({
        title: "ملاحظة",
        description: "سيتم تنفيذ تحديث المواد الدراسية بعد تحديث قاعدة البيانات",
      });
      return { id, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setShowEditModal(false);
      setEditingSubject(null);
      setEditForm({ name: "", code: "", description: "" });
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
    createSubjectMutation.mutate(subjectName);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject || !editForm.name.trim()) return;
    updateMutation.mutate({ 
      id: editingSubject.id, 
      data: editForm 
    });
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setEditForm({
      name: subject.name,
      code: subject.code || "",
      description: subject.description || ""
    });
    setShowEditModal(true);
  };

  const handleDeleteSubject = (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذه المادة؟")) {
      deleteSubjectMutation.mutate(id);
    }
  };

  const AddSubjectModal = () => (
    <Button onClick={() => setShowAddModal(true)}>
      <BookOpen className="ml-2 h-4 w-4" />
      إضافة مادة دراسية
    </Button>
  );

  return (
    <UnifiedLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">المواد الدراسية</h1>
          <AddSubjectModal />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects?.map((subject) => (
            <Card key={subject.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{subject.name}</CardTitle>
                    {subject.description && (
                      <CardDescription className="mt-1">
                        {subject.description}
                      </CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(subject)}>
                        تعديل
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteSubject(subject.id)}
                      >
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                  {subject.code && (
                    <div>
                      <span className="font-medium">الكود:</span> {subject.code}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">تاريخ الإنشاء:</span>{" "}
                    {format(new Date(subject.created_at), "dd/MM/yyyy", { locale: ar })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {subjects?.length === 0 && (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">لا توجد مواد دراسية</h3>
              <p className="mb-4">ابدأ بإضافة مادة دراسية جديدة</p>
              <AddSubjectModal />
            </div>
          </Card>
        )}

        {/* Add Subject Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>إضافة مادة دراسية جديدة</DialogTitle>
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
                    setSubjectName("");
                  }}
                >
                  إلغاء
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!subjectName.trim() || createSubjectMutation.isPending}
                >
                  {createSubjectMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Subject Modal */}
        {showEditModal && editingSubject && (
          <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>تعديل المادة الدراسية</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">اسم المادة</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-code">كود المادة</Label>
                  <Input
                    id="edit-code"
                    value={editForm.code}
                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">الوصف</Label>
                  <Textarea
                    id="edit-description"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </UnifiedLayout>
  );
};

export default SubjectsPage;