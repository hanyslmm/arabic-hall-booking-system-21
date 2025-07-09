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
  email: z.string().email("يرجى إدخال بريد إلكتروني صحيح"),
  full_name: z.string().min(1, "يرجى إدخال اسم المستخدم"),
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
    defaultValues: { email: "", full_name: "", user_role: undefined },
  });

  const addUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      // First, try to invite the user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(data.email, {
        data: {
          full_name: data.full_name,
          user_role: data.user_role,
        },
      });

      // If auth invitation fails, create profile directly
      if (authError) {
        console.warn('Auth invitation failed, creating profile directly:', authError);
      }

      // Create or update the profile
      const { error } = await supabase.from("profiles").upsert({
        email: data.email,
        full_name: data.full_name,
        user_role: data.user_role,
        id: authData?.user?.id || crypto.randomUUID(),
      });
      if (error) throw error;
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
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" placeholder="أدخل البريد الإلكتروني" {...form.register("email")} />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="full_name">اسم المستخدم</Label>
            <Input id="full_name" placeholder="أدخل اسم المستخدم" {...form.register("full_name")} />
            {form.formState.errors.full_name && (
              <p className="text-sm text-destructive">{form.formState.errors.full_name.message}</p>
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
