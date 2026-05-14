/* eslint-disable */
import { lazy } from 'react';
import { USER_ROLE } from 'constants.js';
import { DEFAULT_PATHS } from 'config.js';

const payroll = {
  staff: lazy(() => import('views/admin/staff/Staff')),
  viewStaff: lazy(() => import('views/admin/staff/ViewStaff')),
  addStaff: lazy(() => import('views/admin/staff/AddStaff')),
  editStaff: lazy(() => import('views/admin/staff/EditStaff')),
  attendance: lazy(() => import('views/admin/staff/attandance/ViewAttendance')),
  manageAttendance: lazy(() => import('views/admin/staff/attandance/ManageAttendance')),
  generatePayroll: lazy(() => import('views/admin/staff/payroll/GeneratePayroll')),
  managePayroll: lazy(() => import('views/admin/staff/payroll/ManagePayroll')),
  holidays: lazy(() => import('views/admin/staff/payroll/Holidays')),
  leavePolicy: lazy(() => import('views/admin/staff/payroll/LeavePolicy')),
  leaveRequests: lazy(() => import('views/admin/staff/payroll/LeaveRequests')),
  salaryAdvances: lazy(() => import('views/admin/staff/payroll/SalaryAdvances')),
  payrollSettings: lazy(() => import('views/admin/staff/payroll/PayrollSettings')),
};

const appRoot = DEFAULT_PATHS.APP.endsWith('/') ? DEFAULT_PATHS.APP.slice(1, DEFAULT_PATHS.APP.length) : DEFAULT_PATHS.APP;

const allRoutes = {
  mainRoutes: [
    {
      path: DEFAULT_PATHS.APP,
      exact: true,
      redirect: true,
      to: `${appRoot}/staff/view`,
    },
    {
      path: `${appRoot}/staff`,
      label: 'Staff Management',
      icon: 'user',
      component: payroll.staff,
      subs: [
        { path: '/view', label: 'View Staff', component: payroll.viewStaff },
        { path: '/add-staff', label: 'Add Staff', component: payroll.addStaff },
        { path: '/edit/:id', label: 'Edit Staff', component: payroll.editStaff, hideInMenu: true },
      ],
    },
    {
      path: `${appRoot}/attendance`,
      label: 'Attendance',
      icon: 'check-square',
      subs: [
        { path: '/view', label: 'View Attendance', component: payroll.attendance },
        { path: '/manage', label: 'Mark Attendance', component: payroll.manageAttendance },
      ],
    },
    {
      path: `${appRoot}/payroll`,
      label: 'Payroll System',
      icon: 'credit-card',
      subs: [
        { path: '/generate', label: 'Generate Payroll', component: payroll.generatePayroll },
        { path: '/manage', label: 'Manage Payroll', component: payroll.managePayroll },
        { path: '/holidays', label: 'Holiday List', component: payroll.holidays },
        { path: '/leave-policy', label: 'Leave Policies', component: payroll.leavePolicy },
        { path: '/leave-requests', label: 'Leave Requests', component: payroll.leaveRequests },
        { path: '/advances', label: 'Salary Advances', component: payroll.salaryAdvances },
        { path: '/settings', label: 'Payroll Settings', component: payroll.payrollSettings },
      ],
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
