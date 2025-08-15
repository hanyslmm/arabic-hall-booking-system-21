import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UnifiedLayout } from './UnifiedLayout';

interface ModernLayoutProps {
  children: React.ReactNode;
}

/**
 * Modern layout wrapper that applies the unified layout with enhanced styling
 * for better responsive design and modern UI aesthetics.
 */
export function ModernLayout({ children }: ModernLayoutProps) {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="skeleton-animate w-16 h-16 rounded-full mx-auto"></div>
          <div className="skeleton-animate h-4 w-32 rounded mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <UnifiedLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        {children}
      </div>
    </UnifiedLayout>
  );
}