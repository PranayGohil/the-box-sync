// cra imports
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import reportWebVitals from 'reportWebVitals.js';

// import html head tags requirements
import { Helmet } from 'react-helmet';
import { REACT_HELMET_PROPS } from 'config.js';

// import routing modules
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Loading from 'components/loading/Loading';

// import toastify for notification
import { Slide, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// mock server register for demo
import '@mock-api';

import KioskScan from 'views/attendance/KioskScan';

// Suppress ResizeObserver loop error overlay in development
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    if (e.message && e.message.includes('ResizeObserver')) {
      e.stopImmediatePropagation();
    }
  });
}

const Main = () => {
  return (
    <>
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
        <Suspense fallback={<Loading />}>
          <Switch>
            <Route path="/:company_id" exact component={KioskScan} />
          </Switch>
        </Suspense>
      </Router>
    </>
  );
};

ReactDOM.render(<Main />, document.getElementById('root'));

reportWebVitals();
