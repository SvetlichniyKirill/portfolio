import { gsap, ScrollTrigger } from '../lib/gsap.js';
import { reducedMotion } from '../lib/env.js';

export function initUI() {
  initClock();
  initYear();
  initRollLinks();
  initHeader();
}

function initClock() {
  const el = document.getElementById('clock');
  if (!el) return;

  const pad = (n) => String(n).padStart(2, '0');
  const tick = () => {
    const d = new Date();
    el.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  tick();
  setInterval(tick, 1000);
}

function initYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = String(new Date().getFullYear());
}

// ::after рисует копию текста, но content нужно откуда-то взять
function initRollLinks() {
  document.querySelectorAll('a[data-cursor="link"]').forEach((a) => {
    if (a.classList.contains('btn')) return;

    const kids = Array.from(a.children);
    const span = kids.length === 1 && kids[0].tagName === 'SPAN' ? kids[0] : null;
    if (!span || span.className) return;

    a.classList.add('roll');
    a.dataset.text = span.textContent.trim();
  });
}

function initHeader() {
  const header = document.getElementById('header');
  if (!header || reducedMotion) return;

  let hidden = false;
  const set = (state) => {
    if (state === hidden) return;
    hidden = state;
    gsap.to(header, { yPercent: state ? -130 : 0, duration: 0.55, overwrite: true });
  };

  ScrollTrigger.create({
    start: 'top -320',
    end: 'max',
    onUpdate: (self) => set(self.direction === 1),
    onLeaveBack: () => set(false),
  });
}
