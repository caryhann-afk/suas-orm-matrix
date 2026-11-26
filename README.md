# sUAS Forms

Installable web app (PWA) for CAP sUAS forms. Live at https://cap-suas-orm.pages.dev

Main page (`public/index.html`) links to each form; each form lives in its own folder.

## Forms
- `public/orm/` – **sUAS Operational Risk Management Matrix** (Revised 1 DEC 22)
- `public/f5u/` – **CAPF 70-5U sUAS Pilot Flight Evaluation** (1 DEC 22)
- `public/f109u/` – **CAPF 109U sUAS Sortie Flight Summary & Log** (NOV 18)
- `public/f91/` – **CAPF 70-91 Mission Pilot Checkout** (31 MAR 20)

The 70-5U, 109U and 70-91 run on a shared engine (`public/shared/engine.js`). Each form folder has `form.pdf` (the blank original)
and `def.js` (every field and its exact position on the page). To add a form: copy a folder, swap the PDF, write its `def.js`,
add a card to `public/index.html`, and list its files in `public/sw.js`.

- Tap-to-select every hazard factor, color-coded Low / Moderate / High / N/G
- Live running score, column totals, risk level and required approval authority
- N/G factors flagged as **NO-GO**
- Draw signatures and initials with finger, stylus or mouse
- Generates the **original CAP form** (exact layout) with the selections highlighted, totals, final score, signatures and dates
- Download, print, or share (iPhone share sheet → Print / Save to Files / Mail)
- Works offline after first load; everything stays on the device (localStorage)
- Installs on Windows/Mac (Chrome/Edge "Install"), Android, and iPhone/iPad (Safari → Share → Add to Home Screen)

## Deploy (Cloudflare Pages, connected to GitHub)
Static files only — no build step. Build command: none. Build output directory: `public`. Every push to `main` redeploys.

## Updating
When you change any file in `public/`, bump `VERSION` in `public/sw.js` (e.g. `orm-v2`) so installed copies refresh.

## Files
- `public/orm/form.pdf` – the blank CAP form used as the template
- `public/orm/orm.js` – factor definitions, scoring, and cell coordinates for drawing on the form
- `public/orm/app.js` – UI, signature pad, PDF download/print/share
- `public/vendor/pdf-lib.min.js` – PDF library (MIT)
