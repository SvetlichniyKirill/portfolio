// один общий экземпляр, иначе ScrollTrigger регистрируется дважды
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
gsap.defaults({ ease: 'expo.out', duration: 0.9 });

export { gsap, ScrollTrigger };
