  import { FormModal } from "@/components/ui/FormModal";
import { addTeacher } from "@/api/teachers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const teacherSchema = z.object({
  name: z.string().min(1, "يرجى إدخال اسم المعلم"),
});

type TeacherFormData = z.infer<typeof teacherSchema>;

interface AddTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTeacherModal = ({ isOpen, onClose }: AddTeacherModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createTeacherMutation = useMutation({
    mutationFn: async (data: TeacherFormData) => {
      return await addTeacher({ name: data.name });
    },
    onSuccess: () => {
      toast({
        title: "تم إضافة المعلم بنجاح",
        description: "تم حفظ المعلم في النظام",
      });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "خطأ في إضافة المعلم",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    },
  });

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="إضافة معلم جديد"
      schema={teacherSchema}
      onSubmit={(data) => createTeacherMutation.mutate(data)}
      isSubmitting={createTeacherMutation.isPending}
      submitLabel={createTeacherMutation.isPending ? "جاري الحفظ..." : "حفظ"}
      fields={({ register, errors }) => (
        <div className="space-y-2">
          <Label htmlFor="name">اسم المعلم</Label>
          <Input
            id="name"
            placeholder="أدخل اسم المعلم"
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
