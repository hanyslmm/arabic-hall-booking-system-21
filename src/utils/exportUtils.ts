import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[], filename: string, sheetName: string = 'البيانات') => {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const fullFilename = `${filename}_${timestamp}.xlsx`;
    
    // Write file
    XLSX.writeFile(workbook, fullFilename);
    
    return { success: true, filename: fullFilename };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'فشل في التصدير' };
  }
};

export const exportStudentsToExcel = (students: any[]) => {
  const exportData = students.map(student => ({
    'الرقم التسلسلي': student.serial_number || '-',
    'الاسم': student.name,
    'رقم الهاتف': student.mobile_phone,
    'تاريخ التسجيل': new Date(student.created_at).toLocaleDateString('ar-EG'),
  }));
  
  return exportToExcel(exportData, 'الطلاب', 'قائمة الطلاب');
};

export const exportExpensesToExcel = (expenses: any[]) => {
  const exportData = expenses.map(expense => ({
    'التاريخ': new Date(expense.date).toLocaleDateString('ar-EG'),
    'الوصف': expense.description,
    'الفئة': expense.category,
    'المبلغ': expense.amount,
    'طريقة الدفع': expense.payment_method,
    'الملاحظات': expense.notes || '-',
  }));
  
  return exportToExcel(exportData, 'المصروفات', 'قائمة المصروفات');
};