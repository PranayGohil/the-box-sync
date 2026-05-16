import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import { AuthContext } from 'contexts/AuthContext';
import { Link } from 'react-router-dom';

const NavUserMenu = () => {
  const { isLogin } = useSelector((state) => state.auth);
  const { currentUser } = useContext(AuthContext);

  if (!isLogin || !currentUser) {
    return <></>;
  }

  return (
    <Link to="/settings/profile" className="user-container d-flex">
      <div className="d-flex user position-relative">
        <img className="profile" alt={currentUser?.namne || 'Restaurant'} src={process.env.REACT_APP_UPLOAD_DIR + currentUser?.logo} />
        <div className="name">{currentUser?.name || 'Restaurant'}</div>
      </div>
    </Link>
  );
};

export default React.memo(NavUserMenu);
