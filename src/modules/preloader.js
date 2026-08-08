/* ============================================================
   preloader.js — счётчик и занавес

   Логика честная: счётчик не «крутится ради вида», он доезжает
   до 92% за фиксированное время, а последние 8% ждут реальной
   готовности — шрифтов и window.load. Плюс минимальная длительность,
   чтобы на быстром соединении интро не мигнуло.
   ============================================================ */
import { gsap, ScrollTrigger } from '../lib/gsap.js';

/* Минимальная длительность: на быстром соединении интро иначе мигнёт.
   600 мс достаточно, чтобы счётчик прочитался как счётчик, а не как глюк. */
const MIN_MS = 600;

/* Страховка. Пока идёт прелоадер, body.is-loading держит overflow:hidden.
   Если шрифт или картинка не догрузятся, сайт останется навсегда без
   скролла — а это худшее, что может случиться с портфолио.
   Через MAX_MS интро запускается принудительно. */
const MAX_MS = 6000;

function whenLoaded() {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') return resolve();
    window.addEventListener('load', resolve, { once: true });
  });
}

/**
 * @param {() => void} onIntro вызывается, когда занавес пошёл вверх —
 *        сюда вешается анимация героя, чтобы она шла на открытии шторки
 */
export function initPreloader(onIntro) {
  const root = document.getElementById('preloader');
  const countEl = document.getElementById('preloader-count');
  const barEl = document.getElementById('preloader-bar');
  const curtain = document.getElementById('curtain');
  const panels = curtain ? Array.from(curtain.children) : [];

  const state = { v: 0 };
  const render = () => {
    const v = Math.round(state.v);
    countEl.textContent = v;
    gsap.set(barEl, { scaleX: v / 100 });
  };

  const outro = () => {
    gsap.timeline()
      .to(root.querySelector('.preloader__inner'), { yPercent: -60, autoAlpha: 0, duration: 0.4 })
      .to(root.querySelector('.preloader__bar'), { autoAlpha: 0, duration: 0.3 }, '<')
      .set(root, { display: 'none' })
      .add(() => {
        document.body.classList.remove('is-loading');

        /* Пересчёт строго ПОСЛЕ снятия is-loading. Пока класс стоит, у body
           overflow:hidden — вертикальной полосы нет, и вьюпорт на 15px шире
           настоящего. Замер в этот момент делал пиннинг работ шире экрана.
           scrollbar-gutter в CSS уже страхует от этого, но refresh здесь
           нужен и для браузеров без его поддержки, и потому что шрифты
           к этому моменту применены и высоты секций окончательные. */
        ScrollTrigger.refresh();
        onIntro?.();
      })
      .to(panels, {
        yPercent: -100,
        duration: 0.9,
        ease: 'expo.inOut',
        stagger: { each: 0.045, from: 'start' },
      }, '<')
      // display:none снимает пять слоёв с композитора после интро
      .add(() => curtain?.classList.add('is-done'));
  };

  const ready = Promise.race([
    Promise.all([
      document.fonts?.ready ?? Promise.resolve(),
      whenLoaded(),
      new Promise((r) => setTimeout(r, MIN_MS)),
    ]),
    new Promise((r) => setTimeout(r, MAX_MS)),
  ]);

  gsap.to(state, { v: 92, duration: 1.1, ease: 'power1.inOut', onUpdate: render });

  ready.then(() => {
    gsap.to(state, {
      v: 100,
      duration: 0.3,
      ease: 'power2.out',
      overwrite: true,
      onUpdate: render,
      onComplete: outro,
    });
  });
}
