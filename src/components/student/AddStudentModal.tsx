import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { studentsApi } from "@/api/students";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddStudentModal = ({ isOpen, onClose }: AddStudentModalProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    mobile_phone: "",
    parent_phone: "",
    city: "",
    serial_number: "",
  });

  const createMutation = useMutation({
    mutationFn: studentsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success(`تم إنشاء الطالب بنجاح - الرقم التسلسلي: ${data.serial_number}`);
      handleClose();
    },
    onError: (error: any) => {
      if (error.message?.includes('mobile_phone')) {
        toast.error("رقم الهاتف مستخدم من قبل طالب آخر");
      } else if (error.message?.includes('serial_number')) {
        toast.error("الرقم التسلسلي مستخدم بالفعل، يرجى اختيار رقم آخر");
      } else {
        toast.error("فشل في إنشاء الطالب");
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.mobile_phone.trim()) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    // Validate serial number if provided
    if (formData.serial_number.trim()) {
      const serialNum = parseInt(formData.serial_number);
      if (isNaN(serialNum) || serialNum < 1 || serialNum > 99999) {
        toast.error("الرقم التسلسلي يجب أن يكون بين 1 و 99999");
        return;
      }
    }

    // Validate mobile phone format (basic validation)
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(formData.mobile_phone)) {
      toast.error("يرجى إدخال رقم هاتف صحيح");
      return;
    }

    createMutation.mutate({
      name: formData.name.trim(),
      mobile_phone: formData.mobile_phone.trim(),
      parent_phone: formData.parent_phone.trim() || undefined,
      city: formData.city.trim() || undefined,
      serial_number: formData.serial_number.trim() || undefined,
    });
  };

  const handleClose = () => {
    setFormData({
      name: "",
      mobile_phone: "",
      parent_phone: "",
      city: "",
      serial_number: "",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>إضافة طالب جديد</DialogTitle>
          <DialogDescription>
            أدخل معلومات الطالب. يمكنك تحديد رقم تسلسلي أو تركه فارغاً للتوليد التلقائي.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serial_number">الرقم التسلسلي (اختياري)</Label>
            <Input
              id="serial_number"
              type="number"
              min="1"
              max="99999"
              placeholder="رقم من 1 إلى 99999 (اختياري)"
              value={formData.serial_number}
              onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              اتركه فارغاً لتوليد رقم تسلسلي تلقائياً
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
          
          <div className="space-y-2">
            <Label htmlFor="parent_phone">هاتف ولي الأمر</Label>
            <Input
              id="parent_phone"
              placeholder="رقم هاتف ولي الأمر"
              value={formData.parent_phone}
              onChange={(e) => setFormData(prev => ({ ...prev, parent_phone: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="city">المدينة</Label>
            <Input
              id="city"
              placeholder="المدينة"
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              إضافة الطالب
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};