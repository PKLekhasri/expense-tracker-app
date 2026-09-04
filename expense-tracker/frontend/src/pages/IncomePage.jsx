import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Toast from '../components/Toast';
import { Wallet, Save } from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const IncomePage = () => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [amount, setAmount] = useState('');
  const [currentIncomeRecord, setCurrentIncomeRecord] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  useEffect(() => {
    fetchIncomeForSelectedMonth();
  }, [selectedMonth, selectedYear]);

  const fetchIncomeForSelectedMonth = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/income/${selectedYear}/${selectedMonth}`);
      if (res.success && res.data) {
        setCurrentIncomeRecord(res.data);
        setAmount(res.data.amount.toString());
      } else {
        setCurrentIncomeRecord(null);
        setAmount('');
      }
    } catch (err) {
      setCurrentIncomeRecord(null);
      setAmount('');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setToast({ message: 'Amount must be greater than 0', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/income', {
        month: parseInt(selectedMonth, 10),
        year: parseInt(selectedYear, 10),
        amount: parseFloat(amount),
      });

      if (res.success) {
        const monthName = MONTHS[selectedMonth - 1];
        setToast({
          message: `${monthName} ${selectedYear} income updated successfully.`,
          type: 'success',
        });
        setCurrentIncomeRecord(res.data);
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const monthName = MONTHS[selectedMonth - 1];

  return (
    <div className="income-page">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Monthly Income</h1>
          <p className="page-subtitle">Set or update your fixed monthly salary/income</p>
        </div>
      </div>

      <div className="card form-card">
        {/* Month Selector Controls */}
        <div className="month-picker-grid">
          <div className="form-group">
            <label className="form-label">Month</label>
            <select
              className="form-control"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            >
              {MONTHS.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Year</label>
            <select
              className="form-control"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            >
              {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="income-header-banner">
          <h2>Income for {monthName} {selectedYear}</h2>
          {currentIncomeRecord ? (
            <div className="current-income-badge">
              Current income: <strong>₹{currentIncomeRecord.amount?.toLocaleString()}</strong>
            </div>
          ) : (
            <div className="no-income-badge">No income set for this month yet</div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              placeholder="e.g. 50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting || loading}>
              <Save size={18} /> {currentIncomeRecord ? 'Update Income' : 'Save Income'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .income-page {
          max-width: 600px;
          margin: 0 auto;
        }

        .month-picker-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .income-header-banner {
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 1.25rem;
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .income-header-banner h2 {
          font-size: 1.2rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 0.35rem;
        }

        .current-income-badge {
          color: var(--accent-emerald);
          font-size: 0.95rem;
          font-weight: 600;
        }

        .no-income-badge {
          color: var(--text-secondary);
          font-size: 0.85rem;
        }

        .form-actions {
          margin-top: 1.5rem;
        }
      `}</style>
    </div>
  );
};

export default IncomePage;
