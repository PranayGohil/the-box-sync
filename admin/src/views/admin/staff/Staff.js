import React, { useState, useEffect, useContext } from 'react';
import { Button, Row, Col, Card } from 'react-bootstrap';
import { Switch, Route, Redirect, useHistory } from 'react-router-dom';
import axios from 'axios';
import Glide from 'components/carousel/Glide';

import ViewStaff from './ViewStaff';
import AddStaff from './AddStaff';

const Staff = () => {
  return (
    <>
      <Switch>
        <Route exact path="/staff" render={() => <Redirect to="/staff/view" />} />
        <Route exact path="/staff/view" render={() => <ViewStaff /> } />
        <Route exact path="/staff/add" render={() => <AddStaff />} />
      </Switch>
    </>
  );
};

export default Staff;
