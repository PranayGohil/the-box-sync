import React from 'react';
import { Link } from 'react-router-dom';
import { DEFAULT_PATHS } from 'config.js';

const NavLogo = () => {
  return (
    <div className="logo position-relative">
      <Link to={DEFAULT_PATHS.APP} className="d-flex align-items-center">
        <img 
          src="/img/logo/logo-light.png" 
          alt="logo" 
          style={{ 
            maxHeight: "34px", 
            width: "auto", 
            maxWidth: "100%", 
            objectFit: "contain", 
            display: "block" 
          }} 
        />
      </Link>
      <style>{`
        /* Overrides to ensure the logo is never cut off or stretched */
        .logo {
          width: auto !important;
          max-width: 160px !important;
        }
        .logo a {
          width: auto !important;
          max-width: 100% !important;
          overflow: visible !important;
          display: flex !important;
          align-items: center !important;
        }
        .logo img, .logo .img {
          width: auto !important;
          height: auto !important;
          max-height: 34px !important;
          max-width: 100% !important;
          object-fit: contain !important;
          object-position: left !important;
          min-height: auto !important;
        }
        /* Mobile nav specific adjustments */
        @media (max-width: 991.98px) {
          .logo {
            margin-bottom: 0 !important;
            padding: 0 !important;
            display: flex !important;
            align-items: center !important;
          }
          .logo img, .logo .img {
            max-height: 22px !important;
          }
        }
      `}</style>
    </div>
  );
};
export default React.memo(NavLogo);
