import { useMemo } from 'react';
import { useAuth } from './useAuth';

/**
 * Feature access control for gradual rollout
 * Controls which features are available to which roles during development
 */
export const useFeatureAccess = () => {
  const { profile, isOwner } = useAuth();
  
  return useMemo(() => {
    const userRole = profile?.user_role;
    const isOwnerUser = isOwner || userRole === 'owner';
    const isManager = userRole === 'manager';
    const isSpaceManager = userRole === 'space_manager';
    const isTeacher = userRole === 'teacher';
    
    // Phase 1: Only Hall Management and Daily Settlement for space_manager and manager
    // Owner sees everything as before
    const isPhase1Target = isSpaceManager || isManager;
    
    return {
      // Core features - always available to target roles
      canAccessHallManagement: isOwnerUser || isPhase1Target,
      canAccessDailySettlement: isOwnerUser || isPhase1Target,
      
      // Restricted features - coming soon for target roles, full access for owner
      canAccessStudentManagement: isOwnerUser || !isPhase1Target,
      // Allow managers and space managers to manage teachers, subjects, and stages
      canAccessTeacherManagement: isOwnerUser || isManager || isSpaceManager || !isPhase1Target,
      canAccessSubjectsManagement: isOwnerUser || isManager || isSpaceManager || !isPhase1Target,
      canAccessStagesManagement: isOwnerUser || isManager || isSpaceManager || !isPhase1Target,
      canAccessFinancialReports: isOwnerUser || !isPhase1Target,
      canAccessSystemManagement: isOwnerUser || !isPhase1Target,
      canAccessUserManagement: isOwnerUser || !isPhase1Target,
      canAccessExpenseManagement: isOwnerUser || !isPhase1Target,
      canAccessAuditLogs: isOwnerUser || !isPhase1Target,
      canAccessSettings: isOwnerUser || !isPhase1Target,
      
      // Dashboard access
      canAccessFullDashboard: isOwnerUser || !isPhase1Target,
      canAccessLimitedDashboard: isPhase1Target,
      
      // Role info
      isOwnerUser,
      isManager,
      isSpaceManager,
      isTeacher,
      isPhase1Target,
      
      // Helper for showing coming soon pages
      shouldShowComingSoon: (feature: string) => {
        if (isOwnerUser) return false; // Owner sees everything
        
        // Features now available to managers and space managers
        const availableFeatures = ['teacher-management', 'subjects-management', 'stages-management'];
        if (availableFeatures.includes(feature) && (isManager || isSpaceManager)) {
          return false;
        }

        const restrictedFeatures = [
          'student-management',
          'financial-reports',
          'system-management',
          'user-management',
          'expense-management',
          'audit-logs',
          'settings'
        ];
        
        return isPhase1Target && restrictedFeatures.includes(feature);
      }
    };
  }, [profile, isOwner]);
};

export default useFeatureAccess;
