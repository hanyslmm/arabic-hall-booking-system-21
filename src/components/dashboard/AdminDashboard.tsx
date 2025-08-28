import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign } from "lucide-react";
import { FastReceptionistModal } from "@/components/receptionist/FastReceptionistModal";
import StatsCards from "@/components/dashboard/StatsCards";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { DateRangeFilter } from "@/components/dashboard/DateRangeFilter";
import { HallsGrid } from "@/components/dashboard/HallsGrid";
import { useAuth } from "@/hooks/useAuth";

import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/api/dashboard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { expensesApi, CreateExpenseData } from "@/api/expenses";

export function AdminDashboard() {
  const { profile } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [dateRange, setDateRange] = useState<{ startDate?: Date; endDate?: Date }>({});
  const [isFastReceptionistOpen, setIsFastReceptionistOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [amountText, setAmountText] = useState<string>("");
  const [expenseForm, setExpenseForm] = useState<CreateExpenseData>({
    description: "مصروفات شهرية",
    amount: 0,
    category: "",
    payment_method: "cash",
    notes: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Local permission helper to align with `can('create:registrations')`
  const can = (permission: string) => {
    if (permission === 'create:registrations') {
      // Allow all non-teacher roles (consistent with registrations page)
      return profile?.role !== 'user';
    }
    return false;
  };

  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    // Clear date range when month changes
    setDateRange({});
  };

  const handleDateRangeChange = (startDate: Date | undefined, endDate: Date | undefined) => {
    setDateRange({ startDate, endDate });
  };

  // Fetch per-hall occupancy for the grid using the new API layer
  const { data: occupancyData } = useQuery({
    queryKey: ['hall-occupancy-dashboard'],
    queryFn: () => dashboardApi.getHallOccupancy(),
    staleTime: 30_000,
  });

  const resetExpenseForm = () => {
    setExpenseForm({
    description: "مصروفات شهرية",
      amount: 0,
      category: "",
      payment_method: "cash",
      notes: "",
    });
    setAmountText("");
  };

  const createExpenseMutation = useMutation({
    mutationFn: expensesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['daily-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['daily-finance'] });
      setIsExpenseOpen(false);
      resetExpenseForm();
      toast({ title: "تم إضافة المصروف", description: "تم حفظ المصروف بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في إضافة المصروف", variant: "destructive" });
    },
  });

  const handleSaveExpense = () => {
    if (!expenseForm.description || !expenseForm.category || expenseForm.amount <= 0) {
      toast({ title: "خطأ", description: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    createExpenseMutation.mutate(expenseForm);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">لوحة التحكم</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {can('create:registrations') && (
            <Button 
              onClick={() => setIsFastReceptionistOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="ml-2 h-4 w-4" />
              تسجيل سريع
            </Button>
          )}
          <Button
            onClick={() => setIsExpenseOpen(true)}
            className="w-full sm:w-auto"
            variant="secondary"
          >
            <DollarSign className="ml-2 h-4 w-4" />
            تسجيل المصروفات
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <MonthSelector 
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={handleMonthChange}
        />
        <DateRangeFilter
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onDateRangeChange={handleDateRangeChange}
        />
      </div>

      <StatsCards 
        selectedMonth={selectedMonth} 
        selectedYear={selectedYear}
        dateRange={dateRange}
      />

      <HallsGrid occupancyData={occupancyData || []} />

      <FastReceptionistModal 
        isOpen={isFastReceptionistOpen} 
        onClose={() => setIsFastReceptionistOpen(false)} 
      />

      <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة مصروف جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>الوصف *</Label>
              <Input
                value={expenseForm.description}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="وصف المصروف"
              />
            </div>
            <div>
              <Label>الفئة *</Label>
              <Select value={expenseForm.category} onValueChange={(value) => setExpenseForm((prev) => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر فئة المصروف" />
                </SelectTrigger>
                <SelectContent>
                  {expensesApi.getCategories().map((category) => (
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
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                value={amountText}
                onChange={(e) => {
                  // Helper to convert Arabic-Indic digits to English digits
                  const toEnglishDigits = (str: string) =>
                    str.replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));
                  const raw = e.target.value.replace(/[^\d\u0660-\u0669.,]/g, '');
                  const englishRaw = toEnglishDigits(raw);
                  setAmountText(englishRaw);
                  const normalized = englishRaw.replace(',', '.');
                  const parsed = parseFloat(normalized);
                  setExpenseForm((prev) => ({ ...prev, amount: isNaN(parsed) ? 0 : parsed }));
                }}
                placeholder="أدخل المبلغ"
              />
            </div>
            <div>
              <Label>طريقة الدفع</Label>
              <Select
                value={expenseForm.payment_method}
                onValueChange={(value) => setExpenseForm((prev) => ({ ...prev, payment_method: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {expensesApi.getPaymentMethods().map((method) => (
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
                value={expenseForm.notes}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="ملاحظات إضافية..."
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsExpenseOpen(false);
                  resetExpenseForm();
                }}
              >
                إلغاء
              </Button>
              <Button onClick={handleSaveExpense} disabled={createExpenseMutation.isPending}>
                {createExpenseMutation.isPending ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
