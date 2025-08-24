import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/utils/currency";

interface DailyFinanceCardsProps {
  selectedDate?: string;
}

export function DailyFinanceCards({ selectedDate = new Date().toISOString().split('T')[0] }: DailyFinanceCardsProps) {
  const { profile } = useAuth();
  
  const isAdmin = profile?.role === 'admin';
  const canViewFinance = isAdmin || profile?.role === 'manager';

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
      const startDate = selectedDate;
      const { data, error } = await supabase
        .from('expenses')
        .select('amount')
        .eq('date', startDate);
      
      if (error) throw error;
      return data.reduce((sum, record) => sum + Number(record.amount), 0);
    },
    enabled: canViewFinance
  });

  if (!canViewFinance) {
    return null;
  }

  const dailyProfit = dailyIncome - dailyExpenses;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">الملخص المالي اليومي</h2>
      </div>

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
    </div>
  );
}