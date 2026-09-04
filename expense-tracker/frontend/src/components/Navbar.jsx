import React, { useState, useEffect } from 'react';
import { Menu, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Navbar = ({ onToggleSidebar }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUnreadNotifications();
  }, []);

  const fetchUnreadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.success && res.data) {
        const unread = res.data.filter((n) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (ignored) {}
  };

  return (
    <header className="top-navbar">
      <button className="mobile-menu-btn" onClick={onToggleSidebar}>
        <Menu size={22} />
      </button>

      <div className="navbar-title">
        <span>Personal Finance Management</span>
      </div>

      <div className="navbar-actions">
        <button
          className="notification-bell-btn"
          onClick={() => navigate('/notifications')}
          title="Notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
        </button>
      </div>

      <style>{`
        .top-navbar {
          height: 64px;
          background-color: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem;
          position: sticky;
          top: 0;
          z-index: 90;
        }

        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          color: var(--text-primary);
          cursor: pointer;
        }

        .navbar-title {
          font-weight: 700;
          color: var(--text-secondary);
          font-size: 0.95rem;
        }

        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .notification-bell-btn {
          position: relative;
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition);
        }

        .notification-bell-btn:hover {
          border-color: var(--accent-emerald);
          color: var(--accent-emerald);
        }

        .notification-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background-color: var(--accent-rose);
          color: white;
          font-size: 0.7rem;
          font-weight: 800;
          width: 18px;
          height: 18px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--bg-secondary);
        }

        @media (max-width: 992px) {
          .mobile-menu-btn {
            display: block;
          }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
