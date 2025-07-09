
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const stageSchema = z.object({
  name: z.string().min(1, "يرجى إدخال اسم المرحلة"),
});

type StageFormData = z.infer<typeof stageSchema>;

interface AddStageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddStageModal = ({ isOpen, onClose }: AddStageModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<StageFormData>({
    resolver: zodResolver(stageSchema),
    defaultValues: {
      name: "",
    },
  });

  const createStageMutation = useMutation({
    mutationFn: async (data: StageFormData) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('غير مصرح');

      const { data: result, error } = await supabase
        .from('academic_stages')
        .insert([{
          name: data.name,
          created_by: user.user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: "تم إضافة المرحلة بنجاح",
        description: "تم حفظ المرحلة الدراسية في النظام",
      });
      queryClient.invalidateQueries({ queryKey: ['academic-stages'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "خطأ في إضافة المرحلة",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: StageFormData) => {
    createStageMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-center">إضافة مرحلة دراسية جديدة</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم المرحلة</Label>
            <Input
              id="name"
              placeholder="أدخل اسم المرحلة الدراسية"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={createStageMutation.isPending}
            >
              {createStageMutation.isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
