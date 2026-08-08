import { ScrollTrigger } from './lib/gsap.js';
import { allowGL } from './lib/env.js';
import { makeCover } from './lib/cover.js';

import { initSmoothScroll, initAnchors } from './modules/smooth-scroll.js';
import { initPreloader } from './modules/preloader.js';
import { prepareIntro } from './modules/intro.js';
import { initReveals, initProgress } from './modules/reveals.js';
import { initCursor } from './modules/cursor.js';
import { initMarquee } from './modules/marquee.js';
import { initWorks } from './modules/works-scroll.js';
import { initUI } from './modules/ui.js';
import { initHeroBlob } from './gl/hero-blob.js';
import { createImagePlane, paintStatic } from './gl/image-plane.js';

initSmoothScroll();
initAnchors();

// заголовок прячем заранее, до того как поднимется занавес
const playIntro = prepareIntro();

initUI();
initCursor();
initMarquee();
initWorks();
initReveals();
initProgress();
initGL();

function initGL() {
  const heroCanvas = document.getElementById('hero-gl');

  if (!allowGL) {
    if (heroCanvas) heroCanvas.style.display = 'none';
    document.querySelectorAll('[data-gl-work], [data-gl-noise]').forEach((c, i) => {
      paintStatic(c, makeCover({ hue: hueOf(c), label: labelOf(c), seed: 11 + i * 7 }));
    });
    return;
  }

  initHeroBlob(heroCanvas);

  document.querySelectorAll('[data-gl-work]').forEach((c, i) => {
    createImagePlane(c, {
      hue: hueOf(c),
      label: labelOf(c),
      seed: 11 + i * 7,
      interactive: true,
      src: c.dataset.src || null,
    });
  });

  document.querySelectorAll('[data-gl-noise]').forEach((c, i) => {
    createImagePlane(c, {
      hue: 288,
      label: 'KS',
      seed: 41 + i,
      interactive: false,
      src: c.dataset.src || null,
    });
  });
}

function hueOf(canvas) {
  const host = canvas.closest('[data-hue]');
  return host ? Number(host.dataset.hue) : 88;
}

function labelOf(canvas) {
  const host = canvas.closest('.work');
  return host?.querySelector('.work__title')?.textContent.trim() ?? '';
}

initPreloader(playIntro);

addEventListener('resize', () => ScrollTrigger.refresh());
