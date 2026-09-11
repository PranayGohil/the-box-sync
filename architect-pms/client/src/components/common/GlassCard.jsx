import React from 'react';

const GlassCard = ({ children, className = '', hover = false, style = {}, onClick }) => (
  <div
    className={`glass-card ${hover ? 'glass-card-hover' : ''} ${className}`}
    style={style}
    onClick={onClick}
  >
    {children}
  </div>
);

export default GlassCard;
