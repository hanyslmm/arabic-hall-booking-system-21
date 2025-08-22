import { supabase } from "@/integrations/supabase/client";
import { studentsApi } from "@/api/students";

export const generateSerialNumbers = async () => {
  try {
    // Get all students without serial numbers
    const { data: studentsWithoutSerial } = await supabase
      .from('students')
      .select('id, name')
      .or('serial_number.is.null,serial_number.eq.');

    if (!studentsWithoutSerial || studentsWithoutSerial.length === 0) {
      return { updated: 0, message: 'جميع الطلاب لديهم أرقام تسلسلية بالفعل' };
    }

    // Get the highest existing serial number
    const { data: maxSerialData } = await supabase
      .from('students')
      .select('serial_number')
      .not('serial_number', 'is', null)
      .neq('serial_number', '')
      .order('serial_number', { ascending: false })
      .limit(1);

    let currentSerial = 1;
    if (maxSerialData && maxSerialData[0]) {
      const maxSerial = parseInt(maxSerialData[0].serial_number || '0');
      currentSerial = maxSerial + 1;
    }

    // Update each student with a sequential serial number
    const updates = [];
    for (const student of studentsWithoutSerial) {
      const serialNumber = currentSerial.toString().padStart(5, '0');
      
      const { error } = await supabase
        .from('students')
        .update({ serial_number: serialNumber })
        .eq('id', student.id);

      if (!error) {
        updates.push({ id: student.id, name: student.name, serial: serialNumber });
        currentSerial++;
      }
    }

    return {
      updated: updates.length,
      message: `تم توليد ${updates.length} رقم تسلسلي بنجاح`,
      details: updates
    };
  } catch (error) {
    console.error('Error generating serial numbers:', error);
    throw new Error('فشل في توليد الأرقام التسلسلية');
  }
};