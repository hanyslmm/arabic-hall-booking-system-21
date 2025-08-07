import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchIcon, CreditCard, Users, Clock } from 'lucide-react';
import { studentRegistrationsApi } from '@/api/students';
import { ResponsiveTable } from '@/components/common/ResponsiveTable';
import { useTableData } from '@/hooks/useTableData';
import { PaginatedTable } from '@/components/common/PaginatedTable';
import { FastReceptionistModal } from '@/components/receptionist/FastReceptionistModal';
import { format } from 'date-fns';

export default function StudentRegistrationsPage() {
  const [showFastModal, setShowFastModal] = useState(false);

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ['student-registrations'],
    queryFn: studentRegistrationsApi.getAll
  });

  const tableData = useTableData({
    data: registrations,
    searchFields: ['student_id', 'payment_status'],
    initialPageSize: 25
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8" />
          تسجيلات الطلاب
        </h1>
        <Button onClick={() => setShowFastModal(true)} className="bg-green-600 hover:bg-green-700">
          <Clock className="h-4 w-4 mr-2" />
          التسجيل السريع
        </Button>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="البحث في التسجيلات..."
          value={tableData.searchTerm}
          onChange={(e) => tableData.setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <SearchIcon className="h-4 w-4 text-muted-foreground" />
      </div>

      <PaginatedTable
        data={tableData.paginatedData}
        totalItems={tableData.pagination.total}
        pagination={tableData.pagination}
        onPageChange={tableData.goToPage}
        onPageSizeChange={tableData.changePageSize}
        loading={isLoading}
      >
        <ResponsiveTable
          data={tableData.paginatedData}
          columns={[
            {
              key: 'student_id',
              label: 'رقم الطالب',
              priority: 'high' as const,
              mobileShow: true,
              render: (value: string) => <Badge variant="outline">{value.slice(-8)}</Badge>
            },
            {
              key: 'total_fees',
              label: 'الرسوم',
              priority: 'high' as const,
              render: (value: number) => `${value} LE`
            },
            {
              key: 'payment_status',
              label: 'حالة الدفع',
              priority: 'high' as const,
              mobileShow: true,
              render: (value: string) => {
                const variants = { paid: 'default', partial: 'secondary', pending: 'destructive' };
                return <Badge variant={variants[value as keyof typeof variants] || 'outline'}>{value}</Badge>;
              }
            }
          ]}
          loading={isLoading}
          emptyMessage="لا توجد تسجيلات"
        />
      </PaginatedTable>

      <FastReceptionistModal isOpen={showFastModal} onClose={() => setShowFastModal(false)} />
    </div>
  );
}