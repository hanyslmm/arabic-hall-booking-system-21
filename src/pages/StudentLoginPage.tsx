import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Navigate, useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, GraduationCap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function StudentLoginPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create student email format
      const email = `${username}@student.local`;
      
      console.log('Attempting login with:', { email, password: password.trim() });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: password.trim()
      });

      console.log('Login result:', { data, error });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      toast({ 
        title: "تم تسجيل الدخول", 
        description: "مرحباً بك في منطقة الطلاب!" 
      });
      navigate("/simple-student-dashboard", { replace: true });

    } catch (error: any) {
      console.error('Full login error:', error);
      toast({
        title: "فشل تسجيل الدخول",
        description: `خطأ: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // If already authenticated, check if it's a student
  if (user) {
    // If it's a student account, redirect to dashboard
    if (user.email?.includes("@student.local")) {
      return <Navigate to="/simple-student-dashboard" replace />;
    }
    // If it's an admin account, redirect to main dashboard
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader>
          <CardTitle className="text-3xl text-center font-bold text-primary flex items-center justify-center gap-2">
            <GraduationCap className="h-8 w-8" />
            دخول الطلاب
          </CardTitle>
          <p className="text-center text-muted-foreground mt-2 text-lg italic font-medium">
            منطقة الطلاب - Science Club
          </p>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              استخدم رقمك التسلسلي كاسم المستخدم ورقم هاتفك ككلمة المرور
            </AlertDescription>
          </Alert>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Input
                type="text"
                placeholder="الرقم التسلسلي"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoFocus
                dir="rtl"
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="كلمة المرور (رقم الهاتف)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                dir="rtl"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "جاري الدخول..." : "دخول"}
            </Button>
          </form>
          
        </CardContent>
      </Card>
    </div>
  );
}