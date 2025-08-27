import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { exportExpensesToExcel } from "@/utils/exportUtils";
import { cn } from "@/lib/utils";
import { Download, Plus, Search, X, Calendar, Users, TrendingUp, BarChart3, Edit, Trash2 } from "lucide-react";
import { expensesApi, type Expense, type CreateExpenseData } from '@/api/expenses';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { MonthSelector } from '@/components/dashboard/MonthSelector';
import { toast } from "sonner";

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [formData, setFormData] = useState<CreateExpenseData>({
    description: '',
    amount: 0,
    category: '',
    payment_method: 'cash',
    notes: '',
    date: getTodayLocalDate()
  });
  const [amountText, setAmountText] = useState<string>("");
  const [customCategory, setCustomCategory] = useState<string>("");

  // Fetch expenses for selected month
  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', selectedMonth, selectedYear],
    queryFn: () => expensesApi.getByMonth(selectedMonth, selectedYear),
  });

  // Fetch monthly total
  const { data: monthlyTotal } = useQuery({
    queryKey: ['expenses-total', selectedMonth, selectedYear],
    queryFn: () => expensesApi.getMonthlyTotal(selectedMonth, selectedYear),
  });

  // Create expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: expensesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setIsAddExpenseOpen(false);
      resetForm();
      toast.success('تم إضافة المصروف بنجاح');
    },
    onError: () => {
      toast.error('خطأ في إضافة المصروف');
    },
  });

  // Update expense mutation
  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateExpenseData> }) =>
      expensesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setEditingExpense(null);
      resetForm();
      toast.success('تم تحديث المصروف بنجاح');
    },
    onError: () => {
      toast.error('خطأ في تحديث المصروف');
    },
  });

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: expensesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('تم حذف المصروف بنجاح');
    },
    onError: () => {
      toast.error('خطأ في حذف المصروف');
    },
  });

  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  // Filter and search expenses
  useEffect(() => {
    if (!expenses) {
      setFilteredExpenses([]);
      return;
    }

    let filtered = expenses;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(expense => 
        expense.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(expense => expense.category === selectedCategory);
    }

    setFilteredExpenses(filtered);
  }, [expenses, searchTerm, selectedCategory]);

  const resetForm = () => {
    setFormData({
      description: '',
      amount: 0,
      category: '',
      payment_method: 'cash',
      notes: '',
      date: getTodayLocalDate()
    });
    setAmountText("");
    setCustomCategory("");
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
  };

  const handleAddExpense = () => {
    setIsAddExpenseOpen(true);
    setEditingExpense(null);
    resetForm();
  };

  const handleExportExpenses = () => {
    const result = exportExpensesToExcel(filteredExpenses || []);
    if (result.success) {
      toast.success(`تم تصدير البيانات إلى ${result.filename}`);
    } else {
      toast.error(result.error || 'فشل في تصدير البيانات');
    }
  };

  const handleSubmitExpense = () => {
    const selectedCategory = formData.category === 'اخرى' ? customCategory.trim() : formData.category;
    if (!selectedCategory || formData.amount <= 0) {
      toast.error('يرجى إدخال المبلغ واختيار الفئة');
      return;
    }

    const payload: CreateExpenseData = {
      ...formData,
      category: selectedCategory,
      // اجعل الوصف غير مطلوب - سنستخدم الفئة كقيمة افتراضية للعرض
      description: formData.description && formData.description.trim() !== ''
        ? formData.description
        : selectedCategory,
      date: formData.date || getTodayLocalDate()
    };

    if (editingExpense) {
      updateExpenseMutation.mutate({ id: editingExpense.id, data: payload });
    } else {
      createExpenseMutation.mutate(payload);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      payment_method: expense.payment_method,
      notes: expense.notes || '',
      date: expense.date || getTodayLocalDate()
    });
    setAmountText(String(expense.amount ?? ''));
    const predefined = expensesApi.getCategories();
    if (!predefined.includes(expense.category)) {
      setFormData(prev => ({ ...prev, category: 'اخرى' }));
      setCustomCategory(expense.category);
    } else {
      setCustomCategory('');
    }
    setIsAddExpenseOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return `${Number(amount || 0).toLocaleString('en-US')} LE`;
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods = expensesApi.getPaymentMethods();
    return methods.find(m => m.value === method)?.label || method;
  };

  return (
    <UnifiedLayout>
      <div className="py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">إدارة المصروفات</h1>
          <div className="flex gap-2">
            <Button onClick={handleAddExpense}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة مصروف
            </Button>
            <Button onClick={handleExportExpenses} variant="outline">
              <Download className="h-4 w-4 ml-2" />
              تصدير إلى Excel
            </Button>
          </div>
        </div>

        {/* Month Selector */}
        <MonthSelector 
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={handleMonthChange}
        />

        {/* Monthly Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              ملخص المصروفات الشهرية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">إجمالي المصروفات</p>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(monthlyTotal || 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">عدد المصروفات</p>
                <p className="text-2xl font-bold">{filteredExpenses?.length || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">متوسط المصروف</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(filteredExpenses?.length ? (monthlyTotal || 0) / filteredExpenses.length : 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              البحث والتصفية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label>البحث في الوصف</Label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="ابحث في وصف المصروفات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>
              <div className="flex-1">
                <Label>التصفية بالفئة</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر فئة للتصفية" />
                  </SelectTrigger>
                  <SelectContent>
                    {expensesApi.getCategories().map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(searchTerm || selectedCategory) && (
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    مسح التصفية
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Expenses List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              قائمة المصروفات
              {(searchTerm || selectedCategory) && (
                <Badge variant="secondary" className="mr-2">
                  {filteredExpenses?.length || 0} من {expenses?.length || 0} مصروف
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <LoadingSpinner />
              </div>
            ) : filteredExpenses && filteredExpenses.length > 0 ? (
              <div className="space-y-4">
                {filteredExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{expense.description}</h3>
                        <Badge variant="secondary">{expense.category}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(expense.date), 'dd/MM/yyyy')}
                          </span>
                          <span>{getPaymentMethodLabel(expense.payment_method)}</span>
                        </div>
                        {expense.notes && <p>ملاحظات: {expense.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-bold text-destructive">
                          {formatCurrency(expense.amount)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditExpense(expense)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteExpenseMutation.mutate(expense.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {(searchTerm || selectedCategory) ? 'لا توجد نتائج' : 'لا توجد مصروفات'}
                </h3>
                <p className="text-muted-foreground">
                  {(searchTerm || selectedCategory) 
                    ? 'لم يتم العثور على مصروفات مطابقة للبحث أو التصفية' 
                    : 'لم يتم تسجيل أي مصروفات لهذا الشهر'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Expense Dialog */}
        <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? 'تعديل المصروف' : 'إضافة مصروف جديد'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* تم إلغاء حقل الوصف حسب المتطلبات */}
              <div>
                <Label>الفئة *</Label>
                <Select value={formData.category} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, category: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر فئة المصروف" />
                  </SelectTrigger>
                  <SelectContent>
                    {expensesApi.getCategories().map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.category === 'اخرى' && (
                  <div className="mt-2">
                    <Input
                      placeholder="اكتب الفئة"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <div>
                <Label>المبلغ (LE) *</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*[.,]?[0-9]*"
                  value={amountText}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9.,]/g, '');
                    setAmountText(raw);
                    const normalized = raw.replace(',', '.');
                    const parsed = parseFloat(normalized);
                    setFormData(prev => ({
                      ...prev,
                      amount: isNaN(parsed) ? 0 : parsed
                    }));
                  }}
                  placeholder="أدخل المبلغ"
                />
              </div>
              <div>
                <Label>التاريخ</Label>
                <Input
                  type="date"
                  value={formData.date || getTodayLocalDate()}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div>
                <Label>طريقة الدفع</Label>
                <Select value={formData.payment_method} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, payment_method: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {expensesApi.getPaymentMethods().map(method => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>ملاحظات</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="ملاحظات إضافية..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddExpenseOpen(false);
                    setEditingExpense(null);
                    resetForm();
                  }}
                >
                  إلغاء
                </Button>
                <Button 
                  onClick={handleSubmitExpense}
                  disabled={createExpenseMutation.isPending || updateExpenseMutation.isPending}
                >
                  {editingExpense ? 'تحديث' : 'حفظ'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedLayout>
  );
}

function getTodayLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}