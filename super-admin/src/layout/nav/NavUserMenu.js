import React, { useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { AuthContext } from 'contexts/AuthContext';
import { Link } from 'react-router-dom';

const NavUserMenu = () => {
  const { isLogin } = useSelector((state) => state.auth);
  const { currentUser } = useContext(AuthContext);
  const [isWideLogo, setIsWideLogo] = useState(false);

  const logoUrl = currentUser?.logo
    ? `${process.env.REACT_APP_UPLOAD_DIR}${currentUser.logo}`
    : null;

  useEffect(() => {
    if (!logoUrl) { setIsWideLogo(false); return; }
    const img = new Image();
    img.onload = () => setIsWideLogo(img.naturalWidth >= img.naturalHeight * 2);
    img.onerror = () => setIsWideLogo(false);
    img.src = logoUrl;
  }, [logoUrl]);

  if (!isLogin || !currentUser) {
    return <></>;
  }

  return (
    <Link to="/settings/profile" className="user-container d-flex">
      <div className="d-flex user position-relative align-items-center">
        {isWideLogo ? (
          <img
            alt={currentUser?.name || 'Restaurant'}
            src={logoUrl}
            style={{ height: '32px', width: 'auto', maxWidth: '140px', objectFit: 'contain' }}
          />
        ) : (
          <>
            <img className="profile" style={{ objectFit: "cover" }} alt={currentUser?.name || 'Restaurant'} src={logoUrl} />
            <div className="name">{currentUser?.name || 'Restaurant'}</div>
          </>
        )}
      </div>
    </Link>
  );
};

export default React.memo(NavUserMenu);
