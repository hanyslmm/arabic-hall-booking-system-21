import { useState } from 'react';
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
import { Plus, Edit, Trash2, DollarSign, Calendar, TrendingDown } from 'lucide-react';
import { expensesApi, type Expense, type CreateExpenseData } from '@/api/expenses';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { MonthSelector } from '@/components/dashboard/MonthSelector';

export default function ExpensesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<CreateExpenseData>({
    description: '',
    amount: 0,
    category: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    notes: ''
  });

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
      toast({ title: 'تم إضافة المصروف بنجاح' });
    },
    onError: () => {
      toast({ title: 'خطأ في إضافة المصروف', variant: 'destructive' });
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
      toast({ title: 'تم تحديث المصروف بنجاح' });
    },
    onError: () => {
      toast({ title: 'خطأ في تحديث المصروف', variant: 'destructive' });
    },
  });

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: expensesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'تم حذف المصروف بنجاح' });
    },
    onError: () => {
      toast({ title: 'خطأ في حذف المصروف', variant: 'destructive' });
    },
  });

  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: 0,
      category: '',
      date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      notes: ''
    });
  };

  const handleAddExpense = () => {
    if (!formData.description || !formData.category || formData.amount <= 0) {
      toast({ title: 'يرجى ملء جميع الحقول المطلوبة', variant: 'destructive' });
      return;
    }
    createExpenseMutation.mutate(formData);
  };

  const handleUpdateExpense = () => {
    if (!editingExpense || !formData.description || !formData.category || formData.amount <= 0) {
      toast({ title: 'يرجى ملء جميع الحقول المطلوبة', variant: 'destructive' });
      return;
    }
    updateExpenseMutation.mutate({ id: editingExpense.id, data: formData });
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      payment_method: expense.payment_method,
      notes: expense.notes || ''
    });
  };

  const formatCurrency = (amount: number) => {
    return `${Number(amount || 0).toLocaleString('en-EG')} جنيه`;
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
          <Dialog open={isAddExpenseOpen || !!editingExpense} onOpenChange={(open) => {
            if (!open) {
              setIsAddExpenseOpen(false);
              setEditingExpense(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsAddExpenseOpen(true)}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة مصروف
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingExpense ? 'تعديل المصروف' : 'إضافة مصروف جديد'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>الوصف *</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="وصف المصروف"
                  />
                </div>
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
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>المبلغ (جنيه) *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        amount: Number(e.target.value) || 0 
                      }))}
                    />
                  </div>
                  <div>
                    <Label>التاريخ</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
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
                    onClick={editingExpense ? handleUpdateExpense : handleAddExpense}
                    disabled={createExpenseMutation.isPending || updateExpenseMutation.isPending}
                  >
                    {editingExpense ? 'تحديث' : 'إضافة'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
              <TrendingDown className="h-5 w-5" />
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
                <p className="text-2xl font-bold">{expenses?.length || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">متوسط المصروف</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(expenses?.length ? (monthlyTotal || 0) / expenses.length : 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              قائمة المصروفات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <LoadingSpinner />
              </div>
            ) : expenses && expenses.length > 0 ? (
              <div className="space-y-4">
                {expenses.map((expense) => (
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
                <TrendingDown className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا توجد مصروفات</h3>
                <p className="text-muted-foreground">لم يتم تسجيل أي مصروفات لهذا الشهر</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </UnifiedLayout>
  );
}