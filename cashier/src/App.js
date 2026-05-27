import React, { useMemo } from 'react';

// import redux for auth guard
import { useSelector } from 'react-redux';

// import layout
import Layout from 'layout/Layout';

// import routing modules
import RouteIdentifier from 'routing/components/RouteIdentifier';
import { getRoutes, filterRoutesByPlans } from 'routing/helper';
import allRoutes from 'routes.js';
import Loading from 'components/loading/Loading';
import { AuthContext } from 'contexts/AuthContext';

const App = () => {
  const { currentUser, isLogin } = useSelector((state) => state.auth);
  const { activePlans } = React.useContext(AuthContext);

  const filteredRoutes = useMemo(() => {
    return filterRoutesByPlans(allRoutes, activePlans);
  }, [activePlans]);

  const routes = useMemo(() => getRoutes({ data: filteredRoutes, isLogin, userRole: currentUser.role }), [isLogin, currentUser, filteredRoutes]);
  if (routes) {
    return (
      <Layout>
        <RouteIdentifier routes={routes} fallback={<Loading />} />
      </Layout>
    );
  }
  return <></>;
};

export default App;
