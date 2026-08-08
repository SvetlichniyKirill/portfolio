import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '../lib/gsap.js';
import { reducedMotion } from '../lib/env.js';

export const scrollState = { velocity: 0, direction: 1, progress: 0 };

let lenis = null;

export function initSmoothScroll() {
  if (reducedMotion) {
    window.addEventListener('scroll', () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollState.progress = max > 0 ? window.scrollY / max : 0;
    }, { passive: true });
    return null;
  }

  lenis = new Lenis({
    duration: 1.05,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.6,
  });

  lenis.on('scroll', (e) => {
    scrollState.velocity = e.velocity ?? 0;
    if (e.direction) scrollState.direction = e.direction;
    scrollState.progress = e.progress ?? 0;
    ScrollTrigger.update();
  });

  // общий тикер, иначе ScrollTrigger дёргается на кадр
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
    // в покое scroll не приходит и velocity зависает, гасим руками
    scrollState.velocity *= 0.9;
    if (Math.abs(scrollState.velocity) < 0.001) scrollState.velocity = 0;
  });
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

export function stopScroll() {
  lenis ? lenis.stop() : document.body.classList.add('is-loading');
}

export function startScroll() {
  lenis?.start();
}

export function initAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(target, { duration: 1.5, offset: 0 });
      } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}
