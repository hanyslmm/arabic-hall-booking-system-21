import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Try admin authentication first for admin and sc_manager
      if (username === 'admin' || username === 'sc_manager') {
        try {
          const adminEmail = username === 'admin' ? 'admin@system.local' : 'sc_manager@system.local';
          const { data: adminData, error: adminError } = await supabase.rpc('authenticate_admin', {
            p_username: username,
            p_password: password
          });
          
          if (adminError) throw adminError;
          
          if (adminData && adminData.length > 0) {
            // Create a session for admin user
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email: adminEmail,
              password: 'Voda@123'
            });
            
            if (!signInError) {
              toast({
                title: "تم تسجيل الدخول",
                description: username === 'admin' ? "مرحبًا بك أيها المدير!" : "مرحبًا بك مدير نادي العلوم!"
              });
              window.location.href = "/";
              setLoading(false);
              return;
            }
          }
        } catch (error) {
          console.error('Admin auth error:', error);
        }
      }

      // Check if input is an email or username
      let loginEmail = username;
      
      // If it doesn't contain @, it's likely a username, so we need to find the corresponding email
      if (!username.includes('@')) {
        // First try to find the user by username in profiles
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('full_name', username)
          .single();
        
        if (!profileError && profileData?.email) {
          loginEmail = profileData.email;
        } else {
          // If no profile found with username, try the generated email format
          loginEmail = `${username}@local.app`;
        }
      }

      // Regular user authentication
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password
      });

      if (error) {
        // If login failed and we used generated email, try with original input as email
        if (loginEmail.endsWith('@local.app') && loginEmail !== username) {
          const { error: retryError } = await supabase.auth.signInWithPassword({
            email: username,
            password
          });
          
          if (retryError) {
            throw retryError;
          }
        } else {
          throw error;
        }
      }

      toast({
        title: "تم تسجيل الدخول",
        description: "مرحبًا بك!"
      });
      window.location.href = "/";

    } catch (error: any) {
      toast({
        title: "فشل تسجيل الدخول",
        description: error.message || "خطأ في تسجيل الدخول",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Input 
                type="text" 
                placeholder="اسم المستخدم أو البريد الإلكتروني" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                required 
                autoFocus 
              />
            </div>
            <div>
              <Input 
                type="password" 
                placeholder="كلمة المرور" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
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