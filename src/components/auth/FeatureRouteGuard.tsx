import React from 'react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { ComingSoonPage } from '@/components/common/ComingSoonPage';

interface FeatureRouteGuardProps {
  children: React.ReactNode;
  feature: string;
  featureName: string;
  description?: string;
  estimatedTime?: string;
}

export function FeatureRouteGuard({ 
  children, 
  feature, 
  featureName, 
  description,
  estimatedTime 
}: FeatureRouteGuardProps) {
  const featureAccess = useFeatureAccess();
  
  // Check if this feature should show coming soon page
  if (featureAccess.shouldShowComingSoon(feature)) {
    return (
      <ComingSoonPage 
        featureName={featureName}
        description={description}
        estimatedTime={estimatedTime}
      />
    );
  }
  
  // Show the actual feature
  return <>{children}</>;
}

export default FeatureRouteGuard;
