/* ============================================================
   main.js — сборка сайта

   Порядок здесь не случайный:
   1. скролл          — от него зависят все триггеры;
   2. подготовка текста — символы прячутся ДО поднятия занавеса;
   3. интерактив и WebGL;
   4. прелоадер последним — он дирижирует стартом интро.
   ============================================================ */
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

/* ---------- 1. Скролл ---------- */
initSmoothScroll();
initAnchors();

/* ---------- 2. Текст готовим до показа ---------- */
const playIntro = prepareIntro();

/* ---------- 3. Интерактив ---------- */
initUI();
initCursor();
initMarquee();
initWorks();
initReveals();
initProgress();

/* ---------- 4. WebGL ---------- */
initGL();

function initGL() {
  const heroCanvas = document.getElementById('hero-gl');

  if (!allowGL) {
    // Без WebGL герой живёт на CSS-градиенте, а обложки рисуются 2D-контекстом
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

/** Оттенок обложки берётся с карточки — палитра задаётся в разметке. */
function hueOf(canvas) {
  const host = canvas.closest('[data-hue]');
  return host ? Number(host.dataset.hue) : 88;
}

/** Подпись на обложке — заголовок проекта, без дублирования строк. */
function labelOf(canvas) {
  const host = canvas.closest('.work');
  return host?.querySelector('.work__title')?.textContent.trim() ?? '';
}

/* ---------- 5. Старт ---------- */
initPreloader(playIntro);

// Ресайз меняет высоту пиннинга — без пересчёта трек работ уедет мимо
addEventListener('resize', () => ScrollTrigger.refresh());
