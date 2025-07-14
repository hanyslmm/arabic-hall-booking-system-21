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

const userSchema = z.object({
  username: z.string().min(1, "يرجى إدخال اسم المستخدم"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  user_role: z.enum(["owner", "manager", "space_manager"], {
    errorMap: () => ({ message: "يرجى اختيار الدور" })
  }),
});

type UserFormData = z.infer<typeof userSchema>;

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddUserModal = ({ isOpen, onClose }: AddUserModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { username: "", password: "", user_role: undefined },
  });

  const addUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      // Call the Edge Function to create user
      const response = await supabase.functions.invoke('create-user', {
        body: {
          username: data.username,
          password: data.password,
          role: data.user_role,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create user');
      }

      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "تم إضافة المستخدم بنجاح",
        description: "تمت إضافة المستخدم للنظام وإرسال دعوة إلى بريده الإلكتروني.",
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إضافة المستخدم",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UserFormData) => {
    addUserMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-center">إضافة مستخدم جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">اسم المستخدم</Label>
            <Input id="username" placeholder="أدخل اسم المستخدم" {...form.register("username")} />
            {form.formState.errors.username && (
              <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input id="password" type="password" placeholder="أدخل كلمة المرور" {...form.register("password")} />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="user_role">الدور</Label>
            <Select onValueChange={value => form.setValue("user_role", value as any)} value={form.watch("user_role") || ""}>
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
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={addUserMutation.isPending}>
              {addUserMutation.isPending ? "جاري الإضافة..." : "إضافة"}
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
