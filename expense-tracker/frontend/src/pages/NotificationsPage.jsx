import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Toast from '../components/Toast';
import EmptyState from '../components/EmptyState';
import { Bell, Inbox, CheckCheck, AlertCircle } from 'lucide-react';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      if (res.success) {
        setNotifications(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const res = await api.put(`/notifications/${id}/read`);
      if (res.success) {
        setNotifications(
          notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await api.put('/notifications/read-all');
      if (res.success) {
        setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
        setToast({ message: 'All notifications marked as read', type: 'success' });
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  return (
    <div className="notifications-page">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Notification Center</h1>
          <p className="page-subtitle">Stay updated on bill due dates and loan repayments</p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button className="btn btn-secondary" onClick={handleMarkAllAsRead}>
            <CheckCheck size={18} /> Mark All as Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-container">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No notifications yet."
          description="You will receive alerts here when bills or loans are due soon or overdue!"
        />
      ) : (
        <div className="notifications-list">
          {notifications.map((n) => {
            const isOverdue = n.priority === 'OVERDUE';
            const isDueToday = n.priority === 'DUE_TODAY';

            return (
              <div
                key={n.id}
                className={`card notification-card ${!n.isRead ? 'unread' : ''} ${isOverdue ? 'overdue-notif' : ''}`}
              >
                <div className="notif-header">
                  <div className="notif-title-row">
                    {isOverdue ? (
                      <AlertCircle className="notif-icon overdue" size={20} />
                    ) : (
                      <Bell className="notif-icon info" size={20} />
                    )}
                    <h3 className="notif-title">{n.title}</h3>
                  </div>

                  <span className="notif-time">
                    {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ''}
                  </span>
                </div>

                <p className="notif-message">{n.message}</p>

                <div className="notif-actions">
                  <span className={`badge badge-${isOverdue ? 'danger' : isDueToday ? 'warning' : 'info'}`}>
                    {n.priority}
                  </span>

                  {!n.isRead && (
                    <button className="btn-mark-read" onClick={() => handleMarkAsRead(n.id)}>
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .notifications-page {
          max-width: 800px;
          margin: 0 auto;
        }

        .notifications-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .notification-card {
          margin-bottom: 0;
          transition: var(--transition);
        }

        .notification-card.unread {
          border-left: 4px solid var(--accent-emerald);
          background-color: var(--bg-card-hover);
        }

        .notification-card.overdue-notif {
          border: 2px solid var(--accent-rose) !important;
          border-left: 6px solid var(--accent-rose) !important;
          background-color: rgba(244, 63, 94, 0.08) !important;
        }

        .notif-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .notif-title-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .notif-icon.overdue { color: var(--accent-rose); }
        .notif-icon.info { color: var(--accent-emerald); }

        .notif-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .notif-time {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .notif-message {
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }

        .notif-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .btn-mark-read {
          background: none;
          border: none;
          color: var(--accent-emerald);
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
        }

        .loading-container {
          padding: 3rem;
          text-align: center;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};

export default NotificationsPage;
