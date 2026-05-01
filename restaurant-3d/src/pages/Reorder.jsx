import { motion } from 'framer-motion';
import { RotateCcw, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AppContext';

export default function Reorder() {
  const { user } = useAuth();

  return (
    <main className="min-vh-100 d-flex align-items-center justify-content-center px-3 overflow-hidden" style={{ paddingTop: '8rem', paddingBottom: '8rem' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-100 glass rounded-4 p-4 p-md-5 text-center shadow"
        style={{ maxWidth: '450px' }}
      >
        <div className="rounded-4 d-flex align-items-center justify-content-center mx-auto mb-4 border" style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
          <RotateCcw size={32} className="text-white-60" />
        </div>
        
        <h2 className="font-display fw-bold text-white mb-3">Reorder Favorites</h2>
        
        {!user ? (
          <>
            <p className="text-white-60 small mb-4 pb-2" style={{ lineHeight: 1.6 }}>
              Sign in to view your past orders and quickly reorder your favorite dishes.
            </p>
            <Link to="/profile" className="btn-primary w-100 justify-content-center py-3">
              Sign In to Reorder
            </Link>
          </>
        ) : (
          <>
            <p className="text-white-60 small mb-4 pb-2" style={{ lineHeight: 1.6 }}>
              You haven't placed any orders yet. Once you do, they will appear here for quick reordering!
            </p>
            <Link to="/menu" className="btn-primary w-100 justify-content-center py-3">
              Order Now <ArrowRight size={20} className="ms-2" />
            </Link>
          </>
        )}
      </motion.div>
    </main>
  );
}
