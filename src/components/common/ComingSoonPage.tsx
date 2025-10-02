import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Wrench, Zap } from 'lucide-react';

interface ComingSoonPageProps {
  featureName: string;
  description?: string;
  estimatedTime?: string;
  icon?: React.ReactNode;
}

export function ComingSoonPage({ 
  featureName, 
  description = "هذه الميزة قيد التطوير حالياً",
  estimatedTime = "قريباً",
  icon = <Wrench className="h-8 w-8" />
}: ComingSoonPageProps) {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        {/* Icon */}
        <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full">
          {icon}
        </div>

        {/* Main Content */}
        <Card className="w-full max-w-2xl text-center">
          <CardHeader>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Badge variant="secondary" className="text-sm">
                <Clock className="h-3 w-3 mr-1" />
                قيد التطوير
              </Badge>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {featureName}
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 dark:text-gray-400">
              {description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Status */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Zap className="h-4 w-4" />
              <span>متوقع الإطلاق: {estimatedTime}</span>
            </div>

            {/* Progress Indicator */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '65%' }}></div>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400">
              نعمل بجد لتقديم أفضل تجربة ممكنة
            </p>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            للمساعدة أو الاستفسارات، يرجى التواصل مع فريق الدعم
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
            <span>• تطوير تدريجي</span>
            <span>• اختبار شامل</span>
            <span>• جودة عالية</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComingSoonPage;
