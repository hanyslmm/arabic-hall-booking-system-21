import { Tables } from "@/integrations/supabase/types";

// Base types from database
export type Hall = Tables<"halls">;
export type Teacher = Tables<"teachers">;
export type Subject = Tables<"subjects">;
export type TeacherSubject = Tables<"teacher_subjects">;
export type AcademicStage = Tables<"academic_stages">;
export type Student = Tables<"students">;
export type StudentRegistration = Tables<"student_registrations">;
export type PaymentRecord = Tables<"payment_records">;
export type Booking = Tables<"bookings"> & {
  halls?: { name: string };
  teachers?: { name: string };
  academic_stages?: { name: string };
};
export type UserProfile = Tables<"profiles">;
export type Settings = Tables<"settings">;
export type Notification = Tables<"notifications">;
export type AuditLog = Tables<"audit_logs">;
export type AttendanceRecord = Tables<"attendance_records">;
export type Transaction = Tables<"transactions">;

// UI state types
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

// Navigation types
export interface NavigationItem {
  title: string;
  url: string;
  icon: any;
  description?: string;
}

export interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

// Form types
export interface TeacherFormData {
  name: string;
  mobile_phone?: string;
  subject_id?: string;
}

export interface HallFormData {
  name: string;
  capacity: number;
}

export interface BookingFormData {
  teacher_id: string;
  academic_stage_id: string;
  hall_id: string;
  number_of_students: number;
  start_time: string;
  start_date: string;
  end_date?: string;
  days_of_week: string[];
}

// Auth types
export interface AuthUser {
  id: string;
  email?: string;
}

export interface AuthPermissions {
  isOwner: boolean;
  isAdmin: boolean;
  isManager: boolean;
  canManageBookings: boolean;
  canManageData: boolean;
  canManageUsers: boolean;
}