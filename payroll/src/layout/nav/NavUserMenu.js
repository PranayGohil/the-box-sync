import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { AuthContext } from 'contexts/AuthContext';

const NavUserMenu = () => {
  const { isLogin } = useSelector((state) => state.auth);
  const { currentUser } = useContext(AuthContext);

  if (!isLogin || !currentUser) {
    return <></>;
  }

  return (
    <div className="user-container d-flex">
      <Link to="/settings" className="d-flex user position-relative">
        <img
          className="profile"
          alt={currentUser?.name || 'Restaurant'}
          src={process.env.REACT_APP_UPLOAD_DIR + currentUser?.logo}
          style={{
            maxHeight: '24px',
            maxWidth: '100%',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            borderRadius: '0'
          }}
        />
      </Link>
    </div>
  );
};

export default React.memo(NavUserMenu);

