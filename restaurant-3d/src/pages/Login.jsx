import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AppContext';
import { useRestaurant } from '../context/RestaurantContext';
import { Mail, ArrowLeft, Lock, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { requestOtp, verifyOtp } = useAuth();
  const { restaurantCode } = useRestaurant();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!otpSent) {
      // Step 1: Send OTP code
      const requestPromise = requestOtp(email, restaurantCode);

      toast.promise(
        requestPromise,
        {
          loading: 'Sending verification code...',
          success: () => {
            setOtpSent(true);
            return 'Code sent successfully!';
          },
          error: (err) => {
            const msg = err.message || 'Failed to send verification code';
            setError(msg);
            return msg;
          },
        },
        {
          style: { background: '#1A1A1A', color: '#fff', border: '1px solid rgba(242,122,26,0.3)', borderRadius: '12px' }
        }
      );
    } else {
      // Step 2: Verify OTP code
      if (!otp || otp.length !== 6) {
        setError('Please enter a valid 6-digit code');
        return;
      }

      const verifyPromise = verifyOtp(email, otp, restaurantCode);

      toast.promise(
        verifyPromise,
        {
          loading: 'Verifying code...',
          success: () => {
            navigate(`/${restaurantCode}/profile`.replace(/\/+/g, '/'));
            return 'Welcome back!';
          },
          error: (err) => {
            const msg = err.message || 'Verification failed';
            setError(msg);
            return msg;
          },
        },
        {
          style: { background: '#1A1A1A', color: '#fff', border: '1px solid rgba(242,122,26,0.3)', borderRadius: '12px' }
        }
      );
    }
  };

  return (
    <main className="min-vh-100 d-flex align-items-center justify-content-center px-3 bg-dark" style={{ background: 'radial-gradient(circle at center, #111, #060606)' }}>
      <div className="position-absolute top-0 start-0 p-4">
        <button 
          onClick={() => navigate(-1)} 
          className="btn-ghost d-flex align-items-center gap-2 text-white-60 hover:text-white transition-colors border-0 bg-transparent"
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
            <KeyRound size={40} className="text-brand-400" />
          </div>
          <h1 className="font-display fw-bold text-white mb-2" style={{ fontSize: '2.5rem' }}>
            {otpSent ? 'Verify OTP' : 'Sign In'}
          </h1>
          <p className="text-white-60">
            {otpSent ? 'Enter the 6-digit code sent to your email' : 'Sign in securely using email & One-Time Password'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="d-flex flex-column gap-4">
          <div>
            <label className="form-label small text-white-60 mb-2 fw-medium">Email Address</label>
            <div className="position-relative">
              <Mail className="position-absolute text-white-60" size={18} style={{ top: '50%', left: '1.25rem', transform: 'translateY(-50%)' }} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                className="input-field w-100 py-3" 
                style={{ paddingLeft: '3.5rem' }}
                placeholder="name@example.com"
                required
                disabled={otpSent}
              />
            </div>
          </div>

          {otpSent && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="d-flex flex-column gap-2"
            >
              <label className="form-label small text-white-60 mb-1 fw-medium">Verification Code</label>
              <div className="position-relative">
                <Lock className="position-absolute text-white-60" size={18} style={{ top: '50%', left: '1.25rem', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  maxLength={6}
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
                  className="input-field w-100 py-3 text-center font-monospace tracking-widest fs-4" 
                  style={{ paddingLeft: '3.5rem' }}
                  placeholder="000000"
                  required
                  autoFocus
                />
              </div>
              <div className="text-end">
                <button 
                  type="button" 
                  onClick={() => { setOtpSent(false); setOtp(''); setError(''); }}
                  className="btn-link text-brand-400 small text-decoration-none bg-transparent border-0 p-0"
                >
                  Change Email
                </button>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-3 text-start"
              style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                fontSize: '0.875rem'
              }}
            >
              {error}
            </motion.div>
          )}

          <button type="submit" className="btn-primary w-100 justify-content-center py-3 mt-2 fs-5 fw-bold shadow-lg">
            {otpSent ? 'Verify & Login' : 'Get Verification Code'}
          </button>
        </form>

        <div className="text-center mt-5">
          <p className="text-white-60 small mb-0">
            No password required. New users will be automatically registered.
          </p>
        </div>
      </motion.div>

      {/* Decorative background elements */}
      <div className="position-absolute top-0 end-0 translate-middle-y opacity-10" style={{ width: '400px', height: '400px', background: 'var(--brand)', filter: 'blur(100px)', zIndex: -1 }} />
      <div className="position-absolute bottom-0 start-0 translate-middle-y opacity-10" style={{ width: '400px', height: '400px', background: 'var(--gold)', filter: 'blur(100px)', zIndex: -1 }} />
    </main>
  );
}
