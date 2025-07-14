import { useState, useMemo } from 'react';
import { PaginationState } from '@/types';
import { APP_CONFIG } from '@/lib/constants';

interface UseTableDataProps<T> {
  data: T[];
  searchFields?: (keyof T)[];
  initialPageSize?: number;
}

export function useTableData<T>({ 
  data, 
  searchFields = [], 
  initialPageSize = APP_CONFIG.pagination.defaultPageSize 
}: UseTableDataProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: initialPageSize,
    total: 0
  });

  const filteredData = useMemo(() => {
    if (!searchTerm || searchFields.length === 0) return data;
    
    return data.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, searchFields]);

  const paginatedData = useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, pagination.page, pagination.pageSize]);

  const totalPages = Math.ceil(filteredData.length / pagination.pageSize);

  const updatePagination = (updates: Partial<PaginationState>) => {
    setPagination(prev => ({ 
      ...prev, 
      ...updates,
      total: filteredData.length 
    }));
  };

  const goToPage = (page: number) => {
    updatePagination({ page: Math.max(1, Math.min(page, totalPages)) });
  };

  const changePageSize = (pageSize: number) => {
    updatePagination({ pageSize, page: 1 });
  };

  return {
    searchTerm,
    setSearchTerm,
    pagination: { ...pagination, total: filteredData.length },
    paginatedData,
    totalPages,
    goToPage,
    changePageSize,
    updatePagination
  };
}