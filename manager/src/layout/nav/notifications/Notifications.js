import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { Dropdown } from 'react-bootstrap';
import classNames from 'classnames';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { MENU_PLACEMENT } from 'constants.js';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { layoutShowingNavMenu } from 'layout/layoutSlice';
import { useSocket } from 'contexts/SocketContext';
import { fetchNotifications, markNotificationsRead } from './notificationSlice';

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

const NotificationItem = ({ img = '', icon = '', link = '', detail = '' }) => (
  <li className="mb-3 pb-3 border-bottom border-separator-light d-flex">
    {icon ? (
      <div className="me-3 sw-4 sh-4 d-flex align-items-center justify-content-center bg-separator-light text-primary rounded-circle flex-shrink-0 align-self-center">
        <CsLineIcons icon={icon} size="18" />
      </div>
    ) : (
      <img src={img} className="me-3 sw-4 sh-4 rounded-xl align-self-center flex-shrink-0" alt="notification" />
    )}
    <div className="align-self-center">
      <NavLink to={link} activeClassName="">
        {detail}
      </NavLink>
    </div>
  </li>
);
NotificationItem.displayName = 'NotificationItem';

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
          style={{ height: 'auto', maxHeight: '185px' }}
        >
          <ul className="list-unstyled border-last-none">
            {items.map((item, itemIndex) => (
              <NotificationItem key={`notificationItem.${itemIndex}`} detail={item.detail} link={item.link} img={item.img} icon={item.icon} />
            ))}
          </ul>
        </OverlayScrollbarsComponent>
        <div className="border-top pt-2 text-center" style={{ margin: '0 -1.5rem' }}>
          <NavLink to="/notifications" className="d-block py-1 text-primary font-weight-bold" style={{ fontSize: '0.8rem' }}>
            See all notifications →
          </NavLink>
        </div>
      </div>
    );
  })
);
NotificationsDropdownMenu.displayName = 'NotificationsDropdownMenu';

const MENU_NAME = 'Notifications';
const Notifications = () => {
  const dispatch = useDispatch();
  const socketCtx = useSocket();
  const stopAudio = socketCtx ? socketCtx.stopAudio : null;

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

    if (status) {
      // Silence active alerts when opening notifications
      if (stopAudio) {
        stopAudio();
      }
      // Re-fetch notifications to get fresh status from DB
      dispatch(fetchNotifications());
    } else {
      // Mark all notifications as read in backend and local store when closing the dropdown
      dispatch(markNotificationsRead());
    }
  };

  useEffect(() => {
    dispatch(layoutShowingNavMenu(''));
    // eslint-disable-next-line
  }, [attrMenuAnimate, behaviourHtmlData, attrMobile, color]);

  // Map real database notifications to UI format
  const formatNotification = (item) => {
    if (item.detail) return item; // For mock data fallback

    let detail = '';
    let link = '#/';
    let img = '/img/profile/profile-11.webp';
    let icon = '';

    if (item.type === 'inventory_approved') {
      detail = `Inventory request approved/delivered (${item.data?.category || 'items'})!`;
      link = '/operations/inventory-history';
      icon = 'boxes';
    } else if (item.type === 'inventory_rejected') {
      detail = `Inventory request rejected: ${item.data?.reject_reason || 'N/A'}`;
      link = '/operations/inventory-history';
      icon = 'warning';
    } else if (item.type === 'web_order_recieved') {
      detail = `New web order received! Total: ₹${item.data?.total_amount || 0}`;
      link = '/operations/order-history';
      icon = 'cart';
    } else {
      detail = `${item.sender || 'System'}: New ${item.type?.replace(/_/g, ' ') || 'notification'}`;
      link = '#/';
      img = '/img/profile/profile-11.webp';
    }

    return {
      id: item._id,
      img,
      icon,
      detail,
      link,
    };
  };

  // Only display unread notifications
  const unreadItems = (items || []).filter((item) => !item.read);
  const formattedItems = unreadItems.map(formatNotification);
  const hasUnread = unreadItems.length > 0;

  // Show a professional empty state when there are no unread notifications
  const displayItems = formattedItems.length > 0
    ? formattedItems
    : [{ id: 'empty', detail: 'All caught up!', link: '#/', icon: 'like' }];

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
        items={displayItems}
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
