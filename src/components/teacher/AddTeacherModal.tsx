import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const teacherSchema = z.object({
  name: z.string().min(1, "يرجى إدخال اسم المعلم"),
  teacher_code: z.string().min(1, "يرجى إدخال رمز المعلم"),
  mobile_phone: z.string().optional(),
  subject_ids: z.array(z.string()).optional(),
  academic_stage_ids: z.array(z.string()).optional(),
});

type TeacherFormData = z.infer<typeof teacherSchema>;

interface AddTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Subject {
  id: string;
  name: string;
}

interface AcademicStage {
  id: string;
  name: string;
}

export const AddTeacherModal = ({ isOpen, onClose }: AddTeacherModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);

  const form = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      name: "",
      teacher_code: "",
      mobile_phone: "",
      subject_ids: [],
      academic_stage_ids: [],
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

  const createTeacherMutation = useMutation({
    mutationFn: async (data: TeacherFormData) => {
      const { addTeacher, addTeacherAcademicStages } = await import('@/api/teachers');
      const { setTeacherSubjects } = await import('@/api/teachers');
      
      // Prepare teacher data with proper handling of empty strings
      const teacherData: any = {
        name: data.name,
        teacher_code: data.teacher_code.toUpperCase(),
      };
      
      // Only include mobile_phone if it has a value
      if (data.mobile_phone && data.mobile_phone.trim() !== '') {
        teacherData.mobile_phone = data.mobile_phone.trim();
      }
      
      const teacher = await addTeacher(teacherData);

      // Save subjects via junction table
      if (teacher && data.subject_ids && data.subject_ids.length > 0) {
        await setTeacherSubjects(teacher.id, data.subject_ids);
      }

      // If academic stages are selected and teacher was created successfully, save them
      if (data.academic_stage_ids && data.academic_stage_ids.length > 0 && teacher) {
        await addTeacherAcademicStages(teacher.id, data.academic_stage_ids);
      }

      return teacher;
    },
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم إضافة المعلم بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      form.reset({
        name: "",
        teacher_code: "",
        mobile_phone: "",
        subject_ids: [],
        academic_stage_ids: [],
      });
      setSelectedStages([]);
      setSelectedSubjects([]);
      onClose();
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة المعلم",
        variant: "destructive",
      });
      console.error('Error adding teacher:', error);
    },
  });

  const onSubmit = (data: TeacherFormData) => {
    createTeacherMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إضافة معلم جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="teacher_code">رمز المعلم</Label>
            <Input
              id="teacher_code"
              placeholder="أدخل رمز المعلم (مثال: B)"
              {...form.register('teacher_code')}
              style={{ textTransform: 'uppercase' }}
            />
            {form.formState.errors.teacher_code && (
              <p className="text-sm text-red-500">{form.formState.errors.teacher_code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile_phone">رقم الهاتف المحمول</Label>
            <Input
              id="mobile_phone"
              placeholder="أدخل رقم الهاتف المحمول"
              {...form.register('mobile_phone')}
            />
          </div>

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

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={createTeacherMutation.isPending}
            >
              {createTeacherMutation.isPending ? "جاري الإضافة..." : "إضافة المعلم"}
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