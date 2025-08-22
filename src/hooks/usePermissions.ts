import { useMemo } from "react";
import { UserProfile, AuthPermissions } from "@/types";
import { USER_ROLES } from "@/lib/constants";

// Role-based fine-grained permissions (for reference/feature flags)
// Not currently used by hooks below, but kept for centralized permissions mapping
const rolePermissions = {
  admin: [
    'view:reports',
    'manage:halls',
    'manage:bookings',
    'manage:students',
    'create:registrations',
    'manage:payments',
  ],
} as const;

export const usePermissions = (profile: UserProfile | null): AuthPermissions => {
  return useMemo(() => {
    if (!profile) {
      return {
        isOwner: false,
        isAdmin: false,
        isManager: false,
        canManageBookings: false,
        canManageData: false,
        canManageUsers: false
      };
    }

    const role = profile.role;

    const isAdmin = role === 'admin';
    const isManager = role === 'manager';
    const isUser = role === 'user';

    // Simplified permission system: full access for all roles except teacher
    const isTeacher = role === 'teacher';
    const hasFullAccess = !isTeacher;

    return {
      isOwner: isAdmin, // Admin is the owner
      isAdmin,
      isManager: hasFullAccess, // All non-teacher roles have manager privileges
      canManageBookings: hasFullAccess, // All non-teacher roles can manage bookings
      canManageData: hasFullAccess, // All non-teacher roles can manage data  
      canManageUsers: hasFullAccess // All non-teacher roles can manage users
    };
  }, [profile]);
};