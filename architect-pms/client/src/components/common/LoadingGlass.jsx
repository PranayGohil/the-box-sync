import React from 'react';

const LoadingGlass = ({ message = 'Loading...' }) => (
  <div style={{
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '4rem 2rem', textAlign: 'center',
  }}>
    <div
      style={{
        width: 44, height: 44,
        border: '3px solid #e2e8f0',
        borderTopColor: 'var(--accent-primary)',
        borderRadius: '50%',
        animation: 'spin 0.75s linear infinite',
        marginBottom: '1rem',
      }}
    />
    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500, margin: 0 }}>{message}</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default LoadingGlass;
