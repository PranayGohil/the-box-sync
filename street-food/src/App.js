import React, { useMemo, useContext } from 'react';

// import redux for auth guard
import { useSelector } from 'react-redux';

// import layout
import Layout from 'layout/Layout';

// import routing modules
import RouteIdentifier from 'routing/components/RouteIdentifier';
import { getRoutes } from 'routing/helper';
import allRoutes from 'routes.js';
import Loading from 'components/loading/Loading';
import { AuthContext } from 'contexts/AuthContext';
import { DEFAULT_PATHS } from 'config.js';

const appRoot = DEFAULT_PATHS.APP.endsWith('/') ? DEFAULT_PATHS.APP.slice(1) : DEFAULT_PATHS.APP;

const App = () => {
  const { currentUser, isLogin } = useSelector((state) => state.auth);
  const { activePlans, loading } = useContext(AuthContext);

  // Determine home route based on Scan and Order plan
  const dynamicRoutes = useMemo(() => {
    const hasScanAndOrder = activePlans.includes('Scan and Order');
    return {
      ...allRoutes,
      mainMenuItems: allRoutes.mainMenuItems.map((r) =>
        r.redirect ? { ...r, to: hasScanAndOrder ? `${appRoot}/dashboard` : `${appRoot}/order/new` } : r
      ),
    };
  }, [activePlans]);

  const routes = useMemo(() => getRoutes({ data: dynamicRoutes, isLogin, userRole: currentUser.role, activePlans }), [isLogin, currentUser, activePlans, dynamicRoutes]);

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
