import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { studentsApi } from "@/api/students";
import { toast } from "sonner";
import { Loader2, Upload, Download, FileSpreadsheet } from "lucide-react";
import * as XLSX from 'xlsx';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BulkUploadModal = ({ isOpen, onClose }: BulkUploadModalProps) => {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const bulkCreateMutation = useMutation({
    mutationFn: studentsApi.bulkCreate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success(`تم إضافة ${data.length} طالب بنجاح`);
      handleClose();
    },
    onError: (error: any) => {
      toast.error("فشل في رفع البيانات");
      console.error("Bulk upload error:", error);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!validTypes.includes(selectedFile.type)) {
      toast.error("يرجى اختيار ملف Excel أو CSV صحيح");
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Skip header row and parse data
      const rows = jsonData.slice(1) as any[][];
      const validationErrors: string[] = [];
      const parsedData: any[] = [];

      rows.forEach((row, index) => {
        const rowNumber = index + 2; // +2 because we start from row 2 (after header)
        
        if (!row[0] || !row[1]) {
          validationErrors.push(`الصف ${rowNumber}: الاسم ورقم الهاتف مطلوبان`);
          return;
        }

        // Validate phone number format
        const phoneRegex = /^[0-9+\-\s()]+$/;
        if (!phoneRegex.test(String(row[1]))) {
          validationErrors.push(`الصف ${rowNumber}: رقم الهاتف غير صحيح`);
          return;
        }

        parsedData.push({
          name: String(row[0]).trim(),
          mobile_phone: String(row[1]).trim(),
          parent_phone: row[2] ? String(row[2]).trim() : undefined,
          city: row[3] ? String(row[3]).trim() : undefined,
        });
      });

      setPreviewData(parsedData);
      setErrors(validationErrors);
    } catch (error) {
      toast.error("فشل في قراءة الملف");
      console.error("File parsing error:", error);
    }
  };

  const downloadTemplate = () => {
    const template = [
      ['Name', 'Mobile', 'Home', 'City'],
      ['أحمد محمد', '0501234567', '0112345678', 'الرياض'],
      ['فاطمة علي', '0559876543', '0134567890', 'جدة'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students Template');
    XLSX.writeFile(wb, 'students_template.xlsx');
  };

  const handleSubmit = () => {
    if (errors.length > 0) {
      toast.error("يرجى إصلاح الأخطاء أولاً");
      return;
    }

    if (previewData.length === 0) {
      toast.error("لا توجد بيانات للرفع");
      return;
    }

    bulkCreateMutation.mutate(previewData);
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData([]);
    setErrors([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            رفع ملف Excel للطلاب
          </DialogTitle>
          <DialogDescription>
            رفع عدة طلاب دفعة واحدة من ملف Excel أو CSV
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Template Download */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              <span>تحميل نموذج الملف</span>
            </div>
            <Button variant="outline" onClick={downloadTemplate} size="sm">
              <Download className="h-4 w-4 mr-2" />
              تحميل النموذج
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">اختيار الملف</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
            />
            <p className="text-sm text-muted-foreground">
              يجب أن يحتوي الملف على الأعمدة: Name, Mobile, Home, City
            </p>
          </div>

          {/* Validation Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">أخطاء في البيانات:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.slice(0, 5).map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                    {errors.length > 5 && (
                      <li className="text-sm">...و {errors.length - 5} خطأ آخر</li>
                    )}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview Data */}
          {previewData.length > 0 && (
            <div className="space-y-2">
              <Label>معاينة البيانات ({previewData.length} طالب)</Label>
              <div className="border rounded-lg p-4 max-h-40 overflow-y-auto">
                <div className="grid grid-cols-4 gap-2 text-sm font-medium mb-2">
                  <div>الاسم</div>
                  <div>الهاتف</div>
                  <div>هاتف ولي الأمر</div>
                  <div>المدينة</div>
                </div>
                {previewData.slice(0, 5).map((student, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 text-sm py-1 border-t">
                    <div>{student.name}</div>
                    <div>{student.mobile_phone}</div>
                    <div>{student.parent_phone || '-'}</div>
                    <div>{student.city || '-'}</div>
                  </div>
                ))}
                {previewData.length > 5 && (
                  <div className="text-sm text-muted-foreground text-center py-2">
                    ...و {previewData.length - 5} طالب آخر
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            إلغاء
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!file || errors.length > 0 || previewData.length === 0 || bulkCreateMutation.isPending}
          >
            {bulkCreateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            رفع البيانات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};