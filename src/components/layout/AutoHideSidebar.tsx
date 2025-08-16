import React, { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';

interface AutoHideSidebarProps {
  children: React.ReactNode;
  navigation?: any[];
  appTitle?: string;
  appSubtitle?: string;
}

export function AutoHideSidebar({ 
  children, 
  navigation, 
  appTitle = "Science Club", 
  appSubtitle = "لوحة التحكم" 
}: AutoHideSidebarProps) {
  const [defaultOpen, setDefaultOpen] = useState(false);

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className="min-h-screen flex w-full">
        <AdminSidebar 
          navigation={navigation} 
          appTitle={appTitle} 
          appSubtitle={appSubtitle}
        >
          {children}
        </AdminSidebar>
      </div>
    </SidebarProvider>
  );
}