import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  className?: string;
  mobileShow?: boolean; // Show in mobile view
  priority?: 'high' | 'medium' | 'low'; // Priority for responsive design
}

interface ResponsiveTableProps {
  data: any[];
  columns: Column[];
  onRowClick?: (row: any) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export function ResponsiveTable({ 
  data, 
  columns, 
  onRowClick,
  loading,
  emptyMessage = 'لا توجد بيانات'
}: ResponsiveTableProps) {
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-4">
        {data.map((row, index) => (
          <Card 
            key={index} 
            variant="elevated"
            className={`${onRowClick ? 'cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1' : ''} border border-border/50`}
            onClick={() => onRowClick?.(row)}
          >
            <CardContent className="p-5">
              <div className="mobile-content">
                {columns
                  .filter(col => col.mobileShow !== false)
                  .slice(0, 5) // Show max 5 fields on mobile for better UX
                  .map((column) => {
                    const value = row[column.key];
                    const displayValue = column.render ? column.render(value, row) : value;
                    
                    return (
                      <div key={column.key} className="flex justify-between items-start gap-3">
                        <span className="text-sm text-muted-foreground font-medium min-w-0 flex-shrink-0">
                          {column.label}:
                        </span>
                        <div className="text-sm font-medium text-right min-w-0 flex-1 break-words">
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

  // Desktop view with responsive column hiding
  const visibleColumns = columns.filter(col => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 1024) { // lg breakpoint
        return col.priority === 'high' || col.mobileShow !== false;
      }
      if (width < 1280) { // xl breakpoint
        return col.priority !== 'low';
      }
    }
    return true;
  });

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {visibleColumns.map((column) => (
              <TableHead key={column.key} className={column.className}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow 
              key={index}
              className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
              onClick={() => onRowClick?.(row)}
            >
              {visibleColumns.map((column) => {
                const value = row[column.key];
                const displayValue = column.render ? column.render(value, row) : value;
                
                return (
                  <TableCell key={column.key} className={column.className}>
                    {displayValue}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}