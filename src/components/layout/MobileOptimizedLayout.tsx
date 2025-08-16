import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveLayout } from './ResponsiveLayout';
import { UnifiedLayout } from './UnifiedLayout';

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
}

export function MobileOptimizedLayout({ children }: MobileOptimizedLayoutProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <ResponsiveLayout>{children}</ResponsiveLayout>;
  }

  return <UnifiedLayout>{children}</UnifiedLayout>;
}