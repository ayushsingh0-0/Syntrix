import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider, AuthProvider, OrgProvider, ThemeProvider } from './context';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { PageLoader } from './components/common/Skeleton';
import { ProtectedRoute, PublicRoute } from './components/guards/RouteGuards';

// Layout
import { DashboardLayout } from './components/layout/DashboardLayout';

// Lazy-Loaded Auth Pages
const Login = lazy(() => import('./pages/auth/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('./pages/auth/Register').then((m) => ({ default: m.Register })));
const ForgotPassword = lazy(() =>
  import('./pages/auth/ForgotPassword').then((m) => ({ default: m.ForgotPassword }))
);
const ResetPassword = lazy(() =>
  import('./pages/auth/ResetPassword').then((m) => ({ default: m.ResetPassword }))
);
const VerifyEmail = lazy(() =>
  import('./pages/auth/VerifyEmail').then((m) => ({ default: m.VerifyEmail }))
);
const InviteLanding = lazy(() =>
  import('./pages/auth/InviteLanding').then((m) => ({ default: m.InviteLanding }))
);

// Lazy-Loaded App Pages
const OrgOverview = lazy(() =>
  import('./pages/organization/OrgOverview').then((m) => ({ default: m.OrgOverview }))
);
const OrgSettings = lazy(() =>
  import('./pages/organization/OrgSettings').then((m) => ({ default: m.OrgSettings }))
);
const OrgMembers = lazy(() =>
  import('./pages/organization/OrgMembers').then((m) => ({ default: m.OrgMembers }))
);
const OrgInvitations = lazy(() =>
  import('./pages/organization/OrgInvitations').then((m) => ({ default: m.OrgInvitations }))
);
const Profile = lazy(() => import('./pages/profile/Profile').then((m) => ({ default: m.Profile })));
const TeamList = lazy(() =>
  import('./pages/teams/TeamList').then((m) => ({ default: m.TeamList }))
);
const ProjectList = lazy(() =>
  import('./pages/projects/ProjectList').then((m) => ({ default: m.ProjectList }))
);
const ProjectDetail = lazy(() =>
  import('./pages/projects/ProjectDetail').then((m) => ({ default: m.ProjectDetail }))
);
const ProjectBoard = lazy(() =>
  import('./pages/projects/ProjectBoard').then((m) => ({ default: m.ProjectBoard }))
);
const ProjectTaskList = lazy(() =>
  import('./pages/projects/ProjectTaskList').then((m) => ({ default: m.ProjectTaskList }))
);
const ProjectSprints = lazy(() =>
  import('./pages/projects/ProjectSprints').then((m) => ({ default: m.ProjectSprints }))
);
const ProjectAnalytics = lazy(() =>
  import('./pages/projects/ProjectAnalytics').then((m) => ({ default: m.ProjectAnalytics }))
);

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <OrgProvider>
              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
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
                  <Route
                    element={
                      <ProtectedRoute>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/" element={<OrgOverview />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/organization/settings" element={<OrgSettings />} />
                    <Route path="/organization/members" element={<OrgMembers />} />
                    <Route path="/organization/invitations" element={<OrgInvitations />} />
                    <Route path="/organization/teams" element={<TeamList />} />
                    <Route path="/projects" element={<ProjectList />} />
                    <Route path="/projects/:projectId" element={<ProjectDetail />} />
                    <Route path="/projects/:projectId/board" element={<ProjectBoard />} />
                    <Route path="/projects/:projectId/tasks" element={<ProjectTaskList />} />
                    <Route path="/projects/:projectId/sprints" element={<ProjectSprints />} />
                    <Route path="/projects/:projectId/analytics" element={<ProjectAnalytics />} />
                  </Route>

                  {/* Catch-all redirect */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </OrgProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </ErrorBoundary>
);
}

export default App;
