import { supabase } from "@/integrations/supabase/client";

export interface MonthTransitionOptions {
  targetMonth: number;
  targetYear: number;
  preservePaymentStatus?: boolean;
}

/**
 * Handle monthly transition for a specific booking
 * Creates new registrations for the target month with reset payment status
 */
export async function transitionBookingToMonth(
  bookingId: string, 
  options: MonthTransitionOptions
): Promise<{ success: boolean; registrationsCreated: number; error?: string }> {
  try {
    const { targetMonth, targetYear } = options;
    
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

    // Get existing registrations for this booking (from any month)
    const { data: existingRegistrations, error: regError } = await supabase
      .from('student_registrations')
      .select('student_id, total_fees')
      .eq('booking_id', bookingId);
    
    if (regError) {
      return { success: false, registrationsCreated: 0, error: regError.message };
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
    
    // Create new registrations for students not already registered in target month
    const newRegistrations = (existingRegistrations || [])
      .filter(reg => !existingStudentIds.has(reg.student_id))
      .map(reg => ({
        student_id: reg.student_id,
        booking_id: bookingId,
        registration_date: targetMonthStartStr,
        total_fees: reg.total_fees || booking.class_fees || 0,
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
 * Transition all active bookings to the next month
 */
export async function transitionAllBookingsToNextMonth(): Promise<{
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
      const result = await transitionBookingToMonth(booking.id, {
        targetMonth: adjustedMonth,
        targetYear: nextYear
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
