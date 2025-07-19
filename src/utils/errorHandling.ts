export interface AppError {
  message: string;
  code?: string;
  details?: any;
}

export const handleError = (error: any): AppError => {
  if (error?.message) {
    return {
      message: error.message,
      code: error.code,
      details: error.details
    };
  }
  
  return {
    message: 'حدث خطأ غير متوقع',
    code: 'UNKNOWN_ERROR',
    details: error
  };
};

export const formatErrorMessage = (error: AppError): string => {
  switch (error.code) {
    case 'PGRST116':
      return 'لم يتم العثور على البيانات المطلوبة';
    case 'PGRST301':
      return 'غير مصرح بهذا الإجراء';
    case '23505':
      return 'البيانات موجودة مسبقاً';
    case '23503':
      return 'لا يمكن حذف هذا العنصر لارتباطه ببيانات أخرى';
    default:
      return error.message;
  }
};