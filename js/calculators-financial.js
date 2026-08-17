/* Financial calculators */
(function () {
  'use strict';
  var C = window.CS;
  var el = C.el, field = C.field, numInput = C.numInput, selectInput = C.selectInput;
  var fmtMoney = C.fmtMoney, fmtNum = C.fmtNum, money = C.curSymbol;

  function num(id, root) { var n = parseFloat((C.qs('#' + id, root) || {}).value); return isFinite(n) ? n : 0; }
  function debounce(fn) { var t; return function () { clearTimeout(t); t = setTimeout(fn, 120); }; }

  /* ---------------- EMI helpers ---------------- */
  function emiAmount(P, annualRate, months) {
    if (months <= 0) return 0;
    var r = annualRate / 12 / 100;
    if (r === 0) return P / months;
    return P * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
  }
  // Amortization with optional prepayment + extra EMIs/year
  function amortize(P, annualRate, months, opts) {
    opts = opts || {};
    var r = annualRate / 12 / 100;
    var emi = emiAmount(P, annualRate, months);
    var bal = P, totalInt = 0, totalPaid = 0, m = 0;
    var yearly = {}, schedule = [];
    var prepay = opts.prepay || 0, prepayEvery = opts.prepayEvery || 0; // months
    var extraEmiPerYear = opts.extraEmiPerYear || 0;
    var guard = months * 3 + 1200;
    while (bal > 0.5 && m < guard) {
      m++;
      var interest = bal * r;
      var principal = emi - interest;
      if (principal > bal) { principal = bal; }
      bal -= principal;
      totalInt += interest; totalPaid += principal + interest;
      // prepayment
      if (prepay > 0 && prepayEvery > 0 && m % prepayEvery === 0 && bal > 0) {
        var pp = Math.min(prepay, bal); bal -= pp; totalPaid += pp;
      }
      // extra EMI(s) at year end
      if (extraEmiPerYear > 0 && m % 12 === 0 && bal > 0) {
        for (var k = 0; k < extraEmiPerYear && bal > 0; k++) {
          var exInt = bal * r; var exPr = Math.min(emi - exInt, bal);
          if (exPr <= 0) break;
          bal -= exPr; totalInt += exInt; totalPaid += exPr + exInt;
        }
      }
      var yr = Math.ceil(m / 12);
      if (!yearly[yr]) yearly[yr] = { principal: 0, interest: 0, endBal: bal };
      yearly[yr].principal += principal; yearly[yr].interest += interest; yearly[yr].endBal = bal;
      schedule.push({ m: m, interest: interest, principal: principal, balance: Math.max(0, bal) });
    }
    return { emi: emi, months: m, totalInterest: totalInt, totalPaid: P + totalInt, yearly: yearly, schedule: schedule, finalBal: bal };
  }

  /* ===================== EMI Calculator ===================== */
  C.Calc.register({
    id: 'emi', name: 'EMI Calculator', category: 'Financial', icon: '\u{1F3E6}',
    description: 'Loan EMI with prepayment, amortization & charts',
    render: function (root) {
      var out = C.resultBox();
      var schedWrap = el('div');
      var compareWrap = el('div');

      var f = {
        amount: numInput({ id: 'emiAmt', value: 2500000 }),
        rate: numInput({ id: 'emiRate', value: 8.5, step: 0.01 }),
        tenure: numInput({ id: 'emiTen', value: 20 }),
        fee: numInput({ id: 'emiFee', value: 0 }),
        down: numInput({ id: 'emiDown', value: 0 }),
        prepay: numInput({ id: 'emiPrepay', value: 0 }),
        insure: numInput({ id: 'emiIns', value: 0 }),
        extra: numInput({ id: 'emiExtra', value: 0 })
      };
      var tenUnit = selectInput([{ value: 'y', label: 'Years' }, { value: 'm', label: 'Months' }], { id: 'emiTenU', value: 'y' });
      var prepayFreq = selectInput([
        { value: '0', label: 'None' }, { value: '12', label: 'Yearly' },
        { value: '6', label: 'Half-yearly' }, { value: '1', label: 'Monthly' }
      ], { id: 'emiPF', value: '12' });

      function calc() {
        var amount = num('emiAmt', root), down = num('emiDown', root);
        var P = Math.max(0, amount - down);
        var rate = num('emiRate', root);
        var months = num('emiTen', root) * (C.qs('#emiTenU', root).value === 'y' ? 12 : 1);
        var fee = num('emiFee', root), insure = num('emiIns', root);
        var prepay = num('emiPrepay', root);
        var pf = parseInt(C.qs('#emiPF', root).value, 10) || 0;
        var extra = num('emiExtra', root);

        var base = amortize(P, rate, months, {});
        var adj = amortize(P, rate, months, { prepay: prepay, prepayEvery: pf, extraEmiPerYear: extra });
        var saving = base.totalInterest - adj.totalInterest;
        var totalCost = adj.totalPaid + fee + insure;

        out.innerHTML = '';
        out.appendChild(el('div', { class: 'kpi-grid' }, [
          C.kpi('Monthly EMI', fmtMoney(adj.emi), { class: 'primary' }),
          C.kpi('Total Interest', fmtMoney(adj.totalInterest)),
          C.kpi('Total Amount', fmtMoney(totalCost)),
          C.kpi('Interest Saved', fmtMoney(Math.max(0, saving)), { class: saving > 0 ? 'good' : '' })
        ]));
        if (saving > 1) {
          var savedMonths = base.months - adj.months;
          out.appendChild(el('div', { class: 'note' }, 'Prepayment/extra EMIs clear the loan ' + savedMonths + ' month(s) earlier and save ' + fmtMoney(saving) + ' in interest.'));
        }
        // pie
        var pieCard = C.card('Principal vs Interest', el('canvas', { 'data-h': 220 }));
        out.appendChild(pieCard);
        C.Charts.pie(pieCard.querySelector('canvas'), [
          { label: 'Principal', value: P, color: C.Charts.palette[0] },
          { label: 'Interest', value: adj.totalInterest, color: C.Charts.palette[3] },
          { label: 'Fees+Insurance', value: fee + insure, color: C.Charts.palette[2] }
        ], { donut: true });

        // year wise graph (stacked) + balance timeline
        var years = Object.keys(adj.yearly).map(Number).sort(function (a, b) { return a - b; });
        var labels = years.map(function (y) { return 'Y' + y; });
        var prinArr = years.map(function (y) { return adj.yearly[y].principal; });
        var intArr = years.map(function (y) { return adj.yearly[y].interest; });
        var balArr = years.map(function (y) { return adj.yearly[y].endBal; });

        var ywCard = C.card('Year-wise Principal vs Interest', el('canvas', { 'data-h': 240 }));
        out.appendChild(ywCard);
        C.Charts.stackedBar(ywCard.querySelector('canvas'), {
          labels: labels, fmtY: function (v) { return C.compact(v); },
          datasets: [{ label: 'Principal', data: prinArr, color: C.Charts.palette[0] }, { label: 'Interest', data: intArr, color: C.Charts.palette[3] }]
        });
        var tlCard = C.card('Loan Balance Timeline', el('canvas', { 'data-h': 230 }));
        out.appendChild(tlCard);
        C.Charts.line(tlCard.querySelector('canvas'), {
          labels: labels, fmtY: function (v) { return C.compact(v); },
          datasets: [{ label: 'Balance', data: balArr, color: C.Charts.palette[5], fill: true }]
        });

        // schedule table (yearly)
        var rows = [['Year', 'Principal', 'Interest', 'Balance']];
        var trs = years.map(function (y) {
          rows.push([y, Math.round(adj.yearly[y].principal), Math.round(adj.yearly[y].interest), Math.round(adj.yearly[y].endBal)]);
          return el('tr', null, [el('td', null, 'Year ' + y), el('td', null, fmtMoney(adj.yearly[y].principal, { decimals: 0 })), el('td', null, fmtMoney(adj.yearly[y].interest, { decimals: 0 })), el('td', null, fmtMoney(adj.yearly[y].endBal, { decimals: 0 }))]);
        });
        var tbl = el('div', { class: 'tbl-wrap' }, el('table', { class: 'data' }, [
          el('thead', null, el('tr', null, [el('th', null, 'Year'), el('th', null, 'Principal'), el('th', null, 'Interest'), el('th', null, 'Balance')])),
          el('tbody', null, trs)
        ]));
        var schedCard = C.card('Amortization Schedule', tbl, {
          action: el('div', { class: 'btn-row' }, [
            el('button', { class: 'btn btn-sm', onClick: function () { C.downloadCSV('emi-schedule.csv', rows); } }, '\u2B07 Excel/CSV'),
            el('button', { class: 'btn btn-sm', onClick: C.printReport }, '\u{1F5A8} PDF/Print')
          ])
        });
        out.appendChild(schedCard);
        C.saveHistory('emi', 'EMI ' + fmtMoney(adj.emi), 'Loan ' + fmtMoney(P));
      }
      var deb = debounce(calc);
      [f.amount, f.rate, f.tenure, f.fee, f.down, f.prepay, f.insure, f.extra, tenUnit, prepayFreq].forEach(function (n) { n.addEventListener('input', deb); n.addEventListener('change', deb); });

      // Compare 3 loans
      function buildCompare() {
        compareWrap.innerHTML = '';
        var inputs = [];
        var grid = el('div', { class: 'compare-grid' });
        for (var i = 1; i <= 3; i++) {
          (function (i) {
            var a = numInput({ value: i === 1 ? 2500000 : i === 2 ? 2500000 : 2500000 });
            var rt = numInput({ value: i === 1 ? 8.5 : i === 2 ? 9 : 9.5, step: 0.01 });
            var tn = numInput({ value: 20 });
            inputs.push({ a: a, rt: rt, tn: tn });
            grid.appendChild(el('div', { class: 'card' }, el('div', { class: 'card-body' }, [
              el('div', { class: 'field-label' }, 'Loan ' + i),
              field('Amount', a), field('Rate %', rt), field('Years', tn)
            ])));
          })(i);
        }
        var res = el('div');
        function run() {
          var rows = [['Loan', 'EMI', 'Total Interest', 'Total Payment']];
          var best = Infinity, bestIdx = -1;
          inputs.forEach(function (x, i) {
            var P = parseFloat(x.a.value) || 0, am = amortize(P, parseFloat(x.rt.value) || 0, (parseFloat(x.tn.value) || 0) * 12, {});
            rows.push([i + 1, Math.round(am.emi), Math.round(am.totalInterest), Math.round(am.totalPaid)]);
            if (am.totalPaid < best) { best = am.totalPaid; bestIdx = i; }
          });
          res.innerHTML = '';
          var trs = rows.slice(1).map(function (r, i) {
            return el('tr', null, [el('td', null, 'Loan ' + r[0] + (i === bestIdx ? ' \u2605' : '')), el('td', null, fmtMoney(r[1])), el('td', null, fmtMoney(r[2])), el('td', null, fmtMoney(r[3]))]);
          });
          res.appendChild(el('div', { class: 'tbl-wrap' }, el('table', { class: 'data' }, [el('thead', null, el('tr', null, [el('th', null, 'Loan'), el('th', null, 'EMI'), el('th', null, 'Total Interest'), el('th', null, 'Total Payment')])), el('tbody', null, trs)])));
          res.appendChild(el('div', { class: 'note' }, 'Cheapest overall: Loan ' + (bestIdx + 1) + ' \u2605'));
        }
        [].concat.apply([], inputs.map(function (x) { return [x.a, x.rt, x.tn]; })).forEach(function (n) { n.addEventListener('input', debounce(run)); });
        compareWrap.appendChild(C.card('Compare 3 Loans', [grid, res]));
        run();
      }

      function shareLink() {
        var p = new URLSearchParams({ amt: f.amount.value, rate: f.rate.value, ten: f.tenure.value });
        var url = location.origin + location.pathname + '#emi?' + p.toString();
        C.copyText(url);
      }

      var inputCard = C.card('Loan Details', [
        field('Loan Amount (' + money() + ')', f.amount),
        el('div', { class: 'row' }, [field('Interest Rate (% p.a.)', f.rate), field('Loan Tenure', el('div', { class: 'row', style: { gridTemplateColumns: '1fr 1fr' } }, [f.tenure, tenUnit]))]),
        el('details', null, [
          el('summary', { class: 'field-label', style: { cursor: 'pointer' } }, 'Advanced options'),
          el('div', { style: { marginTop: '12px' } }, [
            el('div', { class: 'row' }, [field('Down Payment', f.down), field('Processing Fee', f.fee)]),
            el('div', { class: 'row' }, [field('Prepayment Amount', f.prepay), field('Prepayment Frequency', prepayFreq)]),
            el('div', { class: 'row' }, [field('Extra EMIs / year', f.extra), field('Insurance Cost', f.insure)])
          ])
        ]),
        el('div', { class: 'btn-row' }, [
          el('button', { class: 'btn btn-sm', onClick: shareLink }, '\u{1F517} Share Link'),
          el('button', { class: 'btn btn-sm', onClick: function () { C.Store.set('saved:emi', { amt: f.amount.value, rate: f.rate.value, ten: f.tenure.value }); C.toast('Calculation saved'); } }, '\u{1F4BE} Save'),
          el('button', { class: 'btn btn-sm', onClick: function () { compareWrap.style.display = compareWrap.style.display === 'none' ? 'block' : 'none'; if (!compareWrap.dataset.built) { buildCompare(); compareWrap.dataset.built = '1'; } } }, '\u2696 Compare')
        ])
      ]);
      compareWrap.style.display = 'none';

      // hydrate from share link
      var hash = location.hash;
      if (hash.indexOf('?') > -1) {
        var qp = new URLSearchParams(hash.split('?')[1]);
        if (qp.get('amt')) f.amount.value = qp.get('amt');
        if (qp.get('rate')) f.rate.value = qp.get('rate');
        if (qp.get('ten')) f.tenure.value = qp.get('ten');
      }
      setTimeout(calc, 0);
      return el('div', { class: 'calc-grid' }, [el('div', null, [inputCard, compareWrap]), el('div', null, out)]);
    }
  });

  /* ===================== Loan Calculator (types + eligibility) ===================== */
  C.Calc.register({
    id: 'loan', name: 'Loan Calculator', category: 'Financial', icon: '\u{1F4B0}',
    description: 'Home/Car/Personal/Education loans, eligibility & DTI',
    render: function (root) {
      var presets = { home: { rate: 8.5, ten: 20 }, car: { rate: 9.5, ten: 7 }, personal: { rate: 12, ten: 5 }, education: { rate: 10, ten: 8 } };
      var out = C.resultBox();
      var typeSel = selectInput([{ value: 'home', label: 'Home Loan' }, { value: 'car', label: 'Car Loan' }, { value: 'personal', label: 'Personal Loan' }, { value: 'education', label: 'Education Loan' }], { id: 'lnType', value: 'home' });
      var amt = numInput({ id: 'lnAmt', value: 3000000 });
      var rate = numInput({ id: 'lnRate', value: 8.5, step: 0.01 });
      var ten = numInput({ id: 'lnTen', value: 20 });
      var income = numInput({ id: 'lnInc', value: 90000 });
      var oblig = numInput({ id: 'lnObl', value: 10000 });

      typeSel.addEventListener('change', function () { var p = presets[typeSel.value]; rate.value = p.rate; ten.value = p.ten; calc(); });
      function calc() {
        var P = num('lnAmt', root), r = num('lnRate', root), months = num('lnTen', root) * 12;
        var am = amortize(P, r, months, {});
        var inc = num('lnInc', root), obl = num('lnObl', root);
        var dti = inc > 0 ? ((am.emi + obl) / inc) * 100 : 0;
        // eligibility: max EMI = 50% of income minus obligations
        var maxEmi = Math.max(0, inc * 0.5 - obl);
        var rM = r / 12 / 100;
        var eligible = rM > 0 ? maxEmi * (Math.pow(1 + rM, months) - 1) / (rM * Math.pow(1 + rM, months)) : maxEmi * months;
        out.innerHTML = '';
        out.appendChild(el('div', { class: 'kpi-grid' }, [
          C.kpi('Monthly EMI', fmtMoney(am.emi), { class: 'primary' }),
          C.kpi('Total Interest', fmtMoney(am.totalInterest)),
          C.kpi('Total Payment', fmtMoney(am.totalPaid)),
          C.kpi('Debt-to-Income', dti.toFixed(1) + '%', { class: dti > 50 ? 'bad' : dti > 40 ? '' : 'good' })
        ]));
        out.appendChild(el('div', { class: 'note' }, dti <= 50
          ? 'Affordable \u2705 \u2014 You can borrow up to about ' + fmtMoney(eligible) + ' at this rate/tenure (max EMI ' + fmtMoney(maxEmi) + ').'
          : 'Over-leveraged \u26A0 \u2014 DTI above 50%. Max recommended loan: ' + fmtMoney(eligible) + '.'));
        var c1 = C.card('Repayment Composition', el('canvas', { 'data-h': 210 })); out.appendChild(c1);
        C.Charts.pie(c1.querySelector('canvas'), [{ label: 'Principal', value: P, color: C.Charts.palette[0] }, { label: 'Interest', value: am.totalInterest, color: C.Charts.palette[3] }], { donut: true });
        var years = Object.keys(am.yearly).map(Number).sort(function (a, b) { return a - b; });
        var c2 = C.card('Interest Paid Over Time', el('canvas', { 'data-h': 220 })); out.appendChild(c2);
        C.Charts.bar(c2.querySelector('canvas'), { labels: years.map(function (y) { return 'Y' + y; }), fmtY: function (v) { return C.compact(v); }, datasets: [{ label: 'Interest', data: years.map(function (y) { return am.yearly[y].interest; }), color: C.Charts.palette[3] }] });
      }
      [amt, rate, ten, income, oblig].forEach(function (n) { n.addEventListener('input', debounce(calc)); });
      setTimeout(calc, 0);
      return el('div', { class: 'calc-grid' }, [
        C.card('Loan Details', [
          field('Loan Type', typeSel), field('Loan Amount', amt),
          el('div', { class: 'row' }, [field('Interest Rate %', rate), field('Tenure (years)', ten)]),
          el('div', { class: 'row' }, [field('Monthly Income', income), field('Other EMIs / month', oblig)])
        ]),
        out
      ]);
    }
  });

  /* ===================== SIP Calculator ===================== */
  C.Calc.register({
    id: 'sip', name: 'SIP Calculator', category: 'Financial', icon: '\u{1F4C8}',
    description: 'Mutual fund SIP with step-up, inflation, goal tracker',
    render: function (root) {
      var out = C.resultBox();
      var monthly = numInput({ id: 'sipM', value: 10000 });
      var ret = numInput({ id: 'sipR', value: 12, step: 0.1 });
      var dur = numInput({ id: 'sipD', value: 15 });
      var step = numInput({ id: 'sipStep', value: 0, step: 0.5 });
      var infl = numInput({ id: 'sipInf', value: 6, step: 0.1 });
      var tax = numInput({ id: 'sipTax', value: 0, step: 0.1 });
      var goal = numInput({ id: 'sipGoal', value: 5000000 });

      function calc() {
        var m = num('sipM', root), r = num('sipR', root) / 100, yrs = num('sipD', root);
        var stepUp = num('sipStep', root) / 100, inflation = num('sipInf', root) / 100, taxRate = num('sipTax', root) / 100;
        var goalAmt = num('sipGoal', root);
        var monthlyRate = Math.pow(1 + r, 1 / 12) - 1;
        var bal = 0, invested = 0, cur = m;
        var labels = [], invArr = [], valArr = [];
        for (var y = 1; y <= yrs; y++) {
          for (var mo = 0; mo < 12; mo++) { bal = (bal + cur) * (1 + monthlyRate); invested += cur; }
          cur = cur * (1 + stepUp);
          labels.push('Y' + y); invArr.push(invested); valArr.push(bal);
        }
        var gain = bal - invested;
        var taxOnGain = gain * taxRate;
        var afterTax = bal - taxOnGain;
        var realValue = bal / Math.pow(1 + inflation, yrs);
        out.innerHTML = '';
        out.appendChild(el('div', { class: 'kpi-grid' }, [
          C.kpi('Future Value', fmtMoney(bal), { class: 'primary' }),
          C.kpi('Total Invested', fmtMoney(invested)),
          C.kpi('Wealth Gain', fmtMoney(gain), { class: 'good' }),
          C.kpi('Inflation-adj. Value', fmtMoney(realValue))
        ]));
        if (taxRate > 0) out.appendChild(el('div', { class: 'note' }, 'After ' + (taxRate * 100).toFixed(0) + '% tax on gains (' + fmtMoney(taxOnGain) + '), you keep ' + fmtMoney(afterTax) + '.'));
        var gc = C.card('Growth Projection', el('canvas', { 'data-h': 240 })); out.appendChild(gc);
        C.Charts.line(gc.querySelector('canvas'), { labels: labels, fmtY: function (v) { return C.compact(v); }, datasets: [{ label: 'Value', data: valArr, color: C.Charts.palette[1], fill: true }, { label: 'Invested', data: invArr, color: C.Charts.palette[0] }] });
        // goal meter
        var pct = goalAmt > 0 ? (bal / goalAmt) * 100 : 0;
        var gm = C.card('Goal Progress (' + fmtMoney(goalAmt) + ')', el('canvas', { 'data-h': 70 })); out.appendChild(gm);
        C.Charts.progress(gm.querySelector('canvas'), pct, { color: pct >= 100 ? C.Charts.palette[1] : C.Charts.palette[0] });
        if (pct < 100 && r > 0) {
          // required monthly to hit goal
          var n = yrs * 12; var req = goalAmt * monthlyRate / (Math.pow(1 + monthlyRate, n) - 1) / (1 + monthlyRate);
          gm.querySelector('.card-body').appendChild(el('div', { class: 'note', style: { marginTop: '10px' } }, '\u{1F4A1} Invest about ' + fmtMoney(req) + '/month (no step-up) to reach your goal in ' + yrs + ' years.'));
        } else if (pct >= 100) {
          gm.querySelector('.card-body').appendChild(el('div', { class: 'note', style: { marginTop: '10px' } }, '\u{1F389} On track \u2014 your plan exceeds the goal by ' + fmtMoney(bal - goalAmt) + '.'));
        }
        // year table
        var trs = labels.map(function (lb, i) { return el('tr', null, [el('td', null, lb), el('td', null, fmtMoney(invArr[i], { decimals: 0 })), el('td', null, fmtMoney(valArr[i], { decimals: 0 })), el('td', null, fmtMoney(valArr[i] - invArr[i], { decimals: 0 }))]); });
        out.appendChild(C.card('Year-wise Breakdown', el('div', { class: 'tbl-wrap' }, el('table', { class: 'data' }, [el('thead', null, el('tr', null, [el('th', null, 'Year'), el('th', null, 'Invested'), el('th', null, 'Value'), el('th', null, 'Gain')])), el('tbody', null, trs)])), { action: el('button', { class: 'btn btn-sm', onClick: function () { C.downloadCSV('sip.csv', [['Year', 'Invested', 'Value', 'Gain']].concat(labels.map(function (lb, i) { return [lb, Math.round(invArr[i]), Math.round(valArr[i]), Math.round(valArr[i] - invArr[i])]; }))); } }, '\u2B07 Export') }));
      }
      [monthly, ret, dur, step, infl, tax, goal].forEach(function (n) { n.addEventListener('input', debounce(calc)); });
      setTimeout(calc, 0);
      return el('div', { class: 'calc-grid' }, [
        C.card('SIP Details', [
          field('Monthly Investment', monthly),
          el('div', { class: 'row' }, [field('Expected Return % p.a.', ret), field('Duration (years)', dur)]),
          el('details', null, [el('summary', { class: 'field-label', style: { cursor: 'pointer' } }, 'Advanced'), el('div', { style: { marginTop: '12px' } }, [
            el('div', { class: 'row' }, [field('Annual Step-up %', step), field('Inflation %', infl)]),
            el('div', { class: 'row' }, [field('Tax on Gains %', tax), field('Goal Amount', goal)])
          ])])
        ]),
        out
      ]);
    }
  });

  /* ===================== Interest Calculator ===================== */
  C.Calc.register({
    id: 'interest', name: 'Interest Calculator', category: 'Financial', icon: '\u{1F4B9}',
    description: 'Simple & compound interest (any frequency)',
    render: function (root) {
      var out = C.resultBox();
      var P = numInput({ id: 'inP', value: 100000 }), r = numInput({ id: 'inR', value: 8, step: 0.01 }), t = numInput({ id: 'inT', value: 5 });
      var type = selectInput([{ value: 'simple', label: 'Simple Interest' }, { value: 'compound', label: 'Compound Interest' }], { id: 'inType', value: 'compound' });
      var freq = selectInput([{ value: '1', label: 'Annually' }, { value: '2', label: 'Half-yearly' }, { value: '4', label: 'Quarterly' }, { value: '12', label: 'Monthly' }, { value: '365', label: 'Daily' }], { id: 'inF', value: '1' });
      function calc() {
        var p = num('inP', root), rate = num('inR', root) / 100, yrs = num('inT', root), n = parseInt(C.qs('#inF', root).value, 10);
        var amount, interest, labels = [], data = [];
        if (C.qs('#inType', root).value === 'simple') {
          interest = p * rate * yrs; amount = p + interest;
          for (var y = 1; y <= Math.ceil(yrs); y++) { labels.push('Y' + y); data.push(p + p * rate * Math.min(y, yrs)); }
        } else {
          amount = p * Math.pow(1 + rate / n, n * yrs); interest = amount - p;
          for (var y2 = 1; y2 <= Math.ceil(yrs); y2++) { labels.push('Y' + y2); data.push(p * Math.pow(1 + rate / n, n * Math.min(y2, yrs))); }
        }
        out.innerHTML = '';
        out.appendChild(el('div', { class: 'kpi-grid' }, [C.kpi('Maturity Amount', fmtMoney(amount), { class: 'primary' }), C.kpi('Interest Earned', fmtMoney(interest), { class: 'good' }), C.kpi('Principal', fmtMoney(p))]));
        var c = C.card('Growth', el('canvas', { 'data-h': 230 })); out.appendChild(c);
        C.Charts.line(c.querySelector('canvas'), { labels: labels, fmtY: function (v) { return C.compact(v); }, datasets: [{ label: 'Amount', data: data, color: C.Charts.palette[1], fill: true }] });
      }
      [P, r, t, type, freq].forEach(function (n) { n.addEventListener('input', debounce(calc)); n.addEventListener('change', debounce(calc)); });
      setTimeout(calc, 0);
      return el('div', { class: 'calc-grid' }, [C.card('Inputs', [field('Principal', P), el('div', { class: 'row' }, [field('Rate % p.a.', r), field('Time (years)', t)]), field('Type', type), field('Compounding', freq)]), out]);
    }
  });

  /* ===================== GST Calculator ===================== */
  C.Calc.register({
    id: 'gst', name: 'GST Calculator', category: 'Financial', icon: '\u{1F9FE}',
    description: 'Add or remove GST with multiple slabs',
    render: function (root) {
      var out = C.resultBox();
      var amt = numInput({ id: 'gstAmt', value: 1000 });
      var rate = selectInput([{ value: '0', label: '0%' }, { value: '3', label: '3%' }, { value: '5', label: '5%' }, { value: '12', label: '12%' }, { value: '18', label: '18%' }, { value: '28', label: '28%' }], { id: 'gstRate', value: '18' });
      var mode = el('div', { class: 'seg' }, [el('button', { class: 'active', 'data-m': 'add' }, 'Add GST'), el('button', { 'data-m': 'remove' }, 'Remove GST')]);
      var curMode = 'add';
      C.qsa('button', mode).forEach(function (b) { b.addEventListener('click', function () { C.qsa('button', mode).forEach(function (x) { x.classList.remove('active'); }); b.classList.add('active'); curMode = b.getAttribute('data-m'); calc(); }); });
      function calc() {
        var a = num('gstAmt', root), g = parseFloat(C.qs('#gstRate', root).value);
        var base, gst, total;
        if (curMode === 'add') { base = a; gst = a * g / 100; total = a + gst; }
        else { base = a / (1 + g / 100); gst = a - base; total = a; }
        out.innerHTML = '';
        out.appendChild(el('div', { class: 'kpi-grid' }, [C.kpi('Net (Base)', fmtMoney(base)), C.kpi('GST (' + g + '%)', fmtMoney(gst), { class: 'primary' }), C.kpi(curMode === 'add' ? 'Gross Total' : 'Original (incl.)', fmtMoney(total), { class: 'good' })]));
        out.appendChild(el('div', { class: 'note' }, 'CGST ' + fmtMoney(gst / 2) + ' + SGST ' + fmtMoney(gst / 2) + ' (intra-state split).'));
      }
      [amt, rate].forEach(function (n) { n.addEventListener('input', debounce(calc)); n.addEventListener('change', debounce(calc)); });
      setTimeout(calc, 0);
      return el('div', { class: 'calc-grid' }, [C.card('Inputs', [field('Amount', amt), field('GST Slab', rate), field('Mode', mode)]), out]);
    }
  });

  /* ===================== Income Tax Calculator (India FY24-25) ===================== */
  function taxNewRegime(income) {
    // FY 2024-25 new regime slabs, with standard deduction 75000 applied before
    var ti = Math.max(0, income - 75000);
    var slabs = [[300000, 0], [700000, 0.05], [1000000, 0.10], [1200000, 0.15], [1500000, 0.20], [Infinity, 0.30]];
    var tax = 0, prev = 0;
    for (var i = 0; i < slabs.length; i++) { var cap = slabs[i][0], rate = slabs[i][1]; if (ti > prev) { tax += (Math.min(ti, cap) - prev) * rate; prev = cap; } else break; }
    // 87A rebate up to taxable 700000
    if (ti <= 700000) tax = 0;
    return tax * 1.04; // cess 4%
  }
  function taxOldRegime(income, deductions) {
    var ti = Math.max(0, income - 50000 - deductions);
    var slabs = [[250000, 0], [500000, 0.05], [1000000, 0.20], [Infinity, 0.30]];
    var tax = 0, prev = 0;
    for (var i = 0; i < slabs.length; i++) { var cap = slabs[i][0], rate = slabs[i][1]; if (ti > prev) { tax += (Math.min(ti, cap) - prev) * rate; prev = cap; } else break; }
    if (ti <= 500000) tax = 0;
    return tax * 1.04;
  }
  C.Calc.register({
    id: 'tax', name: 'Income Tax Calculator', category: 'Financial', icon: '\u{1F9FE}',
    description: 'Old vs New regime (India FY 2024-25)',
    render: function (root) {
      var out = C.resultBox();
      var income = numInput({ id: 'txInc', value: 1200000 });
      var s80c = numInput({ id: 'tx80c', value: 150000 });
      var s80d = numInput({ id: 'tx80d', value: 25000 });
      var hra = numInput({ id: 'txHra', value: 0 });
      var nps = numInput({ id: 'txNps', value: 0 });
      function calc() {
        var inc = num('txInc', root);
        var ded = Math.min(150000, num('tx80c', root)) + num('tx80d', root) + num('txHra', root) + Math.min(50000, num('txNps', root));
        var oldTax = taxOldRegime(inc, ded), newTax = taxNewRegime(inc);
        var better = newTax <= oldTax ? 'New' : 'Old';
        var saving = Math.abs(oldTax - newTax);
        out.innerHTML = '';
        out.appendChild(el('div', { class: 'kpi-grid' }, [
          C.kpi('Old Regime Tax', fmtMoney(oldTax), { class: better === 'Old' ? 'good' : '' }),
          C.kpi('New Regime Tax', fmtMoney(newTax), { class: better === 'New' ? 'good' : '' }),
          C.kpi('You Save', fmtMoney(saving), { class: 'primary' })
        ]));
        out.appendChild(el('div', { class: 'note' }, '\u2705 Recommended: ' + better + ' Regime \u2014 saves ' + fmtMoney(saving) + '. (Deductions used: ' + fmtMoney(ded) + '.)'));
        var c = C.card('Tax Comparison', el('canvas', { 'data-h': 220 })); out.appendChild(c);
        C.Charts.bar(c.querySelector('canvas'), { labels: ['Old Regime', 'New Regime'], fmtY: function (v) { return C.compact(v); }, datasets: [{ label: 'Tax', data: [oldTax, newTax], color: C.Charts.palette[3] }] });
        var net = inc - (better === 'New' ? newTax : oldTax);
        var c2 = C.card('Income Distribution', el('canvas', { 'data-h': 210 })); out.appendChild(c2);
        C.Charts.pie(c2.querySelector('canvas'), [{ label: 'Take-home', value: net, color: C.Charts.palette[1] }, { label: 'Tax', value: Math.min(oldTax, newTax), color: C.Charts.palette[3] }], { donut: true });
      }
      [income, s80c, s80d, hra, nps].forEach(function (n) { n.addEventListener('input', debounce(calc)); });
      setTimeout(calc, 0);
      return el('div', { class: 'calc-grid' }, [
        C.card('Income & Deductions', [field('Annual Income', income), el('div', { class: 'row' }, [field('80C Investments', s80c), field('80D Health Ins.', s80d)]), el('div', { class: 'row' }, [field('HRA Exemption', hra), field('NPS (80CCD1B)', nps)]), el('div', { class: 'note' }, 'Deductions apply to the Old Regime only. New Regime uses a flat \u20B975,000 standard deduction.')]),
        out
      ]);
    }
  });

  /* ===================== Salary Calculator ===================== */
  C.Calc.register({
    id: 'salary', name: 'Salary Calculator', category: 'Financial', icon: '\u{1F4BC}',
    description: 'CTC \u2192 in-hand with PF, gratuity, tax',
    render: function (root) {
      var out = C.resultBox();
      var ctc = numInput({ id: 'salCtc', value: 1200000 });
      var basicPct = numInput({ id: 'salBasic', value: 40 });
      var bonus = numInput({ id: 'salBonus', value: 50000 });
      function calc() {
        var c = num('salCtc', root), bp = num('salBasic', root) / 100, bonusV = num('salBonus', root);
        var basic = c * bp;
        var pfEmployee = Math.min(basic * 0.12, 21600); // capped at 15k basic -> 1800/mo
        var pfEmployer = pfEmployee;
        var gratuity = basic * 0.0481;
        var gross = c - pfEmployer - gratuity;
        var taxable = gross + bonusV;
        var tax = taxNewRegime(taxable);
        var annualNet = gross + bonusV - pfEmployee - tax;
        var monthly = (gross - pfEmployee - tax) / 12;
        out.innerHTML = '';
        out.appendChild(el('div', { class: 'kpi-grid' }, [
          C.kpi('Monthly In-hand', fmtMoney(monthly), { class: 'primary' }),
          C.kpi('Yearly In-hand', fmtMoney(annualNet), { class: 'good' }),
          C.kpi('Annual Tax', fmtMoney(tax)),
          C.kpi('Quarterly', fmtMoney(monthly * 3))
        ]));
        var c1 = C.card('CTC Breakup', el('canvas', { 'data-h': 220 })); out.appendChild(c1);
        C.Charts.pie(c1.querySelector('canvas'), [
          { label: 'In-hand', value: annualNet, color: C.Charts.palette[1] },
          { label: 'Tax', value: tax, color: C.Charts.palette[3] },
          { label: 'PF (EE+ER)', value: pfEmployee + pfEmployer, color: C.Charts.palette[0] },
          { label: 'Gratuity', value: gratuity, color: C.Charts.palette[2] }
        ], { donut: true });
        var rows = [['Component', 'Annual'], ['Basic', Math.round(basic)], ['Gross', Math.round(gross)], ['Bonus', Math.round(bonusV)], ['PF (Employee)', Math.round(pfEmployee)], ['Gratuity', Math.round(gratuity)], ['Income Tax', Math.round(tax)], ['Net', Math.round(annualNet)]];
        out.appendChild(C.card('Detailed Breakup', el('div', { class: 'tbl-wrap' }, el('table', { class: 'data' }, [el('thead', null, el('tr', null, [el('th', null, 'Component'), el('th', null, 'Annual')])), el('tbody', null, rows.slice(1).map(function (r) { return el('tr', null, [el('td', null, r[0]), el('td', null, fmtMoney(r[1]))]); }))]))));
      }
      [ctc, basicPct, bonus].forEach(function (n) { n.addEventListener('input', debounce(calc)); });
      setTimeout(calc, 0);
      return el('div', { class: 'calc-grid' }, [C.card('Inputs', [field('Annual CTC', ctc), el('div', { class: 'row' }, [field('Basic (% of CTC)', basicPct), field('Annual Bonus', bonus)]), el('div', { class: 'note' }, 'Estimate using New Regime tax. PF at 12% of basic (capped), gratuity ~4.81% of basic.')]), out]);
    }
  });

  /* ===================== Discount Calculator ===================== */
  C.Calc.register({
    id: 'discount', name: 'Discount Calculator', category: 'Financial', icon: '\u{1F3F7}',
    description: 'Single/stacked discounts + tax',
    render: function (root) {
      var out = C.resultBox();
      var price = numInput({ id: 'dsP', value: 2000 });
      var d1 = numInput({ id: 'dsD1', value: 20, step: 0.1 });
      var d2 = numInput({ id: 'dsD2', value: 10, step: 0.1 });
      var taxr = numInput({ id: 'dsTax', value: 18, step: 0.1 });
      function calc() {
        var p = num('dsP', root), a = num('dsD1', root) / 100, b = num('dsD2', root) / 100, tx = num('dsTax', root) / 100;
        var afterD1 = p * (1 - a); var afterD2 = afterD1 * (1 - b);
        var savings = p - afterD2; var withTax = afterD2 * (1 + tx);
        var effective = p > 0 ? (savings / p) * 100 : 0;
        out.innerHTML = '';
        out.appendChild(el('div', { class: 'kpi-grid' }, [C.kpi('You Save', fmtMoney(savings), { class: 'good' }), C.kpi('Price After Discount', fmtMoney(afterD2), { class: 'primary' }), C.kpi('Final (incl. tax)', fmtMoney(withTax)), C.kpi('Effective Discount', effective.toFixed(1) + '%')]));
        out.appendChild(el('div', { class: 'note' }, 'Stacked discounts of ' + (a * 100) + '% + ' + (b * 100) + '% = ' + effective.toFixed(1) + '% effective (not ' + ((a + b) * 100) + '%).'));
      }
      [price, d1, d2, taxr].forEach(function (n) { n.addEventListener('input', debounce(calc)); });
      setTimeout(calc, 0);
      return el('div', { class: 'calc-grid' }, [C.card('Inputs', [field('Original Price', price), el('div', { class: 'row' }, [field('Discount 1 %', d1), field('Discount 2 %', d2)]), field('Tax % (after discount)', taxr)]), out]);
    }
  });

  /* ===================== Profit Calculator ===================== */
  C.Calc.register({
    id: 'profit', name: 'Profit Calculator', category: 'Financial', icon: '\u{1F4CA}',
    description: 'Profit, margin, markup & break-even',
    render: function (root) {
      var out = C.resultBox();
      var cp = numInput({ id: 'pfCp', value: 800 });
      var sp = numInput({ id: 'pfSp', value: 1000 });
      var fixed = numInput({ id: 'pfFix', value: 50000 });
      function calc() {
        var c = num('pfCp', root), s = num('pfSp', root), fx = num('pfFix', root);
        var profit = s - c; var margin = s > 0 ? (profit / s) * 100 : 0; var markup = c > 0 ? (profit / c) * 100 : 0;
        var breakeven = profit > 0 ? Math.ceil(fx / profit) : Infinity;
        out.innerHTML = '';
        out.appendChild(el('div', { class: 'kpi-grid' }, [C.kpi('Profit / unit', fmtMoney(profit), { class: profit >= 0 ? 'good' : 'bad' }), C.kpi('Margin', margin.toFixed(1) + '%', { class: 'primary' }), C.kpi('Markup', markup.toFixed(1) + '%'), C.kpi('Break-even Units', isFinite(breakeven) ? fmtNum(breakeven, 0) : '\u2014')]));
        var cc = C.card('Cost vs Selling', el('canvas', { 'data-h': 210 })); out.appendChild(cc);
        C.Charts.bar(cc.querySelector('canvas'), { labels: ['Cost', 'Selling', 'Profit'], fmtY: function (v) { return C.compact(v); }, datasets: [{ label: 'Amount', data: [c, s, Math.max(0, profit)], color: C.Charts.palette[0] }] });
      }
      [cp, sp, fixed].forEach(function (n) { n.addEventListener('input', debounce(calc)); });
      setTimeout(calc, 0);
      return el('div', { class: 'calc-grid' }, [C.card('Inputs', [el('div', { class: 'row' }, [field('Cost Price', cp), field('Selling Price', sp)]), field('Fixed Costs (for break-even)', fixed)]), out]);
    }
  });

  /* ===================== CAGR Calculator ===================== */
  C.Calc.register({
    id: 'cagr', name: 'CAGR Calculator', category: 'Financial', icon: '\u{1F4C9}',
    description: 'Compound annual growth rate',
    render: function (root) {
      var out = C.resultBox();
      var init = numInput({ id: 'cgI', value: 100000 }), fin = numInput({ id: 'cgF', value: 250000 }), yrs = numInput({ id: 'cgY', value: 5 });
      function calc() {
        var i = num('cgI', root), f = num('cgF', root), y = num('cgY', root);
        var cagr = (i > 0 && y > 0) ? (Math.pow(f / i, 1 / y) - 1) * 100 : 0;
        var labels = [], data = [];
        for (var k = 0; k <= y; k++) { labels.push('Y' + k); data.push(i * Math.pow(1 + cagr / 100, k)); }
        out.innerHTML = '';
        out.appendChild(el('div', { class: 'kpi-grid' }, [C.kpi('CAGR', cagr.toFixed(2) + '%', { class: 'primary' }), C.kpi('Absolute Return', (i > 0 ? ((f - i) / i * 100).toFixed(1) : 0) + '%', { class: 'good' }), C.kpi('Total Gain', fmtMoney(f - i))]));
        var c = C.card('Growth Curve', el('canvas', { 'data-h': 230 })); out.appendChild(c);
        C.Charts.line(c.querySelector('canvas'), { labels: labels, fmtY: function (v) { return C.compact(v); }, datasets: [{ label: 'Value', data: data, color: C.Charts.palette[1], fill: true }] });
      }
      [init, fin, yrs].forEach(function (n) { n.addEventListener('input', debounce(calc)); });
      setTimeout(calc, 0);
      return el('div', { class: 'calc-grid' }, [C.card('Inputs', [field('Initial Value', init), field('Final Value', fin), field('Period (years)', yrs)]), out]);
    }
  });

  /* ===================== ROI Calculator ===================== */
  C.Calc.register({
    id: 'roi', name: 'ROI Calculator', category: 'Financial', icon: '\u{1F3AF}',
    description: 'Return on investment & annualized ROI',
    render: function (root) {
      var out = C.resultBox();
      var inv = numInput({ id: 'roiI', value: 100000 }), ret = numInput({ id: 'roiR', value: 140000 }), yrs = numInput({ id: 'roiY', value: 3 });
      function calc() {
        var i = num('roiI', root), r = num('roiR', root), y = num('roiY', root);
        var profit = r - i; var roi = i > 0 ? (profit / i) * 100 : 0;
        var annual = (i > 0 && y > 0) ? (Math.pow(r / i, 1 / y) - 1) * 100 : 0;
        out.innerHTML = '';
        out.appendChild(el('div', { class: 'kpi-grid' }, [C.kpi('ROI', roi.toFixed(1) + '%', { class: 'primary' }), C.kpi('Net Profit', fmtMoney(profit), { class: profit >= 0 ? 'good' : 'bad' }), C.kpi('Annualized ROI', annual.toFixed(1) + '%')]));
      }
      [inv, ret, yrs].forEach(function (n) { n.addEventListener('input', debounce(calc)); });
      setTimeout(calc, 0);
      return el('div', { class: 'calc-grid' }, [C.card('Inputs', [field('Investment', inv), field('Final Return', ret), field('Holding Period (years)', yrs)]), out]);
    }
  });

  /* ===================== Inflation Calculator ===================== */
  C.Calc.register({
    id: 'inflation', name: 'Inflation Calculator', category: 'Financial', icon: '\u{1F4B8}',
    description: 'Purchasing power & future cost',
    render: function (root) {
      var out = C.resultBox();
      var amt = numInput({ id: 'ifA', value: 100000 }), rate = numInput({ id: 'ifR', value: 6, step: 0.1 }), yrs = numInput({ id: 'ifY', value: 10 });
      function calc() {
        var a = num('ifA', root), r = num('ifR', root) / 100, y = num('ifY', root);
        var future = a * Math.pow(1 + r, y);
        var power = a / Math.pow(1 + r, y);
        var labels = [], fData = [], pData = [];
        for (var k = 0; k <= y; k++) { labels.push('Y' + k); fData.push(a * Math.pow(1 + r, k)); pData.push(a / Math.pow(1 + r, k)); }
        out.innerHTML = '';
        out.appendChild(el('div', { class: 'kpi-grid' }, [C.kpi('Future Cost', fmtMoney(future), { class: 'bad' }), C.kpi('Today\u2019s Power in ' + y + 'y', fmtMoney(power), { class: 'primary' }), C.kpi('Value Eroded', fmtMoney(a - power))]));
        out.appendChild(el('div', { class: 'note' }, fmtMoney(a) + ' today will buy only ' + fmtMoney(power) + ' worth of goods in ' + y + ' years, and the same basket will cost ' + fmtMoney(future) + '.'));
        var c = C.card('Inflation Impact', el('canvas', { 'data-h': 230 })); out.appendChild(c);
        C.Charts.line(c.querySelector('canvas'), { labels: labels, fmtY: function (v) { return C.compact(v); }, datasets: [{ label: 'Future cost', data: fData, color: C.Charts.palette[3], fill: true }, { label: 'Purchasing power', data: pData, color: C.Charts.palette[1] }] });
      }
      [amt, rate, yrs].forEach(function (n) { n.addEventListener('input', debounce(calc)); });
      setTimeout(calc, 0);
      return el('div', { class: 'calc-grid' }, [C.card('Inputs', [field('Amount', amt), el('div', { class: 'row' }, [field('Inflation % p.a.', rate), field('Years', yrs)])]), out]);
    }
  });

  /* ===================== Currency Calculator (offline editable rates) ===================== */
  C.Calc.register({
    id: 'currency', name: 'Currency Converter', category: 'Financial', icon: '\u{1F4B1}',
    description: 'Offline multi-currency with editable rates',
    render: function (root) {
      var out = C.resultBox();
      // rates relative to 1 USD (editable, stored locally)
      var defaults = { USD: 1, INR: 83.2, EUR: 0.92, GBP: 0.79, JPY: 149.5, AUD: 1.52, CAD: 1.36, CNY: 7.24, AED: 3.67, SGD: 1.34 };
      var rates = C.Store.get('fxrates', defaults);
      var codes = Object.keys(rates);
      var amt = numInput({ id: 'fxAmt', value: 1000 });
      var from = selectInput(codes, { id: 'fxFrom', value: 'USD' });
      var to = selectInput(codes, { id: 'fxTo', value: 'INR' });
      function convert(a, f, t) { return a / rates[f] * rates[t]; }
      function calc() {
        var a = num('fxAmt', root), f = C.qs('#fxFrom', root).value, t = C.qs('#fxTo', root).value;
        var res = convert(a, f, t);
        out.innerHTML = '';
        out.appendChild(el('div', { class: 'big-result' }, fmtNum(res, 2) + ' ' + t));
        out.appendChild(el('div', { class: 'muted', style: { marginBottom: '14px' } }, a + ' ' + f + ' = ' + fmtNum(res, 4) + ' ' + t + '  \u2022  1 ' + f + ' = ' + fmtNum(convert(1, f, t), 4) + ' ' + t));
        // strength vs USD chart
        var strengthCodes = codes.filter(function (c) { return c !== 'USD'; }).slice(0, 8);
        var c = C.card('Currency Strength (units per 1 USD)', el('canvas', { 'data-h': 220 })); out.appendChild(c);
        C.Charts.bar(c.querySelector('canvas'), { labels: strengthCodes, datasets: [{ label: 'per USD', data: strengthCodes.map(function (x) { return rates[x]; }), color: C.Charts.palette[0] }] });
      }
      [amt, from, to].forEach(function (n) { n.addEventListener('input', debounce(calc)); n.addEventListener('change', debounce(calc)); });
      // editable rates table
      var rateRows = codes.map(function (code) {
        var inp = numInput({ value: rates[code], step: 0.0001 });
        inp.addEventListener('input', function () { rates[code] = parseFloat(inp.value) || rates[code]; C.Store.set('fxrates', rates); calc(); });
        return el('tr', null, [el('td', null, code), el('td', null, inp)]);
      });
      var ratesCard = C.card('Manual Rates (per 1 USD)', el('div', { class: 'tbl-wrap' }, el('table', { class: 'data' }, [el('thead', null, el('tr', null, [el('th', null, 'Currency'), el('th', null, 'Rate')])), el('tbody', null, rateRows)])), {
        action: el('button', { class: 'btn btn-sm', onClick: function () { rates = JSON.parse(JSON.stringify(defaults)); C.Store.set('fxrates', rates); C.toast('Rates reset'); window.CalcSuite.open('currency'); } }, 'Reset')
      });
      setTimeout(calc, 0);
      return el('div', { class: 'calc-grid' }, [C.card('Convert', [field('Amount', amt), el('div', { class: 'row' }, [field('From', from), field('To', to)]), el('div', { class: 'note' }, 'Rates are stored locally and fully editable \u2014 no internet needed.')]), el('div', null, [out, ratesCard])]);
    }
  });

  /* ===================== Unit Price Calculator ===================== */
  C.Calc.register({
    id: 'unitprice', name: 'Unit Price Calculator', category: 'Financial', icon: '\u{1F6D2}',
    description: 'Compare deals by cost per unit',
    render: function (root) {
      var out = C.resultBox();
      var items = [];
      var list = el('div');
      function row(price, qty, unit) {
        var p = numInput({ value: price }), q = numInput({ value: qty }), u = el('input', { class: 'inp', value: unit || 'unit' });
        var obj = { p: p, q: q, u: u };
        items.push(obj);
        var node = el('div', { class: 'card' }, el('div', { class: 'card-body' }, [el('div', { class: 'row-3' }, [field('Price', p), field('Quantity', q), field('Unit', u)])]));
        [p, q, u].forEach(function (n) { n.addEventListener('input', debounce(calc)); });
        list.appendChild(node);
      }
      function calc() {
        var results = items.map(function (it, i) { var price = parseFloat(it.p.value) || 0, qty = parseFloat(it.q.value) || 0; return { i: i, unit: qty > 0 ? price / qty : Infinity, label: 'Item ' + (i + 1) }; });
        var best = results.reduce(function (a, b) { return b.unit < a.unit ? b : a; }, { unit: Infinity });
        out.innerHTML = '';
        out.appendChild(el('div', { class: 'tbl-wrap' }, el('table', { class: 'data' }, [el('thead', null, el('tr', null, [el('th', null, 'Item'), el('th', null, 'Cost / unit')])), el('tbody', null, results.map(function (r) { return el('tr', null, [el('td', null, r.label + (r.i === best.i && isFinite(best.unit) ? ' \u2605 best' : '')), el('td', null, isFinite(r.unit) ? fmtMoney(r.unit, { decimals: 2 }) : '\u2014')]); }))])));
        if (isFinite(best.unit)) out.appendChild(el('div', { class: 'note' }, 'Best deal: Item ' + (best.i + 1) + ' at ' + fmtMoney(best.unit, { decimals: 2 }) + ' per unit.'));
      }
      row(100, 1, 'kg'); row(450, 5, 'kg');
      setTimeout(calc, 0);
      return el('div', { class: 'calc-grid' }, [C.card('Items', [list, el('button', { class: 'btn btn-sm', style: { marginTop: '8px' }, onClick: function () { row(0, 1, 'unit'); } }, '+ Add item')]), out]);
    }
  });
})();
