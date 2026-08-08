/* ============================================================
   split.js — резка текста на строки / слова / символы

   Зачем своё, а не SplitText: нужен ровно один приём — обёртка
   в маску, и это 60 строк. Заодно нет зависимости от платного плагина.

   Доступность: исходная фраза уезжает в aria-label, а осколки
   помечаются aria-hidden — скринридер читает предложение целиком,
   а не «Д е л а ю».
   ============================================================ */

/** Рекурсивно оборачивает символы, не теряя вложенные теги вроде <em>. */
function wrapChars(node, out) {
  for (const kid of Array.from(node.childNodes)) {
    if (kid.nodeType === Node.TEXT_NODE) {
      const frag = document.createDocumentFragment();

      // for..of по строке идёт по code points — кириллица и эмодзи целы
      for (const ch of kid.textContent) {
        if (ch === ' ' || ch === '\n' || ch === '\t') {
          const space = document.createElement('span');
          space.className = 'split-space';
          space.textContent = ' ';
          frag.appendChild(space);
          continue;
        }
        const span = document.createElement('span');
        span.className = 'split-char';
        span.textContent = ch;
        span.setAttribute('aria-hidden', 'true');
        frag.appendChild(span);
        out.push(span);
      }

      node.replaceChild(frag, kid);
    } else if (kid.nodeType === Node.ELEMENT_NODE) {
      wrapChars(kid, out);
    }
  }
}

/**
 * Режет заголовок на символы. Маска ставится на строку, не на символ:
 * per-char overflow обрезал бы хвосты у «у», «р», «ф».
 * @returns {HTMLElement[]} символы в порядке чтения
 */
export function splitChars(el) {
  if (el.dataset.splitDone) return [];

  const label = el.textContent.replace(/\s+/g, ' ').trim();
  const explicit = Array.from(el.children).filter((c) => c.classList.contains('line'));
  const lines = explicit.length ? explicit : [el];

  const chars = [];
  for (const line of lines) {
    line.classList.add('split-line');
    wrapChars(line, chars);
  }

  el.setAttribute('aria-label', label);
  el.dataset.splitDone = '1';
  return chars;
}

/**
 * Режет по <br> на строки в масках. Возвращает внутренние слои —
 * именно они двигаются, внешние работают шторкой.
 */
export function splitLines(el) {
  if (el.dataset.splitDone) return [];

  const label = el.textContent.replace(/\s+/g, ' ').trim();
  const parts = el.innerHTML
    .split(/<br\s*\/?>/i)
    .map((s) => s.trim())
    .filter(Boolean);

  el.innerHTML = parts
    .map(
      (p) =>
        `<span class="split-line" aria-hidden="true"><span class="split-line__inner">${p}</span></span>`
    )
    .join('');

  el.setAttribute('aria-label', label);
  el.dataset.splitDone = '1';
  return Array.from(el.querySelectorAll('.split-line__inner'));
}

/** Режет абзац на слова — для построчного проявления по скроллу. */
export function splitWords(el) {
  if (el.dataset.splitDone) return [];

  const words = el.textContent.replace(/\s+/g, ' ').trim().split(' ');
  el.textContent = '';

  const out = [];
  words.forEach((w, i) => {
    const span = document.createElement('span');
    span.className = 'word';
    span.textContent = w;
    el.appendChild(span);
    // пробел отдельным текстовым узлом: перенос строк остаётся естественным
    if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    out.push(span);
  });

  el.dataset.splitDone = '1';
  return out;
}
