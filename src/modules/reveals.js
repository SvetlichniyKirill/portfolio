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

function revealCharTitles() {
  // герой не трогаем, у него свой тайминг в intro.js
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
        stagger: 1,
        scrollTrigger: {
          trigger: el,
          start: 'top 78%',
          end: '+=70%',   // от конца абзаца окно выходит слишком коротким
          scrub: true,
        },
      }
    );
  });
}

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

export function initProgress() {
  const bar = document.getElementById('progress-bar');
  if (!bar) return;

  // с trigger:documentElement диапазон получается нулевой, поэтому числами
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

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
