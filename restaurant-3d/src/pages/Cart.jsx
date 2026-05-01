import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/AppContext';
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
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      className="d-flex flex-column flex-sm-row gap-3 glass rounded-4 p-3 align-items-sm-center mb-3 position-relative"
    >
      {/* Image and Info */}
      <div className="d-flex gap-3 align-items-center flex-grow-1 min-w-0">
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          className="rounded-3 object-fit-cover flex-shrink-0 shadow-sm"
          style={{ width: '80px', height: '80px' }}
        />
        <div className="min-w-0 flex-grow-1">
          <h6 className="fw-semibold text-white text-truncate mb-0" style={{ fontSize: '1rem' }}>{item.name}</h6>
          <p className="text-white-60 small mb-0">${item.price.toFixed(2)} each</p>
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-between justify-content-sm-end gap-3 gap-md-4 mt-2 mt-sm-0">
        {/* Qty Controls */}
        <div className="d-flex align-items-center gap-2 glass rounded-pill p-1">
          <button
            onClick={() => updateQty(item.id, item.qty - 1)}
            className="rounded-circle d-flex align-items-center justify-content-center border-0 text-white transition-all hover:bg-white-10"
            style={{ width: '28px', height: '28px', background: 'transparent' }}
            aria-label="Decrease quantity"
          >
            <Minus size={12} />
          </button>
          <span className="text-center fw-bold text-white small" style={{ width: '24px' }}>{item.qty}</span>
          <button
            onClick={() => updateQty(item.id, item.qty + 1)}
            className="rounded-circle d-flex align-items-center justify-content-center border-0 text-white transition-all hover:bg-white-10"
            style={{ width: '28px', height: '28px', background: 'transparent' }}
            aria-label="Increase quantity"
          >
            <Plus size={12} />
          </button>
        </div>

        {/* Line total */}
        <div className="text-end" style={{ minWidth: '5.5rem' }}>
          <div className="price-tag fs-5 mb-0">${(item.price * item.qty).toFixed(2)}</div>
        </div>

        {/* Remove */}
        <button
          onClick={handleRemove}
          className="btn rounded-circle d-flex align-items-center justify-content-center border-0 text-white-60 hover:text-danger transition-colors p-0 ms-2"
          style={{ width: '32px', height: '32px' }}
          aria-label="Remove item"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </motion.div>
  );
}

export default function Cart() {
  const { items, subtotal, tax, delivery, total, clearCart } = useCart();
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
            <ShoppingCart size={48} className="text-white-60" style={{ opacity: 0.5 }} />
          </div>
          <h3 className="fw-semibold text-white mb-3">Your cart is empty</h3>
          <p className="text-white-60 mb-5">Add some delicious dishes from our menu to get started.</p>
          <Link to={`/${restaurantCode}/menu`.replace(/\/+/g, '/')} className="btn-primary d-inline-flex">
            Browse Menu <ArrowRight size={20} />
          </Link>
        </motion.div>
      </main>
    );
  }

  return (
    <main ref={containerRef} className="min-vh-100 overflow-hidden" style={{ paddingTop: '8rem', paddingBottom: '6rem' }}>
      <div className="container-lg">
        {/* Header */}
        <div data-reveal="bottom" className="d-flex align-items-center justify-content-between mb-5">
          <div>
            <p className="section-subtitle mb-1">Review Your</p>
            <h1 className="font-display fw-bold text-white fs-1">
              Your <span className="text-gradient">Cart</span>
            </h1>
          </div>
          <button
            onClick={clearCart}
            className="btn text-danger d-flex align-items-center gap-2 border-0 p-0"
            style={{ fontSize: '14px' }}
          >
            <Trash2 size={16} /> Clear All
          </button>
        </div>

        <div className="row g-4 g-lg-5">
          {/* Items */}
          <div data-reveal="left" className="col-12 col-lg-8">
            <AnimatePresence mode="popLayout">
              {items.map(item => <CartItem key={item.id} item={item} />)}
            </AnimatePresence>
          </div>

          {/* Summary */}
          <div data-reveal="right" className="col-12 col-lg-4">
            <div className="glass rounded-4 p-4 position-sticky" style={{ top: '7rem' }}>
              <h5 className="fw-semibold text-white mb-4 d-flex align-items-center gap-2">
                <ShoppingBag size={20} className="text-brand-400" />
                Order Summary
              </h5>

              <div className="d-flex flex-column gap-3 mb-4">
                <div className="d-flex justify-content-between small">
                  <span className="text-white-60">Subtotal</span>
                  <span className="text-white">${subtotal.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between small">
                  <span className="text-white-60">Delivery</span>
                  <span className={delivery === 0 ? 'text-success' : 'text-white'}>
                    {delivery === 0 ? 'FREE' : `$${delivery.toFixed(2)}`}
                  </span>
                </div>
                <div className="d-flex justify-content-between small">
                  <span className="text-white-60">Tax (10%)</span>
                  <span className="text-white">${tax.toFixed(2)}</span>
                </div>
                {delivery === 0 && (
                  <p className="small text-success glass rounded-3 p-2 text-center mb-0 mt-2">
                    🎉 Free delivery on orders over $50!
                  </p>
                )}
              </div>

              <div className="border-top pt-3 mb-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-semibold text-white">Total</span>
                  <span className="price-tag fs-3">${total.toFixed(2)}</span>
                </div>
              </div>

              <Link to={`/${restaurantCode}/checkout`.replace(/\/+/g, '/')} className="btn-primary w-100 justify-content-center mb-3">
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
