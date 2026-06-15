'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// ─── Nav config ───────────────────────────────────────────────────────────────

interface NavItem {
  to: string;
  label: string;
  icon: string;
  roles: string[];
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: '🏠', roles: ['ADMIN'] },
      { to: '/students', label: 'Students', icon: '🎓', roles: ['ADMIN'] },
      { to: '/student/profile', label: 'My Profile', icon: '👤', roles: ['STUDENT'] },
      { to: '/student/explore', label: 'Explore', icon: '🔍', roles: ['STUDENT'] },
      { to: '/student/activities', label: 'My Activities', icon: '⭐', roles: ['STUDENT'] },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/admin/clubs', label: 'Clubs', icon: '🎭', roles: ['ADMIN'] },
      { to: '/clubs', label: 'My Club', icon: '🎭', roles: ['CLUB_HEAD'] },
      { to: '/admin/hackathons', label: 'Hackathons', icon: '🏆', roles: ['ADMIN'] },
      { to: '/hackathons', label: 'Hackathon', icon: '🏆', roles: ['HACKATHON_LEAD'] },
      { to: '/admin/fests', label: 'Fests', icon: '🎪', roles: ['ADMIN'] },
      { to: '/fests', label: 'Fests', icon: '🎪', roles: ['FEST_COORDINATOR'] },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/admin/users', label: 'Users', icon: '👥', roles: ['ADMIN'] },
      { to: '/admin/applications', label: 'Applications', icon: '📬', roles: ['ADMIN'] },
      { to: '/settings', label: 'Settings', icon: '⚙️', roles: ['ADMIN', 'STUDENT', 'CLUB_HEAD', 'HACKATHON_LEAD', 'FEST_COORDINATOR'] },
    ],
  },
];

// Resolve entity-specific paths (clubs/:entityId, etc.)
function resolveTo(item: NavItem, entityId?: number | null): string {
  if (['/clubs', '/hackathons', '/fests'].includes(item.to) && entityId) {
    return `${item.to}/${entityId}`;
  }
  return item.to;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <aside className="sidebar-nav">
      <div className="sidebar-brand">
        <div>
          <div className="brand-title">Campus ERP</div>
          <div className="brand-subtitle">{user?.username}</div>
        </div>
      </div>

      <div className="nav-sections">
        {navSections.map((section) => {
          const sectionItems = section.items.filter((item) =>
            item.roles.includes(user?.role ?? '')
          );
          if (!sectionItems.length) return null;

          return (
            <div key={section.label} className="nav-section">
              <div className="nav-divider">{section.label}</div>
              {sectionItems.map((item) => {
                const href = resolveTo(item, user?.entityId);
                const isActive =
                  href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(href);
                return (
                  <Link
                    key={item.to}
                    href={href}
                    className={`nav-item${isActive ? ' active' : ''}`}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}

        <div className="nav-section" style={{ marginTop: 'auto', paddingBottom: '8px' }}>
          <button
            type="button"
            className="sidebar-logout"
            onClick={() => logout()}
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
