/* eslint-disable */
import { lazy } from 'react';
import { USER_ROLE } from 'constants.js';
import { DEFAULT_PATHS } from 'config.js';

const payroll = {
  dashboard: lazy(() => import('views/admin/Dashboard')),
  staff: lazy(() => import('views/admin/staff/Staff')),
  viewStaff: lazy(() => import('views/admin/staff/ViewStaff')),
  addStaff: lazy(() => import('views/admin/staff/AddStaff')),
  editStaff: lazy(() => import('views/admin/staff/EditStaff')),
  organization: lazy(() => import('views/admin/staff/branch/BranchBoard')),
  attendance: lazy(() => import('views/admin/staff/attandance/ViewAttendance')),
  manageAttendance: lazy(() => import('views/admin/staff/attandance/ManageAttendance')),
  roster: lazy(() => import('views/admin/staff/attandance/RosterManagement')),
  essAttendance: lazy(() => import('views/ess/ESSAttendancePanel')),
  payrollSystem: lazy(() => import('views/admin/staff/payroll/PayrollSystem')),
  generatePayroll: lazy(() => import('views/admin/staff/payroll/GeneratePayroll')),
  managePayroll: lazy(() => import('views/admin/staff/payroll/ManagePayroll')),
  expenses: lazy(() => import('views/admin/staff/payroll/ManageExpenses')),
  essExpense: lazy(() => import('views/ess/ESSExpensePanel')),
  reports: lazy(() => import('views/admin/staff/payroll/StatutoryReports')),
  assets: lazy(() => import('views/admin/staff/assets/Assets')),
  companyProfile: lazy(() => import('views/admin/CompanyProfile')),
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
      path: `${appRoot}/payroll-management`,
      exact: true,
      redirect: true,
      to: `${appRoot}/payroll-management/generate`,
      hideInMenu: true,
    },
    {
      path: `${appRoot}/payroll-management`,
      hideInMenu: true,
      subs: [
        { path: '/generate', component: payroll.generatePayroll },
        { path: '/manage', component: payroll.managePayroll },
      ],
    },
    {
      path: `${appRoot}/staff`,
      component: payroll.staff,
      hideInMenu: true,
    },
    {
      path: `${appRoot}/organization`,
      component: payroll.organization,
      hideInMenu: true,
    },
    {
      path: `${appRoot}/attendance`,
      exact: true,
      redirect: true,
      to: `${appRoot}/attendance/manage`,
      hideInMenu: true,
    },
    {
      path: `${appRoot}/attendance`,
      hideInMenu: true,
      subs: [
        { path: '/view', component: payroll.attendance },
        { path: '/manage', component: payroll.manageAttendance },
        { path: '/roster', component: payroll.roster },
        { path: '/ess', component: payroll.essAttendance },
      ],
    },

    {
      path: `${appRoot}/expenses`,
      exact: true,
      redirect: true,
      to: `${appRoot}/expenses/manage`,
      hideInMenu: true,
    },
    {
      path: `${appRoot}/expenses`,
      hideInMenu: true,
      subs: [
        { path: '/manage', component: payroll.expenses },
        { path: '/ess', component: payroll.essExpense },
        { path: '/reports', component: payroll.reports },
      ],
    },


    // --- VISUAL MENU FOLDERS ---
    {
      path: appRoot,
      label: 'HR & Staff',
      icon: 'user',
      hideInRoute: true,
      subs: [
        { path: `/staff`, label: 'Staff Directory', icon: 'user' },
        { path: `/attendance`, label: 'Attendance', icon: 'check-square' },
        { path: `/organization`, label: 'Org Structure', icon: 'diagram-1' },
      ]
    },
    {
      path: appRoot,
      label: 'Finance',
      icon: 'money',
      hideInRoute: true,
      subs: [
        { path: `/payroll-management`, label: 'Payroll', icon: 'credit-card' },
        { path: `/expenses/manage`, label: 'Manage Expenses', icon: 'wallet' },
        { path: `/expenses/ess`, label: 'Add Expense', icon: 'plus' },
        { path: `/expenses/reports`, label: 'Audit & Reports', icon: 'file-text' },
      ]
    },
    // --- MOVED TOP-LEVEL MENU ITEMS ---
    {
      path: `${appRoot}/assets`,
      label: 'Assets',
      icon: 'boxes',
      component: payroll.assets,
    },
    {
      path: `${appRoot}/payroll`,
      label: 'Setting',
      icon: 'gear',
      component: payroll.payrollSystem,
    },
    {
      path: `${appRoot}/settings`,
      label: 'Company Profile',
      icon: 'user',
      component: payroll.companyProfile,
    }
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
