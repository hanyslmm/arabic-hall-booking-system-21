import { supabase } from "@/integrations/supabase/client";

export interface MonthlyResetOptions {
  targetMonth: number;
  targetYear: number;
  bookingId: string;
  resetAttendance?: boolean;
}

/**
 * Create new student registrations for a specific month based on existing registrations
 * This is used for monthly continuation of classes
 */
export async function createMonthlyStudentRegistrations(
  options: MonthlyResetOptions
): Promise<{ success: boolean; registrationsCreated: number; error?: string }> {
  try {
    const { targetMonth, targetYear, bookingId, resetAttendance = true } = options;
    
    // Get the booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();
    
    if (bookingError || !booking) {
      return { success: false, registrationsCreated: 0, error: 'Booking not found' };
    }

    // Check if booking should be active in target month
    const targetMonthStart = new Date(targetYear, targetMonth - 1, 1);
    const targetMonthEnd = new Date(targetYear, targetMonth, 0);
    const bookingStart = new Date(booking.start_date);
    const bookingEnd = booking.end_date ? new Date(booking.end_date) : null;
    
    const isActiveInTargetMonth = bookingStart <= targetMonthEnd && 
      (!bookingEnd || bookingEnd >= targetMonthStart) &&
      booking.status === 'active';
    
    if (!isActiveInTargetMonth) {
      return { success: true, registrationsCreated: 0, error: 'Booking not active in target month' };
    }

    // Get the most recent registrations for this booking (from any previous month)
    const { data: existingRegistrations, error: regError } = await supabase
      .from('student_registrations')
      .select('student_id, total_fees')
      .eq('booking_id', bookingId)
      .order('registration_date', { ascending: false });
    
    if (regError) {
      return { success: false, registrationsCreated: 0, error: regError.message };
    }

    if (!existingRegistrations || existingRegistrations.length === 0) {
      return { success: true, registrationsCreated: 0, error: 'No existing registrations found' };
    }

    // Check which students already have registrations for the target month
    const targetMonthStartStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const targetMonthEndStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetMonthEnd.getDate()).padStart(2, '0')}`;
    
    const { data: existingMonthRegistrations, error: monthRegError } = await supabase
      .from('student_registrations')
      .select('student_id')
      .eq('booking_id', bookingId)
      .gte('registration_date', targetMonthStartStr)
      .lte('registration_date', targetMonthEndStr);
    
    if (monthRegError) {
      return { success: false, registrationsCreated: 0, error: monthRegError.message };
    }

    const existingStudentIds = new Set((existingMonthRegistrations || []).map(r => r.student_id));
    
    // Get unique students from existing registrations (most recent fee for each student)
    const uniqueStudents = new Map();
    existingRegistrations.forEach(reg => {
      if (!uniqueStudents.has(reg.student_id)) {
        uniqueStudents.set(reg.student_id, reg.total_fees);
      }
    });
    
    // Create new registrations for students not already registered in target month
    const newRegistrations = Array.from(uniqueStudents.entries())
      .filter(([studentId]) => !existingStudentIds.has(studentId))
      .map(([studentId, totalFees]) => ({
        student_id: studentId,
        booking_id: bookingId,
        registration_date: targetMonthStartStr,
        total_fees: totalFees || booking.class_fees || 0,
        payment_status: 'pending' as const,
        paid_amount: 0,
      }));

    if (newRegistrations.length === 0) {
      return { success: true, registrationsCreated: 0, error: 'All students already registered for target month' };
    }

    // Insert new registrations
    const { error: insertError } = await supabase
      .from('student_registrations')
      .insert(newRegistrations);
    
    if (insertError) {
      return { success: false, registrationsCreated: 0, error: insertError.message };
    }

    // If resetAttendance is true, clear attendance records for the target month
    if (resetAttendance) {
      // Get the new registration IDs
      const { data: newRegs, error: newRegsError } = await supabase
        .from('student_registrations')
        .select('id')
        .eq('booking_id', bookingId)
        .gte('registration_date', targetMonthStartStr)
        .lte('registration_date', targetMonthEndStr);
      
      if (!newRegsError && newRegs && newRegs.length > 0) {
        const registrationIds = newRegs.map(reg => reg.id);
        
        // Delete existing attendance records for this month
        await supabase
          .from('attendance_records')
          .delete()
          .in('student_registration_id', registrationIds)
          .gte('attendance_date', targetMonthStartStr)
          .lte('attendance_date', targetMonthEndStr);
      }
    }

    return { success: true, registrationsCreated: newRegistrations.length };
  } catch (error) {
    return { 
      success: false, 
      registrationsCreated: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Reset all active bookings to the next month
 * This is typically called at the beginning of each month
 */
export async function resetAllBookingsToNextMonth(): Promise<{
  success: boolean;
  bookingsProcessed: number;
  totalRegistrationsCreated: number;
  errors: string[];
}> {
  const now = new Date();
  const nextMonth = now.getMonth() + 2; // +2 because getMonth() is 0-indexed
  const nextYear = nextMonth > 12 ? now.getFullYear() + 1 : now.getFullYear();
  const adjustedMonth = nextMonth > 12 ? 1 : nextMonth;

  try {
    // Get all active bookings
    const { data: activeBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id')
      .eq('status', 'active');
    
    if (bookingsError) {
      return {
        success: false,
        bookingsProcessed: 0,
        totalRegistrationsCreated: 0,
        errors: [bookingsError.message]
      };
    }

    const results = [];
    const errors: string[] = [];
    let totalCreated = 0;

    for (const booking of activeBookings || []) {
      const result = await createMonthlyStudentRegistrations({
        targetMonth: adjustedMonth,
        targetYear: nextYear,
        bookingId: booking.id,
        resetAttendance: true
      });
      
      results.push(result);
      totalCreated += result.registrationsCreated;
      
      if (!result.success && result.error) {
        errors.push(`Booking ${booking.id}: ${result.error}`);
      }
    }

    return {
      success: errors.length === 0,
      bookingsProcessed: (activeBookings || []).length,
      totalRegistrationsCreated: totalCreated,
      errors
    };
  } catch (error) {
    return {
      success: false,
      bookingsProcessed: 0,
      totalRegistrationsCreated: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}
