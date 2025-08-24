import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  title?: string;
  message?: string;
}

export function ErrorFallback({ 
  error, 
  resetError, 
  title = "حدث خطأ غير متوقع",
  message = "عذراً، حدث خطأ في تحميل هذه الصفحة. يرجى المحاولة مرة أخرى."
}: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>
          
          {error && process.env.NODE_ENV === 'development' && (
            <details className="text-left text-sm bg-muted p-3 rounded-md">
              <summary className="cursor-pointer font-medium mb-2">تفاصيل الخطأ</summary>
              <pre className="whitespace-pre-wrap text-xs overflow-auto">
                {error.message}
              </pre>
            </details>
          )}
          
          {resetError && (
            <Button onClick={resetError} className="w-full">
              <RefreshCw className="h-4 w-4 ml-2" />
              المحاولة مرة أخرى
            </Button>
          )}
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => window.location.href = '/'}
          >
            العودة للصفحة الرئيسية
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}