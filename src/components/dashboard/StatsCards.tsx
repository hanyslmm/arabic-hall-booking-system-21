import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/dashboard';

interface StatsCardsProps {
  selectedMonth: number; // 1-12
  selectedYear: number;  // four-digit year
  dateRange?: {
    startDate?: Date;
    endDate?: Date;
  };
}

const StatsCards = ({ selectedMonth, selectedYear, dateRange }: StatsCardsProps) => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['financial-summary', selectedMonth, selectedYear],
    queryFn: () => dashboardApi.getFinancialSummary(selectedMonth, selectedYear),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const formatCurrency = (value: number) => {
    // Use English digits formatting and append Arabic currency label for consistency with reports page
    return `${Number(value || 0).toLocaleString('en-EG')} جنيه`;
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (error) {
    return <div className="text-red-500 text-center py-4">فشل في تحميل الإحصائيات</div>;
  }

  if (!stats) return null;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">اجمالي الدخل</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{formatCurrency(stats.totalIncome)}</div>
        </CardContent>
      </Card>
      
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">اجمالي المصروفات</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{formatCurrency(stats.totalExpenses)}</div>
        </CardContent>
      </Card>
      
      <Card className="transition-all duration-200 hover:shadow-md sm:col-span-2 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">نسبة الاشغال</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{stats.occupancy.toFixed(1)}%</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
