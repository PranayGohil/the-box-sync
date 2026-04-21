import React, { useState, useEffect, useContext } from 'react';
import { Button, Row, Col, Card } from 'react-bootstrap';
import { Switch, Route, Redirect, useHistory } from 'react-router-dom';
import axios from 'axios';
import Glide from 'components/carousel/Glide';

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

const Staff = () => {
  const { activePlans } = useContext(AuthContext);
  return (
    <>
      <Switch>
        <Route exact path="/staff" render={() => <Redirect to="/staff/view" />} />
        <Route exact path="/staff/view" render={() => (<>
          {
            activePlans.includes("Staff Management") ?
              <ViewStaff /> :
              <div className="text-center">You need to buy or renew to Staff Management plan to access this page.</div>
          }
        </>)} />
        <Route exact path="/staff/add" render={() => <>
          {
            activePlans.includes("Staff Management") ?
              <AddStaff /> :
              <div className="text-center">You need to buy or renew to Staff Management plan to access this page.</div>
          }
        </>} />
        <Route exact path="/staff/edit/:id" render={() => <>
          {
            activePlans.includes("Staff Management") ?
              <EditStaff /> :
              <div className="text-center">You need to buy or renew to Staff Management plan to access this page.</div>
          }
        </>} />
        <Route exact path="/staff/profile/:id" render={() => <>
          {
            activePlans.includes("Staff Management") ?
              <StaffProfile /> :
              <div className="text-center">You need to buy or renew to Staff Management plan to access this page.</div>
          }
        </>} />
        <Route exact path="/staff/attendance" render={() => <>
          {
            activePlans.includes("Staff Management") && activePlans.includes("Payroll By The Box") ?
              <ManageAttendance /> :
              <div className="text-center">You need to buy or renew to Staff Management and Payroll By The Box plan to access this page.</div>
          }
        </>} />
        <Route exact path="/staff/attendance/view/:id" render={() => <>
          {
            activePlans.includes("Staff Management") && activePlans.includes("Payroll By The Box") ?
              <ViewAttendance /> :
              <div className="text-center">You need to buy or renew to Staff Management and Payroll By The Box plan to access this page.</div>
          }
        </>} />

        <Route exact path="/staff/payroll/settings" render={() => <>
          {
            activePlans.includes("Staff Management") && activePlans.includes("Payroll By The Box") ?
              <PayrollSettings /> :
              <div className="text-center">You need to buy or renew to Staff Management and Payroll By The Box plan to access this page.</div>
          }
        </>} />
        
        <Route exact path="/staff/payroll/generate" render={() => <>
          {
            activePlans.includes("Staff Management") && activePlans.includes("Payroll By The Box") ?
              <GeneratePayroll /> :
              <div className="text-center">You need to buy or renew to Staff Management and Payroll By The Box plan to access this page.</div>
          }
        </>} />
        
        <Route exact path="/staff/payroll/view/:staffId" render={() => <>
          {
            activePlans.includes("Staff Management") && activePlans.includes("Payroll By The Box") ?
              <ViewStaffPayroll /> :
              <div className="text-center">You need to buy or renew to Staff Management and Payroll By The Box plan to access this page.</div>
          }
        </>} />
        
        <Route exact path="/staff/payroll/:month?/:year?" render={() => <>
          {
            activePlans.includes("Staff Management") && activePlans.includes("Payroll By The Box") ?
              <ManagePayroll /> :
              <div className="text-center">You need to buy or renew to Staff Management and Payroll By The Box plan to access this page.</div>
          }
        </>} />

      </Switch>
    </>
  );
};

export default Staff;
