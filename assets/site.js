'use strict';
// First visit to the English root: go to the visitor's language. Links inside the site always win.
(() => {
  const supported = ['tr', 'de', 'es', 'fr'];
  const internal = document.referrer && new URL(document.referrer).origin === location.origin;
  if (document.documentElement.hasAttribute('data-root') && !internal && !location.hash) {
    const lang = (navigator.language || '').toLowerCase().split('-')[0];
    if (supported.includes(lang)) location.replace(lang + '/');
  }
})();

// Close the language menu on Escape or an outside click.
(() => {
  const menu = document.querySelector('.langs');
  if (!menu) return;
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target)) menu.open = false;
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.open) {
      menu.open = false;
      menu.querySelector('summary').focus();
    }
  });
})();

// The demo: text copied from the sheet lands in the deck. Nothing is stored or sent.
(() => {
  const demo = document.querySelector('.demo');
  if (!demo) return;
  const sheet = demo.querySelector('.sheet');
  const list = demo.querySelector('.deck ul');
  const show = document.getElementById('show');

  const add = (text) => {
    demo.querySelector('.empty').hidden = true;
    const li = document.createElement('li');
    const quote = document.createElement('p');
    quote.textContent = text.length > 160 ? text.slice(0, 160) + '…' : text;
    const source = document.createElement('p');
    source.className = 'source';
    source.textContent = `${document.getElementById('demo-title').textContent}, reviews.example, ${demo.dataset.now}`;
    li.append(quote, source);
    list.prepend(li);
    while (list.children.length > 3) list.lastElementChild.remove();
  };

  document.addEventListener('copy', () => {
    const selection = getSelection();
    if (!selection.rangeCount || !sheet.contains(selection.getRangeAt(0).commonAncestorContainer))
      return;
    const text = selection.toString().trim();
    if (text) add(text);
  });

  show.hidden = false;
  show.addEventListener('click', () => {
    const sample = document.getElementById('sample');
    getSelection().selectAllChildren(sample);
    add(sample.textContent);
  });
})();
