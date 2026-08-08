/* Определение среды. Всё «тяжёлое» на сайте включается только там,
   где оно уместно: мышь есть, движение разрешено, WebGL живой. */

export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

export const hasMouse = matchMedia('(hover: hover) and (pointer: fine)').matches;

export const isTouch = !hasMouse;

/** Пиннинг и другие «настольные» приёмы. Проверяем каждый раз:
 *  окно можно уменьшить, и раскладка должна перестроиться. */
export const isDesktop = () => window.innerWidth >= 861 && hasMouse;

export const supportsWebGL = (() => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
})();

/** Единственный флаг, по которому решаем, рисовать ли шейдеры. */
export const allowGL = supportsWebGL && !reducedMotion;

/** Ретина красива, но 3x убивает fps. Потолок 1.75 — компромисс. */
export const dpr = () => Math.min(window.devicePixelRatio || 1, isTouch ? 1.25 : 1.75);

export const lerp = (a, b, t) => a + (b - a) * t;

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
