import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

// Enhanced loading states for better UX
export function PageLoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="skeleton-animate w-12 h-12 rounded-full mx-auto mb-4"></div>
        <div className="skeleton-animate h-4 w-32 rounded mx-auto mb-2"></div>
        <div className="skeleton-animate h-3 w-24 rounded mx-auto"></div>
      </div>
    </div>
  );
}

export function CardLoadingSpinner() {
  return (
    <div className="space-y-3">
      <div className="skeleton-animate h-6 w-3/4 rounded"></div>
      <div className="skeleton-animate h-4 w-1/2 rounded"></div>
      <div className="skeleton-animate h-4 w-2/3 rounded"></div>
    </div>
  );
}