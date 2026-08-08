import { gsap } from '../lib/gsap.js';

export function initWorks() {
  const section = document.getElementById('works');
  const viewport = section?.querySelector('.works__viewport');
  const track = document.getElementById('works-track');
  const hint = document.getElementById('works-hint');
  if (!section || !viewport || !track) return;

  const cards = Array.from(track.querySelectorAll('.work'));
  const total = String(cards.length).padStart(2, '0');

  const mm = gsap.matchMedia();

  // на тач-устройствах вместо пиннинга обычный свайп, он в css
  mm.add(
    '(min-width: 861px) and (hover: hover) and (prefers-reduced-motion: no-preference)',
    () => {
      // всё, что зависит от размеров, — функциями, иначе ломается на ресайзе
      const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
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
            skewTo(gsap.utils.clamp(-3.5, 3.5, self.getVelocity() / -1600));
          },
        },
      });
    }
  );

  viewport.addEventListener('scroll', () => {
    if (!hint || !viewport.scrollWidth) return;
    const max = viewport.scrollWidth - viewport.clientWidth;
    const p = max > 0 ? viewport.scrollLeft / max : 0;
    const i = Math.min(cards.length, Math.floor(p * cards.length) + 1);
    hint.textContent = `${String(i).padStart(2, '0')} / ${total}`;
  }, { passive: true });
}
