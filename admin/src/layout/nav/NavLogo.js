import React from 'react';
import { Link } from 'react-router-dom';
import { DEFAULT_PATHS } from 'config.js';

const NavLogo = () => {
  return (
    <div className="logo position-relative">
      <Link to={DEFAULT_PATHS.APP}>
        <img src="/img/logo/logo-light.png" alt="logo" style={{ maxHeight: "38px", width: "auto", display: "block" }} />
      </Link>
    </div>
  );
};
export default React.memo(NavLogo);
