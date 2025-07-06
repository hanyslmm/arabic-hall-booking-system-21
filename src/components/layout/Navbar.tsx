import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NavbarProps {
  userRole?: string;
  userName?: string;
}

export const Navbar = ({ userRole, userName }: NavbarProps) => {
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تسجيل الخروج",
        variant: "destructive"
      });
    } else {
      toast({
        title: "تم تسجيل الخروج",
        description: "نراك قريباً"
      });
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'المالك';
      case 'manager':
        return 'مدير';
      case 'space_manager':
        return 'مدير مساحة';
      default:
        return 'مستخدم';
    }
  };

  return (
    <nav className="border-b bg-card border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="text-2xl font-bold text-primary">نادي العلوم</div>
            <div className="text-sm text-muted-foreground">
              نظام إدارة حجز القاعات التعليمية
            </div>
          </div>
          
          <div className="flex items-center space-x-4 space-x-reverse">
            {userRole && (
              <div className="hidden md:flex items-center space-x-2 space-x-reverse">
                <span className="text-sm text-muted-foreground">الدور:</span>
                <span className="text-sm font-medium text-primary">
                  {getRoleLabel(userRole)}
                </span>
              </div>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {userName ? userName.charAt(0) : <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{userName || "مستخدم"}</p>
                  <p className="text-xs text-muted-foreground">
                    {getRoleLabel(userRole || "")}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="ml-2 h-4 w-4" />
                  الإعدادات
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="ml-2 h-4 w-4" />
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};