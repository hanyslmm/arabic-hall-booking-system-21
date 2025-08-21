import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import * as XLSX from 'xlsx';
import { supabase } from "@/integrations/supabase/client";

interface BulkUploadModalProps {
  children: React.ReactNode;
}

interface TeacherData {
  name: string;
  mobile_phone?: string;
  subject?: string;
  teacher_code?: string;
  default_class_fee?: number;
}

interface ProcessingProgress {
  current: number;
  total: number;
  currentItem: string;
}

export const BulkUploadModal = ({ children }: BulkUploadModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<TeacherData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress>({ current: 0, total: 0, currentItem: '' });
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get subjects for mapping
  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('subjects').select('*');
      if (error) throw error;
      return data;
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (teachersData: TeacherData[]) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("غير مصرح");

      const results = [];
      setProgress({ current: 0, total: teachersData.length, currentItem: '' });
      
      for (let i = 0; i < teachersData.length; i++) {
        const teacherData = teachersData[i];
        setProgress({ current: i + 1, total: teachersData.length, currentItem: teacherData.name });
        
        try {
          // Find subject ID if subject name is provided
          let subjectId = null;
          if (teacherData.subject && subjects) {
            const subject = subjects.find(s => 
              s.name.toLowerCase().includes(teacherData.subject!.toLowerCase()) ||
              teacherData.subject!.toLowerCase().includes(s.name.toLowerCase())
            );
            if (subject) {
              subjectId = subject.id;
            }
          }

          // Generate teacher code if not provided
          const teacherCode = teacherData.teacher_code || `T${Date.now()}-${i}`;

          const { data, error } = await supabase
            .from('teachers')
            .insert({
              name: teacherData.name,
              mobile_phone: teacherData.mobile_phone || null,
              subject_id: subjectId,
              teacher_code: teacherCode,
              default_class_fee: teacherData.default_class_fee || 0,
              created_by: user.user.id
            })
            .select()
            .single();

          if (error) throw error;
          results.push(data);
        } catch (error) {
          console.error(`Error creating teacher ${teacherData.name}:`, error);
          results.push({ error: `فشل في إضافة ${teacherData.name}: ${(error as Error).message}` });
        }

        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return results;
    },
    onSuccess: (results) => {
      const successful = results.filter(r => !r.error).length;
      const failed = results.filter(r => r.error).length;
      
      toast({
        title: "تم رفع البيانات",
        description: `تم إنشاء ${successful} معلم بنجاح${failed > 0 ? ` و فشل في ${failed}` : ''}`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "خطأ في رفع البيانات",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
      setErrors(["يرجى اختيار ملف Excel (.xlsx أو .xls)"]);
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    processFile(selectedFile);
  };

  const processFile = async (file: File) => {
    try {
      setIsProcessing(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const parsedTeachers: TeacherData[] = [];
      const newErrors: string[] = [];

      jsonData.forEach((row: any, index: number) => {
        const rowNum = index + 2; // Excel row number (1-indexed + header)
        
        // Expected columns: الاسم، رقم التلفون، المادة، كود المعلم، الرسوم الافتراضية
        const name = row['الاسم'] || row['اسم المعلم'] || row['Name'] || '';
        const mobile_phone = row['رقم التلفون'] || row['التلفون'] || row['Phone'] || '';
        const subject = row['المادة'] || row['المادة الدراسية'] || row['Subject'] || '';
        const teacher_code = row['كود المعلم'] || row['Teacher Code'] || '';
        const default_class_fee = Number(row['الرسوم الافتراضية'] || row['Default Fee'] || 0);

        if (!name || name.toString().trim() === '') {
          newErrors.push(`الصف ${rowNum}: اسم المعلم مطلوب`);
          return;
        }

        parsedTeachers.push({
          name: name.toString().trim(),
          mobile_phone: mobile_phone ? mobile_phone.toString().trim() : undefined,
          subject: subject ? subject.toString().trim() : undefined,
          teacher_code: teacher_code ? teacher_code.toString().trim() : undefined,
          default_class_fee: default_class_fee || 0
        });
      });

      if (newErrors.length > 0) {
        setErrors(newErrors);
        setParsedData([]);
      } else {
        setParsedData(parsedTeachers);
        setErrors([]);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      setErrors(['خطأ في معالجة الملف. تأكد من أن الملف صالح.']);
      setParsedData([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpload = () => {
    if (parsedData.length === 0) return;
    uploadMutation.mutate(parsedData);
  };

  const handleClose = () => {
    setIsOpen(false);
    setFile(null);
    setParsedData([]);
    setErrors([]);
    setIsProcessing(false);
    setProgress({ current: 0, total: 0, currentItem: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'الاسم': 'أحمد محمد',
        'رقم التلفون': '01234567890',
        'المادة': 'الرياضيات',
        'كود المعلم': 'T001',
        'الرسوم الافتراضية': 100
      },
      {
        'الاسم': 'فاطمة علي',
        'رقم التلفون': '01987654321',
        'المادة': 'اللغة العربية',
        'كود المعلم': 'T002',
        'الرسوم الافتراضية': 120
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المعلمون');
    XLSX.writeFile(wb, 'قالب_المعلمين.xlsx');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            رفع بيانات المعلمين من ملف Excel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">تعليمات الرفع</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  يمكنك رفع ملف Excel يحتوي على بيانات المعلمين بالأعمدة التالية:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>الاسم</strong> (مطلوب)</li>
                  <li><strong>رقم التلفون</strong> (اختياري)</li>
                  <li><strong>المادة</strong> (اختياري - يجب أن تكون موجودة في النظام)</li>
                  <li><strong>كود المعلم</strong> (اختياري - سيتم توليده تلقائياً إذا لم يُحدد)</li>
                  <li><strong>الرسوم الافتراضية</strong> (اختياري - افتراضي: 0)</li>
                </ul>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={downloadTemplate}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  تحميل قالب Excel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="excel-file">اختر ملف Excel</Label>
              <Input
                id="excel-file"
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="mt-2"
              />
            </div>

            {/* Processing indicator */}
            {isProcessing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري معالجة الملف...
              </div>
            )}

            {/* Upload progress */}
            {uploadMutation.isPending && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>جاري الرفع...</span>
                  <span>{progress.current} / {progress.total}</span>
                </div>
                <Progress 
                  value={(progress.current / progress.total) * 100} 
                  className="w-full"
                />
                {progress.currentItem && (
                  <p className="text-xs text-muted-foreground">
                    جاري معالجة: {progress.currentItem}
                  </p>
                )}
              </div>
            )}

            {/* Errors */}
            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">تم العثور على أخطاء:</p>
                    <ul className="list-disc list-inside text-sm">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Preview */}
            {parsedData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    معاينة البيانات ({parsedData.length} معلم)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right p-2">الاسم</th>
                          <th className="text-right p-2">التلفون</th>
                          <th className="text-right p-2">المادة</th>
                          <th className="text-right p-2">كود المعلم</th>
                          <th className="text-right p-2">الرسوم</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.slice(0, 10).map((teacher, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{teacher.name}</td>
                            <td className="p-2">{teacher.mobile_phone || '-'}</td>
                            <td className="p-2">{teacher.subject || '-'}</td>
                            <td className="p-2">{teacher.teacher_code || 'سيتم توليده'}</td>
                            <td className="p-2">{teacher.default_class_fee || 0}</td>
                          </tr>
                        ))}
                        {parsedData.length > 10 && (
                          <tr>
                            <td colSpan={5} className="p-2 text-center text-muted-foreground">
                              ... و {parsedData.length - 10} معلم آخر
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              إلغاء
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={parsedData.length === 0 || uploadMutation.isPending || isProcessing}
              className="gap-2"
            >
              {uploadMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              رفع البيانات ({parsedData.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};