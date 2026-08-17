/* Date & Time calculators */
(function () {
  'use strict';
  var C = window.CS;
  var el = C.el, field = C.field, numInput = C.numInput, selectInput = C.selectInput;
  function debounce(fn) { var t; return function () { clearTimeout(t); t = setTimeout(fn, 80); }; }
  function dateInput(val) { return el('input', { type: 'date', class: 'inp', value: val || '' }); }

  var ZODIAC = [['Capricorn', 1, 20], ['Aquarius', 2, 19], ['Pisces', 3, 20], ['Aries', 4, 20], ['Taurus', 5, 21], ['Gemini', 6, 21], ['Cancer', 7, 22], ['Leo', 8, 23], ['Virgo', 9, 23], ['Libra', 10, 23], ['Scorpio', 11, 22], ['Sagittarius', 12, 22], ['Capricorn', 12, 31]];
  function zodiac(m, d) { for (var i = 0; i < ZODIAC.length; i++) { if (m < ZODIAC[i][1] || (m === ZODIAC[i][1] && d <= ZODIAC[i][2])) return ZODIAC[i][0]; } return 'Capricorn'; }
  var CHINESE = ['Monkey', 'Rooster', 'Dog', 'Pig', 'Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat'];
  function chinese(y) { return CHINESE[y % 12]; }
  var BIRTHSTONE = ['Garnet', 'Amethyst', 'Aquamarine', 'Diamond', 'Emerald', 'Pearl', 'Ruby', 'Peridot', 'Sapphire', 'Opal', 'Topaz', 'Turquoise'];

  /* ===================== Age Calculator ===================== */
  C.Calc.register({
    id: 'age', name: 'Age Calculator', category: 'Date & Time', icon: '\u{1F382}',
    description: 'Exact age + zodiac, birthday countdown, retirement',
    render: function (root) {
      var out = C.resultBox();
      var dob = dateInput('1995-06-15');
      var future = dateInput(new Date().toISOString().slice(0, 10));
      var retireAge = numInput({ value: 60 });
      function calc() {
        if (!dob.value) return;
        var b = new Date(dob.value), now = new Date(future.value || Date.now());
        if (isNaN(b) || isNaN(now)) return;
        var years = now.getFullYear() - b.getFullYear();
        var months = now.getMonth() - b.getMonth();
        var days = now.getDate() - b.getDate();
        if (days < 0) { months--; var pm = new Date(now.getFullYear(), now.getMonth(), 0).getDate(); days += pm; }
        if (months < 0) { years--; months += 12; }
        var diffMs = now - b;
        var totalDays = Math.floor(diffMs / 86400000);
        var totalHours = Math.floor(diffMs / 3600000);
        var totalMin = Math.floor(diffMs / 60000);
        var totalSec = Math.floor(diffMs / 1000);
        // next birthday
        var nb = new Date(now.getFullYear(), b.getMonth(), b.getDate());
        if (nb < now) nb.setFullYear(now.getFullYear() + 1);
        var daysToBday = Math.ceil((nb - now) / 86400000);
        var bdayDow = nb.toLocaleDateString(undefined, { weekday: 'long' });
        out.innerHTML = '';
        out.appendChild(el('div', { class: 'big-result' }, years + ' years, ' + months + ' months, ' + days + ' days'));
        out.appendChild(el('div', { class: 'kpi-grid', style: { marginTop: '14px' } }, [
          C.kpi('Months', C.fmtNum(years * 12 + months, 0)), C.kpi('Weeks', C.fmtNum(Math.floor(totalDays / 7), 0)),
          C.kpi('Days', C.fmtNum(totalDays, 0)), C.kpi('Hours', C.fmtNum(totalHours, 0)),
          C.kpi('Minutes', C.fmtNum(totalMin, 0)), C.kpi('Seconds', C.fmtNum(totalSec, 0))
        ]));
        out.appendChild(el('div', { class: 'kpi-grid' }, [
          C.kpi('Next Birthday', daysToBday + ' days', { class: 'primary' }),
          C.kpi('Birthday Falls On', bdayDow),
          C.kpi('Zodiac', zodiac(b.getMonth() + 1, b.getDate())),
          C.kpi('Chinese Zodiac', chinese(b.getFullYear())),
          C.kpi('Birthstone', BIRTHSTONE[b.getMonth()]),
          C.kpi('Retire in', Math.max(0, num(retireAge) - years) + ' years', { class: 'good' })
        ]));
        // life progress bar (vs 80yr expectancy)
        var lifePct = Math.min(100, (years + months / 12) / 80 * 100);
        var lp = C.card('Life Progress (of ~80 years)', el('canvas', { 'data-h': 70 })); out.appendChild(lp);
        C.Charts.progress(lp.querySelector('canvas'), lifePct, { color: C.Charts.palette[4] });
      }
      function num(n) { var v = parseFloat(n.value); return isFinite(v) ? v : 0; }
      [dob, future, retireAge].forEach(function (n) { n.addEventListener('input', debounce(calc)); n.addEventListener('change', debounce(calc)); });
      setTimeout(calc, 0);
      return el('div', { class: 'calc-grid' }, [C.card('Inputs', [field('Date of Birth', dob), field('Calculate age at (date)', future), field('Retirement Age', retireAge)]), out]);
    }
  });

  /* ===================== Date Calculator ===================== */
  C.Calc.register({
    id: 'date', name: 'Date Calculator', category: 'Date & Time', icon: '\u{1F4C5}',
    description: 'Difference, add/subtract days, business days',
    render: function (root) {
      var out = C.resultBox();
      var mode = 'diff';
      var d1 = dateInput(new Date().toISOString().slice(0, 10));
      var d2 = dateInput(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
      var addDays = numInput({ value: 30 });
      var addUnit = selectInput([{ value: 'days', label: 'Days' }, { value: 'weeks', label: 'Weeks' }, { value: 'months', label: 'Months' }, { value: 'years', label: 'Years' }], { value: 'days' });
      var opSeg = selectInput([{ value: 'add', label: 'Add' }, { value: 'sub', label: 'Subtract' }], { value: 'add' });
      var inputWrap = el('div');
      function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
      function businessDays(a, b) { var cnt = 0, cur = new Date(a); while (cur <= b) { var dow = cur.getDay(); if (dow !== 0 && dow !== 6) cnt++; cur.setDate(cur.getDate() + 1); } return cnt; }
      function buildInputs() {
        inputWrap.innerHTML = '';
        if (mode === 'diff') inputWrap.appendChild(el('div', null, [field('From Date', d1), field('To Date', d2)]));
        else inputWrap.appendChild(el('div', null, [field('Start Date', d1), el('div', { class: 'row' }, [field('Operation', opSeg), field('Amount', addDays)]), field('Unit', addUnit)]));
      }
      function calc() {
        out.innerHTML = '';
        if (mode === 'diff') {
          var a = new Date(d1.value), b = new Date(d2.value); if (isNaN(a) || isNaN(b)) return;
          if (b < a) { var t = a; a = b; b = t; }
          var days = Math.round((b - a) / 86400000);
          var bd = businessDays(a, b);
          out.appendChild(el('div', { class: 'big-result' }, days + ' days'));
          out.appendChild(el('div', { class: 'kpi-grid', style: { marginTop: '14px' } }, [C.kpi('Weeks', C.fmtNum(Math.floor(days / 7), 0) + ' wk ' + (days % 7) + 'd'), C.kpi('Months \u2248', C.fmtNum(days / 30.44, 1)), C.kpi('Business Days', C.fmtNum(bd, 0)), C.kpi('Weekend Days', C.fmtNum(days + 1 - bd, 0))]));
          out.appendChild(el('div', { class: 'note' }, (isLeap(a.getFullYear()) ? a.getFullYear() + ' is a leap year. ' : '') + 'Business days exclude Saturdays and Sundays.'));
        } else {
          var s = new Date(d1.value); if (isNaN(s)) return;
          var amt = (parseFloat(addDays.value) || 0) * (opSeg.value === 'sub' ? -1 : 1);
          var r = new Date(s);
          if (addUnit.value === 'days') r.setDate(r.getDate() + amt);
          else if (addUnit.value === 'weeks') r.setDate(r.getDate() + amt * 7);
          else if (addUnit.value === 'months') r.setMonth(r.getMonth() + amt);
          else r.setFullYear(r.getFullYear() + amt);
          out.appendChild(el('div', { class: 'big-result' }, r.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })));
          out.appendChild(el('div', { class: 'note', style: { marginTop: '14px' } }, 'ISO: ' + r.toISOString().slice(0, 10)));
        }
      }
      var tabBar = C.tabs([{ id: 'diff', label: 'Difference' }, { id: 'addsub', label: 'Add / Subtract' }], function (id) { mode = id; buildInputs(); calc(); });
      [d1, d2, addDays, addUnit, opSeg].forEach(function (n) { n.addEventListener('input', debounce(calc)); n.addEventListener('change', debounce(calc)); });
      buildInputs(); setTimeout(calc, 0);
      return el('div', null, [tabBar, el('div', { class: 'calc-grid' }, [C.card('Inputs', inputWrap), out])]);
    }
  });

  /* ===================== Time Calculator ===================== */
  C.Calc.register({
    id: 'time', name: 'Time Calculator', category: 'Date & Time', icon: '\u23F1\uFE0F',
    description: 'Add/subtract time & work-hour calculator',
    render: function (root) {
      var out = C.resultBox();
      var mode = 'addsub';
      // add/subtract
      var h1 = numInput({ value: 5 }), m1 = numInput({ value: 30 }), s1 = numInput({ value: 0 });
      var h2 = numInput({ value: 2 }), m2 = numInput({ value: 45 }), s2 = numInput({ value: 0 });
      var op = selectInput([{ value: 'add', label: 'Add (+)' }, { value: 'sub', label: 'Subtract (\u2212)' }], { value: 'add' });
      // work hours
      var start = el('input', { type: 'time', class: 'inp', value: '09:00' });
      var end = el('input', { type: 'time', class: 'inp', value: '17:30' });
      var brk = numInput({ value: 60 });
      var inputWrap = el('div');
      function n(x) { return parseFloat(x.value) || 0; }
      function fmtHMS(totalSec) {
        var sign = totalSec < 0 ? '-' : ''; totalSec = Math.abs(totalSec);
        var h = Math.floor(totalSec / 3600), m = Math.floor((totalSec % 3600) / 60), s = Math.round(totalSec % 60);
        return sign + h + 'h ' + m + 'm ' + s + 's';
      }
      function build() {
        inputWrap.innerHTML = '';
        if (mode === 'addsub') {
          inputWrap.appendChild(el('div', null, [
            el('div', { class: 'field-label' }, 'Time 1 (h / m / s)'), el('div', { class: 'row-3' }, [h1, m1, s1]),
            field('Operation', op),
            el('div', { class: 'field-label' }, 'Time 2 (h / m / s)'), el('div', { class: 'row-3' }, [h2, m2, s2])
          ]));
        } else {
          inputWrap.appendChild(el('div', null, [el('div', { class: 'row' }, [field('Start Time', start), field('End Time', end)]), field('Break (minutes)', brk)]));
        }
      }
      function calc() {
        out.innerHTML = '';
        if (mode === 'addsub') {
          var t1 = n(h1) * 3600 + n(m1) * 60 + n(s1);
          var t2 = n(h2) * 3600 + n(m2) * 60 + n(s2);
          var r = op.value === 'add' ? t1 + t2 : t1 - t2;
          out.appendChild(el('div', { class: 'big-result' }, fmtHMS(r)));
          out.appendChild(el('div', { class: 'kpi-grid', style: { marginTop: '14px' } }, [C.kpi('Total Hours', C.fmtNum(r / 3600, 2)), C.kpi('Total Minutes', C.fmtNum(r / 60, 1)), C.kpi('Total Seconds', C.fmtNum(r, 0))]));
        } else {
          var sp = start.value.split(':'), ep = end.value.split(':');
          var sMin = (+sp[0]) * 60 + (+sp[1]), eMin = (+ep[0]) * 60 + (+ep[1]);
          if (eMin < sMin) eMin += 1440;
          var worked = eMin - sMin - n(brk);
          out.appendChild(el('div', { class: 'big-result' }, fmtHMS(worked * 60)));
          out.appendChild(el('div', { class: 'kpi-grid', style: { marginTop: '14px' } }, [C.kpi('Worked Hours', C.fmtNum(worked / 60, 2)), C.kpi('Break', n(brk) + ' min'), C.kpi('Decimal Hours', C.fmtNum(worked / 60, 2))]));
        }
      }
      var tabBar = C.tabs([{ id: 'addsub', label: 'Add / Subtract' }, { id: 'work', label: 'Work Hours' }], function (id) { mode = id; build(); calc(); });
      [h1, m1, s1, h2, m2, s2, op, start, end, brk].forEach(function (x) { x.addEventListener('input', debounce(calc)); x.addEventListener('change', debounce(calc)); });
      build(); setTimeout(calc, 0);
      return el('div', null, [tabBar, el('div', { class: 'calc-grid' }, [C.card('Inputs', inputWrap), out])]);
    }
  });
})();
