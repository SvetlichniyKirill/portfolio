import { gsap } from '../lib/gsap.js';
import { hasMouse, reducedMotion, lerp } from '../lib/env.js';

const LABELS = { view: 'смотреть', link: '' };

export function initCursor() {
  if (!hasMouse || reducedMotion) return;

  const root = document.getElementById('cursor');
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  const label = document.getElementById('cursor-text');
  if (!root || !dot || !ring) return;

  document.body.classList.add('has-cursor');

  const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  const fast = { ...mouse };
  const slow = { ...mouse };

  addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }, { passive: true });

  gsap.ticker.add(() => {
    // точка догоняет быстро, кольцо медленно — из этой разницы и берётся вес
    fast.x = lerp(fast.x, mouse.x, 0.35);
    fast.y = lerp(fast.y, mouse.y, 0.35);
    slow.x = lerp(slow.x, mouse.x, 0.13);
    slow.y = lerp(slow.y, mouse.y, 0.13);

    gsap.set(dot, { x: fast.x, y: fast.y });
    gsap.set(ring, { x: slow.x, y: slow.y });
  });

  document.querySelectorAll('[data-cursor]').forEach((el) => {
    const kind = el.dataset.cursor;
    const cls = kind === 'view' ? 'is-view' : 'is-link';

    el.addEventListener('mouseenter', () => {
      root.classList.add(cls);
      if (label) label.textContent = LABELS[kind] ?? '';
    });
    el.addEventListener('mouseleave', () => {
      root.classList.remove('is-view', 'is-link');
    });
  });

  document.addEventListener('mouseleave', () => gsap.to(root, { autoAlpha: 0, duration: 0.3 }));
  document.addEventListener('mouseenter', () => gsap.to(root, { autoAlpha: 1, duration: 0.3 }));

  initMagnets();
}

function initMagnets() {
  document.querySelectorAll('[data-magnet]').forEach((el) => {
    const strength = Number(el.dataset.magnet) || 0.22;

    el.addEventListener('mousemove', (e) => {
      const b = el.getBoundingClientRect();
      gsap.to(el, {
        x: (e.clientX - (b.left + b.width / 2)) * strength,
        y: (e.clientY - (b.top + b.height / 2)) * strength,
        duration: 0.5,
        ease: 'power3.out',
      });
    });

    el.addEventListener('mouseleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' });
    });
  });
}
