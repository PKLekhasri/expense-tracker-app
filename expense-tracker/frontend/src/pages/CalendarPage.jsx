import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedDateTransactions, setSelectedDateTransactions] = useState(null);
  const [selectedDateStr, setSelectedDateStr] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, [currentDate]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/transactions');
      if (res.success) {
        setTransactions(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  // Map transactions by YYYY-MM-DD
  const txByDate = {};
  transactions.forEach((tx) => {
    if (!txByDate[tx.date]) {
      txByDate[tx.date] = [];
    }
    txByDate[tx.date].push(tx);
  });

  const handleDateClick = (dayNum) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(dayNum).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

    const txs = txByDate[dateStr] || [];
    setSelectedDateStr(`${MONTH_NAMES[month]} ${dayNum}, ${year}`);
    setSelectedDateTransactions(txs);
  };

  const renderCalendarDays = () => {
    const days = [];
    // Padding empty cells
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    const todayStr = new Date().toISOString().split('T')[0];

    for (let day = 1; day <= daysInMonth; day++) {
      const formattedMonth = String(month + 1).padStart(2, '0');
      const formattedDay = String(day).padStart(2, '0');
      const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
      
      const dayTxs = txByDate[dateStr] || [];
      const hasIncome = dayTxs.some((t) => t.type === 'INCOME');
      const hasExpense = dayTxs.some((t) => t.type === 'EXPENSE');
      const isToday = dateStr === todayStr;

      days.push(
        <div
          key={`day-${day}`}
          className={`calendar-day ${isToday ? 'today' : ''} ${dayTxs.length > 0 ? 'has-tx' : ''}`}
          onClick={() => handleDateClick(day)}
        >
          <div className="day-number">{day}</div>
          {dayTxs.length > 0 && (
            <div className="tx-indicators">
              {hasIncome && <span className="dot income"></span>}
              {hasExpense && <span className="dot expense"></span>}
              <span className="tx-count">{dayTxs.length} tx</span>
            </div>
          )}
        </div>
      );
    }
    return days;
  };

  return (
    <div className="calendar-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Calendar View</h1>
          <p className="page-subtitle">View transactions organized by date</p>
        </div>

        <div className="calendar-controls">
          <button className="btn btn-secondary" onClick={handlePrevMonth}>
            <ChevronLeft size={18} />
          </button>
          <button className="btn btn-secondary" onClick={handleToday}>
            Today
          </button>
          <button className="btn btn-secondary" onClick={handleNextMonth}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="card calendar-card">
        <div className="calendar-month-title">
          <h2>{MONTH_NAMES[month]} {year}</h2>
        </div>

        <div className="calendar-grid-header">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        <div className="calendar-grid-body">{renderCalendarDays()}</div>
      </div>

      {/* Date Transactions Modal */}
      <Modal
        isOpen={selectedDateTransactions !== null}
        title={`Transactions for ${selectedDateStr}`}
        onClose={() => setSelectedDateTransactions(null)}
      >
        {selectedDateTransactions && selectedDateTransactions.length === 0 ? (
          <div className="no-tx-modal">No transactions recorded for this date.</div>
        ) : (
          <div className="modal-tx-list">
            {selectedDateTransactions?.map((tx) => (
              <div key={tx.id} className="modal-tx-item">
                <div className="tx-left">
                  <div className={`tx-icon ${tx.type.toLowerCase()}`}>
                    {tx.type === 'INCOME' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                  </div>
                  <div>
                    <div className="tx-desc">{tx.description || tx.category}</div>
                    <div className="tx-cat-badge">{tx.category}</div>
                  </div>
                </div>
                <div className={`tx-amount-val ${tx.type.toLowerCase()}`}>
                  {tx.type === 'INCOME' ? '+' : '-'}₹{tx.amount?.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <style>{`
        .calendar-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .calendar-month-title {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .calendar-month-title h2 {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .calendar-grid-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          text-align: center;
          font-weight: 700;
          color: var(--text-secondary);
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border-color);
          font-size: 0.85rem;
        }

        .calendar-grid-body {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          background-color: var(--border-color);
          margin-top: 1px;
        }

        .calendar-day {
          background-color: var(--bg-card);
          min-height: 90px;
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          cursor: pointer;
          transition: var(--transition);
        }

        .calendar-day:hover {
          background-color: var(--bg-card-hover);
        }

        .calendar-day.empty {
          background-color: var(--bg-primary);
          cursor: default;
        }

        .calendar-day.today {
          border: 2px solid var(--accent-emerald);
        }

        .day-number {
          font-weight: 800;
          font-size: 0.95rem;
          color: var(--text-primary);
        }

        .tx-indicators {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: var(--radius-full);
        }

        .dot.income { background-color: var(--accent-emerald); }
        .dot.expense { background-color: var(--accent-rose); }

        .tx-count {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-left: auto;
        }

        .no-tx-modal {
          padding: 2rem;
          text-align: center;
          color: var(--text-secondary);
        }

        .modal-tx-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .modal-tx-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.85rem;
          background-color: var(--bg-primary);
          border-radius: var(--radius-sm);
        }

        .tx-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .tx-icon {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tx-icon.income { background-color: rgba(16, 185, 129, 0.15); color: var(--accent-emerald); }
        .tx-icon.expense { background-color: rgba(244, 63, 94, 0.15); color: var(--accent-rose); }

        .tx-desc {
          font-weight: 700;
          color: var(--text-primary);
          font-size: 0.9rem;
        }

        .tx-cat-badge {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .tx-amount-val {
          font-weight: 800;
          font-size: 1rem;
        }

        .tx-amount-val.income { color: var(--accent-emerald); }
        .tx-amount-val.expense { color: var(--accent-rose); }

        @media (max-width: 600px) {
          .calendar-day {
            min-height: 60px;
            padding: 0.25rem;
          }
          .tx-count {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default CalendarPage;
