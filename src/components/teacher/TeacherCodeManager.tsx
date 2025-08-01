import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { GraduationCap, Edit2, Save, X } from "lucide-react";

interface Teacher {
  id: string;
  name: string;
  teacher_code: string | null;
}

export const TeacherCodeManager = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempCode, setTempCode] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: teachers, isLoading } = useQuery({
    queryKey: ['teachers-with-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, name, teacher_code')
        .order('name');
      
      if (error) throw error;
      return data as Teacher[];
    }
  });

  const updateTeacherCode = async (teacherId: string, code: string) => {
    try {
      const { error } = await supabase
        .from('teachers')
        .update({ teacher_code: code.toUpperCase().trim() })
        .eq('id', teacherId);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['teachers-with-codes'] });
      toast.success("تم تحديث كود المعلم بنجاح");
      setEditingId(null);
      setTempCode("");
    } catch (error) {
      console.error('Error updating teacher code:', error);
      toast.error("حدث خطأ أثناء تحديث كود المعلم");
    }
  };

  const startEditing = (teacher: Teacher) => {
    setEditingId(teacher.id);
    setTempCode(teacher.teacher_code || "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setTempCode("");
  };

  if (isLoading) {
    return <div className="text-center py-8">جاري تحميل المعلمين...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          إدارة أكواد المعلمين
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          تستخدم هذه الأكواد لتوليد كود المجموعة تلقائياً (مثال: B_SUN_3)
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">اسم المعلم</TableHead>
              <TableHead className="text-right">الكود الحالي</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers?.map((teacher) => (
              <TableRow key={teacher.id}>
                <TableCell className="font-medium">{teacher.name}</TableCell>
                <TableCell>
                  {editingId === teacher.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={tempCode}
                        onChange={(e) => setTempCode(e.target.value.toUpperCase())}
                        placeholder="مثال: B"
                        className="w-20 font-mono"
                        maxLength={3}
                      />
                    </div>
                  ) : (
                    <span className="font-mono text-sm bg-primary/10 px-2 py-1 rounded">
                      {teacher.teacher_code || 'غير محدد'}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === teacher.id ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateTeacherCode(teacher.id, tempCode)}
                        disabled={!tempCode.trim()}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditing}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEditing(teacher)}
                    >
                      <Edit2 className="h-4 w-4" />
                      تعديل
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};