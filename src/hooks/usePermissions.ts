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

    const userRole = profile.user_role;
    const appRole = (profile as any).role as string | undefined;

    const isOwner = userRole === USER_ROLES.OWNER || appRole === 'ADMIN';
    const isManager = userRole === USER_ROLES.MANAGER;
    const isSpaceManager = userRole === 'space_manager';
    const isAdmin = isOwner; // Only owner has full admin privileges, manager is limited

    return {
      isOwner,
      isAdmin,
      isManager: isManager || isOwner, // Manager includes owner
      canManageBookings: isAdmin || isManager || isSpaceManager, // All roles can manage bookings
      canManageData: isAdmin || isManager || isSpaceManager, // All roles can manage data  
      canManageUsers: isOwner // Only owner can manage users (not manager)
    };
  }, [profile]);
};