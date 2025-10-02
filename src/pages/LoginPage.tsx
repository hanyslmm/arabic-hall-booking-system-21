import { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function LoginPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSupabaseConfigured) {
      toast({
        title: "Configuration Error",
        description: "The application is not properly configured. Please contact your administrator.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      const raw = username.trim();
      const pwd = password.trim();

      // Build a list of candidate emails to try for convenience
      let candidateEmails: string[] = [];
      if (raw.toLowerCase() === "admin") {
        // Prefer the canonical local admin first, then other known admin variants
        candidateEmails = [
          "admin@system.local",
          "admin@admin.com",
          "admin@example.com",
          "admin@local.app",
        ];
      } else if (raw.toLowerCase() === "hala") {
        // Try multiple formats for hala user
        candidateEmails = [
          "hala@admin.com",
          "hala@gmail.com",
          "hala@system.local",
          "hala@example.com",
        ];
      } else if (!raw.includes("@")) {
        // For other usernames, try multiple domains
        candidateEmails = [
          `${raw}@admin.com`,
          `${raw}@gmail.com`,
          `${raw}@system.local`,
        ];
      } else {
        candidateEmails = [raw];
      }

      console.log("Attempting login with username:", raw);
      console.log("Trying email candidates:", candidateEmails);
      
      let lastError: any = null;
      for (const email of candidateEmails) {
        console.log("Trying email:", email);
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: pwd,
        });
        if (!error) {
          console.log("✅ Login successful with:", email);
          lastError = null;
          break;
        }
        console.log("❌ Failed with:", email, error.message);
        lastError = error;
      }

      if (lastError) {
        throw lastError;
      }

      toast({ 
        title: "تم تسجيل الدخول", 
        description: "مرحبًا بك!" 
      });
      navigate("/", { replace: true });

    } catch (error: any) {
      toast({
        title: "فشل تسجيل الدخول",
        description: error?.message || "خطأ في تسجيل الدخول",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // If already authenticated, redirect away from login
  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-100 to-gray-100 dark:from-orange-900 dark:to-gray-900">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader>
          <CardTitle className="text-3xl text-center font-bold text-primary">
            تسجيل الدخول
            <br />
            Science Club
          </CardTitle>
          <p className="text-center text-muted-foreground mt-2 text-lg italic font-medium">
            Unlock your vision
          </p>
        </CardHeader>
        <CardContent>
          {!isSupabaseConfigured && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The application is not properly configured. Please ensure environment variables are set correctly.
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Input
                type="text"
                placeholder="اسم المستخدم أو البريد الإلكتروني"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoFocus
                disabled={!isSupabaseConfigured}
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="كلمة المرور"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={!isSupabaseConfigured}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !isSupabaseConfigured}>
              {loading ? "جاري الدخول..." : !isSupabaseConfigured ? "Configuration Required" : "دخول"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Button 
              variant="link" 
              onClick={() => navigate("/student-login")}
              className="text-sm text-muted-foreground"
            >
              دخول كطالب؟ اضغط هنا
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}