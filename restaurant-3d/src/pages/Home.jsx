import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Heart, Award, Leaf, Users, ChevronRight } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import HeroScene from '../components/HeroScene';
import MenuHighlights from '../components/MenuHighlights';
import { TESTIMONIALS } from '../data/restaurantData';
import { useGSAPReveal } from '../hooks/useScroll';
import { useRestaurant } from '../context/RestaurantContext';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const containerRef = useRef(null);
  useGSAPReveal(containerRef);
  const { restaurantCode, settings, menu } = useRestaurant();
  
  // Dynamic categories from menu
  const dynamicCategories = Array.from(new Set(menu.map(item => item.category)))
    .map((cat, i) => {
      const icons = ['🍕', '🍔', '🍣', '🍜', '🍲', '🍱', '🥨', '🌮'];
      return {
        id: cat,
        label: cat,
        icon: icons[i % icons.length]
      };
    });


  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const logoUrl = settings?.logo ? `${API_URL.replace('/api', '')}/uploads/menu/${settings.logo}` : null;

  const heroTitle = settings?.hero_title || 'A Symphony of Flavours';
  const heroWords = heroTitle.split(' ');
  const lastWord = heroWords.pop();
  const titleFirstPart = heroWords.join(' ');

  return (
    <div ref={containerRef} className="overflow-hidden">
      {/* ── HERO SECTION ── */}
      <section className="position-relative w-100 min-vh-100 d-flex align-items-center justify-content-center overflow-hidden">
        {/* 3D Scene Background */}
        <div className="position-absolute top-0 bottom-0 start-0 end-0" style={{ zIndex: 0 }}>
          <HeroScene />
        </div>
        
        {/* Vignette Overlay */}
        <div className="position-absolute top-0 bottom-0 start-0 end-0 pointer-events-none opacity-75" style={{ background: 'radial-gradient(ellipse at center, transparent 0%, #060606 100%)', zIndex: 0 }} />
        <div className="position-absolute top-0 bottom-0 start-0 end-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(10,10,10,0.4), transparent, #0A0A0A)', zIndex: 0 }} />

        <div className="position-relative container-lg w-100 d-flex flex-column align-items-center text-center mt-5" style={{ zIndex: 10 }}>


          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-display fw-bold mb-4"
            style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', lineHeight: 1.1 }}
          >
            {titleFirstPart} <br/>
            <span className="text-gradient fst-italic">{lastWord}</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="fs-5 text-white-60 mb-5 fw-light"
            style={{ maxWidth: '42rem' }}
          >
            {settings?.hero_details || 'Experience extraordinary flavors where every dish tells a story. Immerse yourself in a world of taste, crafted with passion.'}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="d-flex flex-column flex-sm-row align-items-center gap-4"
          >
            <Link to={`/${restaurantCode || ''}/menu`.replace(/\/+/g, '/')} className="btn-primary" style={{ width: '100%', minWidth: '200px' }}>
              Explore Menu
            </Link>
            
            <Link to={`/${restaurantCode || ''}/reservation`.replace(/\/+/g, '/')} className="btn-ghost" style={{ width: '100%', minWidth: '200px' }}>
              Book Table
            </Link>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="position-absolute start-50 translate-middle-x d-flex flex-column align-items-center gap-2"
          style={{ bottom: '2.5rem' }}
        >
          <span className="small text-white-60 text-uppercase" style={{ letterSpacing: '0.3em', fontSize: '10px' }}>Scroll</span>
          <div className="overflow-hidden" style={{ width: '1px', height: '48px', background: 'rgba(255,255,255,0.1)' }}>
            <div className="w-100 h-50 bg-brand-500" style={{ animation: 'scrollDown 1.5s infinite' }} />
          </div>
        </motion.div>
      </section>

      {/* ── EXPLORE BY CATEGORY ── */}
      <section className="py-5 position-relative">
        <div className="container-lg py-5">
          <div className="text-center mb-5" data-reveal="bottom">
            <span className="section-subtitle text-brand-400 text-uppercase tracking-widest small fw-bold d-block mb-2">Selection</span>
            <h2 className="section-title mb-4 font-display" style={{ fontSize: '3rem' }}>Explore by <span className="text-gradient">Category</span></h2>
            <div className="mx-auto bg-brand-500 mb-2" style={{ width: '60px', height: '3px', borderRadius: '2px' }} />
          </div>
          
          <div className="row g-4 justify-content-center">
            {dynamicCategories.length > 0 ? (
              <>
                {dynamicCategories.slice(0, 5).map((cat, i) => (
                  <div key={cat.id} className="col-6 col-md-4 col-lg-2" data-reveal="bottom" data-delay={i * 0.05}>
                    <Link 
                      to={`/${restaurantCode || ''}/menu?cat=${cat.id}`.replace(/\/+/g, '/')}
                      className="glass rounded-4 p-4 d-flex flex-column align-items-center text-decoration-none transition-all hover:-translate-y-2 h-100 position-relative overflow-hidden group"
                      style={{ 
                        border: '1px solid rgba(255,255,255,0.05)',
                        background: 'rgba(255,255,255,0.02)'
                      }}
                    >
                      <div className="position-absolute top-0 start-0 w-100 h-100 opacity-0 transition-all duration-500 group-hover:opacity-10" style={{ background: 'linear-gradient(135deg, var(--brand), transparent)' }} />
                      <div className="position-absolute inset-0 border border-brand-500 opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-4" style={{ pointerEvents: 'none' }} />
                      <div className="rounded-circle d-flex align-items-center justify-content-center mb-3 transition-transform duration-500 group-hover:scale-110 shadow-sm" style={{ width: '70px', height: '70px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <span style={{ fontSize: '2.2rem' }}>{cat.icon}</span>
                      </div>
                      <h6 className="text-white fw-bold mb-1 text-center font-display small">{cat.label}</h6>
                    </Link>
                  </div>
                ))}
                <div className="col-6 col-md-4 col-lg-2" data-reveal="bottom" data-delay={5 * 0.05}>
                  <Link 
                    to={`/${restaurantCode || ''}/menu`.replace(/\/+/g, '/')}
                    className="glass rounded-4 p-4 d-flex flex-column align-items-center justify-content-center text-decoration-none transition-all hover:-translate-y-2 h-100 position-relative overflow-hidden group border-brand-500"
                    style={{ background: 'rgba(242, 122, 26, 0.05)', border: '1px dashed rgba(242, 122, 26, 0.4)' }}
                  >
                    <div className="rounded-circle d-flex align-items-center justify-content-center mb-3 transition-transform duration-500 group-hover:translate-x-1" style={{ width: '50px', height: '50px', background: 'var(--brand)' }}>
                      <ArrowRight size={24} className="text-white" />
                    </div>
                    <h6 className="text-brand-400 fw-bold mb-0 text-center font-display small">Explore More</h6>
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center w-100 py-4 opacity-50">No categories found</div>
            )}
          </div>
        </div>
      </section>

      {/* ── HIGHLIGHTS STRIP ── */}
      <div data-reveal="bottom" className="position-relative py-5" style={{ zIndex: 10 }}>
         <MenuHighlights />
      </div>

      {/* ── OUR STORY (Our Legacy) ── */}
      <section id="about" className="py-5 position-relative overflow-hidden">
        {/* Decorative background blur */}
        <div className="position-absolute top-50 start-0 translate-middle-y rounded-circle blur-3xl opacity-20" 
             style={{ width: '500px', height: '500px', background: 'radial-gradient(circle, var(--brand-500), transparent)', zIndex: 0 }} />
        
        <div className="container-lg py-5 position-relative" style={{ zIndex: 1 }}>
          <div className="row g-5 align-items-center">
            <div className="col-12 col-lg-6" data-reveal="left">
              <div className="pe-lg-5">
                <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-4" style={{ background: 'rgba(242, 122, 26, 0.1)', border: '1px solid rgba(242, 122, 26, 0.2)' }}>
                  <div className="rounded-circle bg-brand-500" style={{ width: '8px', height: '8px' }} />
                  <span className="small text-brand-400 fw-bold text-uppercase" style={{ letterSpacing: '0.1em' }}>Our Legacy</span>
                </div>
                
                <h2 className="font-display fw-bold text-white mb-4" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: 1.1 }}>
                  {settings?.about_title || 'Crafting Culinary Magic'}
                </h2>
                
                <div className="text-white-60 mb-5 fs-5 fw-light lh-lg">
                  {settings?.about_details ? (
                    settings.about_details.split('\n').map((para, idx) => (
                      <p key={idx} className="mb-3">{para}</p>
                    ))
                  ) : (
                    <>
                      <p className="mb-4">Experience extraordinary flavors meets genuine warmth. Our restaurant was born on the idea that fine dining should be accessible, joyful, and above all — delicious.</p>
                      <p>Nestled in the heart of the city, our kitchen is a creative laboratory where tradition meets innovation. Each dish tells a story, and each ingredient earns its place.</p>
                    </>
                  )}
                </div>

                <div className="row g-4 mb-5">
                  {[
                    { icon: Heart,  label: 'Made with Passion' },
                    { icon: Award,  label: 'Quality Driven' },
                    { icon: Leaf,   label: 'Fresh Ingredients' },
                    { icon: Users,  label: 'Community First' }
                  ].map((f, i) => (
                    <div key={i} className="col-6">
                      <div className="d-flex align-items-center gap-3">
                        <div className="rounded-circle glass d-flex align-items-center justify-content-center text-brand-400" style={{ width: '48px', height: '48px' }}>
                          <f.icon size={20} />
                        </div>
                        <span className="text-white fw-medium small">{f.label}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <Link to={`/${restaurantCode}/reservation`.replace(/\/+/g, '/')} className="btn-brand px-5 py-3 rounded-pill d-inline-flex align-items-center gap-2 text-decoration-none shadow-brand transition-all hover:scale-105">
                  Book Your Experience <ArrowRight size={18} />
                </Link>
              </div>
            </div>
            
            <div className="col-12 col-lg-6" data-reveal="right">
              <div className="position-relative">
                <div className="position-absolute -top-4 -right-4 w-100 h-100 border border-brand-500 opacity-20 rounded-5 d-none d-lg-block" style={{ transform: 'translate(20px, -20px)', zIndex: 0 }} />
                
                <div className="rounded-5 overflow-hidden shadow-2xl position-relative z-1" style={{ height: '550px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img 
                    src={settings?.about_image ? `${API_URL.replace('/api', '')}/uploads/menu/${settings.about_image}` : "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80"} 
                    alt="Our story" 
                    className="w-100 h-100 object-fit-cover transition-all duration-1000 hover:scale-110"
                  />
                  <div className="position-absolute bottom-0 start-0 p-4 w-100" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                    <div className="glass-strong p-4 rounded-4 d-inline-block border border-brand-500 border-opacity-30 shadow-lg">
                      <h3 className="display-4 fw-bold text-gradient mb-0">{settings?.legacy_years || '10+'}</h3>
                      <p className="text-white-60 mb-0 fw-bold text-uppercase tracking-wider small" style={{ fontSize: '10px' }}>Years of Excellence</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-5 bg-dark-800" style={{ paddingBottom: '6rem' }}>
        <div className="container-lg py-5">
          <div className="text-center mb-5" data-reveal="bottom">
            <h2 className="section-title mb-3">
              Voices of <span className="text-gradient">Delight</span>
            </h2>
          </div>
          <div className="row g-4">
            {(settings?.testimonials?.length > 0 ? settings.testimonials : TESTIMONIALS).slice(0, 3).map((t, i) => (
              <div key={t.id || i} className="col-12 col-md-4">
                <div data-reveal="bottom" data-delay={i * 0.15} className="glass p-4 rounded-4 position-relative h-100">
                  <div className="d-flex gap-1 mb-4">
                    {[...Array(t.rating || 5)].map((_, idx) => (
                      <Star key={idx} size={16} className="text-gold" style={{ fill: 'var(--gold)' }} />
                    ))}
                  </div>
                  <p className="text-white-60 fst-italic mb-4">"{t.text}"</p>
                  <div className="d-flex align-items-center gap-3">
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-brand-400"
                      style={{ width: '48px', height: '48px', background: 'rgba(242, 122, 26, 0.1)' }}
                    >
                      {t.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h6 className="fw-bold text-white mb-0">{t.name}</h6>
                      <small className="text-white-60">{t.role}</small>
                    </div>
                  </div>
                  {/* Large quote mark */}
                  <div className="position-absolute font-display pointer-events-none" style={{ top: '1rem', right: '1.5rem', fontSize: '4rem', color: 'rgba(255,255,255,0.05)', lineHeight: 1 }}>"</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
        @keyframes scrollDown {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
      `}</style>
    </div>
  );
}
