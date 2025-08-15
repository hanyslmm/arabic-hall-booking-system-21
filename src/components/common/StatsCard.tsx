import React from 'react';
import { EnhancedCard } from './EnhancedCard';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
  className?: string;
}

/**
 * Modern statistics card with enhanced styling and optional trend indicator
 */
export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = 'text-primary',
  trend,
  loading = false,
  className
}: StatsCardProps) {
  return (
    <EnhancedCard 
      variant="elevated" 
      loading={loading}
      className={cn("group", className)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            {title}
          </CardTitle>
          {Icon && (
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors",
              iconColor
            )}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="text-2xl font-bold text-foreground">
            {loading ? (
              <div className="skeleton-animate h-8 w-20 rounded"></div>
            ) : (
              value
            )}
          </div>
          
          {description && !loading && (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
          
          {trend && !loading && (
            <div className="flex items-center gap-1">
              <span className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-success" : "text-destructive"
              )}>
                {trend.isPositive ? "+" : ""}{trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">
                من الشهر الماضي
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </EnhancedCard>
  );
}