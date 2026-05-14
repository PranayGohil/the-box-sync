import React, { useContext } from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { AuthContext } from 'contexts/AuthContext';
import ViewStaff from './ViewStaff';
import AddStaff from './AddStaff';
import EditStaff from './EditStaff';
import StaffProfile from './StaffProfile';

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
      </Switch>
    </>
  );
};

export default Staff;
