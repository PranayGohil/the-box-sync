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
    {
      path: `${appRoot}/payroll-management`,
      exact: true,
      redirect: true,
      to: `${appRoot}/payroll-management/generate`,
    },
    {
      path: `${appRoot}/payroll-management`,
      label: 'Payroll',
      icon: 'credit-card',
      subs: [
        { path: '/generate', label: 'Generate Payroll', component: payroll.generatePayroll, hideInMenu: true },
        { path: '/manage', label: 'Manage Payroll', component: payroll.managePayroll, hideInMenu: true },
      ],
    },
    {
      path: `${appRoot}/staff`,
      label: 'Staff',
      icon: 'user',
      component: payroll.staff,
    },
    {
      path: `${appRoot}/attendance`,
      exact: true,
      redirect: true,
      to: `${appRoot}/attendance/manage`,
    },
    {
      path: `${appRoot}/attendance`,
      label: 'Attendance',
      icon: 'check-square',
      subs: [
        { path: '/view', label: 'View Attendance', component: payroll.attendance, hideInMenu: true },
        { path: '/manage', label: 'Mark Attendance', component: payroll.manageAttendance, hideInMenu: true },
        { path: '/roster', label: 'Roster Management', component: payroll.roster, hideInMenu: true },
        { path: '/ess', label: 'ESS My Attendance', component: payroll.essAttendance, hideInMenu: true },
      ],
    },
    {
      path: `${appRoot}/assets`,
      label: 'Assets',
      icon: 'boxes',
      component: payroll.assets,
    },
    {
      path: `${appRoot}/expenses`,
      exact: true,
      redirect: true,
      to: `${appRoot}/expenses/manage`,
    },
    {
      path: `${appRoot}/expenses`,
      label: 'Expenses',
      icon: 'money',
      subs: [
        { path: '/manage', label: 'Manage Expenses', component: payroll.expenses },
        { path: '/ess', label: 'ESS Expenses', component: payroll.essExpense },
        { path: '/reports', label: 'Statutory Reports', component: payroll.reports },
      ],
    },
    {
      path: `${appRoot}/payroll`,
      label: 'Setting',
      icon: 'gear',
      component: payroll.payrollSystem,
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
