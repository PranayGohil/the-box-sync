/* eslint-disable */
import { lazy } from 'react';
import { USER_ROLE } from 'constants.js';
import { DEFAULT_PATHS } from 'config.js';

const qsr = {
  dashboard: lazy(() => import('views/qsr/Dashboard')),
  operation: lazy(() => import('views/qsr/operation/Operations')),
  kot: lazy(() => import('views/qsr/kot/ViewKots')),
  crm: lazy(() => import('views/qsr/crm/Crm')),
};

const order = {
  unified: lazy(() => import('views/qsr/order/UnifiedOrder')),
  deliveryPartner: lazy(() => import('views/qsr/order/DeliveryPartners')),
}
const inventory = {
  main: lazy(() => import('views/qsr/inventory/Inventory')),
  details: lazy(() => import('views/qsr/operation/inventory/InventoryDetails')),
  edit: lazy(() => import('views/qsr/operation/inventory/EditInventory')),
}

const settings = {
  main: lazy(() => import('views/qsr/settings/Settings')),
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
      label: 'Order',
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
      path: `${appRoot}/crm`,
      label: 'CRM',
      icon: 'user',
      component: qsr.crm,
    },
    {
      path: `/settings`,
      component: settings.main,
      icon: 'gear',
      label: 'Settings',
    },
  ],
  sidebarItems: [
    { path: '#connections', label: 'menu.connections', icon: 'diagram-1', hideInRoute: true },
    { path: '#bookmarks', label: 'menu.bookmarks', icon: 'bookmark', hideInRoute: true },
    { path: '#requests', label: 'menu.requests', icon: 'diagram-2', hideInRoute: true },
    {
      path: '#account',
      label: 'menu.account',
      icon: 'user',
      hideInRoute: true,
      subs: [
        { path: '/settings', label: 'menu.settings', icon: 'gear', hideInRoute: true },
        { path: '/password', label: 'menu.password', icon: 'lock-off', hideInRoute: true },
        { path: '/devices', label: 'menu.devices', icon: 'mobile', hideInRoute: true },
      ],
    },
    {
      path: '#notifications',
      label: 'menu.notifications',
      icon: 'notification',
      hideInRoute: true,
      subs: [
        { path: '/email', label: 'menu.email', icon: 'email', hideInRoute: true },
        { path: '/sms', label: 'menu.sms', icon: 'message', hideInRoute: true },
      ],
    },
    {
      path: '#downloads',
      label: 'menu.downloads',
      icon: 'download',
      hideInRoute: true,
      subs: [
        { path: '/documents', label: 'menu.documents', icon: 'file-text', hideInRoute: true },
        { path: '/images', label: 'menu.images', icon: 'file-image', hideInRoute: true },
        { path: '/videos', label: 'menu.videos', icon: 'file-video', hideInRoute: true },
      ],
    },
  ],
};
export default allRoutes;
