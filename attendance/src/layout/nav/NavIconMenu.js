import React, { useState, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, Button } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { settingsChangeColor } from 'settings/settingsSlice';
import { AuthContext } from 'contexts/AuthContext';
import IconMenuNotifications from './notifications/Notifications';
import SearchModal from './search/SearchModal';

const customStyles = `
    .interactive-card {
      background: rgba(255, 255, 255, 0.98) !important;
      backdrop-filter: blur(15px) !important;
      border-radius: 1.5rem !important;
      border: 1px solid rgba(255, 255, 255, 0.8) !important;
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05) !important;
      transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1) !important;
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
`;

const NavIconMenu = () => {
  const history = useHistory();
  const { color } = useSelector((state) => state.settings);
  const { logout } = useContext(AuthContext);
  const dispatch = useDispatch();
  const brandColor = '#23b3f4';

  const onLightDarkModeClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(settingsChangeColor(color.includes('light') ? color.replace('light', 'dark') : color.replace('dark', 'light')));
  };
  const [showSearchModal, setShowSearchModal] = useState(false);

  const onSearchIconClick = (e) => {
    e.preventDefault();
    setShowSearchModal(true);
  };

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    logout();
    console.log('User logged out');
    setShowLogoutModal(false);
    history.push('/login');
  };
  return (
    <>
      <style>{customStyles}</style>
      <ul className="list-unstyled list-inline text-center menu-icons">
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

        <IconMenuNotifications />
      </ul>
      <SearchModal show={showSearchModal} setShow={setShowSearchModal} />

      <Modal show={showLogoutModal} onHide={() => setShowLogoutModal(false)} centered contentClassName="interactive-card border-0 shadow-lg">
        <Modal.Header className="border-0 p-4 pb-0" closeButton>
          <Modal.Title className="fw-bold" style={{ color: brandColor }}>
            Session Management
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 text-center">
          <div className="logout-icon-container">
            <CsLineIcons icon="logout" size="30" />
          </div>
          <h4 className="fw-bold text-dark mb-2">Confirm Logout</h4>
          {sessionStorage.getItem('wfh_active') === 'true' ? (
            <p className="text-danger smaller fw-bold mb-0">
              WFH Tracking is currently active. You should Clock-Out first. Logging out will immediately stop your background tracking. Proceed?
            </p>
          ) : (
            <p className="text-muted smaller fw-bold mb-0">Are you sure you want to end your session? You will need to login again to access the dashboard.</p>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 p-4 pt-0 d-flex justify-content-center gap-3">
          <Button variant="light" className="custom-btn-outline border-0 text-muted" onClick={() => setShowLogoutModal(false)}>
            Stay Signed In
          </Button>
          <Button variant="danger" className="custom-btn-outline border-danger text-danger px-5" onClick={handleLogout}>
            Yes, Logout
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default React.memo(NavIconMenu);
