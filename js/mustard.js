/**
 * Shared mustard mix for printed pieces.
 * Screen #BFA52B matches the napkin / painted A-frame and prints lemon.
 * Curry / Dijon / Ochre are print-first: more olive, less school-bus yellow.
 */
(function (w) {
  'use strict';

  var KEY = 'wedding-mustard-v1';
  var SCREEN = '#BFA52B';
  var CURRY = '#9A9322';
  var PRESETS = [
    { id: 'screen', hex: '#BFA52B', label: 'Screen', hint: 'napkin / A-frame' },
    { id: 'curry', hex: '#9A9322', label: 'Curry', hint: 'try this print' },
    { id: 'dijon', hex: '#B08A1C', label: 'Dijon', hint: 'browner' },
    { id: 'ochre', hex: '#8A7418', label: 'Ochre', hint: 'deeper dirt' }
  ];

  var hex = CURRY;
  var listeners = [];
  var uiBound = false;

  function norm(value) {
    var s = String(value || '').trim().replace(/^#/, '').toUpperCase();
    if (/^[0-9A-F]{3}$/.test(s)) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    if (!/^[0-9A-F]{6}$/.test(s)) return null;
    return '#' + s;
  }

  function rgb(h) {
    return [
      parseInt(h.slice(1, 3), 16),
      parseInt(h.slice(3, 5), 16),
      parseInt(h.slice(5, 7), 16)
    ];
  }

  function toHex(r, g, b) {
    return '#' + [r, g, b].map(function (n) {
      return ('0' + Math.round(Math.max(0, Math.min(255, n))).toString(16)).slice(-2);
    }).join('').toUpperCase();
  }

  function toHsl(h) {
    var c = rgb(h);
    var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var l = (max + min) / 2;
    var s = 0, hue = 48;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) * 60;
      else if (max === g) hue = ((b - r) / d + 2) * 60;
      else hue = ((r - g) / d + 4) * 60;
    }
    return { h: hue, s: s * 100, l: l * 100 };
  }

  function fromHsl(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s = Math.max(0, Math.min(100, s)) / 100;
    l = Math.max(0, Math.min(100, l)) / 100;
    if (s === 0) {
      var g = l * 255;
      return toHex(g, g, g);
    }
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    function hue(t) {
      if (t < 0) t += 1;
      if (t > 1) t += -1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }
    var hh = h / 360;
    return toHex(hue(hh + 1 / 3) * 255, hue(hh) * 255, hue(hh - 1 / 3) * 255);
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      var next = norm(data && data.hex);
      if (next) hex = next;
    } catch (e) { /* private mode */ }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ hex: hex })); } catch (e) {}
  }

  function presetId(h) {
    var i;
    for (i = 0; i < PRESETS.length; i++) {
      if (PRESETS[i].hex === h) return PRESETS[i].id;
    }
    return '';
  }

  function hueWord(deg) {
    if (deg < 46) return 'gold';
    if (deg < 56) return 'curry';
    return 'olive';
  }

  function paintUi() {
    if (!uiBound) return;
    var wheel = document.getElementById('mustard-wheel');
    var field = document.getElementById('mustard-hex');
    var hue = document.getElementById('mustard-hue');
    var sat = document.getElementById('mustard-sat');
    var lit = document.getElementById('mustard-lit');
    var hueOut = document.getElementById('mustard-hue-out');
    var satOut = document.getElementById('mustard-sat-out');
    var litOut = document.getElementById('mustard-lit-out');
    var hsl = toHsl(hex);
    if (wheel) wheel.value = hex.toLowerCase();
    if (field && document.activeElement !== field) field.value = hex;
    if (hue) hue.value = String(Math.round(hsl.h));
    if (sat) sat.value = String(Math.round(hsl.s));
    if (lit) lit.value = String(Math.round(hsl.l));
    if (hueOut) hueOut.textContent = hueWord(hsl.h);
    if (satOut) satOut.textContent = Math.round(hsl.s) + '%';
    if (litOut) litOut.textContent = Math.round(hsl.l) + '%';
    var on = presetId(hex);
    document.querySelectorAll('#mustard-presets [data-mix]').forEach(function (btn) {
      btn.classList.toggle('on', btn.getAttribute('data-mix') === on);
    });
  }

  function set(next, persistChange) {
    var clean = norm(next);
    if (!clean) return hex;
    hex = clean;
    if (persistChange !== false) save();
    paintUi();
    listeners.forEach(function (fn) { fn(hex); });
    return hex;
  }

  function get() {
    return hex;
  }

  function onChange(fn) {
    if (typeof fn === 'function') listeners.push(fn);
  }

  function renderPresets() {
    var host = document.getElementById('mustard-presets');
    if (!host || host.getAttribute('data-ready')) return;
    host.setAttribute('data-ready', '1');
    host.innerHTML = PRESETS.map(function (p) {
      var rec = p.id === 'curry' ? ' <em>try this</em>' : '';
      return '<button type="button" class="mix-chip" data-mix="' + p.id + '" title="' + p.hint + '">' +
        '<i style="background:' + p.hex + '"></i>' + p.label + rec + '</button>';
    }).join('');
    host.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-mix]');
      if (!btn) return;
      var id = btn.getAttribute('data-mix');
      var p = PRESETS.filter(function (x) { return x.id === id; })[0];
      if (p) set(p.hex);
    });
  }

  function bind() {
    if (uiBound) {
      paintUi();
      return;
    }
    if (!document.getElementById('mustard-wheel')) return;
    uiBound = true;
    renderPresets();

    var wheel = document.getElementById('mustard-wheel');
    var field = document.getElementById('mustard-hex');
    var hue = document.getElementById('mustard-hue');
    var sat = document.getElementById('mustard-sat');
    var lit = document.getElementById('mustard-lit');

    if (wheel) {
      wheel.addEventListener('input', function () { set(wheel.value); });
    }
    if (field) {
      field.addEventListener('change', function () {
        if (!set(field.value)) field.value = hex;
      });
      field.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (!set(field.value)) field.value = hex;
        }
      });
    }
    function fromSliders() {
      set(fromHsl(
        hue ? parseFloat(hue.value) : toHsl(hex).h,
        sat ? parseFloat(sat.value) : toHsl(hex).s,
        lit ? parseFloat(lit.value) : toHsl(hex).l
      ));
    }
    [hue, sat, lit].forEach(function (el) {
      if (el) el.addEventListener('input', fromSliders);
    });
    paintUi();
  }

  load();
  w.WeddingMustard = {
    SCREEN: SCREEN,
    CURRY: CURRY,
    PRESETS: PRESETS,
    get: get,
    set: set,
    bind: bind,
    onChange: onChange
  };
})(window);
