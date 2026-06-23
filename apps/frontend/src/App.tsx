import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { Departments } from './pages/Departments';
import { Users } from './pages/Users';
import { Documents } from './pages/Documents';
import { SOPs } from './pages/SOPs';
import { GlobalLayout } from './components/ui';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleProtectedRoute } from './components/RoleProtectedRoute';
import { ToastProvider } from './components/ui';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <GlobalLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route
              path="departments"
              element={
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <Departments />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="users"
              element={
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <Users />
                </RoleProtectedRoute>
              }
            />
            <Route path="documents" element={<Documents />} />
            <Route path="sops" element={<SOPs />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
