import React, { useState } from 'react';
import { exportToExcel, exportToPdf } from '../utils/exportUtils';
import { useToast } from '../context/ToastContext';

export const ExportButtons = ({
  filename = 'Report',
  title = 'Document Report',
  subtitle = '',
  headers = [],
  data = [],
  disabled = false,
  orientation = null
}) => {
  const { addToast } = useToast();
  const [exporting, setExporting] = useState(false);

  const handleExcel = () => {
    if (!data || data.length === 0) {
      addToast('No data available to export', 'warning');
      return;
    }
    try {
      setExporting(true);
      const dateStr = new Date().toISOString().slice(0, 10);
      exportToExcel({
        filename: `${filename}_${dateStr}`,
        title,
        headers,
        data
      });
      addToast('Excel file downloaded successfully!', 'success');
    } catch (err) {
      addToast('Failed to export Excel file', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handlePdf = () => {
    if (!data || data.length === 0) {
      addToast('No data available to export', 'warning');
      return;
    }
    try {
      setExporting(true);
      const dateStr = new Date().toISOString().slice(0, 10);
      exportToPdf({
        filename: `${filename}_${dateStr}`,
        title,
        subtitle,
        headers,
        data,
        orientation
      });
      addToast('PDF document downloaded successfully!', 'success');
    } catch (err) {
      addToast('Failed to export PDF file', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="btn-group shadow-sm" role="group" aria-label="Export Options">
      <button
        type="button"
        className="btn btn-outline-success btn-sm d-flex align-items-center gap-1 fw-semibold"
        onClick={handleExcel}
        disabled={disabled || exporting || !data?.length}
        title="Download Excel Spreadsheet (.xlsx)"
      >
        <i className="bi bi-file-earmark-excel"></i>
        <span className="d-none d-md-inline">Excel</span>
      </button>
      <button
        type="button"
        className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1 fw-semibold"
        onClick={handlePdf}
        disabled={disabled || exporting || !data?.length}
        title="Download PDF Document (.pdf)"
      >
        <i className="bi bi-file-earmark-pdf"></i>
        <span className="d-none d-md-inline">PDF</span>
      </button>
    </div>
  );
};
