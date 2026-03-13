import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileNav } from './components/MobileNav';
import { Dashboard } from './pages/Dashboard';
import { ObjectScanner } from './pages/ObjectScanner';
import { NotesScanner } from './pages/NotesScanner';
import { AITutor } from './pages/AITutor';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return isAuthenticated ? <>{children}</> : null;
};

const AppLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="app-layout flex min-h-screen bg-brand-bg dark:bg-[#0a0a0c]">
        {/* Desktop Sidebar */}
        <Sidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isMobileOpen={isMobileSidebarOpen}
          setMobileOpen={setIsMobileSidebarOpen}
          className="desktop-sidebar"
        />

        {/* Mobile overlay backdrop */}
        {isMobileSidebarOpen && (
          <div
            className="sidebar-overlay active"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header onMenuClick={() => setIsMobileSidebarOpen(true)} />

          <main
            className="flex-1 overflow-y-auto main-content-area"
            id="main-content"
            role="main"
            tabIndex={-1}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/scan-object" element={<ObjectScanner />} />
              <Route path="/scan-notes" element={<NotesScanner />} />
              <Route path="/ai-tutor" element={<AITutor />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>

        {/* Mobile bottom nav */}
        <MobileNav />
      </div>
    </ProtectedRoute>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Accessibility: skip to main content */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[#6c47ff] focus:text-white focus:rounded-lg focus:font-semibold"
        >
          Skip to main content
        </a>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
