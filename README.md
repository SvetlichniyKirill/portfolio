# Портфолио

Одностраничник: https://svetlichniykirill.github.io/portfolio/

Обычный HTML/CSS/JS, без сборщика. Библиотеки подключены через importmap
прямо в `index.html`, поэтому это просто статика — можно кинуть куда угодно.

## Запуск

По `file://` модули не работают, нужен сервер:

```bash
python serve.py --open
```

## Что используется

- [Lenis](https://github.com/darkroomengineering/lenis) — плавная прокрутка
- [GSAP](https://gsap.com/) + ScrollTrigger — анимации и пиннинг
- [OGL](https://github.com/oframe/ogl) — шейдеры (фигура в шапке, обложки работ)

## Файлы

```
index.html
styles/    base / layout / components
src/
  main.js       запуск всего
  lib/          gsap, детект среды, резка текста, генератор обложек
  modules/      скролл, прелоадер, курсор, бегущая строка, работы
  gl/           шейдеры
serve.py
```

## Заметки

Обложки проектов сейчас рисуются кодом (`src/lib/cover.js`). Когда будут
скриншоты — положить в `images/` и дописать на нужный canvas:

```html
<canvas class="work__gl" data-gl-work data-src="images/foo.jpg"></canvas>
```

Если поставить Node, можно перейти на Vite: `npm install`, потом удалить
importmap из `index.html`. Остальное менять не придётся.
