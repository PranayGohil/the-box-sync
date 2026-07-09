import React, { useMemo } from 'react';

// import redux for auth guard
// (removed useSelector since we use AuthContext now)

// import layout
import Layout from 'layout/Layout';

// import routing modules
import RouteIdentifier from 'routing/components/RouteIdentifier';
import { getRoutes, filterRoutesByPlans } from 'routing/helper';
import allRoutes from 'routes.js';
import Loading from 'components/loading/Loading';
import { AuthContext } from 'contexts/AuthContext';

const App = () => {
  const { activePlans, kotUserExists, loading, isLogin, currentUser } = React.useContext(AuthContext);

  const filteredRoutes = useMemo(() => {
    return filterRoutesByPlans(allRoutes, activePlans, kotUserExists);
  }, [activePlans, kotUserExists]);

  const routes = useMemo(() => getRoutes({ data: filteredRoutes, isLogin, userRole: currentUser?.role || 'admin' }), [isLogin, currentUser, filteredRoutes]);

  if (loading) {
    return <Loading />;
  }

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
