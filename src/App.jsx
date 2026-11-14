import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TMFDataProvider } from './context/TMFDataContext';

import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import TmfExplorer from './pages/TmfExplorer';
import ReportsView from './pages/ReportsView';
import StudiesManagement from './pages/StudiesManagement';
import ExpectedDocumentList from './pages/ExpectedDocumentList';
import QcReviewQueue from './pages/QcReviewQueue';
import TaskInbox from './pages/TaskInbox';
import AuditTrailView from './pages/AuditTrailView';
import InspectorPortal from './pages/InspectorPortal';
import VersionControlView from './pages/VersionControlView';
import BlindingAccessView from './pages/BlindingAccessView';
import UserRoleManagement from './pages/UserRoleManagement';
import ValidationRepository from './pages/ValidationRepository';

// Additional Clinical Trial eTMF Modules
import InventoryView from './pages/InventoryView';
import QueriesManagementView from './pages/QueriesManagementView';
import QualityDashboardView from './pages/QualityDashboardView';
import TimelinessSlaView from './pages/TimelinessSlaView';
import ScheduledJobsView from './pages/ScheduledJobsView';
import InactiveDocsView from './pages/InactiveDocsView';
import TrialNotesView from './pages/TrialNotesView';
import RemovedDocsView from './pages/RemovedDocsView';
import MonitoringVisitsView from './pages/MonitoringVisitsView';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

// 21 CFR Part 11 Role & Privileges Guard
function RoleGuardRoute({ requiredPermission, fallback = null, children }) {
  const { hasPermission, currentUser, currentRole } = useAuth();
  const isAllowed = hasPermission(requiredPermission);

  if (!isAllowed) {
    if (fallback) return fallback;
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-lg text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Access Restricted by RBAC Policy</h2>
            <p className="text-xs text-slate-500 mt-1">
              Your assigned role does not have authorization to access this clinical trial module.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left space-y-1 text-xs">
            <p><span className="text-slate-400">User:</span> <strong className="text-slate-800">{currentUser?.name}</strong></p>
            <p><span className="text-slate-400">Role:</span> <strong className="text-blue-600">{currentRole?.name} ({currentUser?.roleId})</strong></p>
            <p><span className="text-slate-400">Scope:</span> <span className="font-mono text-slate-700">{currentUser?.studyScope || 'CLIN-001'} · {currentUser?.siteScope || 'Assigned Site'}</span></p>
            <p><span className="text-slate-400">Required Privilege:</span> <span className="font-mono text-rose-600">{requiredPermission}</span></p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Authorized Workspace
          </Link>
        </div>
      </div>
    );
  }

  return children;
}

function MainAppLayout() {
  const { isAuthenticated } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      <Header toggleSidebar={() => setIsSidebarOpen(prev => !prev)} isSidebarOpen={isSidebarOpen} />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar Tree Menu */}
        <Sidebar isOpen={isSidebarOpen} onCloseMobile={() => setIsSidebarOpen(false)} />

        {/* Main Workspace Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-100">
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/explorer" element={<TmfExplorer />} />
              <Route 
                path="/reports" 
                element={
                  <RoleGuardRoute requiredPermission="review">
                    <ReportsView />
                  </RoleGuardRoute>
                } 
              />
              <Route 
                path="/studies" 
                element={
                  <RoleGuardRoute requiredPermission="manageStudies">
                    <StudiesManagement />
                  </RoleGuardRoute>
                } 
              />
              <Route path="/edl" element={<ExpectedDocumentList />} />
              <Route 
                path="/qc-queue" 
                element={
                  <RoleGuardRoute requiredPermission="qcReview">
                    <QcReviewQueue />
                  </RoleGuardRoute>
                } 
              />
              <Route path="/tasks" element={<TaskInbox />} />
              <Route 
                path="/audit-trail" 
                element={
                  <RoleGuardRoute requiredPermission="viewAuditTrail">
                    <AuditTrailView />
                  </RoleGuardRoute>
                } 
              />
              <Route 
                path="/inspector-portal" 
                element={
                  <RoleGuardRoute requiredPermission="viewInspectorPortal">
                    <InspectorPortal />
                  </RoleGuardRoute>
                } 
              />
              <Route path="/version-control" element={<VersionControlView />} />
              <Route path="/blinding-access" element={<BlindingAccessView />} />
              <Route 
                path="/roles-access" 
                element={
                  <RoleGuardRoute requiredPermission="manageUsers">
                    <UserRoleManagement />
                  </RoleGuardRoute>
                } 
              />
              <Route 
                path="/system-validation" 
                element={
                  <RoleGuardRoute requiredPermission="viewAuditTrail">
                    <ValidationRepository />
                  </RoleGuardRoute>
                } 
              />
              
              {/* Clinical Trial Work Modules */}
              <Route path="/inventory" element={<InventoryView />} />
              <Route path="/queries" element={<QueriesManagementView />} />
              <Route 
                path="/quality" 
                element={
                  <RoleGuardRoute requiredPermission="review">
                    <QualityDashboardView />
                  </RoleGuardRoute>
                } 
              />
              <Route 
                path="/timeliness" 
                element={
                  <RoleGuardRoute requiredPermission="review">
                    <TimelinessSlaView />
                  </RoleGuardRoute>
                } 
              />
              <Route 
                path="/jobs" 
                element={
                  <RoleGuardRoute requiredPermission="admin">
                    <ScheduledJobsView />
                  </RoleGuardRoute>
                } 
              />
              <Route path="/inactive-docs" element={<InactiveDocsView />} />
              <Route path="/notes" element={<TrialNotesView />} />
              <Route path="/monitoring-visits" element={<MonitoringVisitsView />} />
              <Route 
                path="/removed" 
                element={
                  <RoleGuardRoute requiredPermission="viewAuditTrail">
                    <RemovedDocsView />
                  </RoleGuardRoute>
                } 
              />
              
              {/* Route Aliases for Legacy & Notification Deep-Links */}
              <Route path="/documents" element={<Navigate to="/explorer" replace />} />
              <Route path="/documents/:id" element={<Navigate to="/explorer" replace />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}

class ProductionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[VigiThink eTMF Runtime Error]', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              !
            </div>
            <h2 className="text-lg font-bold text-white mb-2">VigiThink eTMF: Session Recovery</h2>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              An unexpected interface state occurred. Your clinical trial records and 21 CFR Part 11 audit trail remain safely stored.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow transition"
            >
              Reload eTMF Workspace
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ProductionErrorBoundary>
      <AuthProvider>
        <TMFDataProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/*" element={<MainAppLayout />} />
            </Routes>
          </Router>
        </TMFDataProvider>
      </AuthProvider>
    </ProductionErrorBoundary>
  );
}
