import React, { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import classNames from 'classnames';

import { MENU_BEHAVIOUR, MENU_PLACEMENT } from 'constants.js';
import NavUserMenu from './NavUserMenu';
import NavIconMenu from './NavIconMenu';
import MainMenu from './main-menu/MainMenu';
import NavLogo from './NavLogo';
import NavMobileButtons from './NavMobileButtons';
import { menuChangeAttrMenuAnimate, menuChangeCollapseAll } from './main-menu/menuSlice';
import NavLanguageSwitcher from './NavLanguageSwitcher';

const DELAY = 80;

const premiumNavStyles = `
  /* ── Premium Nav Enhancements — gradient colors unchanged ── */

  /* Glassmorphic depth for horizontal nav */
  html[data-placement="horizontal"] .nav-container {
    backdrop-filter: blur(12px) saturate(180%) !important;
    -webkit-backdrop-filter: blur(12px) saturate(180%) !important;
    box-shadow: 0 4px 30px rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.08) inset !important;
  }

  /* Glassmorphic depth for vertical nav */
  html[data-placement="vertical"] .nav-container {
    backdrop-filter: blur(12px) saturate(180%) !important;
    -webkit-backdrop-filter: blur(12px) saturate(180%) !important;
    box-shadow: 4px 0 30px rgba(0,0,0,0.18), -1px 0 0 rgba(255,255,255,0.06) inset !important;
  }

  /* Smooth transition on all nav links */
  .nav-container .menu li a {
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }

  /* ── HORIZONTAL — Active state ── */
  html[data-placement="horizontal"] .nav-container .menu > li > a.active,
  html[data-placement="horizontal"] .nav-container .menu > li > a.active:hover {
    background: rgba(255,255,255,0.2) !important;
    box-shadow: 0 2px 16px rgba(0,0,0,0.15) !important;
    color: #ffffff !important;
    font-weight: 700 !important;
    position: relative;
  }

  /* White underline bar for horizontal active item */
  html[data-placement="horizontal"] .nav-container .menu > li > a.active::after {

    position: absolute !important;
    bottom: 0 !important;
    left: 18% !important;
    width: 64% !important;
    height: 3px !important;
    background: rgba(255,255,255,0.95) !important;
    border-radius: 3px 3px 0 0 !important;
  }

  /* Hover for horizontal items */
  html[data-placement="horizontal"] .nav-container .menu > li > a:hover {
    background: rgba(255,255,255,0.1) !important;
  }

  /* ── VERTICAL — Active state ── */
  html[data-placement="vertical"] .nav-container .menu li a.active {
    background: rgba(255,255,255,0.22) !important;
    box-shadow: 0 2px 12px rgba(0,0,0,0.12) !important;
    color: #ffffff !important;
    font-weight: 700 !important;
    position: relative;
  }

  /* White left accent bar for vertical active item */
  html[data-placement="vertical"] .nav-container .menu li a.active::before {
    content: '' !important;
    position: absolute !important;
    left: 0 !important;
    top: 18% !important;
    height: 64% !important;
    width: 3px !important;
    background: rgba(255,255,255,0.95) !important;
    border-radius: 0 3px 3px 0 !important;
  }

  /* Icon brightness on active */
  html[data-placement="horizontal"] .nav-container .menu > li > a.active .icon,
  html[data-placement="vertical"] .nav-container .menu li a.active .icon {
    filter: brightness(1.5) !important;
  }

  /* Logo text — premium polish */
  .nav-container .logo h1 {
    font-size: 1.35rem !important;
    letter-spacing: 0.14em !important;
    text-shadow: 0 2px 10px rgba(0,0,0,0.3) !important;
    font-weight: 900 !important;
  }

  /* User name — subtle polish */
  .nav-container .user .name {
    font-size: 0.78rem !important;
    letter-spacing: 0.02em !important;
    text-shadow: 0 1px 4px rgba(0,0,0,0.2) !important;
  }

  /* Premium nav-shadow glow */
  .nav-container .nav-shadow {
    box-shadow: 0 8px 32px rgba(0,0,0,0.22), 0 1px 0 rgba(255,255,255,0.06) inset !important;
  }

  /* Fix for strange diagonal lines or artifacts on menu click/focus */
  .nav-container a, 
  .nav-container button, 
  .nav-container .dropdown-toggle,
  .nav-container [role="button"] {
    outline: none !important;
    box-shadow: none !important;
    -webkit-tap-highlight-color: transparent !important;
  }

  .nav-container .cs-icon {
    vertical-align: middle !important;
    transform: none !important;
  }
`;

const Nav = () => {
  const dispatch = useDispatch();
  const { navClasses, placementStatus, behaviourStatus, attrMobile, menuPadding } = useSelector((state) => state.menu);
  const mouseActionTimer = useRef(null);

  // Vertical menu semihidden state showing
  // Only works when the vertical menu is active and mobile menu closed
  const onMouseEnterDelay = () => {
    if (placementStatus.placementHtmlData === MENU_PLACEMENT.Vertical && behaviourStatus.behaviourHtmlData === MENU_BEHAVIOUR.Unpinned && attrMobile !== true) {
      dispatch(menuChangeCollapseAll(false));
      dispatch(menuChangeAttrMenuAnimate('show'));
    }
  };

  // Delayed one that hides or shows the menu. It's required to prevent collapse animation getting stucked
  const onMouseEnter = () => {
    if (mouseActionTimer.current) clearTimeout(mouseActionTimer.current);

    mouseActionTimer.current = setTimeout(() => {
      onMouseEnterDelay();
    }, DELAY);
  };

  // Vertical menu semihidden state hiding
  // Only works when the vertical menu is active and mobile menu closed
  const onMouseLeaveDelay = () => {
    if (placementStatus.placementHtmlData === MENU_PLACEMENT.Vertical && behaviourStatus.behaviourHtmlData === MENU_BEHAVIOUR.Unpinned && attrMobile !== true) {
      dispatch(menuChangeCollapseAll(true));
      dispatch(menuChangeAttrMenuAnimate('hidden'));
    }
  };

  const onMouseLeave = () => {
    if (mouseActionTimer.current) clearTimeout(mouseActionTimer.current);
    mouseActionTimer.current = setTimeout(() => {
      onMouseLeaveDelay();
    }, DELAY);
  };

  return (
    <div id="nav" className={classNames('nav-container d-flex', navClasses)} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <style>{premiumNavStyles}</style>
      <div
        className="nav-content d-flex"
        style={placementStatus.placementHtmlData === MENU_PLACEMENT.Horizontal && menuPadding ? { paddingRight: menuPadding } : {}}
      >
        <NavLogo />
        {/* <NavLanguageSwitcher /> */}
        <NavUserMenu />
        <NavIconMenu />
        <MainMenu />
        <NavMobileButtons />
      </div>
      <div className="nav-shadow" />
    </div>
  );
};
export default React.memo(Nav);
