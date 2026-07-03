import { NavLink } from 'react-router-dom';
import { Home, ShoppingBag, Calendar, Phone, User } from 'lucide-react';
import { useCart } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useRestaurant } from '../context/RestaurantContext';

export default function MobileBottomNav() {
  const { totalItems } = useCart();
  const { restaurantCode, settings } = useRestaurant();

  const NAV_ITEMS = [
    { to: `/${restaurantCode || ''}/`.replace(/\/+/g, '/'), label: 'Home', icon: Home },
    settings?.show_reservation !== false && { to: `/${restaurantCode || ''}/reservation`.replace(/\/+/g, '/'), label: 'Book', icon: Calendar },
    { to: `/${restaurantCode || ''}/menu`.replace(/\/+/g, '/'), label: 'Menu', icon: ShoppingBag, isCenter: true },
    { to: `/${restaurantCode || ''}/contact`.replace(/\/+/g, '/'), label: 'Contact', icon: Phone },
    { to: `/${restaurantCode || ''}/profile`.replace(/\/+/g, '/'), label: 'Profile', icon: User },
  ].filter(Boolean);

  return (
    <div className="d-md-none fixed-bottom px-3 pb-3" style={{ zIndex: 1050 }}>
      <div 
        className="glass-strong rounded-pill shadow-lg d-flex align-items-center justify-content-between px-2"
        style={{ height: '70px', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {NAV_ITEMS.map(({ to, label, icon: Icon, isCenter }) => (
          <NavLink 
            key={to} 
            to={to} 
            end={label === 'Home'}
            className={({ isActive }) => `d-flex flex-column align-items-center justify-content-center text-decoration-none transition-all ${isActive ? 'text-brand-400' : 'text-white-60'}`}
            style={{ width: isCenter ? '80px' : '60px', height: '100%', position: 'relative' }}
          >
            {({ isActive }) => (
              <>
                {isCenter ? (
                  <div 
                    className={`rounded-circle d-flex align-items-center justify-content-center transition-all ${isActive ? 'bg-brand-500 shadow-brand scale-110' : 'bg-brand-500 bg-opacity-20'}`}
                    style={{ 
                      width: '54px', 
                      height: '54px', 
                      marginTop: '-30px',
                      border: '4px solid #0A0A0A'
                    }}
                  >
                    <Icon size={24} className={isActive ? 'text-white' : 'text-brand-400'} />
                    {totalItems > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-dark" style={{ fontSize: '10px', zIndex: 5 }}>
                        {totalItems}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="position-relative">
                    <Icon size={20} className={`mb-1 ${isActive ? 'text-brand-400' : ''}`} style={isActive ? { fill: 'currentColor', fillOpacity: 0.2 } : {}} />
                  </div>
                )}
                <span className={`${isCenter ? 'mt-1' : ''}`} style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.01em' }}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
