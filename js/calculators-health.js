/* Health calculators */
(function () {
  'use strict';
  var C = window.CS;
  var el = C.el, field = C.field, numInput = C.numInput, selectInput = C.selectInput;
  function debounce(fn) { var t; return function () { clearTimeout(t); t = setTimeout(fn, 100); }; }
  function num(n) { var v = parseFloat(n.value); return isFinite(v) ? v : 0; }

  function genderSeg(initial) {
    var seg = el('div', { class: 'seg' }, [el('button', { class: initial === 'male' ? 'active' : '', 'data-v': 'male' }, '\u2642 Male'), el('button', { class: initial === 'female' ? 'active' : '', 'data-v': 'female' }, '\u2640 Female')]);
    seg._value = initial;
    C.qsa('button', seg).forEach(function (b) { b.addEventListener('click', function () { C.qsa('button', seg).forEach(function (x) { x.classList.remove('active'); }); b.classList.add('active'); seg._value = b.getAttribute('data-v'); if (seg._onchange) seg._onchange(); }); });
    return seg;
  }

  /* ===================== BMI Calculator ===================== */
  C.Calc.register({
    id: 'bmi', name: 'BMI Calculator', category: 'Health', icon: '\u2696\uFE0F',
    description: 'BMI, ideal weight, body fat & calorie needs',
    render: function (root) {
      var out = C.resultBox();
      var unit = el('div', { class: 'seg' }, [el('button', { class: 'active', 'data-v': 'metric' }, 'Metric'), el('button', { 'data-v': 'imperial' }, 'Imperial')]);
      var unitVal = 'metric';
      var height = numInput({ value: 170 }), weight = numInput({ value: 70 }), age = numInput({ value: 30 });
      var hLabel = el('span', { class: 'field-label' }, 'Height (cm)'), wLabel = el('span', { class: 'field-label' }, 'Weight (kg)');
      var gender = genderSeg('male');
      C.qsa('button', unit).forEach(function (b) { b.addEventListener('click', function () { C.qsa('button', unit).forEach(function (x) { x.classList.remove('active'); }); b.classList.add('active'); unitVal = b.getAttribute('data-v'); hLabel.textContent = unitVal === 'metric' ? 'Height (cm)' : 'Height (inches)'; wLabel.textContent = unitVal === 'metric' ? 'Weight (kg)' : 'Weight (lb)'; calc(); }); });
      gender._onchange = function () { calc(); };

      function calc() {
        var h = num(height), w = num(weight), a = num(age), g = gender._value;
        var hm = unitVal === 'metric' ? h / 100 : h * 0.0254;
        var wkg = unitVal === 'metric' ? w : w * 0.453592;
        var bmi = hm > 0 ? wkg / (hm * hm) : 0;
        var cat, cls;
        if (bmi < 18.5) { cat = 'Underweight'; cls = 'amber'; }
        else if (bmi < 25) { cat = 'Normal'; cls = 'green'; }
        else if (bmi < 30) { cat = 'Overweight'; cls = 'amber'; }
        else { cat = 'Obese'; cls = 'red'; }
        var idealLow = 18.5 * hm * hm, idealHigh = 24.9 * hm * hm;
        // Body fat (Deurenberg): 1.20*BMI + 0.23*age - 10.8*sex - 5.4
        var sex = g === 'male' ? 1 : 0;
        var bodyFat = 1.20 * bmi + 0.23 * a - 10.8 * sex - 5.4;
        var leanMass = wkg * (1 - bodyFat / 100);
        // Mifflin BMR
        var hcm = unitVal === 'metric' ? h : h * 2.54;
        var bmr = 10 * wkg + 6.25 * hcm - 5 * a + (g === 'male' ? 5 : -161);
        out.innerHTML = '';
        out.appendChild(el('div', { class: 'kpi-grid' }, [
          C.kpi('BMI Score', C.fmtNum(bmi, 1), { class: 'primary' }),
          C.kpi('Category', cat, {}),
          C.kpi('Body Fat', C.fmtNum(Math.max(0, bodyFat), 1) + '%'),
          C.kpi('Lean Mass', C.fmtNum(leanMass, 1) + ' kg')
        ]));
        out.querySelectorAll('.kpi')[1].querySelector('.kpi-value').innerHTML = '<span class="badge ' + cls + '">' + cat + '</span>';
        var gc = C.card('BMI Meter', el('canvas', { 'data-h': 150 })); out.appendChild(gc);
        C.Charts.gauge(gc.querySelector('canvas'), bmi, { min: 12, max: 40, label: C.fmtNum(bmi, 1), sub: cat, segments: [{ to: 18.5, color: '#f59e0b' }, { to: 25, color: '#22c55e' }, { to: 30, color: '#f59e0b' }, { to: 40, color: '#ef4444' }] });
        out.appendChild(el('div', { class: 'note' }, 'Ideal weight range: ' + C.fmtNum(idealLow, 1) + '\u2013' + C.fmtNum(idealHigh, 1) + ' kg \u2022 Maintenance calories \u2248 ' + C.fmtNum(bmr * 1.4, 0) + ' kcal/day (lightly active).'));
        // weight tracker
        renderTracker();
      }
      var trackerBox = el('div');
      function renderTracker() {
        var log = C.Store.get('weightlog', []);
        trackerBox.innerHTML = '';
        var wInput = numInput({ placeholder: 'kg' });
        var addBtn = el('button', { class: 'btn btn-sm btn-primary', onClick: function () { var v = parseFloat(wInput.value); if (isFinite(v)) { log.push({ t: Date.now(), w: v }); C.Store.set('weightlog', log); wInput.value = ''; renderTracker(); } } }, 'Log');
        trackerBox.appendChild(el('div', { class: 'row', style: { gridTemplateColumns: '1fr auto' } }, [wInput, addBtn]));
        if (log.length) {
          var cv = el('canvas', { 'data-h': 170 }); trackerBox.appendChild(el('div', { class: 'chart-wrap', style: { marginTop: '10px' } }, cv));
          C.Charts.line(cv, { labels: log.map(function (x, i) { return '#' + (i + 1); }), datasets: [{ label: 'Weight', data: log.map(function (x) { return x.w; }), color: C.Charts.palette[5], fill: true }] });
          trackerBox.appendChild(el('button', { class: 'btn btn-sm', style: { marginTop: '8px' }, onClick: function () { C.Store.remove('weightlog'); renderTracker(); } }, 'Clear log'));
        }
      }
      [height, weight, age].forEach(function (n) { n.addEventListener('input', debounce(calc)); });
      setTimeout(calc, 0);
      return el('div', { class: 'calc-grid' }, [
        C.card('Your Details', [field('Units', unit), el('label', { class: 'field' }, [hLabel, height]), el('label', { class: 'field' }, [wLabel, weight]), el('div', { class: 'row' }, [field('Gender', gender), field('Age', age)])]),
        el('div', null, [out, C.card('Weight Tracker', trackerBox)])
      ]);
    }
  });

  /* ===================== BMR Calculator ===================== */
  C.Calc.register({
    id: 'bmr', name: 'BMR Calculator', category: 'Health', icon: '\u{1F525}',
    description: 'Basal metabolic rate (Mifflin & Harris-Benedict)',
    render: function (root) {
      var out = C.resultBox();
      var h = numInput({ value: 170 }), w = numInput({ value: 70 }), a = numInput({ value: 30 });
      var gender = genderSeg('male'); gender._onchange = function () { calc(); };
      function calc() {
        var H = num(h), W = num(w), A = num(a), male = gender._value === 'male';
        var mifflin = 10 * W + 6.25 * H - 5 * A + (male ? 5 : -161);
        var harris = male ? 88.362 + 13.397 * W + 4.799 * H - 5.677 * A : 447.593 + 9.247 * W + 3.098 * H - 4.330 * A;
        out.innerHTML = '';
        out.appendChild(el('div', { class: 'kpi-grid' }, [C.kpi('BMR (Mifflin)', C.fmtNum(mifflin, 0) + ' kcal', { class: 'primary' }), C.kpi('BMR (Harris-Benedict)', C.fmtNum(harris, 0) + ' kcal')]));
        var levels = [['Sedentary', 1.2], ['Light', 1.375], ['Moderate', 1.55], ['Active', 1.725], ['Very active', 1.9]];
        out.appendChild(C.card('Daily Maintenance Calories', el('div', { class: 'tbl-wrap' }, el('table', { class: 'data' }, [el('thead', null, el('tr', null, [el('th', null, 'Activity'), el('th', null, 'Calories / day')])), el('tbody', null, levels.map(function (l) { return el('tr', null, [el('td', null, l[0]), el('td', null, C.fmtNum(mifflin * l[1], 0) + ' kcal')]); }))]))));
      }
      [h, w, a].forEach(function (n) { n.addEventListener('input', debounce(calc)); });
      setTimeout(calc, 0);
      return el('div', { class: 'calc-grid' }, [C.card('Details', [el('div', { class: 'row' }, [field('Height (cm)', h), field('Weight (kg)', w)]), el('div', { class: 'row' }, [field('Age', a), field('Gender', gender)])]), out]);
    }
  });

  /* ===================== Calorie Calculator ===================== */
  C.Calc.register({
    id: 'calorie', name: 'Calorie Calculator', category: 'Health', icon: '\u{1F957}',
    description: 'Maintenance, weight loss & gain calories + macros',
    render: function (root) {
      var out = C.resultBox();
      var h = numInput({ value: 170 }), w = numInput({ value: 70 }), a = numInput({ value: 30 });
      var gender = genderSeg('male'); gender._onchange = function () { calc(); };
      var activity = selectInput([{ value: '1.2', label: 'Sedentary (little exercise)' }, { value: '1.375', label: 'Light (1-3 days/wk)' }, { value: '1.55', label: 'Moderate (3-5 days/wk)' }, { value: '1.725', label: 'Active (6-7 days/wk)' }, { value: '1.9', label: 'Very active (athlete)' }], { value: '1.55' });
      function calc() {
        var H = num(h), W = num(w), A = num(a), male = gender._value === 'male', mult = parseFloat(activity.value);
        var bmr = 10 * W + 6.25 * H - 5 * A + (male ? 5 : -161);
        var maintain = bmr * mult;
        out.innerHTML = '';
        out.appendChild(el('div', { class: 'kpi-grid' }, [
          C.kpi('Maintenance', C.fmtNum(maintain, 0), { class: 'primary' }),
          C.kpi('Mild Loss (-0.25kg/wk)', C.fmtNum(maintain - 275, 0), { class: 'good' }),
          C.kpi('Loss (-0.5kg/wk)', C.fmtNum(maintain - 550, 0), { class: 'good' }),
          C.kpi('Gain (+0.5kg/wk)', C.fmtNum(maintain + 550, 0))
        ]));
        var protein = W * 1.8, fat = maintain * 0.25 / 9, carbs = (maintain - protein * 4 - fat * 9) / 4;
        var mc = C.card('Suggested Macros (maintenance)', el('canvas', { 'data-h': 200 })); out.appendChild(mc);
        C.Charts.pie(mc.querySelector('canvas'), [{ label: 'Protein ' + C.fmtNum(protein, 0) + 'g', value: protein * 4, color: C.Charts.palette[0] }, { label: 'Carbs ' + C.fmtNum(carbs, 0) + 'g', value: carbs * 4, color: C.Charts.palette[1] }, { label: 'Fat ' + C.fmtNum(fat, 0) + 'g', value: fat * 9, color: C.Charts.palette[2] }], { donut: true });
      }
      [h, w, a, activity].forEach(function (n) { n.addEventListener('input', debounce(calc)); n.addEventListener('change', debounce(calc)); });
      setTimeout(calc, 0);
      return el('div', { class: 'calc-grid' }, [C.card('Details', [el('div', { class: 'row' }, [field('Height (cm)', h), field('Weight (kg)', w)]), el('div', { class: 'row' }, [field('Age', a), field('Gender', gender)]), field('Activity Level', activity)]), out]);
    }
  });
})();
