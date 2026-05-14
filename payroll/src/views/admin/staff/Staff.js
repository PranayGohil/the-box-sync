import React, { useContext } from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { AuthContext } from 'contexts/AuthContext';
import ViewStaff from './ViewStaff';
import AddStaff from './AddStaff';
import EditStaff from './EditStaff';
import StaffProfile from './StaffProfile';
import ManageAttendance from './attandance/ManageAttendance';
import ViewAttendance from './attandance/ViewAttendance';
import PayrollSettings from './payroll/PayrollSettings';
import ManagePayroll from './payroll/ManagePayroll';
import GeneratePayroll from './payroll/GeneratePayroll';
import ViewStaffPayroll from './payroll/ViewStaffPayroll';
import Holidays from './payroll/Holidays';
import LeavePolicy from './payroll/LeavePolicy';
import LeaveRequests from './payroll/LeaveRequests';
import SalaryAdvances from './payroll/SalaryAdvances';

const Staff = () => {
  const { activePlans } = useContext(AuthContext);

  const isPlanActive = (plan) => activePlans.includes(plan);
  const noAccess = (label) => (
    <div className="text-center p-5 mt-5">
      <h5 className="text-muted">You need an active <strong>{label}</strong> plan to access this page.</h5>
    </div>
  );

  return (
    <>
      <Switch>
        {/* Core Staff Management */}
        <Route exact path="/staff" render={() => <Redirect to="/staff/view" />} />
        <Route exact path="/staff/view" render={() =>
          isPlanActive('Staff Management') ? <ViewStaff /> : noAccess('Staff Management')
        } />
        <Route exact path="/staff/add" render={() =>
          isPlanActive('Staff Management') ? <AddStaff /> : noAccess('Staff Management')
        } />
        <Route exact path="/staff/edit/:id" render={() =>
          isPlanActive('Staff Management') ? <EditStaff /> : noAccess('Staff Management')
        } />
        <Route exact path="/staff/profile/:id" render={() =>
          isPlanActive('Staff Management') ? <StaffProfile /> : noAccess('Staff Management')
        } />

        {/* Attendance */}
        <Route exact path="/staff/attendance" render={() =>
          isPlanActive('Staff Management') && isPlanActive('Payroll By The Box')
            ? <ManageAttendance />
            : noAccess('Staff Management + Payroll By The Box')
        } />
        <Route exact path="/staff/attendance/view/:id" render={() =>
          isPlanActive('Staff Management') && isPlanActive('Payroll By The Box')
            ? <ViewAttendance />
            : noAccess('Staff Management + Payroll By The Box')
        } />

        {/* Payroll */}
        <Route exact path="/staff/payroll/settings" render={() =>
          isPlanActive('Staff Management') && isPlanActive('Payroll By The Box')
            ? <PayrollSettings />
            : noAccess('Staff Management + Payroll By The Box')
        } />
        <Route exact path="/staff/payroll/generate" render={() =>
          isPlanActive('Staff Management') && isPlanActive('Payroll By The Box')
            ? <GeneratePayroll />
            : noAccess('Staff Management + Payroll By The Box')
        } />
        <Route exact path="/staff/payroll/view/:staffId" render={() =>
          isPlanActive('Staff Management') && isPlanActive('Payroll By The Box')
            ? <ViewStaffPayroll />
            : noAccess('Staff Management + Payroll By The Box')
        } />
        <Route exact path="/staff/payroll/:month?/:year?" render={() =>
          isPlanActive('Staff Management') && isPlanActive('Payroll By The Box')
            ? <ManagePayroll />
            : noAccess('Staff Management + Payroll By The Box')
        } />

        {/* Leave & HR */}
        <Route exact path="/staff/holidays" render={() =>
          isPlanActive('Staff Management') && isPlanActive('Payroll By The Box')
            ? <Holidays />
            : noAccess('Staff Management + Payroll By The Box')
        } />
        <Route exact path="/staff/leave-policy" render={() =>
          isPlanActive('Staff Management') && isPlanActive('Payroll By The Box')
            ? <LeavePolicy />
            : noAccess('Staff Management + Payroll By The Box')
        } />
        <Route exact path="/staff/leave-requests" render={() =>
          isPlanActive('Staff Management') && isPlanActive('Payroll By The Box')
            ? <LeaveRequests />
            : noAccess('Staff Management + Payroll By The Box')
        } />
        <Route exact path="/staff/salary-advances" render={() =>
          isPlanActive('Staff Management') && isPlanActive('Payroll By The Box')
            ? <SalaryAdvances />
            : noAccess('Staff Management + Payroll By The Box')
        } />
      </Switch>
    </>
  );
};

export default Staff;
