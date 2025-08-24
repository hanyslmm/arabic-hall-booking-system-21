// Application constants
export const APP_CONFIG = {
  name: "Science Club",
  description: "نظام إدارة وحجز القاعات التعليمية",
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 20, 50]
  }
};

export const USER_ROLES = {
  ADMIN: 'admin',
  OWNER: 'owner',
  MANAGER: 'manager', 
  SPACE_MANAGER: 'space_manager',
  TEACHER: 'teacher',
  USER: 'user',
  READ_ONLY: 'read_only'
} as const;

export const PAYMENT_STATUS = {
  PAID: 'paid',
  PARTIAL: 'partial', 
  PENDING: 'pending'
} as const;

export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late'
} as const;



export const BOOKING_STATUS = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
} as const;

export const DAYS_OF_WEEK = [
  { value: 0, label: 'الأحد' },
  { value: 1, label: 'الاثنين' },
  { value: 2, label: 'الثلاثاء' },
  { value: 3, label: 'الأربعاء' },
  { value: 4, label: 'الخميس' },
  { value: 5, label: 'الجمعة' },
  { value: 6, label: 'السبت' }
];

export const ROUTES = {
  HOME: '/',
  BOOKINGS: '/bookings',
  BOOKING: '/booking',
  HALLS: '/halls',
  TEACHERS: '/teachers',
  SUBJECTS: '/subjects',
  STAGES: '/stages',
  USERS: '/users',
  STUDENTS: '/students',
  STUDENT_REGISTRATIONS: '/student-registrations',
  ATTENDANCE: '/attendance',
  MONTHLY_REPORTS: '/monthly-reports',
  MONTHLY_FEE_MANAGER: '/monthly-fee-manager',
  STUDENT_RELOCATION: '/student-relocation',
  FINANCIAL_REPORTS: '/financial-reports',
  REPORTS: '/reports',
  EXPENSES: '/expenses',
  SETTINGS: '/settings',
  AUDIT_LOGS: '/audit-logs',
  LOGIN: '/login',
  ADMIN_PRIVILEGES: '/admin-privileges'
} as const;

export const QUERY_STALE_TIME = {
  SHORT: 1 * 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes 
  LONG: 15 * 60 * 1000, // 15 minutes
  HOUR: 60 * 60 * 1000 // 1 hour
} as const;