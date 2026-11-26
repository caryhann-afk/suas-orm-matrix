/* CAPF 70-91 — CAP Mission Pilot Checkout (31 MAR 20).
   Coordinates: PDF points from the top-left of each page. Grades print as S / U / V / N/A in the right-hand cell. */
(function () {
  const LC = [276.2, 311.3];  // left grade column x-range
  const RC = [510.2, 548.8];  // right grade column x-range
  const L = (id, label, y0, y1) => ({ type: 'grade', scale: 'suvna', id, label, page: 0, cell: [LC[0], y0, LC[1], y1] });
  const R = (id, label, y0, y1) => ({ type: 'grade', scale: 'suvna', id, label, page: 0, cell: [RC[0], y0, RC[1], y1] });
  const cert = (value, label, y) => ({ value, label, page: 0, box: [88.4, y, 95.6, y + 8], initBox: [72.6, y - 1.5, 88.6, y + 8.5] });

  window.FORM_DEF = {
    id: 'capf-70-91',
    code: 'CAPF 70-91',
    title: 'CAP Mission Pilot Checkout',
    pdf: 'form.pdf',
    pages: [{ src: 0 }, { src: 1 }],
    fileName: s => ['CAPF70-91', s.memberName, s.checkDate].filter(Boolean).join('_'),
    sections: [
      { title: 'Member', items: [
        { type: 'date', id: 'checkDate', label: 'Date of flight check', page: 0, box: [384, 79, 547, 90], align: 'left', today: true },
        { type: 'text', id: 'memberName', label: "Member's name", page: 0, box: [74, 109, 221, 121], align: 'left', remember: true },
        { type: 'text', id: 'capid', label: 'CAPID', page: 0, box: [223, 109, 279, 121], inputmode: 'numeric', remember: true },
        { type: 'text', id: 'charter', label: 'Charter no.', page: 0, box: [281, 109, 351, 121], remember: true },
        { type: 'date', id: 'icut', label: 'ICUT date', page: 0, box: [353, 109, 446, 121] },
        { type: 'date', id: 'form5', label: 'Form 5 annual date', page: 0, box: [448, 109, 548, 121] },
      ]},
      { title: 'I. Oral Discussion', grades: true, items: [
        L('o1', 'A. CAPT 116 Written Exam Passed (initial only)', 134.6, 145.6),
        L('o2', 'B. Mission Base Procedures (Sign In, Flight Plans, Reimbursement Forms)', 145.6, 167.0),
        L('o3', 'C. Air-to-ground Signals', 167.0, 178.0),
        L('o4', 'D. Mission Safety Principles', 178.0, 189.2),
        L('o5', 'E. CAP Radio Procedures (as req)', 189.2, 201.0),
        L('o6', 'F. Individual & Crew Equipment/Clothing', 201.0, 211.6),
        L('o7', 'G. Search Procedures', 211.6, 222.6),
        L('o8', 'H. Map and Chart Reading', 222.6, 233.6),
      ]},
      { title: 'II. Preflight Planning', grades: true, items: [
        L('p1', 'A. Determine Performance Limitations', 245.6, 256.6),
        L('p2', 'B. Obtain Mission Briefing', 256.6, 267.0),
        L('p3', 'C. Gridded Sectional', 267.0, 278.0),
        L('p4', 'D. Observer Briefing', 278.0, 289.2),
        L('p5', 'E. Fuel Planning & Reserve', 289.2, 301.0),
        L('p6', 'F. Ground Team Coordination', 301.0, 311.6),
      ]},
      { title: 'III. Visual Search Patterns & Procedures', grades: true, items: [
        L('v1', 'A. Locate Grid or Area (without electronic aids)', 323.6, 334.6),
        L('v2', 'B. Establish Search Altitudes', 334.6, 345.6),
        L('v3', 'C. Grid Search Patterns', 345.6, 356.6),
        L('v4', 'D. Creeping Line Search Procedures', 356.6, 367.0),
        L('v5', 'E. Expanding Square or Sector Search', 367.0, 379.0),
        L('v6', 'F. DAART System Procedures', 379.0, 390.0),
        L('v7', 'G. Airborne Photographer Procedures', 390.0, 401.0),
      ]},
      { title: 'IV. Electronic Search Patterns & Procedures', grades: true, items: [
        R('es1', 'A. Locate Starting Point (with & without elec aids)', 134.6, 145.6),
        R('es2', 'B. Establish Appropriate Search Altitudes', 145.6, 156.6),
        R('es3', 'C. VHF-DF Procedures', 156.6, 167.0),
        R('es4', 'D. Wing Null Procedures', 167.0, 178.0),
        R('es5', 'E. Aural (build-fade) Procedures', 178.0, 189.2),
      ]},
      { title: 'V. Mountainous Terrain Procedures', grades: true, items: [
        R('mt1', 'A. Locate Grid/Area (with & without elec nav aid)', 201.0, 211.6),
        R('mt2', 'B. Establish Search Altitude', 211.6, 222.6),
        R('mt3', 'C. Contour Search Procedures', 222.6, 233.6),
        R('mt4', 'D. Canyon Search Procedures', 233.6, 245.6),
        R('mt5', 'E. Ridge Crossing Procedures', 245.6, 256.6),
        R('mt6', 'F. Communication Procedures', 256.6, 267.0),
        R('mt7', 'G. Wind/Updrafts/Downdrafts', 267.0, 278.0),
        R('mt8', 'H. Mountain Wave Effect', 278.0, 289.2),
      ]},
      { title: 'VI. Safety Awareness', grades: true, items: [
        R('sa1', 'A. Clearing and Collision Avoidance', 301.0, 311.6),
        R('sa2', 'B. Vigilance', 311.6, 323.6),
        R('sa3', 'C. Cockpit Resource Management', 323.6, 334.6),
        R('sa4', 'D. Risk Management', 334.6, 345.6),
        R('sa5', 'E. Judgment', 345.6, 356.6),
      ]},
      { title: 'Evaluator certification', note: 'I certify that I have administered a CAP mission pilot flight check as indicated and that the above named member (evaluator initials blanks):', items: [
        { type: 'radio', id: 'result', label: 'Result', initials: true, options: [
          cert('mp', 'Has demonstrated proficiency required to fly as a mission pilot', 432.4),
          cert('mcp', 'Has demonstrated proficiency required to fly as a mission check pilot', 448.9),
          cert('nq', 'Is not qualified, requires additional training and recheck', 465.2)] },
        { type: 'textarea', id: 'comments', label: 'Comments', page: 0, box: [74, 494, 547, 664], size: 9.5 },
      ]},
      { title: 'Evaluator', items: [
        { type: 'date', id: 'evalDate', label: 'Date', page: 0, box: [73, 672, 134, 690] },
        { type: 'text', id: 'flightTime', label: 'Flight time', page: 0, box: [136, 672, 201, 690], inputmode: 'decimal' },
        { type: 'namegrade', id: 'evalNameGrade', label: "Evaluator's grade & name", page: 0, box: [204, 672, 332, 690], align: 'left' },
        { type: 'text', id: 'evalCapid', label: 'Evaluator CAPID', page: 0, box: [334, 672, 395, 690], inputmode: 'numeric' },
        { type: 'sig', id: 'evalSig', label: "Evaluator's signature", page: 0, box: [397, 668, 548, 691] },
      ]},
    ],
  };
})();
