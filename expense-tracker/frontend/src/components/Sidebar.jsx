import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  Wallet,
  FileSpreadsheet,
  Target,
  Calendar,
  Users,
  Bell,
  HandCoins,
  Inbox,
  LogOut,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { logout, user } = useAuth();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/add-transaction', label: 'Add Transaction', icon: PlusCircle },
    { path: '/income', label: 'Income', icon: Wallet },
    { path: '/export', label: 'Export to PDF/Excel', icon: FileSpreadsheet },
    { path: '/savings', label: 'Savings Goal Tracker', icon: Target },
    { path: '/calendar', label: 'Calendar View', icon: Calendar },
    { path: '/shared-expenses', label: 'Shared/Group Expenses', icon: Users },
    { path: '/bills', label: 'Bill Due Date Reminders', icon: Bell },
    { path: '/loans', label: 'Loans & Money Lent/Borrowed', icon: HandCoins },
    { path: '/notifications', label: 'Notifications', icon: Inbox },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose}></div>}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon">₹</div>
            <span className="brand-name">Expense Tracker</span>
          </div>
          <button className="mobile-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="user-profile-badge">
          <div className="avatar">{user?.username ? user.username.charAt(0).toUpperCase() : 'U'}</div>
          <div className="user-info">
            <div className="user-name">{user?.username}</div>
            <div className="user-role">Personal Account</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          <button className="nav-link logout-btn" onClick={logout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      <style>{`
        .sidebar-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 99;
        }

        .sidebar {
          width: 260px;
          background-color: var(--bg-secondary);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: sticky;
          top: 0;
          transition: var(--transition);
          z-index: 100;
        }

        .sidebar-header {
          padding: 1.25rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-color);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .brand-icon {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          background: linear-gradient(135deg, var(--accent-emerald), var(--accent-cyan));
          color: white;
          font-weight: 800;
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brand-name {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .user-profile-badge {
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background-color: rgba(15, 23, 42, 0.5);
          border-bottom: 1px solid var(--border-color);
        }

        .avatar {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-full);
          background-color: var(--accent-indigo);
          color: white;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-name {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .user-role {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .sidebar-nav {
          padding: 1rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          overflow-y: auto;
          flex: 1;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.75rem 1rem;
          color: var(--text-secondary);
          text-decoration: none;
          border-radius: var(--radius-sm);
          font-size: 0.9rem;
          font-weight: 600;
          transition: var(--transition);
          background: transparent;
          border: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
        }

        .nav-link:hover {
          background-color: var(--bg-card-hover);
          color: var(--text-primary);
        }

        .nav-link.active {
          background-color: rgba(16, 185, 129, 0.15);
          color: var(--accent-emerald);
          font-weight: 700;
        }

        .logout-btn {
          margin-top: auto;
          color: var(--accent-rose);
        }

        .logout-btn:hover {
          background-color: rgba(244, 63, 94, 0.15);
          color: var(--accent-rose);
        }

        .mobile-close-btn {
          display: none;
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
        }

        @media (max-width: 992px) {
          .sidebar {
            position: fixed;
            left: -260px;
          }

          .sidebar.open {
            left: 0;
          }

          .mobile-close-btn {
            display: block;
          }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
