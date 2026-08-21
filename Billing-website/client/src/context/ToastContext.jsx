import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Floating Toast Notification Container */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '380px'
        }}
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          const bg = isSuccess ? '#ecfdf5' : isError ? '#fef2f2' : isWarning ? '#fffbeb' : '#eef2ff';
          const border = isSuccess ? '#10b981' : isError ? '#ef4444' : isWarning ? '#f59e0b' : '#6366f1';
          const textColor = isSuccess ? '#065f46' : isError ? '#991b1b' : isWarning ? '#92400e' : '#3730a3';
          const icon = isSuccess ? 'bi-check-circle-fill' : isError ? 'bi-exclamation-triangle-fill' : isWarning ? 'bi-exclamation-circle-fill' : 'bi-info-circle-fill';

          return (
            <div
              key={toast.id}
              style={{
                background: bg,
                borderLeft: `4px solid ${border}`,
                color: textColor,
                padding: '0.85rem 1.15rem',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                animation: 'slideIn 0.2s ease-out'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
                <i className={`bi ${icon}`} style={{ fontSize: '1.1rem', color: border }}></i>
                <span>{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                style={{ background: 'none', border: 'none', color: textColor, cursor: 'pointer', opacity: 0.6 }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
