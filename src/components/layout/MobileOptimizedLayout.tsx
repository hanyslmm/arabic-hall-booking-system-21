import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveLayout } from './ResponsiveLayout';
import { AutoHideSidebar } from './AutoHideSidebar';
import { useAuth } from "@/hooks/useAuth";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { Home, Calendar, Users, Building2, GraduationCap, BookOpen, Settings, Shield, FileText, UserPlus } from "lucide-react";

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
}

export function MobileOptimizedLayout({ children }: MobileOptimizedLayoutProps) {
  const isMobile = useIsMobile();
  const { profile, isAdmin, isOwner, canManageUsers } = useAuth();
  const featureAccess = useFeatureAccess();
  
  const userRole = profile?.role;
  const isOwnerOrAdmin = isAdmin || isOwner || canManageUsers;
  const isTeacher = userRole === 'user';

  // Build navigation based on feature access control
  const navigation = [
    {
      title: "الإحصائيات",
      items: [
        { title: "لوحة التحكم", url: "/", icon: Home },
        // Show Daily Settlement for hall managers and higher
        ...(
          featureAccess.canAccessDailySettlement
            ? [{ title: "التقفيل اليومي", url: "/daily-settlement", icon: FileText }]
            : []
        ),
      ],
    },
    // Student Management - restricted for phase 1 target roles
    ...(
      featureAccess.canAccessStudentManagement
        ? [{
            title: "إدارة الطلاب",
            items: [
              { title: "الطلاب", url: "/students", icon: Users },
              { title: "تسجيل الطلاب", url: "/student-registrations", icon: UserPlus },
            ],
          }]
        : []
    ),
    // Bookings Management - always available
    {
      title: isTeacher ? "المجموعات" : "إدارة المجموعات",
      items: [
        {
          title: isTeacher ? "مراقبة المجموعات" : "جميع المجموعات",
          url: "/bookings",
          icon: Calendar
        },
        ...(
          isOwnerOrAdmin && !isTeacher
            ? [{ title: "حجز جديد", url: "/booking", icon: Calendar }]
            : []
        ),
      ] as any,
    },
    // Resource Management - Hall Management always available, others restricted
    ...(
      featureAccess.canAccessHallManagement
        ? [{
            title: "إدارة الموارد",
            items: [
              { title: "القاعات", url: "/halls", icon: Building2 },
              // Teacher Management - restricted for phase 1 target roles
              ...(
                featureAccess.canAccessTeacherManagement
                  ? [{ title: "المعلمين", url: "/teachers", icon: GraduationCap }]
                  : []
              ),
              // Subjects and Stages - restricted for phase 1 target roles
              ...(
                featureAccess.canAccessTeacherManagement
                  ? [
                      { title: "المواد الدراسية", url: "/subjects", icon: BookOpen },
                      { title: "المراحل التعليمية", url: "/stages", icon: GraduationCap },
                    ]
                  : []
              ),
            ],
          }]
        : []
    ),
    // Financial Reports - restricted for phase 1 target roles
    ...(
      featureAccess.canAccessFinancialReports
        ? [{
            title: "التقارير المالية",
            items: [
              { title: "التقارير", url: "/reports", icon: FileText },
              { title: "إدارة المصروفات", url: "/expenses", icon: FileText },
            ],
          }]
        : []
    ),
    // System Management - restricted for phase 1 target roles
    ...(
      featureAccess.canAccessSystemManagement
        ? [{
            title: "إدارة النظام",
            items: [
              { title: "المستخدمين", url: "/users", icon: Users },
              { title: "سجل التدقيق", url: "/audit-logs", icon: Shield },
              { title: "صلاحيات المدراء", url: "/admin-privileges", icon: Shield },
              { title: "الإعدادات", url: "/settings", icon: Settings },
            ],
          }]
        : []
    ),
  ];

  // Determine the appropriate title and subtitle based on role
  const appTitle = "Science Club";
  let appSubtitle = "لوحة التحكم";
  
  if (isOwner || userRole === 'owner') {
    appSubtitle = "لوحة التحكم الإدارية - مالك";
  } else if (isAdmin || userRole === 'manager') {
    appSubtitle = "لوحة التحكم الإدارية - مدير";
  } else if (userRole === 'teacher') {
    appSubtitle = "لوحة المعلم";
  } else if (userRole === 'space_manager') {
    appSubtitle = "لوحة مدير القاعات";
  }

  if (isMobile) {
    return <ResponsiveLayout>{children}</ResponsiveLayout>;
  }

  return (
    <AutoHideSidebar
      navigation={navigation}
      appTitle={appTitle}
      appSubtitle={appSubtitle}
    >
      {children}
    </AutoHideSidebar>
  );
}