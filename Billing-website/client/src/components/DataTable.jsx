import React from 'react';

export const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No records found',
  emptyIcon = 'bi-inbox',
  onRowClick = null
}) => {
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="mt-3 text-muted font-weight-medium">Loading data, please wait...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-5">
        <div style={{ fontSize: '3rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
          <i className={`bi ${emptyIcon}`}></i>
        </div>
        <h6 style={{ fontWeight: 700, color: 'var(--text-main)' }}>{emptyMessage}</h6>
        <p className="text-muted" style={{ fontSize: '0.85rem' }}>No data currently available in this view.</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-zenith">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                style={{
                  textAlign: col.align || 'left',
                  width: col.width || 'auto'
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr
              key={row._id || row.id || rowIdx}
              onClick={() => onRowClick && onRowClick(row)}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {columns.map((col, colIdx) => (
                <td
                  key={colIdx}
                  style={{ textAlign: col.align || 'left' }}
                >
                  {col.render ? col.render(row, rowIdx) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
