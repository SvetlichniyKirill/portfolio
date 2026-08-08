/* ============================================================
   cover.js — процедурные обложки проектов

   Скриншотов пока нет, а плейсхолдеры с «placeholder.com» убивают
   весь премиум. Поэтому обложки рисуются на canvas: mesh-градиент,
   сетка, кольца, зерно. Выглядит как осознанная графика, весит ноль
   и не тянет ни одного сетевого запроса.

   Когда появятся реальные скриншоты — положи их в images/ и добавь
   data-src="images/foo.jpg" на <canvas>. Шейдер тот же.
   ============================================================ */

/** Детерминированный PRNG: одинаковый seed — одинаковая картинка. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeCover({ width = 1000, height = 750, hue = 88, label = '', seed = 7 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const rnd = mulberry32(seed);

  // --- 1. Тёмная база в тон акценту, а не нейтрально-серая
  ctx.fillStyle = `hsl(${hue - 10} 18% 7%)`;
  ctx.fillRect(0, 0, width, height);

  // --- 2. Mesh-градиент: несколько мягких пятен в режиме сложения
  ctx.globalCompositeOperation = 'lighter';
  const blobs = 5;
  for (let i = 0; i < blobs; i++) {
    const x = rnd() * width;
    const y = rnd() * height;
    const r = (0.28 + rnd() * 0.42) * width;
    const h = hue + (rnd() - 0.5) * 90;
    const l = 34 + rnd() * 26;

    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `hsl(${h} 92% ${l}% / .55)`);
    g.addColorStop(0.45, `hsl(${h + 18} 80% ${l * 0.6}% / .22)`);
    g.addColorStop(1, 'hsl(0 0% 0% / 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.globalCompositeOperation = 'source-over';

  // --- 3. Техническая сетка: даёт «чертёжный» слой поверх мягкого градиента
  ctx.strokeStyle = 'rgba(255,255,255,.055)';
  ctx.lineWidth = 1;
  const step = width / 16;
  ctx.beginPath();
  for (let x = step; x < width; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = step; y < height; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();

  // --- 4. Пара концентрических кругов — графический акцент
  ctx.strokeStyle = 'rgba(255,255,255,.14)';
  const cx = width * (0.25 + rnd() * 0.5);
  const cy = height * (0.25 + rnd() * 0.5);
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy, i * width * 0.09, 0, Math.PI * 2);
    ctx.stroke();
  }

  // --- 5. Подпись моноширинным: шейдер её потом красиво поведёт
  if (label) {
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.font = `500 ${Math.round(width * 0.035)}px "JetBrains Mono", monospace`;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(label.toUpperCase(), width * 0.06, height * 0.92);
  }

  // --- 6. Затемнение по краям
  const vig = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.2,
    width / 2, height / 2, Math.max(width, height) * 0.75
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,.55)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, width, height);

  // --- 7. Зерно попиксельно: убирает «пластиковость» градиента
  const img = ctx.getImageData(0, 0, width, height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rnd() - 0.5) * 16;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);

  return canvas;
}
