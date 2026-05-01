import { motion } from 'framer-motion';
import { Gift, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Rewards() {
  return (
    <main className="min-vh-100 d-flex align-items-center justify-content-center px-3 overflow-hidden" style={{ paddingTop: '8rem', paddingBottom: '8rem' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="w-100 glass rounded-4 p-4 p-md-5 text-center position-relative shadow"
        style={{ maxWidth: '450px' }}
      >
        <div className="position-absolute rounded-circle pointer-events-none" style={{ top: 0, right: 0, width: '150px', height: '150px', background: 'rgba(242, 122, 26, 0.2)', filter: 'blur(50px)' }} />
        
        <div className="rounded-4 d-flex align-items-center justify-content-center mx-auto mb-4 shadow" style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, var(--brand), #e05c0c)' }}>
          <Gift size={40} className="text-white" />
        </div>
        
        <h2 className="font-display fw-bold text-white mb-3">Ember Rewards</h2>
        <p className="text-white-60 small mb-4" style={{ lineHeight: 1.6 }}>
          Join our exclusive loyalty program. Earn points on every order and unlock special dining experiences, free desserts, and priority booking.
        </p>
        
        <button className="btn-primary w-100 justify-content-center py-3 mb-4">
          Join for Free
        </button>
        
        <Link to="/menu" className="d-inline-flex align-items-center gap-2 text-brand-400 text-decoration-none small fw-medium transition-colors hover:text-brand-300">
          Explore Menu <ArrowRight size={16} />
        </Link>
      </motion.div>
    </main>
  );
}
