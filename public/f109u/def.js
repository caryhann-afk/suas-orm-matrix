/* CAPF 109U — sUAS Sortie Flight Summary / Flight Log (NOV 18).
   The original is a printed booklet stored as rotated pages; the app straightens them to landscape (792 x 612).
   Output page 0 = [Flights 15–21 | Summary (page 1 of 4)], output page 1 = [Flights 1–7 | Flights 8–14].
   Coordinates: PDF points from the top-left of the straightened landscape page. */
(function () {
  // Row lines of each 7-flight column (block top, row 2 top, row 3 top, block bottom)
  const BLOCKS = [
    [49.5, 74, 98, 122.5], [122.5, 147, 171.5, 196], [196, 220, 244.5, 269], [269, 293.5, 318, 342],
    [342, 366.5, 391, 415.5], [415.5, 440, 464, 488.5], [488.5, 513, 537.5, 562]];
  const LEFT = [63, 142.5, 222.5, 306, 381.5];
  const RIGHT = LEFT.map(x => x + 378);
  // Data fills in reading order: flights 1–7 in the first sheet's left column, 8–14 and 15–21 on the second sheet.
  function where(n) {
    if (n <= 7) return { page: 0, xs: LEFT, b: BLOCKS[n - 1] };
    if (n <= 14) return { page: 1, xs: LEFT, b: BLOCKS[n - 8] };
    return { page: 1, xs: RIGHT, b: BLOCKS[n - 15] };
  }
  const cell = (x0, x1, y0, y1, pad) => [x0 + 2.5, y0 + pad, x1 - 2, y1 - 0.8];
  function flight(n) {
    const { page, xs, b } = where(n);
    const [x0, x1, x2, x3, x4] = xs;
    const p = `f${n}_`;
    return [
      { type: 'text', id: p + 'desc', label: 'Description / type of flight', page, box: cell(x0, x4, b[0], b[1], 10.8), align: 'left', wide: true },
      { type: 'text', id: p + 'photos', label: 'Number of photos', page, box: cell(x0, x1, b[1], b[2], 12.3), align: 'left', inputmode: 'numeric' },
      { type: 'text', id: p + 'faa', label: 'Aircraft FAA number', page, box: cell(x1, x3, b[1], b[2], 12.3), align: 'left', carry: true },
      { type: 'text', id: p + 'model', label: 'Aircraft model', page, box: cell(x3, x4, b[1], b[2], 12.3), align: 'left', carry: true },
      { type: 'time', id: p + 'to', label: 'Take off time', page, box: cell(x0, x1, b[2], b[3], 12.3), align: 'left' },
      { type: 'time', id: p + 'land', label: 'Landing time', page, box: cell(x1, x2, b[2], b[3], 12.3), align: 'left' },
      { type: 'text', id: p + 'batt', label: 'Battery number', page, box: cell(x2, x3, b[2], b[3], 12.3), align: 'left' },
      { type: 'text', id: p + 'pct', label: '% battery left', page, box: cell(x3, x4, b[2], b[3], 12.3), align: 'left', inputmode: 'numeric', suffix: '%' },
    ];
  }

  window.FORM_DEF = {
    id: 'capf-109u',
    code: 'CAPF 109U',
    title: 'sUAS Sortie Flight Summary & Log',
    pdf: 'form.pdf',
    pages: [{ src: 0, rotate: 90 }, { src: 1, rotate: 90 }],
    landscape: true,
    fileName: s => ['CAPF109U', s.missionNo, s.sortieNo, s.missionDate].filter(Boolean).join('_'),
    sections: [
      { title: 'Mission data', items: [
        { type: 'text', id: 'sortieNo', label: 'Sortie number', page: 0, box: [675, 48.5, 756, 59.5] },
        { type: 'text', id: 'missionNo', label: 'Mission number', page: 0, box: [415, 83, 482.5, 96] },
        { type: 'date', id: 'missionDate', label: 'Mission date', page: 0, box: [486, 83, 557, 96], today: true },
        { type: 'text', id: 'suasmp', label: 'sUASMP reporting (name & CAPID)', page: 0, box: [560, 83, 756, 96], align: 'left', remember: true },
        { type: 'textarea', id: 'targets', label: 'Targets & requirements', page: 0, box: [416, 113, 755, 558], size: 9.5, rows: 6 },
      ]},
      { title: 'Flights', repeat: { count: 21, noun: 'Flight', items: flight } },
    ],
  };
})();
