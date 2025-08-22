import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import { expensesApi } from '@/api/expenses';

export function ExpenseCategoryManager() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<string[]>(expensesApi.getCategories());
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ index: number; name: string } | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast({ title: 'يرجى إدخال اسم الفئة', variant: 'destructive' });
      return;
    }

    if (categories.includes(newCategoryName.trim())) {
      toast({ title: 'هذه الفئة موجودة بالفعل', variant: 'destructive' });
      return;
    }

    const updatedCategories = [...categories, newCategoryName.trim()];
    setCategories(updatedCategories);
    setNewCategoryName('');
    setIsAddCategoryOpen(false);
    toast({ title: 'تم إضافة الفئة بنجاح' });
  };

  const handleEditCategory = () => {
    if (!editingCategory || !newCategoryName.trim()) {
      toast({ title: 'يرجى إدخال اسم الفئة', variant: 'destructive' });
      return;
    }

    if (categories.includes(newCategoryName.trim()) && newCategoryName.trim() !== editingCategory.name) {
      toast({ title: 'هذه الفئة موجودة بالفعل', variant: 'destructive' });
      return;
    }

    const updatedCategories = [...categories];
    updatedCategories[editingCategory.index] = newCategoryName.trim();
    setCategories(updatedCategories);
    setEditingCategory(null);
    setNewCategoryName('');
    toast({ title: 'تم تحديث الفئة بنجاح' });
  };

  const handleDeleteCategory = (index: number, categoryName: string) => {
    const updatedCategories = categories.filter((_, i) => i !== index);
    setCategories(updatedCategories);
    toast({ title: `تم حذف فئة "${categoryName}" بنجاح` });
  };

  const startEditCategory = (index: number, categoryName: string) => {
    setEditingCategory({ index, name: categoryName });
    setNewCategoryName(categoryName);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setNewCategoryName('');
    setIsAddCategoryOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          إدارة فئات المصروفات
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">إدارة وتخصيص فئات المصروفات المختلفة</p>
          <Dialog open={isAddCategoryOpen || !!editingCategory} onOpenChange={(open) => {
            if (!open) {
              cancelEdit();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsAddCategoryOpen(true)}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة فئة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>اسم الفئة *</Label>
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="مثال: صيانة الأجهزة"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        editingCategory ? handleEditCategory() : handleAddCategory();
                      }
                    }}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={cancelEdit}>
                    إلغاء
                  </Button>
                  <Button onClick={editingCategory ? handleEditCategory : handleAddCategory}>
                    {editingCategory ? 'تحديث' : 'إضافة'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((category, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <Badge variant="secondary" className="text-sm">
                {category}
              </Badge>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => startEditCategory(index, category)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                      <AlertDialogDescription>
                        هل أنت متأكد من حذف فئة "{category}"؟ لا يمكن التراجع عن هذا الإجراء.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteCategory(index, category)}>
                        حذف
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>لا توجد فئات مصروفات. أضف فئة جديدة للبدء.</p>
          </div>
        )}

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-2">ملاحظة هامة:</h4>
          <p className="text-sm text-muted-foreground">
            تغيير أو حذف الفئات لن يؤثر على المصروفات المسجلة مسبقاً. الفئات المحذوفة ستبقى مرتبطة بالمصروفات القديمة.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}