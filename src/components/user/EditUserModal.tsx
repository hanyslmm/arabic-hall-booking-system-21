
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserProfile } from "@/api/users";

const editUserSchema = z.object({
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل").optional().or(z.literal("")),
  user_role: z.enum(["owner", "manager", "space_manager"], {
    errorMap: () => ({ message: "يرجى اختيار الدور" })
  }),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
}

export const EditUserModal = ({ isOpen, onClose, user }: EditUserModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { 
      password: "", 
      user_role: user?.user_role || "space_manager"
    },
  });

  // Update form when user changes
  React.useEffect(() => {
    if (user) {
      form.reset({
        password: "",
        user_role: user.user_role || "space_manager"
      });
    }
  }, [user, form]);

  const updateUserMutation = useMutation({
    mutationFn: async (data: EditUserFormData) => {
      if (!user) throw new Error('No user selected');

      const updateData: any = {
        userId: user.id,
        user_role: data.user_role,
      };

      if (data.password && data.password.trim() !== "") {
        updateData.password = data.password;
      }

      // Call the Edge Function to update user
      const response = await supabase.functions.invoke('update-user', {
        body: updateData,
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to update user');
      }

      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "تم تحديث المستخدم بنجاح",
        description: "تم تحديث بيانات المستخدم بنجاح.",
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تحديث المستخدم",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditUserFormData) => {
    updateUserMutation.mutate(data);
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'owner': 'مالك',
      'manager': 'مدير',
      'space_manager': 'مدير قاعات'
    };
    return roleMap[role] || role;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-center">تعديل المستخدم</DialogTitle>
        </DialogHeader>
        {user && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">المستخدم:</p>
            <p className="font-medium">{user.full_name || user.email}</p>
            <p className="text-sm text-muted-foreground">الدور الحالي: {getRoleDisplayName(user.user_role || 'space_manager')}</p>
          </div>
        )}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user_role">الدور الجديد</Label>
            <Select 
              onValueChange={value => form.setValue("user_role", value as any)} 
              value={form.watch("user_role") || "space_manager"}
            >
              <SelectTrigger id="user_role">
                <SelectValue placeholder="اختر الدور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="space_manager">مدير قاعات</SelectItem>
                <SelectItem value="manager">مدير</SelectItem>
                <SelectItem value="owner">مالك</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.user_role && (
              <p className="text-sm text-destructive">{form.formState.errors.user_role.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور الجديدة (اختياري)</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="اتركها فارغة إذا كنت لا تريد تغييرها" 
              {...form.register("password")} 
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending ? "جاري التحديث..." : "تحديث"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
