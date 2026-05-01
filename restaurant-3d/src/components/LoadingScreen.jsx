import { motion, AnimatePresence } from 'framer-motion';
import { Flame } from 'lucide-react';

/** Full-screen cinematic loading screen shown on first visit */
export default function LoadingScreen({ onComplete }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        className="fixed inset-0 z-[100] bg-dark-900 flex flex-col items-center justify-center"
      >
        {/* Background glow */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-brand-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          {/* Animated logo mark */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-brand-lg mb-6 animate-glow"
          >
            <Flame className="w-10 h-10 text-white" />
          </motion.div>

          {/* Brand name */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-center mb-10"
          >
            <h1 className="font-display text-5xl font-bold text-white">
              Ember <span className="text-gradient">&amp; Gold</span>
            </h1>
            <p className="font-accent text-white/50 italic mt-2 text-lg">Fine Dining · Reimagined</p>
          </motion.div>

          {/* Progress bar */}
          <motion.div
            className="w-48 h-0.5 bg-white/10 rounded-full overflow-hidden"
          >
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.8, ease: 'easeInOut' }}
              onAnimationComplete={onComplete}
              className="h-full bg-gradient-to-r from-brand-500 to-gold rounded-full"
            />
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
