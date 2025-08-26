import { useState } from "react";
import { Plus, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { expensesApi, CreateExpenseData } from "@/api/expenses";

export function QuickExpenseButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<CreateExpenseData>({
    description: '',
    amount: 0,
    category: '',
    payment_method: 'cash',
    notes: ''
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createExpenseMutation = useMutation({
    mutationFn: expensesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['daily-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['daily-finance'] });
      setIsOpen(false);
      resetForm();
      toast({ 
        title: "تم إضافة المصروف",
        description: "تم حفظ المصروف بنجاح"
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إضافة المصروف",
        variant: "destructive"
      });
    },
  });

  const resetForm = () => {
    setFormData({
      description: '',
      amount: 0,
      category: '',
      payment_method: 'cash',
      notes: ''
    });
  };

  const handleSubmit = () => {
    if (!formData.description || !formData.category || formData.amount <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    createExpenseMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-bold">اضافة مصروفات</CardTitle>
            <DollarSign className="h-8 w-8 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <Button size="lg" className="w-full bg-orange-600 hover:bg-orange-700">
                <Plus className="h-5 w-5 ml-2" />
                إضافة مصروف سريع
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>إضافة مصروف جديد</DialogTitle>
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
          
          <div>
            <Label>المبلغ (LE) *</Label>
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
              rows={2}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsOpen(false);
                resetForm();
              }}
            >
              إلغاء
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createExpenseMutation.isPending}
            >
              {createExpenseMutation.isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}