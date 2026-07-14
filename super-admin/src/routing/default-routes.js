import React, { lazy } from 'react';
import { DEFAULT_PATHS } from 'config.js';

const DummyPage = () => <div className="p-5 text-center mt-5"><h2 className="text-muted">Page Unavailable</h2><p>This template page was removed.</p></div>;

const NotFound = DummyPage;
const Login = lazy(() => import('views/default/Login'));
const ForgotPassword = DummyPage;
const ResetPassword = DummyPage;
const Unauthorized = DummyPage;
const InvalidAccess = DummyPage;
const App = lazy(() => import('App.js'));
const Home = DummyPage;

/*
{ path: "/path", exact: true, component: ViewHome },
// or
{ path: "/path", component: ViewHome},
// or
{ path: "/path", exact: true, redirect: true, to: "/redirectPath" },
*/
const defaultRoutes = [
  { path: DEFAULT_PATHS.NOTFOUND, exact: true, component: NotFound },
  { path: DEFAULT_PATHS.LOGIN, exact: true, component: Login },
  { path: DEFAULT_PATHS.FORGOT_PASSWORD, exact: true, component: ForgotPassword },
  { path: DEFAULT_PATHS.RESET_PASSWORD, exact: true, component: ResetPassword },
  { path: DEFAULT_PATHS.UNAUTHORIZED, exact: true, component: Unauthorized },
  { path: DEFAULT_PATHS.INVALID_ACCESS, exact: true, component: InvalidAccess },
  { path: DEFAULT_PATHS.APP, component: App },
  { path: '/', exact: true, component: Home },
];

export default defaultRoutes;
