import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
  priority?: 'high' | 'medium' | 'low'; // For responsive hiding
  sortable?: boolean;
}

interface ResponsiveDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  cardTitle?: (row: T) => string; // Primary field for card view
  cardSubtitle?: (row: T) => string; // Secondary field for card view
  actions?: (row: T) => React.ReactNode; // Action buttons
}

export function ResponsiveDataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  loading,
  emptyMessage = "لا توجد بيانات",
  className,
  cardTitle,
  cardSubtitle,
  actions,
}: ResponsiveDataTableProps<T>) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Compute visible columns (desktop rules) early to avoid conditional hook usage
  const visibleColumns = React.useMemo(() => {
    const width = typeof window === 'undefined' ? 1920 : window.innerWidth;
    if (width < 1024) return columns.filter(col => col.priority === 'high');
    if (width < 1280) return columns.filter(col => col.priority !== 'low');
    return columns;
  }, [columns]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">{emptyMessage}</p>
      </div>
    );
  }

  // Mobile Card View
  if (isMobile) {
    return (
      <div className={cn("space-y-4", className)}>
        {data.map((row, index) => (
          <Card 
            key={index}
            className={cn(
              "transition-all duration-200",
              onRowClick && "cursor-pointer hover:shadow-md active:scale-[0.98]"
            )}
            onClick={() => onRowClick?.(row)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {cardTitle && (
                    <h3 className="font-semibold text-base leading-tight truncate">
                      {cardTitle(row)}
                    </h3>
                  )}
                  {cardSubtitle && (
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {cardSubtitle(row)}
                    </p>
                  )}
                </div>
                {actions && (
                  <div className="flex items-center gap-1 ml-2">
                    {actions(row)}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {columns
                  .filter(col => col.priority === 'high' || col.priority === 'medium')
                  .slice(0, 4) // Show max 4 additional fields
                  .map((column) => {
                    const value = typeof column.key === 'string' 
                      ? row[column.key] 
                      : row[column.key as keyof T];
                    const displayValue = column.render ? column.render(value, row) : value;
                    
                    if (!displayValue && displayValue !== 0) return null;
                    
                    return (
                      <div key={String(column.key)} className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground font-medium min-w-0 flex-shrink-0">
                          {column.label}:
                        </span>
                        <div className="text-right min-w-0 flex-1 ml-2">
                          {displayValue}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Desktop Table View

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            {visibleColumns.map((column) => (
              <th
                key={String(column.key)}
                className={cn(
                  "text-right p-4 font-medium text-muted-foreground text-sm",
                  column.className
                )}
              >
                {column.label}
              </th>
            ))}
            {actions && <th className="w-12"></th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={index}
              className={cn(
                "border-b border-border transition-colors",
                onRowClick && "cursor-pointer hover:bg-muted/50 active:bg-muted"
              )}
              onClick={() => onRowClick?.(row)}
            >
              {visibleColumns.map((column) => {
                const value = typeof column.key === 'string' 
                  ? row[column.key] 
                  : row[column.key as keyof T];
                const displayValue = column.render ? column.render(value, row) : value;
                
                return (
                  <td
                    key={String(column.key)}
                    className={cn("p-4 text-sm", column.className)}
                  >
                    {displayValue}
                  </td>
                );
              })}
              {actions && (
                <td className="p-4">
                  <div className="flex items-center justify-center">
                    {actions(row)}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}