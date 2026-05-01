import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AppContext';
import { useRestaurant } from '../context/RestaurantContext';
import { User, LogOut, Mail, Lock, History, Heart, MapPin, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { restaurantCode } = useRestaurant();

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields', {
        style: { background: '#1A1A1A', color: '#fff', border: '1px solid rgba(242,122,26,0.3)' }
      });
      return;
    }
    // Simulate login delay
    toast.promise(
      new Promise(resolve => setTimeout(() => resolve(), 1000)),
      {
        loading: 'Signing in...',
        success: () => {
          login(email);
          return 'Welcome back!';
        },
        error: 'Login failed',
      },
      {
        style: { background: '#1A1A1A', color: '#fff', border: '1px solid rgba(242,122,26,0.3)', borderRadius: '12px' }
      }
    );
  };

  const handleLogout = () => {
    logout();
    toast('Logged out', {
      icon: '👋',
      style: { background: '#1A1A1A', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }
    });
  };

  if (!user) {
    return (
      <main className="min-vh-100 d-flex flex-column align-items-center justify-content-center px-3" style={{ paddingTop: '8rem', paddingBottom: '8rem' }}>
        <div className="text-center glass p-5 rounded-4" style={{ maxWidth: '400px' }}>
          <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4 shadow" style={{ width: '80px', height: '80px', background: 'rgba(242, 122, 26, 0.1)', border: '1px solid rgba(242, 122, 26, 0.2)' }}>
            <User size={40} className="text-brand-400" />
          </div>
          <h2 className="text-white fw-bold mb-3">Sign In Required</h2>
          <p className="text-white-60 mb-4">Please sign in to access your profile, order history, and rewards.</p>
          <button 
            onClick={() => navigate(`/${restaurantCode}/login`.replace(/\/+/g, '/'))} 
            className="btn-primary w-100 justify-content-center py-2"
          >
            Go to Login
          </button>
        </div>
      </main>
    );
  }

  // Dashboard for logged in user
  return (
    <main className="min-vh-100" style={{ paddingTop: '8rem', paddingBottom: '8rem' }}>
      <div className="container-lg" style={{ maxWidth: '900px' }}>
        {/* Profile Header */}
        <div className="glass rounded-4 p-4 p-md-5 d-flex flex-column flex-md-row align-items-center align-items-md-start gap-4 mb-5 position-relative overflow-hidden">
          {/* Background glow */}
          <div className="position-absolute rounded-circle pointer-events-none" style={{ top: 0, right: 0, width: '250px', height: '250px', background: 'rgba(242, 122, 26, 0.1)', filter: 'blur(100px)' }} />
          
          <div className="rounded-circle d-flex align-items-center justify-content-center shadow text-white font-display fw-bold text-uppercase flex-shrink-0" style={{ width: '96px', height: '96px', fontSize: '2rem', background: 'linear-gradient(135deg, var(--brand), #e05c0c)' }}>
            {user.name.charAt(0)}
          </div>
          
          <div className="flex-grow-1 text-center text-md-start">
            <h2 className="font-display fw-bold text-white mb-1 text-capitalize">{user.name}</h2>
            <p className="text-white-60 d-flex align-items-center justify-content-center justify-content-md-start gap-2 small mb-3">
              <Mail size={14} /> {user.email}
            </p>
            <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill small fw-semibold" style={{ background: 'rgba(242, 122, 26, 0.2)', color: 'var(--brand)', border: '1px solid rgba(242, 122, 26, 0.3)' }}>
              Member since {user.since}
            </div>
          </div>
          
          <button onClick={handleLogout} className="btn-ghost align-self-center align-self-md-start small py-2 px-3">
            <LogOut size={16} className="me-2" /> Logout
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="row g-4">
          <div className="col-12 col-md-4">
            <div className="glass rounded-4 p-4 transition-colors h-100 position-relative" style={{ cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(242, 122, 26, 0.3)'} onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}>
              <div className="rounded-3 d-flex align-items-center justify-content-center mb-3" style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)' }}>
                <History size={20} className="text-brand-400" />
              </div>
              <h5 className="fw-semibold text-white mb-2">Order History</h5>
              <p className="small text-white-60 mb-0">View your past orders and receipts.</p>
            </div>
          </div>
          
          <div className="col-12 col-md-4">
            <div className="glass rounded-4 p-4 transition-colors h-100 position-relative" style={{ cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(242, 122, 26, 0.3)'} onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}>
              <div className="rounded-3 d-flex align-items-center justify-content-center mb-3" style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)' }}>
                <Heart size={20} className="text-brand-400" />
              </div>
              <h5 className="fw-semibold text-white mb-2">Saved Items</h5>
              <p className="small text-white-60 mb-0">Your favourite dishes saved for later.</p>
            </div>
          </div>
          
          <div className="col-12 col-md-4">
            <div className="glass rounded-4 p-4 transition-colors h-100 position-relative" style={{ cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(242, 122, 26, 0.3)'} onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}>
              <div className="rounded-3 d-flex align-items-center justify-content-center mb-3" style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)' }}>
                <MapPin size={20} className="text-brand-400" />
              </div>
              <h5 className="fw-semibold text-white mb-2">Addresses</h5>
              <p className="small text-white-60 mb-0">Manage your delivery locations.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
