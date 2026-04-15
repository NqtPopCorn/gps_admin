import type { ReactNode } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { RoleEnum } from "@/types";
import { getHomePathForRole } from "@/contexts/AuthContext";

interface PrivateRouteProps {
  children: ReactNode;
  allowRoles?: RoleEnum[];
}

export function PrivateRoute({ children, allowRoles }: PrivateRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.warn("User is not authenticated. Redirecting to login.");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowRoles && (!user?.role || !allowRoles.includes(user.role))) {
    console.warn(`Access denied for role: ${user?.role}. Required roles: ${allowRoles.join(", ")}`);
    return <Navigate to={getHomePathForRole(user?.role)} replace />;
  }

  return <>{children}</>;
}
