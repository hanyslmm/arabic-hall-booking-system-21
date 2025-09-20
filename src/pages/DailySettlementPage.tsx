import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { dailySettlementsApi, CreateSettlementData } from "@/api/dailySettlements";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/currency";
import { useAuth } from "@/hooks/useAuth";

interface Teacher {
  id: string;
  name: string;
}

const expenseCategories = [
  "المياه والكهرباء",
  "الصيانة", 
  "الرواتب",
  "التنظيف",
  "القرطاسية",
  "الأمن",
  "أخرى"
];

export default function DailySettlementPage() {
  const { profile } = useAuth();
  const isHallManager = profile?.user_role === 'space_manager';
  const todayStr = new Date().toISOString().split('T')[0];
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayStr);
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

  // Fetch teachers for income sources
  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data as Teacher[];
    }
  });

  // Fetch settlements for selected date
  const { data: settlements = [], isLoading } = useQuery({
    queryKey: ['daily-settlements', selectedDate],
    queryFn: () => dailySettlementsApi.getByDate(selectedDate)
  });

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
      source_name: '',
      notes: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.source_name) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }
    addSettlementMutation.mutate(formData);
  };

  const handleTeacherSelect = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (teacher) {
      setFormData(prev => ({
        ...prev,
        source_id: teacherId,
        source_name: teacher.name
      }));
    }
  };

  useEffect(() => {
    // Hall managers are locked to today's date; others can switch
    const effectiveDate = isHallManager ? todayStr : selectedDate;
    setSelectedDate(effectiveDate);
    setFormData(prev => ({ ...prev, settlement_date: effectiveDate }));
  }, [selectedDate, isHallManager]);

  const incomeSettlements = settlements.filter(s => s.type === 'income');
  const expenseSettlements = settlements.filter(s => s.type === 'expense');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">التقفيل اليومي</h1>
        <div className="flex gap-4 items-center">
          {!isHallManager && (
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          )}
          {!isHallManager && (
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
                    type="number"
                    step="0.01"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
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
                        <Select onValueChange={handleTeacherSelect}>
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
                    <Select onValueChange={(value) => setFormData(prev => ({ ...prev, category: value, source_name: value }))}>
                      <SelectTrigger className="bg-background border border-border">
                        <SelectValue placeholder="اختر فئة المصروف" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border shadow-lg z-50">
                        {expenseCategories.map((category) => (
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

      {/* Quick Add form for hall managers: always visible, one unified form for today's operations */
      {isHallManager && (
        <Card>
          <CardHeader>
            <CardTitle>إضافة معاملة اليوم</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  type="number"
                  step="0.01"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
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
                      <Select onValueChange={handleTeacherSelect}>
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
                  <Select onValueChange={(value) => setFormData(prev => ({ ...prev, category: value, source_name: value }))}>
                    <SelectTrigger className="bg-background border border-border">
                      <SelectValue placeholder="اختر فئة المصروف" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border shadow-lg z-50">
                      {expenseCategories.map((category) => (
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
              {formatCurrency(dailySummary?.totalIncome || 0, 'SAR')}
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
              {formatCurrency(dailySummary?.totalExpenses || 0, 'SAR')}
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
              {formatCurrency(dailySummary?.netAmount || 0, 'SAR')}
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
                      <TableHead>الوقت</TableHead>
                      <TableHead>ملاحظات</TableHead>
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
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          {formatCurrency(settlement.amount, 'SAR')}
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
                      <TableHead>الوقت</TableHead>
                      <TableHead>ملاحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenseSettlements.map((settlement) => (
                      <TableRow key={settlement.id}>
                        <TableCell>
                          <Badge variant="outline" className="text-red-600">
                            {settlement.source_name}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-red-600">
                          {formatCurrency(settlement.amount, 'SAR')}
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}