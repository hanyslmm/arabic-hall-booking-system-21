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

    return {
      isOwner: isAdmin, // Admin is the owner
      isAdmin,
      isManager: isManager || isAdmin, // Admin has manager privileges
      canManageBookings: isAdmin || isManager, // Admins and managers can manage bookings
      canManageData: isAdmin || isManager, // Admins and managers can manage data  
      canManageUsers: isAdmin // Only admin can manage users
    };
  }, [profile]);
};