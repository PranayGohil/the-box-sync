/**
 * Cinematic Navbar (Bootstrap version)
 * - Appears via GSAP after preloader
 * - Morphs from transparent to glass on scroll
 */
import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Sun, Moon, Flame, User, Menu, X, Home, ShoppingBag, Calendar } from 'lucide-react';
import { useCart, useTheme } from '../context/AppContext';
import { useRestaurant } from '../context/RestaurantContext';

const NAV_LINKS = [
  { to: '/',            label: 'Home'    },
  { to: '/menu',        label: 'Menu'    },
  { to: '/reservation', label: 'Reservation' },
  { to: '/contact',     label: 'Contact' },
];

export default function Navbar({ visible: propVisible }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const navRef = useRef(null);
  const { totalItems } = useCart();
  const { isDark, toggleTheme } = useTheme();
  const { restaurantCode, settings } = useRestaurant();
  const location = useLocation();
  const links = NAV_LINKS.filter(link => {
    if (link.to === '/reservation' && settings?.show_reservation === false) {
      return false;
    }
    return true;
  });
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const logoUrl = settings?.logo 
    ? (settings.logo.startsWith('http') ? settings.logo : `${API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL}/uploads/${settings.logo.replace(/^\/+/, '')}`) 
    : null;

  useEffect(() => {
    setIsMounted(true);
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Force visible for debugging if prop is weird
  const visible = propVisible || isMounted;

  const navClass = scrolled ? 'py-2 px-3 py-md-3 px-md-4' : 'py-3 px-3 py-md-4 px-md-5';
  const containerClass = scrolled ? 'glass-strong rounded-4 px-3 py-2 px-md-4 py-md-3 shadow' : 'p-0';

  return (
    <>
      <nav
        ref={navRef}
        className={`fixed-top transition-all duration-700 ${navClass}`}
        style={{ 
          zIndex: 9999,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          pointerEvents: visible ? 'auto' : 'none',
          backgroundColor: scrolled ? 'rgba(6, 6, 6, 0.95)' : 'rgba(6, 6, 6, 0.2)',
          backdropFilter: 'blur(12px)',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.1)' : 'none'
        }}
      >
        <div
          className={`container-lg d-flex align-items-center justify-content-between transition-all duration-500 ${containerClass}`}
        >
          {/* Logo */}
          <Link to={`/${restaurantCode || ''}`} className="d-flex align-items-center gap-2 gap-md-3 text-decoration-none">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={settings?.restaurant_name || "Logo"} 
                className="rounded-3 shadow-sm object-fit-cover" 
                style={{ width: '36px', height: '36px' }} 
              />
            ) : (
              <div 
                className="rounded-3 d-flex align-items-center justify-content-center shadow-sm"
                style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, var(--brand), #e05c0c)' }}
              >
                <Flame className="text-white" size={20} />
              </div>
            )}
            <span className="font-display fw-bold fs-5 d-none d-sm-block">
              <span className="text-white">{settings?.restaurant_name || 'Ember'}</span>
              {!settings?.restaurant_name && <span className="text-gradient"> &amp; Gold</span>}
            </span>
          </Link>

          {/* Desktop links */}
          <div className="d-none d-md-flex align-items-center gap-4">
            {links.map(({ to, label }) => {
              const fullPath = `/${restaurantCode || ''}${to}`.replace(/\/+/g, '/');
              return (
                <NavLink
                  key={to}
                  to={fullPath}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'text-brand-400' : 'text-white-60'}`
                  }
                >
                  {label}
                </NavLink>
              );
            })}
          </div>

          {/* Actions */}
          <div className="d-flex align-items-center gap-2 gap-md-3">
            <button
              onClick={toggleTheme}
              className="rounded-circle glass d-flex align-items-center justify-content-center border-0"
              style={{ width: '36px', height: '36px', cursor: 'pointer' }}
              aria-label="Toggle theme"
            >
              {isDark
                ? <Sun  size={16} className="text-gold" />
                : <Moon size={16} className="text-brand-400" />
              }
            </button>

            <Link
              to={`/${restaurantCode || ''}/cart`.replace(/\/+/g, '/')}
              className="position-relative rounded-circle glass d-flex align-items-center justify-content-center text-decoration-none"
              style={{ width: '36px', height: '36px', cursor: 'pointer' }}
              aria-label="Cart"
            >
              <ShoppingCart size={16} className="text-white" />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="position-absolute translate-middle badge rounded-pill bg-brand-500"
                    style={{ top: '5px', right: '-15px' }}
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            <Link
              to={`/${restaurantCode || ''}/profile`.replace(/\/+/g, '/')}
              className="d-none d-md-flex rounded-circle glass align-items-center justify-content-center text-decoration-none"
              style={{ width: '36px', height: '36px', cursor: 'pointer' }}
              aria-label="Profile"
            >
              <User size={16} className="text-white" />
            </Link>

            <button
              onClick={() => setMobileOpen(true)}
              className="d-none rounded-circle glass align-items-center justify-content-center border-0"
              style={{ width: '36px', height: '36px', cursor: 'pointer' }}
              aria-label="Menu"
            >
              <Menu size={18} className="text-white" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed-top vh-100 vw-100 glass-strong shadow-lg d-md-none"
            style={{ zIndex: 2000 }}
          >
            <div className="p-4 d-flex flex-column h-100">
              <div className="d-flex align-items-center justify-content-between mb-5">
                <div className="d-flex align-items-center gap-2">
                  <Flame className="text-brand-400" size={24} />
                  <span className="font-display fw-bold fs-4 text-white">Menu</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="btn p-0 border-0 text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="d-flex flex-column gap-4">
                {links.map(({ to, label }) => {
                  const fullPath = `/${restaurantCode || ''}${to}`.replace(/\/+/g, '/');
                  return (
                    <NavLink
                      key={to}
                      to={fullPath}
                      end={label === 'Home'}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `fs-2 fw-bold font-display text-decoration-none transition-all ${isActive ? 'text-brand-400 ps-3 border-start border-4 border-brand-400' : 'text-white-60'}`
                      }
                    >
                      {label}
                    </NavLink>
                  );
                })}
              </div>

              <div className="mt-auto pt-5 border-top" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <p className="small text-white-60 mb-3 text-uppercase" style={{ letterSpacing: '0.1em' }}>Connect</p>
                <div className="d-flex gap-3">
                  {['Instagram', 'Twitter', 'Facebook'].map(s => (
                    <a key={s} href="#" className="text-white-60 text-decoration-none small hover:text-brand-400">{s}</a>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}
