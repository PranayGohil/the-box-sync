import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, Button } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { settingsChangeColor } from 'settings/settingsSlice';
import IconMenuNotifications from './notifications/Notifications';
import SearchModal from './search/SearchModal';

const customStyles = `
    .interactive-card {
      background: rgba(255, 255, 255, 0.98) !important;
      backdrop-filter: blur(15px) !important;
      border-radius: 1.5rem !important;
      border: 1px solid rgba(255, 255, 255, 0.8) !important;
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05) !important;
      overflow: hidden;
    }
    .custom-btn-outline {
      background: #ffffff !important;
      border: 1.5px solid #23b3f4 !important;
      color: #23b3f4 !important;
      border-radius: 50px !important;
      padding: 0.6rem 1.5rem !important;
      font-weight: 700 !important;
      transition: all 0.3s ease !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    .custom-btn-outline:hover {
      background: #23b3f4 !important;
      color: #ffffff !important;
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(35, 179, 244, 0.2) !important;
    }
    .logout-icon-container {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(244, 63, 94, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      color: #f43f5e;
    }
    .logout-text-link {
      color: rgba(255, 255, 255, 0.8) !important;
      font-weight: 700 !important;
      text-decoration: none !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 10px !important;
      padding: 10px 24px !important;
      border-radius: 12px !important;
      transition: all 0.25s ease !important;
      border: 1px solid transparent !important;
      background: transparent !important;
      width: 100% !important;
    }
    .logout-text-link:hover {
      background: rgba(255, 255, 255, 0.08) !important;
      color: #ffffff !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
    }
`;

const NavIconMenu = () => {
  const history = useHistory();
  const dispatch = useDispatch();
  const brandColor = '#23b3f4';
  const { attrMobile, placementStatus } = useSelector((state) => state.menu);
  const isSidebar = attrMobile === true || placementStatus?.placementHtmlData === 'Vertical';

  const [showSearchModal, setShowSearchModal] = useState(false);

  const onSearchIconClick = (e) => {
    e.preventDefault();
    setShowSearchModal(true);
  };

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    console.log('User logged out');
    setShowLogoutModal(false);
    history.push('/login');
  }

  return (
    <>
      <style>{customStyles}</style>
      {isSidebar ? (
        <div className="menu-icons text-center mb-0" style={{ alignSelf: 'center' }}>
          <a onClick={() => setShowLogoutModal(true)} style={{ cursor: 'pointer' }} className="logout-text-link">
            <CsLineIcons icon="logout" size="18" />
            <span style={{ fontSize: '15px', fontWeight: '700' }}>Logout</span>
          </a>
        </div>
      ) : (
        <ul className="list-unstyled list-inline text-center menu-icons mb-0">
          <li className="list-inline-item" title="Search">
            <a href="#/" onClick={onSearchIconClick}>
              <CsLineIcons icon="search" size="18" />
            </a>
          </li>
          <li className="list-inline-item" title="Logout">
            <a onClick={() => setShowLogoutModal(true)} style={{ cursor: 'pointer' }}>
              <CsLineIcons icon="logout" size="18" />
            </a>
          </li>
          {/* <IconMenuNotifications /> */}
        </ul>
      )}

      {/* THE BOX logo — pinned at very bottom of mobile sidebar drawer only */}
      {attrMobile === true && (
        <div className="sidebar-brand-footer">
          <img src="/img/logo/logo-light.png" alt="The Box" style={{ maxHeight: '20px', width: 'auto', objectFit: 'contain', opacity: 0.9 }} />
        </div>
      )}

      <SearchModal show={showSearchModal} setShow={setShowSearchModal} />

      <Modal
        show={showLogoutModal}
        onHide={() => setShowLogoutModal(false)}
        centered
        contentClassName="interactive-card border-0 shadow-lg"
      >
        <Modal.Header className="border-0 p-4 pb-0" closeButton>
          <Modal.Title className="fw-bold" style={{ color: brandColor }}>Session Management</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 text-center">
          <div className="logout-icon-container">
            <CsLineIcons icon="logout" size="30" />
          </div>
          <h4 className="fw-bold text-dark mb-2">Confirm Logout</h4>
          <p className="text-muted smaller fw-bold mb-0">Are you sure you want to end your session? You will need to login again to access the dashboard.</p>
        </Modal.Body>
        <Modal.Footer className="border-0 p-4 pt-0 d-flex justify-content-center gap-3">
          <Button
            variant="light"
            className="custom-btn-outline border-0 text-muted"
            onClick={() => setShowLogoutModal(false)}
          >
            Stay Signed In
          </Button>
          <Button
            variant="danger"
            className="custom-btn-outline border-danger text-danger px-5"
            onClick={handleLogout}
          >
            Yes, Logout
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default React.memo(NavIconMenu);
