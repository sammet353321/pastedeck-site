# PasteDeck website

Static site in English, Turkish, German, Spanish and French. No framework, no dependencies, no cookies, no third-party resources.

## Publish

1. Fill in `config.mjs` (`siteUrl`, `contactEmail`; `storeUrl` once the extension is published).
2. `npm run build`
3. Upload the **contents of `dist/`** to your host (Cloudflare Pages, Netlify, GitHub Pages, ...).

`dist/_headers` sets security headers on Netlify and Cloudflare Pages. GitHub Pages ignores it; the pages then still carry the Content Security Policy as a meta tag, but not the clickjacking and HSTS headers.

## Automatic publishing

Push this folder to a public GitHub repository and choose Settings, Pages, Source: GitHub Actions. Every push to `main` then publishes the site; the address is filled in automatically.

## Connect the extension

In the `PasteDeck` folder copy `.env.example` to `.env`, set `WXT_SITE_URL` to the same address and run `npm run zip`. From then on the extension opens `welcome/` after installation and shows links to the site.

## Edit texts

`content/<language>.mjs`. The build fails if a language misses a text. Screenshots come from `npm run build && node scripts/screenshots.mjs` in the extension project.

## Test

`npm test` (uses Playwright and axe installed in `../PasteDeck`).

Font: Schibsted Grotesk, SIL Open Font License 1.1 (`assets/FONT-LICENSE.txt`).
