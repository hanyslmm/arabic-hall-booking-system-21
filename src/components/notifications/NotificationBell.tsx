import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export const NotificationBell = () => {
  // Simplified notification bell for the simplified schema
  // No notifications table exists, so we'll show an empty state
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 p-0 rounded-full"
        >
          <Bell className="h-4 w-4" />
          <span className="sr-only">الإشعارات</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">الإشعارات</h3>
          </div>
        </div>
        <div className="px-4 py-8 text-center">
          <div className="space-y-2">
            <Bell className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">لا توجد إشعارات جديدة</p>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};