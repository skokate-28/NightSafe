import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MapPage from './pages/MapPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#13131A',
            color: '#e5e5e5',
            border: '1px solid #22222E',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#13131A' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#13131A' } },
        }}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/app/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
        <Route path="/app/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/app/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/app" element={<Navigate to="/app/map" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
