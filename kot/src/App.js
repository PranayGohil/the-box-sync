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

const App = () => {
  const { currentUser, isLogin } = useSelector((state) => state.auth);
  const { currentUser: contextUser } = useContext(AuthContext);

  const filteredRoutesData = useMemo(() => {
    const plan = contextUser?.purchasedPlan?.toLowerCase();
    const hideKotDisplay = plan === 'cloud' || plan === 'fine dine' || plan === 'cloud kitchen' || plan === 'cloud plan' || plan === 'fine dine plan';
    if (hideKotDisplay) {
      return {
        ...allRoutes,
        mainMenuItems: allRoutes.mainMenuItems.filter((item) => !item.path?.includes('/kot-display')),
      };
    }
    return allRoutes;
  }, [contextUser]);

  const routes = useMemo(() => getRoutes({ data: filteredRoutesData, isLogin, userRole: currentUser.role }), [isLogin, currentUser, filteredRoutesData]);
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
