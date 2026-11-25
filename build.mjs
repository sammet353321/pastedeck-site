// Generates the static site into dist/. No dependencies. Run: npm run build
import fs from 'node:fs';
import path from 'node:path';
import config from './config.mjs';

const LOCALES = ['en', 'tr', 'de', 'es', 'fr'];
const PAGES = { home: '', welcome: 'welcome/', privacy: 'privacy/', help: 'help/' };
const CSP =
  "default-src 'none'; style-src 'self'; script-src 'self'; img-src 'self' data:; font-src 'self'; base-uri 'none'; form-action 'none'";

for (const key of ['siteUrl', 'storeUrl', 'buyUrl'])
  if (config[key] && !/^https:\/\/[^\s"<>]+$/.test(config[key]))
    throw new Error(`config.${key} must be an https:// address`);
// The hosting workflow may set the address, so forks and renames need no edit.
const siteUrl = (process.env.SITE_URL || config.siteUrl).replace(/\/+$/, '');
const T = {};
for (const l of LOCALES) T[l] = (await import(`./content/${l}.mjs`)).default;

// French needs a no-break space before high punctuation and inside guillemets.
const typo = (l, s) =>
  l === 'fr' ? s.replace(/ ([:;?!»])/g, ' $1').replace(/« /g, '« ') : s;
const esc = (s) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const dir = (l, page) => (l === 'en' ? '' : `${l}/`) + PAGES[page];
const logo = (s) =>
  `<svg class="logo" width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2" width="15" height="16" rx="3.5" class="back"/><rect x="2" y="6" width="15" height="16" rx="3.5" class="front"/><path d="M6 12h7M6 16.3h4.5"/></svg>`;

function layout(l, page, body) {
  const t = T[l];
  const e = (s) => esc(typo(l, s));
  const here = dir(l, page);
  const up = '../'.repeat(here.split('/').length - 1) || './';
  const to = (p, lang = l) => up + dir(lang, p);
  const title = page === 'home' ? t.title : `${t[page].title} | PasteDeck`;
  const shot = (name) => `${up}assets/shots/${name}-${l}.png`;
  const current = (p) => (p === page ? ' aria-current="page"' : '');
  const seo = siteUrl
    ? `<link rel="canonical" href="${siteUrl}/${here}">\n` +
      LOCALES.map(
        (x) => `<link rel="alternate" hreflang="${x}" href="${siteUrl}/${dir(x, page)}">`,
      ).join('\n') +
      `\n<link rel="alternate" hreflang="x-default" href="${siteUrl}/${dir('en', page)}">
<meta property="og:url" content="${siteUrl}/${here}">
<meta property="og:image" content="${siteUrl}/assets/shots/library-light-${l}.png">`
    : '';
  const robots = page === 'welcome' ? '<meta name="robots" content="noindex">' : '';
  const cta = config.storeUrl
    ? `<a class="button" href="${esc(config.storeUrl)}" rel="noopener">${e(t.hero.add)}</a>`
    : `<p class="button soon">${e(t.hero.soon)}</p>`;
  return `<!doctype html>
<html lang="${l}"${here === '' ? ' data-root' : ''}>
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="referrer" content="same-origin">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(title)}</title>
<meta name="description" content="${e(t.description)}">
<meta property="og:title" content="${e(title)}">
<meta property="og:description" content="${e(t.description)}">
<meta property="og:type" content="website">
<meta name="color-scheme" content="light dark">
${robots}${seo}
<link rel="icon" type="image/png" sizes="128x128" href="${up}assets/icon.png">
<link rel="stylesheet" href="${up}assets/style.css">
<script src="${up}assets/site.js" defer></script>
</head>
<body class="page-${page}">
<a class="skip" href="#main">${e(t.nav.skip)}</a>
<header class="top">
<a class="brand" href="${to('home')}">${logo(28)}<span>PasteDeck</span></a>
<nav>
<a href="${to('home')}#how">${e(t.nav.how)}</a>
<a href="${to('home')}#price">${e(t.price.nav)}</a>
<a href="${to('privacy')}"${current('privacy')}>${e(t.nav.privacy)}</a>
<a href="${to('help')}"${current('help')}>${e(t.nav.help)}</a>
<details class="langs"><summary><span class="sr">${e(t.nav.language)}: </span>${t.name}</summary>
<ul>${LOCALES.map(
    (x) =>
      `<li><a lang="${x}" hreflang="${x}" href="${to(page, x)}"${x === l ? ' aria-current="true"' : ''}>${T[x].name}</a></li>`,
  ).join('')}</ul></details>
</nav>
</header>
<main id="main">
${body({ t, e, to, shot, cta })}
</main>
<footer><p>${e(t.footer)}</p>
<p><a href="${to('home')}">${e(t.nav.home)}</a> <a href="${to('privacy')}">${e(t.nav.privacy)}</a> <a href="${to('help')}">${e(t.nav.help)}</a></p></footer>
</body>
</html>
`;
}

const steps = (e, list, h = 'h3') =>
  `<ol class="steps">${list.map(([title, p]) => `<li><${h}>${e(title)}</${h}><p>${e(p)}</p></li>`).join('')}</ol>`;

const bodies = {
  home: ({ t, e, to, shot, cta }) => `
<section class="hero">
<div class="intro"><h1>${e(t.hero.h1)}</h1><p class="lede">${e(t.hero.lede)}</p>${cta}</div>
<div class="demo" data-now="${e(t.demo.now)}">
<article class="sheet" aria-labelledby="demo-title">
<p class="addr">reviews.example/keyboards</p>
<h2 id="demo-title">${e(t.demo.title)}</h2>
<p>${t.demo.body.map((s, i) => (i === 1 ? `<span id="sample">${e(s)}</span>` : e(s))).join(' ')}</p>
<p class="hint"><strong>${e(t.demo.label)}.</strong> ${e(t.demo.hint)}</p>
<button type="button" id="show" hidden>${e(t.demo.show)}</button>
</article>
<section class="deck" aria-labelledby="deck-title">
<h2 id="deck-title">${e(t.demo.deck)}</h2>
<p class="empty">${e(t.demo.empty)}</p>
<ul aria-live="polite"></ul>
<p class="note">${e(t.demo.note)}</p>
</section>
</div>
</section>
<section id="how" class="band"><h2>${e(t.how.h2)}</h2>${steps(e, t.how.steps)}</section>
<section class="band sessions"><div><h2>${e(t.sessions.h2)}</h2><p>${e(t.sessions.p)}</p></div>
<picture><source srcset="${shot('library-dark')}" media="(prefers-color-scheme: dark)"><img src="${shot('library-light')}" width="1280" height="800" loading="lazy" alt="${e(t.sessions.alt)}"></picture></section>
<section class="band"><h2>${e(t.facts.h2)}</h2>
<div class="facts">${['saves', 'never', 'cannot']
    .map(
      (k) =>
        `<div class="${k}"><h3>${e(t.facts[k][0])}</h3><ul>${t.facts[k][1].map((x) => `<li>${e(x)}</li>`).join('')}</ul></div>`,
    )
    .join('')}</div></section>
<section id="price" class="band price"><h2>${e(t.price.h2)}</h2>
<div class="plans">
<div class="plan"><h3>${e(t.price.free[0])}</h3><p class="amount">$0</p><ul>${t.price.free[1].map((x) => `<li>${e(x)}</li>`).join('')}</ul></div>
<div class="plan pro"><h3>${e(t.price.pro[0])}</h3><p class="amount">$9.99</p><p>${e(t.price.once)}</p><ul>${t.price.pro[1].map((x) => `<li>${e(x)}</li>`).join('')}</ul>${config.buyUrl ? `<a class="button" href="${esc(config.buyUrl)}" rel="noopener">${e(t.price.buy)}</a>` : `<p class="button soon">${e(t.price.soon)}</p>`}</div>
</div><p>${e(t.price.note)}</p></section>
<section class="band local"><h2>${e(t.local.h2)}</h2><p>${e(t.local.p)}</p><p><a href="${to('privacy')}">${e(t.local.link)}</a></p></section>`,
  welcome: ({ t, e, to }) => `
<section class="plain"><h1>${e(t.welcome.h1)}</h1><p class="lede">${e(t.welcome.p)}</p>
${steps(e, t.welcome.steps, 'h2')}
<p><a href="${to('help')}">${e(t.welcome.more)}</a></p></section>`,
  help: ({ t, e }) => `
<section class="plain"><h1>${e(t.help.h1)}</h1>
${t.help.items.map(([q, a]) => `<details class="qa"><summary>${e(q)}</summary><p>${e(a)}</p></details>`).join('\n')}</section>`,
  privacy: ({ t, e }) => {
    const mail = esc(config.contactEmail);
    const contact = mail ? `<a href="mailto:${mail}">${mail}</a>` : e(t.privacy.noContact);
    return `
<section class="plain"><h1>${e(t.privacy.h1)}</h1><p class="lede">${e(t.privacy.updated)}</p>
${t.privacy.sections.map(([h, p]) => `<h2>${e(h)}</h2><p>${p === '{contact}' ? contact : e(p)}</p>`).join('\n')}</section>`;
  },
};

// Every locale must have exactly the same shape as English.
const shape = (v) =>
  Array.isArray(v)
    ? v.map(shape)
    : v && typeof v === 'object'
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, shape(v[k])]),
        )
      : typeof v;
for (const l of LOCALES)
  if (JSON.stringify(shape(T[l])) !== JSON.stringify(shape(T.en)))
    throw new Error(`content/${l}.mjs does not match content/en.mjs`);

fs.rmSync('dist', { recursive: true, force: true });
fs.cpSync('assets', 'dist/assets', { recursive: true });
const write = (file, text) => {
  fs.mkdirSync(path.dirname(path.join('dist', file)), { recursive: true });
  fs.writeFileSync(path.join('dist', file), text);
};
for (const l of LOCALES)
  for (const page of Object.keys(PAGES))
    write(dir(l, page) + 'index.html', layout(l, page, bodies[page]));

// Hosts serve 404.html at any depth, so it cannot use relative links.
const base = siteUrl ? new URL(siteUrl + '/').pathname : '/';
const [nf, why] = T.en.notFound;
write(
  '404.html',
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${CSP}"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${nf} | PasteDeck</title><link rel="stylesheet" href="${base}assets/style.css"></head><body><main class="plain"><h1>${nf}</h1><p>${why}</p><ul class="nf">${LOCALES.map(
    (l) => `<li lang="${l}"><a href="${base}${dir(l, 'home')}">${esc(T[l].notFound[2])}</a></li>`,
  ).join('')}</ul></main></body></html>\n`,
);
// Netlify and Cloudflare Pages read _headers; GitHub Pages ignores it.
write(
  '_headers',
  `/*
  Content-Security-Policy: ${CSP}; frame-ancestors 'none'
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: same-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=31536000
`,
);
write('.nojekyll', '');
const urls = LOCALES.flatMap((l) =>
  ['home', 'privacy', 'help'].map((p) => `${siteUrl}/${dir(l, p)}`),
);
write('robots.txt', `User-agent: *\nAllow: /\n${siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : ''}`);
if (siteUrl)
  write(
    'sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`,
  );
console.log(`Built ${LOCALES.length * Object.keys(PAGES).length} pages into dist/`);
for (const k of ['siteUrl', 'storeUrl', 'buyUrl', 'contactEmail'])
  if (!config[k]) console.log(`Note: config.${k} is empty`);
