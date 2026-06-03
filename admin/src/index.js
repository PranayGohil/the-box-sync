// cra imports
import React, { useMemo } from 'react';
import ReactDOM from 'react-dom';
import reportWebVitals from 'reportWebVitals.js';
import axios from 'axios';

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

// mock server register for demo
import '@mock-api';

const convertToWebP = (file, maxDimension = 1920, quality = 0.8) => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/') || file.type === 'image/gif') {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const newFileName = `${file.name.replace(/\.[^/.]+$/, '')}.webp`;
            const webpFile = new File([blob], newFileName, {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve(webpFile);
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

axios.interceptors.request.use(
  async (config) => {
    if (config.data instanceof FormData) {
      const newFormData = new FormData();
      const entries = Array.from(config.data.entries());
      const processedEntries = await Promise.all(
        entries.map(async ([key, value]) => {
          if (value instanceof File && value.type.startsWith('image/') && value.type !== 'image/gif') {
            try {
              const webpFile = await convertToWebP(value);
              return [key, webpFile];
            } catch (e) {
              console.error('Failed to convert image to WebP:', e);
              return [key, value];
            }
          }
          return [key, value];
        })
      );
      processedEntries.forEach(([key, value]) => {
        newFormData.append(key, value);
      });
      config.data = newFormData;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Suppress ResizeObserver loop errors
window.addEventListener('error', (e) => {
  if (e.message === 'ResizeObserver loop completed with undelivered notifications.' || e.message === 'ResizeObserver loop limit exceeded') {
    const resizeObserverErrDiv = document.getElementById('webpack-dev-server-client-overlay-div');
    const resizeObserverErr = document.getElementById('webpack-dev-server-client-overlay');
    if (resizeObserverErr) resizeObserverErr.setAttribute('style', 'display: none');
    if (resizeObserverErrDiv) resizeObserverErrDiv.setAttribute('style', 'display: none');
    e.stopImmediatePropagation();
  }
});

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
