import React from 'react';

const EmptyState = ({ icon: Icon, title, description, actionText, onAction }) => {
  return (
    <div className="empty-state-card">
      {Icon && <Icon className="empty-state-icon" size={48} />}
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-desc">{description}</p>}
      {actionText && onAction && (
        <button className="btn btn-primary" onClick={onAction}>
          {actionText}
        </button>
      )}

      <style>{`
        .empty-state-card {
          background-color: var(--bg-card);
          border: 1px dashed var(--border-color);
          border-radius: var(--radius-md);
          padding: 3rem 1.5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 1.5rem 0;
        }

        .empty-state-icon {
          color: var(--text-muted);
          margin-bottom: 1rem;
        }

        .empty-state-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .empty-state-desc {
          font-size: 0.9rem;
          color: var(--text-secondary);
          max-width: 400px;
          margin-bottom: 1.5rem;
        }
      `}</style>
    </div>
  );
};

export default EmptyState;
