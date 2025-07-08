
import { useState } from "react";
import { useTheme, Theme } from "@/hooks/useTheme";
  const { theme, setTheme } = useTheme();
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Calendar, Home, Users, Settings } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface NavbarProps {
  userRole?: 'owner' | 'manager' | 'space_manager';
  userName?: string;
}

export const Navbar = ({ userRole, userName }: NavbarProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
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

  const canManageBookings = userRole === 'owner' || userRole === 'manager';
  const isOwner = userRole === 'owner';

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <h1 className="text-xl font-bold text-primary">نادي العلوم</h1>
          <div className="hidden md:flex items-center space-x-4 space-x-reverse">
            <Button
              variant={location.pathname === "/" ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              الرئيسية
            </Button>
            {canManageBookings && (
              <Button
                variant={location.pathname === "/booking" ? "default" : "ghost"}
                size="sm"
                onClick={() => navigate("/booking")}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                حجز جديد
              </Button>
            )}
            {isOwner && (
              <Button
                variant={location.pathname === "/users" ? "default" : "ghost"}
                size="sm"
                onClick={() => navigate("/users")}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                إدارة المستخدمين
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4 space-x-reverse">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {userName ? userName.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-background border shadow-lg" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  {userName && (
                    <p className="font-medium">{userName}</p>
                  )}
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    {userRole === 'owner' ? 'مالك النظام' : 
                     userRole === 'manager' ? 'مدير' : 
                     'مدير قاعات'}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/")} className="cursor-pointer">
                <Home className="mr-2 h-4 w-4" />
                <span>الرئيسية</span>
              </DropdownMenuItem>
              {canManageBookings && (
                <DropdownMenuItem onClick={() => navigate("/booking")} className="cursor-pointer">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>حجز جديد</span>
                </DropdownMenuItem>
              )}
              {isOwner && (
                <DropdownMenuItem onClick={() => navigate("/users")} className="cursor-pointer">
                  <Users className="mr-2 h-4 w-4" />
                  <span>إدارة المستخدمين</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                disabled={isLoading}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{isLoading ? "جاري تسجيل الخروج..." : "تسجيل الخروج"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};
