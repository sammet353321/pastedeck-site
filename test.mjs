// Checks the built site in a real browser. Uses Playwright and axe from the PasteDeck project.
// Run: npm test   (add SHOTS=1 for screenshots in test-results)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(path.resolve('../PasteDeck/package.json'));
const { chromium } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.woff2': 'font/woff2' };
// Served under a sub-path, like GitHub project pages: proves every link is relative.
const BASE = '/some-repo/';
const srv = http
  .createServer((q, r) => {
    const p = decodeURIComponent(new URL(q.url, 'http://x').pathname);
    let f = p.startsWith(BASE) ? path.join('dist', path.normalize(p.slice(BASE.length) || '.')) : '';
    if (f && fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    if (!f || !fs.existsSync(f)) return r.writeHead(404).end();
    r.setHeader('content-type', TYPES[path.extname(f)] ?? 'text/plain');
    fs.createReadStream(f).pipe(r);
  })
  .listen(0, '127.0.0.1');
await new Promise((r) => srv.on('listening', r));
const origin = `http://127.0.0.1:${srv.address().port}`;
const root = origin + BASE;
const browser = await chromium.launch({ channel: 'chromium' });
const pages = ['en', 'tr', 'de', 'es', 'fr'].flatMap((l) =>
  ['', 'welcome/', 'privacy/', 'help/'].map((p) => [l, (l === 'en' ? '' : l + '/') + p]),
);
const links = new Set();
for (const colorScheme of ['light', 'dark'])
  for (const width of [1280, 360]) {
    const ctx = await browser.newContext({ colorScheme, viewport: { width, height: 900 }, locale: 'en-US', bypassCSP: false });
    const page = await ctx.newPage();
    const problems = [];
    page.on('console', (m) => ['error', 'warning'].includes(m.type()) && problems.push(m.text()));
    page.on('pageerror', (e) => problems.push(String(e)));
    page.on('request', (q) => !q.url().startsWith(origin) && !q.url().startsWith('data:') && problems.push('external ' + q.url()));
    page.on('response', (r) => r.status() >= 400 && problems.push(`${r.status()} ${r.url()}`));
    for (const [lang, p] of pages) {
      await page.goto(root + p);
      assert.equal(await page.locator('html').getAttribute('lang'), lang, p);
      assert.equal(await page.locator('h1').count(), 1, p);
      for (const d of await page.locator('details.qa').all()) await d.evaluate((e) => (e.open = true));
      const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert.ok(over <= 0, `${p} overflows by ${over} at ${width}`);
      for (const h of await page.locator('a[href]').evaluateAll((a) => a.map((x) => x.href))) links.add(h.split('#')[0]);
      const { violations } = await new AxeBuilder({ page }).setLegacyMode().analyze();
      assert.deepEqual(violations.map((v) => `${p} ${v.id} ${v.nodes[0].html}`), []);
      if (process.env.SHOTS) {
        await page.locator('img').evaluateAll((l) => l.forEach((i) => (i.loading = 'eager')));
        await page.waitForTimeout(150);
        fs.mkdirSync('test-results', { recursive: true });
        await page.screenshot({ fullPage: true, path: `test-results/${(p || 'home').replace(/\//g, '_')}-${colorScheme}-${width}.png` });
      }
    }
    assert.deepEqual(problems, []);
    await ctx.close();
  }
for (const l of links)
  if (l.startsWith(origin)) assert.equal((await fetch(l)).status, 200, l);

// Demo: a real copy lands in the deck; text outside the sheet does not.
const ctx = await browser.newContext({ locale: 'en-US' });
const page = await ctx.newPage();
await page.goto(root);
const cards = page.locator('.deck li');
await page.locator('#sample').evaluate((e) => getSelection().selectAllChildren(e));
await page.keyboard.press('Control+c');
assert.equal(await cards.count(), 1);
assert.match(await cards.first().innerText(), /Scissor switches[\s\S]*reviews\.example/);
await page.locator('h1').evaluate((e) => getSelection().selectAllChildren(e));
await page.keyboard.press('Control+c');
assert.equal(await cards.count(), 1);
await page.click('#show');
assert.equal(await cards.count(), 2);
// Language choice survives: German visitor is redirected, but may pick English.
const de = await browser.newContext({ locale: 'de-AT' });
const g = await de.newPage();
await g.goto(root);
await g.waitForURL(root + 'de/');
await g.click('.langs summary');
await g.click('.langs a[hreflang=en]');
await g.waitForTimeout(500);
assert.equal(g.url(), root);
await g.click('nav a[href$="privacy/"]');
await g.click('.langs summary');
await g.click('.langs a[hreflang=fr]');
await g.waitForURL(root + 'fr/privacy/');
await browser.close();
srv.close();
console.log(`OK: ${pages.length} pages x 4 variants, ${links.size} links, demo and language switch`);
