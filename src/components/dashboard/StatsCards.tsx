// src/components/dashboard/StatsCards.tsx

import { useEffect, useState } from 'react';
import { supabase } from '../../integrations/supabase/client'; // Adjusted path for clarity
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

// STEP 1: Define the props for this component.
// It now expects to receive 'selectedMonth' from its parent.
interface StatsCardsProps {
  selectedMonth: Date;
}

const StatsCards = ({ selectedMonth }: StatsCardsProps) => {
  const [stats, setStats] = useState({ totalIncome: 0, totalExpenses: 0, occupancy: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // STEP 2: Add 'selectedMonth' to the dependency array of useEffect.
  // This tells React to re-run this entire function whenever selectedMonth changes.
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);

      // Format the date into 'YYYY-MM-01' to match what the database function expects.
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth() + 1; // JS months are 0-11
      const formattedMonth = `${year}-${month.toString().padStart(2, '0')}-01`;

      try {
        // STEP 3: Pass the formatted month as a parameter to the database function.
        // This is the most important change. The query is now dynamic.
        const { data, error } = await supabase.rpc('get_financial_summary', {
          p_month: formattedMonth
        });

        if (error) {
          throw error;
        }

        if (data) {
          setStats({
            totalIncome: data.total_income || 0,
            totalExpenses: data.total_expenses || 0,
            occupancy: data.occupancy_rate || 0,
          });
        }
      } catch (err: any) {
        console.error('Error fetching financial summary:', err);
        setError('Could not load stats.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedMonth]); // The dependency array is no longer empty.

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(value);
  };

  if (loading) return <div>Loading stats...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">اجمالي الدخل</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalIncome)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">اجمالي المصروفات</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalExpenses)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">نسبة الاشغال</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.occupancy.toFixed(1)}%</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
