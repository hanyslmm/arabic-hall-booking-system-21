import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MobileDialog as Dialog, MobileDialogContent as DialogContent, MobileDialogDescription as DialogDescription, MobileDialogFooter as DialogFooter, MobileDialogHeader as DialogHeader, MobileDialogTitle as DialogTitle } from "@/components/ui/mobile-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { studentsApi } from "@/api/students";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  const [fieldErrors, setFieldErrors] = useState<{ mobile_phone?: string; serial_number?: string }>({});
  const [isChecking, setIsChecking] = useState<{ mobile_phone: boolean; serial_number: boolean }>({ mobile_phone: false, serial_number: false });

  // Normalize mobile number by removing leading zeros
  const normalizeMobileNumber = (phone: string) => {
    if (!phone) return phone;
    return phone.replace(/^0+/, ''); // Remove leading zeros
  };

  const checkDuplicatePhone = async (phone: string) => {
    if (!phone.trim()) return false;
    const normalizedPhone = normalizeMobileNumber(phone.trim());
    
    // Check for both original and normalized versions
    const { data, error } = await supabase
      .from('students')
      .select('mobile_phone')
      .or(`mobile_phone.eq.${phone.trim()},mobile_phone.eq.${normalizedPhone}`);
    
    if (error) return false;
    return (data?.length || 0) > 0;
  };

  const checkDuplicateSerial = async (serial: string) => {
    if (!serial.trim()) return false;
    const { count, error } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('serial_number', serial.trim());
    if (error) return false;
    return (count || 0) > 0;
  };

  const createMutation = useMutation({
    mutationFn: studentsApi.create,
    onMutate: async (newStudent) => {
      const tempId = `optimistic-${Date.now()}`;
      // Cancel outgoing refetches for any students queries
      await queryClient.cancelQueries({ queryKey: ["students"] });

      // Snapshot previous values for rollback
      const prevQueries = queryClient.getQueriesData({ queryKey: ["students"] });

      // Optimistically update any students lists
      queryClient.setQueriesData({ queryKey: ["students"] }, (old: any) => {
        if (!old) return old;
        // Handle paginated shape { data, total }
        if (old && typeof old === 'object' && 'data' in old && Array.isArray((old as any).data)) {
          return {
            ...old,
            data: [{
              id: tempId,
              serial_number: newStudent.serial_number || '',
              name: newStudent.name,
              mobile_phone: newStudent.mobile_phone,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, ...(old as any).data],
            total: (old as any).total ? (old as any).total + 1 : 1,
          };
        }
        // Fallback array shape
        if (Array.isArray(old)) {
          return [{
            id: tempId,
            serial_number: newStudent.serial_number || '',
            name: newStudent.name,
            mobile_phone: newStudent.mobile_phone,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, ...old];
        }
        return old;
      });

      return { prevQueries };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success(`تم إنشاء الطالب بنجاح - الرقم التسلسلي: ${data.serial_number}`);
      handleClose();
    },
    onError: (error: any, _vars, context) => {
      // Rollback
      if (context?.prevQueries) {
        for (const [key, prevData] of context.prevQueries) {
          queryClient.setQueryData(key, prevData);
        }
      }
      if (error.message?.includes('mobile_phone')) {
        toast.error("رقم الهاتف مستخدم من قبل طالب آخر");
      } else if (error.message?.includes('serial_number')) {
        toast.error("الرقم التسلسلي مستخدم بالفعل، يرجى اختيار رقم آخر");
      } else {
        toast.error("فشل في إنشاء الطالب");
      }
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
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

    // Prevent submit if client-side duplicate error exists or checks running
    if (fieldErrors.mobile_phone || fieldErrors.serial_number || isChecking.mobile_phone || isChecking.serial_number) {
      toast.error("يرجى تصحيح الأخطاء قبل الإرسال");
      return;
    }

    createMutation.mutate({
      name: formData.name.trim(),
      mobile_phone: normalizeMobileNumber(formData.mobile_phone.trim()),
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
    setFieldErrors({});
    setIsChecking({ mobile_phone: false, serial_number: false });
    onClose();
  };

  const handleBlurPhone = async () => {
    const phone = formData.mobile_phone.trim();
    if (!phone) return;
    setIsChecking((p) => ({ ...p, mobile_phone: true }));
    const exists = await checkDuplicatePhone(phone);
    setIsChecking((p) => ({ ...p, mobile_phone: false }));
    setFieldErrors((prev) => ({ ...prev, mobile_phone: exists ? 'رقم الهاتف مستخدم من قبل طالب آخر' : undefined }));
  };

  const handleBlurSerial = async () => {
    const serial = formData.serial_number.trim();
    if (!serial) return;
    setIsChecking((p) => ({ ...p, serial_number: true }));
    const exists = await checkDuplicateSerial(serial);
    setIsChecking((p) => ({ ...p, serial_number: false }));
    setFieldErrors((prev) => ({ ...prev, serial_number: exists ? 'الرقم التسلسلي مستخدم بالفعل' : undefined }));
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
        
        <form onSubmit={handleSubmit} className="space-y-4 text-right">
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
              onBlur={handleBlurSerial}
              aria-invalid={!!fieldErrors.serial_number}
              className="text-right h-12 text-base md:h-10 md:text-sm touch-manipulation"
            />
            {fieldErrors.serial_number && (
              <p className="text-sm text-red-500">{fieldErrors.serial_number}</p>
            )}
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
              className="text-right h-12 text-base md:h-10 md:text-sm touch-manipulation"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="mobile_phone">رقم الهاتف *</Label>
            <Input
              id="mobile_phone"
              placeholder="رقم هاتف الطالب"
              value={formData.mobile_phone}
              onChange={(e) => setFormData(prev => ({ ...prev, mobile_phone: e.target.value }))}
              onBlur={handleBlurPhone}
              aria-invalid={!!fieldErrors.mobile_phone}
              required
              className="text-right h-12 text-base md:h-10 md:text-sm touch-manipulation"
            />
            {(isChecking.mobile_phone) && (
              <p className="text-xs text-muted-foreground">جاري التحقق من الرقم...</p>
            )}
            {fieldErrors.mobile_phone && (
              <p className="text-sm text-red-500">{fieldErrors.mobile_phone}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="parent_phone">هاتف ولي الأمر</Label>
            <Input
              id="parent_phone"
              placeholder="رقم هاتف ولي الأمر"
              value={formData.parent_phone}
              onChange={(e) => setFormData(prev => ({ ...prev, parent_phone: e.target.value }))}
              className="text-right h-12 text-base md:h-10 md:text-sm touch-manipulation"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="city">المدينة</Label>
            <Input
              id="city"
              placeholder="المدينة"
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              className="text-right h-12 text-base md:h-10 md:text-sm touch-manipulation"
            />
          </div>
          
          <DialogFooter className="grid grid-cols-1 sm:flex sm:flex-row gap-3">
            <Button type="button" variant="outline" onClick={handleClose} className="w-full sm:w-auto h-12 text-base sm:h-10 sm:text-sm touch-manipulation">
              إلغاء
            </Button>
            <Button type="submit" className="w-full sm:w-auto h-12 text-base sm:h-10 sm:text-sm touch-manipulation" disabled={createMutation.isPending || isChecking.mobile_phone || isChecking.serial_number || !!fieldErrors.mobile_phone || !!fieldErrors.serial_number}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              إضافة الطالب
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};