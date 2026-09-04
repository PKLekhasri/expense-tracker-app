import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className={`toast toast-${type}`}>
      {type === 'success' ? <CheckCircle2 size={18} className="toast-icon success" /> : <AlertCircle size={18} className="toast-icon error" />}
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose}>
        <X size={16} />
      </button>

      <style>{`
        .toast {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          padding: 0.9rem 1.25rem;
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          z-index: 9999;
          max-width: 400px;
        }

        .toast-success {
          border-left: 4px solid var(--accent-emerald);
        }

        .toast-error {
          border-left: 4px solid var(--accent-rose);
        }

        .toast-icon.success { color: var(--accent-emerald); }
        .toast-icon.error { color: var(--accent-rose); }

        .toast-message {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-primary);
          flex: 1;
        }

        .toast-close {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default Toast;
