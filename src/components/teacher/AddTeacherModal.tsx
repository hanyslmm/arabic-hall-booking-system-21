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

  // Fetch subjects - for now we'll use a mock until database is updated
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

  const createTeacherMutation = useMutation({
    mutationFn: async (data: TeacherFormData) => {
      return await addTeacher({ 
        name: data.name,
        mobile_phone: data.mobile_phone || null,
        subject_id: data.subject_id || null,
      });
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
                onClick={() => {
                  // For now, just close the modal
                  // Will implement actual subject creation after database update
                  toast({
                    title: "ملاحظة",
                    description: "سيتم تنفيذ إضافة المواد الدراسية بعد تحديث قاعدة البيانات",
                  });
                  setShowAddSubject(false);
                  setNewSubjectName("");
                }}
                disabled={!newSubjectName.trim()}
              >
                حفظ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
