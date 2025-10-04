import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UnifiedLayout } from "@/components/layout/UnifiedLayout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, GraduationCap, Upload, Phone, BookOpen, Calendar, UserPlus } from "lucide-react";
import { AddTeacherModal } from "@/components/teacher/AddTeacherModal";
import { EditTeacherModal } from "@/components/teacher/EditTeacherModal";
import { TeacherCodeManager } from "@/components/teacher/TeacherCodeManager";
import { BulkUploadModal } from "@/components/teacher/BulkUploadModal";
import { TeacherAccountManager } from "@/components/teacher/TeacherAccountManager";
import { formatShortArabicDate } from "@/utils/dateUtils";
import { Badge } from "@/components/ui/badge";
import { getTeachers, deleteTeacher, updateTeacher, applyTeacherDefaultFee } from "@/api/teachers";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { MobileResponsiveTable, TableColumn, TableAction } from "@/components/common/MobileResponsiveTable";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Teacher {
  id: string;
  name: string;
  mobile_phone?: string | null;
  subject_ids?: string[] | null;
  created_at: string;
  // Relations - these would come from separate queries
  subjects?: { subjects?: { id: string; name: string } }[];
  default_class_fee?: number | null;
}

const TeachersPage = () => {
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [showEditTeacher, setShowEditTeacher] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [confirmDeleteTeacher, setConfirmDeleteTeacher] = useState<Teacher | null>(null);
  const [feeModalTeacher, setFeeModalTeacher] = useState<Teacher | null>(null);
  const [newDefaultFee, setNewDefaultFee] = useState<number>(0);
  const [candidateBookings, setCandidateBookings] = useState<Array<{id:string; class_code:string; start_date:string; end_date:string|null}>>([]);
  const [selectedBookingIds, setSelectedBookingIds] = useState<Set<string>>(new Set());
  const [applyToCurrentMonth, setApplyToCurrentMonth] = useState<boolean>(true);
  const [showTeacherAccountManager, setShowTeacherAccountManager] = useState(false);
  const { profile, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teachers, isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: getTeachers
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: async (teacherId: string) => {
      await deleteTeacher(teacherId);
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
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const canManage = profile?.user_role === 'owner' || profile?.user_role === 'manager' || profile?.user_role === 'space_manager' || isAdmin;

  // Define table columns with mobile optimization
  const teacherColumns: TableColumn<Teacher>[] = [
    {
      key: 'name',
      header: 'اسم المعلم',
      mobileLabel: 'الاسم',
      render: (teacher) => (
        <span className="font-medium">{teacher.name}</span>
      ),
    },
    {
      key: 'mobile_phone',
      header: 'رقم التلفون',
      mobileLabel: 'التلفون',
      render: (teacher) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground sm:inline hidden" />
          {teacher.mobile_phone || "غير محدد"}
        </div>
      ),
    },
    {
      key: 'subjects',
      header: 'المواد الدراسية',
      mobileLabel: 'المواد',
      render: (teacher) => {
        const names = (teacher.subjects || []).map((s) => s.subjects?.name).filter(Boolean);
        return (
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground sm:inline hidden" />
            {names.length > 0 ? names.join('، ') : 'غير محدد'}
          </div>
        );
      },
    },
    {
      key: 'created_at',
      header: 'تاريخ الإضافة',
      mobileLabel: 'التاريخ',
      hideOnMobile: true,
      render: (teacher) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {formatShortArabicDate(teacher.created_at)}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'الحالة',
      mobileLabel: 'الحالة',
      render: () => (
        <Badge variant="outline" className="text-green-600">
          نشط
        </Badge>
      ),
    },
    {
      key: 'default_fee',
      header: 'الرسوم الافتراضية',
      mobileLabel: 'الرسوم',
      render: (teacher) => (
        <span>{teacher.default_class_fee ?? 0} جنيه</span>
      ),
    },
  ];

  // Table actions
  const teacherActions: TableAction<Teacher>[] = canManage ? [
    {
      label: 'تعديل',
      onClick: (teacher) => {
        setSelectedTeacher(teacher);
        setShowEditTeacher(true);
      },
      variant: 'outline',
      size: 'sm',
      icon: <Edit className="h-4 w-4" />,
    },
    {
      label: 'تعديل الرسوم',
      onClick: (teacher) => {
        setFeeModalTeacher(teacher);
        setNewDefaultFee(teacher.default_class_fee ?? 0);
        (async ()=>{
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth()+1, 0);
          const startStr = `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth()+1).padStart(2,'0')}-01`;
          const endStr = `${endOfMonth.getFullYear()}-${String(endOfMonth.getMonth()+1).padStart(2,'0')}-${String(endOfMonth.getDate()).padStart(2,'0')}`;
          const { data, error } = await supabase
            .from('bookings')
            .select('id, class_code, start_date, end_date')
            .eq('teacher_id', teacher.id)
            .lte('start_date', endStr)
            .or(`end_date.is.null,end_date.gte.${startStr}`)
            .order('start_date', { ascending: true });
          if (!error) {
            const rows = (data as any[]) || [];
            setCandidateBookings(rows.map(r=>({id:r.id, class_code:r.class_code || '-', start_date:r.start_date, end_date:r.end_date})));
            setSelectedBookingIds(new Set(rows.map(r=>r.id)));
          }
        })();
      },
      variant: 'outline',
      size: 'sm',
      icon: <Edit className="h-4 w-4" />,
    },
    {
      label: 'حذف',
      onClick: (teacher) => setConfirmDeleteTeacher(teacher),
      variant: 'destructive',
      size: 'sm',
      icon: <Trash2 className="h-4 w-4" />,
    },
  ] : [];

  // Render expanded content for each teacher (details only)
  const renderExpandedTeacherContent = (teacher: Teacher) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2">
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">معلومات الاتصال</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">الاسم:</span>
            <span>{teacher.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">رقم التلفون:</span>
            <span>{teacher.mobile_phone || "غير محدد"}</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">المعلومات الأكاديمية</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">المواد الدراسية:</span>
            <span>{(teacher.subjects || []).map(s=>s.subjects?.name).filter(Boolean).join('، ') || "غير محدد"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">المراحل الدراسية:</span>
            <span className="text-right">غير محدد</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">تاريخ الإضافة:</span>
            <span>{formatShortArabicDate(teacher.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Export to CSV
  const exportToCSV = () => {
    if (!teachers || teachers.length === 0) return;

    const headers = [
      'الاسم',
      'رقم التلفون',
      'المادة الدراسية',
      'المراحل الدراسية',
      'تاريخ الإضافة'
    ];

    const csvContent = [
      headers.join(','),
      ...teachers.map(teacher => [
        teacher.name,
        teacher.mobile_phone || '',
        'المادة الدراسية',
        '',
        format(new Date(teacher.created_at), 'yyyy-MM-dd')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `teachers-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import from CSV
  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',');
        
        // Skip header row
        const teachersData = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',');
            return {
              name: values[0]?.trim(),
              mobile_phone: values[1]?.trim() || null,
              // For now, we'll just import basic data without subjects/stages
              // as that would require more complex mapping
            };
          })
          .filter(teacher => teacher.name);

        if (teachersData.length === 0) {
          toast({
            title: "خطأ",
            description: "لم يتم العثور على بيانات صالحة في الملف",
            variant: "destructive",
          });
          return;
        }

        // Get current user for created_by field
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          toast({
            title: "خطأ",
            description: "غير مصرح",
            variant: "destructive",
          });
          return;
        }

        const teachersWithCreatedBy = teachersData.map(teacher => ({
          ...teacher,
          created_by: user.user.id
        }));

        const { error } = await supabase
          .from('teachers')
          .insert(teachersWithCreatedBy);

        if (error) throw error;

        toast({
          title: "تم الاستيراد بنجاح",
          description: `تم استيراد ${teachersData.length} معلم`,
        });

        queryClient.invalidateQueries({ queryKey: ['teachers'] });
      } catch (error) {
        console.error('Import error:', error);
        toast({
          title: "خطأ في الاستيراد",
          description: "فشل في استيراد البيانات",
          variant: "destructive",
        });
      }
    };
    
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  return (
    <UnifiedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">إدارة المعلمين</h1>
            <p className="text-muted-foreground mt-2">عرض وإدارة بيانات المعلمين</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowAddTeacher(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              إضافة معلم
            </Button>
            <BulkUploadModal>
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                رفع ملف Excel
              </Button>
            </BulkUploadModal>
          </div>
        </div>

        {/* Table and actions remain unchanged */}
        <MobileResponsiveTable
          data={teachers || []}
          columns={teacherColumns}
          actions={teacherActions}
          title="قائمة المعلمين"
          isLoading={isLoading}
          emptyMessage="لم يتم إضافة أي معلمين بعد"
          emptyIcon={<GraduationCap className="h-16 w-16 mx-auto text-muted-foreground" />}
          emptyAction={canManage ? { label: 'إضافة معلم جديد', onClick: () => setShowAddTeacher(true), icon: <Plus className="h-4 w-4 mr-2" /> } : undefined}
          getRowKey={(teacher) => teacher.id}
          expandedContent={renderExpandedTeacherContent}
          itemsPerPage={50}
        />

        {/* Teacher Code Management */}
        {canManage && <TeacherCodeManager />}

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
            <TeacherAccountManager />
          </>
        )}

        {/* Default fee modal */}
        <Dialog open={!!feeModalTeacher} onOpenChange={(open) => { if(!open){ setFeeModalTeacher(null); setCandidateBookings([]); setSelectedBookingIds(new Set()); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تعديل الرسوم الافتراضية للمعلم</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>الرسوم الافتراضية (تطبق تلقائياً على كل مجموعات هذا المعلم التي ليست "مخصصة")</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*[.,]?[0-9]*"
                  value={String(newDefaultFee ?? '')}
                  onChange={(e)=>{
                    const toEnglish = (s: string) => s.replace(/[\u0660-\u0669]/g, (d)=> String(d.charCodeAt(0)-0x0660));
                    const raw = toEnglish(e.target.value);
                    const normalized = raw.replace(',', '.');
                    const parsed = normalized.trim() === '' ? NaN : Number(normalized);
                    setNewDefaultFee(Number.isFinite(parsed) ? parsed : 0);
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="apply-current-month"
                  type="checkbox"
                  checked={applyToCurrentMonth}
                  onChange={(e)=> setApplyToCurrentMonth(e.target.checked)}
                />
                <Label htmlFor="apply-current-month">تطبيق التغيير أيضاً على الشهر الحالي</Label>
              </div>
              <div className="space-y-2">
                <Label>المجموعات التي سيُطبق عليها التغيير</Label>
                <div className="max-h-56 overflow-auto rounded border p-2 space-y-1">
                  {candidateBookings.length === 0 && (
                    <div className="text-sm text-muted-foreground">لا توجد مجموعات حالية أو قادمة لهذا المعلم.</div>
                  )}
                  {candidateBookings.map((b)=>{
                    const checked = selectedBookingIds.has(b.id);
                    return (
                      <label key={b.id} className="flex items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e)=>{
                              setSelectedBookingIds(prev=>{
                                const n = new Set(prev);
                                if(e.target.checked) n.add(b.id); else n.delete(b.id);
                                return n;
                              });
                            }}
                          />
                          <span className="font-mono">{b.class_code}</span>
                        </div>
                        <span className="text-muted-foreground">{b.start_date}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="text-xs text-muted-foreground">المحدد حالياً: {selectedBookingIds.size} مجموعة</div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={()=> setFeeModalTeacher(null)}>إلغاء</Button>
                <Button
                  onClick={async ()=>{
                    if(!feeModalTeacher) return;
                    try{
                      await applyTeacherDefaultFee(
                        feeModalTeacher.id,
                        newDefaultFee,
                        Array.from(selectedBookingIds),
                        { applyToCurrentMonth }
                      );
                      setFeeModalTeacher(null);
                      setNewDefaultFee(0);
                      toast({ title: 'تم تطبيق الرسوم الافتراضية وتحديث المجموعات والطلاب' });
                      queryClient.invalidateQueries({ queryKey: ['teachers'] });
                      queryClient.invalidateQueries({ queryKey: ['bookings'] });
                      queryClient.invalidateQueries({ queryKey: ['registrations'] });
                    }catch(err:any){
                      toast({ title: 'فشل تحديث الرسوم', description: err.message, variant: 'destructive' });
                    }
                  }}
                >حفظ</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
        <AlertDialog open={!!confirmDeleteTeacher} onOpenChange={(open) => { if (!open) setConfirmDeleteTeacher(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف المعلم "{confirmDeleteTeacher?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (confirmDeleteTeacher) {
                    deleteTeacherMutation.mutate(confirmDeleteTeacher.id);
                  }
                  setConfirmDeleteTeacher(null);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </UnifiedLayout>
  );
};

export default TeachersPage;
