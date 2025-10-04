import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const teacherSchema = z.object({
  name: z.string().min(1, "يرجى إدخال اسم المعلم"),
  mobile_phone: z.string().optional(),
  subject_ids: z.array(z.string()).optional(),
  academic_stage_ids: z.array(z.string()).optional(),
  default_class_fee: z.coerce.number().optional(),
});

type TeacherFormData = z.infer<typeof teacherSchema>;

interface EditTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: { 
    id: string; 
    name: string; 
    mobile_phone?: string | null;
    subject_ids?: string[] | null;
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
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const form = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      name: teacher?.name || "",
      mobile_phone: teacher?.mobile_phone || "",
      subject_ids: teacher?.subject_ids || [],
      academic_stage_ids: [],
      default_class_fee: undefined,
    },
  });

  // Fetch subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: async (): Promise<Subject[]> => {
      const { getSubjects } = await import('@/api/subjects');
      return await getSubjects();
    },
  });

  // Fetch academic stages
  const { data: academicStages = [] } = useQuery({
    queryKey: ['academic-stages'],
    queryFn: async (): Promise<AcademicStage[]> => {
      try {
        const { data, error } = await supabase.from('academic_stages').select('id, name').order('name');
        if (error) throw error;
        return data;
      } catch (error) {
        console.warn("Academic stages table not found:", error);
        return [];
      }
    },
  });

  const updateTeacherMutation = useMutation({
    mutationFn: async (data: TeacherFormData) => {
      console.log('=== Starting teacher update ===');
      console.log('Teacher ID:', teacher?.id);
      console.log('Form data:', data);
      
      if (!teacher?.id) throw new Error("No teacher ID");
      const { updateTeacher, updateTeacherAcademicStages, setTeacherSubjects } = await import('@/api/teachers');
      
      // Prepare update data with proper handling of empty strings
      const updateData: any = {
        name: data.name,
      };
      
      // Only include mobile_phone if it has a value
      if (data.mobile_phone && data.mobile_phone.trim() !== '') {
        updateData.mobile_phone = data.mobile_phone.trim();
      }
      
      if (typeof (data as any).default_class_fee === 'number') {
        updateData.default_class_fee = (data as any).default_class_fee;
      }
      
      console.log('Update data prepared:', updateData);
      
      // Only call core update if there are actual core fields to update
      const hasCoreUpdates = Object.keys(updateData).length > 0;
      console.log('Has core updates:', hasCoreUpdates);
      
      const updatedTeacher = hasCoreUpdates
        ? await updateTeacher(teacher.id, updateData)
        : (teacher as any);
      
      console.log('Core teacher updated successfully');

      // Update subjects
      console.log('Updating subjects:', data.subject_ids);
      if (data.subject_ids) {
        await setTeacherSubjects(teacher.id, data.subject_ids);
        console.log('Subjects updated successfully');
      }

      // Update academic stages if feature/table exists and there are selections
      // ALWAYS soft-fail to avoid blocking the main teacher update
      if (Array.isArray(data.academic_stage_ids) && data.academic_stage_ids.length > 0) {
        console.log('Updating academic stages:', data.academic_stage_ids);
        try {
          await updateTeacherAcademicStages(teacher.id, data.academic_stage_ids);
          console.log('Academic stages updated successfully');
        } catch (err: any) {
          // Soft-fail on ANY error - don't block teacher update
          console.warn('Skipping academic stages update (non-fatal error):', err?.message || err);
        }
      }

      console.log('=== Teacher update completed successfully ===');
      return updatedTeacher;
    },
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم تحديث المعلم بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      onClose();
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorDetails = (error as any)?.details || (error as any)?.hint || '';
      const fullError = errorDetails ? `${errorMessage} - ${errorDetails}` : errorMessage;
      
      toast({
        title: "خطأ",
        description: fullError || "حدث خطأ أثناء تحديث المعلم",
        variant: "destructive",
      });
      console.error('Error updating teacher:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
    },
  });

  const toggleAcademicStage = (stageId: string) => {
    const updatedStages = selectedStages.includes(stageId)
      ? selectedStages.filter(id => id !== stageId)
      : [...selectedStages, stageId];
    
    setSelectedStages(updatedStages);
    form.setValue('academic_stage_ids', updatedStages);
  };

  const onSubmit = (data: TeacherFormData) => {
    updateTeacherMutation.mutate(data);
  };

  // Reset form when teacher changes - always fetch links from DB to avoid stale UI
  useEffect(() => {
    if (!teacher) return;

    form.reset({
      name: teacher.name,
      mobile_phone: teacher.mobile_phone || "",
      subject_ids: [],
      academic_stage_ids: [],
      default_class_fee: (teacher as any).default_class_fee ?? undefined,
    });
    setSelectedStages([]);
    setSelectedSubjects([]);

    (async () => {
      try {
        const { data, error } = await supabase
          .from('teacher_subjects')
          .select('subject_id')
          .eq('teacher_id', teacher.id);
        if (!error && Array.isArray(data)) {
          const ids = (data as Array<{ subject_id: string }>).map(r => r.subject_id);
          setSelectedSubjects(ids);
          form.setValue('subject_ids', ids);
        }
      } catch (e) {
        // ignore - best effort
      }
    })();
  }, [teacher, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تعديل المعلم</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">اسم المعلم</Label>
            <Input
              id="name"
              placeholder="أدخل اسم المعلم"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Mobile Phone Field */}
          <div className="space-y-2">
            <Label htmlFor="mobile_phone">رقم الجوال (اختياري)</Label>
            <Input
              id="mobile_phone"
              placeholder="أدخل رقم الجوال"
              {...form.register('mobile_phone')}
            />
          </div>

          {/* Subjects - multi select */}
          <div className="space-y-2">
            <Label>المواد الدراسية (يمكن اختيار أكثر من مادة)</Label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-2">
              {subjects.map((subject) => {
                const checked = selectedSubjects.includes(subject.id);
                return (
                  <label key={subject.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = new Set(selectedSubjects);
                        if (e.target.checked) next.add(subject.id); else next.delete(subject.id);
                        const arr = Array.from(next);
                        setSelectedSubjects(arr);
                        form.setValue('subject_ids', arr);
                      }}
                    />
                    {subject.name}
                  </label>
                );
              })}
            </div>
            {selectedSubjects.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {selectedSubjects.map((id) => {
                  const s = subjects.find((x) => x.id === id);
                  return <Badge key={id} variant="secondary">{s?.name}</Badge>;
                })}
              </div>
            )}
          </div>

          {/* Default class fee */}
          <div className="space-y-2">
            <Label htmlFor="default_class_fee">الرسوم الافتراضية للمعلم (اختياري)</Label>
            <Input
              id="default_class_fee"
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              placeholder="0"
              {...form.register('default_class_fee', { 
                setValueAs: (v) => {
                  if (typeof v !== 'string') return Number(v);
                  const toEnglish = (s: string) => s.replace(/[\u0660-\u0669]/g, (d)=> String(d.charCodeAt(0)-0x0660));
                  const normalized = toEnglish(v).replace(',', '.');
                  if (normalized.trim() === '') return undefined as unknown as number;
                  const num = Number(normalized);
                  return Number.isFinite(num) ? num : undefined as unknown as number;
                }
              })}
            />
          </div>

          {/* Academic Stages Field */}
          {academicStages.length > 0 && (
            <div className="space-y-2">
              <Label>المراحل الدراسية (اختياري)</Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                {academicStages.map((stage) => (
                  <div key={stage.id} className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id={`stage-${stage.id}`}
                      checked={selectedStages.includes(stage.id)}
                      onCheckedChange={() => toggleAcademicStage(stage.id)}
                    />
                    <Label htmlFor={`stage-${stage.id}`} className="text-sm">
                      {stage.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={updateTeacherMutation.isPending}
            >
              {updateTeacherMutation.isPending ? "جاري التحديث..." : "حفظ التغييرات"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
