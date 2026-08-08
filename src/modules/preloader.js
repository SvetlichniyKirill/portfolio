import { gsap, ScrollTrigger } from '../lib/gsap.js';

const MIN_MS = 600;
// иначе при незагрузившемся шрифте страница навсегда останется без скролла
const MAX_MS = 6000;

function whenLoaded() {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') return resolve();
    window.addEventListener('load', resolve, { once: true });
  });
}

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
        // только после снятия класса: с overflow:hidden вьюпорт на 15px шире
        ScrollTrigger.refresh();
        onIntro?.();
      })
      .to(panels, {
        yPercent: -100,
        duration: 0.9,
        ease: 'expo.inOut',
        stagger: { each: 0.045, from: 'start' },
      }, '<')
      .add(() => curtain?.classList.add('is-done'));
  };

  // счётчик доезжает до 92 сам, остаток ждёт шрифтов и load
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
