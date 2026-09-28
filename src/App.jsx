import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function MainAppLayout() {
  const { isAuthenticated } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      <Header toggleSidebar={() => setIsSidebarOpen(prev => !prev)} />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar Tree Menu */}
        <Sidebar isOpen={isSidebarOpen} />

        {/* Main Workspace Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-100">
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/explorer" element={<TmfExplorer />} />
              <Route path="/reports" element={<ReportsView />} />
              <Route path="/studies" element={<StudiesManagement />} />
              <Route path="/edl" element={<ExpectedDocumentList />} />
              <Route path="/qc-queue" element={<QcReviewQueue />} />
              <Route path="/tasks" element={<TaskInbox />} />
              <Route path="/audit-trail" element={<AuditTrailView />} />
              <Route path="/inspector-portal" element={<InspectorPortal />} />
              <Route path="/version-control" element={<VersionControlView />} />
              <Route path="/blinding-access" element={<BlindingAccessView />} />
              <Route path="/roles-access" element={<UserRoleManagement />} />
              <Route path="/system-validation" element={<ValidationRepository />} />
              
              {/* Clinical Trial Work Modules */}
              <Route path="/inventory" element={<InventoryView />} />
              <Route path="/queries" element={<QueriesManagementView />} />
              <Route path="/quality" element={<QualityDashboardView />} />
              <Route path="/timeliness" element={<TimelinessSlaView />} />
              <Route path="/jobs" element={<ScheduledJobsView />} />
              <Route path="/inactive-docs" element={<InactiveDocsView />} />
              <Route path="/notes" element={<TrialNotesView />} />
              <Route path="/removed" element={<RemovedDocsView />} />
              
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
            <h2 className="text-lg font-bold text-white mb-2">VigiThink eTMF — Session Recovery</h2>
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
