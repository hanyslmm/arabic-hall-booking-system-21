import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarDays } from "lucide-react";
import { format, isValid } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DateRangeFilterProps {
  startDate?: Date;
  endDate?: Date;
  onDateRangeChange: (startDate: Date | undefined, endDate: Date | undefined) => void;
}

export function DateRangeFilter({ startDate, endDate, onDateRangeChange }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (date: Date | undefined) => {
    if (!date || !isValid(date)) return "اختر التاريخ";
    return format(date, "dd/MM/yyyy", { locale: ar });
  };

  const handleStartDateSelect = (date: Date | undefined) => {
    onDateRangeChange(date, endDate);
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    onDateRangeChange(startDate, date);
  };

  const clearDates = () => {
    onDateRangeChange(undefined, undefined);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-right font-normal",
            !startDate && !endDate && "text-muted-foreground"
          )}
        >
          <CalendarDays className="ml-2 h-4 w-4" />
          {startDate && endDate
            ? `${formatDate(startDate)} - ${formatDate(endDate)}`
            : startDate
            ? `من ${formatDate(startDate)}`
            : endDate
            ? `إلى ${formatDate(endDate)}`
            : "فترة زمنية مخصصة"
          }
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col space-y-4 p-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">من تاريخ:</p>
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={handleStartDateSelect}
              disabled={(date) => date > new Date() || (endDate && date > endDate)}
              initialFocus
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">إلى تاريخ:</p>
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={handleEndDateSelect}
              disabled={(date) => date > new Date() || (startDate && date < startDate)}
            />
          </div>
          <div className="flex justify-between gap-2">
            <Button variant="outline" size="sm" onClick={clearDates}>
              مسح التواريخ
            </Button>
            <Button size="sm" onClick={() => setIsOpen(false)}>
              تطبيق
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}