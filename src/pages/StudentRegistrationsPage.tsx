import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchIcon, CreditCard, Users, Clock } from 'lucide-react';
import { studentRegistrationsApi } from '@/api/students';
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
        columns={[
          {
            key: 'student_id',
            header: 'رقم الطالب',
            render: (item: any) => <Badge variant="outline">{item.student_id?.slice(-8)}</Badge>
          },
          {
            key: 'total_fees',
            header: 'الرسوم',
            render: (item: any) => `${item.total_fees} LE`
          },
          {
            key: 'payment_status',
            header: 'حالة الدفع',
            render: (item: any) => {
              const variants = { paid: 'default', partial: 'secondary', pending: 'destructive' } as const;
              const variant = variants[item.payment_status as keyof typeof variants] || 'outline';
              return <Badge variant={variant}>{item.payment_status}</Badge>;
            }
          }
        ]}
        getRowKey={(item: any) => item.student_id || item.id}
        isLoading={isLoading}
        emptyMessage="لا توجد تسجيلات"
      />

      <FastReceptionistModal isOpen={showFastModal} onClose={() => setShowFastModal(false)} />
    </div>
  );
}