import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Camera,
  FileText,
  MessageSquare,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  isMobileOpen?: boolean;
  setMobileOpen?: (value: boolean) => void;
  className?: string;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Camera, label: 'Scan Object', path: '/scan-object' },
  { icon: FileText, label: 'Scan Notes', path: '/scan-notes' },
  { icon: MessageSquare, label: 'AI Tutor', path: '/ai-tutor' },
  { icon: History, label: 'History', path: '/history' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen = false,
  setMobileOpen,
  className = ''
}) => {
  const sidebarRef = useRef<HTMLElement>(null);

  // Trap focus inside sidebar when mobile open
  useEffect(() => {
    if (!isMobileOpen) return;
    const el = sidebarRef.current;
    if (!el) return;
    const focusables = el.querySelectorAll<HTMLElement>(
      'a, button, [tabindex]:not([tabindex="-1"])'
    );
    focusables[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen?.(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, setMobileOpen]);

  return (
    <motion.aside
      ref={sidebarRef}
      initial={false}
      animate={{ width: isCollapsed ? 72 : 256 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`h-screen bg-[var(--color-sidebar-bg)] text-white flex flex-col relative z-50 shrink-0 ${className}`}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="p-5 flex items-center gap-3 border-b border-white/5 shrink-0">
        <div className="w-9 h-9 bg-[#6c47ff] rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-[#6c47ff]/30">
          <Sparkles size={18} className="text-white" aria-hidden="true" />
        </div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="font-display font-800 text-lg tracking-tight leading-tight"
            >
              SmartSight<br />
              <span className="text-[#6c47ff]">AI</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Primary">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            onClick={() => setMobileOpen?.(false)}
            className={({ isActive }) =>
              `sidebar-item${isActive ? ' active' : ''}`
            }
            title={isCollapsed ? item.label : undefined}
            aria-label={item.label}
          >
            <item.icon size={20} aria-hidden="true" className="shrink-0" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle (desktop only) */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-[72px] bg-[#6c47ff] rounded-full p-1 text-white border-2 border-[#0f0f11] hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-[#6c47ff] focus:ring-offset-2 focus:ring-offset-[#0f0f11]"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!isCollapsed}
      >
        {isCollapsed ? <ChevronRight size={14} aria-hidden="true" /> : <ChevronLeft size={14} aria-hidden="true" />}
      </button>

      {/* Version */}
      <div className="p-4 border-t border-white/5">
        {!isCollapsed && (
          <span className="text-[10px] text-white/20 font-display tracking-widest uppercase">v1.0.0</span>
        )}
      </div>
    </motion.aside>
  );
};
