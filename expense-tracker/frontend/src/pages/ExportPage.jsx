import React, { useState } from 'react';
import api from '../services/api';
import Toast from '../components/Toast';
import { FileSpreadsheet, FileText, Download } from 'lucide-react';

const ExportPage = () => {
  const [period, setPeriod] = useState('current_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const handleExportPdf = async () => {
    setDownloadingPdf(true);
    try {
      let url = `/export/pdf?period=${period}`;
      if (period === 'custom') {
        if (!startDate || !endDate) {
          setToast({ message: 'Please select start and end dates', type: 'error' });
          setDownloadingPdf(false);
          return;
        }
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `ExpenseTracker_Report_${period}.pdf`;
      link.click();

      setToast({ message: 'Report downloaded successfully.', type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to download PDF report', type: 'error' });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    setDownloadingExcel(true);
    try {
      let url = `/export/excel?period=${period}`;
      if (period === 'custom') {
        if (!startDate || !endDate) {
          setToast({ message: 'Please select start and end dates', type: 'error' });
          setDownloadingExcel(false);
          return;
        }
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `ExpenseTracker_Report_${period}.xlsx`;
      link.click();

      setToast({ message: 'Report downloaded successfully.', type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to download Excel report', type: 'error' });
    } finally {
      setDownloadingExcel(false);
    }
  };

  return (
    <div className="export-page">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Export Reports</h1>
          <p className="page-subtitle">Export financial transactions and summaries to PDF or Excel</p>
        </div>
      </div>

      <div className="card export-card">
        <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>Select Filter & Period</h3>

        <div className="form-group">
          <label className="form-label">Report Period</label>
          <select
            className="form-control"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="current_month">Current Month</option>
            <option value="previous_month">Previous Month</option>
            <option value="current_year">Current Year</option>
            <option value="custom">Custom Date Range</option>
          </select>
        </div>

        {period === 'custom' && (
          <div className="date-range-grid">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="export-buttons-grid">
          <button className="btn btn-primary" onClick={handleExportPdf} disabled={downloadingPdf}>
            <FileText size={18} />
            {downloadingPdf ? 'Generating PDF...' : 'Export PDF'}
          </button>

          <button className="btn btn-secondary" onClick={handleExportExcel} disabled={downloadingExcel}>
            <FileSpreadsheet size={18} />
            {downloadingExcel ? 'Generating Excel...' : 'Export Excel'}
          </button>
        </div>
      </div>

      <style>{`
        .export-page {
          max-width: 600px;
          margin: 0 auto;
        }

        .date-range-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .export-buttons-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-top: 1.5rem;
        }
      `}</style>
    </div>
  );
};

export default ExportPage;
