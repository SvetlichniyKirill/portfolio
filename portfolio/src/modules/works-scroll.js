/* ============================================================
   works-scroll.js — горизонтальный скролл внутри вертикального

   Самый узнаваемый приём «сайта как монтажа»:
   1. секция пиннится на весь экран;
   2. длина скролла искусственно = ширине трека минус экран;
   3. трек едет по X через scrub, привязанный к прогрессу.

   Всё, что зависит от размеров, задаётся функциями (x: () => ...,
   end: () => ...) плюс invalidateOnRefresh — иначе после ресайза
   трек не доедет или уедет в пустоту.

   На тач-устройствах пиннинг заменён нативным свайпом (см. CSS):
   он привычнее и не воюет с адресной строкой мобильного браузера.
   ============================================================ */
import { gsap } from '../lib/gsap.js';

export function initWorks() {
  const section = document.getElementById('works');
  const viewport = section?.querySelector('.works__viewport');
  const track = document.getElementById('works-track');
  const hint = document.getElementById('works-hint');
  if (!section || !viewport || !track) return;

  const cards = Array.from(track.querySelectorAll('.work'));
  const total = String(cards.length).padStart(2, '0');

  // gsap.matchMedia сам откатывает всё созданное внутри при выходе
  // из медиавыражения — ручной cleanup не нужен
  const mm = gsap.matchMedia();

  mm.add(
    '(min-width: 861px) and (hover: hover) and (prefers-reduced-motion: no-preference)',
    () => {
      const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);

      // Наклон карточек по скорости — «инерция» груза на тележке
      const skewTo = gsap.quickTo(cards, 'skewX', { duration: 0.6, ease: 'power3.out' });

      gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => '+=' + distance(),
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (hint) {
              const i = Math.min(cards.length, Math.floor(self.progress * cards.length) + 1);
              hint.textContent = `${String(i).padStart(2, '0')} / ${total}`;
            }
            // getVelocity даёт px/сек, а при быстром колесе это 2000–5000.
            // Делитель 420 упирал наклон в 7° почти на любом движении —
            // карточки читались как сломанные, а не как инерция.
            skewTo(gsap.utils.clamp(-3.5, 3.5, self.getVelocity() / -1600));
          },
        },
      });
    }
  );

  // На мобиле счётчик ведёт нативный скролл вьюпорта
  viewport.addEventListener('scroll', () => {
    if (!hint || !viewport.scrollWidth) return;
    const max = viewport.scrollWidth - viewport.clientWidth;
    const p = max > 0 ? viewport.scrollLeft / max : 0;
    const i = Math.min(cards.length, Math.floor(p * cards.length) + 1);
    hint.textContent = `${String(i).padStart(2, '0')} / ${total}`;
  }, { passive: true });
}
