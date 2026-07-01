import { lazy } from 'react';

const KioskScan = lazy(() => import('views/attendance/KioskScan'));

const defaultRoutes = [
  { path: '/:company_id', exact: true, component: KioskScan },
];

export default defaultRoutes;
