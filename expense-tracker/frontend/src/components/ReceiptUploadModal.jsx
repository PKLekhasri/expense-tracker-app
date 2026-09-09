import React, { useState } from 'react';
import api from '../services/api';
import Modal from './Modal';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

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

const ReceiptUploadModal = ({ isOpen, onClose, onTransactionAdded }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Form fields for confirm step
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showRawText, setShowRawText] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setScanResult(null);
      setErrorMsg('');
    }
  };

  const handleScanReceipt = async () => {
    if (!selectedFile) return;

    setScanning(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await api.post('/transactions/upload-receipt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.success && res.data) {
        const data = res.data;
        setScanResult(data);
        if (data.amount) setAmount(data.amount.toString());
        if (data.merchantName) setDescription(data.merchantName);
        if (data.date) setDate(data.date);
        if (data.guessedCategory) setCategory(data.guessedCategory);
      } else {
        setErrorMsg(res.message || 'Could not process receipt');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to scan receipt image');
    } finally {
      setScanning(false);
    }
  };

  const handleConfirmTransaction = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setErrorMsg('Please provide a valid amount greater than 0');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/transactions', {
        amount: parseFloat(amount),
        category,
        date,
        description: description || 'Receipt Expense',
        type: 'EXPENSE',
      });

      if (res.success) {
        if (onTransactionAdded) onTransactionAdded(res.data);
        handleClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setScanResult(null);
    setErrorMsg('');
    setAmount('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('Food');
    setShowRawText(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} title="Upload & Scan Receipt" onClose={handleClose}>
      <div className="receipt-modal-container">
        {errorMsg && (
          <div className="alert-box error">
            <AlertCircle size={18} /> {errorMsg}
          </div>
        )}

        {!scanResult ? (
          <div className="upload-step">
            <div
              className={`dropzone ${selectedFile ? 'has-file' : ''}`}
              onClick={() => document.getElementById('receipt-file-input').click()}
            >
              <input
                id="receipt-file-input"
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {previewUrl ? (
                <div className="preview-box">
                  <img src={previewUrl} alt="Receipt Preview" className="receipt-preview-img" />
                  <span className="file-name">{selectedFile.name}</span>
                </div>
              ) : (
                <div className="dropzone-prompt">
                  <UploadCloud size={44} className="upload-icon" />
                  <span className="prompt-title">Click or drag receipt photo to upload</span>
                  <span className="prompt-sub">Supports JPG, PNG formats</span>
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={handleScanReceipt}
                disabled={!selectedFile || scanning}
              >
                {scanning ? (
                  <>
                    <Loader2 size={18} className="spinning" /> Scanning Receipt...
                  </>
                ) : (
                  <>
                    <FileText size={18} /> Auto-Extract Transaction
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConfirmTransaction} className="confirm-step">
            <div className="scan-status-banner">
              <CheckCircle2 size={20} className="check-icon" />
              <div>
                <div className="scan-status-title">
                  {scanResult.amount ? 'Receipt Scanned Successfully' : 'Partial Receipt Details Extracted'}
                </div>
                <div className="scan-status-msg">{scanResult.message}</div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Total Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                placeholder="e.g. 450.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Merchant / Description</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Starbucks Coffee"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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

            {scanResult.rawText && (
              <div className="raw-text-toggle-section">
                <button
                  type="button"
                  className="btn-link-sm"
                  onClick={() => setShowRawText(!showRawText)}
                >
                  {showRawText ? 'Hide Extracted OCR Text' : 'View Extracted OCR Text'}
                </button>
                {showRawText && (
                  <pre className="raw-text-box">{scanResult.rawText}</pre>
                )}
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setScanResult(null)}
              >
                Re-scan Photo
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Confirm & Save Expense'}
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        .receipt-modal-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .alert-box {
          padding: 0.75rem 1rem;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .alert-box.error {
          background-color: #fff1f2;
          border: 1px solid #fecdd3;
          color: var(--accent-rose);
        }

        .dropzone {
          border: 2px dashed var(--border-color);
          border-radius: var(--radius-md);
          padding: 2rem 1.5rem;
          text-align: center;
          cursor: pointer;
          transition: var(--transition);
          background-color: #f8fafc;
        }

        .dropzone:hover, .dropzone.has-file {
          border-color: var(--accent-blue);
          background-color: #eff6ff;
        }

        .dropzone-prompt {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .upload-icon {
          color: var(--accent-blue);
        }

        .prompt-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .prompt-sub {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .preview-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .receipt-preview-img {
          max-height: 180px;
          object-fit: contain;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
        }

        .file-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .scan-status-banner {
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: var(--radius-sm);
          padding: 0.85rem 1rem;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .check-icon {
          color: var(--accent-emerald);
          flex-shrink: 0;
          margin-top: 0.1rem;
        }

        .scan-status-title {
          font-size: 0.9rem;
          font-weight: 700;
          color: #166534;
        }

        .scan-status-msg {
          font-size: 0.8rem;
          color: #15803d;
        }

        .raw-text-toggle-section {
          margin-top: 0.5rem;
        }

        .btn-link-sm {
          background: none;
          border: none;
          color: var(--accent-blue);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
        }

        .raw-text-box {
          background-color: #f8fafc;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 0.75rem;
          font-size: 0.75rem;
          max-height: 120px;
          overflow-y: auto;
          margin-top: 0.5rem;
          white-space: pre-wrap;
          color: var(--text-secondary);
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Modal>
  );
};

export default ReceiptUploadModal;
