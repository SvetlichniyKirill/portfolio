/* Единая точка входа в GSAP.
   Плагин регистрируется один раз, все модули берут gsap отсюда —
   иначе легко получить два экземпляра и молча сломанный ScrollTrigger. */
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Кривая по умолчанию для всего сайта — та же, что --ease в CSS
gsap.defaults({ ease: 'expo.out', duration: 0.9 });

export { gsap, ScrollTrigger };
