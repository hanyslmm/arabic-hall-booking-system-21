import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Calendar,
  Users,
  Building2,
  GraduationCap,
  BookOpen,
  Settings,
  Menu,
  X,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigation } from "@/hooks/useNavigation";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavigationGroup {
  title: string;
  items: { title: string; url: string; icon: any; description?: string }[];
}

interface AdminSidebarProps {
  children: React.ReactNode;
  navigation?: NavigationGroup[];
  appTitle?: string;
  appSubtitle?: string;
}

const defaultNavigation: NavigationGroup[] = [
  {
    title: "الإحصائيات",
    items: [
      {
        title: "لوحة التحكم",
        url: "/",
        icon: Home,
        description: "نظرة عامة على النظام",
      },
    ],
  },
  {
    title: "إدارة المجموعات",
    items: [
      {
        title: "جميع المجموعات",
        url: "/bookings",
        icon: Calendar,
        description: "عرض وإدارة المجموعات الدراسية",
      },
      {
        title: "حجز جديد",
        url: "/booking",
        icon: Calendar,
        description: "إنشاء حجز جديد",
      },
    ],
  },
  {
    title: "إدارة الطلاب",
    items: [
      {
        title: "الطلاب",
        url: "/students",
        icon: Users,
        description: "إدارة بيانات الطلاب",
      },
      {
        title: "تسجيل الطلاب",
        url: "/student-registrations",
        icon: Users,
        description: "تسجيل الطلاب الجدد",
      },
      {
        title: "إدارة المجموعة",
        url: "/bookings",
        icon: GraduationCap,
        description: "إدارة الحضور والدفعات",
      },
    ],
  },
  {
    title: "إدارة الموارد",
    items: [
      {
        title: "القاعات",
        url: "/halls",
        icon: Building2,
        description: "إدارة القاعات والمساحات",
      },
      {
        title: "المعلمين",
        url: "/teachers",
        icon: GraduationCap,
        description: "إدارة بيانات المعلمين",
      },
      {
        title: "المواد الدراسية",
        url: "/subjects",
        icon: BookOpen,
        description: "إدارة المواد الدراسية",
      },
      {
        title: "المراحل التعليمية",
        url: "/stages",
        icon: GraduationCap,
        description: "إدارة المراحل الدراسية",
      },
    ],
  },
  {
    title: "التقارير",
    items: [
      {
        title: "التقارير المالية",
        url: "/reports",
        icon: BookOpen,
        description: "عرض التقارير المالية",
      },
      {
        title: "ادارة المصروفات",
        url: "/expenses",
        icon: FileText,
        description: "إدارة وتتبع المصروفات",
      },
      {
        title: "المصروفات اليومية",
        url: "/daily-expenses",
        icon: FileText,
        description: "إضافة وعرض المصروفات اليومية",
      },
      {
        title: "التقفيل اليومي",
        url: "/daily-settlement",
        icon: FileText,
        description: "تسجيل الإيرادات والمصروفات اليومية",
      },
      {
        title: "السيولة الفعلية",
        url: "/actual-liquidity", 
        icon: FileText,
        description: "عرض تقارير السيولة والأرباح",
      },
    ],
  },
  {
    title: "إدارة النظام",
    items: [
      {
        title: "المستخدمين",
        url: "/users",
        icon: Users,
        description: "إدارة المستخدمين والأذونات",
      },
      {
        title: "سجل التدقيق",
        url: "/audit-logs",
        icon: Shield,
        description: "عرض سجل أنشطة المستخدمين",
      },
      {
        title: "صلاحيات المدراء",
        url: "/admin-privileges",
        icon: Settings,
        description: "إدارة صلاحيات المدراء",
      },
      {
        title: "الإعدادات",
        url: "/settings",
        icon: Settings,
        description: "إعدادات النظام العامة",
      },
    ],
  },
];

const LogoutButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
    setIsLoading(false);
    try {
      window.location.replace('/login');
    } catch (e) {
      window.location.href = '/login';
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSignOut}
      disabled={isLoading}
      className="w-full flex items-center gap-2 text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/10 h-9"
    >
      <LogOut className="h-4 w-4" />
      <span className="text-sm">{isLoading ? "جاري الخروج..." : "تسجيل الخروج"}</span>
    </Button>
  );
};

export function AdminSidebar({ children, navigation, appTitle, appSubtitle }: AdminSidebarProps) {
  const { sidebarOpen, openSidebar, closeSidebar } = useNavigation();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, isAdmin, isOwner, canManageUsers, canManageData } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const navGroups = navigation ?? defaultNavigation;

  // Preserve scroll position when navigating
  useEffect(() => {
    const scrollArea = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollArea) {
      const savedScrollPosition = sessionStorage.getItem('sidebar-scroll-position');
      if (savedScrollPosition) {
        scrollArea.scrollTop = parseInt(savedScrollPosition, 10);
      }
    }
  }, []);

  // Save scroll position when scrolling
  const handleScroll = (event: Event) => {
    const scrollTop = (event.target as HTMLElement)?.scrollTop;
    if (scrollTop !== undefined) {
      sessionStorage.setItem('sidebar-scroll-position', scrollTop.toString());
    }
  };

  useEffect(() => {
    const scrollArea = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollArea) {
      scrollArea.addEventListener('scroll', handleScroll);
      return () => scrollArea.removeEventListener('scroll', handleScroll);
    }
  }, [sidebarOpen]);


  // Generate breadcrumbs from current path
  const getBreadcrumbs = () => {
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);
    
    // Find the current page in navigation
    let currentPage = null;
    for (const group of navGroups) {
      const found = group.items.find(item => item.url === path);
      if (found) {
        currentPage = found;
        break;
      }
    }

    if (path === '/') {
      return [{ title: 'الرئيسية', url: '/' }];
    }

    const breadcrumbs = [{ title: 'الرئيسية', url: '/' }];
    
    if (currentPage) {
      breadcrumbs.push({ title: currentPage.title, url: currentPage.url });
    } else if (segments.length > 0) {
      // Handle dynamic routes like /class-management/:id
      const baseSegment = segments[0];
      for (const group of navGroups) {
        const found = group.items.find(item => item.url.includes(baseSegment));
        if (found) {
          breadcrumbs.push({ title: found.title, url: found.url });
          break;
        }
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "owner":
        return (
          <Badge variant="destructive" className="text-xs">
            مالك
          </Badge>
        );
      case "manager":
        return (
          <Badge variant="secondary" className="text-xs">
            مدير
          </Badge>
        );
      case "space_manager":
        return (
          <Badge variant="outline" className="text-xs">
            مدير قاعات
          </Badge>
        );
      case "read_only":
        return (
          <Badge variant="outline" className="text-xs">
            قراءة فقط
          </Badge>
        );
      case "teacher":
        return (
          <Badge variant="outline" className="text-xs">
            معلم
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            مستخدم
          </Badge>
        );
    }
  };


  // Sidebar content component (reusable for both mobile and desktop)
  const SidebarContent = ({ showHeader = true }: { showHeader?: boolean }) => (
    <div className="flex flex-col h-full bg-gradient-to-b from-card via-card/98 to-card/95">
      {/* Sidebar Header - Enhanced with better visual hierarchy */}
      {showHeader && (
        <div className="flex h-16 sm:h-18 items-center justify-between px-4 sm:px-5 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-primary-foreground shadow-lg shadow-primary/20">
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate font-bold text-base sm:text-lg bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                {appTitle ?? 'Science Club'}
              </span>
              <span className="truncate text-xs text-muted-foreground/80 hidden sm:block">
                {appSubtitle ?? 'لوحة التحكم الإدارية'}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={closeSidebar}
            className="h-9 w-9 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all duration-200 lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Sidebar Content with improved scrolling and spacing */}
      <ScrollArea 
        ref={scrollAreaRef}
        className={cn(
          "flex-1 px-3 sm:px-4 py-5",
          showHeader 
            ? "h-[calc(100vh-20rem)] sm:h-[calc(100vh-22rem)]" 
            : "h-[calc(100vh-16rem)] sm:h-[calc(100vh-18rem)]"
        )}
      >
        {navGroups.map((group, groupIndex) => (
          <div key={group.title} className={cn(
            "mb-7 pb-5",
            groupIndex < navGroups.length - 1 && "border-b border-border/30"
          )}>
            <h3 className="mb-3 text-xs sm:text-sm font-bold text-muted-foreground/70 px-3 uppercase tracking-wider">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items
                .filter((item) => {
                  // Show expenses pages for admin and manager roles
                  if (item.url === '/expenses' || item.url === '/daily-expenses') {
                    return isAdmin || canManageData;
                  }
                  // Show settlement pages for space managers and above
                  if (item.url === '/daily-settlement') {
                    return profile?.user_role === 'space_manager' || isAdmin || canManageUsers;
                  }
                  // Show liquidity page for owners and managers only
                  if (item.url === '/actual-liquidity') {
                    return isOwner || isAdmin || profile?.user_role === 'manager';
                  }
                  // Show audit logs for admin only
                  if (item.url === '/audit-logs') {
                    return isAdmin;
                  }
                  return true;
                })
                .map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <button
                    key={item.url}
                    onClick={() => {
                      navigate(item.url);
                      closeSidebar();
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary font-medium shadow-sm border border-primary/20"
                        : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-md" 
                        : "bg-muted/50"
                    )}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 text-right">
                      <div className="font-medium">{item.title}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground/70 mt-0.5">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </ScrollArea>

      {/* User Profile Section - Enhanced Bottom */}
      <div className="mt-auto border-t border-border/50 bg-gradient-to-t from-background/50 to-transparent">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
                  {profile?.full_name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-0.5">
                <p className="text-sm font-semibold leading-none">{profile?.full_name || "مستخدم"}</p>
                {getRoleBadge(profile?.role)}
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar - Always visible on large screens */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 lg:z-50 border-r bg-card" style={{ direction: 'rtl' }}>
        <SidebarContent showHeader={true} />
      </aside>

      {/* Mobile Sidebar - Using Sheet component for better mobile experience */}
      <Sheet open={sidebarOpen} onOpenChange={(open) => open ? openSidebar() : closeSidebar()}>
        <SheetContent side="right" className="w-[85%] max-w-sm p-0 overflow-hidden z-[100]" style={{ direction: 'rtl' }}>
          {/* Mobile Header inside sidebar */}
          <div className="flex h-14 items-center justify-between px-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark text-primary-foreground shadow-md">
                <Building2 className="h-4 w-4" />
              </div>
              <span className="font-bold text-sm bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                {appTitle ?? 'Science Club'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeSidebar}
              className="h-8 w-8 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <SidebarContent showHeader={false} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:mr-72">
        {/* Top Header - only show on desktop */}
        <header className="hidden lg:flex h-16 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-md px-6 sticky top-0 z-40">
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Navigation buttons for desktop */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.history.back()}
                  className="h-8 w-8 p-0"
                  title="رجوع"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.history.forward()}
                  className="h-8 w-8 p-0"
                  title="تقدم"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>

              {/* Breadcrumbs - show on desktop only */}
              <Breadcrumb className="flex">
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, index) => (
                    <div key={crumb.url} className="flex items-center gap-2">
                      {index > 0 && <BreadcrumbSeparator />}
                      <BreadcrumbItem>
                        {index === breadcrumbs.length - 1 ? (
                          <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink 
                            className="cursor-pointer hover:text-primary"
                            onClick={() => navigate(crumb.url)}
                          >
                            {crumb.title}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </div>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Mobile Header - only show on mobile */}
        <header className="flex lg:hidden h-14 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-md px-4 sticky top-0 z-40">
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Hamburger Menu Button - Only visible on mobile/tablet */}
              <Button
                variant="ghost"
                size="icon"
                onClick={openSidebar}
                className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200 group"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">فتح القائمة</span>
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Page Content with improved scrolling and space for mobile bottom bar */}
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>

    </div>
  );
}
