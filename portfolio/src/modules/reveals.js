/* ============================================================
   reveals.js — появление по скроллу

   Три разных приёма, а не один на всё:
   · once-ревил   — быстрый вход блока (карточки, факты, строки)
   · scrub-слова  — абзац «читается» по мере прокрутки
   · параллакс    — разная скорость слоёв даёт глубину

   Стартовое состояние ставит JS, а не CSS: если скрипт не загрузился,
   контент остаётся видимым, а не пропадает навсегда.
   ============================================================ */
import { gsap, ScrollTrigger } from '../lib/gsap.js';
import { splitChars, splitLines, splitWords } from '../lib/split.js';
import { reducedMotion } from '../lib/env.js';

export function initReveals() {
  if (reducedMotion) return;

  revealLineTitles();
  revealCharTitles();
  revealScrubWords();
  revealGroups();
  revealBlocks();
  initParallax();
}

/* ---------- Заголовки секций: построчно из-под маски ---------- */
function revealLineTitles() {
  document.querySelectorAll('[data-split="lines"]').forEach((el) => {
    const lines = splitLines(el);
    if (!lines.length) return;

    gsap.set(lines, { yPercent: 140 });
    gsap.to(lines, {
      yPercent: 0,
      duration: 1.05,
      stagger: 0.09,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });
}

/* ---------- Заголовок контактов: по символам ---------- */
function revealCharTitles() {
  // Герой обрабатывается в intro.js — там свой тайминг
  document.querySelectorAll('[data-split="chars"]:not(.hero__title)').forEach((el) => {
    const chars = splitChars(el);
    if (!chars.length) return;

    gsap.set(chars, { yPercent: 150 });
    gsap.to(chars, {
      yPercent: 0,
      duration: 1,
      stagger: { each: 0.018, from: 'start' },
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });
}

/* ---------- Абзац проявляется словами ----------
   Тот самый приём с «читающимся» текстом. Секрет в scrub: прогресс
   анимации жёстко привязан к позиции скролла, поэтому кажется,
   что текст загорается ровно под взглядом. */
function revealScrubWords() {
  document.querySelectorAll('[data-reveal="words"]').forEach((el) => {
    const words = splitWords(el);
    if (!words.length) return;

    gsap.fromTo(
      words,
      { opacity: 0.13 },
      {
        opacity: 1,
        ease: 'none',
        duration: 1,
        stagger: 1,          // окна слов идут друг за другом без наложения
        scrollTrigger: {
          trigger: el,
          start: 'top 78%',
          // Фиксированное окно в 70% экрана, а не 'bottom 55%'. Привязка к
          // концу элемента давала на двухстрочном абзаце ~300px прокрутки
          // на 28 слов — по 11px на слово, слова просто мигали.
          end: '+=70%',
          scrub: true,
        },
      }
    );
  });
}

/* ---------- Групповой ревил ----------
   Для элементов, стоящих в строку: отдельный триггер на каждом сработал бы
   одновременно, и стаггер бы не читался. Триггер один — на контейнере. */
function revealGroups() {
  document.querySelectorAll('[data-reveal="group"]').forEach((el) => {
    const kids = Array.from(el.children);
    if (!kids.length) return;

    gsap.fromTo(
      kids,
      { y: 34, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.95,
        stagger: 0.11,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      }
    );
  });
}

/* ---------- Простой ревил блоков ---------- */
function revealBlocks() {
  const blocks = Array.from(document.querySelectorAll('[data-reveal]')).filter(
    (el) => !el.dataset.reveal
  );

  blocks.forEach((el) => {
    gsap.fromTo(
      el,
      { y: 40, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.95,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      }
    );
  });
}

/* ---------- Параллакс ----------
   data-parallax="40" → слой едет с 40px до -40px за проход секции. */
function initParallax() {
  document.querySelectorAll('[data-parallax]').forEach((el) => {
    const amp = Number(el.dataset.parallax) || 40;
    const scope = el.closest('section') || el.parentElement;

    gsap.fromTo(
      el,
      { y: amp },
      {
        y: -amp,
        ease: 'none',
        scrollTrigger: {
          trigger: scope,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );
  });
}

/* ---------- Индикатор прогресса чтения ---------- */
export function initProgress() {
  const bar = document.getElementById('progress-bar');
  if (!bar) return;

  // Без trigger и с числовыми границами. Через trigger:documentElement
  // не работает: его высота измеряется как высота вьюпорта, диапазон
  // получается нулевым и полоса стоит на месте.
  gsap.to(bar, {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: {
      start: 0,
      end: () => document.documentElement.scrollHeight - window.innerHeight,
      scrub: 0.3,
      invalidateOnRefresh: true,
    },
  });

  // Пересчёт после подгрузки шрифтов: высоты секций меняются
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
