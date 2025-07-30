import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, User, Calendar, Home, Users, Settings, Menu, X, Building2, GraduationCap, BookOpen, Shield } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/NotificationBell";
interface NavbarProps {
  userRole?: 'owner' | 'manager' | 'space_manager' | 'read_only';
  userName?: string;
  isAdmin?: boolean;
}
export const Navbar = ({
  userRole,
  userName,
  isAdmin
}: NavbarProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const handleSignOut = async () => {
    setIsLoading(true);
    const {
      error
    } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
    setIsLoading(false);
  };
  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'owner':
        return <Badge variant="destructive" className="text-xs">مالك</Badge>;
      case 'manager':
        return <Badge variant="secondary" className="text-xs">مدير</Badge>;
      case 'space_manager':
        return <Badge variant="outline" className="text-xs">مدير قاعات</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">مستخدم</Badge>;
    }
  };
  const canManageBookings = userRole === 'owner' || userRole === 'manager' || isAdmin;
  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'manager' || isAdmin;

  const navigation = [
    {
      title: "الإحصائيات",
      items: [
        { title: "لوحة التحكم", url: "/", icon: Home, description: "نظرة عامة على النظام" },
      ],
    },
    {
      title: "إدارة الحجوزات",
      items: [
        { title: "جميع الحجوزات", url: "/bookings", icon: Calendar, description: "عرض وإدارة الحجوزات" },
        { title: "حجز جديد", url: "/booking", icon: Calendar, description: "إنشاء حجز جديد" },
      ],
    },
    {
      title: "إدارة الطلاب",
      items: [
        { title: "الطلاب", url: "/students", icon: Users, description: "إدارة بيانات الطلاب" },
        { title: "تسجيل الطلاب", url: "/student-registrations", icon: Users, description: "تسجيل الطلاب الجدد" },
        { title: "إدارة المجموعة", url: "/bookings", icon: GraduationCap, description: "إدارة الحضور والدفعات" },
      ],
    },
    {
      title: "إدارة الموارد",
      items: [
        { title: "القاعات", url: "/halls", icon: Building2, description: "إدارة القاعات والمساحات" },
        { title: "المعلمين", url: "/teachers", icon: GraduationCap, description: "إدارة بيانات المعلمين" },
        { title: "المواد الدراسية", url: "/subjects", icon: BookOpen, description: "إدارة المواد الدراسية" },
        { title: "المراحل التعليمية", url: "/stages", icon: GraduationCap, description: "إدارة المراحل الدراسية" },
      ],
    },
    {
      title: "التقارير المالية",
      items: [
        { title: "التقارير", url: "/reports", icon: BookOpen, description: "عرض التقارير المالية" },
        { title: "تقارير المجموعات", url: "/class-financial-reports", icon: BookOpen, description: "التقارير المالية للمجموعات" },
      ],
    },
    {
      title: "إدارة النظام",
      items: [
        { title: "المستخدمين", url: "/users", icon: Users, description: "إدارة المستخدمين والأذونات" },
        { title: "سجل التدقيق", url: "/audit-logs", icon: Shield, description: "عرض سجل أنشطة المستخدمين" },
        { title: "صلاحيات المدراء", url: "/admin-privileges", icon: Settings, description: "إدارة صلاحيات المدراء" },
        { title: "الإعدادات", url: "/settings", icon: Settings, description: "إعدادات النظام العامة" },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black opacity-50"></div>
        </div>
      )}

      {/* Slide-out Navigation Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-72 transform bg-card border-l transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">نادي العلوم</span>
              <span className="truncate text-xs text-muted-foreground">نظام إدارة القاعات</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {navigation.map((group) => (
            <div key={group.title} className="mb-6">
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                {group.title}
              </h3>
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <button
                      key={item.title}
                      onClick={() => {
                        navigate(item.url);
                        setSidebarOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-right transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="border-t p-4">
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-muted">
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {userName || "مستخدم"}
              </span>
              <div className="flex items-center gap-1">
                {getRoleBadge(userRole)}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            disabled={isLoading}
            className="w-full flex items-center gap-2 text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            <span>{isLoading ? "جاري الخروج..." : "تسجيل الخروج"}</span>
          </Button>
        </div>
      </div>

      {/* Top Navigation Bar */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <h1 className="text-xl font-bold text-primary">Science Club</h1>
          </div>

          <div className="flex items-center space-x-4 space-x-reverse">
            <NotificationBell />
            {getRoleBadge(userRole)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 px-2">
                  {theme === "dark" ? "🌙" : theme === "light" ? "☀️" : "🖥️"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>☀️ وضع النهار</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>🌙 وضع الليل</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("auto")}>🖥️ تلقائي</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
              <span className="sr-only">فتح القائمة</span>
            </Button>
          </div>
        </div>
      </nav>
    </>
  );
};