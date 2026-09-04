import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Toast from '../components/Toast';
import { PlusCircle, ArrowLeft } from 'lucide-react';

const CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Education',
  'Entertainment',
  'Healthcare',
  'Rent',
  'Salary',
  'Freelance',
  'Other'
];

const AddTransactionPage = () => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [type, setType] = useState('EXPENSE');
  
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setToast({ message: 'Amount must be greater than 0', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/transactions', {
        amount: parseFloat(amount),
        category,
        date,
        description,
        type,
      });

      if (res.success) {
        setToast({ message: 'Transaction added successfully.', type: 'success' });
        setTimeout(() => {
          navigate('/dashboard');
        }, 1200);
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-transaction-page">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={18} /> Back
        </button>
        <h1 className="page-title">Add Transaction</h1>
      </div>

      <div className="card form-card">
        <form onSubmit={handleSubmit}>
          {/* Type Selector Toggle */}
          <div className="form-group">
            <label className="form-label">Transaction Type</label>
            <div className="type-toggle-grid">
              <button
                type="button"
                className={`type-btn ${type === 'EXPENSE' ? 'active-expense' : ''}`}
                onClick={() => setType('EXPENSE')}
              >
                Expense
              </button>
              <button
                type="button"
                className={`type-btn ${type === 'INCOME' ? 'active-income' : ''}`}
                onClick={() => setType('INCOME')}
              >
                Income
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              placeholder="e.g. 1500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-control"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-control"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Lunch with team"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              <PlusCircle size={18} /> {submitting ? 'Saving...' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .add-transaction-page {
          max-width: 600px;
          margin: 0 auto;
        }

        .btn-back {
          background: none;
          border: none;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .form-card {
          margin-top: 1rem;
        }

        .type-toggle-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .type-btn {
          height: 46px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          background-color: var(--bg-input);
          color: var(--text-secondary);
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition);
        }

        .type-btn.active-expense {
          background-color: rgba(244, 63, 94, 0.2);
          border-color: var(--accent-rose);
          color: var(--accent-rose);
        }

        .type-btn.active-income {
          background-color: rgba(16, 185, 129, 0.2);
          border-color: var(--accent-emerald);
          color: var(--accent-emerald);
        }

        .form-actions {
          margin-top: 2rem;
        }
      `}</style>
    </div>
  );
};

export default AddTransactionPage;
