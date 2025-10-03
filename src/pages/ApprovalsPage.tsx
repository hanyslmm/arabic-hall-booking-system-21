import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dailySettlementsApi } from "@/api/dailySettlements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function ApprovalsPage() {
  const { isAdmin, isOwner, profile } = useAuth();
  const canModerate = isAdmin || isOwner || profile?.user_role === 'manager';
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState<string>(today);
  const [status, setStatus] = useState<'pending'|'approved'|'rejected'|'all'>('pending');
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['profiles-minimal'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name, username').order('full_name');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['settlement-requests', { date, status, userId }],
    queryFn: () => dailySettlementsApi.listRequests({ date, status, userId })
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => dailySettlementsApi.approveRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlement-requests'] });
      toast({ title: 'تمت الموافقة', description: 'تمت الموافقة على الطلب.' });
    },
    onError: (e: any) => toast({ title: 'خطأ', description: e?.message || 'تعذر تنفيذ العملية', variant: 'destructive' })
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => dailySettlementsApi.rejectRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlement-requests'] });
      toast({ title: 'تم الرفض', description: 'تم رفض الطلب.' });
    },
    onError: (e: any) => toast({ title: 'خطأ', description: e?.message || 'تعذر تنفيذ العملية', variant: 'destructive' })
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">طلبات الموافقة</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>عوامل التصفية</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-sm mb-1 block">التاريخ</label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm mb-1 block">الحالة</label>
            <Select value={status} onValueChange={(v:any) => setStatus(v)}>
              <SelectTrigger><SelectValue placeholder="اختر حالة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">بانتظار الموافقة</SelectItem>
                <SelectItem value="approved">مقبول</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
                <SelectItem value="all">الكل</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm mb-1 block">المستخدم</label>
            <Select value={userId || ''} onValueChange={(v:any)=> setUserId(v || undefined)}>
              <SelectTrigger><SelectValue placeholder="الكل" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">الكل</SelectItem>
                {users.map((u:any)=> (
                  <SelectItem key={u.id} value={u.id}>{u.full_name || u.username}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الطلبات</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>النوع</TableHead>
                <TableHead>المصدر</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>ملاحظات</TableHead>
                <TableHead>صاحب الطلب</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(requests as any[]).map((r:any) => (
                <TableRow key={r.id}>
                  <TableCell>{r.request_type === 'edit' ? 'تعديل' : 'حذف'}</TableCell>
                  <TableCell>{r.payload?.source_name || '-'}</TableCell>
                  <TableCell>{r.payload?.amount ?? '-'}</TableCell>
                  <TableCell>{r.payload?.notes ?? '-'}</TableCell>
                  <TableCell>{r.payload?.requester_name ?? '-'}</TableCell>
                  <TableCell>{new Date(r.created_at).toLocaleString('ar-EG')}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="success" onClick={() => approveMutation.mutate(r.id)} disabled={approveMutation.isPending || !canModerate}>موافقة</Button>
                      <Button size="sm" variant="destructive" onClick={() => rejectMutation.mutate(r.id)} disabled={rejectMutation.isPending || !canModerate}>رفض</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


