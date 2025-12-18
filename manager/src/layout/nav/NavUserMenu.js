import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import { AuthContext } from 'contexts/AuthContext';
import { useHistory } from 'react-router-dom';

const NavUserMenu = () => {
  const { isLogin } = useSelector((state) => state.auth);
  const { currentUser } = useContext(AuthContext);
  const history = useHistory();

  if (!isLogin || !currentUser) {
    return <></>;
  }

  return (
    <div className="user-container d-flex">
      <div className="d-flex user position-relative">
        <img className="profile" alt={currentUser?.namne || 'Restaurant'} src={process.env.REACT_APP_UPLOAD_DIR + currentUser?.logo} />
        <div className="name">{currentUser?.name || 'Restaurant'}</div>
      </div>
    </div>
  );
};

export default React.memo(NavUserMenu);
