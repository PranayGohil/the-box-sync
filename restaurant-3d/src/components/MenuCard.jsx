import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Clock, Flame, Leaf, UtensilsCrossed, Heart } from 'lucide-react';
import { useCart, useAuth } from '../context/AppContext';
import toast from 'react-hot-toast';

const DietIndicator = ({ type }) => {
  const color = type === 'veg' ? '#22c55e' : type === 'egg' ? '#eab308' : '#ef4444';
  return (
    <div
      className="d-flex align-items-center justify-content-center border border-2 rounded-1"
      style={{ width: '18px', height: '18px', borderColor: color, padding: '2px' }}
    >
      <div className="rounded-circle w-100 h-100" style={{ background: color }} />
    </div>
  );
};

export default function MenuCard({ item, index = 0 }) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const { addItem, items } = useCart();
  const { user } = useAuth();
  const inCart = items.some(i => i.id === item.id);

  const [isSaved, setIsSaved] = useState(() => {
    if (!user?._id) return false;
    const saved = localStorage.getItem(`ember-saved-${user._id}`);
    if (!saved) return false;
    try {
      const ids = JSON.parse(saved);
      return ids.includes(item.id);
    } catch {
      return false;
    }
  });

  const imageUrl = item.image
    ? (item.image.startsWith('http') || item.image.includes('/uploads/') ? item.image : `/uploads/${item.image.replace(/^\/+/, '')}`)
    : null;

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const { left, top, width, height } = card.getBoundingClientRect();
    const x = ((e.clientX - left) / width - 0.5) * 15;
    const y = ((e.clientY - top) / height - 0.5) * -15;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setHovered(false);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    addItem(item);
    toast.success(`${item.name} added!`, {
      icon: '🛒',
      style: { background: '#1A1A1A', color: '#fff', border: '1px solid rgba(242,122,26,0.3)', borderRadius: '12px' },
    });
  };

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user?._id) {
      toast.error('Please login to save items', {
        style: { background: '#1A1A1A', color: '#fff', border: '1px solid rgba(242,122,26,0.3)', borderRadius: '12px' }
      });
      return;
    }

    const key = `ember-saved-${user._id}`;
    let savedList = [];
    try {
      const saved = localStorage.getItem(key);
      savedList = saved ? JSON.parse(saved) : [];
    } catch (err) { }

    let newSaved;
    if (savedList.includes(item.id)) {
      newSaved = savedList.filter(id => id !== item.id);
      setIsSaved(false);
      toast.success(`${item.name} removed from saved items`, {
        icon: '💔',
        style: { background: '#1A1A1A', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }
      });
    } else {
      newSaved = [...savedList, item.id];
      setIsSaved(true);
      toast.success(`${item.name} saved!`, {
        icon: '❤️',
        style: { background: '#1A1A1A', color: '#fff', border: '1px solid rgba(242,122,26,0.3)', borderRadius: '12px' }
      });
    }
    localStorage.setItem(key, JSON.stringify(newSaved));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
        transition: hovered ? 'transform 0.1s ease' : 'transform 0.5s ease',
      }}
      className="card-3d position-relative h-100 glass rounded-4 overflow-hidden border-0"
    >
      {/* Image */}
      <div className="position-relative overflow-hidden" style={{ height: '180px' }}>
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className="w-100 h-100 object-fit-cover transition-all duration-700"
            style={{ transform: hovered ? 'scale(1.1)' : 'scale(1)' }}
          />
        ) : (
          <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-dark-900">
            <div className="position-absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle, var(--brand-500), transparent)' }} />
            <div className="rounded-circle glass-strong d-flex align-items-center justify-content-center shadow-lg" style={{ width: '60px', height: '60px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <UtensilsCrossed size={32} className="text-brand-400" />
            </div>
          </div>
        )}
        {/* Diet Indicator */}
        <div className="position-absolute glass rounded-2 p-1 px-2 d-flex align-items-center gap-2" style={{ top: '10px', left: '10px', zIndex: 2 }}>
          <DietIndicator type={item.dietType} />
          <span className="text-white fw-bold x-small text-uppercase tracking-wider" style={{ fontSize: '9px' }}>{item.dietType}</span>
        </div>

        {/* Highlight Icon (Heart Toggle) */}
        <button
          onClick={handleFavoriteClick}
          className="position-absolute rounded-circle d-flex align-items-center justify-content-center shadow-lg border-0"
          style={{
            top: '10px',
            right: '10px',
            width: '28px',
            height: '28px',
            zIndex: 2,
            background: isSaved ? '#ef4444' : 'rgba(0,0,0,0.5)',
            color: '#fff',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.2s ease'
          }}
          title="Save Item"
        >
          <Heart size={14} style={{ fill: isSaved ? '#fff' : 'none' }} />
        </button>

        {/* Rating Overlay */}
        <div className="position-absolute d-flex align-items-center gap-1 glass rounded-pill px-2 py-1" style={{ bottom: '10px', right: '10px', zIndex: 2 }}>
          <Star size={10} className="text-gold" style={{ fill: 'var(--gold)' }} />
          <span className="text-white fw-bold" style={{ fontSize: '11px' }}>{item.rating}</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 d-flex flex-column flex-grow-1">
        <h6 className="fw-bold text-white mb-2 text-truncate" title={item.name}>
          {item.name}
        </h6>

        <p className="text-white-60 x-small mb-3" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '30px' }}>
          {item.description}
        </p>

        {/* Price + Add */}
        <div className="d-flex align-items-center justify-content-between mt-auto pt-2 border-top border-white-10">
          <span className="text-brand-400 fw-bold fs-5">₹{item.price.toFixed(0)}</span>
          <button
            onClick={handleAdd}
            className={`btn d-flex align-items-center gap-2 px-3 py-1 fw-bold rounded-pill transition-all ${inCart ? 'bg-brand-500 bg-opacity-20 text-brand-400 border border-brand-500' : 'bg-brand-500 text-white shadow-brand hover:scale-105'
              }`}
            style={{ fontSize: '13px' }}
          >
            <ShoppingCart size={14} />
            {inCart ? 'Added' : 'Add'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
