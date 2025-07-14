import { useMemo } from "react";
import { UserProfile, AuthPermissions } from "@/types";
import { USER_ROLES, APP_ROLES } from "@/lib/constants";

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

    const isOwner = profile.user_role === USER_ROLES.OWNER;
    const isAdmin = profile.role === APP_ROLES.ADMIN || isOwner;
    const isManager = profile.user_role === USER_ROLES.MANAGER || isOwner || isAdmin;

    return {
      isOwner,
      isAdmin,
      isManager,
      canManageBookings: isManager,
      canManageData: isManager,
      canManageUsers: isOwner || isAdmin
    };
  }, [profile]);
};