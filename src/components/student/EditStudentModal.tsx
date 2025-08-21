import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { studentsApi, Student } from "@/api/students";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface EditStudentModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
}

export const EditStudentModal = ({ student, isOpen, onClose }: EditStudentModalProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: student.name,
    mobile_phone: student.mobile_phone,
    // parent_phone and city removed from simplified schema
    serial_number: student.serial_number,
  });

  const updateMutation = useMutation({
    mutationFn: (updates: any) => studentsApi.update(student.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("تم تحديث معلومات الطالب بنجاح");
      onClose();
    },
    onError: (error: any) => {
      if (error.message?.includes('mobile_phone')) {
        toast.error("رقم الهاتف مستخدم من قبل طالب آخر");
      } else if (error.message?.includes('serial_number')) {
        toast.error("الرقم التسلسلي مستخدم بالفعل، يرجى اختيار رقم آخر");
      } else {
        toast.error("فشل في تحديث معلومات الطالب");
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.mobile_phone.trim() || !formData.serial_number.trim()) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    // Validate serial number range
    const serialNum = parseInt(formData.serial_number);
    if (isNaN(serialNum) || serialNum < 1 || serialNum > 99999) {
      toast.error("الرقم التسلسلي يجب أن يكون بين 1 و 99999");
      return;
    }

    // Validate mobile phone format (basic validation)
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(formData.mobile_phone)) {
      toast.error("يرجى إدخال رقم هاتف صحيح");
      return;
    }

    updateMutation.mutate({
      name: formData.name.trim(),
      mobile_phone: formData.mobile_phone.trim(),
      // parent_phone and city removed from simplified schema
      serial_number: formData.serial_number.trim(),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>تعديل معلومات الطالب</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serial_number">الرقم التسلسلي *</Label>
            <Input
              id="serial_number"
              type="number"
              min="1"
              max="99999"
              placeholder="رقم من 1 إلى 99999"
              value={formData.serial_number}
              onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
              required
            />
            <p className="text-xs text-muted-foreground">
              رقم تسلسلي فريد من 1 إلى 99999
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">الاسم *</Label>
            <Input
              id="name"
              placeholder="اسم الطالب"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="mobile_phone">رقم الهاتف *</Label>
            <Input
              id="mobile_phone"
              placeholder="رقم هاتف الطالب"
              value={formData.mobile_phone}
              onChange={(e) => setFormData(prev => ({ ...prev, mobile_phone: e.target.value }))}
              required
            />
          </div>
          
          {/* parent_phone and city fields removed from simplified schema */}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};