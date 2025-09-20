import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp, Users, Building, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dailySettlementsApi } from "@/api/dailySettlements";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/currency";

interface HallManager {
  id: string;
  full_name: string;
  email: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

export default function ActualLiquidityPage() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCreator, setSelectedCreator] = useState<string>('all');

  // Fetch hall managers (users with space_manager role)
  const { data: hallManagers = [] } = useQuery({
    queryKey: ['hall-managers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('user_role', 'space_manager')
        .order('full_name');
      
      if (error) throw error;
      return data as HallManager[];
    }
  });

  // Fetch all settlements within date range
  const { data: settlements = [], isLoading } = useQuery({
    queryKey: ['settlements-liquidity', startDate, endDate, selectedCreator],
    queryFn: async () => {
      if (selectedCreator === 'all') {
        return dailySettlementsApi.getAll(startDate, endDate);
      } else {
        return dailySettlementsApi.getByCreator(selectedCreator, startDate, endDate);
      }
    }
  });

  // Fetch teacher contributions
  const { data: teacherContributions = [] } = useQuery({
    queryKey: ['teacher-contributions', startDate, endDate],
    queryFn: () => dailySettlementsApi.getTeacherContributions(startDate, endDate)
  });

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const income = settlements.filter(s => s.type === 'income');
    const expenses = settlements.filter(s => s.type === 'expense');
    
    const totalIncome = income.reduce((sum, s) => sum + Number(s.amount), 0);
    const totalExpenses = expenses.reduce((sum, s) => sum + Number(s.amount), 0);
    const netAmount = totalIncome - totalExpenses;
    
    return {
      totalIncome,
      totalExpenses,
      netAmount,
      transactionCount: settlements.length,
      incomeCount: income.length,
      expenseCount: expenses.length
    };
  }, [settlements]);

  // Prepare data for daily trend chart
  const dailyTrendData = useMemo(() => {
    const dailyTotals = new Map<string, { date: string; income: number; expenses: number; net: number }>();
    
    settlements.forEach(settlement => {
      const date = settlement.settlement_date;
      if (!dailyTotals.has(date)) {
        dailyTotals.set(date, { date, income: 0, expenses: 0, net: 0 });
      }
      
      const dayData = dailyTotals.get(date)!;
      if (settlement.type === 'income') {
        dayData.income += Number(settlement.amount);
      } else {
        dayData.expenses += Number(settlement.amount);
      }
      dayData.net = dayData.income - dayData.expenses;
    });
    
    return Array.from(dailyTotals.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [settlements]);

  // Prepare data for hall manager performance
  const hallManagerData = useMemo(() => {
    const managerTotals = new Map<string, { 
      name: string; 
      income: number; 
      expenses: number; 
      net: number; 
      transactions: number;
    }>();
    
    settlements.forEach(settlement => {
      const manager = hallManagers.find(m => m.id === settlement.created_by);
      const managerName = manager?.full_name || 'غير محدد';
      
      if (!managerTotals.has(settlement.created_by)) {
        managerTotals.set(settlement.created_by, {
          name: managerName,
          income: 0,
          expenses: 0,
          net: 0,
          transactions: 0
        });
      }
      
      const data = managerTotals.get(settlement.created_by)!;
      data.transactions += 1;
      
      if (settlement.type === 'income') {
        data.income += Number(settlement.amount);
      } else {
        data.expenses += Number(settlement.amount);
      }
      data.net = data.income - data.expenses;
    });
    
    return Array.from(managerTotals.values()).sort((a, b) => b.income - a.income);
  }, [settlements, hallManagers]);

  // Prepare pie chart data for teacher contributions
  const teacherPieData = teacherContributions.slice(0, 8).map((teacher, index) => ({
    name: teacher.teacher_name,
    value: teacher.total_amount,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">السيولة الفعلية</h1>
        <div className="flex gap-4 items-center">
          <div className="flex gap-2">
            <div>
              <Label htmlFor="start-date">من</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-auto"
              />
            </div>
            <div>
              <Label htmlFor="end-date">إلى</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-auto"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="manager-filter">مدير القاعة</Label>
            <Select value={selectedCreator} onValueChange={setSelectedCreator}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="اختر مدير القاعة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المدراء</SelectItem>
                {hallManagers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summaryStats.totalIncome, 'SAR')}
            </div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.incomeCount} معاملة إيراد
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summaryStats.totalExpenses, 'SAR')}
            </div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.expenseCount} معاملة مصروف
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صافي السيولة</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summaryStats.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summaryStats.netAmount, 'SAR')}
            </div>
            <p className="text-xs text-muted-foreground">
              السيولة النقدية الصافية
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المعاملات</CardTitle>
            <Filter className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {summaryStats.transactionCount}
            </div>
            <p className="text-xs text-muted-foreground">
              معاملة في الفترة المحددة
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Data */}
      <Tabs defaultValue="trend" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trend">الاتجاه اليومي</TabsTrigger>
          <TabsTrigger value="teachers">مساهمة المعلمين</TabsTrigger>
          <TabsTrigger value="managers">أداء المدراء</TabsTrigger>
          <TabsTrigger value="transactions">تفاصيل المعاملات</TabsTrigger>
        </TabsList>

        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle>الاتجاه اليومي للسيولة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value, 'SAR')}
                      labelFormatter={(label) => `التاريخ: ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="income" name="الإيرادات" fill="#10B981" />
                    <Bar dataKey="expenses" name="المصروفات" fill="#EF4444" />
                    <Bar dataKey="net" name="صافي السيولة" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>توزيع مساهمات المعلمين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={teacherPieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${formatCurrency(value, 'SAR')}`}
                      >
                        {teacherPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value, 'SAR')} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ترتيب المعلمين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {teacherContributions.map((teacher, index) => (
                    <div key={teacher.teacher_id || teacher.teacher_name} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <span className="font-medium">{teacher.teacher_name}</span>
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-green-600">
                          {formatCurrency(teacher.total_amount, 'SAR')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {teacher.transaction_count} معاملة
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="managers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                أداء مدراء القاعات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hallManagerData.map((manager) => (
                  <Card key={manager.name}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{manager.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">الإيرادات:</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(manager.income, 'SAR')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">المصروفات:</span>
                        <span className="font-medium text-red-600">
                          {formatCurrency(manager.expenses, 'SAR')}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-sm font-medium">الصافي:</span>
                        <span className={`font-bold ${manager.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(manager.net, 'SAR')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">المعاملات:</span>
                        <Badge variant="secondary">{manager.transactions}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل جميع المعاملات</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">جاري التحميل...</div>
              ) : settlements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد معاملات في الفترة المحددة
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>المصدر</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>المدير</TableHead>
                      <TableHead>ملاحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settlements.map((settlement) => {
                      const manager = hallManagers.find(m => m.id === settlement.created_by);
                      return (
                        <TableRow key={settlement.id}>
                          <TableCell>
                            {new Date(settlement.settlement_date).toLocaleDateString('ar-EG')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={settlement.type === 'income' ? 'default' : 'destructive'}>
                              {settlement.type === 'income' ? 'إيراد' : 'مصروف'}
                            </Badge>
                          </TableCell>
                          <TableCell>{settlement.source_name}</TableCell>
                          <TableCell className={`font-medium ${settlement.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(settlement.amount, 'SAR')}
                          </TableCell>
                          <TableCell>{manager?.full_name || 'غير محدد'}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {settlement.notes || "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}