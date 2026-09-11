import React, { createContext, useContext, useState, useCallback } from 'react';
import { Modal } from 'react-bootstrap';
import { CheckCircle2, AlertTriangle, Info, ShieldAlert, X } from 'lucide-react';

const ModalContext = createContext(null);

export const ModalProvider = ({ children }) => {
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info', // 'success', 'error', 'warning', 'info'
    isConfirm: false,
    confirmText: 'OK',
    cancelText: 'Cancel',
    onConfirm: null,
    onCancel: null,
  });

  const showAlert = useCallback(({ title = 'Notification', message = '', type = 'info', confirmText = 'OK' }) => {
    return new Promise((resolve) => {
      setModalConfig({
        isOpen: true,
        title,
        message,
        type,
        isConfirm: false,
        confirmText,
        cancelText: 'Cancel',
        onConfirm: () => {
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
          resolve(false);
        },
      });
    });
  }, []);

  const showConfirm = useCallback(
    ({
      title = 'Confirm Action',
      message = 'Are you sure you want to proceed?',
      type = 'warning',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
    }) => {
      return new Promise((resolve) => {
        setModalConfig({
          isOpen: true,
          title,
          message,
          type,
          isConfirm: true,
          confirmText,
          cancelText,
          onConfirm: () => {
            setModalConfig((prev) => ({ ...prev, isOpen: false }));
            resolve(true);
          },
          onCancel: () => {
            setModalConfig((prev) => ({ ...prev, isOpen: false }));
            resolve(false);
          },
        });
      });
    },
    []
  );

  const handleClose = () => {
    if (modalConfig.onCancel) modalConfig.onCancel();
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const getIcon = () => {
    switch (modalConfig.type) {
      case 'success':
        return <CheckCircle2 size={24} color="#16a34a" />;
      case 'error':
        return <ShieldAlert size={24} color="#ef4444" />;
      case 'warning':
        return <AlertTriangle size={24} color="#f59e0b" />;
      default:
        return <Info size={24} color="var(--accent-primary)" />;
    }
  };

  const getIconBg = () => {
    switch (modalConfig.type) {
      case 'success':
        return '#ecfdf5';
      case 'error':
        return '#fef2f2';
      case 'warning':
        return '#fffbeb';
      default:
        return '#eff1fe';
    }
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      <Modal show={modalConfig.isOpen} onHide={handleClose} centered backdrop="static">
        <div
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '18px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '10px',
                  background: getIconBg(),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {getIcon()}
              </div>
              <h3
                style={{
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  color: 'var(--text-primary)',
                  margin: 0,
                }}
              >
                {modalConfig.title}
              </h3>
            </div>
            <button
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '1.4rem 1.5rem' }}>
            <p
              style={{
                fontSize: '0.885rem',
                color: 'var(--text-secondary)',
                margin: 0,
                lineHeight: 1.55,
              }}
            >
              {modalConfig.message}
            </p>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              gap: '0.6rem',
              justifyContent: 'flex-end',
              background: '#f8fafc',
            }}
          >
            {modalConfig.isConfirm && (
              <button
                type="button"
                onClick={() => {
                  if (modalConfig.onCancel) modalConfig.onCancel();
                }}
                style={{
                  background: '#fff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '0.5rem 1.1rem',
                  fontSize: '0.855rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {modalConfig.cancelText}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (modalConfig.onConfirm) modalConfig.onConfirm();
              }}
              className={
                modalConfig.type === 'error' && modalConfig.isConfirm
                  ? 'btn btn-danger'
                  : 'prism-btn-primary'
              }
              style={{
                padding: '0.5rem 1.3rem',
                fontSize: '0.855rem',
                borderRadius: '8px',
                fontWeight: 700,
              }}
            >
              {modalConfig.confirmText}
            </button>
          </div>
        </div>
      </Modal>
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
