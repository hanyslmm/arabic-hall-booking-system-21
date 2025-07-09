import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { z, ZodSchema } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";

interface FormModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  schema: ZodSchema<T>;
  defaultValues?: Partial<T>;
  fields: React.ReactNode | ((args: { register: any; errors: any; form: any }) => React.ReactNode);
  onSubmit: (values: T) => void | Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export function FormModal<T>({
  isOpen,
  onClose,
  title,
  schema,
  defaultValues,
  fields,
  onSubmit,
  submitLabel = "Submit",
  isSubmitting = false,
}: FormModalProps<T>) {
  const {
    handleSubmit,
    register,
    formState: { errors },
    reset,
    ...form
  } = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  React.useEffect(() => {
    if (isOpen) {
      reset(defaultValues);
    }
  }, [isOpen, defaultValues, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Render fields, pass register and errors as needed */}
          {typeof fields === "function"
            ? fields({ register, errors, form })
            : fields}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
