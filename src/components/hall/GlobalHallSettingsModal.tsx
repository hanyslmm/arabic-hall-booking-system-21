import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Clock } from "lucide-react";
import { toast } from "sonner";

interface HallOperatingHours {
  operating_start_time: string;
  operating_end_time: string;
}

export const GlobalHallSettingsModal = () => {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<HallOperatingHours>({
    operating_start_time: '08:00',
    operating_end_time: '22:00'
  });

  const queryClient = useQueryClient();

  const updateAllHallsMutation = useMutation({
    mutationFn: async (data: HallOperatingHours) => {
      const { error } = await supabase
        .from('halls')
        .update({
          operating_start_time: data.operating_start_time,
          operating_end_time: data.operating_end_time,
          updated_at: new Date().toISOString()
        } as any)
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all halls
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['halls'] });
      toast.success('تم تحديث أوقات التشغيل لجميع القاعات بنجاح');
      setOpen(false);
    },
    onError: (error) => {
      toast.error('حدث خطأ أثناء تحديث أوقات التشغيل');
      console.error('Error updating hall operating hours:', error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!settings.operating_start_time || !settings.operating_end_time) {
      toast.error('يرجى إدخال أوقات التشغيل');
      return;
    }

    if (settings.operating_start_time >= settings.operating_end_time) {
      toast.error('وقت البداية يجب أن يكون قبل وقت النهاية');
      return;
    }

    updateAllHallsMutation.mutate(settings);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings className="h-4 w-4" />
          إعدادات أوقات التشغيل العامة
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            تحديد أوقات التشغيل لجميع القاعات
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 text-right">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              ⚠️ سيتم تطبيق هذه الأوقات على جميع القاعات الموجودة في النظام
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_time">وقت بداية التشغيل</Label>
            <Input
              id="start_time"
              type="time"
              value={settings.operating_start_time}
              onChange={(e) => setSettings(prev => ({ ...prev, operating_start_time: e.target.value }))}
              disabled={updateAllHallsMutation.isPending}
              className="text-right"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_time">وقت نهاية التشغيل</Label>
            <Input
              id="end_time"
              type="time"
              value={settings.operating_end_time}
              onChange={(e) => setSettings(prev => ({ ...prev, operating_end_time: e.target.value }))}
              disabled={updateAllHallsMutation.isPending}
              className="text-right"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={updateAllHallsMutation.isPending}
              className="w-full sm:w-auto"
            >
              إلغاء
            </Button>
            <Button 
              type="submit" 
              disabled={updateAllHallsMutation.isPending}
              className="w-full sm:w-auto"
            >
              {updateAllHallsMutation.isPending ? 'جاري التحديث...' : 'تطبيق على جميع القاعات'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};