import { Navigate } from 'react-router-dom';
import { authService } from '../services/auth';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ children, allowedRoles }) => {
  const user = authService.getStoredUser();
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};
