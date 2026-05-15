/* Theme Settings & Niches Buttons */
import React, { useState } from 'react';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import SettingsModal from './SettingsModal';

const RightButtons = () => {
  const [isShowSettingsModal, setIsShowSettingsModal] = useState(false);
  const showSettingsModal = () => {
    setIsShowSettingsModal(true);
  };
  const closeSettingsModal = () => {
    setIsShowSettingsModal(false);
    document.documentElement.click();
  };

  return (
    <>
      {/* Settings buttons container removed */}
      <SettingsModal show={isShowSettingsModal} handleClose={closeSettingsModal} />
    </>
  );
};
export default RightButtons;
