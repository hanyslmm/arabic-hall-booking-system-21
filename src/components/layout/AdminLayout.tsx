import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { useAuth } from "@/hooks/useAuth";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { isAdmin } = useAuth();
  
  if (!isAdmin) {
    return <>{children}</>;
  }

  return <AdminSidebar>{children}</AdminSidebar>;
}
