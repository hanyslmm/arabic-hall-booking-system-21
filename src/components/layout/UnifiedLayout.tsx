import { useAuth } from "@/hooks/useAuth";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Navbar } from "@/components/layout/Navbar";
import { ReceptionistDashboard } from "@/components/receptionist/ReceptionistDashboard";

interface UnifiedLayoutProps {
  children: React.ReactNode;
}

export function UnifiedLayout({ children }: UnifiedLayoutProps) {
  const { profile, isAdmin, isOwner, canManageUsers } = useAuth();
  
  const hasAdminAccess = isAdmin || isOwner || canManageUsers;
  
  // Check if this is the index/dashboard page for receptionist view
  const isIndexPage = window.location.pathname === '/' || window.location.pathname === '/index';

  // All admin users get the consistent AdminSidebar
  if (hasAdminAccess) {
    return (
      <AdminSidebar>
        {/* Show receptionist dashboard on index page, otherwise show regular content */}
        {isIndexPage ? <ReceptionistDashboard /> : children}
      </AdminSidebar>
    );
  }

  // Regular users get the top navbar
  return (
    <>
      <Navbar 
        userRole={profile?.user_role} 
        userName={profile?.full_name || profile?.email || undefined}
        isAdmin={isAdmin}
      />
      <main className="container mx-auto p-4 pt-20">
        {isIndexPage ? <ReceptionistDashboard /> : children}
      </main>
    </>
  );
}