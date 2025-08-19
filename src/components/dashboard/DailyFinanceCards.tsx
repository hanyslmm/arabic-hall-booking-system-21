import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface DailyFinanceCardsProps {
  selectedDate?: string;
}

export function DailyFinanceCards({ selectedDate = new Date().toISOString().split('T')[0] }: DailyFinanceCardsProps) {
  const { profile } = useAuth();
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  
  const isAdmin = profile?.role === 'ADMIN' || ['owner', 'manager'].includes(profile?.user_role || '');
  const canViewFinance = isAdmin || profile?.user_role === 'space_manager';

  // For daily view
  const { data: dailyIncome = 0 } = useQuery({
    queryKey: ['daily-income', selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_records')
        .select('amount')
        .eq('payment_date', selectedDate);
      
      if (error) throw error;
      return data.reduce((sum, record) => sum + Number(record.amount), 0);
    },
    enabled: canViewFinance
  });

  const { data: dailyExpenses = 0 } = useQuery({
    queryKey: ['daily-expenses', selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'expense')
        .eq('date', selectedDate);
      
      if (error) throw error;
      return data.reduce((sum, record) => sum + Number(record.amount), 0);
    },
    enabled: canViewFinance
  });

  // For monthly view (admin only)
  const { data: monthlyIncome = 0 } = useQuery({
    queryKey: ['monthly-income', filterMonth],
    queryFn: async () => {
      const startDate = `${filterMonth}-01`;
      const endDate = `${filterMonth}-31`;
      
      const { data, error } = await supabase
        .from('payment_records')
        .select('amount')
        .gte('payment_date', startDate)
        .lte('payment_date', endDate);
      
      if (error) throw error;
      return data.reduce((sum, record) => sum + Number(record.amount), 0);
    },
    enabled: isAdmin
  });

  const { data: monthlyExpenses = 0 } = useQuery({
    queryKey: ['monthly-expenses', filterMonth],
    queryFn: async () => {
      const startDate = `${filterMonth}-01`;
      const endDate = `${filterMonth}-31`;
      
      const { data, error } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'expense')
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (error) throw error;
      return data.reduce((sum, record) => sum + Number(record.amount), 0);
    },
    enabled: isAdmin
  });

  if (!canViewFinance) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const dailyProfit = dailyIncome - dailyExpenses;
  const monthlyProfit = monthlyIncome - monthlyExpenses;

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">الملخص المالي</h2>
          <Select value={filterMonth} onValueChange={setFilterMonth}>
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
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Daily Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الإيرادات اليومية</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(dailyIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(selectedDate).toLocaleDateString('ar-SA')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المصروفات اليومية</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(dailyExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(selectedDate).toLocaleDateString('ar-SA')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الربح اليومي</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${dailyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(dailyProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              صافي الربح اليومي
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Cards (Admin only) */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card className="border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الإيرادات الشهرية</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(monthlyIncome)}
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(filterMonth).toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المصروفات الشهرية</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(monthlyExpenses)}
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(filterMonth).toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الربح الشهري</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${monthlyProfit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                {formatCurrency(monthlyProfit)}
              </div>
              <p className="text-xs text-muted-foreground">
                صافي الربح الشهري
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}