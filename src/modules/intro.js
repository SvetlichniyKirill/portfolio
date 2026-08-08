import { gsap } from '../lib/gsap.js';
import { splitChars } from '../lib/split.js';
import { reducedMotion } from '../lib/env.js';

export function prepareIntro() {
  const title = document.querySelector('.hero__title');
  const fades = document.querySelectorAll('[data-intro="fade"]');

  if (reducedMotion || !title) return () => {};

  const chars = splitChars(title);
  gsap.set(chars, { yPercent: 150 });
  gsap.set(fades, { autoAlpha: 0, y: 18 });

  // не запускаем сразу: время выбирает прелоадер, чтобы совпало с занавесом
  return () =>
    gsap.timeline()
      .to(chars, {
        yPercent: 0,
        duration: 1,
        ease: 'expo.out',
        stagger: { each: 0.018, from: 'start' },
      })
      .to(fades, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.1 }, '-=0.7');
}
