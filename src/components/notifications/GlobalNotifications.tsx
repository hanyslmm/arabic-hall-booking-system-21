import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface NotificationEvent {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function GlobalNotifications() {
  const { toast } = useToast();

  useEffect(() => {
    // Listen for global notification events
    const handleShowToast = (event: CustomEvent<NotificationEvent>) => {
      toast({
        title: event.detail.title,
        description: event.detail.description,
        variant: event.detail.variant || "default",
      });
    };

    window.addEventListener('showToast', handleShowToast as EventListener);
    
    return () => {
      window.removeEventListener('showToast', handleShowToast as EventListener);
    };
  }, [toast]);

  return null; // This component only handles events, no UI
}

// Helper function to trigger global notifications
export const showGlobalNotification = (notification: NotificationEvent) => {
  const event = new CustomEvent('showToast', {
    detail: notification
  });
  window.dispatchEvent(event);
};

// Pre-defined notification types
export const notifications = {
  success: (message: string) => showGlobalNotification({
    title: "نجح العملية",
    description: message,
    variant: "default"
  }),
  
  error: (message: string) => showGlobalNotification({
    title: "فشل العملية", 
    description: message,
    variant: "destructive"
  }),
  
  info: (title: string, message?: string) => showGlobalNotification({
    title,
    description: message,
    variant: "default"
  }),
  
  created: (itemType: string) => showGlobalNotification({
    title: "تم الإنشاء",
    description: `تم إنشاء ${itemType} بنجاح`,
    variant: "default"
  }),
  
  updated: (itemType: string) => showGlobalNotification({
    title: "تم التحديث",
    description: `تم تحديث ${itemType} بنجاح`,
    variant: "default"
  }),
  
  deleted: (itemType: string) => showGlobalNotification({
    title: "تم الحذف",
    description: `تم حذف ${itemType} بنجاح`,
    variant: "default"
  }),
};