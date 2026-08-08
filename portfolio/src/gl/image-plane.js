/* ============================================================
   image-plane.js — WebGL-искажение картинок

   Здесь важна архитектурная развилка. Обычно «жидкие» галереи делают
   одним канвасом на весь экран и вручную синхронизируют позиции DOM
   и плоскостей. Это красиво в демо и мучительно в жизни: пиннинг,
   ресайз и transform родителя ломают синхронизацию.

   Поэтому у каждой карточки свой маленький канвас внутри неё.
   Позицию считает браузер, шейдер знает только свой прямоугольник.
   Работает внутри горизонтального трека без единой правки.

   Геометрия — Triangle: один треугольник на весь клип, дешевле квада.
   ============================================================ */
import { Renderer, Program, Mesh, Triangle, Texture, Vec2 } from 'ogl';
import { gsap } from '../lib/gsap.js';
import { dpr, hasMouse } from '../lib/env.js';
import { makeCover } from '../lib/cover.js';
import { scrollState } from '../modules/smooth-scroll.js';

const vertex = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = /* glsl */ `
precision highp float;

uniform sampler2D tMap;
uniform vec2  uRes;      // размер канваса в пикселях
uniform vec2  uSize;     // размер картинки
uniform vec2  uPointer;   // курсор в локальных 0..1
uniform float uHover;     // 0..1, ведёт gsap
uniform float uTime;
uniform float uVel;       // нормированная скорость скролла

varying vec2 vUv;

void main() {
  // --- cover-подгонка: картинка кадрируется, а не растягивается
  vec2 ratio = vec2(
    min((uRes.x / uRes.y) / (uSize.x / uSize.y), 1.0),
    min((uRes.y / uRes.x) / (uSize.y / uSize.x), 1.0)
  );
  vec2 uv = vec2(
    vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
    vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
  );

  // --- постоянный медленный дрейф: карточка «дышит» даже без мыши
  uv.x += sin(uv.y * 6.0 + uTime * 0.5) * 0.0035;
  uv.y += cos(uv.x * 5.0 - uTime * 0.4) * 0.0030;

  // --- рябь от курсора: волна расходится кругами от точки наведения
  float d = distance(vUv, uPointer);
  vec2 dir = normalize(vUv - uPointer + vec2(0.0001));
  uv += dir * sin(d * 16.0 - uTime * 2.6) * 0.024 * uHover * smoothstep(0.75, 0.0, d);

  // --- лёгкий зум внутрь: подтверждает наведение физически
  uv = (uv - 0.5) * (1.0 - 0.05 * uHover) + 0.5;

  // --- хроматическая аберрация: от наведения и от скорости скролла
  float ab = 0.005 * uHover + abs(uVel) * 0.004;
  vec3 col;
  col.r = texture2D(tMap, uv + vec2(ab, 0.0)).r;
  col.g = texture2D(tMap, uv).g;
  col.b = texture2D(tMap, uv - vec2(ab, 0.0)).b;

  // --- лёгкое осветление под курсором вместо CSS-оверлея
  col += uHover * smoothstep(0.55, 0.0, d) * 0.06;

  gl_FragColor = vec4(col, 1.0);
}
`;

/** Fallback без WebGL: рисуем ту же обложку обычным 2D-контекстом. */
export function paintStatic(canvasEl, cover) {
  const ctx = canvasEl.getContext('2d');
  if (!ctx) return;
  const box = canvasEl.parentElement;
  const w = box?.clientWidth || canvasEl.clientWidth || 600;
  const h = box?.clientHeight || canvasEl.clientHeight || 450;
  canvasEl.width = Math.round(w * dpr());
  canvasEl.height = Math.round(h * dpr());

  // cover-кадрирование руками
  const scale = Math.max(canvasEl.width / cover.width, canvasEl.height / cover.height);
  const dw = cover.width * scale;
  const dh = cover.height * scale;
  ctx.drawImage(cover, (canvasEl.width - dw) / 2, (canvasEl.height - dh) / 2, dw, dh);
}

/**
 * @param {HTMLCanvasElement} canvasEl
 * @param {{hue?:number, label?:string, seed?:number, interactive?:boolean, src?:string}} opts
 */
export function createImagePlane(canvasEl, opts = {}) {
  const { hue = 88, label = '', seed = 7, interactive = true, src = null } = opts;

  const cover = makeCover({ hue, label, seed });

  let renderer;
  try {
    renderer = new Renderer({ canvas: canvasEl, dpr: dpr(), alpha: false, antialias: false });
  } catch {
    paintStatic(canvasEl, cover);
    return null;
  }

  const gl = renderer.gl;

  const texture = new Texture(gl, { generateMipmaps: false });
  texture.image = cover;
  const size = new Vec2(cover.width, cover.height);

  // Если положили реальный скриншот — он молча заменяет процедурную обложку
  if (src) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      texture.image = img;
      texture.needsUpdate = true;
      size.set(img.naturalWidth, img.naturalHeight);
      program.uniforms.uSize.value = size;
    };
    img.src = src;
  }

  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms: {
      tMap:     { value: texture },
      uRes:     { value: new Vec2(1, 1) },
      uSize:    { value: size },
      uPointer: { value: new Vec2(0.5, 0.5) },
      uHover:   { value: 0 },
      uTime:    { value: 0 },
      uVel:     { value: 0 },
    },
  });

  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

  /* ---------- Размеры ----------
     Источник истины — родитель. Сам канвас спрашивать нельзя: OGL пишет
     ему инлайновые px, и замер вернёт 300×150 из своего же конструктора. */
  const box = canvasEl.parentElement;
  const resize = () => {
    const w = box?.clientWidth || 0;
    const h = box?.clientHeight || 0;
    if (!w || !h) return;

    renderer.setSize(w, h);
    canvasEl.style.width = '100%';
    canvasEl.style.height = '100%';
    program.uniforms.uRes.value.set(w, h);
  };

  resize();
  if (box) new ResizeObserver(resize).observe(box);

  /* ---------- Наведение ---------- */
  const host = canvasEl.closest('.work') || canvasEl.parentElement;
  const state = { hover: 0 };

  if (interactive && hasMouse && host) {
    host.addEventListener('mouseenter', () => {
      gsap.to(state, { hover: 1, duration: 0.7, ease: 'power2.out', overwrite: true });
    });
    host.addEventListener('mouseleave', () => {
      gsap.to(state, { hover: 0, duration: 0.9, ease: 'power2.out', overwrite: true });
    });
    host.addEventListener('mousemove', (e) => {
      const b = canvasEl.getBoundingClientRect();
      if (!b.width || !b.height) return;
      program.uniforms.uPointer.value.set(
        (e.clientX - b.left) / b.width,
        // UV в WebGL растут вверх, у DOM — вниз
        1 - (e.clientY - b.top) / b.height
      );
    }, { passive: true });
  }

  /* ---------- Рендер только когда карточка видна ---------- */
  let visible = false;
  new IntersectionObserver(
    ([entry]) => { visible = entry.isIntersecting; },
    { rootMargin: '150px' }
  ).observe(canvasEl);

  let velSmooth = 0;
  // Сдвиг фазы: иначе все карточки «дышат» синхронно и это выдаёт трюк
  const phase = Math.random() * 40;

  const tick = (time) => {
    if (!visible) return;
    program.uniforms.uTime.value = time + phase;
    program.uniforms.uHover.value = state.hover;

    // Скорость сглаживаем: сырое значение Lenis дёргается
    velSmooth += (scrollState.velocity * 0.05 - velSmooth) * 0.1;
    program.uniforms.uVel.value = gsap.utils.clamp(-1, 1, velSmooth);

    renderer.render({ scene: mesh });
  };

  gsap.ticker.add(tick);

  // Первый кадр сразу, чтобы не мигнуть пустотой до появления в вьюпорте
  program.uniforms.uHover.value = 0;
  renderer.render({ scene: mesh });

  return { resize, destroy: () => gsap.ticker.remove(tick) };
}
