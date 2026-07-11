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

const DELAY = 80;

const premiumNavStyles = `
  /* ── Premium Nav Enhancements — gradient colors unchanged ── */

  /* Glassmorphic depth for horizontal nav */
  html[data-placement="horizontal"] .nav-container {
    backdrop-filter: blur(12px) saturate(180%) !important;
    -webkit-backdrop-filter: blur(12px) saturate(180%) !important;
    box-shadow: 0 4px 30px rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.08) inset !important;
    background: #23b3f4 !important;
  }

  /* Glassmorphic depth for vertical nav */
  html[data-placement="vertical"] .nav-container {
    backdrop-filter: blur(12px) saturate(180%) !important;
    -webkit-backdrop-filter: blur(12px) saturate(180%) !important;
    box-shadow: 4px 0 30px rgba(0,0,0,0.18), -1px 0 0 rgba(255,255,255,0.06) inset !important;
    background: #23b3f4 !important;
  }

  .logo {
    background: transparent !important;
  }

  /* Smooth transition on all nav links */
  .nav-container .menu li a {
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }

  /* ── HORIZONTAL — Active state ── */
  html[data-placement="horizontal"] .nav-container .menu > li > a.active,
  html[data-placement="horizontal"] .nav-container .menu > li > a.active:hover,
  html[data-placement="horizontal"] .nav-container .menu > li.show > a,
  html[data-placement="horizontal"] .nav-container .menu > li.show > a:hover {
    background: rgba(255,255,255,0.2) !important;
    box-shadow: 0 2px 16px rgba(0,0,0,0.15) !important;
    color: #ffffff !important;
    font-weight: 700 !important;
    position: relative;
    z-index: 1010 !important;
  }

  /* White underline bar for horizontal active item */
  html[data-placement="horizontal"] .nav-container .menu > li > a.active::after {
    content: '' !important;
    position: absolute !important;
    bottom: 0 !important;
    left: 18% !important;
    width: 64% !important;
    height: 3px !important;
    background: rgba(255,255,255,0.95) !important;
    border-radius: 3px 3px 0 0 !important;
    z-index: 1011 !important;
    border: none !important;
    display: block !important;
    transform: none !important;
  }

  html[data-placement="horizontal"] .nav-container .menu > li.show > a::after {
    content: none !important;
    border: none !important;
  }

  /* Hover for horizontal items */
  html[data-placement="horizontal"] .nav-container .menu > li > a:hover {
    background: rgba(255,255,255,0.1) !important;
  }

  /* ── VERTICAL — Active state ── */
  html[data-placement="vertical"] .nav-container .menu li a.active,
  html[data-placement="vertical"] .nav-container .menu li.show > a {
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

  html[data-placement="vertical"] .nav-container .menu li.show > a::before {
    content: none !important;
  }

  /* Icon brightness on active */
  html[data-placement="horizontal"] .nav-container .menu > li > a.active .icon,
  html[data-placement="vertical"] .nav-container .menu li a.active .icon {
    filter: brightness(1.5) !important;
  }

  /* Logo text — premium polish */
  /*
  .nav-container .logo h1 {
    font-size: 1.35rem !important;
    letter-spacing: 0.14em !important;
    text-shadow: 0 2px 10px rgba(0,0,0,0.3) !important;
    font-weight: 900 !important;
  }
  */

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

  /* Ensure both the mouse cursor and blinking text caret are always 100% visible and responsive */
  input, textarea, .form-control {
    cursor: text !important;
    caret-color: currentColor !important;
  }

  select, select.form-control {
    cursor: pointer !important;
  }

  /* ── Mobile Sidebar & Vertical Navigation Premium Interactive Styles ── */
  html[data-dimension="mobile"] .nav-container .menu-container .menu li,
  html[data-placement="vertical"] .nav-container .menu-container .menu li {
    margin-bottom: 10px !important;
  }

  html[data-dimension="mobile"] .nav-container .menu-container .menu li a,
  html[data-placement="vertical"] .nav-container .menu-container .menu li a {
    display: flex !important;
    align-items: center !important;
    padding: 0.75rem 1.25rem !important;
    color: rgba(255, 255, 255, 0.85) !important;
    background: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    border-radius: 12px !important;
    font-weight: 600 !important;
    font-size: 14px !important;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
    text-decoration: none !important;
  }

  /* Hover state */
  html[data-dimension="mobile"] .nav-container .menu-container .menu li a:hover,
  html[data-placement="vertical"] .nav-container .menu-container .menu li a:hover {
    color: #ffffff !important;
    background: rgba(255, 255, 255, 0.12) !important;
    border-color: rgba(255, 255, 255, 0.2) !important;
    transform: translateX(4px) !important;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1) !important;
  }

  /* Active state */
  html[data-dimension="mobile"] .nav-container .menu-container .menu li a.active,
  html[data-placement="vertical"] .nav-container .menu-container .menu li a.active {
    color: #ffffff !important;
    background: rgba(255, 255, 255, 0.22) !important;
    border-color: rgba(255, 255, 255, 0.4) !important;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.1) !important;
    font-weight: 700 !important;
    transform: translateX(2px) !important;
  }

  /* Left accent bar for active item on vertical/mobile */
  html[data-dimension="mobile"] .nav-container .menu-container .menu li a.active::before,
  html[data-placement="vertical"] .nav-container .menu-container .menu li a.active::before {
    content: '' !important;
    position: absolute !important;
    left: 8px !important;
    top: 25% !important;
    height: 50% !important;
    width: 3px !important;
    background: #ffffff !important;
    border-radius: 4px !important;
  }

  /* Icon and label spacing and style adjustments */
  html[data-dimension="mobile"] .nav-container .menu-container .menu li a .icon,
  html[data-placement="vertical"] .nav-container .menu-container .menu li a .icon {
    margin-right: 12px !important;
    transition: transform 0.3s ease !important;
    stroke: rgba(255, 255, 255, 0.9) !important;
  }

  html[data-dimension="mobile"] .nav-container .menu-container .menu li a:hover .icon,
  html[data-placement="vertical"] .nav-container .menu-container .menu li a:hover .icon {
    transform: scale(1.1) !important;
  }

  /* User profile card visual enhancement in sidebar */
  html[data-dimension="mobile"] .nav-container .user-container,
  html[data-placement="vertical"] .nav-container .user-container {
    padding: 0 1.25rem !important;
    margin-bottom: 1.5rem !important;
    width: 100% !important;
  }

  html[data-dimension="mobile"] .nav-container .user-container .user,
  html[data-placement="vertical"] .nav-container .user-container .user {
    background: rgba(255, 255, 255, 0.08) !important;
    border: 1px solid rgba(255, 255, 255, 0.12) !important;
    border-radius: 16px !important;
    padding: 12px !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    transition: all 0.3s ease !important;
    text-decoration: none !important;
  }

  html[data-dimension="mobile"] .nav-container .user-container .user:hover,
  html[data-placement="vertical"] .nav-container .user-container .user:hover {
    background: rgba(255, 255, 255, 0.12) !important;
    border-color: rgba(255, 255, 255, 0.2) !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1) !important;
  }

  html[data-dimension="mobile"] .nav-container .user-container .user .name,
  html[data-placement="vertical"] .nav-container .user-container .user .name {
    color: #ffffff !important;
    font-weight: 700 !important;
    margin-top: 8px !important;
    font-size: 14px !important;
    letter-spacing: 0.3px !important;
  }

  /* Custom positioning to fix the logout button at the bottom of mobile sidebar / vertical menu with a divider line */
  html[data-dimension="mobile"] .nav-container .nav-content .menu-icons,
  html[data-placement="vertical"] .nav-container .nav-content .menu-icons {
    margin-top: auto !important;
    order: 10 !important;
    padding-top: 20px !important;
    padding-bottom: 15px !important;
    width: 80% !important;
    border-top: 1px solid rgba(255, 255, 255, 0.2) !important;
  }

  /* Logout button alignment & styling */
  html[data-dimension="mobile"] .nav-container .nav-content .menu-icons .nav-logout-btn,
  html[data-placement="vertical"] .nav-container .nav-content .menu-icons .nav-logout-btn {
    width: 100% !important;
    padding: 0.75rem 1.5rem !important;
    height: auto !important;
    background: rgba(255, 255, 255, 0.06) !important;
    border: 1px solid rgba(255, 255, 255, 0.12) !important;
    border-radius: 12px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    color: #ffffff !important;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
    font-size: 13.5px !important;
  }

  html[data-dimension="mobile"] .nav-container .nav-content .menu-icons .nav-logout-btn:hover,
  html[data-placement="vertical"] .nav-container .nav-content .menu-icons .nav-logout-btn:hover {
    background: rgba(239, 68, 68, 0.15) !important;
    border-color: rgba(239, 68, 68, 0.3) !important;
    color: #fca5a5 !important;
    box-shadow: 0 4px 15px rgba(239, 68, 68, 0.1) !important;
  }

  /* Reduce space between logo/user profile and menu in mobile/vertical sidebar */
  html[data-dimension="mobile"] .nav-container .nav-content .user-container,
  html[data-placement="vertical"] .nav-container .nav-content .user-container {
    min-height: auto !important;
    margin-bottom: 0px !important;
  }
  html[data-dimension="mobile"] .nav-container .nav-content .menu-container,
  html[data-placement="vertical"] .nav-container .nav-content .menu-container {
    margin-top: 0.5rem !important;
  }
  html[data-dimension="mobile"] .nav-container .nav-content .menu-container .menu,
  html[data-placement="vertical"] .nav-container .nav-content .menu-container .menu {
    padding-top: 0px !important;
  }
`;

const Nav = () => {
  const dispatch = useDispatch();
  const { navClasses, placementStatus, behaviourStatus, attrMobile, menuPadding } = useSelector((state) => state.menu);
  const mouseActionTimer = useRef(null);

  // Vertical menu semihidden state showing
  const onMouseEnterDelay = () => {
    if (placementStatus.placementHtmlData === MENU_PLACEMENT.Vertical && behaviourStatus.behaviourHtmlData === MENU_BEHAVIOUR.Unpinned && attrMobile !== true) {
      dispatch(menuChangeCollapseAll(false));
      dispatch(menuChangeAttrMenuAnimate('show'));
    }
  };

  const onMouseEnter = () => {
    if (mouseActionTimer.current) clearTimeout(mouseActionTimer.current);
    mouseActionTimer.current = setTimeout(() => {
      onMouseEnterDelay();
    }, DELAY);
  };

  // Vertical menu semihidden state hiding
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
