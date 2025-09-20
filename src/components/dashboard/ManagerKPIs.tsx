import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useMonthContext } from "@/hooks/useMonthNavigation";

type Booking = {
  id: string;
  teacher_id: string | null;
  days_of_week: string[];
  status: string;
};

type Teacher = { id: string; name: string };

function getTodayWeekdayKey(): string {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return days[new Date().getDay()];
}

function formatDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function ManagerKPIs() {
  const { profile } = useAuth();
  const { selectedMonth, selectedYear } = useMonthContext();

  // Daily context
  const todayKey = getTodayWeekdayKey();
  const todayDate = formatDateLocal(new Date());

  // Fetch active bookings that run today
  const { data: bookings = [] } = useQuery({
    queryKey: ["manager-kpis-bookings", todayKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, teacher_id, days_of_week, status")
        .eq("status", "active")
        .contains("days_of_week", [todayKey]);
      if (error) throw error;
      return (data || []) as Booking[];
    },
    staleTime: 30_000,
  });

  const bookingIds = useMemo(() => bookings.map((b) => b.id), [bookings]);
  const teacherIds = useMemo(
    () => Array.from(new Set(bookings.map((b) => b.teacher_id).filter(Boolean))) as string[],
    [bookings]
  );

  // Teachers map for display
  const { data: teachers = [] } = useQuery({
    queryKey: ["manager-kpis-teachers", teacherIds],
    queryFn: async () => {
      if (!teacherIds.length) return [] as Teacher[];
      const { data, error } = await supabase
        .from("teachers")
        .select("id, name")
        .in("id", teacherIds);
      if (error) throw error;
      return (data || []) as Teacher[];
    },
    enabled: teacherIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const teacherById = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of teachers) map.set(t.id, t.name);
    return map;
  }, [teachers]);

  // Registrations under today's bookings
  const { data: registrations = [] } = useQuery({
    queryKey: ["manager-kpis-registrations", bookingIds],
    queryFn: async () => {
      if (bookingIds.length === 0) return [] as any[];
      const { data, error } = await supabase
        .from("student_registrations")
        .select("id, booking_id, total_fees")
        .in("booking_id", bookingIds);
      if (error) throw error;
      return data || [];
    },
    enabled: bookingIds.length > 0,
    staleTime: 30_000,
  });

  const registrationIds = useMemo(
    () => registrations.map((r: any) => r.id),
    [registrations]
  );

  // Payments for today (for daily KPIs)
  const { data: paymentsToday = [] } = useQuery({
    queryKey: ["manager-kpis-payments-daily", registrationIds, todayDate],
    queryFn: async () => {
      if (!registrationIds.length) return [] as any[];
      const { data, error } = await supabase
        .from("payment_records")
        .select("id, student_registration_id, amount, payment_date")
        .eq("payment_date", todayDate)
        .in("student_registration_id", registrationIds);
      if (error) throw error;
      return data || [];
    },
    enabled: registrationIds.length > 0,
    staleTime: 30_000,
  });

  // Payments for selected month (for monthly filter)
  const { data: monthlyUniquePaidCount = 0 } = useQuery({
    queryKey: ["manager-kpis-payments-monthly", selectedMonth, selectedYear],
    queryFn: async () => {
      const start = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
      const endMonth = selectedMonth === 12 ? 1 : selectedMonth + 1;
      const endYear = selectedMonth === 12 ? selectedYear + 1 : selectedYear;
      const end = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;
      const pageSize = 1000;
      let offset = 0;
      const unique = new Set<string>();
      while (true) {
        const { data, error } = await supabase
          .from("payment_records")
          .select("student_registration_id")
          .gte("payment_date", start)
          .lt("payment_date", end)
          .order("payment_date", { ascending: true })
          .range(offset, offset + pageSize - 1);
        if (error) throw error;
        const rows = (data as Array<{ student_registration_id: string }> ) || [];
        for (const row of rows) {
          if (row?.student_registration_id) unique.add(row.student_registration_id);
        }
        if (rows.length < pageSize) break;
        offset += pageSize;
      }
      return unique.size;
    },
    staleTime: 30_000,
  });

  // Group helpers
  const registrationsByBooking = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const r of registrations as any[]) {
      const list = map.get(r.booking_id) || [];
      list.push(r.id);
      map.set(r.booking_id, list);
    }
    return map;
  }, [registrations]);

  const paymentsTodaySet = useMemo(() => new Set((paymentsToday as any[]).map(p => p.student_registration_id)), [paymentsToday]);
  const paymentsMonthlySet = useMemo(() => new Set<string>(), []);

  // Monthly per-teacher paid % based on registration_date and payments within selected month
  const { data: monthlyRegsByTeacher } = useQuery({
    queryKey: ["manager-kpis-monthly-regs", selectedMonth, selectedYear],
    queryFn: async () => {
      const start = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
      const endMonth = selectedMonth === 12 ? 1 : selectedMonth + 1;
      const endYear = selectedMonth === 12 ? selectedYear + 1 : selectedYear;
      const end = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;
      const pageSize = 1000;
      let offset = 0;
      const totals = new Map<string, number>();
      while (true) {
        const { data, error } = await supabase
          .from("student_registrations")
          .select("id, registration_date, booking:bookings(teacher_id)")
          .gte("registration_date", start)
          .lt("registration_date", end)
          .order("registration_date", { ascending: true })
          .range(offset, offset + pageSize - 1);
        if (error) throw error;
        const rows = (data as Array<{ id: string; booking: { teacher_id: string | null } }>) || [];
        for (const r of rows) {
          const tid = r?.booking?.teacher_id;
          if (!tid) continue;
          totals.set(tid, (totals.get(tid) || 0) + 1);
        }
        if (rows.length < pageSize) break;
        offset += pageSize;
      }
      return totals;
    },
    staleTime: 30_000,
  });

  const { data: monthlyPaidByTeacher } = useQuery({
    queryKey: ["manager-kpis-monthly-paid", selectedMonth, selectedYear],
    queryFn: async () => {
      const start = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
      const endMonth = selectedMonth === 12 ? 1 : selectedMonth + 1;
      const endYear = selectedMonth === 12 ? selectedYear + 1 : selectedYear;
      const end = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;
      const pageSize = 1000;
      let offset = 0;
      const paidMap = new Map<string, Set<string>>(); // teacherId -> set(regId)
      while (true) {
        const { data, error } = await supabase
          .from("payment_records")
          .select("student_registration_id, student_registration:student_registrations(booking:bookings(teacher_id))")
          .gte("payment_date", start)
          .lt("payment_date", end)
          .order("payment_date", { ascending: true })
          .range(offset, offset + pageSize - 1);
        if (error) throw error;
        const rows = (data as Array<{ student_registration_id: string; student_registration: { booking: { teacher_id: string | null } } }>) || [];
        for (const row of rows) {
          const tid = row?.student_registration?.booking?.teacher_id;
          const regId = row?.student_registration_id;
          if (!tid || !regId) continue;
          if (!paidMap.has(tid)) paidMap.set(tid, new Set<string>());
          paidMap.get(tid)!.add(regId);
        }
        if (rows.length < pageSize) break;
        offset += pageSize;
      }
      // Convert to counts
      const counts = new Map<string, number>();
      for (const [tid, set] of paidMap.entries()) counts.set(tid, set.size);
      return counts;
    },
    staleTime: 30_000,
  });

  // Build teacher names for those present in either map
  const teacherIdsMonthly = useMemo(() => {
    const ids = new Set<string>();
    if (monthlyRegsByTeacher) for (const k of monthlyRegsByTeacher.keys()) ids.add(k);
    if (monthlyPaidByTeacher) for (const k of monthlyPaidByTeacher.keys()) ids.add(k);
    return Array.from(ids);
  }, [monthlyRegsByTeacher, monthlyPaidByTeacher]);

  const { data: monthTeachers = [] } = useQuery({
    queryKey: ["manager-kpis-month-teachers", teacherIdsMonthly],
    queryFn: async () => {
      if (!teacherIdsMonthly.length) return [] as Teacher[];
      const { data, error } = await supabase.from("teachers").select("id, name").in("id", teacherIdsMonthly);
      if (error) throw error;
      return (data || []) as Teacher[];
    },
    enabled: teacherIdsMonthly.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const monthTeacherNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of monthTeachers) map.set(t.id, t.name);
    return map;
  }, [monthTeachers]);

  const teacherMonthlyPercentages = useMemo(() => {
    const results: Array<{ teacherId: string; teacherName: string; total: number; paid: number; percent: number; }> = [];
    if (!monthlyRegsByTeacher && !monthlyPaidByTeacher) return results;
    const ids = new Set<string>();
    if (monthlyRegsByTeacher) for (const k of monthlyRegsByTeacher.keys()) ids.add(k);
    if (monthlyPaidByTeacher) for (const k of monthlyPaidByTeacher.keys()) ids.add(k);
    for (const id of ids) {
      const total = monthlyRegsByTeacher?.get(id) || 0;
      const paid = monthlyPaidByTeacher?.get(id) || 0;
      const percent = total > 0 ? Math.round((paid / total) * 100) : 0;
      results.push({ teacherId: id, teacherName: monthTeacherNameById.get(id) || "-", total, paid, percent });
    }
    results.sort((a, b) => b.percent - a.percent);
    return results;
  }, [monthlyRegsByTeacher, monthlyPaidByTeacher, monthTeacherNameById]);

  // Summary counts for the manager today
  const totalStudentsToday = useMemo(() => {
    const allRegIds = new Set<string>();
    for (const ids of registrationsByBooking.values()) ids.forEach((x) => allRegIds.add(x));
    return allRegIds.size;
  }, [registrationsByBooking]);

  const paidStudentsToday = useMemo(() => {
    const allRegIds = new Set<string>();
    for (const ids of registrationsByBooking.values()) ids.forEach((x) => allRegIds.add(x));
    let count = 0;
    allRegIds.forEach((id) => { if (paymentsTodaySet.has(id)) count++; });
    return count;
  }, [registrationsByBooking, paymentsTodaySet]);

  const missingStudentsToday = Math.max(totalStudentsToday - paidStudentsToday, 0);

  // Monthly counts (students with at least one payment this month)
  // Count of unique students who paid in the selected month (across all registrations)
  const paidStudentsMonthly = monthlyUniquePaidCount;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-xl font-bold">مؤشرات الأداء لمدير القاعات</h2>
      </div>

      {/* Summary cards (counts only, no money) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">عدد الطلاب المجدولين اليوم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudentsToday}</div>
            <p className="text-xs text-muted-foreground">{formatDateLocal(new Date())}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">طلاب دفعوا اليوم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidStudentsToday}</div>
            <p className="text-xs text-muted-foreground">{formatDateLocal(new Date())}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">طلاب ما زالوا غير محصلين اليوم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{missingStudentsToday}</div>
            <p className="text-xs text-muted-foreground">{formatDateLocal(new Date())}</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-teacher monthly paid percentage (based on selected month) */}
      <Card>
        <CardHeader>
          <CardTitle>نسبة التحصيل الشهري لكل معلم</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {teacherMonthlyPercentages.length === 0 && (
            <div className="text-sm text-muted-foreground">لا توجد بيانات للشهر المحدد.</div>
          )}
          {teacherMonthlyPercentages.map((row) => (
            <div key={row.teacherId} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{row.teacherName}</span>
                <span className="text-muted-foreground">{row.paid}/{row.total}</span>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={row.percent} className="flex-1" />
                <span className="w-12 text-right text-sm font-semibold">{row.percent}%</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Monthly collection coverage (counts only) */}
      <Card>
        <CardHeader>
          <CardTitle>عدد الطلاب الذين دفعوا خلال الشهر المحدد</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{paidStudentsMonthly}</div>
          <p className="text-xs text-muted-foreground">الشهر: {selectedMonth}/{selectedYear}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default ManagerKPIs;


