import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ShoppingCart, UtensilsCrossed } from 'lucide-react';
import { useCart, useAuth } from '../context/AppContext';
import { useRestaurant } from '../context/RestaurantContext';
import { useGSAPReveal } from '../hooks/useScroll';
import { useRef } from 'react';
import toast from 'react-hot-toast';

function CartItem({ item }) {
  const { updateQty, removeItem } = useCart();

  const handleRemove = () => {
    removeItem(item.id);
    toast.success(`${item.name} removed`, {
      icon: '🗑️',
      style: { background: '#1A1A1A', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      className="w-100 d-flex flex-column flex-sm-row gap-3 glass rounded-4 p-3 align-items-sm-center mb-3 position-relative"
      style={{ width: '100%' }}
    >
      {/* Image and Info */}
      <div className="d-flex gap-3 align-items-center flex-grow-1 min-w-0">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className="rounded-3 object-fit-cover flex-shrink-0 shadow-sm"
            style={{ width: '80px', height: '80px' }}
          />
        ) : (
          <div className="rounded-3 d-flex align-items-center justify-content-center bg-dark-900 flex-shrink-0 shadow-sm position-relative overflow-hidden" style={{ width: '80px', height: '80px' }}>
            <div className="position-absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle, var(--brand-500), transparent)' }} />
            <div className="rounded-circle glass-strong d-flex align-items-center justify-content-center shadow-lg" style={{ width: '40px', height: '40px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <UtensilsCrossed size={18} className="text-brand-400" />
            </div>
          </div>
        )}
        <div className="min-w-0 flex-grow-1 d-flex flex-column gap-2">
          <div>
            <h6 className="fw-semibold text-white text-truncate mb-0" style={{ fontSize: '1rem' }}>{item.name}</h6>
            <p className="text-white-60 small mb-0">₹{item.price.toFixed(2)} each</p>
          </div>

          <div className="d-flex align-items-center gap-2 mt-1">
            {/* Qty Controls */}
            <div className="d-flex align-items-center gap-2 glass rounded-pill p-1 flex-shrink-0" style={{ width: '110px' }}>
              <button
                onClick={() => updateQty(item.id, item.qty - 1)}
                className="rounded-circle d-flex align-items-center justify-content-center border-0 text-white transition-all hover:bg-white-10"
                style={{ width: '24px', height: '24px', background: 'transparent' }}
                aria-label="Decrease quantity"
              >
                <Minus size={10} />
              </button>
              <span className="text-center fw-bold text-white small" style={{ width: '38px' }}>{item.qty}</span>
              <button
                onClick={() => updateQty(item.id, item.qty + 1)}
                className="rounded-circle d-flex align-items-center justify-content-center border-0 text-white transition-all hover:bg-white-10"
                style={{ width: '24px', height: '24px', background: 'transparent' }}
                aria-label="Increase quantity"
              >
                <Plus size={10} />
              </button>
            </div>

            {/* Remove Button */}
            <button
              onClick={handleRemove}
              className="btn rounded-circle d-flex align-items-center justify-content-center border-0 text-white-60 hover:text-danger hover:bg-danger hover:bg-opacity-10 transition-colors p-0 flex-shrink-0"
              style={{ width: '32px', height: '32px' }}
              aria-label="Remove item"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Line total */}
      <div className="text-end ms-sm-auto flex-shrink-0" style={{ width: '100px' }}>
        <div className="price-tag fs-5 mb-0 fw-semibold">₹{(item.price * item.qty).toFixed(2)}</div>
      </div>
    </motion.div>
  );
}

export default function Cart() {
  const { items, subtotal, tax, delivery, total, totalTaxRatePercent = 0, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { restaurantCode } = useRestaurant();
  const containerRef = useRef(null);
  useGSAPReveal(containerRef);

  if (items.length === 0) {
    return (
      <main className="min-vh-100 d-flex align-items-center justify-content-center px-3" style={{ paddingTop: '8rem', paddingBottom: '6rem' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
          style={{ maxWidth: '400px' }}
        >
          <div className="rounded-circle glass d-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: '96px', height: '96px' }}>
            <ShoppingBag size={48} className="text-brand-400" />
          </div>
          <h2 className="text-white fw-bold mb-3">Cart is Empty</h2>
          <p className="text-white-60 mb-4">Add some of our delicious dishes to get started.</p>
          <Link to={`/${restaurantCode}/menu`.replace(/\/+/g, '/')} className="btn-primary w-100 justify-content-center">
            Go to Menu <ArrowRight size={20} className="ms-2" />
          </Link>
        </motion.div>
      </main>
    );
  }

  return (
    <main ref={containerRef} className="min-vh-100 overflow-hidden" style={{ paddingTop: '8rem', paddingBottom: '6rem' }}>
      <div className="container-lg" style={{ maxWidth: '960px' }}>
        <div data-reveal="bottom" className="mb-5">
          <p className="section-subtitle mb-1">Your Selection</p>
          <h1 className="font-display fw-bold text-white fs-1">
            Shopping <span className="text-gradient">Cart</span>
          </h1>
        </div>

        <div className="row g-5">
          {/* Left */}
          <div className="col-12 col-lg-7">
            <div data-reveal="left" data-delay="0.1" className="d-flex flex-column gap-3 w-100">
              <AnimatePresence mode="popLayout">
                {items.map(item => (
                  <CartItem key={item.id} item={item} />
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Right */}
          <div className="col-12 col-lg-5">
            <div data-reveal="right" data-delay="0.2" className="glass rounded-4 p-4 position-sticky" style={{ top: '8rem' }}>
              <h5 className="fw-semibold text-white mb-4">Summary</h5>

              <div className="d-flex flex-column gap-3 pb-3 mb-3">
                <div className="d-flex justify-content-between small">
                  <span className="text-white-60">Subtotal</span>
                  <span className="text-white">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between small">
                  <span className="text-white-60">Delivery</span>
                  <span className="text-white text-brand-400">Calculated at checkout</span>
                </div>
                <div className="d-flex justify-content-between small">
                  <span className="text-white-60">Tax ({totalTaxRatePercent}%)</span>
                  <span className="text-white">₹{tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-top pt-3 mb-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-semibold text-white">Total (excl. delivery)</span>
                  <span className="price-tag fs-3">₹{(subtotal + tax).toFixed(2)}</span>
                </div>
              </div>

              <Link
                to={`/${restaurantCode}/checkout`.replace(/\/+/g, '/')}
                onClick={(e) => {
                  if (!user) {
                    e.preventDefault();
                    toast.error('Please sign in to place an order.', {
                      style: { background: '#1A1A1A', color: '#fff', border: '1px solid rgba(242,122,26,0.3)', borderRadius: '12px' }
                    });
                    navigate(`/${restaurantCode}/login`.replace(/\/+/g, '/'));
                  }
                }}
                className="btn-primary w-100 justify-content-center mb-3"
              >
                Proceed to Checkout <ArrowRight size={20} />
              </Link>
              <Link to={`/${restaurantCode}/menu`.replace(/\/+/g, '/')} className="btn-ghost w-100 justify-content-center py-2" style={{ fontSize: '14px' }}>
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
