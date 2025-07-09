import { FormModal } from "@/components/ui/FormModal";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addStage } from "@/api/stages";

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

  const createStageMutation = useMutation({
    mutationFn: async (data: StageFormData) => {
      return await addStage({ name: data.name });
    },
    onSuccess: () => {
      toast({
        title: "تم إضافة المرحلة بنجاح",
        description: "تم حفظ المرحلة الدراسية في النظام",
      });
      queryClient.invalidateQueries({ queryKey: ['academic-stages'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
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

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="إضافة مرحلة دراسية جديدة"
      schema={stageSchema}
      onSubmit={(data) => createStageMutation.mutate(data)}
      isSubmitting={createStageMutation.isPending}
      submitLabel={createStageMutation.isPending ? "جاري الحفظ..." : "حفظ"}
      fields={({ register, errors }) => (
        <div className="space-y-2">
          <Label htmlFor="name">اسم المرحلة</Label>
          <Input
            id="name"
            placeholder="أدخل اسم المرحلة الدراسية"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>
      )}
    />
  );
};
