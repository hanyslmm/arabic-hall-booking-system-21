import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/api/users";

export interface UsersPageParams {
  page: number;
  pageSize: number;
  searchTerm?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

// Get employee users (owner, manager, space_manager)
export const getEmployeeUsers = async (params: UsersPageParams): Promise<PaginatedResult<UserProfile>> => {
  const { page, pageSize, searchTerm } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .in("user_role", ["owner", "manager", "space_manager"]);

  if (searchTerm && searchTerm.trim()) {
    const term = `%${searchTerm.trim()}%`;
    query = query.or(`full_name.ilike.${term},email.ilike.${term}`);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  const mapped = (data || []).map((profile: any) => ({
    ...profile,
    phone: profile.phone || null,
  })) as UserProfile[];

  return { data: mapped, total: count || 0 };
};

// Get student and teacher users with proper access control
export const getStudentTeacherUsers = async (params: UsersPageParams): Promise<PaginatedResult<UserProfile>> => {
  const { page, pageSize, searchTerm } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .in("user_role", ["teacher", "read_only"]);

  if (searchTerm && searchTerm.trim()) {
    const term = `%${searchTerm.trim()}%`;
    query = query.or(`full_name.ilike.${term},email.ilike.${term}`);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  const mapped = (data || []).map((profile: any) => ({
    ...profile,
    phone: profile.phone || null,
  })) as UserProfile[];

  return { data: mapped, total: count || 0 };
};