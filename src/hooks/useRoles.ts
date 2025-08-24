import { useMemo } from "react";
import { UserProfile } from "@/types";

/**
 * Centralized role checking utilities
 * This ensures consistent role validation across the application
 */

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager', 
  TEACHER: 'teacher',
  USER: 'user',
  SPACE_MANAGER: 'space_manager'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const useRoles = (profile: UserProfile | null) => {
  return useMemo(() => {
    const role = profile?.role;
    
    const isAdmin = role === USER_ROLES.ADMIN;
    const isManager = role === USER_ROLES.MANAGER;
    const isTeacher = role === USER_ROLES.TEACHER;
    const isSpaceManager = role === USER_ROLES.SPACE_MANAGER;
    
    // Permission checks
    const canViewFinance = isAdmin || isManager;
    const canManageUsers = isAdmin;
    const canManageBookings = isAdmin || isManager || isSpaceManager;
    const canManageHalls = isAdmin || isManager || isSpaceManager;
    const canViewReports = isAdmin || isManager;
    const canManageExpenses = isAdmin;
    const canViewAuditLogs = isAdmin;
    
    return {
      role,
      isAdmin,
      isManager,
      isTeacher,
      isSpaceManager,
      canViewFinance,
      canManageUsers,
      canManageBookings,
      canManageHalls,
      canViewReports,
      canManageExpenses,
      canViewAuditLogs,
      hasAdminAccess: isAdmin,
      hasManagerAccess: isAdmin || isManager,
      hasFullAccess: !isTeacher
    };
  }, [profile]);
};