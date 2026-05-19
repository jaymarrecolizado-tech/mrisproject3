import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/auth/LoginPage';
import Dashboard from './pages/Dashboard';
import MapView from './pages/MapView';
import FreeWifi from './pages/FreeWifi';
import DictProjects from './pages/DictProjects';
import Reports from './pages/Reports';
import SchemaSpec from './pages/SchemaSpec';
import UsersPage from './pages/Users';
import RolesPage from './pages/Roles';

function PrivateRoutes() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute><MapView /></ProtectedRoute>} />
        <Route path="/freewifi" element={<ProtectedRoute><FreeWifi /></ProtectedRoute>} />
        <Route path="/dict-projects" element={<ProtectedRoute><DictProjects /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
        <Route path="/roles" element={<ProtectedRoute><RolesPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/schema" element={<ProtectedRoute><SchemaSpec /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*" element={<PrivateRoutes />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
