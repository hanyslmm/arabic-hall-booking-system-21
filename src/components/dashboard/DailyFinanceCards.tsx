import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/utils/currency";
import { MonthSelector } from "./MonthSelector";

interface DailyFinanceCardsProps {
  selectedDate?: string;
}

export function DailyFinanceCards({ selectedDate = new Date().toISOString().split('T')[0] }: DailyFinanceCardsProps) {
  const { profile } = useAuth();
  
  const isAdmin = profile?.role === 'admin';
  const canViewFinance = isAdmin || profile?.role === 'manager';
  
  // For non-admin users, force current day view
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const effectiveDate = viewMode === 'daily' ? currentDate : null;
  const effectiveMonth = viewMode === 'monthly' ? selectedMonth : null;
  const effectiveYear = viewMode === 'monthly' ? selectedYear : null;

  // Fetch daily/monthly income
  const { data: income = 0 } = useQuery({
    queryKey: ['finance-income', effectiveDate, effectiveMonth, effectiveYear, viewMode],
    queryFn: async () => {
      let query = supabase.from('payment_records').select('amount');
      
      if (viewMode === 'daily' && effectiveDate) {
        query = query.eq('payment_date', effectiveDate);
      } else if (viewMode === 'monthly' && effectiveMonth && effectiveYear) {
        const startDate = `${effectiveYear}-${effectiveMonth.toString().padStart(2, '0')}-01`;
        const endDate = effectiveMonth === 12 
          ? `${effectiveYear + 1}-01-01` 
          : `${effectiveYear}-${(effectiveMonth + 1).toString().padStart(2, '0')}-01`;
        query = query.gte('payment_date', startDate).lt('payment_date', endDate);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data?.reduce((sum, record) => sum + Number(record.amount), 0) || 0;
    },
    enabled: canViewFinance,
  });

  // Fetch daily/monthly expenses
  const { data: expenses = 0 } = useQuery({
    queryKey: ['finance-expenses', effectiveDate, effectiveMonth, effectiveYear, viewMode],
    queryFn: async () => {
      let query = supabase.from('expenses').select('amount');
      
      if (viewMode === 'daily' && effectiveDate) {
        query = query.eq('date', effectiveDate);
      } else if (viewMode === 'monthly' && effectiveMonth && effectiveYear) {
        const startDate = `${effectiveYear}-${effectiveMonth.toString().padStart(2, '0')}-01`;
        const endDate = effectiveMonth === 12 
          ? `${effectiveYear + 1}-01-01` 
          : `${effectiveYear}-${(effectiveMonth + 1).toString().padStart(2, '0')}-01`;
        query = query.gte('date', startDate).lt('date', endDate);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data?.reduce((sum, record) => sum + Number(record.amount), 0) || 0;
    },
    enabled: canViewFinance,
  });

  if (!canViewFinance) {
    return null;
  }

  const profit = income - expenses;
  const periodLabel = viewMode === 'daily' 
    ? new Date(currentDate).toLocaleDateString('ar-EG')
    : `${effectiveMonth}/${effectiveYear}`;

  return (
    <div className="space-y-6">
      {/* View Mode Controls (Only for Admin) */}
      {isAdmin && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'daily' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('daily')}
            >
              <Calendar className="h-4 w-4 ml-2" />
              عرض يومي
            </Button>
            <Button
              variant={viewMode === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('monthly')}
            >
              <TrendingUp className="h-4 w-4 ml-2" />
              عرض شهري
            </Button>
          </div>
          
          {viewMode === 'daily' && (
            <div className="flex gap-2 items-center">
              <label className="text-sm">التاريخ:</label>
              <input
                type="date"
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm"
              />
            </div>
          )}
          
          {viewMode === 'monthly' && (
            <MonthSelector
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={(month, year) => {
                setSelectedMonth(month);
                setSelectedYear(year);
              }}
            />
          )}
        </div>
      )}

      {/* Finance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {viewMode === 'daily' ? 'اجمالي الدخل' : 'الدخل الشهري'}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(income)}
            </div>
            <p className="text-xs text-muted-foreground">
              {periodLabel}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {viewMode === 'daily' ? 'اجمالي المصروفات' : 'المصروفات الشهرية'}
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(expenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              {periodLabel}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {viewMode === 'daily' ? 'الربح اليومي' : 'الربح الشهري'}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(profit)}
            </div>
            <p className="text-xs text-muted-foreground">
              {periodLabel}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}