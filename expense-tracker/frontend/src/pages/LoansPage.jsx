import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { HandCoins, Plus, ArrowUpRight, ArrowDownRight, History, AlertCircle } from 'lucide-react';

const LoansPage = () => {
  const [loans, setLoans] = useState([]);
  const [totals, setTotals] = useState({ totalReceive: 0, totalOwe: 0 });
  const [loading, setLoading] = useState(true);

  // Add Loan Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [personName, setPersonName] = useState('');
  const [type, setType] = useState('BORROWED');
  const [amount, setAmount] = useState('');
  const [dateGivenTaken, setDateGivenTaken] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [reminderDays, setReminderDays] = useState(3);
  const [notes, setNotes] = useState('');

  // Repayment Modal
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayNotes, setRepayNotes] = useState('');

  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLoansData();
  }, []);

  const fetchLoansData = async () => {
    setLoading(true);
    try {
      const [loansRes, totalsRes] = await Promise.all([
        api.get('/loans'),
        api.get('/loans/totals'),
      ]);

      if (loansRes.success) setLoans(loansRes.data || []);
      if (totalsRes.success && totalsRes.data) setTotals(totalsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    if (!personName.trim() || !amount || parseFloat(amount) <= 0) {
      setToast({ message: 'Please complete all required fields', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/loans', {
        personName,
        type,
        amount: parseFloat(amount),
        dateGivenTaken,
        dueDate: dueDate || null,
        reminderDays: parseInt(reminderDays, 10),
        notes,
      });

      if (res.success) {
        setToast({ message: 'Loan record created successfully.', type: 'success' });
        setIsAddModalOpen(false);
        resetForm();
        fetchLoansData();
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordRepayment = async (e) => {
    e.preventDefault();
    if (!selectedLoan || !repayAmount || parseFloat(repayAmount) <= 0) {
      setToast({ message: 'Enter a valid repayment amount', type: 'error' });
      return;
    }

    if (parseFloat(repayAmount) > selectedLoan.remainingAmount) {
      setToast({ message: `Repayment cannot exceed remaining balance of ₹${selectedLoan.remainingAmount}`, type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/loans/${selectedLoan.id}/repayments`, {
        amount: parseFloat(repayAmount),
        repaymentDate: new Date().toISOString().split('T')[0],
        notes: repayNotes,
      });

      if (res.success) {
        setToast({ message: 'Repayment recorded successfully.', type: 'success' });
        setIsRepayModalOpen(false);
        setRepayAmount('');
        setRepayNotes('');
        fetchLoansData();
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setPersonName('');
    setType('BORROWED');
    setAmount('');
    setDateGivenTaken(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setReminderDays(3);
    setNotes('');
  };

  const lentLoans = loans.filter((l) => l.type === 'LENT');
  const borrowedLoans = loans.filter((l) => l.type === 'BORROWED');

  return (
    <div className="loans-page">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Loans & Money Lent / Borrowed</h1>
          <p className="page-subtitle">Track debts, money given, partial repayments, and due dates</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} /> Add Loan Record
        </button>
      </div>

      {/* Summary Totals Bar */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon income"><ArrowUpRight size={24} /></div>
          <div>
            <div className="kpi-label">Total You'll Receive</div>
            <div className="kpi-value" style={{ color: 'var(--accent-emerald)' }}>
              ₹{totals.totalReceive?.toLocaleString() || '0'}
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon expense"><ArrowDownRight size={24} /></div>
          <div>
            <div className="kpi-label">Total You Owe</div>
            <div className="kpi-value" style={{ color: 'var(--accent-rose)' }}>
              ₹{totals.totalOwe?.toLocaleString() || '0'}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">Loading loan records...</div>
      ) : loans.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title="No borrowed or lent money recorded."
          description="Keep track of money you owe friends or money friends owe you!"
          actionText="Add Loan Record"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="loans-sections-grid">
          {/* Section 1: People Who Owe Me (LENT) */}
          <div className="loan-section">
            <h2 className="section-header-title text-emerald">People Who Owe Me (Lent)</h2>
            {lentLoans.length === 0 ? (
              <div className="card empty-sub">No money lent to anyone.</div>
            ) : (
              lentLoans.map((loan) => (
                <LoanCard
                  key={loan.id}
                  loan={loan}
                  onRepay={() => {
                    setSelectedLoan(loan);
                    setIsRepayModalOpen(true);
                  }}
                />
              ))
            )}
          </div>

          {/* Section 2: People I Owe (BORROWED) */}
          <div className="loan-section">
            <h2 className="section-header-title text-rose">People I Owe (Borrowed)</h2>
            {borrowedLoans.length === 0 ? (
              <div className="card empty-sub">No money borrowed from anyone.</div>
            ) : (
              borrowedLoans.map((loan) => (
                <LoanCard
                  key={loan.id}
                  loan={loan}
                  onRepay={() => {
                    setSelectedLoan(loan);
                    setIsRepayModalOpen(true);
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Add Loan Modal */}
      <Modal isOpen={isAddModalOpen} title="Add Loan Record" onClose={() => setIsAddModalOpen(false)}>
        <form onSubmit={handleCreateLoan}>
          <div className="form-group">
            <label className="form-label">Type</label>
            <div className="type-toggle-grid">
              <button
                type="button"
                className={`type-btn ${type === 'BORROWED' ? 'active-expense' : ''}`}
                onClick={() => setType('BORROWED')}
              >
                Borrowed (I Owe)
              </button>
              <button
                type="button"
                className={`type-btn ${type === 'LENT' ? 'active-income' : ''}`}
                onClick={() => setType('LENT')}
              >
                Lent (Owes Me)
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Person Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Ravi or Priya"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Original Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Date Given/Taken</label>
            <input
              type="date"
              className="form-control"
              value={dateGivenTaken}
              onChange={(e) => setDateGivenTaken(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Due Date (Optional)</label>
            <input
              type="date"
              className="form-control"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Reminder Days Before Due Date</label>
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
              placeholder="e.g. Emergency medical help"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="form-actions" style={{ marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Loan Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Repayment Modal */}
      <Modal isOpen={isRepayModalOpen} title={`Record Repayment — ${selectedLoan?.personName}`} onClose={() => setIsRepayModalOpen(false)}>
        <form onSubmit={handleRecordRepayment}>
          <div className="repay-info-banner">
            <div>Original Amount: <strong>₹{selectedLoan?.amount?.toLocaleString()}</strong></div>
            <div>Remaining Balance: <strong>₹{selectedLoan?.remainingAmount?.toLocaleString()}</strong></div>
          </div>

          <div className="form-group">
            <label className="form-label">Repayment Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              placeholder={`Max ₹${selectedLoan?.remainingAmount}`}
              value={repayAmount}
              onChange={(e) => setRepayAmount(e.target.value)}
              max={selectedLoan?.remainingAmount}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Part payment via UPI"
              value={repayNotes}
              onChange={(e) => setRepayNotes(e.target.value)}
            />
          </div>

          <div className="form-actions" style={{ marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Recording...' : 'Record Repayment'}
            </button>
          </div>
        </form>
      </Modal>

      <style>{`
        .loans-sections-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        @media (max-width: 992px) {
          .loans-sections-grid {
            grid-template-columns: 1fr;
          }
        }

        .section-header-title {
          font-size: 1.15rem;
          font-weight: 800;
          margin-bottom: 1rem;
        }

        .text-emerald { color: var(--accent-emerald); }
        .text-rose { color: var(--accent-rose); }

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

        .repay-info-banner {
          background-color: var(--bg-primary);
          padding: 0.85rem;
          border-radius: var(--radius-sm);
          font-size: 0.9rem;
          margin-bottom: 1.25rem;
          display: flex;
          justify-content: space-between;
        }

        .empty-sub {
          padding: 2rem;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};

// Reusable Card for Loan displaying Repayment History & Status
const LoanCard = ({ loan, onRepay }) => {
  const isFullyPaid = loan.status === 'FULLY_PAID';
  const isOverdue = !isFullyPaid && loan.daysRemaining < 0;

  return (
    <div className={`card loan-card ${isOverdue ? 'overdue-card' : ''}`}>
      <div className="card-header" style={{ marginBottom: '0.75rem' }}>
        <div>
          <h3 className="card-title">{loan.personName}</h3>
          <div className="loan-sub-info">
            {loan.type === 'LENT' ? 'Lent: ' : 'Borrowed: '}
            <strong>₹{loan.amount?.toLocaleString()}</strong>
          </div>
        </div>
        <div className="loan-remaining-tag">
          Remaining: <strong>₹{loan.remainingAmount?.toLocaleString()}</strong>
        </div>
      </div>

      <div className="loan-body-metrics">
        <div>Due: {loan.dueDate || 'No due date'}</div>
        <div>
          Status: {' '}
          {isFullyPaid ? (
            <span className="badge badge-success">Fully Paid</span>
          ) : isOverdue ? (
            <span className="badge badge-danger"><AlertCircle size={12} /> {loan.statusText}</span>
          ) : (
            <span className="badge badge-warning">{loan.statusText}</span>
          )}
        </div>
      </div>

      {/* Repayment History Timeline */}
      {loan.repayments?.length > 0 && (
        <div className="repayments-timeline">
          <div className="timeline-title"><History size={14} /> Repayment History:</div>
          {loan.repayments.map((r, idx) => (
            <div key={idx} className="timeline-item">
              <span>{r.repaymentDate}</span> — <strong>₹{r.amount?.toLocaleString()}</strong> {r.notes ? `(${r.notes})` : ''}
            </div>
          ))}
        </div>
      )}

      {!isFullyPaid && (
        <div style={{ marginTop: '1rem' }}>
          <button className="btn btn-secondary btn-block btn-sm" onClick={onRepay}>
            Record Repayment
          </button>
        </div>
      )}

      <style>{`
        .loan-card {
          margin-bottom: 1rem;
        }

        .loan-sub-info {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .loan-remaining-tag {
          font-size: 1rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .loan-body-metrics {
          background-color: var(--bg-primary);
          padding: 0.75rem 1rem;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .repayments-timeline {
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px dashed var(--border-color);
          font-size: 0.8rem;
        }

        .timeline-title {
          font-weight: 700;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 0.35rem;
          margin-bottom: 0.35rem;
        }

        .timeline-item {
          color: var(--text-muted);
          margin-bottom: 0.2rem;
        }
      `}</style>
    </div>
  );
};

export default LoansPage;
