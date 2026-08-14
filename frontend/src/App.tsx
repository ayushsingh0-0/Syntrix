import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider, AuthProvider, useAuth, OrgProvider } from './context';


// Layout
import { DashboardLayout } from './components/layout/DashboardLayout';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { VerifyEmail } from './pages/auth/VerifyEmail';
import { InviteLanding } from './pages/auth/InviteLanding';

// App Pages
import { OrgOverview } from './pages/organization/OrgOverview';
import { OrgSettings } from './pages/organization/OrgSettings';
import { OrgMembers } from './pages/organization/OrgMembers';
import { OrgInvitations } from './pages/organization/OrgInvitations';
import { Profile } from './pages/profile/Profile';
import { TeamList } from './pages/teams/TeamList';
import { ProjectList } from './pages/projects/ProjectList';
import { ProjectDetail } from './pages/projects/ProjectDetail';

// Public Route Guard (Redirect to home if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return user ? <Navigate to="/" replace /> : <>{children}</>;
};

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <OrgProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Authentication Routes */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <PublicRoute>
                    <ForgotPassword />
                  </PublicRoute>
                }
              />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/invite/:token" element={<InviteLanding />} />

              {/* Protected Workspace Routes */}
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<OrgOverview />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/organization/settings" element={<OrgSettings />} />
                <Route path="/organization/members" element={<OrgMembers />} />
                <Route path="/organization/invitations" element={<OrgInvitations />} />
                <Route path="/organization/teams" element={<TeamList />} />
                <Route path="/projects" element={<ProjectList />} />
                <Route path="/projects/:projectId" element={<ProjectDetail />} />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </OrgProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
