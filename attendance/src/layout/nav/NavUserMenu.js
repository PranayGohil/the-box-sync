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

  const handleClick = () => {
    if (currentUser?.role === 'staff') {
      history.push('/profile');
    }
  };

  const imageSrc = currentUser?.photo 
    ? `${process.env.REACT_APP_UPLOAD_DIR}${currentUser.photo}`
    : currentUser?.logo 
      ? `${process.env.REACT_APP_UPLOAD_DIR}${currentUser.logo}`
      : '/img/profile/profile-9.webp';

  return (
    <div className="user-container d-flex" onClick={handleClick} style={{ cursor: currentUser?.role === 'staff' ? 'pointer' : 'default' }}>
      <div className="d-flex user position-relative">
        <img className="profile" alt={currentUser?.name || 'User'} src={imageSrc} />
        <div className="name">{currentUser?.name || 'User'}</div>
      </div>
    </div>
  );
};

export default React.memo(NavUserMenu);
