import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import ViewStaff from './ViewStaff';
import StaffProfile from './StaffProfile';
import ManageAttendance from './attandance/ManageAttendance';
import ViewAttendance from './attandance/ViewAttendance';
import ViewStaffPayroll from './payroll/ViewStaffPayroll';
import ManagePayroll from './payroll/ManagePayroll';
import GeneratePayroll from './payroll/GeneratePayroll';

const Staff = () => {
  return (
    <>
      <Switch>
        <Route exact path="/staff" render={() => <Redirect to="/staff/view" />} />
        <Route exact path="/staff/view" render={() => <ViewStaff />} />
        <Route exact path="/staff/profile/:id" render={() => <StaffProfile />} />

        <Route exact path="/staff/attendance" render={() => <ManageAttendance />} />
        <Route exact path="/staff/attendance/view/:id" render={() => <ViewAttendance />} />

        <Route exact path="/staff/payroll/generate" render={() => <GeneratePayroll />} />
        <Route exact path="/staff/payroll/view/:staffId" render={() => <ViewStaffPayroll />} />
        <Route exact path="/staff/payroll/:month?/:year?" render={() => <ManagePayroll />} />
      </Switch>
    </>
  );
};

export default Staff;
