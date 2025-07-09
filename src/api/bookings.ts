import { supabase } from "@/integrations/supabase/client";

export type Booking = {
  id: string;
  hall_id: string;
  teacher_id: string;
  academic_stage_id: string;
  subject: string;
  start_time: string;
  end_time: string;
  date: string;
  status: "confirmed" | "pending" | "cancelled";
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  // Add other fields as needed
};

export const getBookings = async (): Promise<Booking[]> => {
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      halls(name),
      teachers(name),
      academic_stages(name)
    `)
    .order("date", { ascending: false });
  if (error) throw error;
  return data as Booking[];
};

export const addBooking = async (booking: Omit<Booking, "id" | "created_at" | "updated_at" | "created_by">) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("غير مصرح");
  const { data, error } = await supabase
    .from("bookings")
    .insert([{ ...booking, created_by: user.user.id }])
    .select()
    .single();
  if (error) throw error;
  return data as Booking;
};

export const updateBooking = async (id: string, updates: Partial<Booking>) => {
  const { data, error } = await supabase
    .from("bookings")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Booking;
};

export const deleteBooking = async (id: string) => {
  const { error } = await supabase.from("bookings").delete().eq("id", id);
  if (error) throw error;
  return id;
};

export const getBookingsByDate = async (date: string): Promise<Booking[]> => {
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      halls(name),
      teachers(name),
      academic_stages(name)
    `)
    .eq("date", date)
    .order("start_time");
  if (error) throw error;
  return data as Booking[];
};
