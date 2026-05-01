import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Award, Heart, Leaf, Users, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TEAM_MEMBERS, STATS } from '../data/restaurantData';
import { useGSAPReveal } from '../hooks/useScroll';
import { useRestaurant } from '../context/RestaurantContext';

/* ─── Parallax image strip ─── */
function ParallaxImage({ src, alt }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-10%', '10%']);

  return (
    <div ref={ref} className="position-relative overflow-hidden rounded-4 h-100">
      <motion.img
        style={{ y, transform: 'scale(1.1)' }}
        src={src}
        alt={alt}
        loading="lazy"
        className="w-100 h-100 object-fit-cover"
      />
    </div>
  );
}

/* ─── Values ─── */
const VALUES = [
  { Icon: Heart,  title: 'Passion',       desc: 'Every dish is an expression of love for the craft.'         },
  { Icon: Award,  title: 'Excellence',    desc: 'Uncompromising quality from farm to table.'                 },
  { Icon: Leaf,   title: 'Sustainability',desc: 'Locally sourced, seasonally driven, planet-conscious.'      },
  { Icon: Users,  title: 'Community',     desc: 'Celebrating food as a universal language of togetherness.'  },
];

export default function About() {
  const containerRef = useRef(null);
  useGSAPReveal(containerRef);
  const { restaurantCode, settings } = useRestaurant();

  const aboutTitle = settings?.about_title || 'Born From a Passion for Perfect Food';
  const titleWords = aboutTitle.split(' ');
  const lastTitleWord = titleWords.length > 1 ? titleWords.pop() : '';
  const firstTitlePart = titleWords.join(' ');

  return (
    <main ref={containerRef} className="min-vh-100 overflow-hidden" style={{ paddingTop: '8rem', paddingBottom: '6rem' }}>
      {/* Hero */}
      <section className="container-lg mb-5" style={{ paddingBottom: '6rem' }}>
        <div className="row g-5 align-items-center">
          <div className="col-12 col-md-6" data-reveal="left">
            <p className="section-subtitle mb-3">Our Story</p>
            <h1 className="section-title text-white mb-4">
              {firstTitlePart} <span className="text-gradient">{lastTitleWord}</span>
            </h1>
            {settings?.about_details ? (
              settings.about_details.split('\n').map((para, idx) => (
                <p key={idx} className="text-white-60 mb-3" style={{ lineHeight: 1.8 }}>
                  {para}
                </p>
              ))
            ) : (
              <>
                <p className="text-white-60 mb-3" style={{ lineHeight: 1.8 }}>
                  In 2012, Chef Antoine Moreau left his three-Michelin-star kitchen in Paris with a single
                  dream: to create a restaurant where extraordinary food meets genuine warmth. Ember &amp; Gold
                  was born on the idea that fine dining should be accessible, joyful, and above all — delicious.
                </p>
                <p className="text-white-60 mb-5" style={{ lineHeight: 1.8 }}>
                  Today, nestled in the heart of London, our kitchen is a creative laboratory where tradition
                  meets innovation. Each dish tells a story, each ingredient earns its place, and each guest
                  is treated as family.
                </p>
              </>
            )}
            <Link to={`/${restaurantCode || ''}/menu`.replace(/\/+/g, '/')} className="btn-primary d-inline-flex mt-4">
              Explore Our Menu <ChevronRight size={20} />
            </Link>
          </div>

          <div className="col-12 col-md-6" data-reveal="right">
            <div className="d-flex gap-3" style={{ height: '24rem' }}>
              <div className="flex-grow-1 w-50">
                <ParallaxImage
                  src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80"
                  alt="Restaurant interior"
                />
              </div>
              <div className="d-flex flex-column gap-3 w-50">
                <div className="flex-grow-1 h-50">
                  <ParallaxImage
                    src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80"
                    alt="Chef cooking"
                  />
                </div>
                <div className="flex-grow-1 h-50">
                  <ParallaxImage
                    src="https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=600&q=80"
                    alt="Restaurant ambience"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="bg-dark-800 py-5 mb-5" style={{ paddingBottom: '6rem' }}>
        <div className="container-lg">
          <div className="row g-4 justify-content-center" style={{ maxWidth: '900px', margin: '0 auto' }}>
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="col-6 col-md-3 text-center"
              >
                <div className="fs-1 fw-bold text-gradient mb-1">{stat.value}</div>
                <div className="text-white-60 small">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="container-lg mb-5" style={{ paddingBottom: '6rem' }}>
        <div data-reveal="bottom" className="text-center mb-5">
          <p className="section-subtitle mb-2">What Drives Us</p>
          <h2 className="section-title text-white">
            Our <span className="text-gradient">Values</span>
          </h2>
        </div>
        <div className="row g-4">
          {VALUES.map(({ Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="col-12 col-sm-6 col-lg-3"
            >
              <div className="glass rounded-4 p-4 text-center h-100 transition-all card-3d">
                <div className="mx-auto rounded-3 d-flex align-items-center justify-content-center mb-4" style={{ width: '56px', height: '56px', background: 'rgba(242, 122, 26, 0.1)', border: '1px solid rgba(242, 122, 26, 0.2)' }}>
                  <Icon size={28} className="text-brand-400" />
                </div>
                <h5 className="fw-semibold text-white mb-2">{title}</h5>
                <p className="text-white-60 small" style={{ lineHeight: 1.6 }}>{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="container-lg mb-5" style={{ paddingBottom: '6rem' }}>
        <div data-reveal="bottom" className="text-center mb-5">
          <p className="section-subtitle mb-2">Behind the Magic</p>
          <h2 className="section-title text-white">
            Meet the <span className="text-gradient">Team</span>
          </h2>
        </div>
        <div className="row g-4">
          {TEAM_MEMBERS.map((member, i) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="col-12 col-md-4"
            >
              <div className="card-3d h-100 rounded-4 overflow-hidden">
                <div className="position-relative overflow-hidden" style={{ height: '18rem' }}>
                  <img
                    src={member.image}
                    alt={member.name}
                    loading="lazy"
                    className="w-100 h-100 object-fit-cover transition-all"
                  />
                  <div className="position-absolute bottom-0 start-0 end-0" style={{ height: '50%', background: 'linear-gradient(to top, var(--dark), transparent)' }} />
                </div>
                <div className="p-4">
                  <h4 className="font-display fw-semibold text-white mb-1">{member.name}</h4>
                  <p className="text-brand-400 small fw-medium mb-3">{member.role}</p>
                  <p className="text-white-60 small" style={{ lineHeight: 1.6 }}>{member.bio}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section data-reveal="scale" className="container-lg text-center" style={{ maxWidth: '800px' }}>
        <div className="glass rounded-4 p-5">
          <h2 className="font-display fs-2 fw-bold text-white mb-3">
            Come Taste Our <span className="text-gradient">Story</span>
          </h2>
          <p className="text-white-60 mb-4">Reserve your table and let us take you on a culinary journey.</p>
          <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
            <Link to="/contact" className="btn-primary">Book a Table</Link>
            <Link to="/menu"    className="btn-ghost">View Menu</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
