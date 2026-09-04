import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { Target, Plus, CheckCircle, Trash2 } from 'lucide-react';

const SavingsGoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New Goal Form State
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/goals');
      if (res.success) {
        setGoals(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!goalName.trim() || !targetAmount || !targetDate) {
      setToast({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/goals', {
        goalName,
        targetAmount: parseFloat(targetAmount),
        targetDate,
        description,
      });

      if (res.success) {
        setToast({ message: 'Savings goal created successfully.', type: 'success' });
        setIsModalOpen(false);
        resetForm();
        fetchGoals();
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Are you sure you want to delete this savings goal?')) return;
    try {
      const res = await api.delete(`/goals/${id}`);
      if (res.success) {
        setToast({ message: 'Savings goal deleted', type: 'success' });
        fetchGoals();
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const resetForm = () => {
    setGoalName('');
    setTargetAmount('');
    setTargetDate('');
    setDescription('');
  };

  return (
    <div className="savings-goals-page">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Savings Goal Tracker</h1>
          <p className="page-subtitle">Track your targets calculated automatically from actual financial savings</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Create Goal
        </button>
      </div>

      {loading ? (
        <div className="loading-container">Loading savings goals...</div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No savings goals created."
          description="Set a goal like saving ₹50,000 for a laptop or emergency fund!"
          actionText="Create Goal"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="goals-grid">
          {goals.map((goal) => (
            <div key={goal.id} className={`card goal-card ${goal.isAchieved ? 'achieved' : ''}`}>
              <div className="goal-card-header">
                <div>
                  <h3 className="goal-title">{goal.goalName}</h3>
                  <div className="goal-date">Deadline: {goal.targetDate}</div>
                </div>
                {goal.isAchieved ? (
                  <span className="badge badge-success">
                    <CheckCircle size={14} /> Goal achieved!
                  </span>
                ) : (
                  <button className="btn-icon-danger" onClick={() => handleDeleteGoal(goal.id)}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {goal.description && <p className="goal-desc">{goal.description}</p>}

              <div className="goal-metrics">
                <div>
                  <span className="metric-label">Target</span>
                  <span className="metric-val">₹{goal.targetAmount?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="metric-label">Current Savings</span>
                  <span className="metric-val">₹{goal.currentSavings?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="metric-label">Remaining</span>
                  <span className="metric-val">₹{goal.remainingAmount?.toLocaleString()}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="progress-section">
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${goal.progressPercentage}%` }}></div>
                </div>
                <div className="progress-text">{goal.progressPercentage}% achieved</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Goal Modal */}
      <Modal isOpen={isModalOpen} title="Create Savings Goal" onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleCreateGoal}>
          <div className="form-group">
            <label className="form-label">Goal Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. New Laptop"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Target Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              placeholder="e.g. 50000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Target Date</label>
            <input
              type="date"
              className="form-control"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <textarea
              className="form-control"
              placeholder="e.g. Saving for high performance laptop"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-actions" style={{ marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Creating...' : 'Save Goal'}
            </button>
          </div>
        </form>
      </Modal>

      <style>{`
        .goals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .goal-card {
          margin-bottom: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .goal-card.achieved {
          border: 1px solid var(--accent-emerald);
        }

        .goal-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .goal-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .goal-date {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 0.15rem;
        }

        .goal-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }

        .goal-metrics {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0.5rem;
          background-color: var(--bg-primary);
          padding: 0.85rem;
          border-radius: var(--radius-sm);
          margin-bottom: 1rem;
        }

        .metric-label {
          display: block;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .metric-val {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .progress-section {
          margin-top: 0.5rem;
        }

        .progress-text {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--accent-cyan);
          text-align: right;
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

export default SavingsGoalsPage;
