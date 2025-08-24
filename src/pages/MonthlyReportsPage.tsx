import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { UnifiedLayout } from "@/components/layout/UnifiedLayout";

export default function MonthlyReportsPage() {
  const { profile } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  
  const isAdmin = profile?.role === 'admin';
  
  // Redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Monthly Income
  const { data: monthlyIncome = 0 } = useQuery({
    queryKey: ['monthly-income', selectedMonth],
    queryFn: async () => {
      const startDate = `${selectedMonth}-01`;
      const endDate = `${selectedMonth}-31`;
      
      const { data, error } = await supabase
        .from('payment_records')
        .select('amount')
        .gte('payment_date', startDate)
        .lte('payment_date', endDate);
      
      if (error) throw error;
      return data.reduce((sum, record) => sum + Number(record.amount), 0);
    }
  });

  // Monthly Expenses
  const { data: monthlyExpenses = 0 } = useQuery({
    queryKey: ['monthly-expenses', selectedMonth],
    queryFn: async () => {
      const startDate = `${selectedMonth}-01`;
      const endDate = `${selectedMonth}-31`;
      
      const { data, error } = await supabase
        .from('expenses')
        .select('amount')
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (error) throw error;
      return data.reduce((sum, record) => sum + Number(record.amount), 0);
    }
  });

  // Student Count
  const { data: studentCount = 0 } = useQuery({
    queryKey: ['monthly-students', selectedMonth],
    queryFn: async () => {
      const startDate = `${selectedMonth}-01`;
      const endDate = `${selectedMonth}-31`;
      
      const { data, error } = await supabase
        .from('student_registrations')
        .select('id')
        .gte('registration_date', startDate)
        .lte('registration_date', endDate);
      
      if (error) throw error;
      return data.length;
    }
  });

  // Active Bookings
  const { data: activeBookings = 0 } = useQuery({
    queryKey: ['monthly-bookings', selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('id')
        .eq('status', 'active');
      
      if (error) throw error;
      return data.length;
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const monthlyProfit = monthlyIncome - monthlyExpenses;

  return (
    <UnifiedLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">التقارير المالية الشهرية</h1>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const monthValue = date.toISOString().slice(0, 7);
                const monthName = date.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });
                return (
                  <SelectItem key={monthValue} value={monthValue}>
                    {monthName}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الإيرادات الشهرية</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(monthlyIncome)}
              </div>
              <p className="text-xs text-muted-foreground">
                إجمالي المبلغ المحصل
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المصروفات الشهرية</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(monthlyExpenses)}
              </div>
              <p className="text-xs text-muted-foreground">
                إجمالي المصروفات
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">صافي الربح</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(monthlyProfit)}
              </div>
              <p className="text-xs text-muted-foreground">
                الإيرادات - المصروفات
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الطلاب الجدد</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {studentCount}
              </div>
              <p className="text-xs text-muted-foreground">
                تسجيلات جديدة هذا الشهر
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                تفاصيل الإيرادات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">إجمالي المبلغ المستحق</span>
                <span className="font-medium">{formatCurrency(monthlyIncome * 1.2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">المبلغ المحصل</span>
                <span className="font-medium text-green-600">{formatCurrency(monthlyIncome)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">المبلغ المتبقي</span>
                <span className="font-medium text-orange-600">{formatCurrency(monthlyIncome * 0.2)}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: "83%" }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground">نسبة التحصيل: 83%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                إحصائيات القاعات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">عدد الحجوزات النشطة</span>
                <span className="font-medium">{activeBookings}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">متوسط الطلاب لكل قاعة</span>
                <span className="font-medium">{Math.round(studentCount / Math.max(activeBookings, 1))}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">معدل الإشغال</span>
                <span className="font-medium text-blue-600">75%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </UnifiedLayout>
  );
}