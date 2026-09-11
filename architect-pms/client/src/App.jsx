import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';

// Layout Components
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import LoadingGlass from './components/LoadingGlass';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DataEntryPage from './pages/DataEntryPage';
import ProjectListPage from './pages/ProjectListPage';
import CreateProjectPage from './pages/CreateProjectPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import SiteVisitsPage from './pages/SiteVisitsPage';
import RemindersPage from './pages/RemindersPage';
import CreateBannerPage from './pages/CreateBannerPage';
import ReportsPage from './pages/ReportsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminAuditLogPage from './pages/AdminAuditLogPage';
import ClientDashboardPage from './pages/ClientDashboardPage';

const ProtectedLayout = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) return <LoadingGlass message="Verifying session..." />;
  if (!user)   return <Navigate to="/login" replace />;

  // Client portal — minimal layout
  if (user.role === 'client' || location.pathname.startsWith('/client-portal')) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        {children}
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={collapsed}
        toggleSidebar={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        closeMobileSidebar={() => setMobileOpen(false)}
      />
      <div className="main-content-area">
        <Topbar onToggleMobileSidebar={() => setMobileOpen(!mobileOpen)} />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/client-portal/login" element={<LoginPage />} />

    <Route path="/dashboard"              element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
    <Route path="/data-entry"             element={<ProtectedLayout><DataEntryPage /></ProtectedLayout>} />
    <Route path="/projects"               element={<ProtectedLayout><ProjectListPage /></ProtectedLayout>} />
    <Route path="/projects/new"           element={<ProtectedLayout><CreateProjectPage /></ProtectedLayout>} />
    <Route path="/projects/banner-tool"   element={<ProtectedLayout><CreateBannerPage /></ProtectedLayout>} />
    <Route path="/projects/:id/banner"    element={<ProtectedLayout><CreateBannerPage /></ProtectedLayout>} />
    <Route path="/projects/:id"           element={<ProtectedLayout><ProjectDetailPage /></ProtectedLayout>} />
    <Route path="/site-visits"            element={<ProtectedLayout><SiteVisitsPage /></ProtectedLayout>} />
    <Route path="/reminders"              element={<ProtectedLayout><RemindersPage /></ProtectedLayout>} />
    <Route path="/reports"                element={<ProtectedLayout><ReportsPage /></ProtectedLayout>} />
    <Route path="/settings/users"         element={<ProtectedLayout><AdminUsersPage /></ProtectedLayout>} />
    <Route path="/settings/audit-log"     element={<ProtectedLayout><AdminAuditLogPage /></ProtectedLayout>} />
    <Route path="/client-portal/dashboard"element={<ProtectedLayout><ClientDashboardPage /></ProtectedLayout>} />

    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

function App() {
  return (
    <ModalProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ModalProvider>
  );
}

export default App;
