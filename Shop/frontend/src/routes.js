/* eslint-disable */
import { lazy } from 'react';
import { USER_ROLE } from 'constants.js';
import { DEFAULT_PATHS } from 'config.js';

const qsr = {
  dashboard: lazy(() => import('views/shop/Dashboard')),
  operation: lazy(() => import('views/shop/operation/Operations')),
  kot: lazy(() => import('views/shop/kot/ViewKots')),
};

const order = {
  unified: lazy(() => import('views/shop/order/UnifiedOrder')),
  deliveryPartner: lazy(() => import('views/shop/order/DeliveryPartners')),
}
const inventory = {
  main: lazy(() => import('views/shop/inventory/Inventory')),
  details: lazy(() => import('views/shop/operation/inventory/InventoryDetails')),
  edit: lazy(() => import('views/shop/operation/inventory/EditInventory')),
}

const settings = {
  main: lazy(() => import('views/shop/settings/Settings')),
};

const appRoot = DEFAULT_PATHS.APP.endsWith('/') ? DEFAULT_PATHS.APP.slice(1, DEFAULT_PATHS.APP.length) : DEFAULT_PATHS.APP;

const allRoutes = {
  mainMenuItems: [
    {
      path: DEFAULT_PATHS.APP,
      exact: true,
      redirect: true,
      to: `${appRoot}/order/new`,
    },
    {
      path: `${appRoot}/order/new`,
      label: 'Billing',
      icon: 'cart',
      component: order.unified,
    },
    {
      path: `${appRoot}/operations`,
      label: 'Operations',
      icon: 'list',
      component: qsr.operation,
    },
    {
      path: `${appRoot}/inventory`,
      label: 'Inventory',
      icon: 'boxes',
      component: inventory.main,
      exact: true,
    },
    {
      path: `${appRoot}/inventory/details/:id`,
      component: inventory.details,
      hideInMenu: true,
      exact: true,
    },
    {
      path: `${appRoot}/inventory/edit/:id`,
      component: inventory.edit,
      hideInMenu: true,
      exact: true,
    },
    {
      path: `/settings`,
      component: settings.main,
      hideInMenu: true,
    },
  ],
  sidebarItems: [
    { path: '#connections', label: 'catalog.connections', icon: 'diagram-1', hideInRoute: true },
    { path: '#bookmarks', label: 'catalog.bookmarks', icon: 'bookmark', hideInRoute: true },
    { path: '#requests', label: 'catalog.requests', icon: 'diagram-2', hideInRoute: true },
    {
      path: '#account',
      label: 'catalog.account',
      icon: 'user',
      hideInRoute: true,
      subs: [
        { path: '/settings', label: 'catalog.settings', icon: 'gear', hideInRoute: true },
        { path: '/password', label: 'catalog.password', icon: 'lock-off', hideInRoute: true },
        { path: '/devices', label: 'catalog.devices', icon: 'mobile', hideInRoute: true },
      ],
    },
    {
      path: '#notifications',
      label: 'catalog.notifications',
      icon: 'notification',
      hideInRoute: true,
      subs: [
        { path: '/email', label: 'catalog.email', icon: 'email', hideInRoute: true },
        { path: '/sms', label: 'catalog.sms', icon: 'message', hideInRoute: true },
      ],
    },
    {
      path: '#downloads',
      label: 'catalog.downloads',
      icon: 'download',
      hideInRoute: true,
      subs: [
        { path: '/documents', label: 'catalog.documents', icon: 'file-text', hideInRoute: true },
        { path: '/images', label: 'catalog.images', icon: 'file-image', hideInRoute: true },
        { path: '/videos', label: 'catalog.videos', icon: 'file-video', hideInRoute: true },
      ],
    },
  ],
};
export default allRoutes;