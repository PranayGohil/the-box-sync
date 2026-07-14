import React, { useMemo } from 'react';

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
  const { activePlans, loading } = React.useContext(AuthContext);

  const routes = useMemo(() => getRoutes({ data: allRoutes, isLogin, userRole: currentUser.role, activePlans }), [isLogin, currentUser, activePlans]);

  if (loading) {
    return <Loading />;
  }

  if (routes) {
    if (isLogin && currentUser) {
      const path = window.location.pathname;

      if (currentUser.purchasedPlan && currentUser.isApproved === false && !path.includes('/select-plan')) {
        return (
          <div className="d-flex align-items-center justify-content-center min-vh-100" style={{ backgroundColor: '#0d1b2a', fontFamily: 'inherit' }}>
            <div className="text-center p-5 rounded-4 shadow-lg" style={{ backgroundColor: '#1a3a5c', maxWidth: '500px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="mb-4 d-inline-flex align-items-center justify-content-center rounded-circle" style={{ width: '80px', height: '80px', backgroundColor: 'rgba(35, 179, 244, 0.15)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#23b3f4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </div>
              <h2 className="text-white fw-bold mb-3">Account Pending Approval</h2>
              <p className="text-white-50 mb-4" style={{ fontSize: '1.05rem', lineHeight: '1.6' }}>
                Your restaurant registration is currently under review by our team. Once your account is approved and payment is verified, your dashboard will be activated.
              </p>
              <div className="d-grid gap-3 mt-4">
                <button 
                  type="button"
                  className="btn btn-primary rounded-pill py-2 fw-bold"
                  style={{ backgroundColor: '#23b3f4', borderColor: '#23b3f4' }}
                  onClick={() => { window.location.href = '/select-plan'; }}
                >
                  View My Plan Selection
                </button>
                <button 
                  type="button"
                  className="btn btn-outline-light rounded-pill py-2"
                  onClick={() => {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                  }}
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        );
      }
    }

    return (
      <Layout>
        <RouteIdentifier routes={routes} fallback={<Loading />} />
      </Layout>
    );
  }
  return <></>;
};

export default App;
