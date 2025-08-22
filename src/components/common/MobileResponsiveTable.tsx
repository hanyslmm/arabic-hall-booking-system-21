import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';

export interface TableColumn<T> {
  key: keyof T | 'actions';
  header: string;
  mobileLabel: string;
  hideOnMobile?: boolean;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

export interface TableAction<T> {
  label: string;
  onClick: (item: T) => void;
  variant?: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost" | null | undefined;
  size?: "default" | "sm" | "lg" | "icon" | null | undefined;
  icon?: React.ReactNode;
}

interface MobileResponsiveTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  actions?: TableAction<T>[];
  title: string;
  isLoading?: boolean;
  emptyMessage: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  getRowKey: (item: T) => string | number;
  expandedContent?: (item: T) => React.ReactNode;
  itemsPerPage: number;
  serverSide?: boolean;
  totalItems?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onSort?: (columnKey: string) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

export function MobileResponsiveTable<T>({
  data,
  columns,
  actions,
  title,
  isLoading,
  emptyMessage,
  emptyIcon,
  emptyAction,
  getRowKey,
  expandedContent,
  onSort,
  sortColumn,
  sortDirection,
}: MobileResponsiveTableProps<T>) {
  const [expandedRow, setExpandedRow] = useState<string | number | null>(null);

  const toggleRow = (key: string | number) => {
    setExpandedRow(expandedRow === key ? null : key);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop Table */}
        <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={String(col.key)} className={col.hideOnMobile ? 'hidden md:table-cell' : ''}>
                    {col.sortable ? (
                      <Button variant="ghost" onClick={() => onSort && onSort(String(col.key))}>
                        {col.header}
                        {sortColumn === col.key ? (
                          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 ml-2" />
                        )}
                      </Button>
                    ) : (
                      col.header
                    )}
                  </TableHead>
                ))}
                {actions && <TableHead>الإجراءات</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (actions ? 1 : 0)}>جاري التحميل...</TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="text-center">
                    {emptyIcon}
                    <p className="mt-2">{emptyMessage}</p>
                    {emptyAction && (
                      <Button onClick={emptyAction.onClick} className="mt-4">
                        {emptyAction.icon}
                        {emptyAction.label}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => {
                  const key = getRowKey(item);
                  const isExpanded = expandedRow === key;
                  return (
                    <>
                      <TableRow key={key} onClick={() => expandedContent && toggleRow(key)} className={expandedContent ? 'cursor-pointer' : ''}>
                        {columns.map((col) => (
                          <TableCell key={String(col.key)} className={col.hideOnMobile ? 'hidden md:table-cell' : ''}>
                            {col.render ? col.render(item) : (item as any)[col.key]}
                          </TableCell>
                        ))}
                        {actions && (
                          <TableCell>
                            <div className="flex gap-2">
                              {actions.map((action) => (
                                <Button
                                  key={action.label}
                                  variant={action.variant}
                                  size={action.size || 'sm'}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    action.onClick(item);
                                  }}
                                >
                                  {action.icon}
                                  <span className="sr-only">{action.label}</span>
                                </Button>
                              ))}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                      {isExpanded && expandedContent && (
                        <TableRow>
                          <TableCell colSpan={columns.length + (actions ? 1 : 0)}>
                            {expandedContent(item)}
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden space-y-4">
          {isLoading ? (
            <p>جاري التحميل...</p>
          ) : data.length === 0 ? (
            <div className="text-center">
              {emptyIcon}
              <p className="mt-2">{emptyMessage}</p>
              {emptyAction && (
                <Button onClick={emptyAction.onClick} className="mt-4">
                  {emptyAction.icon}
                  {emptyAction.label}
                </Button>
              )}
            </div>
          ) : (
            data.map((item) => {
              const key = getRowKey(item);
              const isExpanded = expandedRow === key;
              return (
                <Card key={key} onClick={() => expandedContent && toggleRow(key)}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      {columns.map((col) => !col.hideOnMobile && (
                        <div key={String(col.key)}>
                          <p className="text-sm text-muted-foreground">{col.mobileLabel}</p>
                          <p className="font-medium">{col.render ? col.render(item) : (item as any)[col.key]}</p>
                        </div>
                      ))}
                    </div>
                    {actions && (
                      <div className="flex gap-2 mt-4">
                        {actions.map((action) => (
                          <Button
                            key={action.label}
                            variant={action.variant}
                            size={action.size || 'sm'}
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(item);
                            }}
                          >
                            {action.icon}
                            <span className="ml-2">{action.label}</span>
                          </Button>
                        ))}
                      </div>
                    )}
                    {isExpanded && expandedContent && (
                      <div className="mt-4 border-t pt-4">
                        {expandedContent(item)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}