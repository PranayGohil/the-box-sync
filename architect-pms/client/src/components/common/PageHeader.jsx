import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PageHeader = ({
  title,
  subtitle,
  icon: Icon,
  iconColor = "var(--accent-primary)",
  iconBg = "#eff1fe",
  showBack = false,
  backPath,
  backLabel = "Back",
  onBack,
  badge,
  children,
  className = "",
  style = {},
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={`page-header-container ${className}`} style={style}>
      {/* Main Title Block: Icon + Title & Subtitle + Back Button */}
      <div className="page-header-main">
        {Icon && (
          <div
            className="page-header-icon-badge"
            style={{ background: iconBg }}
          >
            <Icon size={22} color={iconColor} />
          </div>
        )}

        <div className="page-header-title-block">
          <div className="page-header-title-row">
            <h1 className="page-header-title">{title}</h1>
            {badge}
          </div>

          {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </div>
      </div>
      {/* Back Button positioned below tagline and title */}
      {showBack && (
        <div
          className="page-header-back-wrapper"
          style={{ marginTop: "0.65rem" }}
        >
          <button
            type="button"
            onClick={handleBack}
            className="page-header-back-btn"
          >
            <ArrowLeft size={16} /> <span>{backLabel}</span>
          </button>
        </div>
      )}

      {/* Action Buttons Slot */}
      {children && <div className="page-header-actions">{children}</div>}
    </div>
  );
};

export default PageHeader;
