import React from 'react';
import { Link } from 'react-router-dom';
import { DEFAULT_PATHS } from 'config.js';

const NavLogo = () => {
  return (
    <div className="logo position-relative">
     <Link to={DEFAULT_PATHS.APP} className="d-flex align-items-center">
        {/* <div className="img" /> */}
        <h1 className="fw-bold text-white pb-0 mb-0"> THE BOX </h1>
        <span className="fw-bold text-white pb-0 mb-0 ms-1"> - Attendance</span>
      </Link>
    </div>
  );
};
export default React.memo(NavLogo);
