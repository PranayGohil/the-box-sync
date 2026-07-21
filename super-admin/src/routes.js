/* eslint-disable */
import { lazy } from 'react';
import { DEFAULT_PATHS } from 'config.js';

const superAdmin = {
  dashboard: lazy(() => import('views/superadmin/Dashboard')),
  customers: lazy(() => import('views/superadmin/Customers')),
  inquiries: lazy(() => import('views/superadmin/Inquiries')),
  admins: lazy(() => import('views/superadmin/AdminManagement')),
  timeline: lazy(() => import('views/superadmin/ActivityTimeline')),
  adminTimeline: lazy(() => import('views/superadmin/AdminTimeline')),
  userDetails: lazy(() => import('views/superadmin/UserDetails')),
};

const appRoot = DEFAULT_PATHS.APP.endsWith('/') ? DEFAULT_PATHS.APP.slice(1, DEFAULT_PATHS.APP.length) : DEFAULT_PATHS.APP;

const allRoutes = {
  mainRoutes: [
    {
      path: DEFAULT_PATHS.APP,
      exact: true,
      redirect: true,
      to: `${appRoot}/dashboard`,
    },
    {
      path: `${appRoot}/dashboard`,
      label: 'Dashboard',
      icon: 'dashboard-1',
      component: superAdmin.dashboard,
    },
    {
      path: `${appRoot}/customers`,
      label: 'Customers',
      icon: 'user',
      component: superAdmin.customers,
    },
    {
      path: `${appRoot}/inquiries`,
      label: 'Inquiries',
      icon: 'question-hexagon',
      component: superAdmin.inquiries,
    },
    {
      path: `${appRoot}/admins`,
      label: 'Admins',
      icon: 'user',
      component: superAdmin.admins,
      // We can manage roles in the component or add a prop here if Acorn router supports it
    },
    {
      path: `${appRoot}/timeline`,
      label: 'Timeline',
      icon: 'clock',
      component: superAdmin.timeline,
    },
    {
      path: `${appRoot}/admins/:id/timeline`,
      exact: true,
      component: superAdmin.adminTimeline,
    },
    {
      path: `${appRoot}/userdetails/:id`,
      exact: true,
      component: superAdmin.userDetails,
    }
  ],

  sidebarItems: [
    // Acorn specific top menu / user menu if needed
    { path: '#account', label: 'menu.account', icon: 'user', hideInRoute: true,
      subs: [
        { path: '/settings', label: 'menu.settings', icon: 'gear', hideInRoute: true },
        { path: '/password', label: 'menu.password', icon: 'lock-off', hideInRoute: true },
      ],
    }
  ],
};

export default allRoutes;
