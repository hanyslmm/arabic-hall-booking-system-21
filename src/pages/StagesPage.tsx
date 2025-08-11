
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UnifiedLayout } from "@/components/layout/UnifiedLayout";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AddStageModal } from "@/components/stages/AddStageModal";
import { formatShortArabicDate } from "@/utils/dateUtils";

interface AcademicStage {
  id: string;
  name: string;
  created_at: string;
}

const StagesPage = () => {
  const [showAddStage, setShowAddStage] = useState(false);
  const { profile, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stages, isLoading } = useQuery({
    queryKey: ['academic-stages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academic_stages')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as AcademicStage[];
    }
  });

  const deleteStage = useMutation({
    mutationFn: async (stageId: string) => {
      const { error } = await supabase
        .from('academic_stages')
        .delete()
        .eq('id', stageId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "تم حذف المرحلة بنجاح",
        description: "تم حذف المرحلة الدراسية من النظام",
      });
      queryClient.invalidateQueries({ queryKey: ['academic-stages'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (error) => {
      toast({
        title: "خطأ في حذف المرحلة",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const canManage = profile?.user_role === 'owner' || profile?.user_role === 'manager' || isAdmin;

  return (
    <UnifiedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">المراحل الدراسية</h1>
            <p className="text-muted-foreground mt-2">
              إدارة المراحل الدراسية في النظام
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span className="font-semibold">{stages?.length || 0} مرحلة</span>
            </div>
            {canManage && (
              <Button
                onClick={() => setShowAddStage(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                إضافة مرحلة جديدة
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>قائمة المراحل الدراسية</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p>جاري تحميل المراحل...</p>
              </div>
            ) : stages?.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">لا توجد مراحل دراسية</h3>
                <p className="text-muted-foreground mb-4">
                  لم يتم إضافة أي مراحل دراسية بعد
                </p>
                {canManage && (
                  <Button onClick={() => setShowAddStage(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    إضافة أول مرحلة
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">اسم المرحلة</TableHead>
                    <TableHead className="text-right">تاريخ الإضافة</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    {canManage && <TableHead className="text-right">الإجراءات</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stages?.map((stage) => (
                    <TableRow key={stage.id}>
                      <TableCell className="font-medium">
                        {stage.name}
                      </TableCell>
                      <TableCell>
                        {formatShortArabicDate(stage.created_at)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-green-600">
                          نشط
                        </Badge>
                      </TableCell>
                      {canManage && (
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteStage.mutate(stage.id)}
                            disabled={deleteStage.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {canManage && (
          <AddStageModal 
            isOpen={showAddStage}
            onClose={() => setShowAddStage(false)}
          />
        )}
      </div>
    </UnifiedLayout>
  );
};

export default StagesPage;
