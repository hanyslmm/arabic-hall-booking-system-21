import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UnifiedLayout } from "@/components/layout/UnifiedLayout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

export function SettingsPage() {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [duration, setDuration] = useState("");
  const [workingHoursStart, setWorkingHoursStart] = useState("");
  const [workingHoursEnd, setWorkingHoursEnd] = useState("");
  const [workingDays, setWorkingDays] = useState("");

  // Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*');
      
      if (error) throw error;
      return data as Array<{ key: string; value: string }>;
    },
    enabled: !!user,
  });

  // Update setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from('settings')
        .update({ value })
        .eq('key', key);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "إعدادات محدثة",
        description: "تم تحديث الإعدادات بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث الإعدادات",
        variant: "destructive",
      });
      console.error('Settings update error:', error);
    }
  });

  useEffect(() => {
    if (settings) {
      const durationSetting = settings.find(s => s.key === 'default_booking_duration_minutes');
      const startSetting = settings.find(s => s.key === 'default_hall_working_hours_start');
      const endSetting = settings.find(s => s.key === 'default_hall_working_hours_end');
      const daysSetting = settings.find(s => s.key === 'default_hall_working_days');
      
      if (durationSetting) setDuration(durationSetting.value || '60');
      if (startSetting) setWorkingHoursStart(startSetting.value || '08:00');
      if (endSetting) setWorkingHoursEnd(endSetting.value || '20:00');
      if (daysSetting) setWorkingDays(daysSetting.value || 'saturday,monday,wednesday');
    }
  }, [settings]);

  // Auth checks AFTER hooks
  if (loading) {
    return (
      <UnifiedLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">جاري التحميل...</div>
        </div>
      </UnifiedLayout>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (profile?.user_role !== 'owner' && profile?.user_role !== 'manager') {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!duration || isNaN(Number(duration)) || Number(duration) < 1) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال مدة صالحة بالدقائق",
        variant: "destructive",
      });
      return;
    }

    // Update multiple settings
    const updates = [
      { key: 'default_booking_duration_minutes', value: duration },
      { key: 'default_hall_working_hours_start', value: workingHoursStart },
      { key: 'default_hall_working_hours_end', value: workingHoursEnd },
      { key: 'default_hall_working_days', value: workingDays }
    ];

    Promise.all(
      updates.map(update => 
        supabase.from('settings').update({ value: update.value }).eq('key', update.key)
      )
    ).then(() => {
      toast({
        title: "إعدادات محدثة",
        description: "تم تحديث جميع الإعدادات بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }).catch(() => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث الإعدادات",
        variant: "destructive",
      });
    });
  };

  if (isLoading) {
    return (
      <UnifiedLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">جاري التحميل...</div>
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout>
      <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">إعدادات النظام</h1>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات الحجز</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">مدة الحجز الافتراضية (بالدقائق)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="60"
                      required
                      className="h-12 text-base md:h-10 md:text-sm touch-manipulation"
                    />
                    <p className="text-sm text-muted-foreground">
                      ستستخدم هذه المدة كوقت افتراضي عند إنشاء حجز جديد
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>أوقات العمل الافتراضية للقاعات</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">وقت البداية</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={workingHoursStart}
                        onChange={(e) => setWorkingHoursStart(e.target.value)}
                        required
                        className="h-12 text-base md:h-10 md:text-sm touch-manipulation"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="endTime">وقت النهاية</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={workingHoursEnd}
                        onChange={(e) => setWorkingHoursEnd(e.target.value)}
                        required
                        className="h-12 text-base md:h-10 md:text-sm touch-manipulation"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workingDays">أيام العمل</Label>
                    <select
                      id="workingDays"
                      value={workingDays}
                      onChange={(e) => setWorkingDays(e.target.value)}
                      className="w-full h-12 px-3 py-2 text-base border rounded-md md:h-10 md:text-sm touch-manipulation focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      required
                    >
                      <option value="saturday,monday,wednesday">السبت، الاثنين، الأربعاء</option>
                      <option value="sunday,tuesday,thursday">الأحد، الثلاثاء، الخميس</option>
                    </select>
                    <p className="text-sm text-muted-foreground">
                      ستُطبق هذه الأوقات على جميع القاعات الجديدة وحساب الفترات المتاحة
                    </p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={updateSettingMutation.isPending}
                    className="w-full h-12 text-base md:h-10 md:text-sm touch-manipulation"
                  >
                    {updateSettingMutation.isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
      </div>
    </UnifiedLayout>
  );
}