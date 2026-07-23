/* eslint-disable */
import { lazy } from 'react';
import { USER_ROLE } from 'constants.js';
import { DEFAULT_PATHS } from 'config.js';

const payroll = {
  dashboard: lazy(() => import('views/admin/Dashboard')),
  staff: lazy(() => import('views/admin/staff/Staff')),
  organization: lazy(() => import('views/admin/staff/branch/BranchBoard')),
  feedbacks: lazy(() => import('views/admin/staff/payroll/FeedbacksAndComplaints')),
  essAttendance: lazy(() => import('views/ess/ESSAttendancePanel')),
  essExpense: lazy(() => import('views/ess/ESSExpensePanel')),
  assets: lazy(() => import('views/admin/staff/assets/Assets')),
  companyProfile: lazy(() => import('views/admin/CompanyProfile')),
  financeSystem: lazy(() => import('views/admin/staff/payroll/FinanceSystem')),
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
      icon: 'home',
      component: payroll.dashboard,
    },

    // --- REAL ROUTES (HIDDEN FROM MENU) ---
    {
      path: `${appRoot}/organization`,
      exact: true,
      redirect: true,
      to: `${appRoot}/staff/organization`,
      hideInMenu: true,
    },
    {
      path: `${appRoot}/attendance`,
      exact: true,
      redirect: true,
      to: `${appRoot}/staff/attendance`,
      hideInMenu: true,
    },
    {
      path: `${appRoot}/expenses`,
      exact: true,
      redirect: true,
      to: `${appRoot}/finance/expenses`,
      hideInMenu: true,
    },
    {
      path: `${appRoot}/expenses`,
      hideInMenu: true,
      subs: [
        { path: '/ess', component: payroll.essExpense },
      ],
    },
    {
      path: `${appRoot}/attendance/ess`,
      component: payroll.essAttendance,
      hideInMenu: true,
    },

    // --- VISUAL MENU ITEMS ---
    {
      path: `${appRoot}/staff`,
      label: 'Payroll',
      icon: 'credit-card',
      component: payroll.staff,
    },
    {
      path: `${appRoot}/finance`,
      label: 'Finance',
      icon: 'money',
      component: payroll.financeSystem,
    },
    // --- TOP-LEVEL MENU ITEMS ---
    {
      path: `${appRoot}/assets`,
      label: 'Assets',
      icon: 'boxes',
      component: payroll.assets,
    },
    {
      path: `${appRoot}/feedbacks`,
      label: 'Feedback',
      icon: 'message',
      component: payroll.feedbacks,
    },
    {
      path: `${appRoot}/settings`,
      label: 'Company Profile',
      icon: 'user',
      component: payroll.companyProfile,
      hideInMenu: true,
    },
  ],

  sidebarItems: [
    { path: '#connections', label: 'menu.connections', icon: 'diagram-1', hideInRoute: true },
    { path: '#bookmarks', label: 'menu.bookmarks', icon: 'bookmark', hideInRoute: true },
    {
      path: '#account',
      label: 'menu.account',
      icon: 'user',
      hideInRoute: true,
      subs: [
        { path: '/settings', label: 'menu.settings', icon: 'gear', hideInRoute: true },
        { path: '/password', label: 'menu.password', icon: 'lock-off', hideInRoute: true },
      ],
    },
  ],
};

export default allRoutes;
