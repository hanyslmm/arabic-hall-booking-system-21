import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (students: BulkStudentData[]) => void;
  defaultClassFees?: number;
}

interface BulkStudentData {
  name: string;
  mobile: string;
  home: string; // parent mobile
  city: string;
  class: string;
  payment: number;
}

export function BulkUploadModal({ isOpen, onClose, onUpload, defaultClassFees = 0 }: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<BulkStudentData[]>([]);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const templateData = [
      {
        'Name': 'أحمد محمد',
        'Mobile': '01012345678',
        'Home': '01098765432',
        'City': 'القاهرة',
        'Class': 'الفصل الأول',
        'Payment': defaultClassFees
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'bulk_students_template.xlsx');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFile(selectedFile);
    }
  };

  const processFile = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const processedData: BulkStudentData[] = [];
      const errorList: string[] = [];

      jsonData.forEach((row: any, index: number) => {
        const rowNumber = index + 2; // +2 because Excel rows start at 1 and we have header
        
        // Validate required fields
        if (!row.Name) {
          errorList.push(`الصف ${rowNumber}: اسم الطالب مطلوب`);
        }
        if (!row.Mobile) {
          errorList.push(`الصف ${rowNumber}: رقم الموبايل مطلوب`);
        }
        if (!row.Home) {
          errorList.push(`الصف ${rowNumber}: رقم ولي الأمر مطلوب`);
        }

        // Validate mobile numbers (Egyptian format)
        const mobileRegex = /^01[0-9]{9}$/;
        if (row.Mobile && !mobileRegex.test(row.Mobile.toString())) {
          errorList.push(`الصف ${rowNumber}: رقم الموبايل غير صحيح (يجب أن يبدأ بـ 01 ويكون 11 رقم)`);
        }
        if (row.Home && !mobileRegex.test(row.Home.toString())) {
          errorList.push(`الصف ${rowNumber}: رقم ولي الأمر غير صحيح (يجب أن يبدأ بـ 01 ويكون 11 رقم)`);
        }

        // Validate payment amount
        const payment = Number(row.Payment) || defaultClassFees;
        if (payment < 0) {
          errorList.push(`الصف ${rowNumber}: مبلغ الدفع يجب أن يكون أكبر من أو يساوي الصفر`);
        }

        if (row.Name && row.Mobile && row.Home) {
          processedData.push({
            name: row.Name.toString().trim(),
            mobile: row.Mobile.toString().trim(),
            home: row.Home.toString().trim(),
            city: row.City?.toString().trim() || '',
            class: row.Class?.toString().trim() || '',
            payment: payment
          });
        }
      });

      setErrors(errorList);
      setPreviewData(processedData);

      if (errorList.length === 0) {
        toast({ title: 'تم تحميل الملف بنجاح', description: `تم العثور على ${processedData.length} طالب` });
      }
    } catch (error) {
      setErrors(['خطأ في قراءة الملف. تأكد من أن الملف Excel صالح.']);
      toast({ title: 'خطأ في تحميل الملف', variant: 'destructive' });
    }
  };

  const handleUpload = () => {
    if (previewData.length === 0) {
      toast({ title: 'لا توجد بيانات للرفع', variant: 'destructive' });
      return;
    }

    if (errors.length > 0) {
      toast({ title: 'يرجى إصلاح الأخطاء قبل الرفع', variant: 'destructive' });
      return;
    }

    onUpload(previewData);
    handleClose();
  };

  const handleClose = () => {
    setFile(null);
    setErrors([]);
    setPreviewData([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>رفع بيانات الطلاب مجمعة</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">تحميل نموذج Excel</h3>
              <p className="text-sm text-muted-foreground">
                حمل النموذج وأدخل بيانات الطلاب: الاسم، الموبايل، رقم ولي الأمر، المدينة، الفصل، المدفوع
              </p>
            </div>
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="h-4 w-4 ml-2" />
              تحميل النموذج
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>رفع ملف Excel</Label>
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">تم العثور على الأخطاء التالية:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {previewData.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">معاينة البيانات ({previewData.length} طالب)</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-right p-2">الاسم</th>
                      <th className="text-right p-2">الموبايل</th>
                      <th className="text-right p-2">ولي الأمر</th>
                      <th className="text-right p-2">المدينة</th>
                      <th className="text-right p-2">الفصل</th>
                      <th className="text-right p-2">المدفوع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 10).map((student, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{student.name}</td>
                        <td className="p-2">{student.mobile}</td>
                        <td className="p-2">{student.home}</td>
                        <td className="p-2">{student.city}</td>
                        <td className="p-2">{student.class}</td>
                        <td className="p-2">{student.payment} جنيه</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.length > 10 && (
                  <div className="p-2 text-center text-sm text-muted-foreground border-t">
                    ... و {previewData.length - 10} طالب آخرين
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button variant="outline" onClick={handleClose}>
              إلغاء
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={previewData.length === 0 || errors.length > 0}
            >
              <Upload className="h-4 w-4 ml-2" />
              رفع البيانات
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}