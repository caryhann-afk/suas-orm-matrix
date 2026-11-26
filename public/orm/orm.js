/* sUAS ORM Matrix — form definition, scoring, and PDF overlay.
   Coordinates are in PDF points measured from the TOP of the page (letter, 612x792). */
(function (root) {
  'use strict';

  const PAGE_H = 792;

  // Column x-ranges on the original form
  const COL = {
    hazard: [32.4, 153.8],
    low: [153.8, 267.0], lowP: [267.0, 297.2],
    mod: [297.2, 407.2], modP: [407.2, 438.9],
    high: [438.9, 544.5], highP: [544.5, 577.7],
  };

  // Each factor: label, row [top, bottom], options [level, text, pts, optional sub-row]
  const SECTIONS = [
    { name: 'Team', factors: [
      { id: 'coa', label: 'COA Required', row: [189.7, 203.1], opts: [
        ['low', 'None', 0], ['mod', 'Night / BVLOS', 2], ['high', 'Over people / dropping obj.', 3]] },
      { id: 'picExp', label: 'Pilot PIC Experience', row: [203.1, 216.5], opts: [
        ['low', '50 hours or more', 0], ['mod', '20–50 hours', 1], ['high', '20 hours or less', 2]] },
      { id: 'teamSize', label: 'Team Size', row: [216.5, 230.0], opts: [
        ['low', '3 or more members', 0], ['mod', '2 members (UASMP/UAST)', 1], ['high', '1 member', 'NG']] },
      { id: 'teamRest', label: 'Team Rest', row: [230.0, 243.4], opts: [
        ['low', 'Rested', 1], ['mod', 'Some fatigue', 2], ['high', 'Tired', 'NG']] },
      { id: 'teamExp', label: 'Team Experience', row: [243.4, 256.8], opts: [
        ['low', '75%–100% qualified', 1], ['mod', '50%–74% qualified', 2], ['high', 'Under 50% qualified', 3]] },
      { id: 'currency', label: 'PIC Flight Currency', row: [256.8, 270.2], opts: [
        ['low', '>1 hour in last qtr', 0], ['mod', '0.1 to 1.0 hour', 2], ['high', '<0.1 hour in last qtr', 3]] },
      { id: 'vest', label: 'Reflective Vest', row: [270.2, 283.7], opts: [
        ['low', 'All outfitted', 0], ['high', 'All not outfitted', 'NG']] },
    ]},
    { name: 'Machine', factors: [
      { id: 'uasType', label: 'sUAS Type', row: [297.2, 310.6], opts: [
        ['low', 'Simple (GPS modes)', 1], ['mod', 'Simple (ATTI modes)', 2], ['high', 'Complex', 3]] },
      { id: 'maint', label: 'Maintenance', row: [310.6, 324.0], opts: [
        ['low', 'No known problems', 1], ['mod', 'Due for maintenance', 2], ['high', 'Cannot pass preflight', 'NG']] },
      { id: 'comms', label: 'Communications', row: [324.0, 337.4], opts: [
        ['low', 'VHF mobile & cell phone', 1], ['mod', 'Handheld VHF or cell', 2], ['high', 'No radio or cell phone', 'NG']] },
    ]},
    { name: 'Environment', factors: [
      { id: 'temp', label: 'Temperature (°F)', row: [351.0, 364.4], opts: [
        ['low', 'Between 45 and 80', 1], ['mod', 'Under 45, over 80', 2], ['high', 'Under 20, over 95', 3]] },
      { id: 'vis', label: 'Visibility', row: [364.4, 377.8], opts: [
        ['low', 'Over 3 SM', 0], ['mod', 'Less than 3 SM (w/COA)', 2], ['high', 'Less than 1 mile', 'NG']] },
      { id: 'wind', label: 'Wind, Including Gusts', row: [377.8, 404.7], opts: [
        ['low', '0–10 knots', 1], ['mod', '10–20 knots', 2],
        ['high', '20 to mfg maximum', 3, [377.8, 391.2]],
        ['high', 'Greater than mfg max', 6, [391.2, 404.7]]] },
      { id: 'precip', label: 'Precipitation', row: [404.7, 418.1], opts: [
        ['low', 'None', 0], ['mod', 'Rain / fog', 2], ['high', 'Heavy rain, sleet/snow', 3]] },
      { id: 'kp', label: 'Kp Index', row: [418.1, 431.6], opts: [
        ['low', '1 to 3', 1], ['mod', '3 to 6', 2], ['high', '7 or more', 'NG']] },
      { id: 'terrain', label: 'Terrain', row: [431.6, 454.4], opts: [
        ['low', 'Flat or low hills', 1], ['mod', 'Large hills, small mountains', 2], ['high', 'Large mountains, cliffs', 3]] },
    ]},
    { name: 'Mission', factors: [
      { id: 'complexity', label: 'Complexity', row: [468.0, 490.6], opts: [
        ['low', 'Simple tasks, no new technology', 1], ['mod', 'Complex tasks, no new technology', 2], ['high', 'Complex tasks, new technology', 3]] },
      { id: 'teams', label: '# of sUAS Teams in AOR', row: [490.6, 504.0], opts: [
        ['low', '1–2 teams', 1], ['mod', '3–4 teams', 2], ['high', 'Over 5 teams', 3]] },
      { id: 'aircraft', label: 'Aircraft in AOR', row: [504.0, 517.5], opts: [
        ['low', 'No aircraft in AOR', 1], ['mod', 'A/C in AOR w/coord', 2], ['high', 'A/C in AOR w/o coord', 3]] },
      { id: 'travel', label: 'Travel Estimate to Site', row: [517.5, 530.9], opts: [
        ['low', '50 miles or less', 1], ['mod', '51–100 miles', 2], ['high', 'Over 100 miles', 3]] },
      { id: 'traffic', label: 'Traffic to Site', row: [530.9, 544.3], opts: [
        ['low', 'Light to none (rural)', 1], ['mod', 'Moderate (city)', 2], ['high', 'Heavy (rush hour)', 3]] },
    ]},
  ];

  const FACTORS = SECTIONS.flatMap(s => s.factors);

  const RISK = {
    low:  { key: 'low',  label: 'LOW RISK',      range: '14–27', approval: 'Briefing Officer approval', row: [623.1, 644.6] },
    mod:  { key: 'mod',  label: 'MODERATE RISK', range: '28–37', approval: 'AOBD/OSC approval',          row: [644.6, 666.0] },
    high: { key: 'high', label: 'HIGH RISK',     range: '38–49', approval: 'Wing/CC, DO, DOU or IC approval', row: [666.0, 687.5] },
  };

  // Header cells: value box x-range and row
  const HEADER = {
    mission:   { x: [153.8, 297.2], row: [109.4, 122.9] },
    sortie:    { x: [354.4, 438.9], row: [109.4, 122.9] },
    date:      { x: [485.5, 577.7], row: [109.4, 122.9] },
    picName:   { x: [153.8, 297.2], row: [122.9, 136.3] },
    picCapid:  { x: [354.4, 438.9], row: [122.9, 136.3] },
    picInit:   { x: [485.5, 577.7], row: [122.9, 136.3] },
    aobdName:  { x: [153.8, 297.2], row: [136.3, 149.8] },
    aobdCapid: { x: [354.4, 438.9], row: [136.3, 149.8] },
    aobdInit:  { x: [485.5, 577.7], row: [136.3, 149.8] },
  };

  const TOTALS_ROW = [544.3, 557.8];
  const FINAL_BOX = { x: [127.2, 153.6], row: [559.0, 578.6] };
  const SIG_COL = [267.0, 485.9];
  const SIGDATE_COL = [485.9, 577.7];
  const ASSESS_COL = [32.4, 267.0];

  function score(sel) {
    const totals = { low: 0, mod: 0, high: 0 };
    let ng = [], answered = 0;
    for (const f of FACTORS) {
      const i = sel[f.id];
      if (i === undefined || i === null || !f.opts[i]) continue;
      answered++;
      const [lvl, , pts] = f.opts[i];
      if (pts === 'NG') ng.push(f.label); else totals[lvl] += pts;
    }
    const total = totals.low + totals.mod + totals.high;
    let risk = null;
    if (answered === FACTORS.length && !ng.length) {
      risk = total <= 27 ? 'low' : total <= 37 ? 'mod' : 'high';
    }
    return { totals, total, ng, answered, count: FACTORS.length, complete: answered === FACTORS.length, risk, over: total > 49 };
  }

  const COLORS = {
    low:  [0.55, 0.88, 0.55],
    mod:  [1.00, 0.86, 0.30],
    high: [1.00, 0.55, 0.45],
    ng:   [0.90, 0.25, 0.25],
  };

  function fmtDate(iso) {
    if (!iso) return '';
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return iso;
    const mon = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][+m[2] - 1];
    return `${+m[3]} ${mon} ${m[1].slice(2)}`;
  }

  /* data: { header:{...}, sel:{factorId: optIndex}, approval:{ row:'low'|'mod'|'high'|'' , date, name, phone:bool },
             images:{ picInit, aobdInit, approvalSig } (PNG data URLs or Uint8Array) } */
  async function buildPdf(PDFLib, templateBytes, data) {
    const { PDFDocument, rgb, StandardFonts, BlendMode } = PDFLib;
    const doc = await PDFDocument.load(templateBytes);
    const page = doc.getPages()[0];
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const Y = t => PAGE_H - t;
    const inset = 0.9;

    const fill = (x, row, color, opacity) => page.drawRectangle({
      x: x[0] + inset, y: Y(row[1]) + inset, width: x[1] - x[0] - 2 * inset, height: row[1] - row[0] - 2 * inset,
      color: rgb(...color), opacity, borderWidth: 0, blendMode: BlendMode.Multiply,
    });

    const text = (str, x, row, opts = {}) => {
      if (str === undefined || str === null || str === '') return;
      str = String(str);
      const f = opts.bold ? bold : font;
      let size = opts.size || 8.5;
      const maxW = x[1] - x[0] - 4;
      while (size > 5 && f.widthOfTextAtSize(str, size) > maxW) size -= 0.25;
      const w = f.widthOfTextAtSize(str, size);
      const h = row[1] - row[0];
      const tx = opts.align === 'left' ? x[0] + 3 : x[0] + (x[1] - x[0] - w) / 2;
      const ty = Y(row[1]) + (h - size * 0.72) / 2;
      page.drawText(str, { x: tx, y: ty, size, font: f, color: opts.color ? rgb(...opts.color) : rgb(0, 0, 0.45) });
    };

    const image = async (src, x, row, pad = 1.5) => {
      if (!src) return;
      let bytes = src;
      if (typeof src === 'string') bytes = dataUrlToBytes(src);
      const img = await doc.embedPng(bytes);
      const bw = x[1] - x[0] - 2 * pad, bh = row[1] - row[0] - 2 * pad;
      const s = Math.min(bw / img.width, bh / img.height);
      const w = img.width * s, h = img.height * s;
      page.drawImage(img, { x: x[0] + pad + (bw - w) / 2, y: Y(row[1]) + pad + (bh - h) / 2, width: w, height: h });
    };

    // Header
    const h = data.header || {};
    text(h.mission, HEADER.mission.x, HEADER.mission.row, { align: 'left' });
    text(h.sortie, HEADER.sortie.x, HEADER.sortie.row);
    text(fmtDate(h.date), HEADER.date.x, HEADER.date.row);
    text(h.picName, HEADER.picName.x, HEADER.picName.row, { align: 'left' });
    text(h.picCapid, HEADER.picCapid.x, HEADER.picCapid.row);
    text(h.aobdName, HEADER.aobdName.x, HEADER.aobdName.row, { align: 'left' });
    text(h.aobdCapid, HEADER.aobdCapid.x, HEADER.aobdCapid.row);
    const imgs = data.images || {};
    if (imgs.picInit) await image(imgs.picInit, HEADER.picInit.x, HEADER.picInit.row, 1);
    else text(h.picInit, HEADER.picInit.x, HEADER.picInit.row, { bold: true });
    if (imgs.aobdInit) await image(imgs.aobdInit, HEADER.aobdInit.x, HEADER.aobdInit.row, 1);
    else text(h.aobdInit, HEADER.aobdInit.x, HEADER.aobdInit.row, { bold: true });

    // Matrix selections — color code the chosen cell and its points
    const sel = data.sel || {};
    for (const f of FACTORS) {
      const i = sel[f.id];
      if (i === undefined || i === null || !f.opts[i]) continue;
      const [lvl, , pts, sub] = f.opts[i];
      const row = sub || f.row;
      const isNg = pts === 'NG';
      const c = isNg ? COLORS.ng : COLORS[lvl];
      const op = 1;
      fill(COL[lvl], row, c, op);
      fill(COL[lvl + 'P'], row, c, op);
      // tint the hazard label lightly too so the row is easy to scan
      fill(COL.hazard, f.row, c, 0.3);
    }

    // Totals and final score
    const r = score(sel);
    const anySel = r.answered > 0;
    if (anySel) {
      text(r.totals.low, COL.lowP, TOTALS_ROW, { bold: true });
      text(r.totals.mod, COL.modP, TOTALS_ROW, { bold: true });
      text(r.totals.high, COL.highP, TOTALS_ROW, { bold: true });
    }
    if (r.ng.length) {
      fill(FINAL_BOX.x, FINAL_BOX.row, [0.75,0.05,0.08], 1);
      text('N/G', FINAL_BOX.x, FINAL_BOX.row, { bold: true, size: 10, color: [1, 1, 1] });
    } else if (r.complete) {
      fill(FINAL_BOX.x, FINAL_BOX.row, COLORS[r.risk], 1);
      text(r.total, FINAL_BOX.x, FINAL_BOX.row, { bold: true, size: 11, color: [0, 0, 0] });
    } else if (anySel) {
      text(r.total, FINAL_BOX.x, FINAL_BOX.row, { bold: true, size: 11 });
    }

    // Overall assessment: highlight the applicable band
    if (r.risk) fill(ASSESS_COL, RISK[r.risk].row, COLORS[r.risk], 1);

    // Approval signature
    const ap = data.approval || {};
    const apRow = ap.row && RISK[ap.row] ? RISK[ap.row].row : null;
    if (apRow && !r.ng.length) {
      if (imgs.approvalSig) {
        const sigX = ap.name ? [SIG_COL[0], SIG_COL[0] + 140] : SIG_COL;
        await image(imgs.approvalSig, sigX, apRow, 1.5);
      } else if (ap.phone) {
        text('PHONE APPROVAL – SIGNATURE TO FOLLOW', [SIG_COL[0], ap.name ? SIG_COL[0] + 140 : SIG_COL[1]], apRow, { size: 7, bold: true });
      }
      if (ap.name) text(ap.name, [SIG_COL[0] + 140, SIG_COL[1]], apRow, { size: 7 });
      text(fmtDate(ap.date), SIGDATE_COL, apRow);
    }

    return doc.save();
  }

  function dataUrlToBytes(url) {
    const b64 = url.split(',')[1];
    if (typeof atob === 'function') {
      const bin = atob(b64); const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    }
    return Uint8Array.from(Buffer.from(b64, 'base64'));
  }

  const api = { SECTIONS, FACTORS, RISK, score, buildPdf, fmtDate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ORM = api;
})(typeof window !== 'undefined' ? window : globalThis);
