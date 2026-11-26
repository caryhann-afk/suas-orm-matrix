# sUAS ORM Matrix

Installable web app (PWA) for the CAP **Small Unmanned Aerial Systems Operational Risk Management Matrix** (Revised 1 DEC 22).

- Tap-to-select every hazard factor, color-coded Low / Moderate / High / N/G
- Live running score, column totals, risk level and required approval authority
- N/G factors flagged as **NO-GO**
- Draw signatures and initials with finger, stylus or mouse
- Generates the **original CAP form** (exact layout) with the selections highlighted, totals, final score, signatures and dates
- Download, print, or share (iPhone share sheet → Print / Save to Files / Mail)
- Works offline after first load; everything stays on the device (localStorage)
- Installs on Windows/Mac (Chrome/Edge "Install"), Android, and iPhone/iPad (Safari → Share → Add to Home Screen)

## Deploy (Cloudflare Workers, connected to GitHub)
Static assets only — no build step. `wrangler.jsonc` serves the `public/` folder.
Cloudflare dashboard → Workers & Pages → Create → Import a repository → pick this repo → Deploy.
Deploy command: `npx wrangler deploy` (default). Every push to `main` redeploys.

## Updating
When you change any file in `public/`, bump `VERSION` in `public/sw.js` (e.g. `orm-v2`) so installed copies refresh.

## Files
- `public/form.pdf` – the blank CAP form used as the template
- `public/orm.js` – factor definitions, scoring, and cell coordinates for drawing on the form
- `public/app.js` – UI, signature pad, PDF download/print/share
- `public/vendor/pdf-lib.min.js` – PDF library (MIT)
