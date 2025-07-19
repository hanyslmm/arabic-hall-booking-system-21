// Query stale times
export const STALE_TIME = {
  SHORT: 2 * 60 * 1000,   // 2 minutes
  MEDIUM: 5 * 60 * 1000,  // 5 minutes  
  LONG: 10 * 60 * 1000,   // 10 minutes
  VERY_LONG: 30 * 60 * 1000, // 30 minutes
} as const;

// Cache times
export const CACHE_TIME = {
  SHORT: 5 * 60 * 1000,   // 5 minutes
  MEDIUM: 15 * 60 * 1000, // 15 minutes
  LONG: 30 * 60 * 1000,   // 30 minutes
} as const;

// Retry configuration
export const RETRY_CONFIG = {
  DEFAULT: 3,
  CRITICAL: 5,
  NONE: 0,
} as const;

// App text constants
export const APP_TEXT = {
  LOADING: 'جاري التحميل...',
  ERROR: 'حدث خطأ غير متوقع',
  RETRY: 'إعادة المحاولة',
  NO_DATA: 'لا توجد بيانات',
  SUCCESS: 'تم بنجاح',
  CONFIRM: 'تأكيد',
  CANCEL: 'إلغاء',
  SAVE: 'حفظ',
  EDIT: 'تعديل',
  DELETE: 'حذف',
  ADD: 'إضافة',
} as const;