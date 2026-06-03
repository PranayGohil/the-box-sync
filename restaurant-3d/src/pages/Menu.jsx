import { useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import MenuCard from '../components/MenuCard';
import { useGSAPReveal } from '../hooks/useScroll';
import { useRestaurant } from '../context/RestaurantContext';

export default function MenuPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(searchParams.get('cat') || 'all');
  const [vegFilter, setVegFilter] = useState('all'); // 'all' | 'veg' | 'nonveg'
  const [sortBy, setSortBy] = useState('popular'); // 'popular' | 'price-asc' | 'price-desc' | 'rating'
  const [showFilters, setShowFilters] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const containerRef = useRef(null);
  const { menu, restaurantCode } = useRestaurant();

  useGSAPReveal(containerRef);

  const toggleCategory = (category) => {
    setCollapsedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

  const dynamicCategories = useMemo(() => {
    const cats = Array.from(new Set(menu.map(m => m.category)));
    const icons = ['🍕', '🍔', '🍣', '🍜', '🍲', '🍱', '🥨', '🌮'];
    return [
      { id: 'all', label: 'All', icon: '🍽️' },
      ...cats.map((c, i) => ({ 
        id: c, 
        label: c, 
        icon: icons[i % icons.length] 
      }))
    ];
  }, [menu]);

  const allItems = useMemo(() => {
    return menu.flatMap(catDoc =>
      catDoc.dishes.map(dish => {
        const catName = catDoc.category.toLowerCase();
        const dishName = dish.dish_name.toLowerCase();
        let dietType = 'veg'; // Default
        if (catName.includes('non-veg') || catName.includes('non veg') || dishName.includes('chicken') || dishName.includes('mutton') || dishName.includes('fish') || dishName.includes('prawn')) {
          dietType = 'nonveg';
        } else if (catName.includes('egg')) {
          dietType = 'egg';
        }

        const rawImg = dish.dish_img;
        const imageUrl = rawImg
          ? (rawImg.startsWith('http') || rawImg.includes('/uploads/') ? rawImg : `${API_URL.replace('/api', '')}/uploads/${rawImg.replace(/^\/+/, '')}`)
          : null;

        return {
          id: dish._id,
          name: dish.dish_name,
          price: dish.dish_price || 0,
          description: dish.description,
          image: imageUrl,
          category: catDoc.category,
          dietType,
          rating: 4.5,
          reviews: 0
        };
      })
    );
  }, [menu, API_URL]);

  const handleTab = (id) => {
    setActiveTab(id);
    setSearchParams(id !== 'all' ? { cat: id } : {});
  };

  const filtered = useMemo(() => {
    let items = allItems;

    // Category
    if (activeTab !== 'all') items = items.filter(i => i.category === activeTab);

    // Diet
    if (vegFilter === 'veg') items = items.filter(i => i.dietType === 'veg');
    if (vegFilter === 'nonveg') items = items.filter(i => i.dietType === 'nonveg');
    if (vegFilter === 'egg') items = items.filter(i => i.dietType === 'egg');

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(i =>
        i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case 'price-asc': return [...items].sort((a, b) => a.price - b.price);
      case 'price-desc': return [...items].sort((a, b) => b.price - a.price);
      case 'rating': return [...items].sort((a, b) => b.rating - a.rating);
      default: return [...items].sort((a, b) => b.reviews - a.reviews);
    }
  }, [activeTab, vegFilter, search, sortBy, allItems]);

  return (
    <main ref={containerRef} className="min-vh-100 overflow-hidden" style={{ paddingTop: '8rem', paddingBottom: '6rem' }}>
      {/* Page Header */}
      <div data-reveal="bottom" className="container-lg mb-5 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="section-subtitle mb-2">Explore Our</p>
          <h1 className="section-title text-white">
            Full <span className="text-gradient">Menu</span>
          </h1>
          <p className="text-white-60 mt-3 mx-auto" style={{ maxWidth: '36rem' }}>
            Every dish is crafted to perfection. Filter, search, and discover your next favourite.
          </p>
        </motion.div>
      </div>

      <div className="container-lg">
        {/* Search + Filter Toggle */}
        <div data-reveal="bottom" data-delay="0.1" className="d-flex gap-3 mb-4">
          <div className="flex-grow-1 position-relative">
            <Search className="position-absolute text-white-60" size={16} style={{ top: '50%', left: '1rem', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              id="menu-search"
              placeholder="Search dishes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field w-100"
              style={{ paddingLeft: '2.5rem' }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="position-absolute btn p-0 text-white-60 border-0" style={{ top: '50%', right: '1rem', transform: 'translateY(-50%)' }}>
                <X size={16} className="text-white-60" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`btn glass d-flex align-items-center gap-2 px-3 py-2 ${showFilters ? 'text-brand-400 border-brand-400' : 'text-white-60'}`}
          >
            <SlidersHorizontal size={16} />
            <span className="d-none d-sm-inline">Filters</span>
          </button>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="glass rounded-4 p-4 d-flex flex-column flex-sm-row gap-4">
                {/* Diet */}
                <div>
                  <label className="small text-white-60 text-uppercase d-block mb-2" style={{ letterSpacing: '0.05em' }}>Diet</label>
                  <div className="d-flex gap-2">
                    {[['all', 'All'], ['veg', 'Veg'], ['nonveg', 'Non-Veg'], ['egg', 'Egg']].map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setVegFilter(val)}
                        className={`btn rounded-pill px-3 py-1 small ${vegFilter === val ? 'bg-brand-500 text-white border-0' : 'glass text-white-60 border-0'}`}
                        style={{ fontSize: '14px' }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <label className="small text-white-60 text-uppercase d-block mb-2" style={{ letterSpacing: '0.05em' }}>Sort By</label>
                  <div className="d-flex gap-2 flex-wrap">
                    {[
                      ['popular', 'Most Popular'],
                      ['rating', 'Highest Rated'],
                      ['price-asc', 'Price: Low–High'],
                      ['price-desc', 'Price: High–Low'],
                    ].map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setSortBy(val)}
                        className={`btn rounded-pill px-3 py-1 small ${sortBy === val ? 'bg-brand-500 text-white border-0' : 'glass text-white-60 border-0'}`}
                        style={{ fontSize: '14px' }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Selector (Inline Grid) */}
        <div data-reveal="bottom" data-delay="0.2" className="mb-5">
          <div className="row g-3 justify-content-center">
            {dynamicCategories.map((cat) => (
              <div key={cat.id} className="col-6 col-sm-4 col-md-3 col-lg-2">
                <button
                  onClick={() => handleTab(cat.id)}
                  className={`btn w-100 h-100 d-flex align-items-center justify-content-center py-3 px-2 rounded-4 border-0 transition-all text-wrap ${
                    activeTab === cat.id
                      ? 'bg-brand-500 text-white shadow-lg'
                      : 'glass text-white-60 hover:bg-white-10'
                  }`}
                  style={{
                    background: activeTab === cat.id ? 'var(--brand)' : 'rgba(255, 255, 255, 0.05)',
                    boxShadow: activeTab === cat.id ? '0 8px 24px rgba(242, 122, 26, 0.4)' : '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: activeTab === cat.id ? 'scale(1.05)' : 'scale(1)',
                    whiteSpace: 'normal',
                  }}
                >
                  <span className="fw-semibold text-center small w-100" style={{ letterSpacing: '0.02em', whiteSpace: 'normal', wordBreak: 'break-word' }}>{cat.label}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div data-reveal="bottom" data-delay="0.3" className="mb-4">
          <p className="text-white-60 small mb-0">
            {filtered.length} dish{filtered.length !== 1 ? 'es' : ''} found
          </p>
        </div>

        {/* Grid */}
        <AnimatePresence mode="wait">
          {filtered.length > 0 ? (
            <motion.div
              key={`${activeTab}-${vegFilter}-${sortBy}-${search}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="d-flex flex-column gap-5"
            >
              {Object.entries(
                filtered.reduce((acc, item) => {
                  if (!acc[item.category]) acc[item.category] = [];
                  acc[item.category].push(item);
                  return acc;
                }, {})
              ).map(([category, items]) => (
                <div key={category}>
                  <h3 
                    className="text-white fw-bold mb-4 border-bottom border-secondary pb-2 d-flex justify-content-between align-items-center" 
                    style={{ borderColor: 'rgba(255,255,255,0.1)', cursor: 'pointer' }}
                    onClick={() => toggleCategory(category)}
                  >
                    <span>{category}</span>
                    <ChevronDown 
                      size={20}
                      className={`text-white-60 transition-transform`}
                      style={{ transition: 'transform 0.3s ease', transform: collapsedCategories[category] ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                  </h3>
                  <AnimatePresence initial={false}>
                    {!collapsedCategories[category] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="row g-4 pb-2">
                          {items.map((item, i) => (
                            <div key={item.id} className="col-6 col-md-4 col-lg-3">
                              <MenuCard item={item} index={i} />
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="d-flex flex-column align-items-center justify-content-center text-center"
              style={{ padding: '6rem 0' }}
            >
              <span className="mb-3" style={{ fontSize: '4rem' }}>🍽️</span>
              <h4 className="fw-semibold text-white mb-2">No dishes found</h4>
              <p className="text-white-60 mb-4">Try adjusting your search or filters.</p>
              <button
                onClick={() => { setSearch(''); setActiveTab('all'); setVegFilter('all'); }}
                className="btn-ghost"
              >
                Clear Filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
