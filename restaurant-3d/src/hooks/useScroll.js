/**
 * useLenis — Initializes Lenis smooth scroll and integrates it with GSAP ScrollTrigger.
 * Returns the lenis instance for use in components.
 */
import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useLenis() {
  const lenisRef = useRef(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      smoothTouch: false,
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;

    // Feed lenis into GSAP ticker for seamless integration
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove((time) => lenis.raf(time * 1000));
    };
  }, []);

  return lenisRef;
}

/**
 * useGSAPReveal — Connects a ref container to a GSAP ScrollTrigger reveal.
 * Elements inside with data-reveal="true" animate in on scroll.
 */
export function useGSAPReveal(containerRef, options = {}) {
  useEffect(() => {
    if (!containerRef.current) return;

    const elements = containerRef.current.querySelectorAll('[data-reveal]');
    if (!elements.length) return;

    const ctx = gsap.context(() => {
      elements.forEach((el) => {
        const from = el.dataset.reveal || 'bottom';
        const delay = parseFloat(el.dataset.delay || '0');

        const fromVars = {
          opacity: 0,
          duration: options.duration || 1,
          ease: options.ease || 'power3.out',
          delay,
          ...(from === 'bottom' && { y: 80 }),
          ...(from === 'left'   && { x: -80 }),
          ...(from === 'right'  && { x: 80  }),
          ...(from === 'scale'  && { scale: 0.85 }),
          ...(from === 'clip'   && { clipPath: 'inset(100% 0 0 0)' }),
        };

        gsap.from(el, {
          ...fromVars,
          scrollTrigger: {
            trigger: el,
            start: options.start || 'top 88%',
            toggleActions: 'play none none none',
          },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, [containerRef, options]);
}
