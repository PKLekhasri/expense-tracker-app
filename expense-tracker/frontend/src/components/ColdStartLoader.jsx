import React, { useState, useEffect } from 'react';
import { RefreshCw, Server, AlertTriangle } from 'lucide-react';

const ColdStartLoader = ({ isFailed, onRetry }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (isFailed) return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isFailed]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = Math.min(Math.round((seconds / 45) * 100), 95);

  return (
    <div className="cold-start-overlay">
      <div className="cold-start-card">
        <div className="brand-badge">
          <div className="brand-logo">₹</div>
          <span className="brand-title">Expense Tracker</span>
        </div>

        {!isFailed ? (
          <>
            <div className="spinner-container">
              <div className="pulse-ring"></div>
              <Server size={32} className="server-icon spinning" />
            </div>

            <h2 className="loader-title">Waking up the server</h2>
            <p className="loader-desc">
              The backend is hosted on Render's free tier and sleeps during inactivity.
              Waking it up can take up to 45 seconds on cold start.
            </p>

            <div className="progress-bar-wrapper">
              <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
            </div>

            <div className="loader-timer">
              Elapsed time: <strong>{formatTime(seconds)}</strong>
            </div>
          </>
        ) : (
          <>
            <div className="failed-icon-wrapper">
              <AlertTriangle size={36} className="error-icon" />
            </div>

            <h2 className="loader-title">Server Connection Timed Out</h2>
            <p className="loader-desc">
              The server took too long to respond. Render may still be spinning up the instance.
            </p>

            <button className="btn btn-primary btn-retry" onClick={onRetry}>
              <RefreshCw size={18} /> Retry Connection
            </button>
          </>
        )}
      </div>

      <style>{`
        .cold-start-overlay {
          position: fixed;
          inset: 0;
          background-color: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 1.5rem;
        }

        .cold-start-card {
          background-color: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 2.5rem 2rem;
          max-width: 480px;
          width: 100%;
          text-align: center;
          box-shadow: var(--shadow-lg);
        }

        .brand-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }

        .brand-logo {
          width: 42px;
          height: 42px;
          border-radius: var(--radius-sm);
          background: linear-gradient(135deg, var(--accent-blue), var(--accent-indigo));
          color: #ffffff;
          font-weight: 800;
          font-size: 1.35rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brand-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .spinner-container {
          position: relative;
          width: 72px;
          height: 72px;
          margin: 0 auto 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pulse-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 3px solid rgba(37, 99, 235, 0.2);
          border-top-color: var(--accent-blue);
          animation: spinRing 1.2s linear infinite;
        }

        @keyframes spinRing {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .server-icon {
          color: var(--accent-blue);
        }

        .loader-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .loader-desc {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 1.5rem;
        }

        .progress-bar-wrapper {
          height: 8px;
          background-color: #e2e8f0;
          border-radius: var(--radius-full);
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-blue), var(--accent-emerald));
          border-radius: var(--radius-full);
          transition: width 0.4s ease;
        }

        .loader-timer {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .failed-icon-wrapper {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background-color: rgba(225, 29, 72, 0.1);
          color: var(--accent-rose);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.25rem;
        }

        .btn-retry {
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default ColdStartLoader;
