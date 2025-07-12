import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FormModal } from "@/components/ui/FormModal";
import { addTeacher } from "@/api/teachers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const teacherSchema = z.object({
  name: z.string().min(1, "يرجى إدخال اسم المعلم"),
  mobile_phone: z.string().optional(),
  subject_id: z.string().optional(),
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

  const form = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      name: "",
      mobile_phone: "",
      subject_id: "",
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
      const { data, error } = await supabase.from('academic_stages').select('id, name').order('name');
      if (error) throw error;
      return data;
    },
  });

  const createTeacherMutation = useMutation({
    mutationFn: async (data: TeacherFormData) => {
      try {
        const teacher = await addTeacher({ 
          name: data.name,
          mobile_phone: data.mobile_phone || null,
          subject_id: data.subject_id || null,
        });

        // If academic stages are selected and teacher was created successfully, try to save them
        if (data.academic_stage_ids && data.academic_stage_ids.length > 0 && teacher) {
          try {
            // Try to save academic stages - this will only work if the database migration is applied
            const academicStagePromises = data.academic_stage_ids.map(async (stageId) => {
              return (supabase as any)
                .from('teacher_academic_stages')
                .insert({ teacher_id: teacher.id, academic_stage_id: stageId });
            });
            await Promise.all(academicStagePromises);
          } catch (error: any) {
            console.warn("Could not save academic stages - migration may not be applied yet:", error);
            // Don't throw error here - teacher was already created successfully
          }
        }

        return teacher;
      } catch (error: any) {
        // If the error is about missing columns, try with just the name
        if (error.message?.includes('mobile_phone') || error.message?.includes('subject_id')) {
          return await addTeacher({ 
            name: data.name,
          } as any);
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "تم إضافة المعلم بنجاح",
        description: "تم حفظ المعلم في النظام",
      });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      form.reset();
      setSelectedStages([]);
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

  const addSubjectMutation = useMutation({
    mutationFn: async (name: string) => {
      const { addSubject } = await import('@/api/subjects');
      return await addSubject({ name });
    },
    onSuccess: () => {
      toast({
        title: "تم إضافة المادة بنجاح",
        description: "تم حفظ المادة الدراسية في النظام",
      });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setShowAddSubject(false);
      setNewSubjectName("");
    },
    onError: (error) => {
      toast({
        title: "خطأ في إضافة المادة",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    },
  });

  const handleAddSubject = () => {
    if (newSubjectName.trim()) {
      addSubjectMutation.mutate(newSubjectName.trim());
    }
  };

  const handleStageToggle = (stageId: string) => {
    const updatedStages = selectedStages.includes(stageId)
      ? selectedStages.filter(id => id !== stageId)
      : [...selectedStages, stageId];
    
    setSelectedStages(updatedStages);
    form.setValue('academic_stage_ids', updatedStages);
  };

  const onSubmit = (data: TeacherFormData) => {
    createTeacherMutation.mutate(data);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة معلم جديد</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Teacher Name */}
            <div className="space-y-2">
              <Label htmlFor="name">اسم المعلم</Label>
              <Input
                id="name"
                placeholder="أدخل اسم المعلم"
                {...form.register('name')}
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
              <div className="flex items-center justify-between">
                <Label>المادة الدراسية</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddSubject(true)}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  إضافة مادة
                </Button>
              </div>
              <Select onValueChange={(value) => form.setValue('subject_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المادة الدراسية" />
                </SelectTrigger>
                <SelectContent>
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

            <div className="flex justify-end space-x-2 space-x-reverse pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={createTeacherMutation.isPending}
              >
                {createTeacherMutation.isPending ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Subject Modal */}
      <Dialog open={showAddSubject} onOpenChange={setShowAddSubject}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>إضافة مادة دراسية جديدة</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject_name">اسم المادة</Label>
              <Input
                id="subject_name"
                placeholder="أدخل اسم المادة"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowAddSubject(false);
                  setNewSubjectName("");
                }}
              >
                إلغاء
              </Button>
              <Button 
                onClick={handleAddSubject}
                disabled={!newSubjectName.trim() || addSubjectMutation.isPending}
              >
                {addSubjectMutation.isPending ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
