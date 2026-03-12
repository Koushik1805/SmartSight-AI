import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { ObjectScanner } from './pages/ObjectScanner';
import { NotesScanner } from './pages/NotesScanner';
import { AITutor } from './pages/AITutor';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useNavigate, NavLink } from 'react-router-dom';
import { useEffect } from 'react';
import { LayoutDashboard, Camera, FileText, MessageSquare, History as HistoryIcon, Settings as SettingsIcon } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  return isAuthenticated ? <>{children}</> : null;
};

const BottomNav = () => {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Home', path: '/' },
    { icon: Camera, label: 'Scan', path: '/scan-object' },
    { icon: FileText, label: 'Notes', path: '/scan-notes' },
    { icon: MessageSquare, label: 'Tutor', path: '/ai-tutor' },
    { icon: HistoryIcon, label: 'History', path: '/history' },
    { icon: SettingsIcon, label: 'Settings', path: '/settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-center justify-around z-50 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {menuItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-2 px-1 flex-1 text-xs font-medium transition-colors ${
              isActive ? 'text-indigo-600' : 'text-slate-400'
            }`
          }
        >
          <item.icon size={20} />
          <span className="mt-0.5">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default function App() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={
            <ProtectedRoute>
              <div className="flex min-h-screen bg-brand-bg">
                {/* Sidebar - hidden on mobile */}
                <div className="hidden md:block">
                  <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                  <Header />

                  {/* Main content - add bottom padding on mobile for bottom nav */}
                  <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
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
              </div>

              {/* Bottom nav - only on mobile */}
              <BottomNav />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
