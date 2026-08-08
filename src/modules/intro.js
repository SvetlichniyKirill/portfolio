/* ============================================================
   intro.js — вход в сайт

   Ключ к «дорогому» первому кадру: заголовок готовится ДО того,
   как поднялся занавес (символы уже спрятаны под маску), а играет
   ОДНОВРЕМЕННО с его подъёмом. Тогда сайт не «появляется, а потом
   анимируется» — он появляется уже в движении.
   ============================================================ */
import { gsap } from '../lib/gsap.js';
import { splitChars } from '../lib/split.js';
import { reducedMotion } from '../lib/env.js';

export function prepareIntro() {
  const title = document.querySelector('.hero__title');
  const fades = document.querySelectorAll('[data-intro="fade"]');

  if (reducedMotion || !title) return () => {};

  const chars = splitChars(title);
  // 150, а не 130: маска строки расширена под выносные, и при меньшем
  // сдвиге верхушки символов торчали бы из-под её нижнего края
  gsap.set(chars, { yPercent: 150 });
  gsap.set(fades, { autoAlpha: 0, y: 18 });

  // Возвращаем «плей», а не запускаем сразу — временем управляет прелоадер.
  // Задержки нет специально: занавес ещё закрывает экран, и заголовок
  // должен уже быть в движении к моменту, когда шторка уходит. Иначе сайт
  // читается как «сначала появился, потом задумался, потом поехал».
  return () =>
    gsap.timeline()
      .to(chars, {
        yPercent: 0,
        duration: 1,
        ease: 'expo.out',
        // from:'start' + мелкий шаг = заголовок «печатается» волной
        stagger: { each: 0.018, from: 'start' },
      })
      .to(fades, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.1 }, '-=0.7');
}
