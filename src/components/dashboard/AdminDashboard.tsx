import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { FastReceptionistModal } from "@/components/receptionist/FastReceptionistModal";
import StatsCards from "@/components/dashboard/StatsCards";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { HallsGrid } from "@/components/dashboard/HallsGrid";
import { useAuth } from "@/hooks/useAuth";

import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/api/dashboard";

export function AdminDashboard() {
  const { profile } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isFastReceptionistOpen, setIsFastReceptionistOpen] = useState(false);
  

  // Local permission helper to align with `can('create:registrations')`
  const can = (permission: string) => {
    if (permission === 'create:registrations') {
      // Allow all non-teacher roles (consistent with registrations page)
      return profile?.user_role !== 'teacher';
    }
    return false;
  };

  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  // Fetch per-hall occupancy for the grid using the new API layer
  const { data: occupancyData } = useQuery({
    queryKey: ['hall-occupancy-dashboard'],
    queryFn: () => dashboardApi.getHallOccupancy(),
    staleTime: 30_000,
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">لوحة التحكم</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {can('create:registrations') && (
            <Button 
              onClick={() => setIsFastReceptionistOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="ml-2 h-4 w-4" />
              تسجيل سريع
            </Button>
          )}
        </div>
      </div>


      <MonthSelector 
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={handleMonthChange}
      />

      <StatsCards selectedMonth={selectedMonth} selectedYear={selectedYear} />

      <HallsGrid occupancyData={occupancyData || []} />

      <FastReceptionistModal 
        isOpen={isFastReceptionistOpen} 
        onClose={() => setIsFastReceptionistOpen(false)} 
      />
    </div>
  );
}
