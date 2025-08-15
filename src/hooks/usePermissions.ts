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
    
    // Only owner has full admin privileges, manager has same as space_manager
    const isAdmin = isOwner; // Only owner is admin now

    return {
      isOwner,
      isAdmin,
      isManager: isManager || isOwner, // Manager includes owner
      canManageBookings: isAdmin || isManager || isSpaceManager, // Managers can manage bookings like space managers
      canManageData: isAdmin || isManager || isSpaceManager, // Managers can manage data like space managers
      canManageUsers: isAdmin // Only owners can manage users now
    };
  }, [profile]);
};