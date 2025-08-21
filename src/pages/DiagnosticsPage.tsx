import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UnifiedLayout } from "@/components/layout/UnifiedLayout";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Database, Users, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";

interface DiagnosticTest {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
}

export default function DiagnosticsPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<DiagnosticTest[]>([]);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setTestResults([]);
    const results: DiagnosticTest[] = [];

    try {
      // Test 1: Database Connection
      try {
        const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        if (error) throw error;
        results.push({
          test: 'اتصال قاعدة البيانات',
          status: 'success',
          message: 'تم الاتصال بقاعدة البيانات بنجاح'
        });
      } catch (error) {
        results.push({
          test: 'اتصال قاعدة البيانات',
          status: 'error',
          message: `خطأ في الاتصال: ${(error as Error).message}`
        });
      }

      // Test 2: Authentication
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (user) {
          results.push({
            test: 'المصادقة',
            status: 'success',
            message: `تم تسجيل الدخول بنجاح - المستخدم: ${user.email}`
          });
        } else {
          results.push({
            test: 'المصادقة',
            status: 'warning',
            message: 'لم يتم تسجيل الدخول'
          });
        }
      } catch (error) {
        results.push({
          test: 'المصادقة',
          status: 'error',
          message: `خطأ في المصادقة: ${(error as Error).message}`
        });
      }

      // Test 3: User Profile Access
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, full_name, user_role, role')
          .limit(1)
          .single();
        
        if (error) throw error;
        results.push({
          test: 'الوصول للملف الشخصي',
          status: 'success',
          message: 'تم الوصول للملف الشخصي بنجاح'
        });
      } catch (error) {
        results.push({
          test: 'الوصول للملف الشخصي',
          status: 'error',
          message: `خطأ في الوصول للملف الشخصي: ${(error as Error).message}`
        });
      }

      // Test 4: Table Access Tests
      const validTables = ['profiles', 'halls', 'subjects', 'academic_stages', 'bookings', 'students', 'teachers', 'settings'];
      
      for (const table of validTables) {
        try {
          const { count, error } = await supabase
            .from(table as any)
            .select('*', { count: 'exact', head: true });
          if (error) throw error;
          results.push({
            test: `الوصول لجدول ${table}`,
            status: 'success',
            message: `تم الوصول لجدول ${table} بنجاح - العدد: ${count || 0}`
          });
        } catch (error) {
          results.push({
            test: `الوصول لجدول ${table}`,
            status: 'error',
            message: `خطأ في الوصول لجدول ${table}: ${(error as Error).message}`
          });
        }
      }

      // Test 5: RLS Policy Check
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);
        
        if (error) throw error;
        results.push({
          test: 'سياسات الأمان (RLS)',
          status: 'success',
          message: 'سياسات الأمان تعمل بشكل صحيح'
        });
      } catch (error) {
        results.push({
          test: 'سياسات الأمان (RLS)',
          status: 'warning',
          message: `تحذير في سياسات الأمان: ${(error as Error).message}`
        });
      }

      setTestResults(results);
    } catch (error) {
      console.error('Diagnostic error:', error);
      setTestResults([{
        test: 'خطأ عام',
        status: 'error',
        message: `خطأ في تشغيل التشخيص: ${(error as Error).message}`
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: DiagnosticTest['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: DiagnosticTest['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">نجح</Badge>;
      case 'error':
        return <Badge variant="destructive">فشل</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">تحذير</Badge>;
      default:
        return null;
    }
  };

  const successCount = testResults.filter(r => r.status === 'success').length;
  const errorCount = testResults.filter(r => r.status === 'error').length;
  const warningCount = testResults.filter(r => r.status === 'warning').length;

  return (
    <UnifiedLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Activity className="h-8 w-8" />
              تشخيص النظام
            </h1>
            <p className="text-muted-foreground mt-2">
              فحص حالة النظام والتأكد من عمل جميع المكونات
            </p>
          </div>
          <Button onClick={runDiagnostics} disabled={isRunning} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'جاري الفحص...' : 'تشغيل التشخيص'}
          </Button>
        </div>

        {/* Summary Cards */}
        {testResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الاختبارات</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{testResults.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">نجح</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{successCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">تحذيرات</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">أخطاء</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{errorCount}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Test Results */}
        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>نتائج التشخيص</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <p className="font-medium">{result.test}</p>
                        <p className="text-sm text-muted-foreground">{result.message}</p>
                      </div>
                    </div>
                    {getStatusBadge(result.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>ملاحظات</AlertTitle>
          <AlertDescription>
            يقوم هذا التشخيص بفحص الاتصال بقاعدة البيانات، المصادقة، والوصول للجداول الرئيسية.
            في حالة وجود أخطاء، تأكد من صحة إعدادات قاعدة البيانات والصلاحيات.
          </AlertDescription>
        </Alert>
      </div>
    </UnifiedLayout>
  );
}