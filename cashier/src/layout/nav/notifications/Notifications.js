import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { Dropdown } from 'react-bootstrap';
import classNames from 'classnames';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { MENU_PLACEMENT } from 'constants.js';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { layoutShowingNavMenu } from 'layout/layoutSlice';
import { fetchNotifications } from './notificationSlice';

const NotificationsDropdownToggle = React.memo(
  React.forwardRef(({ onClick, expanded = false, isMobileHeader = false }, ref) => {
    if (isMobileHeader) {
      return (
        <a
          ref={ref}
          href="#/"
          className="notification-button menu-button position-relative"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            height: '100%',
            width: '50px',
            padding: '0',
            background: 'transparent',
            border: 'none',
          }}
          data-toggle="dropdown"
          aria-expanded={expanded}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClick(e);
          }}
        >
          <CsLineIcons icon="bell" size="20" style={{ color: '#ffffff' }} />
          <span
            className="position-absolute rounded-circle"
            style={{
              top: '12px',
              right: '12px',
              background: '#e91e63',
              width: '6px',
              height: '6px',
              display: 'block',
            }}
          />
        </a>
      );
    }
    return (
      <a
        ref={ref}
        href="#/"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          height: '100%',
          width: '50px',
          padding: '0',
          background: 'transparent',
          border: 'none',
        }}
        className="notification-button"
        data-toggle="dropdown"
        aria-expanded={expanded}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick(e);
        }}
      >
        <div className="position-relative d-inline-flex">
          <CsLineIcons icon="bell" size="18" />
          <span className="position-absolute notification-dot rounded-xl" />
        </div>
      </a>
    );
  })
);
const NotificationItem = ({ img = '', link = '', detail = '' }) => (
  <li className="mb-3 pb-3 border-bottom border-separator-light d-flex">
    <img src={img} className="me-3 sw-4 sh-4 rounded-xl align-self-center" alt="notification" />
    <div className="align-self-center">
      <NavLink to={link} activeClassName="">
        {detail}
      </NavLink>
    </div>
  </li>
);

const NotificationsDropdownMenu = React.memo(
  React.forwardRef(({ style, className, labeledBy, items }, ref) => {
    return (
      <div ref={ref} style={style} className={classNames('wide notification-dropdown scroll-out', className)} aria-labelledby={labeledBy}>
        <OverlayScrollbarsComponent
          options={{
            scrollbars: { autoHide: 'leave', autoHideDelay: 600 },
            overflowBehavior: { x: 'hidden', y: 'scroll' },
          }}
          className="scroll"
        >
          <ul className="list-unstyled border-last-none">
            {items.map((item, itemIndex) => (
              <NotificationItem key={`notificationItem.${itemIndex}`} detail={item.detail} link={item.link} img={item.img} />
            ))}
          </ul>
        </OverlayScrollbarsComponent>
      </div>
    );
  })
);
NotificationsDropdownMenu.displayName = 'NotificationsDropdownMenu';

const MENU_NAME = 'Notifications';
const Notifications = () => {
  const dispatch = useDispatch();

  const {
    placementStatus: { view: placement },
    behaviourStatus: { behaviourHtmlData },
    attrMobile,
    attrMenuAnimate,
  } = useSelector((state) => state.menu);
  const { color } = useSelector((state) => state.settings);
  const { items } = useSelector((state) => state.notification);
  const { showingNavMenu } = useSelector((state) => state.layout);

  useEffect(() => {
    dispatch(fetchNotifications());
    return () => { };
    // eslint-disable-next-line
  }, []);

  const onToggle = (status, event) => {
    if (event && event.stopPropagation) event.stopPropagation();
    else if (event && event.originalEvent && event.originalEvent.stopPropagation) event.originalEvent.stopPropagation();
    dispatch(layoutShowingNavMenu(status ? MENU_NAME : ''));
  };

  useEffect(() => {
    dispatch(layoutShowingNavMenu(''));
    // eslint-disable-next-line
  }, [attrMenuAnimate, behaviourHtmlData, attrMobile, color]);

  if (items && items.length > 0) {
    const isMobileHeader = attrMobile === true;

    return (
      <Dropdown
        as={isMobileHeader ? 'div' : 'li'}
        bsPrefix={isMobileHeader ? 'dropdown' : 'list-inline-item'}
        className={isMobileHeader ? 'd-inline-block h-100 align-middle' : ''}
        onToggle={onToggle}
        show={showingNavMenu === MENU_NAME}
        align={isMobileHeader || placement === MENU_PLACEMENT.Horizontal ? 'end' : 'start'}
      >
        <Dropdown.Toggle as={NotificationsDropdownToggle} isMobileHeader={isMobileHeader} />
        <Dropdown.Menu
          as={NotificationsDropdownMenu}
          items={items}
          style={{ zIndex: 2000 }}
          popperConfig={{
            modifiers: [
              {
                name: 'offset',
                options: {
                  offset: () => {
                    if (isMobileHeader || placement === MENU_PLACEMENT.Horizontal) {
                      return [0, 12];
                    }
                    if (window.innerWidth < 768) {
                      return [-168, 7];
                    }
                    return [-162, 7];
                  },
                },
              },
            ],
          }}
        />
      </Dropdown>
    );
  }
  return <></>;
};
export default React.memo(Notifications);
