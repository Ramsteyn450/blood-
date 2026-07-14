import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
export default function AdminRoute() {
  const user = useAuthStore((s) => s.user);
  return user?.role === 'admin' ? <Outlet /> : <Navigate to="/map" replace />;
}
