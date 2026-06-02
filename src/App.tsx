import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { DarkModeProvider } from './context/DarkModeContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
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
import AuditTrail from './pages/AuditTrail';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import { getRouterBasename } from './utils/appBase';

const routerBasename = getRouterBasename();

function PrivateRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading DICT MRIS...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ProtectedRoute requiredPermission="dashboard.view"><Dashboard /></ProtectedRoute>} />
        <Route
          path="/map"
          element={
            <ProtectedRoute requiredPermission="map.view">
              <ErrorBoundary
                title="Map could not be displayed"
                message="The map hit a rendering problem. Check location coordinates and project data, then try again."
              >
                <MapView />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route path="/freewifi" element={<ProtectedRoute requiredPermission="logs.view"><FreeWifi /></ProtectedRoute>} />
        <Route path="/dict-projects" element={<ProtectedRoute requiredPermission="projects.view"><DictProjects /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute requiredPermission="users.manage"><UsersPage /></ProtectedRoute>} />
        <Route path="/roles" element={<ProtectedRoute requiredPermission="users.manage"><RolesPage /></ProtectedRoute>} />
        <Route path="/audit" element={<ProtectedRoute requiredPermission="audit.view"><AuditTrail /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute requiredPermission="reports.view"><Reports /></ProtectedRoute>} />
        <Route path="/schema" element={<ProtectedRoute requiredPermission="users.manage"><SchemaSpec /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DarkModeProvider>
      <ToastProvider>
        <BrowserRouter basename={routerBasename}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*" element={<PrivateRoutes />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
      </DarkModeProvider>
    </AuthProvider>
  );
}
