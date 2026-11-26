(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const LVL = { low: 'Low', mod: 'Moderate', high: 'High' };
  const STORE = 'orm-draft-v1', PROFILE = 'orm-profile-v1';
  const HEADER_IDS = ['mission', 'sortie', 'date', 'picName', 'picCapid', 'picInit', 'aobdName', 'aobdCapid', 'aobdInit'];
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(navigator.userAgent);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // ---------- state ----------
  let state = load(STORE) || blankState();
  function blankState() {
    const prof = load(PROFILE) || {};
    return {
      header: { date: today(), picName: prof.picName || '', picCapid: prof.picCapid || '', picInit: prof.picInit || '',
                aobdName: prof.aobdName || '', aobdCapid: prof.aobdCapid || '', aobdInit: prof.aobdInit || '' },
      sel: {},
      approval: { row: 'auto', name: '', date: '', phone: false },
      images: { picInit: prof.picInitImg || null, aobdInit: prof.aobdInitImg || null, approvalSig: null },
      remember: !!prof.remember,
    };
  }
  function load(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* storage full or blocked */ }
    if (state.remember) {
      const h = state.header;
      try {
        localStorage.setItem(PROFILE, JSON.stringify({ remember: true, picName: h.picName, picCapid: h.picCapid, picInit: h.picInit,
          aobdName: h.aobdName, aobdCapid: h.aobdCapid, aobdInit: h.aobdInit,
          picInitImg: state.images.picInit, aobdInitImg: state.images.aobdInit }));
      } catch (e) {}
    }
    invalidatePdf();
  }

  // ---------- build matrix UI ----------
  function buildMatrix() {
    const host = $('#matrix');
    host.innerHTML = '';
    ORM.SECTIONS.forEach(sec => {
      const card = document.createElement('section');
      card.className = 'card';
      card.innerHTML = `<div class="section-title"><h2>${sec.name}</h2><span class="sec-pts"></span></div>`;
      sec.factors.forEach(f => {
        const div = document.createElement('div');
        div.className = 'factor';
        div.id = 'f-' + f.id;
        div.innerHTML = `<div class="f-label"><span>${f.label}</span><span class="f-pts"></span></div>`;
        const opts = document.createElement('div');
        opts.className = 'opts' + (f.opts.length === 4 ? ' four' : '');
        f.opts.forEach((o, i) => {
          const [lvl, text, pts] = o;
          // reflective vest has no moderate option: keep the 3-column alignment on wide screens
          if (f.opts.length === 2 && i === 1) {
            const ph = document.createElement('div'); ph.className = 'opt placeholder'; opts.appendChild(ph);
          }
          const b = document.createElement('button');
          b.type = 'button';
          b.className = `opt ${lvl}` + (pts === 'NG' ? ' ngopt' : '');
          b.dataset.f = f.id; b.dataset.i = i;
          b.setAttribute('aria-pressed', 'false');
          b.innerHTML = `<span><span class="lvl">${LVL[lvl]}</span>${text}</span><span class="pts">${pts === 'NG' ? 'N/G' : pts}</span>`;
          opts.appendChild(b);
        });
        div.appendChild(opts);
        card.appendChild(div);
      });
      host.appendChild(card);
    });
    host.addEventListener('click', e => {
      const b = e.target.closest('.opt[data-f]');
      if (!b) return;
      const id = b.dataset.f, i = +b.dataset.i;
      state.sel[id] = state.sel[id] === i ? undefined : i;
      if (state.sel[id] === undefined) delete state.sel[id];
      $('#f-' + id).classList.remove('missing');
      save(); render();
    });
  }

  // ---------- render ----------
  function render() {
    const r = ORM.score(state.sel);
    $$('.opt[data-f]').forEach(b => {
      const on = state.sel[b.dataset.f] === +b.dataset.i;
      b.classList.toggle('sel', on);
      b.setAttribute('aria-pressed', on);
    });
    ORM.FACTORS.forEach(f => {
      const i = state.sel[f.id];
      const el = $('#f-' + f.id + ' .f-pts');
      el.textContent = i === undefined ? '' : (f.opts[i][2] === 'NG' ? 'N/G' : f.opts[i][2] + ' pts');
    });

    // Score bar
    const bar = $('#scorebar');
    bar.className = 'scorebar';
    $('#tLow').textContent = r.totals.low; $('#tMod').textContent = r.totals.mod; $('#tHigh').textContent = r.totals.high;
    $('#scoreSub').textContent = `${r.answered} of ${r.count} answered`;
    if (r.ng.length) {
      bar.classList.add('ng');
      $('#scoreNum').textContent = 'N/G';
      $('#scoreRisk').textContent = 'NO-GO — sortie not authorized';
    } else if (r.complete) {
      bar.classList.add(r.risk);
      $('#scoreNum').textContent = r.total;
      $('#scoreRisk').textContent = ORM.RISK[r.risk].label + (r.over ? ' (exceeds 49)' : '');
      $('#scoreSub').textContent = ORM.RISK[r.risk].approval;
    } else {
      $('#scoreNum').textContent = r.answered ? r.total : '—';
      $('#scoreRisk').textContent = r.answered ? 'In progress' : 'Not started';
    }

    // Risk bands
    $('#riskBands').innerHTML = Object.values(ORM.RISK).map(b =>
      `<div class="band ${b.key} ${r.risk === b.key ? 'on' : ''}"><span>${b.label} = ${b.range}</span><b>${b.approval}</b></div>`).join('');
    const ng = $('#ngNotice');
    if (r.ng.length) {
      ng.hidden = false;
      ng.innerHTML = `<b>N/G scored:</b> ${r.ng.join(', ')}. No sortie is authorized under these conditions. Change the team or conditions to bring every factor within limits before release.`;
    } else if (r.over) {
      ng.hidden = false;
      ng.innerHTML = `<b>Score ${r.total} exceeds the matrix maximum of 49.</b> This is beyond the published high-risk band; reduce risk before requesting approval.`;
    } else ng.hidden = true;

    // Images
    ['picInit', 'aobdInit', 'approvalSig'].forEach(k => {
      const img = $('#img-' + k), src = state.images[k];
      img.hidden = !src; if (src) img.src = src; else img.removeAttribute('src');
    });
    $('#sigEmpty').hidden = !!state.images.approvalSig;
  }

  // ---------- header / approval inputs ----------
  function bindInputs() {
    HEADER_IDS.forEach(k => {
      const el = $('#h-' + k);
      el.value = state.header[k] || '';
      el.addEventListener('input', () => {
        state.header[k] = (k === 'picInit' || k === 'aobdInit') ? el.value.toUpperCase() : el.value;
        if (k === 'picInit' || k === 'aobdInit') el.value = state.header[k];
        save();
      });
    });
    // Auto-fill initials from name if empty
    [['picName', 'picInit'], ['aobdName', 'aobdInit']].forEach(([n, i]) => {
      $('#h-' + n).addEventListener('blur', () => {
        if (state.header[i]) return;
        const GRADES = /^(1st|2nd|lt|capt|maj|col|gen|brig|sm|fo|tfo|sfo|cfo|c\/.*|mr|mrs|ms|dr|cmsgt|smsgt|msgt|tsgt|ssgt|sra|amn|ama)\.?$/i;
        const words = state.header[n].split(/\s+/).filter(Boolean);
        while (words.length > 2 && GRADES.test(words[0])) words.shift();
        if (words.length === 2 && GRADES.test(words[0])) words.shift();
        for (let j = words.length - 1; j >= 0; j--) if (!/^[A-Za-z]/.test(words[j])) words.splice(j, 1);
        if (words.length >= 2) {
          state.header[i] = words.map(w => w[0].toUpperCase()).join('').slice(0, 3);
          $('#h-' + i).value = state.header[i]; save();
        }
      });
    });
    const ap = state.approval;
    $('#ap-row').value = ap.row || 'auto';
    $('#ap-name').value = ap.name || '';
    $('#ap-date').value = ap.date || '';
    $('#ap-phone').checked = !!ap.phone;
    $('#ap-row').addEventListener('change', e => { ap.row = e.target.value; save(); });
    $('#ap-name').addEventListener('input', e => { ap.name = e.target.value; save(); });
    $('#ap-date').addEventListener('input', e => { ap.date = e.target.value; save(); });
    $('#ap-phone').addEventListener('change', e => { ap.phone = e.target.checked; save(); });
    $('#rememberMe').checked = !!state.remember;
    $('#rememberMe').addEventListener('change', e => {
      state.remember = e.target.checked;
      if (!state.remember) localStorage.removeItem(PROFILE);
      save();
    });
    $('#sigClear').addEventListener('click', () => { state.images.approvalSig = null; save(); render(); });
    ['picInit', 'aobdInit'].forEach(k => $('#img-' + k).addEventListener('click', () => {
      if (confirm('Remove drawn initials?')) { state.images[k] = null; save(); render(); }
    }));
  }

  // ---------- signature pad ----------
  const pad = $('#pad'), ctx = pad.getContext('2d');
  let target = null, drawing = false, last = null, inked = false, bounds = null;
  const TITLES = { picInit: 'PIC initials', aobdInit: 'AOBD initials', approvalSig: 'Approval signature' };

  function openPad(k) {
    target = k;
    $('#sigTitle').textContent = TITLES[k];
    $('#sigHelp').textContent = k === 'approvalSig'
      ? 'Sign with your finger, stylus or mouse. Turn your phone sideways for more room.'
      : 'Write initials with your finger, stylus or mouse.';
    $('#sigModal').hidden = false;
    requestAnimationFrame(sizePad);
  }
  function sizePad() {
    const r = pad.getBoundingClientRect(), dpr = Math.max(window.devicePixelRatio || 1, 2);
    pad.width = Math.round(r.width * dpr); pad.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0d1d4f';
    clearPad();
  }
  function clearPad() { ctx.clearRect(0, 0, pad.width, pad.height); inked = false; bounds = null; }
  function pt(e) { const r = pad.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, p: e.pressure || 0.5 }; }
  function grow(p) {
    const w = 6;
    if (!bounds) bounds = { x0: p.x - w, y0: p.y - w, x1: p.x + w, y1: p.y + w };
    else { bounds.x0 = Math.min(bounds.x0, p.x - w); bounds.y0 = Math.min(bounds.y0, p.y - w); bounds.x1 = Math.max(bounds.x1, p.x + w); bounds.y1 = Math.max(bounds.y1, p.y + w); }
  }
  pad.addEventListener('pointerdown', e => {
    e.preventDefault(); pad.setPointerCapture(e.pointerId);
    drawing = true; last = pt(e); grow(last);
    ctx.beginPath(); ctx.arc(last.x, last.y, 1.3, 0, Math.PI * 2); ctx.fillStyle = '#0d1d4f'; ctx.fill(); inked = true;
  });
  pad.addEventListener('pointermove', e => {
    if (!drawing) return; e.preventDefault();
    const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of events) {
      const p = pt(ev);
      const mid = { x: (last.x + p.x) / 2, y: (last.y + p.y) / 2 };
      ctx.lineWidth = e.pointerType === 'pen' ? 1.2 + p.p * 2.2 : 2.6;
      ctx.beginPath(); ctx.moveTo(last.mx ?? last.x, last.my ?? last.y);
      ctx.quadraticCurveTo(last.x, last.y, mid.x, mid.y); ctx.stroke();
      p.mx = mid.x; p.my = mid.y; last = p; grow(p);
    }
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => pad.addEventListener(t, () => { drawing = false; }));

  function exportPad() {
    const dpr = pad.width / pad.getBoundingClientRect().width;
    const b = bounds;
    const x = Math.max(0, Math.floor(b.x0 * dpr)), y = Math.max(0, Math.floor(b.y0 * dpr));
    const w = Math.min(pad.width - x, Math.ceil((b.x1 - b.x0) * dpr)), h = Math.min(pad.height - y, Math.ceil((b.y1 - b.y0) * dpr));
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').drawImage(pad, x, y, w, h, 0, 0, w, h);
    return c.toDataURL('image/png');
  }
  $('#padClear').addEventListener('click', clearPad);
  $('#sigCancel').addEventListener('click', () => { $('#sigModal').hidden = true; });
  $('#padSave').addEventListener('click', () => {
    if (!inked) { toast('Draw first, or close to cancel.'); return; }
    state.images[target] = exportPad();
    if (target === 'approvalSig' && !state.approval.date) {
      state.approval.date = state.header.date || today(); $('#ap-date').value = state.approval.date;
    }
    $('#sigModal').hidden = true; save(); render();
  });
  document.addEventListener('click', e => { const b = e.target.closest('[data-sign]'); if (b) openPad(b.dataset.sign); });
  window.addEventListener('resize', () => { if (!$('#sigModal').hidden && !inked) sizePad(); });

  // ---------- PDF ----------
  let template = null, pdfCache = null, pdfTimer = null;
  async function getTemplate() {
    if (!template) template = await fetch('form.pdf').then(r => { if (!r.ok) throw new Error('Could not load form'); return r.arrayBuffer(); });
    return template;
  }
  function invalidatePdf() {
    pdfCache = null;
    clearTimeout(pdfTimer);
    pdfTimer = setTimeout(() => makePdf().catch(() => {}), 500); // pre-build so Share stays within the tap gesture
  }
  function pdfData() {
    const r = ORM.score(state.sel);
    const ap = state.approval;
    let row = ap.row === 'auto' ? r.risk : ap.row === 'none' ? null : ap.row;
    return {
      header: state.header, sel: state.sel, images: state.images,
      approval: { row, name: ap.name, date: ap.date, phone: ap.phone },
    };
  }
  async function makePdf() {
    if (pdfCache) return pdfCache;
    const bytes = await ORM.buildPdf(PDFLib, (await getTemplate()).slice(0), pdfData());
    pdfCache = bytes;
    return bytes;
  }
  function fileName() {
    const h = state.header;
    const parts = ['sUAS_ORM', h.mission, h.sortie, h.date].filter(Boolean).map(s => String(s).replace(/[^\w.-]+/g, '-'));
    return parts.join('_') + '.pdf';
  }
  function checkReady() {
    const r = ORM.score(state.sel);
    if (!r.complete) {
      const missing = ORM.FACTORS.filter(f => state.sel[f.id] === undefined);
      missing.forEach(f => $('#f-' + f.id).classList.add('missing'));
      toast(`${missing.length} item${missing.length > 1 ? 's' : ''} not answered — PDF made with blanks.`);
    }
  }
  const blobUrl = bytes => URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));

  async function doDownload() {
    checkReady();
    const bytes = await makePdf();
    if (isIOS && standalone && canShareFiles()) return doShare(bytes);
    const a = document.createElement('a');
    a.href = blobUrl(bytes); a.download = fileName();
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 30000);
  }
  function canShareFiles() {
    try { return !!(navigator.canShare && navigator.canShare({ files: [new File([new Uint8Array(1)], 'x.pdf', { type: 'application/pdf' })] })); }
    catch (e) { return false; }
  }
  async function doShare(pre) {
    if (!pre) checkReady();
    const bytes = pre || await makePdf();
    const file = new File([bytes], fileName(), { type: 'application/pdf' });
    try { await navigator.share({ files: [file], title: 'sUAS ORM Matrix' }); }
    catch (e) { if (e.name !== 'AbortError') toast('Sharing was blocked — tap again.'); }
  }
  async function doPrint() {
    checkReady();
    const bytes = await makePdf();
    if (isIOS || isAndroid) {
      // Mobile browsers can't print a PDF from a page; the share sheet has Print.
      if (canShareFiles()) { toast('Choose “Print” in the share sheet.'); return doShare(bytes); }
      window.open(blobUrl(bytes), '_blank'); return;
    }
    const url = blobUrl(bytes);
    let f = $('#printFrame');
    if (f) f.remove();
    f = document.createElement('iframe');
    f.id = 'printFrame';
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;';
    f.onload = () => setTimeout(() => {
      try { f.contentWindow.focus(); f.contentWindow.print(); }
      catch (e) { window.open(url, '_blank'); }
    }, 300);
    f.src = url;
    document.body.appendChild(f);
  }
  async function doPreview() {
    checkReady();
    const bytes = await makePdf();
    if (isAndroid) { toast('Opening PDF…'); return doDownload(); }
    $('#pvFrame').src = blobUrl(bytes);
    $('#pvModal').hidden = false;
  }
  const guard = fn => async () => {
    try { await fn(); } catch (e) { console.error(e); toast('Something went wrong making the PDF: ' + e.message); }
  };
  $('#downloadBtn').addEventListener('click', guard(doDownload));
  $('#printBtn').addEventListener('click', guard(doPrint));
  $('#previewBtn').addEventListener('click', guard(doPreview));
  $('#shareBtn').addEventListener('click', guard(() => doShare()));
  $('#pvClose').addEventListener('click', () => { $('#pvModal').hidden = true; $('#pvFrame').src = 'about:blank'; });
  if (canShareFiles()) $('#shareBtn').hidden = false;

  // ---------- misc ----------
  $('#scoreJump').addEventListener('click', () => {
    const f = ORM.FACTORS.find(f => state.sel[f.id] === undefined);
    const el = f ? $('#f-' + f.id) : $('#sec-approval');
    if (f) el.classList.add('missing');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  $('#newBtn').addEventListener('click', () => {
    if (!confirm('Start a new form? Selections, mission info and the approval signature will be cleared.')) return;
    const keepRemember = state.remember;
    state = blankState(); state.remember = keepRemember;
    if (!keepRemember) {
      // still carry over the people, since the same crew often flies several sorties
      const prev = load(STORE);
      if (prev) ['picName', 'picCapid', 'picInit', 'aobdName', 'aobdCapid', 'aobdInit'].forEach(k => state.header[k] = prev.header[k] || '');
    }
    save(); location.reload();
  });
  let toastT;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 3200);
  }

  // Install
  let deferred = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; $('#installBtn').hidden = false; });
  $('#installBtn').addEventListener('click', async () => {
    if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; $('#installBtn').hidden = true;
  });
  if (isIOS && !standalone && !localStorage.getItem('ios-hint-closed')) $('#iosHint').hidden = false;
  $('#iosHintClose').addEventListener('click', () => { $('#iosHint').hidden = true; localStorage.setItem('ios-hint-closed', '1'); });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  if (!state.header.date) state.header.date = today();
  buildMatrix(); bindInputs(); render(); invalidatePdf();
})();
