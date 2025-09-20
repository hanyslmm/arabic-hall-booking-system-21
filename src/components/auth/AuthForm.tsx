import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export const AuthForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  // Function to convert username to email if needed
  const getEmailFromInput = (input: string): string => {
    // If input contains @ symbol, treat as email
    if (input.includes('@')) {
      return input;
    }
    
    // Map known usernames to their email addresses
    const usernameToEmailMap: { [key: string]: string } = {
      'admin': 'admin@system.local',
      'hend': 'hend@admin.com',
      'tasneem': 'tasneem@admin.com'
    };
    
    return usernameToEmailMap[input.toLowerCase()] || `${input}@admin.com`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const emailToUse = getEmailFromInput(emailOrUsername);
      
      const { error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });
      if (error) throw error;
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في Science Club"
      });
    } catch (error: any) {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary-glow/10 p-4">
      <Card className="w-full max-w-md card-elevated">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Science Club</CardTitle>
          <div className="mb-2 text-lg font-semibold text-green-700">welcome to Science School</div>
          <CardDescription>
            تسجيل الدخول إلى نظام حجز القاعات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emailOrUsername">البريد الإلكتروني أو اسم المستخدم</Label>
              <Input
                id="emailOrUsername"
                type="text"
                placeholder="admin أو example@domain.com"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              variant="hero"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              تسجيل الدخول
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};