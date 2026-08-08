/* ============================================================
   hero-blob.js — 3D-сцена в герое

   Сфера с высокой тесселяцией, вершины которой смещаются
   симплексным шумом вдоль нормали. Три слоя шума разной частоты
   дают ощущение живой жидкости, а не пульсирующего мяча.

   Цвет — не текстура, а френель: чем ближе поверхность к силуэту,
   тем сильнее подмешивается акцент. Отсюда «радужный» край.

   Производительность: dpr ограничен, а рендер останавливается,
   когда герой уехал из вьюпорта — за пиннингом работ незачем
   считать 16 тысяч вершин.
   ============================================================ */
import { Renderer, Camera, Transform, Program, Mesh, Sphere, Vec2, Color } from 'ogl';
import { gsap } from '../lib/gsap.js';
import { dpr, isTouch, lerp, clamp } from '../lib/env.js';
import { snoise3 } from './noise.glsl.js';

const vertex = /* glsl */ `
attribute vec3 position;
attribute vec3 normal;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

uniform float uTime;
uniform float uAmp;
uniform vec2  uMouse;

varying vec3  vNormal;
varying vec3  vView;
varying float vDisp;

${snoise3}

void main() {
  vec3 pos = position;
  float t = uTime * 0.26;

  // Три октавы: крупная форма + рябь + мелкая крошка
  float n  = snoise(pos * 1.05 + vec3(0.0, 0.0, t));
  n += 0.45 * snoise(pos * 2.30 + vec3(t * 1.3, 0.0, 0.0));
  n += 0.18 * snoise(pos * 4.60 + vec3(0.0, t * 1.7, 0.0));

  // Курсор «притягивает» поверхность: локальный выступ там, где мышь
  float pull = smoothstep(0.75, 0.0, distance(normalize(pos).xy, uMouse));

  vDisp = n;
  pos += normal * (n * uAmp + pull * 0.20);

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView   = -mv.xyz;

  gl_Position = projectionMatrix * mv;
}
`;

const fragment = /* glsl */ `
precision highp float;

uniform vec3  uColorA;
uniform vec3  uColorB;
uniform vec3  uColorC;
uniform float uTime;

varying vec3  vNormal;
varying vec3  vView;
varying float vDisp;

void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(vView);

  // Френель: край силуэта светится, центр остаётся глубоким
  float fres = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 2.1);

  float band = clamp(vDisp * 0.5 + 0.5, 0.0, 1.0);
  vec3 col = mix(uColorA, uColorB, band);
  col = mix(col, uColorC, fres * 0.95);

  // Один направленный блик, чтобы объём читался однозначно
  float spec = pow(max(dot(n, normalize(vec3(0.5, 0.75, 0.6))), 0.0), 6.0);
  col += spec * 0.18;

  gl_FragColor = vec4(col, 1.0);
}
`;

const FOV = 35;

export function initHeroBlob(canvas) {
  if (!canvas) return;

  let renderer;
  try {
    renderer = new Renderer({ canvas, alpha: true, antialias: true, dpr: dpr() });
  } catch {
    // Нет WebGL — герой просто останется на CSS-градиенте
    canvas.style.display = 'none';
    return;
  }

  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);

  const camera = new Camera(gl, { fov: FOV });
  const scene = new Transform();

  // Меньше сегментов на тач-устройствах: 128² там не нужны
  const seg = isTouch ? 72 : 128;
  const geometry = new Sphere(gl, { radius: 1, widthSegments: seg, heightSegments: seg });

  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms: {
      uTime:   { value: 0 },
      uAmp:    { value: 0.24 },
      uMouse:  { value: new Vec2(0, 0) },
      uColorA: { value: new Color('#241452') },
      uColorB: { value: new Color('#6b4bff') },
      uColorC: { value: new Color('#c8ff2f') },
    },
  });

  const mesh = new Mesh(gl, { geometry, program });
  mesh.setParent(scene);

  /* ---------- Размеры ----------
     Замеряем РОДИТЕЛЯ, а не сам канвас. OGL внутри setSize пишет канвасу
     инлайновый width/height в пикселях, и если читать clientWidth канваса,
     получишь не размер секции, а те самые 300×150 из конструктора. */
  const host = canvas.parentElement;
  const resize = () => {
    const w = host?.clientWidth || 0;
    const h = host?.clientHeight || 0;
    if (!w || !h) return;

    renderer.setSize(w, h);
    // setSize пишет инлайновые px — возвращаем резину, чтобы CSS решал
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    const aspect = w / h;
    camera.perspective({ aspect });
    /* 7.2, а не 5.9: при близкой камере блоб занимал 67% высоты кадра и
       заходил под первую строку заголовка — белый текст ложился на самый
       светлый участок френеля. Дальше камера => объект в кадре, а не стена
       за текстом. Потолок 11 не даёт срезать блоб по бокам на узких экранах. */
    camera.position.z = Math.min(11, 7.2 / Math.min(1, aspect));

    /* Композицию считаем в долях кадра, а не подбираем координаты руками.
       Мировые единицы ничего не говорят о том, где объект окажется на
       экране: это зависит от fov, дистанции и пропорций. Поэтому сначала
       вычисляем видимый прямоугольник на плоскости блоба, а потом ставим
       центр в нужный процент кадра — и композиция держится на любом экране. */
    const visH = 2 * camera.position.z * Math.tan((FOV * Math.PI) / 360);
    const visW = visH * aspect;

    // Заголовок стоит с 31% высоты и ниже, поэтому яркое ядро блоба
    // уводим выше этой границы — пересекается только его тусклый край
    const fx = aspect > 1.25 ? 0.72 : 0.5;
    const fy = aspect > 1.25 ? 0.24 : 0.26;

    mesh.position.x = (fx - 0.5) * visW;
    mesh.position.y = (0.5 - fy) * visH;
  };

  resize();
  addEventListener('resize', resize);
  if (host) new ResizeObserver(resize).observe(host);

  /* ---------- Мышь и скролл ---------- */
  const target = new Vec2(0, 0);
  const current = new Vec2(0, 0);
  let scrollY = 0;

  addEventListener('mousemove', (e) => {
    target.x = (e.clientX / innerWidth) * 2 - 1;
    target.y = -((e.clientY / innerHeight) * 2 - 1);
  }, { passive: true });

  addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  /* ---------- Рендер только когда видно ---------- */
  let visible = true;
  new IntersectionObserver(
    ([entry]) => { visible = entry.isIntersecting; },
    { threshold: 0 }
  ).observe(canvas);

  gsap.ticker.add((time) => {
    if (!visible) return;

    current.x = lerp(current.x, target.x, 0.06);
    current.y = lerp(current.y, target.y, 0.06);
    program.uniforms.uMouse.value.set(current.x, current.y);
    program.uniforms.uTime.value = time;

    // Скролл крутит блоб — связь страницы и сцены должна быть явной
    const p = clamp(scrollY / innerHeight, 0, 2);
    mesh.rotation.y = time * 0.06 + p * 1.4;
    mesh.rotation.x = current.y * 0.35 - p * 0.5;
    mesh.rotation.z = current.x * 0.2;

    renderer.render({ scene, camera });
  });
}
