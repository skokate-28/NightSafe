import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import SkeletonLoader from './ui/SkeletonLoader';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <SkeletonLoader className="h-12 w-12 rounded-full mx-auto" />
          <SkeletonLoader className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
