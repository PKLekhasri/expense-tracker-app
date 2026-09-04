import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { Bell, Plus, CheckCircle, Trash2, Calendar, AlertCircle } from 'lucide-react';

const CATEGORIES = ['Rent', 'Netflix', 'Internet', 'Electricity', 'EMI', 'Phone bill', 'Utilities', 'Other'];
const FREQUENCIES = ['MONTHLY', 'WEEKLY', 'YEARLY'];

const BillRemindersPage = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Bill Form State
  const [billName, setBillName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Rent');
  const [dueDate, setDueDate] = useState('');
  const [recurringFrequency, setRecurringFrequency] = useState('MONTHLY');
  const [reminderDays, setReminderDays] = useState(3);
  const [notes, setNotes] = useState('');

  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bills');
      if (res.success) {
        setBills(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBill = async (e) => {
    e.preventDefault();
    if (!billName.trim() || !amount || !dueDate) {
      setToast({ message: 'Please complete all required fields', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/bills', {
        billName,
        amount: parseFloat(amount),
        category,
        dueDate,
        recurringFrequency,
        reminderDays: parseInt(reminderDays, 10),
        notes,
      });

      if (res.success) {
        setToast({ message: 'Recurring bill added successfully.', type: 'success' });
        setIsModalOpen(false);
        resetForm();
        fetchBills();
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsPaid = async (id) => {
    try {
      const res = await api.post(`/bills/${id}/pay`);
      if (res.success) {
        setToast({ message: 'Bill marked as paid', type: 'success' });
        fetchBills();
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDeleteBill = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bill?')) return;
    try {
      const res = await api.delete(`/bills/${id}`);
      if (res.success) {
        setToast({ message: 'Bill deleted', type: 'success' });
        fetchBills();
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const resetForm = () => {
    setBillName('');
    setAmount('');
    setCategory('Rent');
    setDueDate('');
    setRecurringFrequency('MONTHLY');
    setReminderDays(3);
    setNotes('');
  };

  return (
    <div className="bill-reminders-page">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Bill Due Date Reminders</h1>
          <p className="page-subtitle">Track recurring bills and receive automated due-date alerts</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Add Bill
        </button>
      </div>

      {loading ? (
        <div className="loading-container">Loading bills...</div>
      ) : bills.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No upcoming bills."
          description="Add recurring bills like Rent, Netflix, Electricity, or Phone bill!"
          actionText="Add Bill"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="bills-grid">
          {bills.map((bill) => {
            const isOverdue = !bill.isPaid && bill.daysRemaining < 0;
            const isDueSoon = !bill.isPaid && bill.daysRemaining <= bill.reminderDays;

            return (
              <div key={bill.id} className={`card bill-card ${isOverdue ? 'overdue-card' : ''}`}>
                <div className="bill-card-header">
                  <div>
                    <h3 className="bill-title">{bill.billName}</h3>
                    <div className="bill-cat-badge">{bill.category} • {bill.recurringFrequency}</div>
                  </div>
                  <div className="bill-amount-tag">₹{bill.amount?.toLocaleString()}</div>
                </div>

                <div className="bill-details">
                  <div className="detail-item">
                    <Calendar size={16} /> Due Date: <strong>{bill.dueDate}</strong>
                  </div>
                  {bill.notes && <div className="bill-notes">{bill.notes}</div>}
                </div>

                <div className="bill-status-banner">
                  {bill.isPaid ? (
                    <span className="badge badge-success">
                      <CheckCircle size={14} /> Paid
                    </span>
                  ) : isOverdue ? (
                    <span className="badge badge-danger">
                      <AlertCircle size={14} /> {bill.statusText}
                    </span>
                  ) : isDueSoon ? (
                    <span className="badge badge-warning">
                      <Bell size={14} /> {bill.statusText}
                    </span>
                  ) : (
                    <span className="badge badge-info">{bill.statusText}</span>
                  )}

                  {!bill.isPaid && (
                    <button className="btn btn-secondary btn-sm" onClick={() => handleMarkAsPaid(bill.id)}>
                      Mark Paid
                    </button>
                  )}

                  <button className="btn-icon-danger" onClick={() => handleDeleteBill(bill.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Bill Modal */}
      <Modal isOpen={isModalOpen} title="Add Recurring Bill" onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleCreateBill}>
          <div className="form-group">
            <label className="form-label">Bill Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Rent"
              value={billName}
              onChange={(e) => setBillName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              placeholder="e.g. 15000"
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
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input
              type="date"
              className="form-control"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Recurring Frequency</label>
            <select
              className="form-control"
              value={recurringFrequency}
              onChange={(e) => setRecurringFrequency(e.target.value)}
            >
              {FREQUENCIES.map((freq) => (
                <option key={freq} value={freq}>
                  {freq}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Remind Days Before Due Date</label>
            <input
              type="number"
              className="form-control"
              value={reminderDays}
              onChange={(e) => setReminderDays(e.target.value)}
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <textarea
              className="form-control"
              placeholder="e.g. Pay via netbanking"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="form-actions" style={{ marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Bill'}
            </button>
          </div>
        </form>
      </Modal>

      <style>{`
        .bills-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .bill-card {
          margin-bottom: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .bill-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .bill-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .bill-cat-badge {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 0.15rem;
        }

        .bill-amount-tag {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .bill-details {
          background-color: var(--bg-primary);
          padding: 0.85rem;
          border-radius: var(--radius-sm);
          margin-bottom: 1rem;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .bill-notes {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 0.5rem;
        }

        .bill-status-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 0.5rem;
          border-top: 1px solid var(--border-color);
        }

        .btn-sm {
          height: 32px;
          padding: 0 0.75rem;
          font-size: 0.8rem;
        }

        .btn-icon-danger {
          background: none;
          border: none;
          color: var(--accent-rose);
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

export default BillRemindersPage;
