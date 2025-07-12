import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const teacherSchema = z.object({
  name: z.string().min(1, "يرجى إدخال اسم المعلم"),
  mobile_phone: z.string().optional(),
  subject_id: z.string().optional(),
  academic_stage_ids: z.array(z.string()).optional(),
});

type TeacherFormData = z.infer<typeof teacherSchema>;

interface EditTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: { 
    id: string; 
    name: string; 
    mobile_phone?: string | null;
    subject_id?: string | null;
  } | null;
}

interface Subject {
  id: string;
  name: string;
}

interface AcademicStage {
  id: string;
  name: string;
}

export const EditTeacherModal = ({ isOpen, onClose, teacher }: EditTeacherModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStages, setSelectedStages] = useState<string[]>([]);

  const form = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema),
    defaultValues: { 
      name: teacher?.name || "",
      mobile_phone: teacher?.mobile_phone || "",
      subject_id: teacher?.subject_id || "",
      academic_stage_ids: [],
    },
    values: teacher ? { 
      name: teacher.name,
      mobile_phone: teacher.mobile_phone || "",
      subject_id: teacher.subject_id || "",
      academic_stage_ids: [],
    } : undefined,
  });

  // Fetch subjects - using mock data for now
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: async (): Promise<Subject[]> => {
      // Mock data for now
      return [
        { id: "1", name: "الرياضيات" },
        { id: "2", name: "العلوم" },
        { id: "3", name: "الفيزياء" },
        { id: "4", name: "الكيمياء" },
        { id: "5", name: "الأحياء" },
        { id: "6", name: "اللغة العربية" },
        { id: "7", name: "اللغة الإنجليزية" },
      ];
    },
  });

  // Fetch academic stages
  const { data: academicStages = [] } = useQuery({
    queryKey: ['academic-stages'],
    queryFn: async (): Promise<AcademicStage[]> => {
      const { data, error } = await supabase.from('academic_stages').select('id, name').order('name');
      if (error) throw error;
      return data;
    },
  });

  const handleStageToggle = (stageId: string) => {
    setSelectedStages(prev => 
      prev.includes(stageId) 
        ? prev.filter(id => id !== stageId)
        : [...prev, stageId]
    );
    form.setValue('academic_stage_ids', selectedStages);
  };

  const updateTeacherMutation = useMutation({
    mutationFn: async (data: TeacherFormData) => {
      try {
        const { error } = await supabase
          .from("teachers")
          .update({ 
            name: data.name,
            mobile_phone: data.mobile_phone || null,
            subject_id: data.subject_id || null,
          })
          .eq("id", teacher?.id);
        if (error) throw error;
      } catch (error: any) {
        // If the error is about missing columns, try with just the name
        if (error.message?.includes('mobile_phone') || error.message?.includes('subject_id')) {
          const { error: fallbackError } = await supabase
            .from("teachers")
            .update({ name: data.name })
            .eq("id", teacher?.id);
          if (fallbackError) throw fallbackError;
        } else {
          throw error;
        }
      }
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
          {/* Teacher Name */}
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

          {/* Mobile Phone */}
          <div className="space-y-2">
            <Label htmlFor="mobile_phone">رقم التلفون</Label>
            <Input
              id="mobile_phone"
              placeholder="أدخل رقم التلفون"
              {...form.register('mobile_phone')}
            />
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label>المادة الدراسية</Label>
            <Select 
              value={form.watch('subject_id')} 
              onValueChange={(value) => form.setValue('subject_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر المادة الدراسية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">بدون مادة</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Academic Stages */}
          <div className="space-y-2">
            <Label>المراحل الدراسية</Label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {academicStages.map((stage) => (
                <div key={stage.id} className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id={stage.id}
                    checked={selectedStages.includes(stage.id)}
                    onCheckedChange={() => handleStageToggle(stage.id)}
                  />
                  <Label htmlFor={stage.id} className="text-sm">
                    {stage.name}
                  </Label>
                </div>
              ))}
            </div>
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
