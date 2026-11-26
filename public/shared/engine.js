/* sUAS Forms — shared engine. Builds the fill-in screen from window.FORM_DEF and draws the answers onto the original PDF. */
(function () {
  'use strict';
  const DEF = window.FORM_DEF;
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const KEY = 'suasforms:' + DEF.id;
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(navigator.userAgent);
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

  const SCALES = {
    suvnp: [['S', 'S', 'Satisfactory'], ['U', 'U', 'Unsatisfactory'], ['V', 'V', 'Verbally evaluated'], ['NP', 'NP', 'Not performed']],
    suvna: [['S', 'S', 'Satisfactory'], ['U', 'U', 'Unsatisfactory'], ['V', 'V', 'Verbally briefed'], ['NA', 'N/A', 'Not applicable']],
  };
  const GCLASS = { S: 'gs', U: 'gu', V: 'gv', NP: 'gn', NA: 'gn' };
  // CAP grades (CAPR 35-5 abbreviations)
  const CAP_GRADES = [
    ['Senior member — officer', ['2d Lt', '1st Lt', 'Capt', 'Maj', 'Lt Col', 'Col', 'Brig Gen', 'Maj Gen']],
    ['Senior member — flight officer', ['FO', 'TFO', 'SFO']],
    ['Senior member — NCO', ['SSgt', 'TSgt', 'MSgt', 'SMSgt', 'CMSgt']],
    ['Senior member — no grade', ['SM']],
    ['Cadet — airman', ['C/AB', 'C/Amn', 'C/A1C', 'C/SrA']],
    ['Cadet — NCO', ['C/SSgt', 'C/TSgt', 'C/MSgt', 'C/SMSgt', 'C/CMSgt']],
    ['Cadet — officer', ['C/2d Lt', 'C/1st Lt', 'C/Capt', 'C/Maj', 'C/Lt Col', 'C/Col']],
  ];
  // keys a field stores its value under (namegrade keeps grade and name separately)
  const keysOf = f => f.type === 'namegrade' ? [f.id + '_grade', f.id + '_name'] : [f.id];
  const GCOLOR = { S: [0.55, 0.88, 0.55], U: [1, 0.55, 0.45], V: [1, 0.86, 0.3], NP: [0.80, 0.82, 0.86], NA: [0.80, 0.82, 0.86] };
  const INK = [0, 0, 0.45];

  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function fmtDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return iso || '';
    return `${+m[3]} ${['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][+m[2] - 1]} ${m[1]}`;
  }

  // ---------- collect all fields ----------
  function sectionItems(sec, s) {
    if (!sec.repeat) return sec.items;
    const out = [];
    for (let n = 1; n <= sec.repeat.count; n++) out.push(...sec.repeat.items(n));
    return out;
  }
  const ALL = DEF.sections.flatMap(sec => sectionItems(sec));
  const GRADES = ALL.filter(f => f.type === 'grade');

  // ---------- state ----------
  function blank(prev) {
    const s = { v: {}, img: {}, shown: {} };
    ALL.forEach(f => {
      if (f.today) s.v[f.id] = today();
      if (f.remember && prev) keysOf(f).forEach(k => { if (prev.v[k]) s.v[k] = prev.v[k]; });
    });
    DEF.sections.forEach((sec, i) => { if (sec.repeat) s.shown[i] = 1; });
    return s;
  }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  let S = load() || blank(null);
  // older saves kept "name & grade" in one box — move it into the name box
  ALL.forEach(f => { if (f.type === 'namegrade' && S.v[f.id] && !S.v[f.id + '_name']) { S.v[f.id + '_name'] = S.v[f.id]; delete S.v[f.id]; } });
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} invalidate(); }

  // ---------- page chrome ----------
  document.title = `${DEF.code} · sUAS Forms`;
  document.body.innerHTML = `
  <header class="top"><div class="top-inner">
    <div class="title-wrap"><a class="home-btn" href="../" aria-label="Home — all sUAS Forms"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M3 11.2 12 4l9 7.2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 9.8V20h4.8v-5.6h3.4V20h4.8V9.8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg><span>Home</span></a>
      <div><div class="eyebrow">${esc(DEF.code)}</div><h1>${esc(DEF.title)}</h1></div></div>
    <div class="top-actions"><button id="newBtn" class="ghost">New form</button></div>
  </div></header>
  <main id="main"></main>
  <footer class="scorebar" id="bar" hidden></footer>
  <div class="modal" id="sigModal" hidden><div class="modal-card sig-card">
    <div class="modal-head"><h2 id="sigTitle">Sign</h2><button class="x" id="sigCancel" aria-label="Close">×</button></div>
    <p class="muted small-text" id="sigHelp">Sign with your finger, stylus or mouse. Turn your phone sideways for more room.</p>
    <div class="pad-wrap"><canvas id="pad"></canvas><div class="pad-line"></div></div>
    <div class="modal-foot"><button id="padClear">Clear</button><button id="padSave" class="primary">Use signature</button></div>
  </div></div>
  <div class="modal" id="pvModal" hidden><div class="modal-card pv-card">
    <div class="modal-head"><h2>Preview</h2><button class="x" id="pvClose" aria-label="Close">×</button></div>
    <iframe id="pvFrame" title="PDF preview"></iframe></div></div>
  <div class="toast" id="toast" hidden></div>`;

  // ---------- field renderers ----------
  function inputField(f) {
    const v = S.v[f.id] ?? '';
    const type = f.type === 'date' ? 'date' : f.type === 'time' ? 'time' : 'text';
    const im = f.inputmode ? ` inputmode="${f.inputmode}"` : '';
    return `<label class="fld${f.wide ? ' wide' : ''}">${esc(f.label)}<input data-id="${f.id}" type="${type}"${im} value="${esc(v)}" autocomplete="off"></label>`;
  }
  function textareaField(f) {
    return `<label class="fld wide">${esc(f.label)}<textarea data-id="${f.id}" rows="${f.rows || 4}">${esc(S.v[f.id] || '')}</textarea></label>`;
  }
  function checkField(f) {
    return `<button type="button" class="tog${S.v[f.id] ? ' on' : ''}" data-toggle="${f.id}"><span class="box"></span>${esc(f.label)}</button>`;
  }
  function endorseField(f) {
    const on = !!S.v[f.id];
    return `<div class="endorse"><button type="button" class="tog${on ? ' on' : ''}" data-toggle="${f.id}"><span class="box"></span>${esc(f.label)}</button>
      <input class="init" data-id="${f.id}_init" placeholder="Initials" maxlength="4" value="${esc(S.v[f.id + '_init'] || '')}"></div>`;
  }
  function radioField(f) {
    const cur = S.v[f.id];
    const opts = f.options.map(o => `<button type="button" class="ropt${cur === o.value ? ' on' : ''}" data-radio="${f.id}" data-val="${o.value}"><span class="dot"></span>${esc(o.label)}</button>`).join('');
    const init = f.initials ? `<label class="fld init-fld">Evaluator initials<input data-id="${f.id}_init" maxlength="4" value="${esc(S.v[f.id + '_init'] || '')}"></label>` : '';
    return `<div class="radio wide"><div class="rlabel">${esc(f.label)}</div><div class="ropts">${opts}</div>${init}</div>`;
  }
  function gradeField(f) {
    const cur = S.v[f.id];
    const btns = SCALES[f.scale].map(([k, txt, title]) =>
      `<button type="button" class="gb ${GCLASS[k]}${cur === k ? ' on' : ''}" data-grade="${f.id}" data-val="${k}" title="${title}" aria-pressed="${cur === k}">${txt}</button>`).join('');
    return `<div class="grow" id="g-${f.id}"><span class="glabel">${esc(f.label)}</span><span class="gbtns">${btns}</span></div>`;
  }
  function sigField(f) {
    const img = S.img[f.id];
    const unsat = f.unsatText ? `<button type="button" class="tog small-tog${S.v[f.id + '_unsat'] ? ' on' : ''}" data-toggle="${f.id}_unsat"><span class="box"></span>Unsatisfactory — print “UNSATISFACTORY” instead of a signature</button>` : '';
    return `<div class="sigfld wide"><div class="rlabel">${esc(f.label)}</div>
      <div class="sig-row"><div class="sig-box">${img ? `<img src="${img}" alt="">` : '<span>Not signed</span>'}</div>
      <div class="sig-actions"><button type="button" class="primary-outline" data-sign="${f.id}">Sign</button><button type="button" class="small" data-sigclear="${f.id}">Clear</button></div></div>${unsat}</div>`;
  }
  function nameGradeField(f) {
    const g = S.v[f.id + '_grade'] || '';
    const known = CAP_GRADES.some(([, list]) => list.includes(g));
    const opts = '<option value="">Select grade…</option>' + CAP_GRADES.map(([grp, list]) =>
      `<optgroup label="${esc(grp)}">${list.map(x => `<option${x === g ? ' selected' : ''}>${esc(x)}</option>`).join('')}</optgroup>`).join('')
      + (g && !known ? `<option selected>${esc(g)}</option>` : '');
    return `<div class="namegrade wide"><div class="rlabel">${esc(f.label)}</div><div class="ng-row">
      <label class="fld">Grade<select data-id="${f.id}_grade">${opts}</select></label>
      <label class="fld">Name<input data-id="${f.id}_name" value="${esc(S.v[f.id + '_name'] || '')}" autocomplete="name" placeholder="First M. Last"></label></div></div>`;
  }
  const RENDER = { namegrade: nameGradeField, text: inputField, date: inputField, time: inputField, textarea: textareaField, check: checkField,
    endorse: endorseField, radio: radioField, grade: gradeField, sig: sigField };

  function renderSection(sec, i) {
    const note = sec.note ? `<p class="note">${esc(sec.note)}</p>` : '';
    if (sec.repeat) {
      const r = sec.repeat, shown = S.shown[i] || 1;
      let cards = '';
      for (let n = 1; n <= shown; n++) {
        cards += `<div class="rep" id="rep-${i}-${n}"><h3>${r.noun} ${n}</h3><div class="fields">${r.items(n).map(f => RENDER[f.type](f)).join('')}</div></div>`;
      }
      return `<section class="card" data-sec="${i}"><h2>${esc(sec.title)}</h2>${note}${cards}
        <div class="rep-actions"><button type="button" class="primary-outline" data-add="${i}" ${shown >= r.count ? 'disabled' : ''}>+ Add ${r.noun.toLowerCase()} ${Math.min(shown + 1, r.count)}</button>
        ${shown > 1 ? `<button type="button" class="small" data-remove="${i}">Remove ${r.noun.toLowerCase()} ${shown}</button>` : ''}</div>
        <p class="muted small-text">${shown} of ${r.count} ${r.noun.toLowerCase()}s used. Aircraft number and model carry over to the next ${r.noun.toLowerCase()}.</p></section>`;
    }
    const isGrades = sec.items.every(f => f.type === 'grade');
    const quick = isGrades ? `<div class="quick">Mark all:${SCALES[sec.items[0].scale].map(([k, t]) => `<button type="button" class="gb ${GCLASS[k]} mini" data-all="${i}" data-val="${k}">${t}</button>`).join('')}<button type="button" class="small mini" data-all="${i}" data-val="">Clear</button></div>` : '';
    const body = isGrades ? sec.items.map(gradeField).join('') : `<div class="fields">${sec.items.map(f => RENDER[f.type](f)).join('')}</div>`;
    return `<section class="card" data-sec="${i}"><div class="sec-head"><h2>${esc(sec.title)}</h2>${quick}</div>${note}${body}</section>`;
  }

  function renderAll() {
    $('#main').innerHTML = DEF.sections.map(renderSection).join('') + `
      <section class="card"><h2>Get the completed form</h2>
        <p class="muted">Fills in the official ${esc(DEF.code)} exactly${GRADES.length ? ', color-coded,' : ''} with your signatures.</p>
        <div class="out-actions"><button id="previewBtn" class="primary">Preview</button><button id="downloadBtn">Download PDF</button>
        <button id="printBtn">Print</button><button id="shareBtn" ${canShareFiles() ? '' : 'hidden'}>Share / Save</button></div></section>
      <p class="foot muted">Works offline once loaded. Data stays on this device.</p>`;
    renderBar();
  }

  function renderBar() {
    const bar = $('#bar');
    if (!GRADES.length) { bar.hidden = true; document.body.classList.add('nobar'); return; }
    const c = { S: 0, U: 0, V: 0, NP: 0, NA: 0 }; let done = 0;
    GRADES.forEach(f => { const v = S.v[f.id]; if (v) { c[v]++; done++; } });
    const na = c.NP + c.NA;
    bar.hidden = false;
    bar.className = 'scorebar' + (c.U ? ' ng' : done === GRADES.length ? ' low' : '');
    bar.innerHTML = `<button class="score-main" id="jump"><span class="score-num">${done}<small>/${GRADES.length}</small></span>
      <span class="score-text"><span id="scoreRisk">${c.U ? `${c.U} unsatisfactory` : done === GRADES.length ? 'All items graded' : 'Grading in progress'}</span>
      <span class="score-sub">${done === GRADES.length ? 'Ready to sign' : `${GRADES.length - done} not graded — tap to jump`}</span></span></button>
      <div class="score-cols"><span class="pill low">S <b>${c.S}</b></span><span class="pill high">U <b>${c.U}</b></span><span class="pill mod">V <b>${c.V}</b></span><span class="pill na">${GRADES[0].scale === 'suvnp' ? 'NP' : 'N/A'} <b>${na}</b></span></div>`;
  }

  // ---------- events ----------
  const main = () => $('#main');
  document.addEventListener('change', e => {
    if (e.target.tagName === 'SELECT' && e.target.dataset.id) { S.v[e.target.dataset.id] = e.target.value; save(); }
  });
  document.addEventListener('input', e => {
    const id = e.target.dataset && e.target.dataset.id;
    if (!id) return;
    let val = e.target.value;
    if (/_init$/.test(id)) { val = val.toUpperCase(); e.target.value = val; }
    S.v[id] = val; save();
  });
  document.addEventListener('click', e => {
    const t = e.target.closest('button');
    if (!t) return;
    const d = t.dataset;
    if (d.toggle) { S.v[d.toggle] = !S.v[d.toggle]; t.classList.toggle('on', !!S.v[d.toggle]); save(); }
    else if (d.radio) {
      S.v[d.radio] = S.v[d.radio] === d.val ? '' : d.val;
      t.parentElement.querySelectorAll('.ropt').forEach(b => b.classList.toggle('on', b.dataset.val === S.v[d.radio])); save();
    }
    else if (d.grade) {
      S.v[d.grade] = S.v[d.grade] === d.val ? '' : d.val;
      t.parentElement.querySelectorAll('.gb').forEach(b => { const on = b.dataset.val === S.v[d.grade]; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      $('#g-' + d.grade).classList.remove('missing');
      save(); renderBar();
    }
    else if (d.all !== undefined) {
      const sec = DEF.sections[+d.all];
      sec.items.forEach(f => { S.v[f.id] = d.val; });
      save(); rerender();
    }
    else if (d.add !== undefined) {
      const i = +d.add, sec = DEF.sections[i], n = (S.shown[i] || 1) + 1;
      if (n > sec.repeat.count) return;
      const prev = sec.repeat.items(n - 1), next = sec.repeat.items(n);
      next.forEach((f, k) => { if (f.carry && !S.v[f.id] && S.v[prev[k].id]) S.v[f.id] = S.v[prev[k].id]; });
      S.shown[i] = n; save(); rerender();
      const el = document.getElementById(`rep-${i}-${n}`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    else if (d.remove !== undefined) {
      const i = +d.remove, n = S.shown[i];
      const items = DEF.sections[i].repeat.items(n);
      if (items.some(f => S.v[f.id]) && !confirm(`Remove ${DEF.sections[i].repeat.noun.toLowerCase()} ${n} and its entries?`)) return;
      items.forEach(f => delete S.v[f.id]);
      S.shown[i] = n - 1; save(); rerender();
    }
    else if (d.sign) openPad(d.sign);
    else if (d.sigclear) { delete S.img[d.sigclear]; save(); rerender(); }
    else if (t.id === 'jump') {
      const f = GRADES.find(f => !S.v[f.id]);
      if (f) { const el = $('#g-' + f.id); el.classList.add('missing'); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    }
    else if (t.id === 'previewBtn') guard(doPreview)();
    else if (t.id === 'downloadBtn') guard(doDownload)();
    else if (t.id === 'printBtn') guard(doPrint)();
    else if (t.id === 'shareBtn') guard(() => doShare())();
  });
  function rerender() { const y = scrollY; renderAll(); scrollTo(0, y); }

  $('#newBtn').addEventListener('click', () => {
    if (!confirm('Start a new form? Everything except your saved name, CAPID and certificate info will be cleared.')) return;
    S = blank(S); save(); rerender(); scrollTo(0, 0);
  });

  // ---------- signature pad ----------
  const pad = $('#pad'), ctx = pad.getContext('2d');
  let target = null, drawing = false, last = null, inked = false, bounds = null;
  function openPad(id) {
    target = id;
    const f = ALL.find(x => x.id === id);
    $('#sigTitle').textContent = f ? f.label : 'Sign';
    $('#sigModal').hidden = false;
    requestAnimationFrame(sizePad);
  }
  function sizePad() {
    const r = pad.getBoundingClientRect(), dpr = Math.max(devicePixelRatio || 1, 2);
    pad.width = Math.round(r.width * dpr); pad.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0d1d4f';
    ctx.clearRect(0, 0, pad.width, pad.height); inked = false; bounds = null;
  }
  const pt = e => { const r = pad.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, p: e.pressure || 0.5 }; };
  function grow(p) {
    const w = 6;
    if (!bounds) bounds = { x0: p.x - w, y0: p.y - w, x1: p.x + w, y1: p.y + w };
    else { bounds.x0 = Math.min(bounds.x0, p.x - w); bounds.y0 = Math.min(bounds.y0, p.y - w); bounds.x1 = Math.max(bounds.x1, p.x + w); bounds.y1 = Math.max(bounds.y1, p.y + w); }
  }
  pad.addEventListener('pointerdown', e => {
    e.preventDefault(); pad.setPointerCapture(e.pointerId); drawing = true; last = pt(e); grow(last);
    ctx.beginPath(); ctx.arc(last.x, last.y, 1.3, 0, Math.PI * 2); ctx.fillStyle = '#0d1d4f'; ctx.fill(); inked = true;
  });
  pad.addEventListener('pointermove', e => {
    if (!drawing) return; e.preventDefault();
    for (const ev of (e.getCoalescedEvents ? e.getCoalescedEvents() : [e])) {
      const p = pt(ev), mid = { x: (last.x + p.x) / 2, y: (last.y + p.y) / 2 };
      ctx.lineWidth = e.pointerType === 'pen' ? 1.2 + p.p * 2.2 : 2.6;
      ctx.beginPath(); ctx.moveTo(last.mx ?? last.x, last.my ?? last.y); ctx.quadraticCurveTo(last.x, last.y, mid.x, mid.y); ctx.stroke();
      p.mx = mid.x; p.my = mid.y; last = p; grow(p);
    }
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => pad.addEventListener(t, () => { drawing = false; }));
  $('#padClear').addEventListener('click', sizePad);
  $('#sigCancel').addEventListener('click', () => { $('#sigModal').hidden = true; });
  $('#padSave').addEventListener('click', () => {
    if (!inked) { toast('Draw first, or close to cancel.'); return; }
    const dpr = pad.width / pad.getBoundingClientRect().width, b = bounds;
    const x = Math.max(0, Math.floor(b.x0 * dpr)), y = Math.max(0, Math.floor(b.y0 * dpr));
    const w = Math.min(pad.width - x, Math.ceil((b.x1 - b.x0) * dpr)), h = Math.min(pad.height - y, Math.ceil((b.y1 - b.y0) * dpr));
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').drawImage(pad, x, y, w, h, 0, 0, w, h);
    S.img[target] = c.toDataURL('image/png');
    $('#sigModal').hidden = true; save(); rerender();
  });

  // ---------- PDF ----------
  let tpl = null, cache = null, timer = null;
  function invalidate() { cache = null; clearTimeout(timer); timer = setTimeout(() => makePdf().catch(() => {}), 600); }
  async function makePdf() {
    if (cache) return cache;
    if (!tpl) tpl = await fetch(DEF.pdf).then(r => { if (!r.ok) throw new Error('Could not load the blank form'); return r.arrayBuffer(); });
    cache = await buildPdf(window.PDFLib, tpl.slice(0), DEF, S);
    return cache;
  }

  async function buildPdf(PDFLib, bytes, def, st) {
    const { PDFDocument, rgb, StandardFonts, BlendMode, degrees } = PDFLib;
    const src = await PDFDocument.load(bytes);
    const out = await PDFDocument.create();
    const pages = [];
    for (const pg of def.pages) {
      if (pg.halves) {
        // Rebuild a landscape sheet from two half-pages of rotated booklet sheets, so pages read in order.
        const p = out.addPage([792, 612]);
        for (let h = 0; h < 2; h++) {
          const { src: si, side } = pg.halves[h];
          const sp = src.getPage(si);
          const bb = side === 'L' ? { left: 0, bottom: 0, right: 612, top: 396 } : { left: 0, bottom: 396, right: 612, top: 792 };
          const emb = await out.embedPage(sp, bb);
          p.drawPage(emb, { x: h * 396, y: 612, rotate: degrees(-90) });
        }
        pages.push(p);
      } else if (pg.rotate) {
        const [emb] = await out.embedPages([src.getPage(pg.src)]);
        const p = out.addPage([emb.height, emb.width]);
        p.drawPage(emb, { x: 0, y: emb.width, rotate: degrees(-90) });
        pages.push(p);
      } else {
        const [cp] = await out.copyPages(src, [pg.src]);
        pages.push(out.addPage(cp));
      }
    }
    const font = await out.embedFont(StandardFonts.Helvetica);
    const bold = await out.embedFont(StandardFonts.HelveticaBold);
    // Standard PDF fonts only cover Western characters; swap or drop anything else so the PDF never fails.
    const okChars = new Set(font.getCharacterSet());
    const SUB = { '\u2018': "'", '\u2019': "'", '\u201C': '"', '\u201D': '"', '\u2013': '-', '\u2014': '-', '\u2026': '...', '\u00A0': ' ' };
    const clean = str => Array.from(String(str)).map(ch => okChars.has(ch.codePointAt(0)) ? ch : (SUB[ch] ?? (ch === '\n' ? '\n' : ''))).join('');
    const P = i => pages[i];
    const Y = (i, t) => P(i).getHeight() - t;

    function text(i, box, str, o = {}) {
      if (str === undefined || str === null || str === '') return;
      str = clean(String(str)).replace(/\s+/g, ' ').trim();
      const f = o.bold ? bold : font;
      let size = o.size || 9;
      const maxW = box[2] - box[0] - 3;
      while (size > 5 && f.widthOfTextAtSize(str, size) > maxW) size -= 0.25;
      const h = box[3] - box[1], w = f.widthOfTextAtSize(str, size);
      const x = o.align === 'left' ? box[0] + 1.5 : box[0] + (box[2] - box[0] - w) / 2;
      const y = Y(i, box[3]) + (h - size * 0.72) / 2;
      P(i).drawText(str, { x, y, size, font: f, color: rgb(...(o.color || INK)) });
    }
    function wrap(str, f, size, maxW) {
      const lines = [];
      String(str).split(/\r?\n/).forEach(par => {
        let line = '';
        par.split(/\s+/).forEach(word => {
          const t = line ? line + ' ' + word : word;
          if (f.widthOfTextAtSize(t, size) <= maxW) line = t;
          else {
            if (line) lines.push(line);
            while (f.widthOfTextAtSize(word, size) > maxW && word.length > 1) {
              let k = word.length; while (k > 1 && f.widthOfTextAtSize(word.slice(0, k), size) > maxW) k--;
              lines.push(word.slice(0, k)); word = word.slice(k);
            }
            line = word;
          }
        });
        lines.push(line);
      });
      return lines;
    }
    function para(i, box, str, size0) {
      if (!str || !String(str).trim()) return;
      str = clean(str);
      const maxW = box[2] - box[0] - 4, maxH = box[3] - box[1] - 2;
      let size = size0 || 9, lines;
      for (;;) {
        lines = wrap(str, font, size, maxW);
        if (lines.length * size * 1.22 <= maxH || size <= 5.5) break;
        size -= 0.25;
      }
      const lh = size * 1.22;
      lines.forEach((ln, k) => {
        const yTop = box[1] + 1 + k * lh;
        if (yTop + size > box[3] + 1) return;
        P(i).drawText(ln, { x: box[0] + 2, y: Y(i, yTop + size * 0.85), size, font, color: rgb(...INK) });
      });
    }
    function xmark(i, b) {
      const ins = 1.2, c = rgb(...INK), t = 1.1;
      P(i).drawLine({ start: { x: b[0] + ins, y: Y(i, b[1] + ins) }, end: { x: b[2] - ins, y: Y(i, b[3] - ins) }, thickness: t, color: c });
      P(i).drawLine({ start: { x: b[0] + ins, y: Y(i, b[3] - ins) }, end: { x: b[2] - ins, y: Y(i, b[1] + ins) }, thickness: t, color: c });
    }
    function fill(i, b, color, inset = 0.6) {
      P(i).drawRectangle({ x: b[0] + inset, y: Y(i, b[3]) + inset, width: b[2] - b[0] - 2 * inset, height: b[3] - b[1] - 2 * inset,
        color: rgb(...color), borderWidth: 0, blendMode: BlendMode.Multiply });
    }
    async function image(i, b, dataUrl) {
      const bin = atob(dataUrl.split(',')[1]); const u8 = new Uint8Array(bin.length);
      for (let k = 0; k < bin.length; k++) u8[k] = bin.charCodeAt(k);
      const img = await out.embedPng(u8);
      const pad = 1.5, bw = b[2] - b[0] - 2 * pad, bh = b[3] - b[1] - 2 * pad;
      const s = Math.min(bw / img.width, bh / img.height), w = img.width * s, h = img.height * s;
      P(i).drawImage(img, { x: b[0] + pad + Math.min((bw - w) / 2, 6), y: Y(i, b[3]) + pad + (bh - h) / 2, width: w, height: h });
    }

    const v = st.v;
    for (const f of ALL) {
      const val = v[f.id];
      switch (f.type) {
        case 'text': case 'time': {
          let s = val; if (s && f.suffix && !String(s).trim().endsWith(f.suffix)) s = String(s).trim() + f.suffix;
          text(f.page, f.box, s, { align: f.align, size: f.size });
          break;
        }
        case 'date': text(f.page, f.box, fmtDate(val), { align: f.align, size: f.size }); break;
        case 'namegrade': text(f.page, f.box, [v[f.id + '_grade'], v[f.id + '_name']].filter(Boolean).join(' '), { align: f.align, size: f.size }); break;
        case 'textarea': para(f.page, f.box, val, f.size); break;
        case 'check': if (val) xmark(f.page, f.box); break;
        case 'endorse':
          if (val) xmark(f.page, f.box);
          if (v[f.id + '_init']) text(f.page, f.initBox, v[f.id + '_init'], { align: 'left', bold: true, size: 8 });
          break;
        case 'radio': {
          const o = f.options.find(o => o.value === val);
          if (o) { xmark(o.page, o.box); if (f.initials && v[f.id + '_init']) text(o.page, o.initBox, v[f.id + '_init'], { bold: true, size: 8.5 }); }
          break;
        }
        case 'grade': {
          if (!val) break;
          const scale = SCALES[f.scale], k = scale.findIndex(s => s[0] === val);
          if (f.boxes) { const [x, y, w] = f.boxes[k]; const b = [x, y, x + w, y + w]; fill(f.page, b, GCOLOR[val], 0.3); xmark(f.page, b); }
          else { fill(f.page, f.cell, GCOLOR[val]); text(f.page, f.cell, scale[k][1], { bold: true, size: 8.5, color: [0, 0, 0] }); }
          break;
        }
        case 'sig':
          if (f.unsatText && v[f.id + '_unsat']) text(f.page, f.box, 'UNSATISFACTORY', { bold: true, size: 11, color: [0.7, 0.05, 0.05] });
          else if (st.img[f.id]) await image(f.page, f.box, st.img[f.id]);
          break;
      }
    }
    return out.save();
  }
  window.__buildPdf = (PDFLib, bytes, state) => buildPdf(PDFLib, bytes, DEF, state); // used by tests

  // ---------- output ----------
  function fileName() { return (DEF.fileName(S.v) || DEF.code).replace(/[^\w.-]+/g, '-') + '.pdf'; }
  function canShareFiles() {
    try { return !!(navigator.canShare && navigator.canShare({ files: [new File([new Uint8Array(1)], 'x.pdf', { type: 'application/pdf' })] })); } catch (e) { return false; }
  }
  const blobUrl = b => URL.createObjectURL(new Blob([b], { type: 'application/pdf' }));
  function checkReady() {
    const missing = GRADES.filter(f => !S.v[f.id]);
    if (missing.length) { missing.forEach(f => { const el = $('#g-' + f.id); if (el) el.classList.add('missing'); }); toast(`${missing.length} item${missing.length > 1 ? 's' : ''} not graded — PDF made with blanks.`); }
  }
  async function doShare(pre) {
    if (!pre) checkReady();
    const bytes = pre || await makePdf();
    try { await navigator.share({ files: [new File([bytes], fileName(), { type: 'application/pdf' })], title: DEF.code }); }
    catch (e) { if (e.name !== 'AbortError') toast('Sharing was blocked — tap again.'); }
  }
  async function doDownload() {
    checkReady();
    const bytes = await makePdf();
    if (isIOS && standalone && canShareFiles()) return doShare(bytes);
    const a = document.createElement('a'); a.href = blobUrl(bytes); a.download = fileName();
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 30000);
  }
  async function doPrint() {
    checkReady();
    const bytes = await makePdf();
    if (isIOS || isAndroid) {
      if (canShareFiles()) { toast('Choose “Print” in the share sheet.'); return doShare(bytes); }
      open(blobUrl(bytes), '_blank'); return;
    }
    const url = blobUrl(bytes);
    let fr = $('#printFrame'); if (fr) fr.remove();
    fr = document.createElement('iframe'); fr.id = 'printFrame';
    fr.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;';
    fr.onload = () => setTimeout(() => { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { open(url, '_blank'); } }, 300);
    fr.src = url; document.body.appendChild(fr);
  }
  async function doPreview() {
    checkReady();
    const bytes = await makePdf();
    if (isAndroid) { toast('Opening PDF…'); return doDownload(); }
    $('#pvFrame').src = blobUrl(bytes); $('#pvModal').hidden = false;
  }
  $('#pvClose').addEventListener('click', () => { $('#pvModal').hidden = true; $('#pvFrame').src = 'about:blank'; });
  const guard = fn => async () => { try { await fn(); } catch (e) { console.error(e); toast('Could not make the PDF: ' + e.message); } };
  let tt;
  function toast(m) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => { t.hidden = true; }, 3200); }

  if ('serviceWorker' in navigator && location.protocol !== 'file:') addEventListener('load', () => navigator.serviceWorker.register('../sw.js', { scope: '../' }).catch(() => {}));

  renderAll(); invalidate();
})();
