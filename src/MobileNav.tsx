import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Camera, FileText, MessageSquare, Settings } from 'lucide-react';

const mobileNavItems = [
  { icon: LayoutDashboard, label: 'Home', path: '/' },
  { icon: Camera, label: 'Scan', path: '/scan-object' },
  { icon: FileText, label: 'Notes', path: '/scan-notes' },
  { icon: MessageSquare, label: 'Tutor', path: '/ai-tutor' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export const MobileNav: React.FC = () => {
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {mobileNavItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) =>
            `mobile-nav-item${isActive ? ' active' : ''}`
          }
          aria-label={item.label}
        >
          <item.icon size={20} aria-hidden="true" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
