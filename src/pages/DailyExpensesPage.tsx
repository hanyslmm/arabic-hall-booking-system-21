import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface DailyExpense {
  id: string;
  date: string;
  amount: number;
  sub_category: string;
  description: string;
  created_at: string;
  user_id: string;
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

export default function DailyExpensesPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().split('T')[0]
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['daily-expenses'],
    queryFn: async () => {
      // Transactions table doesn't exist in simplified schema
      return [];
    }
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (expense: { amount: string; sub_category: string; description: string; date: string }) => {
      // Transactions table doesn't exist in simplified schema
      throw new Error('Feature not available in simplified schema');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-expenses'] });
      setIsOpen(false);
      setFormData({
        amount: "",
        category: "",
        description: "",
        date: new Date().toISOString().split('T')[0]
      });
      toast({
        title: "ميزة غير متوفرة",
        description: "ميزة المصروفات تتطلب جداول إضافية في النسخة الكاملة",
        variant: "destructive"
      });
    },
    onError: () => {
      toast({
        title: "ميزة غير متوفرة", 
        description: "ميزة المصروفات تتطلب جداول إضافية في النسخة الكاملة",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.category) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }
    addExpenseMutation.mutate({
      amount: formData.amount,
      sub_category: formData.category,
      description: formData.description,
      date: formData.date
    });
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">المصروفات اليومية</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              إضافة مصروف جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة مصروف يومي</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="amount">المبلغ *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="أدخل المبلغ"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">الفئة *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر فئة المصروف" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date">التاريخ</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="وصف المصروف (اختياري)"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={addExpenseMutation.isPending} className="flex-1">
                  {addExpenseMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
                  إلغاء
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>إجمالي المصروفات</span>
            <Badge variant="destructive" className="text-lg px-3 py-1">
              {totalExpenses.toLocaleString('ar-EG')} ر.س
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>المصروفات الأخيرة</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <h3 className="text-lg font-medium mb-2">ميزة المصروفات اليومية غير متوفرة</h3>
              <p>هذه الميزة تتطلب جداول إضافية لإدارة المعاملات المالية في النسخة الكاملة من النظام</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>الوصف</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      {new Date(expense.date).toLocaleDateString('ar-EG')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{expense.sub_category}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-destructive">
                      {expense.amount.toLocaleString('ar-EG')} ر.س
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {expense.description || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}