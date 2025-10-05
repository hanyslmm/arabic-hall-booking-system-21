import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Calculator, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, Pencil, Trash2, Settings as SettingsIcon, Plus as PlusIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { dailySettlementsApi, CreateSettlementData } from "@/api/dailySettlements";
import { settingsApi } from "@/api/settings";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/currency";
import { useAuth } from "@/hooks/useAuth";

interface Teacher {
  id: string;
  name: string;
  subjects?: { id: string; name: string }[];
}

interface Subject {
  id: string;
  name: string;
}

// Categories loaded from settings; default fallback is embedded in settingsApi
// Will be hydrated via react-query

export default function DailySettlementPage() {
  const { profile, isAdmin, isOwner } = useAuth();
  const isHallManager = profile?.user_role === 'space_manager';
  const isManagerOrHigher = isHallManager || profile?.user_role === 'manager' || isAdmin || isOwner || profile?.role === 'admin';
  const isGeneralManager = profile?.user_role === 'manager' || profile?.role === 'manager';
  const canModerateDirectly = !!(isAdmin || isOwner || isGeneralManager);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null);
  const todayStr = new Date().toISOString().split('T')[0];
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [formInstanceKey, setFormInstanceKey] = useState(0);
  const [formData, setFormData] = useState<CreateSettlementData>({
    settlement_date: todayStr,
    type: 'income',
    amount: 0,
    source_type: 'teacher',
    source_name: '',
    notes: ''
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch teachers with their subjects
  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers-with-subjects'],
    queryFn: async () => {
      const { data: teachersData, error: teachersError } = await supabase
        .from('teachers')
        .select('id, name')
        .order('name');
      if (teachersError) throw teachersError;

      // Fetch subjects for each teacher
      const teachersWithSubjects = await Promise.all(
        (teachersData || []).map(async (teacher) => {
          const { data: subjectsData } = await supabase
            .from('teacher_subjects')
            .select('subject_id, subjects(id, name)')
            .eq('teacher_id', teacher.id);

          const subjects = (subjectsData || [])
            .map((ts: any) => ts.subjects)
            .filter(Boolean);

          return { ...teacher, subjects };
        })
      );

      return teachersWithSubjects as Teacher[];
    }
  });

  // Fetch expense categories
  const { data: expenseCategories = [] } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => settingsApi.getExpenseCategories(),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch settlements for selected date
  const { data: settlements = [], isLoading } = useQuery({
    queryKey: ['daily-settlements', selectedDate],
    queryFn: () => dailySettlementsApi.getByDate(selectedDate)
  });

  // Lookup creators (employees) who inserted the records
  const createdByIds = useMemo(() => Array.from(new Set((settlements || []).map((s: any) => s.created_by).filter(Boolean))), [settlements]);

  const { data: creators = [] } = useQuery({
    queryKey: ['profiles-by-ids', createdByIds],
    queryFn: async () => {
      if (!createdByIds || createdByIds.length === 0) return [] as Array<{ id: string; full_name?: string | null; username?: string | null }>;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .in('id', createdByIds);
      if (error) throw error;
      return (data || []) as Array<{ id: string; full_name?: string | null; username?: string | null }>;
    },
    enabled: createdByIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const creatorNameById = useMemo(() => {
    const map = new Map<string, string>();
    (creators as Array<{ id: string; full_name?: string | null; username?: string | null }>).forEach((p) => {
      map.set(p.id, (p.full_name || p.username || p.id) as string);
    });
    return map;
  }, [creators]);

  // Inline component: Category manager UI for the modal
  function CategoryManagerModal() {
    const [localCategories, setLocalCategories] = useState<string[]>(expenseCategories || []);
    const [newCat, setNewCat] = useState<string>("");

    const saveMutation = useMutation({
      mutationFn: (cats: string[]) => settingsApi.setExpenseCategories(cats),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
        toast({ title: 'تم الحفظ', description: 'تم تحديث فئات المصروفات بنجاح' });
      },
      onError: (e: any) => {
        toast({ title: 'خطأ', description: e?.message || 'تعذر حفظ الفئات', variant: 'destructive' });
      }
    });

    const addCategory = () => {
      const name = (newCat || '').trim();
      if (!name) return;
      if (localCategories.includes(name)) return;
      setLocalCategories(prev => [...prev, name]);
      setNewCat('');
    };

    const removeCategory = (name: string) => {
      setLocalCategories(prev => prev.filter(c => c !== name));
    };

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input placeholder="إضافة فئة" value={newCat} onChange={(e)=> setNewCat(e.target.value)} onKeyDown={(e)=> { if (e.key==='Enter') addCategory(); }} />
          <Button onClick={addCategory} className="gap-2"><PlusIcon className="w-4 h-4"/>إضافة</Button>
        </div>
        <div className="space-y-2 max-h-64 overflow-auto">
          {localCategories.map(cat => (
            <div key={cat} className="flex items-center justify-between border rounded px-3 py-2">
              <span>{cat}</span>
              <Button size="sm" variant="destructive" onClick={()=> removeCategory(cat)}>حذف</Button>
            </div>
          ))}
          {localCategories.length === 0 && <div className="text-sm text-muted-foreground">لا توجد فئات بعد</div>}
        </div>
        <div className="flex justify-end gap-2">
          <Button onClick={()=> saveMutation.mutate(localCategories)} disabled={saveMutation.isPending}>حفظ</Button>
        </div>
      </div>
    );
  }

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['settlement-change-requests', selectedDate],
    queryFn: () => dailySettlementsApi.listRequestsForDate(selectedDate)
  });

  const mapPending = new Set((pendingRequests as any[]).map((r: any) => r.settlement_id));

  // Get daily summary
  const { data: dailySummary } = useQuery({
    queryKey: ['daily-summary', selectedDate],
    queryFn: () => dailySettlementsApi.getDailySummary(selectedDate)
  });

  const addSettlementMutation = useMutation({
    mutationFn: dailySettlementsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-settlements'] });
      queryClient.invalidateQueries({ queryKey: ['daily-summary'] });
      setIsOpen(false);
      resetForm();
      // Force remount of the quick form to clear any internal component state
      setFormInstanceKey((k) => k + 1);
      toast({
        title: "تم إضافة المعاملة",
        description: "تم حفظ المعاملة بنجاح"
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ", 
        description: error.message || "فشل في إضافة المعاملة",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      settlement_date: selectedDate,
      type: 'income',
      amount: 0,
      source_type: 'teacher',
      category: undefined,
      source_id: undefined,
      source_name: '',
      notes: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال مبلغ صالح",
        variant: "destructive"
      });
      return;
    }

    if (formData.type === 'income') {
      if (formData.source_type === 'teacher' && !formData.source_id) {
        toast({
          title: "خطأ",
          description: "اختر المعلم مصدر الإيراد",
          variant: "destructive"
        });
        return;
      }
      if (formData.source_type === 'teacher' && teacherHasMultipleSubjects && !formData.subject_id) {
        toast({
          title: "خطأ",
          description: "اختر المادة الدراسية",
          variant: "destructive"
        });
        return;
      }
      if (formData.source_type === 'other' && !formData.source_name?.trim()) {
        toast({
          title: "خطأ",
          description: "اكتب اسم مصدر الإيراد",
          variant: "destructive"
        });
        return;
      }
    } else {
      if (!formData.category) {
        toast({
          title: "خطأ",
          description: "اختر فئة المصروف",
          variant: "destructive"
        });
        return;
      }
      // Ensure source_name mirrors selected category for expenses
      if (!formData.source_name) {
        setFormData(prev => ({ ...prev, source_name: prev.category || '' }));
      }
    }
    
    addSettlementMutation.mutate(formData);
  };

  const handleTeacherSelect = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (teacher) {
      setFormData(prev => ({
        ...prev,
        source_id: teacherId,
        source_name: teacher.name,
        subject_id: teacher.subjects?.length === 1 ? teacher.subjects[0].id : undefined
      }));
    }
  };

  const selectedTeacher = formData.source_id ? teachers.find(t => t.id === formData.source_id) : null;
  const teacherHasMultipleSubjects = (selectedTeacher?.subjects?.length || 0) > 1;

  useEffect(() => {
    // Hall managers are locked to today's date; others can switch
    const effectiveDate = isHallManager ? todayStr : selectedDate;
    setSelectedDate(effectiveDate);
    setFormData(prev => ({ ...prev, settlement_date: effectiveDate }));
  }, [selectedDate, isHallManager]);

  const incomeSettlements = settlements.filter(s => s.type === 'income');
  const expenseSettlements = settlements.filter(s => s.type === 'expense');

  // Mutations to request edit/delete (pending approval)
  const requestEditMutation = useMutation({
    mutationFn: async (args: { id: string; updates: Partial<CreateSettlementData> }) =>
      dailySettlementsApi.requestEdit(args.id, args.updates),
    onSuccess: () => {
      toast({ title: 'تم إرسال طلب التعديل', description: 'بانتظار موافقة المدير' });
    },
    onError: (error: any) => {
      toast({ title: 'خطأ', description: error?.message || 'تعذر إرسال طلب التعديل', variant: 'destructive' });
    }
  });

  const requestDeleteMutation = useMutation({
    mutationFn: async (args: { id: string; reason?: string }) =>
      dailySettlementsApi.requestDelete(args.id, args.reason),
    onSuccess: () => {
      toast({ title: 'تم إرسال طلب الحذف', description: 'بانتظار موافقة المدير' });
    },
    onError: (error: any) => {
      toast({ title: 'خطأ', description: error?.message || 'تعذر إرسال طلب الحذف', variant: 'destructive' });
    }
  });

  const handleRequestDelete = (id: string) => {
    requestDeleteMutation.mutate({ id });
  };

  // Direct moderation for managers/admins/owners
  const directDeleteMutation = useMutation({
    mutationFn: (id: string) => dailySettlementsApi.delete(id),
    onSuccess: (deleted: boolean) => {
      queryClient.invalidateQueries({ queryKey: ['daily-settlements'] });
      queryClient.invalidateQueries({ queryKey: ['daily-summary'] });
      if (deleted) {
        toast({ title: 'تم الحذف', description: 'تم حذف المعاملة بنجاح' });
      } else {
        toast({ title: 'لم يتم الحذف', description: 'لا تملك صلاحية حذف هذا السجل أو لم يتم العثور عليه', variant: 'destructive' });
      }
    },
    onError: (error: any) => {
      toast({ title: 'خطأ', description: error?.message || 'تعذر حذف المعاملة', variant: 'destructive' });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">التقفيل اليومي</h1>
        <div className="flex gap-4 items-center">
          {isManagerOrHigher && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <SettingsIcon className="w-4 h-4" />
                  إدارة فئات المصروفات
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>إدارة فئات المصروفات</DialogTitle>
                </DialogHeader>
                <CategoryManagerModal />
              </DialogContent>
            </Dialog>
          )}
          {(!isHallManager || canModerateDirectly) && (
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          )}
          {(!isHallManager || canModerateDirectly) && (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة معاملة
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>إضافة معاملة جديدة</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Shared form fields (same as quick form below) */}
                <div>
                  <Label>نوع المعاملة *</Label>
                  <Tabs 
                    value={formData.type} 
                    onValueChange={(value: 'income' | 'expense') => 
                      setFormData(prev => ({ ...prev, type: value }))
                    }
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="income" className="text-green-600">إيرادات</TabsTrigger>
                      <TabsTrigger value="expense" className="text-red-600">مصروفات</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div>
                  <Label htmlFor="amount">المبلغ *</Label>
                  <Input
                    id="amount"
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value.replace(/,/g, '.')) || 0 }))}
                    placeholder="أدخل المبلغ"
                    required
                  />
                </div>

                {formData.type === 'income' ? (
                  <div>
                    <Label>مصدر الإيراد *</Label>
                    <div className="space-y-2">
                      <Tabs 
                        value={formData.source_type} 
                        onValueChange={(value) => 
                          setFormData(prev => ({ ...prev, source_type: value, source_name: '', source_id: undefined }))
                        }
                      >
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="teacher">معلم</TabsTrigger>
                          <TabsTrigger value="other">أخرى</TabsTrigger>
                        </TabsList>
                      </Tabs>
                      
                      {formData.source_type === 'teacher' ? (
                        <>
                          <Select value={formData.source_id} onValueChange={handleTeacherSelect}>
                            <SelectTrigger className="bg-background border border-border">
                              <SelectValue placeholder="اختر معلم" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border border-border shadow-lg z-50">
                              {teachers.map((teacher) => (
                                <SelectItem key={teacher.id} value={teacher.id} className="hover:bg-accent">
                                  {teacher.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {teacherHasMultipleSubjects && (
                            <div className="mt-2">
                              <Label>المادة الدراسية *</Label>
                              <Select 
                                value={formData.subject_id} 
                                onValueChange={(value) => setFormData(prev => ({ ...prev, subject_id: value }))}
                              >
                                <SelectTrigger className="bg-background border border-border">
                                  <SelectValue placeholder="اختر المادة" />
                                </SelectTrigger>
                                <SelectContent className="bg-background border border-border shadow-lg z-50">
                                  {selectedTeacher?.subjects?.map((subject) => (
                                    <SelectItem key={subject.id} value={subject.id} className="hover:bg-accent">
                                      {subject.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </>
                      ) : (
                        <Input
                          placeholder="اسم مصدر الإيراد"
                          value={formData.source_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, source_name: e.target.value }))}
                          required
                        />
                      )}
                    </div>
                  </div>
                ) : (
                <div>
                    <Label htmlFor="category">فئة المصروف *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value, source_name: value }))}>
                      <SelectTrigger className="bg-background border border-border">
                        <SelectValue placeholder="اختر فئة المصروف" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border shadow-lg z-50">
                        {expenseCategories.map((category: string) => (
                          <SelectItem key={category} value={category} className="hover:bg-accent">
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="ملاحظات إضافية (اختياري)"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={addSettlementMutation.isPending} className="flex-1">
                    {addSettlementMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
                    إلغاء
                  </Button>
                </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Quick Add form for hall managers: always visible, one unified form for today's operations */}
      {isHallManager && (
        <Card>
          <CardHeader>
            <CardTitle>إضافة معاملة اليوم</CardTitle>
          </CardHeader>
      <CardContent>
            <form key={formInstanceKey} onSubmit={handleSubmit} className="space-y-4">
              <div className="text-sm text-muted-foreground">تاريخ اليوم: {new Date(todayStr).toLocaleDateString('ar-EG')}</div>
              <div>
                <Label>نوع المعاملة *</Label>
                <Tabs 
                  value={formData.type} 
                  onValueChange={(value: 'income' | 'expense') => 
                    setFormData(prev => ({ ...prev, type: value }))
                  }
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="income" className="text-green-600">إيرادات</TabsTrigger>
                    <TabsTrigger value="expense" className="text-red-600">مصروفات</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div>
                <Label htmlFor="amount2">المبلغ *</Label>
                <Input
                  id="amount2"
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*[.,]?[0-9]*"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value.replace(/,/g, '.')) || 0 }))}
                  placeholder="أدخل المبلغ"
                  required
                />
              </div>

              {formData.type === 'income' ? (
                <div>
                  <Label>مصدر الإيراد *</Label>
                  <div className="space-y-2">
                    <Tabs 
                      value={formData.source_type} 
                      onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, source_type: value, source_name: '', source_id: undefined }))
                      }
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="teacher">معلم</TabsTrigger>
                        <TabsTrigger value="other">أخرى</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    {formData.source_type === 'teacher' ? (
                      <>
                        <Select value={formData.source_id} onValueChange={handleTeacherSelect}>
                          <SelectTrigger className="bg-background border border-border">
                            <SelectValue placeholder="اختر معلم" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border border-border shadow-lg z-50">
                            {teachers.map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id} className="hover:bg-accent">
                                {teacher.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {teacherHasMultipleSubjects && (
                          <div className="mt-2">
                            <Label>المادة الدراسية *</Label>
                            <Select 
                              value={formData.subject_id} 
                              onValueChange={(value) => setFormData(prev => ({ ...prev, subject_id: value }))}
                            >
                              <SelectTrigger className="bg-background border border-border">
                                <SelectValue placeholder="اختر المادة" />
                              </SelectTrigger>
                              <SelectContent className="bg-background border border-border shadow-lg z-50">
                                {selectedTeacher?.subjects?.map((subject) => (
                                  <SelectItem key={subject.id} value={subject.id} className="hover:bg-accent">
                                    {subject.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </>
                    ) : (
                      <Input
                        placeholder="اسم مصدر الإيراد"
                        value={formData.source_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, source_name: e.target.value }))}
                        required
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div>
                <Label htmlFor="category2">فئة المصروف *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value, source_name: value }))}>
                    <SelectTrigger className="bg-background border border-border">
                      <SelectValue placeholder="اختر فئة المصروف" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border shadow-lg z-50">
                      {expenseCategories.map((category: string) => (
                        <SelectItem key={category} value={category} className="hover:bg-accent">
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="notes2">ملاحظات</Label>
                <Textarea
                  id="notes2"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="ملاحظات إضافية (اختياري)"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={addSettlementMutation.isPending} className="flex-1">
                  {addSettlementMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(dailySummary?.totalIncome || 0, 'EGP')}
            </div>
            <p className="text-xs text-muted-foreground">
              {dailySummary?.incomeCount || 0} معاملة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(dailySummary?.totalExpenses || 0, 'EGP')}
            </div>
            <p className="text-xs text-muted-foreground">
              {dailySummary?.expenseCount || 0} معاملة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صافي الإيرادات</CardTitle>
            <Calculator className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(dailySummary?.netAmount || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(dailySummary?.netAmount || 0, 'EGP')}
            </div>
            <p className="text-xs text-muted-foreground">
              للتسليم للخزنة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المعاملات</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {settlements.length}
            </div>
            <p className="text-xs text-muted-foreground">
              معاملة اليوم
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Tables */}
      <Tabs defaultValue="income" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="income" className="text-green-600">
            الإيرادات ({incomeSettlements.length})
          </TabsTrigger>
          <TabsTrigger value="expense" className="text-red-600">
            المصروفات ({expenseSettlements.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="income">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">إيرادات اليوم</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">جاري التحميل...</div>
              ) : incomeSettlements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد إيرادات لهذا اليوم
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المصدر</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الموظف</TableHead>
                      <TableHead>الوقت</TableHead>
                      <TableHead>ملاحظات</TableHead>
                      <TableHead className="w-[120px]">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomeSettlements.map((settlement) => (
                      <TableRow key={settlement.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={settlement.source_type === 'teacher' ? 'default' : 'secondary'}>
                              {settlement.source_type === 'teacher' ? 'معلم' : 'أخرى'}
                            </Badge>
                            {settlement.source_name}
                            {mapPending.has(settlement.id) && (
                              <Badge variant="warning">بانتظار الموافقة</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          {formatCurrency(settlement.amount, 'EGP')}
                        </TableCell>
                        <TableCell>
                          {new Date(settlement.settlement_date).toLocaleDateString('ar-EG')}
                        </TableCell>
                        <TableCell>
                          {creatorNameById.get(settlement.created_by) || '—'}
                        </TableCell>
                        <TableCell>
                          {new Date(settlement.created_at).toLocaleTimeString('ar-EG', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {settlement.notes || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" onClick={() => requestEditMutation.mutate({ id: settlement.id, updates: { notes: settlement.notes } })} title={canModerateDirectly ? "تعديل" : "طلب تعديل"}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => (canModerateDirectly ? setPendingDelete({ id: settlement.id, title: `${settlement.source_name} - ${formatCurrency(settlement.amount,'EGP')}` }) : handleRequestDelete(settlement.id))} title={canModerateDirectly ? "حذف" : "طلب حذف"}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expense">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">مصروفات اليوم</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">جاري التحميل...</div>
              ) : expenseSettlements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد مصروفات لهذا اليوم
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الفئة</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الموظف</TableHead>
                      <TableHead>الوقت</TableHead>
                      <TableHead>ملاحظات</TableHead>
                      <TableHead className="w-[120px]">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenseSettlements.map((settlement) => (
                      <TableRow key={settlement.id}>
                        <TableCell>
                          <Badge variant="outline" className="text-red-600">
                            {settlement.source_name}
                          </Badge>
                          {mapPending.has(settlement.id) && (
                            <Badge variant="warning" className="ml-2">بانتظار الموافقة</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-red-600">
                          {formatCurrency(settlement.amount, 'EGP')}
                        </TableCell>
                        <TableCell>
                          {new Date(settlement.settlement_date).toLocaleDateString('ar-EG')}
                        </TableCell>
                        <TableCell>
                          {creatorNameById.get(settlement.created_by) || '—'}
                        </TableCell>
                        <TableCell>
                          {new Date(settlement.created_at).toLocaleTimeString('ar-EG', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {settlement.notes || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" onClick={() => requestEditMutation.mutate({ id: settlement.id, updates: { notes: settlement.notes } })} title={canModerateDirectly ? "تعديل" : "طلب تعديل"}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => (canModerateDirectly ? setPendingDelete({ id: settlement.id, title: `${settlement.source_name} - ${formatCurrency(settlement.amount,'EGP')}` }) : handleRequestDelete(settlement.id))} title={canModerateDirectly ? "حذف" : "طلب حذف"}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modern confirmation dialog for privileged delete */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(open)=> { if(!open) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف المعاملة نهائياً: {pendingDelete?.title}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (pendingDelete) directDeleteMutation.mutate(pendingDelete.id); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              حذف نهائي
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}