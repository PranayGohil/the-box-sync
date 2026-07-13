import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useLocation } from 'react-router-dom';
import { Dropdown, Button } from 'react-bootstrap';
import classNames from 'classnames';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { MENU_PLACEMENT } from 'constants.js';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { layoutShowingNavMenu } from 'layout/layoutSlice';
import { fetchNotifications, dismissNotification } from './notificationSlice';

const NotificationsDropdownToggle = React.memo(
  React.forwardRef(({ onClick, expanded = false, hasUnread = false }, ref) => (
    <a
      ref={ref}
      href="#/"
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
        {hasUnread && <span className="position-absolute notification-dot rounded-xl" />}
      </div>
    </a>
  ))
);
NotificationsDropdownToggle.displayName = 'NotificationsDropdownToggle';

const NotificationItem = ({ img = '', link = '', detail = '', date = '', onDismiss }) => {
  const isProfile = img.includes('profile') || img.includes('avatar') || img.includes('photo');
  return (
    <li className="mb-3 pb-3 border-bottom border-separator-light d-flex justify-content-between align-items-start position-relative">
      <div className="d-flex align-items-start me-3" style={{ flex: 1 }}>
        <div 
          className="me-3 rounded-xl d-flex align-items-center justify-content-center bg-light"
          style={{ 
            width: '36px', 
            height: '36px', 
            minWidth: '36px',
            minHeight: '36px',
            overflow: 'hidden',
            border: isProfile ? 'none' : '1px solid #e2e8f0',
            background: isProfile ? 'transparent' : '#f8fafc',
            padding: isProfile ? '0' : '2px'
          }}
        >
          <img 
            src={img} 
            alt="notification" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: isProfile ? 'cover' : 'contain' 
            }} 
          />
        </div>
        <div style={{ flex: 1 }} className="align-self-center">
          <NavLink to={link} activeClassName="" className="text-dark fw-semibold d-block lh-sm" style={{ fontSize: '0.875rem' }}>
            {detail}
          </NavLink>
          {date && <span className="text-muted d-block mt-1 font-monospace" style={{ fontSize: '0.78rem' }}>{date}</span>}
        </div>
      </div>
      <Button
        variant="link"
        className="p-1 text-muted text-decoration-none"
        style={{ minWidth: 'auto', border: 0, marginTop: '-2px' }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDismiss();
        }}
      >
        <CsLineIcons icon="close" size="16" />
      </Button>
    </li>
  );
};

const NotificationsDropdownMenu = React.memo(
  React.forwardRef(({ style, className, labeledBy, items, onDismissItem }, ref) => {
    return (
      <div ref={ref} style={{ ...style, width: '380px' }} className={classNames('wide notification-dropdown scroll-out', className)} aria-labelledby={labeledBy}>
        <OverlayScrollbarsComponent
          options={{
            scrollbars: { autoHide: 'leave', autoHideDelay: 600 },
            overflowBehavior: { x: 'hidden', y: 'scroll' },
          }}
          className="scroll"
        >
          <ul className="list-unstyled border-last-none mb-0">
            {items.length === 0 ? (
              <li className="py-4 text-center text-muted small">
                No new notifications
              </li>
            ) : (
              items.map((item, itemIndex) => (
                <NotificationItem 
                  key={`notificationItem.${itemIndex}`} 
                  detail={item.detail} 
                  link={item.link} 
                  img={item.img} 
                  date={item.date}
                  onDismiss={() => onDismissItem(item.id)}
                />
              ))
            )}
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
  const location = useLocation();

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
    return () => {};
    // eslint-disable-next-line
  }, []);

  // Auto Dismiss / Auto mark as read on route matches for staff
  useEffect(() => {
    if (items && items.length > 0) {
      const { pathname } = location;
      const toDismiss = [];
      
      // If employee opens dashboard or specific tab
      if (pathname.includes('/dashboard') || pathname === '/') {
        // We can let them read it, or dismiss if they check the page
        // Wait, since employees view everything on their Dashboard (using tabs),
        // we can dismiss leave notifications when they check the dashboard / tabs.
        // For simplicity, we dismiss them when they dismiss manually or navigate.
      }

      toDismiss.forEach(id => {
        dispatch(dismissNotification(id));
      });
    }
  }, [location.pathname, items, dispatch]);

  const onToggle = (status, event) => {
    if (event && event.stopPropagation) event.stopPropagation();
    else if (event && event.originalEvent && event.originalEvent.stopPropagation) event.originalEvent.stopPropagation();
    dispatch(layoutShowingNavMenu(status ? MENU_NAME : ''));
  };

  useEffect(() => {
    dispatch(layoutShowingNavMenu(''));
    // eslint-disable-next-line
  }, [attrMenuAnimate, behaviourHtmlData, attrMobile, color]);

  const onDismissItem = (id) => {
    dispatch(dismissNotification(id));
  };

  const hasUnread = items && items.length > 0;

  return (
    <Dropdown
      as="li"
      bsPrefix="list-inline-item"
      onToggle={onToggle}
      show={showingNavMenu === MENU_NAME}
      align={placement === MENU_PLACEMENT.Horizontal ? 'end' : 'start'}
    >
      <Dropdown.Toggle as={NotificationsDropdownToggle} hasUnread={hasUnread} />
      <Dropdown.Menu
        as={NotificationsDropdownMenu}
        items={items || []}
        onDismissItem={onDismissItem}
        popperConfig={{
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: () => {
                  if (placement === MENU_PLACEMENT.Horizontal) {
                    return [0, 7];
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
};
export default React.memo(Notifications);
