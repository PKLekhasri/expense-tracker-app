import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { Users, Plus, UserPlus, CheckCircle } from 'lucide-react';

const SharedExpensesPage = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Group Modal
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [memberNamesInput, setMemberNamesInput] = useState('');

  // Add Member Modal
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');

  // Add Expense Modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseTotal, setExpenseTotal] = useState('');
  const [paidByName, setPaidByName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);

  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupBalances(selectedGroup.id);
    }
  }, [selectedGroup]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await api.get('/groups');
      if (res.success && res.data) {
        setGroups(res.data);
        if (res.data.length > 0 && !selectedGroup) {
          setSelectedGroup(res.data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupBalances = async (groupId) => {
    try {
      const res = await api.get(`/groups/${groupId}/balances`);
      if (res.success) {
        setBalances(res.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setSubmitting(true);
    try {
      const membersArr = memberNamesInput.split(',').map((m) => m.trim()).filter((m) => m.length > 0);
      const res = await api.post('/groups', {
        groupName,
        memberNames: membersArr,
      });

      if (res.success) {
        setToast({ message: 'Group created successfully', type: 'success' });
        setIsGroupModalOpen(false);
        setGroupName('');
        setMemberNamesInput('');
        fetchGroups();
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberName.trim() || !selectedGroup) return;

    setSubmitting(true);
    try {
      const res = await api.post(`/groups/${selectedGroup.id}/members`, {
        memberName: newMemberName.trim(),
      });

      if (res.success) {
        setToast({ message: 'Member added successfully', type: 'success' });
        setIsMemberModalOpen(false);
        setNewMemberName('');
        setSelectedGroup(res.data);
        fetchGroups();
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseDesc || !expenseTotal || !paidByName || selectedMembers.length === 0) {
      setToast({ message: 'Please complete all expense details', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/groups/${selectedGroup.id}/expenses`, {
        description: expenseDesc,
        totalAmount: parseFloat(expenseTotal),
        paidByName,
        date: new Date().toISOString().split('T')[0],
        members: selectedMembers,
      });

      if (res.success) {
        setToast({ message: 'Group expense recorded', type: 'success' });
        setIsExpenseModalOpen(false);
        setExpenseDesc('');
        setExpenseTotal('');
        setPaidByName('');
        setSelectedMembers([]);
        fetchGroups();
        fetchGroupBalances(selectedGroup.id);
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSettleSplit = async (splitId) => {
    try {
      const res = await api.post(`/groups/splits/${splitId}/settle`);
      if (res.success) {
        setToast({ message: 'Expense marked as settled', type: 'success' });
        fetchGroupBalances(selectedGroup.id);
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const toggleMemberSelection = (name) => {
    if (selectedMembers.includes(name)) {
      setSelectedMembers(selectedMembers.filter((m) => m !== name));
    } else {
      setSelectedMembers([...selectedMembers, name]);
    }
  };

  return (
    <div className="shared-expenses-page">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Shared & Group Expenses</h1>
          <p className="page-subtitle">Split bills with roommates, friends, or team members</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsGroupModalOpen(true)}>
          <Plus size={18} /> Create Group
        </button>
      </div>

      {loading ? (
        <div className="loading-container">Loading groups...</div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No expense groups created yet."
          description="Create a group like 'Roommates' or 'Trip' to split shared expenses!"
          actionText="Create Group"
          onAction={() => setIsGroupModalOpen(true)}
        />
      ) : (
        <div className="group-layout-grid">
          {/* Group Navigation Tabs */}
          <div className="group-tabs-card card">
            <h3 className="card-title" style={{ marginBottom: '1rem' }}>Your Groups</h3>
            <div className="group-list">
              {groups.map((g) => (
                <button
                  key={g.id}
                  className={`group-tab-btn ${selectedGroup?.id === g.id ? 'active' : ''}`}
                  onClick={() => setSelectedGroup(g)}
                >
                  <Users size={16} />
                  <span>{g.groupName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Group Content View */}
          {selectedGroup && (
            <div className="group-details-view">
              <div className="card">
                <div className="card-header">
                  <div>
                    <h2 className="card-title">{selectedGroup.groupName}</h2>
                    <div className="member-tags">
                      Members: {selectedGroup.memberNames?.join(', ')}
                    </div>
                  </div>
                  <div className="group-action-btns">
                    <button className="btn btn-secondary" onClick={() => setIsMemberModalOpen(true)}>
                      <UserPlus size={16} /> Add Member
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setPaidByName(selectedGroup.memberNames?.[0] || '');
                        setSelectedMembers(selectedGroup.memberNames || []);
                        setIsExpenseModalOpen(true);
                      }}
                    >
                      <Plus size={16} /> Add Expense
                    </button>
                  </div>
                </div>

                {/* Outstanding Balances Section */}
                <div className="balances-section">
                  <h4 className="section-title">Owed Balances & Settlements</h4>
                  {balances.length === 0 ? (
                    <div className="all-settled-box">🎉 All shared expenses are completely settled!</div>
                  ) : (
                    <div className="balances-list">
                      {balances.map((b) => (
                        <div key={b.splitId} className="balance-item">
                          <div>
                            <div className="balance-text">{b.summaryText}</div>
                            <div className="balance-sub">{b.expenseDescription}</div>
                          </div>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleSettleSplit(b.splitId)}>
                            <CheckCircle size={14} /> Mark as Settled
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Expenses History */}
                <div className="expenses-history-section" style={{ marginTop: '2rem' }}>
                  <h4 className="section-title">Group Expense History</h4>
                  {selectedGroup.expenses?.length === 0 ? (
                    <div className="empty-sub">No expenses recorded in this group yet.</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Paid By</th>
                            <th>Total Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedGroup.expenses?.map((e) => (
                            <tr key={e.id}>
                              <td>{e.date}</td>
                              <td>{e.description}</td>
                              <td><span className="badge badge-info">{e.paidByName}</span></td>
                              <td style={{ fontWeight: 800 }}>₹{e.totalAmount?.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Group Modal */}
      <Modal isOpen={isGroupModalOpen} title="Create Expense Group" onClose={() => setIsGroupModalOpen(false)}>
        <form onSubmit={handleCreateGroup}>
          <div className="form-group">
            <label className="form-label">Group Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Roommates"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Other Members (comma separated)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Ravi, Priya, Arun"
              value={memberNamesInput}
              onChange={(e) => setMemberNamesInput(e.target.value)}
            />
          </div>

          <div className="form-actions" style={{ marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal isOpen={isMemberModalOpen} title="Add Member to Group" onClose={() => setIsMemberModalOpen(false)}>
        <form onSubmit={handleAddMember}>
          <div className="form-group">
            <label className="form-label">Member Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Rahul"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              required
            />
          </div>

          <div className="form-actions" style={{ marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Group Expense Modal */}
      <Modal isOpen={isExpenseModalOpen} title="Add Group Expense" onClose={() => setIsExpenseModalOpen(false)}>
        <form onSubmit={handleAddExpense}>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Dinner at restaurant"
              value={expenseDesc}
              onChange={(e) => setExpenseDesc(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Total Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              placeholder="e.g. 2000"
              value={expenseTotal}
              onChange={(e) => setExpenseTotal(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Paid By</label>
            <select
              className="form-control"
              value={paidByName}
              onChange={(e) => setPaidByName(e.target.value)}
              required
            >
              {selectedGroup?.memberNames?.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Split Among Members</label>
            <div className="member-checkbox-list">
              {selectedGroup?.memberNames?.map((m) => (
                <label key={m} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(m)}
                    onChange={() => toggleMemberSelection(m)}
                  />
                  <span>{m}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Saving...' : 'Add Shared Expense'}
            </button>
          </div>
        </form>
      </Modal>

      <style>{`
        .group-layout-grid {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 1.5rem;
        }

        @media (max-width: 768px) {
          .group-layout-grid {
            grid-template-columns: 1fr;
          }
        }

        .group-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .group-tab-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: none;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
          text-align: left;
        }

        .group-tab-btn.active {
          background-color: rgba(16, 185, 129, 0.15);
          border-color: var(--accent-emerald);
          color: var(--accent-emerald);
        }

        .member-tags {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
        }

        .group-action-btns {
          display: flex;
          gap: 0.75rem;
        }

        .section-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.85rem;
        }

        .all-settled-box {
          padding: 1rem;
          background-color: rgba(16, 185, 129, 0.1);
          border: 1px solid var(--accent-emerald);
          border-radius: var(--radius-sm);
          color: var(--accent-emerald);
          font-weight: 600;
          text-align: center;
        }

        .balances-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .balance-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.85rem 1rem;
          background-color: var(--bg-primary);
          border-radius: var(--radius-sm);
        }

        .balance-text {
          font-weight: 700;
          color: var(--text-primary);
          font-size: 0.9rem;
        }

        .balance-sub {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .member-checkbox-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          background: var(--bg-primary);
          padding: 0.85rem;
          border-radius: var(--radius-sm);
        }

        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
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

export default SharedExpensesPage;
