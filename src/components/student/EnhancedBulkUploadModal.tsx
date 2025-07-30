import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, AlertCircle, FileSpreadsheet, Users, Clock } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teachersApi } from '@/utils/refactored-api';
import { hallsApi } from '@/utils/refactored-api';
import { studentsApi, studentRegistrationsApi } from '@/api/students';
import { bookingsApi } from '@/api/bookings';

interface EnhancedBulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedClassData {
  sheetName: string;
  teacherName: string;
  dayOfWeek: string;
  time: string;
  isPM: boolean;
  students: StudentDataRow[];
}

interface StudentDataRow {
  name: string;
  mobile: string;
  home: string; // parent mobile
  city: string;
  payment: number; // from "Dars" column
}

interface ProcessingProgress {
  currentSheet: number;
  totalSheets: number;
  currentStep: string;
  isComplete: boolean;
}

export function EnhancedBulkUploadModal({ isOpen, onClose }: EnhancedBulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedClassData[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress>({
    currentSheet: 0,
    totalSheets: 0,
    currentStep: '',
    isComplete: false
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch teachers and halls for mapping
  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: teachersApi.getAll
  });

  const { data: halls = [] } = useQuery({
    queryKey: ['halls'],
    queryFn: hallsApi.getAll
  });

  const uploadMutation = useMutation({
    mutationFn: async (classData: ParsedClassData[]) => {
      setProcessing(true);
      
      for (let i = 0; i < classData.length; i++) {
        const classInfo = classData[i];
        setProgress({
          currentSheet: i + 1,
          totalSheets: classData.length,
          currentStep: `Processing ${classInfo.sheetName}`,
          isComplete: false
        });

        await processClassRegistrations(classInfo);
      }

      setProgress(prev => ({ ...prev, isComplete: true, currentStep: 'Complete!' }));
      setProcessing(false);
    },
    onSuccess: () => {
      toast({ title: 'تم رفع البيانات بنجاح', description: 'تم تسجيل جميع الطلاب في الفصول المحددة' });
      queryClient.invalidateQueries({ queryKey: ['student-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      handleClose();
    },
    onError: (error) => {
      setProcessing(false);
      toast({ title: 'خطأ في رفع البيانات', description: String(error), variant: 'destructive' });
    }
  });

  const parseSheetName = (sheetName: string) => {
    // Parse format: B_SUN_9 = Basim, Sunday, 9 AM (or 6 PM if < 9)
    const parts = sheetName.split('_');
    if (parts.length !== 3) return null;

    const [teacherCode, dayCode, timeStr] = parts;
    const time = parseInt(timeStr);
    
    // Map teacher codes to names
    const teacherMap: Record<string, string> = {
      'B': 'Basim',
      'R': 'Rashid',
      // Add more mappings as needed
    };

    // Map day codes
    const dayMap: Record<string, string> = {
      'SUN': 'sunday',
      'MON': 'monday',
      'TUE': 'tuesday',
      'WED': 'wednesday',
      'THU': 'thursday',
      'FRI': 'friday',
      'SAT': 'saturday'
    };

    const teacherName = teacherMap[teacherCode] || teacherCode;
    const dayOfWeek = dayMap[dayCode] || dayCode.toLowerCase();
    const isPM = time < 9;
    const displayTime = isPM ? `${time}:00 PM` : `${time}:00 AM`;

    return {
      teacherName,
      dayOfWeek,
      time: displayTime,
      isPM,
      hourValue: time
    };
  };

  const processClassRegistrations = async (classData: ParsedClassData) => {
    try {
      // Find matching teacher
      const teacher = teachers.find(t => 
        t.name.toLowerCase().includes(classData.teacherName.toLowerCase()) ||
        classData.teacherName.toLowerCase().includes(t.name.toLowerCase())
      );

      if (!teacher) {
        throw new Error(`Teacher not found: ${classData.teacherName}`);
      }

      // Find matching booking for this teacher, day, and time
      const bookings = await bookingsApi.getAll();
      const targetBooking = bookings.find(b => 
        b.teacher_id === teacher.id &&
        b.days_of_week.includes(classData.dayOfWeek) &&
        b.start_time === formatTimeForDB(classData.time)
      );

      if (!targetBooking) {
        throw new Error(`No booking found for ${classData.teacherName} on ${classData.dayOfWeek} at ${classData.time}`);
      }

      // Clear existing registrations for this booking
      const existingRegistrations = await studentRegistrationsApi.getAll();
      const toDelete = existingRegistrations.filter(reg => reg.booking_id === targetBooking.id);
      
      for (const reg of toDelete) {
        await studentRegistrationsApi.delete(reg.id);
      }

      // Process students
      for (const studentData of classData.students) {
        // Find or create student
        let student = await findOrCreateStudent(studentData);
        
        // Create registration
        const registration = await studentRegistrationsApi.create({
          student_id: student.id,
          booking_id: targetBooking.id,
          total_fees: studentData.payment,
          notes: `Bulk upload from ${classData.sheetName}`
        });

        // Create payment record if payment > 0
        if (studentData.payment > 0) {
          const { paymentsApi } = await import('@/api/students');
          await paymentsApi.create({
            student_registration_id: registration.id,
            amount: studentData.payment,
            payment_method: 'cash',
            notes: `Bulk upload payment from ${classData.sheetName}`
          });
        }
      }
    } catch (error) {
      console.error(`Error processing class ${classData.sheetName}:`, error);
      throw error;
    }
  };

  const formatTimeForDB = (timeStr: string): string => {
    // Convert "9:00 AM" or "6:00 PM" to "09:00:00" or "18:00:00"
    const [time, period] = timeStr.split(' ');
    const [hour] = time.split(':');
    let hourNum = parseInt(hour);
    
    if (period === 'PM' && hourNum !== 12) {
      hourNum += 12;
    } else if (period === 'AM' && hourNum === 12) {
      hourNum = 0;
    }
    
    return `${hourNum.toString().padStart(2, '0')}:00:00`;
  };

  const findOrCreateStudent = async (studentData: StudentDataRow) => {
    // Search for existing student by mobile
    const existingStudents = await studentsApi.search(studentData.mobile);
    
    if (existingStudents.length > 0) {
      return existingStudents[0];
    }

    // Create new student
    return await studentsApi.create({
      name: studentData.name,
      mobile_phone: studentData.mobile,
      parent_phone: studentData.home,
      city: studentData.city
    });
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
      const errorList: string[] = [];
      const classDataList: ParsedClassData[] = [];

      // Process each sheet
      for (const sheetName of workbook.SheetNames) {
        const parsedSheetInfo = parseSheetName(sheetName);
        
        if (!parsedSheetInfo) {
          errorList.push(`Invalid sheet name format: ${sheetName}`);
          continue;
        }

        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const students: StudentDataRow[] = [];

        jsonData.forEach((row: any, index: number) => {
          // Skip rows without names
          if (!row.Name || !row.Name.toString().trim()) {
            return;
          }

          const name = row.Name.toString().trim();
          const mobile = normalizeMobileNumber(row.Mobile);
          const home = normalizeMobileNumber(row.Home);
          const city = row.City?.toString().trim() || '';
          const payment = getPaymentValue(row, 'Dars'); // Use "Dars" column for payment

          // Validate mobile numbers
          const mobileRegex = /^01[0-9]{9}$/;
          if (mobile && !mobileRegex.test(mobile)) {
            errorList.push(`${sheetName} - Row ${index + 2}: Invalid mobile number "${mobile}"`);
          }

          students.push({
            name,
            mobile,
            home,
            city,
            payment
          });
        });

        classDataList.push({
          sheetName,
          teacherName: parsedSheetInfo.teacherName,
          dayOfWeek: parsedSheetInfo.dayOfWeek,
          time: parsedSheetInfo.time,
          isPM: parsedSheetInfo.isPM,
          students
        });
      }

      setErrors(errorList);
      setParsedData(classDataList);

      if (errorList.length === 0) {
        toast({ 
          title: 'تم تحليل الملف بنجاح', 
          description: `تم العثور على ${classDataList.length} فصل و ${classDataList.reduce((sum, cls) => sum + cls.students.length, 0)} طالب` 
        });
      } else {
        toast({ 
          title: 'تحذير', 
          description: `تم العثور على ${errorList.length} خطأ في البيانات`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      setErrors(['خطأ في قراءة الملف. تأكد من أن الملف Excel صالح.']);
      toast({ title: 'خطأ في تحميل الملف', variant: 'destructive' });
    }
  };

  const normalizeMobileNumber = (mobile: any): string => {
    if (!mobile) return '';
    const digits = mobile.toString().replace(/\D/g, '');
    if (digits.length === 10 && !digits.startsWith('0')) {
      return '0' + digits;
    }
    return digits;
  };

  const getPaymentValue = (row: any, primaryColumn: string): number => {
    // Check the primary column first, then fallbacks
    const possibleColumns = [primaryColumn, 'Payment', 'payment', 'المدفوع', 'مدفوع'];
    
    for (const col of possibleColumns) {
      if (row[col] !== undefined && row[col] !== null && row[col] !== '') {
        const num = Number(row[col].toString().replace(/\D/g, ''));
        return isNaN(num) ? 0 : Math.max(0, num);
      }
    }
    return 0;
  };

  const handleUpload = () => {
    if (parsedData.length === 0) {
      toast({ title: 'لا توجد بيانات للرفع', variant: 'destructive' });
      return;
    }

    uploadMutation.mutate(parsedData);
  };

  const handleClose = () => {
    setFile(null);
    setErrors([]);
    setParsedData([]);
    setProcessing(false);
    setProgress({ currentSheet: 0, totalSheets: 0, currentStep: '', isComplete: false });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            رفع جداول المعلمين المجمعة
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instructions */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <h3 className="font-medium mb-2">تعليمات الرفع:</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• الملف يجب أن يحتوي على عدة sheets، كل sheet يمثل فصل</li>
              <li>• اسم الـ sheet يجب أن يكون بالصيغة: B_SUN_9 (B=باسم، SUN=الأحد، 9=الساعة)</li>
              <li>• الأرقام أقل من 9 تعني مساءً، 9 فما فوق تعني صباحاً</li>
              <li>• العمود "Dars" يحتوي على المدفوعات</li>
              <li>• العمود "Home" يحتوي على رقم ولي الأمر</li>
            </ul>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>رفع ملف Excel متعدد الـ Sheets</Label>
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={processing}
            />
          </div>

          {/* Processing Progress */}
          {processing && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">جاري المعالجة...</span>
              </div>
              <Progress value={(progress.currentSheet / progress.totalSheets) * 100} />
              <p className="text-sm text-muted-foreground">
                {progress.currentStep} ({progress.currentSheet}/{progress.totalSheets})
              </p>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">تم العثور على الأخطاء التالية:</p>
                  <ul className="list-disc list-inside space-y-1 max-h-32 overflow-y-auto">
                    {errors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {parsedData.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                معاينة الفصول ({parsedData.length} فصل)
              </h3>
              <div className="grid gap-4 max-h-96 overflow-y-auto">
                {parsedData.map((classData, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{classData.sheetName}</h4>
                        <p className="text-sm text-muted-foreground">
                          المعلم: {classData.teacherName} • اليوم: {classData.dayOfWeek} • الوقت: {classData.time}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {classData.students.length} طالب
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <p>إجمالي المدفوعات: {classData.students.reduce((sum, s) => sum + s.payment, 0)} جنيه</p>
                      <div className="mt-2">
                        <p className="font-medium">عينة من الطلاب:</p>
                        <ul className="text-muted-foreground">
                          {classData.students.slice(0, 3).map((student, idx) => (
                            <li key={idx}>• {student.name} ({student.mobile}) - {student.payment} جنيه</li>
                          ))}
                          {classData.students.length > 3 && (
                            <li>... و {classData.students.length - 3} طالب آخرين</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button variant="outline" onClick={handleClose} disabled={processing}>
              إلغاء
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={parsedData.length === 0 || processing}
            >
              <Upload className="h-4 w-4 ml-2" />
              {processing ? 'جاري المعالجة...' : 'رفع البيانات'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}