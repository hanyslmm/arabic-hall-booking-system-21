import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/api/users";

// Get employee users (owner, manager, space_manager)
export const getEmployeeUsers = async (): Promise<UserProfile[]> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("user_role", ["owner", "manager", "space_manager"])
    .order("created_at", { ascending: false })
    .limit(10000); // Remove 1000 row limit
    
  if (error) throw error;
  
  return data.map((profile: any) => ({
    ...profile,
    phone: profile.phone || null
  })) as UserProfile[];
};

// Get student and teacher users with proper access control
export const getStudentTeacherUsers = async (): Promise<UserProfile[]> => {
  // Get current user to determine access level
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Get current user's profile to check role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
    
  if (profileError) throw new Error("Could not fetch user profile");

  let query = supabase
    .from("profiles")
    .select("*")  // Remove the problematic join
    .in("user_role", ["teacher", "read_only"]);

  // Apply access control based on user role
  if (profile.user_role === "read_only") {
    // Students can only see their own data
    query = query.eq("id", user.id);
  } else if (profile.user_role === "teacher" && profile.teacher_id) {
    // Teachers can see their own data and their students
    // Get students who are registered in classes taught by this teacher
    const { data: teacherBookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("teacher_id", profile.teacher_id);
      
    const bookingIds = teacherBookings?.map(b => b.id) || [];
    
    if (bookingIds.length > 0) {
      // Get student registrations for this teacher's bookings
      const { data: studentRegistrations } = await supabase
        .from("student_registrations")
        .select("students(id)")
        .in("booking_id", bookingIds);
        
      const studentIds = studentRegistrations
        ?.map(sr => (sr as any).students?.id)
        .filter(Boolean) || [];
        
      // Get student accounts for these students
      const { data: studentAccounts } = await supabase
        .from("student_accounts")
        .select("auth_user_id")
        .in("student_id", studentIds);
        
      const studentAuthIds = studentAccounts?.map(sa => sa.auth_user_id) || [];
      
      // Teacher can see their own profile + their students + other teachers
      if (studentAuthIds.length > 0) {
        query = query.or(`id.eq.${user.id},id.in.(${studentAuthIds.join(",")}),user_role.eq.teacher`);
      } else {
        query = query.or(`id.eq.${user.id},user_role.eq.teacher`);
      }
    } else {
      // Teacher with no bookings can only see themselves and other teachers
      query = query.or(`id.eq.${user.id},user_role.eq.teacher`);
    }
  }
  // Admins (owner, manager, space_manager) can see all - no additional filters needed

  const { data, error } = await query.order("created_at", { ascending: false }).limit(10000); // Remove 1000 row limit
  
  if (error) throw error;
  
  // Transform the data and add teacher information if needed
  const results = data.map((profile: any) => ({
    ...profile,
    phone: profile.phone || null
  })) as UserProfile[];

  // If we have users with teacher_id, we could fetch teacher info separately if needed
  // For now, we'll just return the profiles without teacher details
  
  return results;
};