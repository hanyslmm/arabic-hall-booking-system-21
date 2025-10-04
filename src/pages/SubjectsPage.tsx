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
import { BookOpen, MoreHorizontal, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { MobileSubjectCard } from "@/components/subjects/MobileSubjectCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { getSubjects, addSubject, updateSubject, deleteSubject } from "@/api/subjects";

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
  const isMobile = useIsMobile();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectName, setSubjectName] = useState("");
  const [editForm, setEditForm] = useState({
    name: ""
  });

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: getSubjects,
  });

  const createSubjectMutation = useMutation({
    mutationFn: (name: string) => addSubject({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setShowAddModal(false);
      setSubjectName("");
      toast({
        title: "تم بنجاح",
        description: "تم إضافة المادة الدراسية بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة المادة الدراسية",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Subject> }) => 
      updateSubject(id, { name: data.name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setShowEditModal(false);
      setEditingSubject(null);
      setEditForm({ name: "" });
      toast({
        title: "تم بنجاح",
        description: "تم تحديث المادة الدراسية بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث المادة الدراسية",
        variant: "destructive",
      });
    },
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف المادة الدراسية بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف المادة الدراسية",
        variant: "destructive",
      });
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
      name: subject.name
    });
    setShowEditModal(true);
  };

  const handleDeleteSubject = (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذه المادة؟")) {
      deleteSubjectMutation.mutate(id);
    }
  };

  const AddSubjectButton = () => (
    <Button 
      onClick={() => setShowAddModal(true)}
      size={isMobile ? "default" : "default"}
      className={isMobile ? "w-full" : ""}
    >
      <Plus className="ml-2 h-4 w-4" />
      إضافة مادة دراسية
    </Button>
  );

  return (
    <UnifiedLayout>
      <div className="space-y-4 md:space-y-6 p-4 md:p-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">المواد الدراسية</h1>
          {!isMobile && <AddSubjectButton />}
        </div>

        {isMobile && <AddSubjectButton />}

        {isMobile ? (
          <div className="space-y-3">
            {subjects?.map((subject) => (
              <MobileSubjectCard
                key={subject.id}
                subject={subject}
                onEdit={handleEdit}
                onDelete={handleDeleteSubject}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects?.map((subject) => (
              <Card key={subject.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{subject.name}</CardTitle>
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
                  <div>
                    <span className="font-medium">تاريخ الإنشاء:</span>{" "}
                    {format(new Date(subject.created_at), "dd/MM/yyyy", { locale: ar })}
                  </div>
                </div>
              </CardContent>
              </Card>
            ))}
          </div>
        )}

        {subjects?.length === 0 && (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">لا توجد مواد دراسية</h3>
              <p className="mb-4">ابدأ بإضافة مادة دراسية جديدة</p>
              <AddSubjectButton />
            </div>
          </Card>
        )}

        {/* Add Subject Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className={isMobile ? "max-w-[95vw]" : "max-w-sm"}>
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
              
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2 sm:space-x-reverse">
                <Button 
                  type="button" 
                  variant="outline" 
                  className={isMobile ? "w-full" : ""}
                  onClick={() => {
                    setShowAddModal(false);
                    setSubjectName("");
                  }}
                >
                  إلغاء
                </Button>
                <Button 
                  className={isMobile ? "w-full" : ""}
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
            <DialogContent className={isMobile ? "max-w-[95vw]" : "sm:max-w-[425px]"}>
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
                <DialogFooter className={isMobile ? "flex-col gap-2" : ""}>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className={isMobile ? "w-full" : ""}
                    onClick={() => setShowEditModal(false)}
                  >
                    إلغاء
                  </Button>
                  <Button 
                    type="submit" 
                    className={isMobile ? "w-full" : ""}
                    disabled={updateMutation.isPending}
                  >
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