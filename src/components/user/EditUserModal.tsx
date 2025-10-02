import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useFormValidation, validationSchemas } from "@/hooks/useFormValidation";
import { UserProfile, updateUser } from "@/api/users";
import { User, Mail, Phone, Shield, UserCheck } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

// Enhanced validation schema for user editing
const editUserSchema = z.object({
  full_name: z.string().min(2, "يجب أن يكون الاسم أكثر من حرفين"),
  email: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
  phone: z.string().optional(),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل").optional().or(z.literal("")),
  user_role: z.enum(["owner", "manager", "space_manager", "teacher", "read_only"], {
    errorMap: () => ({ message: "يرجى اختيار دور صحيح" })
  }),
  teacher_id: z.string().optional()
}).refine((data) => {
  if (data.user_role === 'teacher' && !data.teacher_id) {
    return false;
  }
  return true;
}, {
  message: 'يرجى اختيار المعلم لحساب المعلم',
  path: ['teacher_id']
});

type EditUserFormData = z.infer<typeof editUserSchema>;

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
}

// Role display mapping
const ROLE_DISPLAY = {
  'owner': 'مالك النظام',
  'manager': 'مدير عام', 
  'space_manager': 'مدير قاعات',
  'teacher': 'معلم',
  'read_only': 'قراءة فقط (طالب)'
} as const;

const ROLE_DESCRIPTIONS = {
  'owner': 'صلاحيات كاملة لإدارة النظام',
  'manager': 'إدارة البيانات والمستخدمين',
  'space_manager': 'إدارة القاعات والحجوزات',
  'teacher': 'عرض الفصول والطلاب المسجلين',
  'read_only': 'عرض البيانات الشخصية والحضور فقط'
} as const;

export const EditUserModal = ({ isOpen, onClose, user }: EditUserModalProps) => {
  const queryClient = useQueryClient();

  // Load teachers for teacher role selection
  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers-for-user-edit'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, name, teacher_code')
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: isOpen
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: EditUserFormData) => {
      if (!user) throw new Error('لا يوجد مستخدم محدد');
      
      return await updateUser(user.id, {
        full_name: data.full_name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        user_role: data.user_role,
        password: data.password || undefined,
        teacher_id: data.user_role === 'teacher' ? data.teacher_id : undefined,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
    },
  });

  // Form validation setup
  const { handleSubmit, register, formState: { errors }, setValue, watch, reset } = useFormValidation({
    schema: editUserSchema,
    defaultValues: {
      full_name: user?.full_name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      password: "",
      user_role: user?.user_role || "read_only",
      teacher_id: (user as any)?.teacher_id || ""
    },
    onSubmit: async (data) => {
      await updateUserMutation.mutateAsync(data);
    },
    successMessage: "تم تحديث المستخدم بنجاح",
    errorMessage: "حدث خطأ أثناء تحديث المستخدم"
  });

  // Reset form when user changes
  React.useEffect(() => {
    if (user && isOpen) {
      reset({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        password: "",
        user_role: user.user_role || "read_only",
        teacher_id: (user as any)?.teacher_id || ""
      });
    }
  }, [user, isOpen, reset]);

  const selectedRole = watch("user_role");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <UserCheck className="w-5 h-5 text-primary" />
            </div>
            تحديث بيانات المستخدم
          </DialogTitle>
          <DialogDescription>
            تحديث المعلومات الشخصية والصلاحيات للمستخدم
          </DialogDescription>
        </DialogHeader>

        {user && (
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                    {user.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{user.full_name || user.email}</h3>
                  <p className="text-sm text-muted-foreground">
                    الدور الحالي: {ROLE_DISPLAY[user.user_role as keyof typeof ROLE_DISPLAY] || user.user_role}
                  </p>
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">
                    <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">🔐 معلومات تسجيل الدخول:</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-blue-700 dark:text-blue-300">اسم المستخدم:</span>
                        <code className="text-xs font-mono bg-white dark:bg-gray-900 px-2 py-0.5 rounded border">
                          {user.username || user.email?.split('@')[0] || 'غير محدد'}
                        </code>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-blue-700 dark:text-blue-300">البريد الإلكتروني:</span>
                        <code className="text-xs font-mono bg-white dark:bg-gray-900 px-2 py-0.5 rounded border">
                          {user.email || `${user.username}@admin.com`}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="w-4 h-4" />
                المعلومات الأساسية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="full_name" className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" />
                  الاسم الكامل *
                </Label>
                <Input
                  id="full_name"
                  {...register("full_name")}
                  placeholder="أدخل الاسم الكامل"
                  className="h-11"
                />
                {errors.full_name && (
                  <p className="text-sm text-destructive mt-1">{errors.full_name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4" />
                    البريد الإلكتروني
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="example@domain.com"
                    className="h-11"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4" />
                    رقم الهاتف
                  </Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    placeholder="01xxxxxxxxx"
                    className="h-11"
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role and Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="w-4 h-4" />
                الدور والصلاحيات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="user_role" className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4" />
                  دور المستخدم *
                </Label>
                <Select
                  value={selectedRole}
                  onValueChange={(value) => setValue("user_role", value as any)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="اختر الدور" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_DISPLAY).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{label}</span>
                          <span className="text-xs text-muted-foreground">
                            {ROLE_DESCRIPTIONS[value as keyof typeof ROLE_DESCRIPTIONS]}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.user_role && (
                  <p className="text-sm text-destructive mt-1">{errors.user_role.message}</p>
                )}
              </div>

              {/* Teacher Selection - Only show if teacher role is selected */}
              {selectedRole === 'teacher' && (
                <div>
                  <Label htmlFor="teacher_id" className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4" />
                    ربط بحساب المعلم *
                  </Label>
                  <Select
                    value={watch("teacher_id") || ""}
                    onValueChange={(value) => setValue("teacher_id", value)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="اختر المعلم" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name} {teacher.teacher_code ? `(${teacher.teacher_code})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.teacher_id && (
                    <p className="text-sm text-destructive mt-1">{errors.teacher_id.message}</p>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="password" className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4" />
                  كلمة المرور الجديدة
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  placeholder="اتركها فارغة لعدم التغيير"
                  className="h-11"
                />
                {errors.password && (
                  <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  اتركها فارغة إذا لم تريد تغيير كلمة المرور
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-border">
            <Button
              type="submit"
              className="flex-1 h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  جاري التحديث...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  حفظ التغييرات
                </div>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-14 text-lg font-medium border-2 hover:bg-muted/50 transition-all duration-300"
              disabled={updateUserMutation.isPending}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};