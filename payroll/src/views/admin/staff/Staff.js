import React from 'react';
import { Switch, Route, Redirect, useRouteMatch } from 'react-router-dom';
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
  const { path } = useRouteMatch();

  return (
    <>
      <Switch>
        {/* Core Staff Management */}
        <Route exact path={path} render={() => <Redirect to={`${path}/view`} />} />
        <Route exact path={`${path}/view`} component={ViewStaff} />
        <Route exact path={`${path}/add`} component={AddStaff} />
        <Route exact path={`${path}/edit/:id`} component={EditStaff} />
        <Route exact path={`${path}/profile/:id`} component={StaffProfile} />

        {/* Attendance */}
        <Route exact path={`${path}/attendance`} component={ManageAttendance} />
        <Route exact path={`${path}/attendance/view/:id`} component={ViewAttendance} />

        {/* Payroll */}
        <Route exact path={`${path}/payroll/settings`} component={PayrollSettings} />
        <Route exact path={`${path}/payroll/generate`} component={GeneratePayroll} />
        <Route exact path={`${path}/payroll/view/:staffId`} component={ViewStaffPayroll} />
        <Route exact path={`${path}/payroll/:month?/:year?`} component={ManagePayroll} />

        {/* Leave & HR */}
        <Route exact path={`${path}/holidays`} component={Holidays} />
        <Route exact path={`${path}/leave-policy`} component={LeavePolicy} />
        <Route exact path={`${path}/leave-requests`} component={LeaveRequests} />
        <Route exact path={`${path}/salary-advances`} component={SalaryAdvances} />
      </Switch>
    </>
  );
};

export default Staff;
