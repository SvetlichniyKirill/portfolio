// Режет текст на строки / слова / символы для анимаций из-под маски.
// Фраза целиком уходит в aria-label, осколки прячем от скринридера.

function wrapChars(node, out) {
  for (const kid of Array.from(node.childNodes)) {
    if (kid.nodeType === Node.TEXT_NODE) {
      const frag = document.createDocumentFragment();

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

// маска висит на строке, а не на символе — иначе режет хвосты у «у» и «ц»
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
    if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    out.push(span);
  });

  el.dataset.splitDone = '1';
  return out;
}
