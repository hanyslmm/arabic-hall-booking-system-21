import { lazy } from 'react';

// Lazy load all main pages for better performance
export const LazyBookingPage = lazy(() => import('@/pages/BookingPage'));
export const LazyUsersPage = lazy(() => import('@/pages/UsersPage'));
export const LazyTeachersPage = lazy(() => import('@/pages/TeachersPage'));
export const LazyHallsPage = lazy(() => import('@/pages/HallsPage'));
export const LazyStagesPage = lazy(() => import('@/pages/StagesPage'));
export const LazySubjectsPage = lazy(() => import('@/pages/SubjectsPage'));
export const LazyBookingsPage = lazy(() => import('@/pages/BookingsPage'));
export const LazyStudentsPage = lazy(() => import('@/pages/StudentsPage'));
export const LazyStudentRegistrationsPage = lazy(() => import('@/pages/StudentRegistrationsPage'));
export const LazyClassManagementPage = lazy(() => import('@/pages/ClassManagementPage'));
export const LazyAttendanceManagementPage = lazy(() => import('@/pages/AttendanceManagementPage'));
export const LazyMonthlyReportsPage = lazy(() => import('@/pages/MonthlyReportsPage'));
export const LazyMonthlyFeeManager = lazy(() => import('@/pages/MonthlyFeeManagerPage'));
export const LazyStudentRelocationManager = lazy(() => import('@/pages/StudentRelocationPage'));
export const LazyClassFinancialReportsPage = lazy(() => import('@/pages/ClassFinancialReportsPage'));
export const LazyAdminPrivilegesPage = lazy(() => import('@/pages/AdminPrivilegesPage'));
export const LazyDailyExpensesPage = lazy(() => import('@/pages/DailyExpensesPage'));
export const LazyExpensesPage = lazy(() => import('@/pages/ExpensesPage'));
export const LazyTeacherDashboard = lazy(() => import('@/pages/TeacherDashboard'));
export const LazyStudentLoginPage = lazy(() => import('@/pages/StudentLoginPage'));
export const LazyStudentDashboard = lazy(() => import('@/pages/StudentDashboard'));
export const LazyNotFound = lazy(() => import('@/pages/NotFound'));