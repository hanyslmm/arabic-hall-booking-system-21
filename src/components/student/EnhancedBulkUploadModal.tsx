import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface HallSelection {
  sheetName: string;
  availableHalls: any[];
  selectedHallId?: string;
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
  const [hallSelections, setHallSelections] = useState<HallSelection[]>([]);
  const [showHallSelectionDialog, setShowHallSelectionDialog] = useState(false);
  
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
    mutationFn: async (data: { classData: ParsedClassData[], hallSelections: HallSelection[] }) => {
      const { classData, hallSelections: selectedHalls } = data;
      setProcessing(true);
      
      for (let i = 0; i < classData.length; i++) {
        const classInfo = classData[i];
        setProgress({
          currentSheet: i + 1,
          totalSheets: classData.length,
          currentStep: `Processing ${classInfo.sheetName}`,
          isComplete: false
        });

        await processClassRegistrations(classInfo, selectedHalls);
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
    // Parse format: B_SAT_1_PM or B_SAT_1_AM = Basim, Saturday, 1 PM/AM
    const parts = sheetName.split('_');
    if (parts.length < 3 || parts.length > 4) return null;

    const [teacherCode, dayCode, timeStr, amPmStr] = parts;
    const time = parseInt(timeStr);
    
    // Determine AM/PM - if explicitly provided, use it; otherwise use old logic for backward compatibility
    let isPM: boolean;
    let amPm: string;
    
    if (amPmStr && (amPmStr.toUpperCase() === 'AM' || amPmStr.toUpperCase() === 'PM')) {
      isPM = amPmStr.toUpperCase() === 'PM';
      amPm = amPmStr.toUpperCase();
    } else {
      // Fallback to old logic for backward compatibility
      isPM = time < 9;
      amPm = isPM ? 'PM' : 'AM';
    }
    
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
    const displayTime = `${time}:00 ${amPm}`;

    return {
      teacherName,
      dayOfWeek,
      time: displayTime,
      isPM,
      hourValue: time,
      amPm
    };
  };

  const processClassRegistrations = async (classData: ParsedClassData, selectedHalls: HallSelection[]) => {
    try {
      // Find matching teacher
      const teacher = teachers.find(t => 
        t.name.toLowerCase().includes(classData.teacherName.toLowerCase()) ||
        classData.teacherName.toLowerCase().includes(t.name.toLowerCase())
      );

      if (!teacher) {
        throw new Error(`Teacher not found: ${classData.teacherName}`);
      }

      // Generate class code from sheet name (this is our unique identifier)
      const parsedSheetInfo = parseSheetName(classData.sheetName);
      const classCode = `${classData.sheetName}_${parsedSheetInfo?.amPm || (classData.isPM ? 'PM' : 'AM')}`;

      // Find existing booking by class_code first (this is the most reliable way)
      const bookings = await bookingsApi.getAll();
      let targetBooking = bookings.find(b => b.class_code === classCode);

      // Get hall selection for this class
      const hallSelection = selectedHalls.find(h => h.sheetName === classData.sheetName);
      const selectedHall = hallSelection ? halls.find(h => h.id === hallSelection.selectedHallId) : halls[0];
      
      if (!selectedHall) {
        throw new Error(`No hall selected for ${classData.sheetName}`);
      }

      // If booking exists, update it with new information
      if (targetBooking) {
        // Update booking with potentially new teacher, time, hall, etc.
        targetBooking = await bookingsApi.update(targetBooking.id, {
          teacher_id: teacher.id,
          hall_id: selectedHall.id,
          number_of_students: classData.students.length,
          start_time: formatTimeForDB(classData.time),
          days_of_week: [classData.dayOfWeek],
          class_code: classCode,
          status: 'active' as const
        });
      } else {
        // Create new booking
        const { bookingsApi: bookingApi } = await import('@/api/bookings');
        targetBooking = await bookingApi.create({
          teacher_id: teacher.id,
          hall_id: selectedHall.id,
          academic_stage_id: halls[0]?.id || '', // Use first available stage as default
          number_of_students: classData.students.length,
          start_time: formatTimeForDB(classData.time),
          start_date: new Date().toISOString().split('T')[0],
          days_of_week: [classData.dayOfWeek],
          class_code: classCode,
          status: 'active' as const
        });
      }

      // Clear ALL existing registrations and payments for this class_code
      // This ensures we remove old incorrect data when re-uploading
      const existingRegistrations = await studentRegistrationsApi.getAll();
      const registrationsToDelete = existingRegistrations.filter(reg => reg.booking_id === targetBooking.id);
      
      // Delete payments first (due to foreign key constraints)
      const { paymentsApi } = await import('@/api/students');
      
      for (const reg of registrationsToDelete) {
        // Delete all payments for this registration
        const paymentsForRegistration = await paymentsApi.getByRegistration(reg.id);
        for (const payment of paymentsForRegistration) {
          await paymentsApi.delete(payment.id);
        }
        
        // Then delete the registration
        await studentRegistrationsApi.delete(reg.id);
      }

      // Process students with new data
      for (const studentData of classData.students) {
        // Find or create student (preserving existing student profiles)
        let student = await findOrCreateStudent(studentData);
        
        // Create new registration
        const registration = await studentRegistrationsApi.create({
          student_id: student.id,
          booking_id: targetBooking.id,
          total_fees: targetBooking.class_fees || 0, // Use booking's class fees, not individual payment
          notes: `Bulk upload from ${classData.sheetName} - ${new Date().toISOString().split('T')[0]}`
        });

        // Create payment record if payment > 0
        if (studentData.payment > 0) {
          await paymentsApi.create({
            student_registration_id: registration.id,
            amount: studentData.payment,
            payment_date: new Date().toISOString().split('T')[0],
            payment_method: 'cash',
            notes: `Bulk upload payment from ${classData.sheetName} - ${new Date().toISOString().split('T')[0]}`
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
      console.log('Starting file processing...');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const errorList: string[] = [];
      const classDataList: ParsedClassData[] = [];
      
      console.log('Workbook sheet names:', workbook.SheetNames);

      // Process each sheet
      for (const sheetName of workbook.SheetNames) {
        console.log(`Processing sheet: ${sheetName}`);
        const parsedSheetInfo = parseSheetName(sheetName);
        
        if (!parsedSheetInfo) {
          errorList.push(`Invalid sheet name format: ${sheetName}. Expected format: Teacher_Day_Time (e.g., B_SAT_9)`);
          continue;
        }

        const worksheet = workbook.Sheets[sheetName];
        
        if (!worksheet) {
          errorList.push(`Cannot read sheet: ${sheetName}`);
          continue;
        }
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (!Array.isArray(jsonData) || jsonData.length === 0) {
          errorList.push(`Sheet "${sheetName}" is empty or contains no valid data`);
          continue;
        }
        
        // Debug: Log the first row to see the structure
        if (jsonData.length > 0) {
          console.log(`Sheet ${sheetName} first row:`, jsonData[0]);
          console.log(`Sheet ${sheetName} keys:`, Object.keys(jsonData[0]));
          
          // Check for payment columns specifically
          const paymentColumns = Object.keys(jsonData[0]).filter(key => 
            key.toLowerCase().includes('dars') || 
            key.includes('الرسوم') || 
            key.includes('رسوم') ||
            key.toLowerCase().includes('payment') ||
            key.includes('مدفوع')
          );
          console.log(`Sheet ${sheetName} potential payment columns:`, paymentColumns);
        }

        const students: StudentDataRow[] = [];

        jsonData.forEach((row: any, index: number) => {
          try {
            // Find name field with flexible naming
            const nameField = row.Name || row.name || row.الاسم || row.اسم || 
                             Object.values(row)[1]; // Fallback to second column (index 1)
            
            // Skip rows without names
            if (!nameField || (typeof nameField !== 'string' && typeof nameField !== 'number')) {
              return;
            }

            const name = nameField.toString().trim();
            if (!name) {
              return;
            }

            // Find mobile field with flexible naming
            const mobileField = row.Mobile || row.mobile || row.الموبايل || row.موبايل || row.جوال ||
                               Object.values(row)[2]; // Fallback to third column (index 2)
            
            const mobile = normalizeMobileNumber(mobileField);
            
            // Find home field with flexible naming
            const homeField = row.Home || row.home || row.المنزل || row.هاتف ||
                             Object.values(row)[3]; // Fallback to fourth column (index 3)
            
            const home = normalizeMobileNumber(homeField);
            
            // Find city field with flexible naming
            const cityField = row.City || row.city || row.المدينة ||
                             Object.values(row)[4]; // Fallback to fifth column (index 4)
            
            const city = cityField?.toString().trim() || '';
            
            // Try to find the payment column more intelligently
            const paymentColumnCandidates = Object.keys(row).filter(key => {
              const keyLower = key.toLowerCase();
              return keyLower.includes('dars') || 
                     keyLower.includes('الرسوم') || 
                     keyLower.includes('رسوم') ||
                     keyLower.includes('مدفوع') ||
                     keyLower.includes('payment') ||
                     keyLower.includes('fee') ||
                     keyLower.includes('amount');
            });
            
            console.log(`Row ${index + 2} payment column candidates:`, paymentColumnCandidates);
            console.log(`Row ${index + 2} data:`, row);
            
            const payment = getPaymentValue(row, paymentColumnCandidates[0] || 'Dars');

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
          } catch (rowError) {
            errorList.push(`${sheetName} - Row ${index + 2}: Error processing row - ${rowError}`);
          }
        });

        // Validate that we have students with required data
        if (students.length === 0) {
          errorList.push(`Sheet "${sheetName}" contains no valid students. Please check that the sheet has Name and Mobile columns with valid data.`);
          continue;
        }
        
        // Additional validation - check if we have at least some valid mobile numbers
        const validMobileCount = students.filter(s => s.mobile && s.mobile.length > 0).length;
        if (validMobileCount === 0) {
          errorList.push(`Sheet "${sheetName}" contains students but no valid mobile numbers. Please check the Mobile column format.`);
        }

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

      // Generate hall selections for all classes
      const hallSelectionsNeeded: HallSelection[] = classDataList.map(classData => ({
        sheetName: classData.sheetName,
        availableHalls: halls || [],
        selectedHallId: halls?.[0]?.id // Default to first hall
      }));
      
      setHallSelections(hallSelectionsNeeded);

      if (errorList.length === 0) {
        if (hallSelectionsNeeded.length > 0) {
          setShowHallSelectionDialog(true);
        }
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
      console.error('File processing error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setErrors([`خطأ في قراءة الملف: ${errorMessage}. تأكد من أن الملف Excel صالح.`]);
      toast({ 
        title: 'خطأ في تحميل الملف', 
        description: errorMessage,
        variant: 'destructive' 
      });
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
    const possibleColumns = [
      primaryColumn, 
      'Payment', 
      'payment', 
      'المدفوع', 
      'مدفوع',
      'الرسوم',
      'رسوم',
      'Fee',
      'Fees',
      'fees',
      'Amount',
      'amount',
      'Dars',
      'dars'
    ];
    
    // Also check for columns that contain these keywords
    const allColumns = Object.keys(row);
    const matchingColumns = allColumns.filter(col => {
      const colLower = col.toLowerCase();
      return possibleColumns.some(possible => 
        colLower.includes(possible.toLowerCase()) || 
        possible.toLowerCase().includes(colLower)
      );
    });
    
    // Helper function to extract number from value
    const extractNumber = (value: any): number => {
      if (value === undefined || value === null || value === '') {
        return 0;
      }
      
      const str = value.toString();
      console.log(`Extracting number from: "${str}"`);
      
      // Handle cases where the value is already a number
      if (typeof value === 'number' && !isNaN(value)) {
        console.log(`Direct number: ${value}`);
        return Math.max(0, value);
      }
      
      // Extract all digits from the string
      const digits = str.replace(/\D/g, '');
      console.log(`Extracted digits: "${digits}"`);
      
      if (digits === '') {
        return 0;
      }
      
      const num = Number(digits);
      console.log(`Parsed number: ${num}`);
      
      return isNaN(num) ? 0 : Math.max(0, num);
    };
    
    // Check exact matches first
    for (const col of possibleColumns) {
      if (row[col] !== undefined && row[col] !== null && row[col] !== '') {
        const num = extractNumber(row[col]);
        if (num > 0) {
          console.log(`Found payment in exact column "${col}": ${num} (original value: "${row[col]}")`);
          return num;
        }
      }
    }
    
    // Then check partial matches
    for (const col of matchingColumns) {
      if (row[col] !== undefined && row[col] !== null && row[col] !== '') {
        const num = extractNumber(row[col]);
        if (num > 0) {
          console.log(`Found payment in matching column "${col}": ${num} (original value: "${row[col]}")`);
          return num;
        }
      }
    }
    
    // Debug: Log all available columns and their values if no payment found
    console.log(`No payment found for row. Available columns and values:`);
    Object.keys(row).forEach(key => {
      console.log(`  "${key}": "${row[key]}" (type: ${typeof row[key]})`);
    });
    
    return 0;
  };

  const handleHallSelection = (sheetName: string, hallId: string) => {
    setHallSelections(prev => 
      prev.map(selection => 
        selection.sheetName === sheetName 
          ? { ...selection, selectedHallId: hallId }
          : selection
      )
    );
  };

  const handleUpload = () => {
    if (parsedData.length === 0) {
      toast({ title: 'لا توجد بيانات للرفع', variant: 'destructive' });
      return;
    }

    if (!hallSelections.every(h => h.selectedHallId)) {
      toast({ title: 'يرجى اختيار قاعة لكل فصل', variant: 'destructive' });
      return;
    }

    setShowHallSelectionDialog(false);
    uploadMutation.mutate({ classData: parsedData, hallSelections });
  };

  const handleClose = () => {
    setFile(null);
    setErrors([]);
    setParsedData([]);
    setProcessing(false);
    setProgress({ currentSheet: 0, totalSheets: 0, currentStep: '', isComplete: false });
    setHallSelections([]);
    setShowHallSelectionDialog(false);
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
              <li>• اسم الـ sheet يجب أن يكون بالصيغة: B_SAT_1_PM أو B_SAT_1_AM</li>
              <li>• B=باسم، SAT=السبت، 1=الساعة الواحدة، PM/AM=مساءً/صباحاً</li>
              <li>• استخدم PM للفترة المسائية و AM للفترة الصباحية</li>
              <li>• أعمدة مطلوبة: Name (الاسم)، Mobile (الموبايل)</li>
              <li>• أعمدة اختيارية: Home (رقم ولي الأمر)، City (المدينة)، Dars أو الرسوم (المدفوعات)</li>
              <li>• يجب أن تكون أسماء الأعمدة في الصف الأول</li>
              <li>• بيانات الطلاب تبدأ من الصف الثاني</li>
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

          {/* Hall Selection Dialog */}
          {showHallSelectionDialog && hallSelections.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">اختيار القاعات</h3>
              <p className="text-sm text-muted-foreground">
                يرجى اختيار القاعة المناسبة لكل فصل:
              </p>
              <div className="space-y-3">
                {hallSelections.map((selection) => (
                  <div key={selection.sheetName} className="flex items-center justify-between p-3 border rounded">
                    <span className="font-medium">{selection.sheetName}</span>
                    <div className="min-w-[200px]">
                      <Select
                        value={selection.selectedHallId || ''}
                        onValueChange={(value) => handleHallSelection(selection.sheetName, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر القاعة" />
                        </SelectTrigger>
                        <SelectContent>
                          {selection.availableHalls.map((hall) => (
                            <SelectItem key={hall.id} value={hall.id}>
                              {hall.name} (سعة {hall.capacity} طالب)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {parsedData.length > 0 && !showHallSelectionDialog && (
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
              disabled={parsedData.length === 0 || processing || (showHallSelectionDialog && !hallSelections.every(h => h.selectedHallId))}
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