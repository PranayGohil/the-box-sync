import React, { useState, useEffect, useContext } from 'react';
import { Button, Row, Col, Card } from 'react-bootstrap';
import { Switch, Route, Redirect, useHistory } from 'react-router-dom';
import axios from 'axios';
import Glide from 'components/carousel/Glide';

import ViewStaff from './ViewStaff';
import AddStaff from './AddStaff';
import EditStaff from './EditStaff';
import StaffProfile from './StaffProfile';
import ManageAttendance from './attandance/ManageAttendance';
import ViewAttendance from './attandance/ViewAttendance';

const Staff = () => {
  return (
    <>
      <Switch>
        <Route exact path="/staff" render={() => <Redirect to="/staff/view" />} />
        <Route exact path="/staff/view" render={() => <ViewStaff /> } />
        <Route exact path="/staff/add" render={() => <AddStaff />} />
        <Route exact path="/staff/edit/:id" render={() => <EditStaff />} />
        <Route exact path="/staff/profile/:id" render={() => <StaffProfile />} />
        <Route exact path="/staff/attendance" render={() => <ManageAttendance />} />
        <Route exact path="/staff/attendance/view/:id" render={() => <ViewAttendance />} />

      </Switch>
    </>
  );
};

export default Staff;
