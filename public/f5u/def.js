/* CAPF 70-5U — CAP sUAS Pilot Flight Evaluation (1 DEC 22).
   Coordinates: PDF points from the top-left of each page. */
(function () {
  const W = 5.8; // grade checkbox size
  const LX = [248.6, 259.3, 270.1, 280.8];   // left column S U V NP
  const RX = [517.5, 528.2, 539.0, 549.7];   // right column (VI–IX)
  const RX2 = [522.2, 532.9, 543.7, 554.4];  // right column (X–XI)
  const g = (id, label, top, xs) => ({ type: 'grade', scale: 'suvnp', id, label, page: 0, boxes: xs.map(x => [x, top, W]) });
  const L = (id, label, top) => g(id, label, top, LX);
  const R = (id, label, top) => g(id, label, top, RX);
  const R2 = (id, label, top) => g(id, label, top, RX2);
  const endo = (id, label, bx, by, initX) => ({ type: 'endorse', id, label, page: 0, box: [bx, by, bx + 6.96, by + 6.96], initBox: [initX, by - 2, initX + 34, by + 8.5] });

  window.FORM_DEF = {
    id: 'capf-70-5u',
    code: 'CAPF 70-5U',
    title: 'CAP sUAS Pilot Flight Evaluation',
    pdf: 'form.pdf',
    pages: [{ src: 0 }, { src: 1 }, { src: 2 }],
    fileName: s => ['CAPF70-5U', s.memberName, s.evalDate].filter(Boolean).join('_'),
    sections: [
      { title: 'Evaluation', items: [
        { type: 'radio', id: 'kind', label: 'Type of evaluation', options: [
          { value: 'annual', label: 'Annual', page: 0, box: [55.08, 71.82, 63.18, 79.92] },
          { value: 'abbrev', label: 'Abbreviated', page: 0, box: [114.66, 72.0, 122.76, 80.1] }] },
        { type: 'date', id: 'evalDate', label: 'Date of flight evaluation', page: 0, box: [421, 70, 570, 82], align: 'left', today: true },
      ]},
      { title: 'Member', items: [
        { type: 'text', id: 'memberName', label: "Member's name", page: 0, box: [49, 98.5, 220, 111.5], align: 'left', remember: true },
        { type: 'text', id: 'capid', label: 'CAPID', page: 0, box: [221, 98.5, 270, 111.5], inputmode: 'numeric', remember: true },
        { type: 'charter', id: 'charter', label: 'Charter no.', page: 0, box: [270, 98.5, 345, 111.5], remember: true },
        { type: 'text', id: 'makeModel', label: 'sUAS make & model', page: 0, box: [409, 98.5, 570, 111.5], align: 'left' },
        { type: 'check', id: 'priv107', label: 'Privilege exercised: Part 107', page: 0, box: [351.66, 114.9, 358.62, 121.86] },
        { type: 'check', id: 'privRec', label: 'Privilege exercised: Recreational', page: 0, box: [351.66, 127.08, 358.62, 134.04] },
        { type: 'text', id: 'flightTime', label: 'Flight time (min 0.3 hrs)', page: 0, box: [409, 143.8, 570, 154.3], align: 'left', inputmode: 'decimal' },
        { type: 'textarea', id: 'otherEndorse', label: 'Other CAP endorsements (list)', page: 0, box: [409, 165, 570, 193], size: 8.5 },
      ]},
      { title: 'Additional CAP endorsements', note: 'Check each endorsement awarded and enter the evaluator’s initials.', items: [
        endo('eRec', 'Recreational', 54.72, 131.52, 110),
        endo('eComplex', 'Complex Rotary Wing sUAS', 54.72, 147.54, 161),
        endo('eRotary', 'Rotary Wing sUAS', 54.72, 163.5, 132),
        endo('eFixed', 'Fixed Wing sUAS', 54.72, 179.52, 129),
        endo('eInstr', 'Instructor Pilot', 257.58, 131.52, 320),
        endo('eCheck', 'Check Pilot', 257.58, 147.54, 310),
      ]},
      { title: 'I. Oral Discussion', grades: true, items: [
        L('o1', 'A. Annual Online Written Exam', 208.02),
        L('o2', 'B. Review CAPR 70-4 & Supplements', 219.54),
        L('o3', 'C. Review Flight Release Procedures', 231.06),
        L('o4', 'D. Review WMIRS/ORM Requirements', 242.52),
        L('o5', 'E. Review CAPR 76-1 & Supplements', 254.04),
        L('o6', 'F. Emergency Procedures', 265.56),
        L('o7', 'G. Electronic Flight Log (if applicable)', 283.26),
      ]},
      { title: 'II. Preflight Preparation', grades: true, items: [
        L('p1', 'A. Certificates & Documents', 312.0),
        L('p2', 'B. Obtaining Weather Information (Part 107 only)', 328.74),
        L('p3', 'C. Determine Weight & Balance (Part 107)', 345.54),
        L('p4', 'Demonstrate LAANC filing', 357.3),
        L('p5', 'Determine Landing Performance (Part 107 only)', 374.28),
        L('p6', 'G. Determine Airspace Restrictions', 396.96),
        L('p7', 'H. Aircraft Systems', 414.0),
        L('p8', 'I. Aeromedical Factors (Part 107 only)', 425.76),
      ]},
      { title: 'III. Ground Operations', grades: true, items: [
        L('g1', 'A. Visual Inspection', 448.5),
        L('g2', 'B. Starting Engines', 459.96),
        L('g3', 'C. Sensor Operation (Part 107 only)', 471.48),
        L('g4', 'D. Use of Checklist (mandatory)', 483.0),
        L('g5', 'E. Crew Briefing', 500.94),
        L('g6', 'F. Sterile Area Procedures', 518.4),
        L('g7', 'G. Post-flight Procedures', 529.86),
      ]},
      { title: 'IV. Airport & Traffic Pattern Ops', grades: true, items: [
        L('a1', 'A. Radio Comm & Phone Contacts', 560.46),
        L('a2', 'B. Airport Traffic Patterns (Part 107 only)', 579.48),
      ]},
      { title: 'V. Takeoff & Climbs', grades: true, items: [
        L('t1', 'A. Normal Takeoff & Climb', 615.06),
        L('t2', 'B. Crosswind Takeoff & Climb – FW only', 626.34),
        L('t3', 'C. Team Ground Launch – FW only', 637.86),
      ]},
      { title: 'VI. Maneuvers', grades: true, items: [
        R('m1', 'A. Straight & Level Flight', 208.02),
        R('m2', 'B. Square Pattern', 219.54),
        R('m3', 'C. Point of Interest', 231.06),
        R('m4', 'D. Approach to Landing', 242.52),
        R('m5', 'E. Recovery from Unusual Flt Attitudes', 254.04),
        R('m6', 'F. Landing and Shut Down', 265.56),
      ]},
      { title: 'VII. Night Flight Operations (Part 107 only)', grades: true, items: [
        R('n1', 'A. Physiological aspects of night flying', 300.72),
        R('n2', 'B. Preparation & Personal Equipment', 312.0),
        R('n3', 'C. Aircraft & Airport Lighting', 328.74),
        R('n4', 'D. Night Orientation and Navigation', 345.54),
      ]},
      { title: 'VIII. Emergency Procedures', grades: true, items: [
        R('e1', 'A. Emergency Approach & Landing', 374.28),
        R('e2', 'B. System & Equipment Malfunction', 396.96),
        R('e3', 'C. Emergency Descent', 414.0),
      ]},
      { title: 'IX. Safety Awareness', grades: true, items: [
        R('s1', 'A. Vigilance, Risk Mgt & Judgment', 435.78),
        R('s2', 'B. Battery Management', 446.76),
        R('s3', 'C. Use of Crew Resource Management', 458.28),
        R('s4', 'D. Ground Handling Procedures', 469.74),
        R('s5', 'E. Use of Risk Management (Go-No Go)', 481.26),
      ]},
      { title: 'X. Instructor & Check Pilots (Part 107 only)', grades: true, items: [
        R2('i1', 'A. Demonstrate ground instruction', 518.4),
        R2('i2', 'B. Positive control exchange & who is PIC', 529.86),
        R2('i3', 'C. T.O. & Landing from both control positions', 541.62),
        R2('i4', 'D. Demonstrate teaching maneuvers in flight', 560.46),
        R2('i5', 'E. Demonstrate evaluating maneuvers in flight', 579.48),
        R2('i6', 'F. How to conduct a CAPF-5U (Check Pilot)', 597.42),
      ]},
      { title: 'XI. Recreational Pilot Specific', grades: true, items: [
        R2('r1', 'A. Knowledge of FAA Regulations', 626.34),
        R2('r2', 'B. Knowledge of CAPR 70-4 restrictions', 637.86),
        R2('r3', 'C. Knowledge of AMA MOU', 649.56),
      ]},
      { title: 'Review of certificates & documents', note: 'Verified by check pilot.', items: [
        { type: 'text', id: 'p107no', label: 'FAA Part 107 cert no.', page: 1, box: [50, 88, 207, 98.5], align: 'left', remember: true },
        { type: 'date', id: 'p107exp', label: 'FAA Part 107 expiration date', page: 1, box: [209, 88, 366, 98.5], align: 'left', remember: true },
      ]},
      { title: 'Member certification', note: 'I certify that I have read and understand all applicable FAA, CAP, and state regulations pertaining to flying subject sUAS aircraft. I acknowledge any restrictions or training requirements stated on this CAPF 5. I also understand that maintaining currency, recurring requirements, and compliance with applicable directives is my personal responsibility.', items: [
        { type: 'date', id: 'memberSigDate', label: 'Date', page: 1, box: [50, 160, 161, 174], align: 'left' },
        { type: 'namegrade', id: 'memberNameGrade', label: "Member's grade & name", page: 1, box: [163, 160, 341, 174], align: 'left', remember: true },
        { type: 'sig', id: 'memberSig', label: "Member's signature", page: 1, box: [344, 151, 561, 175] },
      ]},
      { title: 'Evaluator certification', note: 'I certify that I have administered a CAP flight evaluation as indicated and that the above-named CAP member has demonstrated the proficiency required to fly the indicated aircraft. The member also successfully completed the questionnaire for the make and model of aircraft flown. If the applicant fails, enter UNSATISFACTORY instead of signing.', items: [
        { type: 'date', id: 'evalSigDate', label: 'Date', page: 1, box: [50, 286, 161, 300], align: 'left' },
        { type: 'namegrade', id: 'evalNameGrade', label: "Evaluator's grade & name", page: 1, box: [163, 286, 341, 300], align: 'left' },
        { type: 'sig', id: 'evalSig', label: "Evaluator's signature", page: 1, box: [344, 277, 561, 301], unsatText: true },
      ]},
    ],
  };
})();
