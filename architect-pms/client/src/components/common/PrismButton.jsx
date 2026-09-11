import React from 'react';

const PrismButton = ({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'icon'
  size = 'md',         // 'sm' | 'md' | 'lg'
  icon: Icon,
  className = '',
  onClick,
  type = 'button',
  disabled = false,
  title,
  style = {},
  ...props
}) => {
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={`prism-btn prism-btn-${variant} prism-btn-${size} ${className}`}
      style={style}
      {...props}
    >
      {Icon && <Icon size={iconSize} className="prism-btn-icon-svg" />}
      {children && <span>{children}</span>}
    </button>
  );
};

export default PrismButton;
