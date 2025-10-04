import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Subject } from "@/types";

interface MobileSubjectCardProps {
  subject: Subject;
  onEdit: (subject: Subject) => void;
  onDelete: (id: string) => void;
}

export const MobileSubjectCard = ({ subject, onEdit, onDelete }: MobileSubjectCardProps) => {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">{subject.name}</h3>
        </div>
      </div>
      
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">تاريخ الإنشاء:</span>
          <span className="font-medium">
            {format(new Date(subject.created_at), "dd/MM/yyyy", { locale: ar })}
          </span>
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onEdit(subject)}
        >
          <Edit2 className="h-4 w-4 ml-2" />
          تعديل
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="flex-1"
          onClick={() => onDelete(subject.id)}
        >
          <Trash2 className="h-4 w-4 ml-2" />
          حذف
        </Button>
      </div>
    </Card>
  );
};
