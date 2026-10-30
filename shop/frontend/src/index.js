// cra imports
import React, { useMemo } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import reportWebVitals from 'reportWebVitals.js';

// Fallback environment settings for Shop
if (!process.env.REACT_APP_API) {
  process.env.REACT_APP_API = 'http://localhost:5003/api';
}
if (!process.env.REACT_APP_API_URL) {
  process.env.REACT_APP_API_URL = 'http://localhost:5003';
}
if (!process.env.REACT_APP_UPLOAD_DIR) {
  process.env.REACT_APP_UPLOAD_DIR = 'http://localhost:5003/uploads';
}

const SHOP_API_BASE = 'http://localhost:5003/api';

// Redirect any request with undefined or legacy ports in URL directly to the shop backend
axios.interceptors.request.use((config) => {
  if (config.url && typeof config.url === 'string') {
    if (config.url.includes('undefined/')) {
      config.url = config.url.replace(/.*undefined\//, `${SHOP_API_BASE}/`);
    } else if (config.url.includes('localhost:5000/api')) {
      config.url = config.url.replace('localhost:5000/api', 'localhost:5003/api');
    } else if (config.url.includes('localhost:5001/api')) {
      config.url = config.url.replace('localhost:5001/api', 'localhost:5003/api');
    }
  }

  // Ensure Authorization header is populated if token exists in localStorage
  const token = localStorage.getItem('token');
  if (token && token !== 'null' && token !== 'undefined') {
    if (!config.headers) {
      config.headers = {};
    }
    if (!config.headers.Authorization || config.headers.Authorization === 'Bearer null' || config.headers.Authorization === 'Bearer undefined') {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

// import redux requirements
import { Provider } from 'react-redux';
import { PersistGate } from 'reduxjs-toolkit-persist/integration/react';
import { store, persistedStore } from 'store.js';

// import html head tags requirements
import { Helmet } from 'react-helmet';
import { REACT_HELMET_PROPS } from 'config.js';

// import multi language
import LangProvider from 'lang/LangProvider';

// import contexts
import { AuthProvider } from 'contexts/AuthContext';
import { SocketProvider } from 'contexts/SocketContext';

// import routing modules
import { BrowserRouter as Router } from 'react-router-dom';
import RouteIdentifier from 'routing/components/RouteIdentifier';
import Loading from 'components/loading/Loading';

// import routes
import { getLayoutlessRoutes } from 'routing/helper';
import defaultRoutes from 'routing/default-routes';
import allRoutes from 'routes.js';

// import toastify for notification
import { Slide, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// import global custom css architecture
import './assets/css/global.css';
import './assets/css/layout.css';
import './assets/css/components.css';
import './assets/css/utilities.css';
import './assets/css/responsive.css';


// Suppress ResizeObserver loop errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    if (e.message && e.message.includes('ResizeObserver')) {
      const resizeObserverErrDiv = document.getElementById('webpack-dev-server-client-overlay-div');
      const resizeObserverErr = document.getElementById('webpack-dev-server-client-overlay');
      if (resizeObserverErr) resizeObserverErr.setAttribute('style', 'display: none');
      if (resizeObserverErrDiv) resizeObserverErrDiv.setAttribute('style', 'display: none');
      e.stopImmediatePropagation();
    }
  });
}

const Main = () => {
  const layoutlessRoutes = useMemo(() => getLayoutlessRoutes({ data: allRoutes }), []);
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistedStore}>
        <Helmet {...REACT_HELMET_PROPS} />
        <ToastContainer
          theme="light"
          transition={Slide}
          newestOnTop
          position="top-right"
          autoClose={2000}
          hideProgressBar={false}
          closeOnClick
          pauseOnHover
          draggable
        />
        <Router basename={process.env.REACT_APP_BASENAME}>
          <LangProvider>
            <AuthProvider>
              <SocketProvider>
                <RouteIdentifier routes={[...layoutlessRoutes, ...defaultRoutes]} fallback={<Loading />} />
              </SocketProvider>
            </AuthProvider>
          </LangProvider>
        </Router>
      </PersistGate>
    </Provider>
  );
};

ReactDOM.render(<Main />, document.getElementById('root'));

/*
 * If you want to start measuring performance in your app, pass a function
 * to log results (for example: reportWebVitals(console.log))
 * or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
 */
reportWebVitals();

// Register service worker for PWA install support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((reg) => console.log('SW registered:', reg.scope))
      .catch((err) => console.error('SW registration failed:', err));
  });
}
