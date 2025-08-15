import React from 'react';
import { Card, CardProps, cardVariants } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EnhancedCardProps extends CardProps {
  variant?: 'default' | 'elevated' | 'hero' | 'glass' | 'gradient' | 'interactive';
  loading?: boolean;
  children: React.ReactNode;
}

/**
 * Enhanced Card component with modern styling and loading states
 */
export function EnhancedCard({ 
  variant = 'default', 
  loading = false, 
  className,
  children,
  ...props 
}: EnhancedCardProps) {
  if (loading) {
    return (
      <Card 
        variant="elevated" 
        className={cn("animate-pulse", className)}
        {...props}
      >
        <div className="p-6 space-y-4">
          <div className="skeleton-animate h-6 w-3/4 rounded"></div>
          <div className="skeleton-animate h-4 w-1/2 rounded"></div>
          <div className="skeleton-animate h-4 w-2/3 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      variant={variant}
      className={cn(
        // Enhanced styling for better visual hierarchy
        "transition-all duration-300 ease-out",
        // Interactive states
        variant === 'interactive' && "hover:shadow-lg hover:-translate-y-1 cursor-pointer",
        // Better mobile experience
        "touch-manipulation",
        className
      )}
      {...props}
    >
      {children}
    </Card>
  );
}