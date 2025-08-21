import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { UnifiedLayout } from "@/components/layout/UnifiedLayout";
import { useAuth } from "@/hooks/useAuth";

interface TestResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export default function DiagnosticsPage() {
  const { profile, user } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const testResults: TestResult[] = [];

    // Test database connection
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      if (error) throw error;
      testResults.push({
        test: 'الاتصال بقاعدة البيانات',
        status: 'success',
        message: 'تم الاتصال بقاعدة البيانات بنجاح'
      });
    } catch (error: any) {
      testResults.push({
        test: 'الاتصال بقاعدة البيانات',
        status: 'error',
        message: `فشل الاتصال بقاعدة البيانات: ${error.message}`
      });
    }

    // Test authentication
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (user) {
        testResults.push({
          test: 'تسجيل الدخول',
          status: 'success',
          message: 'تم تسجيل الدخول بنجاح',
          details: { userId: user.id, email: user.email }
        });
      } else {
        testResults.push({
          test: 'تسجيل الدخول',
          status: 'error',
          message: 'لم يتم تسجيل الدخول'
        });
      }
    } catch (error) {
      testResults.push({
        test: 'تسجيل الدخول',
        status: 'error',
        message: `خطأ في التحقق من تسجيل الدخول: ${error}`
      });
    }

    // Test profile access
    if (user) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          testResults.push({
            test: 'الوصول للملف الشخصي',
            status: 'error',
            message: `فشل في تحميل الملف الشخصي: ${error.message}`,
            details: { error: error.code, hint: error.hint }
          });
        } else {
          testResults.push({
            test: 'الوصول للملف الشخصي',
            status: 'success',
            message: `تم تحميل الملف الشخصي بنجاح`,
            details: { 
              userRole: data.role, // Fixed: use 'role' instead of 'user_role'
              fullName: data.full_name,
              username: (data as any).username
            }
          });
        }
      } catch (error) {
        testResults.push({
          test: 'الوصول للملف الشخصي',
          status: 'error',
          message: `خطأ في الوصول للملف الشخصي: ${error}`,
          details: { error }
        });
      }
    }

    // Test basic table access
    const tables = ['halls', 'subjects', 'academic_stages']; // Fixed: removed invalid table names
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('count').limit(1);
        if (error) throw error;
        testResults.push({
          test: `الوصول لجدول ${table}`,
          status: 'success',
          message: `تم الوصول لجدول ${table} بنجاح`
        });
      } catch (error: any) {
        testResults.push({
          test: `الوصول لجدول ${table}`,
          status: 'error',
          message: `فشل الوصول لجدول ${table}: ${error.message}`
        });
      }
    }

    setResults(testResults);
    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">نجح</Badge>;
      case 'error':
        return <Badge variant="destructive">فشل</Badge>;
      case 'warning':
        return <Badge variant="secondary">تحذير</Badge>;
      default:
        return null;
    }
  };

  return (
    <UnifiedLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">تشخيصات النظام</h1>
          <Button onClick={runDiagnostics} disabled={isRunning}>
            {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isRunning ? 'جاري التشخيص...' : 'تشغيل التشخيص'}
          </Button>
        </div>

        {/* System Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                معلومات المستخدم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>البريد الإلكتروني: {user?.email || 'غير متاح'}</div>
                <div>الاسم الكامل: {profile?.full_name || 'غير محدد'}</div>
                <div>معرف المستخدم: {user?.id ? user.id.substring(0, 8) + '...' : 'غير متاح'}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                الصلاحيات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>الدور: {profile?.role || 'غير محدد'}</div> {/* Fixed: use 'role' instead of 'user_role' */}
                <div>نوع المستخدم: {profile?.role === 'ADMIN' ? 'مدير' : 'مستخدم عادي'}</div> {/* Simplified based on actual schema */}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                معلومات النظام
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>إصدار النظام: 1.0.0</div>
                <div>آخر تحديث: {new Date().toLocaleDateString('ar')}</div>
                <div>وقت التشغيل: {new Date().toLocaleTimeString('ar')}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>نتائج التشخيص</CardTitle>
            <CardDescription>
              اختبارات للتحقق من سلامة النظام وقواعد البيانات
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  اضغط على "تشغيل التشخيص" لبدء فحص النظام
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <span className="font-medium">{result.test}</span>
                      </div>
                      {getStatusBadge(result.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{result.message}</p>
                    {result.details && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground">تفاصيل إضافية</summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </UnifiedLayout>
  );
}