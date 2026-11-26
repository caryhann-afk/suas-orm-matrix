/* CAPF 109U — sUAS Sortie Flight Summary / Imagery-Target Log (DEC 22).
   The original's pages are stored rotated; the app straightens them to landscape (792 x 612).
   Source page 1 = [Flights 1–6 (page 2) | Summary (page 1)]; source page 0 = [Flights 7–12 (page 3) | Flights 13–18 (page 4)].
   The PDF puts the Summary / Flights 1–6 sheet first, and adds the second sheet only when flights 7+ are logged.
   Coordinates: PDF points from the top-left of the straightened landscape page. */
(function () {
  // Each flight block has 4 rows: [Date | Description], [Pilot | Technician | Technician],
  // [No. of Images | Aircraft FAA Number | Aircraft Model], [Take Off | Landing | Minutes | Battery Number | Battery Remaining]
  const BLOCKS = [
    [53.5, 74.5, 93, 112, 131.5], [131.5, 153, 174, 195, 216], [216, 237.5, 258.5, 279.5, 300.5],
    [300.5, 321.5, 342.5, 364, 385], [385, 406, 427, 448.5, 469.5], [469.5, 490.5, 511.5, 532.5, 553.5]];
  // Column lines for the left half; the right half is the same grid 381.3 pt to the right
  const L = { a: 69.5, date: 121.5, to: 132, pilot: 172.5, land: 190.5, min: 236.5, tech: 271.5, faa: 316.5, z: 382 };
  const R = Object.fromEntries(Object.entries(L).map(([k, x]) => [k, x + 381.3]));
  function where(n) {
    if (n <= 6) return { page: 0, c: L, b: BLOCKS[n - 1] };
    if (n <= 12) return { page: 1, c: L, b: BLOCKS[n - 7] };
    return { page: 1, c: R, b: BLOCKS[n - 13] };
  }
  const cell = (x0, x1, y0, y1) => [x0 + 2.5, y0 + 8.3, x1 - 2, y1 - 0.8]; // value sits under each small label
  function flight(n) {
    const { page, c, b } = where(n), p = `f${n}_`;
    const box = (x0, x1, k) => cell(x0, x1, b[k], b[k + 1]);
    return [
      { type: 'date', id: p + 'date', label: 'Date', page, box: box(c.a, c.date, 0), align: 'left', carry: true, today: n === 1 },
      { type: 'text', id: p + 'desc', label: 'Description / type of flight', page, box: box(c.date, c.z, 0), align: 'left', wide: true },
      { type: 'text', id: p + 'pilot', label: 'Pilot', page, box: box(c.a, c.pilot, 1), align: 'left', carry: true },
      { type: 'text', id: p + 'tech1', label: 'Technician', page, box: box(c.pilot, c.tech, 1), align: 'left', carry: true },
      { type: 'text', id: p + 'tech2', label: 'Technician', page, box: box(c.tech, c.z, 1), align: 'left', carry: true },
      { type: 'text', id: p + 'images', label: 'No. of images', page, box: box(c.a, c.date, 2), align: 'left', inputmode: 'numeric' },
      { type: 'text', id: p + 'faa', label: 'Aircraft FAA number', page, box: box(c.date, c.faa, 2), align: 'left', carry: true },
      { type: 'text', id: p + 'model', label: 'Aircraft model', page, box: box(c.faa, c.z, 2), align: 'left', carry: true },
      { type: 'time', id: p + 'to', label: 'Take off time', page, box: box(c.a, c.to, 3), align: 'left' },
      { type: 'time', id: p + 'land', label: 'Landing time', page, box: box(c.to, c.land, 3), align: 'left' },
      { type: 'minutes', id: p + 'min', label: 'Minutes', page, box: box(c.land, c.min, 3), align: 'left', from: [p + 'to', p + 'land'], inputmode: 'numeric' },
      { type: 'text', id: p + 'batt', label: 'Battery number', page, box: box(c.min, c.faa, 3), align: 'left' },
      { type: 'text', id: p + 'rem', label: 'Battery remaining (%)', page, box: box(c.faa, c.z, 3), align: 'left', inputmode: 'numeric', suffix: '%' },
    ];
  }
  // ids of flights 7–18 decide whether the second sheet is needed (dates that only carried over don't count)
  const SECOND_IDS = [];
  for (let n = 7; n <= 18; n++) flight(n).forEach(f => { if (!/_date$/.test(f.id)) SECOND_IDS.push(f.id); });

  window.FORM_DEF = {
    id: 'capf-109u-dec22',
    code: 'CAPF 109U',
    title: 'sUAS Sortie Flight Summary & Imagery/Target Log',
    pdf: 'form.pdf',
    pages: [
      { src: 1, rotate: 90 },                                                            // Flights 1–6 | Summary (page 1)
      { src: 0, rotate: 90, when: v => SECOND_IDS.some(k => String(v[k] ?? '').trim()) }, // Flights 7–12 | 13–18
    ],
    fileName: s => ['CAPF109U', s.missionNo, s.sortieNo, s.missionDate].filter(Boolean).join('_'),
    sections: [
      { title: 'Mission data', items: [
        { type: 'text', id: 'sortieNo', label: 'Sortie number', page: 0, box: [669, 51, 761, 72] },
        { type: 'text', id: 'missionNo', label: 'Mission number', page: 0, box: [416, 100, 494, 120], align: 'left' },
        { type: 'date', id: 'missionDate', label: 'Mission date', page: 0, box: [498, 100, 560, 120], align: 'left', today: true },
        { type: 'text', id: 'suasmp', label: 'sUASMP reporting (name and CAPID)', page: 0, box: [564, 100, 761, 120], align: 'left', remember: true },
        { type: 'text', id: 'ormScore', label: 'ORM score', page: 0, box: [416, 133, 460, 153], inputmode: 'numeric' },
        { type: 'text', id: 'fro', label: 'Flight release officer (name and CAPID)', page: 0, box: [464, 133, 761, 153], align: 'left' },
        { type: 'textarea', id: 'targets', label: 'Targets and requirements', page: 0, box: [416, 173, 761, 551], size: 9.5, rows: 6 },
      ]},
      { title: 'Flights', repeat: { count: 18, noun: 'Flight', items: flight } },
    ],
  };
})();
