import { gsap } from '../lib/gsap.js';
import { reducedMotion } from '../lib/env.js';
import { scrollState } from './smooth-scroll.js';

export function initMarquee() {
  const track = document.getElementById('marquee-track');
  const group = track?.firstElementChild;
  if (!track || !group) return;

  // ширину одной группы меряем до клонирования, это шаг цикла
  const step = group.offsetWidth;
  if (!step) return;

  const needed = window.innerWidth * 2 + step;
  let guard = 0;
  while (track.offsetWidth < needed && guard++ < 12) {
    track.appendChild(group.cloneNode(true));
  }

  if (reducedMotion) return;

  const tween = gsap.to(track, {
    x: -step,
    duration: step / 90,
    ease: 'none',
    repeat: -1,
  });

  let ts = 1;

  gsap.ticker.add(() => {
    const v = Math.abs(scrollState.velocity);
    // direction держит старое значение и в покое, поэтому сверяемся со скоростью
    const dir = v > 0.08 && scrollState.direction < 0 ? -1 : 1;
    const target = gsap.utils.clamp(0.35, 7, 1 + v * 0.12) * dir;

    ts += (target - ts) * 0.12;   // без сглаживания разворот дёргается
    tween.timeScale(ts);
  });
}
