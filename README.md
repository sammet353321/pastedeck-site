# PasteDeck website

Static site in English, Turkish, German, Spanish and French. No framework, no dependencies, no cookies, no third-party resources.

## Publish

Hosted on Cloudflare Pages, connected to this GitHub repository: every push to `main` builds and publishes the site.

Cloudflare settings: production branch `main`, framework preset None, build command `npm run build`, output directory `dist`, project name `pastedeck-app`. If the project gets another address or a custom domain, change `siteUrl` in `config.mjs`.

`dist/_headers` sets the security headers on Cloudflare Pages.

## Connect the extension

In the `PasteDeck` folder copy `.env.example` to `.env`, set `WXT_SITE_URL` to the same address and run `npm run zip`. From then on the extension opens `welcome/` after installation and shows links to the site.

## Edit texts

`content/<language>.mjs`. The build fails if a language misses a text. Screenshots come from `npm run build && node scripts/screenshots.mjs` in the extension project.

## Test

`npm test` (uses Playwright and axe installed in `../PasteDeck`).

Font: Schibsted Grotesk, SIL Open Font License 1.1 (`assets/FONT-LICENSE.txt`).
