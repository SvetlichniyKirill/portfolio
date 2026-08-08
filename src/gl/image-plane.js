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
uniform vec2  uRes;
uniform vec2  uSize;
uniform vec2  uPointer;
uniform float uHover;
uniform float uTime;
uniform float uVel;

varying vec2 vUv;

void main() {
  // cover-подгонка, чтобы картинку не растянуло
  vec2 ratio = vec2(
    min((uRes.x / uRes.y) / (uSize.x / uSize.y), 1.0),
    min((uRes.y / uRes.x) / (uSize.y / uSize.x), 1.0)
  );
  vec2 uv = vec2(
    vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
    vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
  );

  uv.x += sin(uv.y * 6.0 + uTime * 0.5) * 0.0035;
  uv.y += cos(uv.x * 5.0 - uTime * 0.4) * 0.0030;

  float d = distance(vUv, uPointer);
  vec2 dir = normalize(vUv - uPointer + vec2(0.0001));
  uv += dir * sin(d * 16.0 - uTime * 2.6) * 0.024 * uHover * smoothstep(0.75, 0.0, d);

  uv = (uv - 0.5) * (1.0 - 0.05 * uHover) + 0.5;

  float ab = 0.005 * uHover + abs(uVel) * 0.004;
  vec3 col;
  col.r = texture2D(tMap, uv + vec2(ab, 0.0)).r;
  col.g = texture2D(tMap, uv).g;
  col.b = texture2D(tMap, uv - vec2(ab, 0.0)).b;

  col += uHover * smoothstep(0.55, 0.0, d) * 0.06;

  gl_FragColor = vec4(col, 1.0);
}
`;

export function paintStatic(canvasEl, cover) {
  const ctx = canvasEl.getContext('2d');
  if (!ctx) return;
  const box = canvasEl.parentElement;
  const w = box?.clientWidth || canvasEl.clientWidth || 600;
  const h = box?.clientHeight || canvasEl.clientHeight || 450;
  canvasEl.width = Math.round(w * dpr());
  canvasEl.height = Math.round(h * dpr());

  const scale = Math.max(canvasEl.width / cover.width, canvasEl.height / cover.height);
  const dw = cover.width * scale;
  const dh = cover.height * scale;
  ctx.drawImage(cover, (canvasEl.width - dw) / 2, (canvasEl.height - dh) / 2, dw, dh);
}

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

  // если у канваса есть data-src, скриншот заменит нарисованную обложку
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
        1 - (e.clientY - b.top) / b.height   // y в webgl снизу вверх
      );
    }, { passive: true });
  }

  let visible = false;
  new IntersectionObserver(
    ([entry]) => { visible = entry.isIntersecting; },
    { rootMargin: '150px' }
  ).observe(canvasEl);

  let velSmooth = 0;
  const phase = Math.random() * 40;   // чтобы карточки не дышали в такт

  const tick = (time) => {
    if (!visible) return;
    program.uniforms.uTime.value = time + phase;
    program.uniforms.uHover.value = state.hover;

    velSmooth += (scrollState.velocity * 0.05 - velSmooth) * 0.1;
    program.uniforms.uVel.value = gsap.utils.clamp(-1, 1, velSmooth);

    renderer.render({ scene: mesh });
  };

  gsap.ticker.add(tick);
  renderer.render({ scene: mesh });

  return { resize, destroy: () => gsap.ticker.remove(tick) };
}
