import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface StudentRouteGuardProps {
  children: ReactNode;
}

export function StudentRouteGuard({ children }: StudentRouteGuardProps) {
  const { user } = useAuth();
  
  // If user is a student trying to access admin pages, redirect to student dashboard
  if (user?.email?.includes("@student.local")) {
    return <Navigate to="/simple-student-dashboard" replace />;
  }
  
  return <>{children}</>;
}