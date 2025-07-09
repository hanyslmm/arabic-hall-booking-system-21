import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({
        title: "فشل تسجيل الدخول",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم تسجيل الدخول",
        description: "مرحبًا بك!",
      });
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-100 to-gray-100 dark:from-orange-900 dark:to-gray-900">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader>
          <CardTitle className="text-3xl text-center font-bold text-primary">تسجيل الدخول</CardTitle>
          <p className="text-center text-muted-foreground mt-2 text-lg italic font-medium">Unlock your vision</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Input
                type="email"
                placeholder="البريد الإلكتروني"
                value={email}
                onChange={e => setEmail(e.target.value)}
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
