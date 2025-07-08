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

const teacherSchema = z.object({
  name: z.string().min(1, "يرجى إدخال اسم المعلم"),
});

type TeacherFormData = z.infer<typeof teacherSchema>;

interface EditTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: { id: string; name: string } | null;
}

export const EditTeacherModal = ({ isOpen, onClose, teacher }: EditTeacherModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema),
    defaultValues: { name: teacher?.name || "" },
    values: teacher ? { name: teacher.name } : undefined,
  });

  const updateTeacherMutation = useMutation({
    mutationFn: async (data: TeacherFormData) => {
      const { error } = await supabase
        .from("teachers")
        .update({ name: data.name })
        .eq("id", teacher?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "تم تحديث المعلم بنجاح",
        description: "تم حفظ التعديلات في النظام",
      });
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تحديث المعلم",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TeacherFormData) => {
    updateTeacherMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-center">تعديل بيانات المعلم</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم المعلم</Label>
            <Input
              id="name"
              placeholder="أدخل اسم المعلم"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={updateTeacherMutation.isPending}
            >
              {updateTeacherMutation.isPending ? "جاري الحفظ..." : "حفظ"}
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
