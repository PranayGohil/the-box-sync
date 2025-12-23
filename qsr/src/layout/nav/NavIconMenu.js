import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, Button } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { settingsChangeColor } from 'settings/settingsSlice';
import IconMenuNotifications from './notifications/Notifications';
import SearchModal from './search/SearchModal';

const NavIconMenu = () => {
  const history = useHistory();
  const { color } = useSelector((state) => state.settings);
  const dispatch = useDispatch();

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
    localStorage.removeItem('token');
    console.log('User logged out');
    setShowLogoutModal(false);
    history.push('/login');
  };
  return (
    <>
      <ul className="list-unstyled list-inline text-center menu-icons">
        <li className="list-inline-item" title="Search">
          <a href="#/" onClick={onSearchIconClick}>
            <CsLineIcons icon="search" size="18" />
          </a>
        </li>
        <li className="list-inline-item" title="Logout">
          <a onClick={() => setShowLogoutModal(true)}>
            <CsLineIcons icon="logout" size="18" />
          </a>
        </li>
        <li className="list-inline-item" title={`${color.includes('light') ? 'Light Mode' : 'Dark Mode'}`}>
          <a href="#/" id="colorButton" onClick={onLightDarkModeClick}>
            <CsLineIcons icon="light-on" size="18" className="light" />
            <CsLineIcons icon="light-off" size="18" className="dark" title="Dark Mode" />
          </a>
        </li>
        <IconMenuNotifications />
      </ul>
      <SearchModal show={showSearchModal} setShow={setShowSearchModal} />

      <Modal className="modal-close-out" show={showLogoutModal} onHide={() => setShowLogoutModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Logout</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to Logout</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLogoutModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleLogout}>
            Logout
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default React.memo(NavIconMenu);
