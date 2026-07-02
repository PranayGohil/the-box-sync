import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AppContext';
import { useRestaurant } from '../context/RestaurantContext';
import { User, Mail, Lock, ArrowLeft, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login, signup } = useAuth();
  const { restaurantCode } = useRestaurant();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && (!name || !phone))) {
      toast.error('Please fill in all required fields', {
        style: { background: '#1A1A1A', color: '#fff', border: '1px solid rgba(242,122,26,0.3)' }
      });
      return;
    }

    const authPromise = isSignUp 
      ? signup(name, email, phone, password, restaurantCode)
      : login(email, password, restaurantCode);

    toast.promise(
      authPromise,
      {
        loading: isSignUp ? 'Creating account...' : 'Signing in...',
        success: () => {
          navigate(`/${restaurantCode}/profile`.replace(/\/+/g, '/'));
          return isSignUp ? 'Account created! Welcome!' : 'Welcome back!';
        },
        error: (err) => err.message || 'Authentication failed',
      },
      {
        style: { background: '#1A1A1A', color: '#fff', border: '1px solid rgba(242,122,26,0.3)', borderRadius: '12px' }
      }
    );
  };

  return (
    <main className="min-vh-100 d-flex align-items-center justify-content-center px-3 bg-dark" style={{ background: 'radial-gradient(circle at center, #111, #060606)' }}>
      <div className="position-absolute top-0 start-0 p-4">
        <button 
          onClick={() => navigate(-1)} 
          className="btn-ghost d-flex align-items-center gap-2 text-white-60 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} /> Back
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="w-100 glass rounded-4 p-4 p-md-5 shadow-2xl"
        style={{ maxWidth: '450px', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="text-center mb-5">
          <div className="rounded-4 d-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: '80px', height: '80px', background: 'rgba(242, 122, 26, 0.1)', border: '1px solid rgba(242, 122, 26, 0.2)' }}>
            <User size={40} className="text-brand-400" />
          </div>
          <h1 className="font-display fw-bold text-white mb-2" style={{ fontSize: '2.5rem' }}>
            {isSignUp ? 'Sign Up' : 'Login'}
          </h1>
          <p className="text-white-60">
            {isSignUp ? 'Create your new customer account' : 'Welcome back to Ember & Gold'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="d-flex flex-column gap-4">
          {isSignUp && (
            <>
              <div>
                <label className="form-label small text-white-60 mb-2 fw-medium">Full Name</label>
                <div className="position-relative">
                  <User className="position-absolute text-white-60" size={18} style={{ top: '50%', left: '1.25rem', transform: 'translateY(-50%)' }} />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field w-100 py-3" 
                    style={{ paddingLeft: '3.5rem' }}
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="form-label small text-white-60 mb-2 fw-medium">Phone Number</label>
                <div className="position-relative">
                  <Phone className="position-absolute text-white-60" size={18} style={{ top: '50%', left: '1.25rem', transform: 'translateY(-50%)' }} />
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-field w-100 py-3" 
                    style={{ paddingLeft: '3.5rem' }}
                    placeholder="9876543210"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="form-label small text-white-60 mb-2 fw-medium">Email Address</label>
            <div className="position-relative">
              <Mail className="position-absolute text-white-60" size={18} style={{ top: '50%', left: '1.25rem', transform: 'translateY(-50%)' }} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field w-100 py-3" 
                style={{ paddingLeft: '3.5rem' }}
                placeholder="name@example.com"
                required
              />
            </div>
          </div>

          <div>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <label className="form-label small text-white-60 mb-0 fw-medium">Password</label>
              {!isSignUp && <a href="#" className="small text-brand-400 text-decoration-none">Forgot?</a>}
            </div>
            <div className="position-relative">
              <Lock className="position-absolute text-white-60" size={18} style={{ top: '50%', left: '1.25rem', transform: 'translateY(-50%)' }} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-100 py-3" 
                style={{ paddingLeft: '3.5rem' }}
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          
          <button type="submit" className="btn-primary w-100 justify-content-center py-3 mt-2 fs-5 fw-bold shadow-lg">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>
        
        <div className="text-center mt-5">
          <p className="text-white-60 small mb-0">
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <button onClick={() => setIsSignUp(false)} className="btn-link text-brand-400 fw-bold text-decoration-none bg-transparent border-0 p-0">
                  Sign In
                </button>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <button onClick={() => setIsSignUp(true)} className="btn-link text-brand-400 fw-bold text-decoration-none bg-transparent border-0 p-0">
                  Create one
                </button>
              </>
            )}
          </p>
        </div>
      </motion.div>

      {/* Decorative background elements */}
      <div className="position-absolute top-0 end-0 translate-middle-y opacity-10" style={{ width: '400px', height: '400px', background: 'var(--brand)', filter: 'blur(100px)', zIndex: -1 }} />
      <div className="position-absolute bottom-0 start-0 translate-middle-y opacity-10" style={{ width: '400px', height: '400px', background: 'var(--gold)', filter: 'blur(100px)', zIndex: -1 }} />
    </main>
  );
}
