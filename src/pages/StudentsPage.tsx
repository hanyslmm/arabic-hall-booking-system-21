import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { AddStudentModal } from "@/components/student/AddStudentModal";
import { EditStudentModal } from "@/components/student/EditStudentModal";
import { BulkUploadModal } from "@/components/student/BulkUploadModal";
import { studentsApi, Student } from "@/api/students";
import { Plus, Search, Upload, Edit, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

const StudentsPage = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: students = [], isLoading, error } = useQuery({
    queryKey: ["students"],
    queryFn: studentsApi.getAll,
  });

  const searchMutation = useMutation({
    mutationFn: studentsApi.search,
    onSuccess: (searchResults) => {
      queryClient.setQueryData(["students"], searchResults);
    },
    onError: () => {
      toast.error("فشل في البحث عن الطالب");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: studentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("تم حذف الطالب بنجاح");
    },
    onError: () => {
      toast.error("فشل في حذف الطالب");
    }
  });

  const bulkUploadMutation = useMutation({
    mutationFn: async (students: any[]) => {
      const results = [];
      for (const studentData of students) {
        const student = await studentsApi.create({
          name: studentData.name,
          mobile_phone: studentData.mobile,
          parent_phone: studentData.home,
          city: studentData.city,
        });
        results.push(student);
      }
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success(`تم إضافة ${results.length} طالب بنجاح`);
    },
    onError: () => {
      toast.error("فشل في رفع بيانات الطلاب");
    }
  });

  const handleSearch = () => {
    if (searchTerm.trim()) {
      searchMutation.mutate(searchTerm.trim());
    } else {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const resetSearch = () => {
    setSearchTerm("");
    queryClient.invalidateQueries({ queryKey: ["students"] });
  };

  const canManageStudents = profile?.role === 'ADMIN' || 
    (profile?.user_role && ['owner', 'manager'].includes(profile.user_role));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar 
          userRole={profile?.user_role} 
          userName={profile?.full_name || profile?.email || undefined}
        />
        <div className="container mx-auto p-4">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar 
          userRole={profile?.user_role} 
          userName={profile?.full_name || profile?.email || undefined}
        />
        <div className="container mx-auto p-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-destructive">خطأ في تحميل بيانات الطلاب</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        userRole={profile?.user_role} 
        userName={profile?.full_name || profile?.email || undefined}
      />
      
      <main className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
              <Users className="h-8 w-8" />
              إدارة الطلاب
            </h1>
            <p className="text-muted-foreground mt-2">
              إدارة معلومات الطلاب والتسجيلات
            </p>
          </div>
          
          {canManageStudents && (
            <div className="flex gap-2">
              <Button
                onClick={() => setShowBulkUpload(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                رفع ملف Excel
              </Button>
              <Button
                onClick={() => setShowAddStudent(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                إضافة طالب جديد
              </Button>
            </div>
          )}
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>البحث عن طالب</CardTitle>
            <CardDescription>
              يمكن البحث باستخدام رقم الهاتف أو الرقم التسلسلي للطالب
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="رقم الهاتف أو الرقم التسلسلي..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                onClick={handleSearch}
                disabled={searchMutation.isPending}
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                بحث
              </Button>
              {searchTerm && (
                <Button
                  onClick={resetSearch}
                  variant="outline"
                >
                  إلغاء البحث
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة الطلاب ({students.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد طلاب مسجلين</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الرقم التسلسلي</TableHead>
                      <TableHead>الاسم</TableHead>
                      <TableHead>رقم الهاتف</TableHead>
                      <TableHead>هاتف ولي الأمر</TableHead>
                      <TableHead>المدينة</TableHead>
                      <TableHead>تاريخ التسجيل</TableHead>
                      {canManageStudents && <TableHead>الإجراءات</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Badge variant="secondary">{student.serial_number}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.mobile_phone}</TableCell>
                        <TableCell>{student.parent_phone || '-'}</TableCell>
                        <TableCell>{student.city || '-'}</TableCell>
                        <TableCell>
                          {new Date(student.created_at).toLocaleDateString('ar-SA')}
                        </TableCell>
                        {canManageStudents && (
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingStudent(student)}
                                className="flex items-center gap-1"
                              >
                                <Edit className="h-3 w-3" />
                                تعديل
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="flex items-center gap-1"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    حذف
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      هل أنت متأكد من حذف الطالب "{student.name}"؟ 
                                      هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع تسجيلاته وحضوره ومدفوعاته.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteMutation.mutate(student.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      حذف
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
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

        {/* Modals */}
        <AddStudentModal 
          isOpen={showAddStudent}
          onClose={() => setShowAddStudent(false)}
        />
        
        <BulkUploadModal 
          isOpen={showBulkUpload}
          onClose={() => setShowBulkUpload(false)}
          onUpload={(students) => bulkUploadMutation.mutate(students)}
          defaultClassFees={0}
        />
        
        {editingStudent && (
          <EditStudentModal 
            student={editingStudent}
            isOpen={true}
            onClose={() => setEditingStudent(null)}
          />
        )}
      </main>
    </div>
  );
};

export default StudentsPage;