/* ============================================================
   marquee.js — бесконечная бегущая строка

   Приём: группа клонируется до перекрытия экрана, а трек сдвигается
   ровно на ширину ОДНОЙ группы и повторяется. Шва не видно, потому
   что в момент сброса на месте уже стоит идентичный клон.

   Живая часть — timeScale от скорости скролла: строка ускоряется
   вместе с прокруткой и разворачивается, когда листаешь назад.
   ============================================================ */
import { gsap } from '../lib/gsap.js';
import { reducedMotion } from '../lib/env.js';
import { scrollState } from './smooth-scroll.js';

export function initMarquee() {
  const track = document.getElementById('marquee-track');
  const group = track?.firstElementChild;
  if (!track || !group) return;

  // Ширину замеряем ДО клонирования — это шаг цикла
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
    duration: step / 90,   // px/сек, а не «магическая» длительность
    ease: 'none',
    repeat: -1,
  });

  let ts = 1;

  gsap.ticker.add(() => {
    const v = Math.abs(scrollState.velocity);

    // Разворот только пока реально листают. direction хранит последнее
    // значение и в покое, поэтому без проверки скорости строка после
    // прокрутки вверх навсегда осталась бы ехать назад.
    const dir = v > 0.08 && scrollState.direction < 0 ? -1 : 1;
    const target = gsap.utils.clamp(0.35, 7, 1 + v * 0.12) * dir;

    // Сглаживание: смена знака напрямую читается как рывок
    ts += (target - ts) * 0.12;
    tween.timeScale(ts);
  });
}
