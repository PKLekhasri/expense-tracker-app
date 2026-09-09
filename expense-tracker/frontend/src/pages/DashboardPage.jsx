import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ReceiptUploadModal from '../components/ReceiptUploadModal';
import {
  Wallet,
  TrendingDown,
  Scale,
  PiggyBank,
  Filter,
  Plus,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#0284c7', '#4f46e5', '#d97706', '#e11d48', '#8b5cf6'];

const DashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [trend, setTrend] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [period, setPeriod] = useState('current_month');
  const [loading, setLoading] = useState(true);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [sumRes, catRes, trendRes, txRes] = await Promise.all([
        api.get(`/dashboard/summary?period=${period}`).catch(() => ({ success: false })),
        api.get(`/dashboard/category-summary?period=${period}`).catch(() => ({ success: false })),
        api.get('/dashboard/trend').catch(() => ({ success: false })),
        api.get('/transactions').catch(() => ({ success: false })),
      ]);

      if (sumRes.success) setSummary(sumRes.data);
      if (catRes.success) setCategories(catRes.data || []);
      if (trendRes.success) setTrend(trendRes.data || []);
      if (txRes.success) setRecentTransactions((txRes.data || []).slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <ReceiptUploadModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        onTransactionAdded={() => fetchDashboardData()}
      />

      {/* Page Header (Renders instantly < 1s) */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Track your personal income, expenses, and financial health</p>
        </div>

        <div className="period-filter-wrapper">
          <Filter size={16} className="filter-icon" />
          <select
            className="form-control period-select"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="current_month">Current Month</option>
            <option value="previous_month">Previous Month</option>
            <option value="current_year">Current Year</option>
          </select>

          <button className="btn btn-secondary" onClick={() => setIsReceiptModalOpen(true)}>
            <FileText size={18} /> Upload Receipt
          </button>

          <button className="btn btn-primary" onClick={() => navigate('/add-transaction')}>
            <Plus size={18} /> Add Transaction
          </button>
        </div>
      </div>

      {/* KPI Summary Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon income"><Wallet size={24} /></div>
          <div>
            <div className="kpi-label">Total Income</div>
            <div className="kpi-value">
              {loading && !summary ? <span className="skeleton-line" /> : `₹${summary?.totalIncome?.toLocaleString() || '0'}`}
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon expense"><TrendingDown size={24} /></div>
          <div>
            <div className="kpi-label">Total Expenses</div>
            <div className="kpi-value">
              {loading && !summary ? <span className="skeleton-line" /> : `₹${summary?.totalExpenses?.toLocaleString() || '0'}`}
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon balance"><Scale size={24} /></div>
          <div>
            <div className="kpi-label">Current Balance</div>
            <div className="kpi-value">
              {loading && !summary ? <span className="skeleton-line" /> : `₹${summary?.currentBalance?.toLocaleString() || '0'}`}
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon savings"><PiggyBank size={24} /></div>
          <div>
            <div className="kpi-label">Current Savings</div>
            <div className="kpi-value">
              {loading && !summary ? (
                <span className="skeleton-line" />
              ) : (
                <>
                  ₹{summary?.savings?.toLocaleString() || '0'}{' '}
                  <span className="savings-pct">({summary?.savingsPercentage || 0}%)</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        {/* Category Donut Chart */}
        <div className="card chart-card">
          <div className="card-header">
            <h3 className="card-title">Spending by Category</h3>
          </div>
          {loading && categories.length === 0 ? (
            <div className="chart-empty"><RefreshCw size={20} className="spinning" /> Loading charts...</div>
          ) : categories.length === 0 ? (
            <div className="chart-empty">No expense data for this period</div>
          ) : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                  >
                    {categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => `₹${val.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Income vs Expense Trend Bar Chart */}
        <div className="card chart-card">
          <div className="card-header">
            <h3 className="card-title">Income vs Expense Trend</h3>
          </div>
          {loading && trend.length === 0 ? (
            <div className="chart-empty"><RefreshCw size={20} className="spinning" /> Loading trend...</div>
          ) : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#475569" />
                  <YAxis stroke="#475569" />
                  <Tooltip formatter={(val) => `₹${val.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#e11d48" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Transactions</h3>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsReceiptModalOpen(true)}>
              <FileText size={14} /> Scan Receipt
            </button>
            <button className="btn-link" onClick={() => navigate('/calendar')}>View All</button>
          </div>
        </div>

        {loading && recentTransactions.length === 0 ? (
          <div className="empty-state-text"><RefreshCw size={18} className="spinning" /> Loading transactions...</div>
        ) : recentTransactions.length === 0 ? (
          <div className="empty-state-text">No recent transactions. Add one or scan a receipt to get started!</div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{tx.date}</td>
                    <td>{tx.description || '-'}</td>
                    <td><span className="badge badge-info">{tx.category}</span></td>
                    <td>
                      {tx.type === 'INCOME' ? (
                        <span className="tx-type income"><ArrowUpRight size={16} /> Income</span>
                      ) : (
                        <span className="tx-type expense"><ArrowDownRight size={16} /> Expense</span>
                      )}
                    </td>
                    <td className={`tx-amount ${tx.type.toLowerCase()}`}>
                      {tx.type === 'INCOME' ? '+' : '-'}₹{tx.amount?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .dashboard-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .page-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .page-subtitle {
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .period-filter-wrapper {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .filter-icon {
          color: var(--text-muted);
        }

        .period-select {
          width: 170px;
        }

        .savings-pct {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--accent-blue);
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
        }

        @media (max-width: 768px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }

        .chart-empty {
          height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          font-size: 0.9rem;
          gap: 0.5rem;
        }

        .btn-link {
          background: none;
          border: none;
          color: var(--accent-blue);
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
        }

        .tx-type {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-weight: 700;
          font-size: 0.85rem;
        }

        .tx-type.income { color: var(--accent-emerald); }
        .tx-type.expense { color: var(--accent-rose); }

        .tx-amount {
          font-weight: 800;
        }

        .tx-amount.income { color: var(--accent-emerald); }
        .tx-amount.expense { color: var(--accent-rose); }

        .empty-state-text {
          padding: 3rem;
          text-align: center;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .skeleton-line {
          display: inline-block;
          width: 80px;
          height: 24px;
          background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
          background-size: 200% 100%;
          border-radius: var(--radius-sm);
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .btn-sm {
          height: 34px;
          padding: 0 0.85rem;
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;
