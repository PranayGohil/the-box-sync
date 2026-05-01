import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

import { CartProvider, ThemeProvider, AuthProvider } from './context/AppContext';
import { RestaurantProvider, useRestaurant } from './context/RestaurantContext';
import Navbar       from './components/Navbar';
import Footer       from './components/Footer';
import Preloader    from './components/Preloader';
import { useLenis } from './hooks/useScroll';

import Home     from './pages/Home';
import MenuPage from './pages/Menu';
import Cart     from './pages/Cart';
import Checkout from './pages/Checkout';
import Contact  from './pages/Contact';
import Reservation from './pages/Reservation';
import Profile     from './pages/Profile';
import Login       from './pages/Login';
import Rewards     from './pages/Rewards';
import Reorder     from './pages/Reorder';
import MobileBottomNav from './components/MobileBottomNav';

import ScrollToTopButton from './components/ScrollToTopButton';

/* ─── Page transition wrapper ─── */
const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.25 } },
};

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <Routes location={location}>
          <Route path="/"            element={<Home />}     />
          <Route path="menu"         element={<MenuPage />} />
          <Route path="cart"         element={<Cart />}     />
          <Route path="checkout"     element={<Checkout />} />
          <Route path="contact"      element={<Contact />}  />
          <Route path="reservation"  element={<Reservation />} />
          <Route path="profile"      element={<Profile />}  />
          <Route path="login"        element={<Login />}    />
          <Route path="rewards"      element={<Rewards />}  />
          <Route path="reorder"      element={<Reorder />}  />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function AppShell() {
  const [navVisible, setNavVisible] = useState(false);
  const { loading, error } = useRestaurant();
  const location = useLocation();
  const isLoginPage = location.pathname.includes('/login');
  useLenis(); // Initialize smooth scroll

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handlePreloaderComplete = () => {
    setNavVisible(true);
  };
  if (error) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center text-center p-4">
        <div>
          <h2 className="text-white mb-2">Restaurant Not Found</h2>
          <p className="text-white-60">The restaurant code in the URL is invalid or the restaurant does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: isLoginPage ? 0 : 'env(safe-area-inset-bottom, 80px)' }}>
      <AnimatePresence>
        {loading && <Preloader onComplete={handlePreloaderComplete} />}
      </AnimatePresence>

      {!isLoginPage && <Navbar visible={!loading} />}
      <AnimatedRoutes />
      {!isLoginPage && <Footer />}
      {!isLoginPage && <MobileBottomNav />}
      {!isLoginPage && <ScrollToTopButton />}

      {/* Global Toast Notifications */}
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          style: {
            background: '#1A1A1A',
            color: '#fff',
            border: '1px solid rgba(242,122,26,0.3)',
            borderRadius: '12px'
          }
        }} 
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/:restaurantCode/*" element={
                <RestaurantProvider>
                  <AppShell />
                </RestaurantProvider>
              } />
              <Route path="*" element={
                <div className="min-vh-100 d-flex align-items-center justify-content-center text-center p-4">
                  <div>
                    <h2 className="text-white mb-2">Welcome</h2>
                    <p className="text-white-60">Please visit a valid restaurant link (e.g. /YOUR_RESTAURANT_CODE).</p>
                  </div>
                </div>
              } />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
