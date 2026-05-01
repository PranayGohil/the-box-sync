/**
 * Cinematic Preloader (Bootstrap version)
 */
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Flame } from 'lucide-react';

export default function Preloader({ onComplete }) {
  const rootRef    = useRef(null);
  const counterRef = useRef(null);
  const topBarRef  = useRef(null);
  const botBarRef  = useRef(null);
  const logoRef    = useRef(null);
  const tagRef     = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({ onComplete });

    // ── Count up 0 → 100
    let count = { val: 0 };
    tl.to(count, {
      val: 100,
      duration: 2,
      ease: 'power2.inOut',
      onUpdate() {
        if (counterRef.current) {
          counterRef.current.textContent = Math.round(count.val).toString().padStart(3, '0');
        }
      },
    }, 0);

    // ── Logo + tagline fade in at 50%
    tl.fromTo(
      logoRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' },
      0.8
    );
    tl.fromTo(
      tagRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
      1.1
    );

    // ── Letterbox bars slide out
    tl.to(topBarRef.current, { y: '-100%', duration: 0.8, ease: 'power4.inOut' }, 2.2);
    tl.to(botBarRef.current, { y:  '100%', duration: 0.8, ease: 'power4.inOut' }, 2.2);

    // ── Root fade out
    tl.to(rootRef.current, { opacity: 0, duration: 0.4, ease: 'power2.in' }, 2.8);

    return () => tl.kill();
  }, [onComplete]);

  return (
    <div
      ref={rootRef}
      className="position-fixed top-0 bottom-0 start-0 end-0 pointer-events-none"
      style={{ background: '#060606', zIndex: 2000 }}
    >
      {/* Top bar */}
      <div
        ref={topBarRef}
        className="position-absolute top-0 start-0 end-0 h-50"
        style={{ background: '#060606' }}
      />
      {/* Bottom bar */}
      <div
        ref={botBarRef}
        className="position-absolute bottom-0 start-0 end-0 h-50"
        style={{ background: '#060606' }}
      />

      {/* Center content */}
      <div className="position-absolute top-0 bottom-0 start-0 end-0 d-flex flex-column align-items-center justify-content-center" style={{ zIndex: 10 }}>
        {/* Brand */}
        <div ref={logoRef} className="d-flex flex-column align-items-center gap-3" style={{ opacity: 0 }}>
          <div 
            className="rounded-4 d-flex align-items-center justify-content-center shadow-lg"
            style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, var(--brand), #e05c0c)' }}
          >
            <Flame size={32} className="text-white" />
          </div>
          <h1 className="font-display fw-bold text-white tracking-tight" style={{ fontSize: '3rem' }}>
            Ember <span className="text-gradient">&amp; Gold</span>
          </h1>
        </div>
        <p ref={tagRef} className="font-accent text-white-60 fst-italic fs-5 mt-2" style={{ opacity: 0 }}>
          Fine Dining · Reimagined
        </p>
      </div>

      {/* Counter */}
      <div className="position-absolute" style={{ bottom: '2.5rem', right: '3rem', zIndex: 10 }}>
        <span ref={counterRef} className="font-monospace fw-bold lh-1" style={{ fontSize: '4.5rem', color: 'rgba(255,255,255,0.08)' }}>000</span>
      </div>

      {/* Progress line */}
      <div className="position-absolute bottom-0 start-0 end-0" style={{ height: '2px', zIndex: 10 }}>
        <div
          className="h-100"
          style={{ 
            background: 'linear-gradient(to right, #e05c0c, #f59e42, #D4AF37)',
            transformOrigin: 'left',
            animation: 'progressLine 2s ease-in-out forwards' 
          }}
        />
      </div>

      <style>{`
        @keyframes progressLine {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        .pointer-events-none { pointer-events: none; }
      `}</style>
    </div>
  );
}
