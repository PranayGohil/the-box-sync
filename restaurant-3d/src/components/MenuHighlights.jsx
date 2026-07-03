import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight, Star, ShoppingCart, UtensilsCrossed } from 'lucide-react';
import { useCart } from '../context/AppContext';
import { useRestaurant } from '../context/RestaurantContext';
import toast from 'react-hot-toast';

export default function MenuHighlights() {
  const containerRef = useRef(null);
  const { addItem } = useCart();
  const { dishes, restaurantCode } = useRestaurant();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const allFeatured = dishes.flatMap(group => group.dishes);

  const handleAdd = (item) => {
    const rawImg = item.dish_img;
    const finalImg = rawImg 
      ? (rawImg.startsWith('http') || rawImg.includes('/uploads/') ? rawImg : `${API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL}/uploads/${rawImg.replace(/^\/+/, '')}`) 
      : null;

    const cartItem = {
      id: item._id,
      name: item.dish_name,
      price: item.dish_price,
      image: finalImg
    };
    addItem(cartItem);
    toast.success(`${item.name} added!`, {
      icon: '🛒',
      style: { background: '#1A1A1A', color: '#fff', border: '1px solid rgba(242,122,26,0.3)', borderRadius: '12px' },
    });
  };

  return (
    <section className="py-5">
      <div className="container-lg">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h2 className="font-display fs-3 fw-bold text-white mb-0">
            🔥 Today's <span className="text-gradient">Highlights</span>
          </h2>
          <Link to={`/${restaurantCode || ''}/menu`.replace(/\/+/g, '/')} className="d-flex align-items-center gap-1 small text-brand-400 text-decoration-none transition-colors hover:text-brand-300">
            See All <ChevronRight size={16} />
          </Link>
        </div>

        {allFeatured.length === 0 && (
          <p className="text-white-60">No featured dishes available.</p>
        )}

        <div
          ref={containerRef}
          className="d-flex gap-4 overflow-auto scrollbar-hide pb-3"
        >
          {allFeatured.map((item, i) => {
            const rawImg = item.dish_img;
            const imageUrl = rawImg 
              ? (rawImg.startsWith('http') || rawImg.includes('/uploads/') ? rawImg : `${API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL}/uploads/${rawImg.replace(/^\/+/, '')}`) 
              : null;
            return (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex-shrink-0 glass rounded-4 overflow-hidden position-relative transition-all"
                style={{ width: '260px' }}
              >
                <div className="position-relative overflow-hidden" style={{ height: '160px' }}>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={item.dish_name}
                      loading="lazy"
                      className="w-100 h-100 object-fit-cover transition-all"
                      style={{ transition: 'transform 0.5s' }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    />
                  ) : (
                    <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-dark-900">
                      <div className="position-absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle, var(--brand-500), transparent)' }} />
                      <UtensilsCrossed size={32} className="text-brand-400 opacity-50" />
                    </div>
                  )}
                  <div className="position-absolute bottom-0 start-0 end-0" style={{ height: '100%', background: 'linear-gradient(to top, rgba(10,10,10,0.7), transparent)' }} />
                  {item.meal_type && (
                    <span className="position-absolute badge bg-brand-500 text-white" style={{ top: '8px', left: '8px' }}>{item.meal_type}</span>
                  )}
                </div>

                <div className="p-3">
                  <h6 className="fw-semibold text-white mb-1 text-truncate">{item.dish_name}</h6>
                  <p className="text-white-60 mb-3" style={{ fontSize: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.description || 'A delightful treat.'}
                  </p>
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="text-brand-400 fw-bold">₹{item.dish_price?.toFixed(0)}</span>
                    <button
                      onClick={() => handleAdd(item)}
                      className="btn bg-brand-500 text-white rounded-pill px-3 py-1 fw-bold d-flex align-items-center gap-1 shadow-brand transition-all hover:scale-105"
                      style={{ fontSize: '12px' }}
                    >
                      <ShoppingCart size={14} /> Add
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
