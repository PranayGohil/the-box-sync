import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import useCustomLayout from 'hooks/useCustomLayout';
import { LAYOUT } from 'constants.js';

import OrderHistory from './order/OrderHistory';
import OrderDetails from './order/OrderDetails';

const Operations = () => {
  useCustomLayout({ layout: LAYOUT.Boxed });

  return (
    <div className="position-relative">
      <Switch>
        <Route exact path="/operations" render={() => <Redirect to="/operations/order-history" />} />
        <Route path="/operations/order-history" component={OrderHistory} />
        <Route path="/operations/order-details/:id" component={OrderDetails} />
      </Switch>
    </div>
  );
};

export default Operations;
