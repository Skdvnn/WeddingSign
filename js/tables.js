/**
 * Table-number sign explorer — live type, photos, colour, and 5×7 print.
 */
(function () {
  'use strict';

  var WORDS = [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
    'seventeen', 'eighteen', 'nineteen', 'twenty'
  ];
  var ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
    'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];

  var G = {
    bone: { hex: '#E7E3DA', name: 'bone' },
    white: { hex: '#FAF8F4', name: 'white' },
    mustard: { hex: '#BFA52B', name: 'mustard' },
    ink: { hex: '#1E1D1A', name: 'ink' }
  };
  var T = {
    ink: { hex: '#1E1D1A', name: 'black' },
    white: { hex: '#F4F1EA', name: 'bone' },
    mustard: { hex: '#BFA52B', name: 'mustard' }
  };

  var NF = {
    instrument: { f: "var(--font-invite-serif)", wt: 400, trk: '-.006em', s: 1, acc: "var(--font-invite-serif)", n: 'Your invite face.' },
    helveticablack: { f: "var(--font-std-black)", wt: 900, trk: '-.02em', s: 0.88, acc: "var(--font-invite-serif)", n: 'Save-the-date display face (Helvetica Neue Black).' },
    playfair: { f: "'Playfair Display',serif", wt: 500, trk: '-.014em', s: 0.92, acc: "'Playfair Display',serif", n: 'Rounder neighbour to Instrument.' },
    bodoni: { f: "'Bodoni Moda',serif", wt: 500, trk: '-.008em', s: 0.94, acc: "'Bodoni Moda',serif", n: 'Higher contrast — the dressiest numeral.' },
    dmserif: { f: "'DM Serif Display',serif", wt: 400, trk: '-.018em', s: 0.92, acc: "'DM Serif Display',serif", n: 'Same silhouette as Instrument, thicker hairlines.' },
    ebgaramond: { f: "'EB Garamond',serif", wt: 500, trk: '-.004em', s: 0.98, acc: "'EB Garamond',serif", n: 'Bookish old-style. Quiet, formal.' }
  };
  var DF = {
    robotomono: { f: "var(--font-invite-mono)", wt: 400, t1: '.2em', t2: '.12em', n: 'invite details' },
    helveticathin: { f: "var(--font-std-thin)", wt: 100, t1: '.08em', t2: '.06em', n: 'STD footer' },
    serifcaps: { f: "var(--font-invite-serif)", wt: 400, t1: '.22em', t2: '.16em', n: 'serif, letterspaced' },
    inter: { f: 'Inter,sans-serif', wt: 500, t1: '.18em', t2: '.12em', n: 'neutral grotesque' }
  };

  var ground = 'bone', text = 'ink';
  var photoA = 'assets/photos/allison.jpg';
  var photoB = 'assets/photos/skylar.jpg';

  function lum(hex) {
    var c = [1, 3, 5].map(function (i) {
      var v = parseInt(hex.substr(i, 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function ratio(a, b) {
    var l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  function mustardHex() {
    return (window.WeddingMustard && window.WeddingMustard.get()) || G.mustard.hex;
  }

  function applyColor() {
    var mix = mustardHex();
    G.mustard.hex = mix;
    T.mustard.hex = mix;
    var gh = G[ground].hex, fg = T[text].hex;
    document.querySelectorAll('[data-g]').forEach(function (el) {
      el.style.background = gh;
      el.style.color = fg;
    });
    document.querySelectorAll('[data-fg]').forEach(function (el) { el.style.color = fg; });
    document.querySelectorAll('[data-inv]').forEach(function (el) {
      el.style.background = fg;
      el.style.color = gh;
    });
    document.querySelectorAll('[data-overlay]').forEach(function (el) {
      el.style.color = gh;
    });
    var band = ground === 'mustard' ? '#1E1D1A' : (ground === 'ink' ? '#E7E3DA' : mix);
    var onBand = ratio(band, '#F4F1EA') > ratio(band, '#1E1D1A') ? '#F4F1EA' : '#1E1D1A';
    document.querySelectorAll('[data-band]').forEach(function (el) {
      el.style.background = band;
      el.style.color = onBand;
    });
    document.querySelectorAll('[data-band-bg]').forEach(function (el) { el.style.background = band; });
    document.querySelectorAll('[data-band-fg]').forEach(function (el) { el.style.color = onBand; });
    var r = ratio(gh, fg);
    var w = document.getElementById('warn');
    var t = document.getElementById('warntxt');
    if (w && t) {
      if (r < 4.5) {
        w.classList.add('show');
        t.textContent = T[text].name + ' on ' + G[ground].name + ' is ' + r.toFixed(1) + ':1 — muddy on a table in candlelight.';
      } else {
        w.classList.remove('show');
      }
    }
    summarise();
  }

  function summarise() {
    var el = document.getElementById('summary');
    if (!el) return;
    var nf = document.getElementById('nf');
    var n = document.getElementById('tnum');
    el.innerHTML =
      '<span class="swatchdot" style="background:' + G[ground].hex + '"></span><b>' + G[ground].name + '</b> stock' +
      '<span class="dot">·</span><span class="swatchdot" style="background:' + T[text].hex + '"></span><b>' + T[text].name + '</b> type' +
      '<span class="dot">·</span><b>Table ' + (n ? n.value : '4') + '</b>' +
      '<span class="dot">·</span><b>' + (nf ? nf.options[nf.selectedIndex].text : 'Instrument Serif') + '</b>' +
      '<span class="dot">·</span>5 × 7 in';
  }

  function applyType() {
    var nfEl = document.getElementById('nf');
    var dfEl = document.getElementById('df');
    if (!nfEl || !dfEl) return;
    if (window.WeddingFonts) {
      window.WeddingFonts.ensure(nfEl.value);
      window.WeddingFonts.ensure(dfEl.value);
    }
    var n = NF[nfEl.value] || NF.instrument;
    var d = DF[dfEl.value] || DF.robotomono;
    var r = document.documentElement.style;
    r.setProperty('--nmfont', n.f);
    r.setProperty('--accfont', n.acc);
    r.setProperty('--nmwt', String(n.wt));
    r.setProperty('--nmtrk', n.trk);
    r.setProperty('--nmscale', String(n.s));
    r.setProperty('--detfont', d.f);
    r.setProperty('--detwt', String(d.wt));
    r.setProperty('--dettrk', d.t1);
    r.setProperty('--dettrk2', d.t2);
    var note = document.getElementById('typenote');
    if (note) note.innerHTML = '<b>' + n.n + '</b> Details: ' + d.n + '.';
    summarise();
  }

  function padOn() {
    var el = document.getElementById('pad');
    return !el || el.checked;
  }

  function currentNum() {
    var el = document.getElementById('tnum');
    var n = parseInt(el && el.value, 10);
    if (!n || n < 1) n = 1;
    if (n > 20) n = 20;
    return n;
  }

  function applyCase(src, mode) {
    src = String(src == null ? '' : src);
    if (mode === 'upper') return src.toUpperCase();
    if (mode === 'lower') return src.toLowerCase();
    if (mode === 'sentence') {
      return src.toLowerCase().replace(/^\s*[a-z]/, function (ch) { return ch.toUpperCase(); });
    }
    if (mode === 'title') {
      return src.toLowerCase().replace(/(^|[\s&+/,\-–—])([a-z])/g, function (_, a, b) {
        return a + b.toUpperCase();
      });
    }
    return src;
  }

  function textTarget(el) {
    if (!el) return null;
    if (el.matches('.k, .pair, .pair-plus, .head, .head-u, .num, .num-lg, .num-raw, .num-word, .N1, .N2')) return el;
    var inner = el.querySelector('.pair, .pair-plus, .k, .head, .head-u, .num, .num-lg, .nm');
    return inner || el;
  }

  function guessCase(el) {
    if (el.dataset.case) return el.dataset.case;
    if (el.dataset.upper === '1' || el.classList.contains('head-u')) return 'upper';
    var tt = '';
    try { tt = getComputedStyle(el).textTransform; } catch (e) {}
    if (tt === 'uppercase') return 'upper';
    if (tt === 'lowercase') return 'lower';
    if (tt === 'capitalize') return 'title';
    return 'as';
  }

  function defaultSrc(el) {
    var a = (document.getElementById('n1') || {}).value || 'Allison';
    var b = (document.getElementById('n2') || {}).value || 'Skylar';
    var h = (document.getElementById('headline') || {}).value || 'When we were';
    if (el.classList.contains('pair-plus')) return a + ' + ' + b;
    if (el.classList.contains('pair')) return a + (el.dataset.join || ' & ') + b;
    if (el.classList.contains('N1')) return a;
    if (el.classList.contains('N2')) return b;
    if (el.classList.contains('head') || el.classList.contains('head-u')) return h;
    if (el.classList.contains('k')) {
      var t = (el.textContent || '').trim();
      if (t && t.toLowerCase() !== h.toLowerCase() && t.toLowerCase() !== 'when we were') return t;
      return h;
    }
    return (el.dataset.src || el.textContent || '').trim();
  }

  function paintText(el) {
    if (!el) return;
    if (!el.dataset.src) el.dataset.src = defaultSrc(el);
    if (!el.dataset.case) el.dataset.case = guessCase(el);
    el.textContent = applyCase(el.dataset.src, el.dataset.case);
    el.style.textTransform = 'none';
  }

  function applyNumber() {
    var n = currentNum();
    var raw = String(n);
    var padded = n < 10 ? '0' + n : raw;
    var shown = padOn() ? padded : raw;
    document.querySelectorAll('.num').forEach(function (el) {
      if (el.dataset.custom === '1') return;
      el.dataset.src = shown;
      if (!el.dataset.case) el.dataset.case = 'as';
      paintText(el);
    });
    document.querySelectorAll('.num-pad').forEach(function (el) {
      if (el.dataset.custom === '1') return;
      el.dataset.src = padded;
      paintText(el);
    });
    document.querySelectorAll('.num-raw').forEach(function (el) {
      if (el.dataset.custom === '1') return;
      el.dataset.src = raw;
      paintText(el);
    });
    document.querySelectorAll('.num-word').forEach(function (el) {
      if (el.dataset.custom === '1') return;
      var w = WORDS[n] || raw;
      el.dataset.src = el.dataset.upper === '1' ? w.toUpperCase() : w;
      paintText(el);
    });
    document.querySelectorAll('.num-roman').forEach(function (el) {
      if (el.dataset.custom === '1') return;
      el.dataset.src = ROMAN[n] || raw;
      paintText(el);
    });
    summarise();
  }

  function bindText(id, selector, transform) {
    var inp = document.getElementById(id);
    if (!inp) return;
    function set() {
      var v = inp.value;
      document.querySelectorAll(selector).forEach(function (el) {
        var t = transform ? transform(v, el) : v;
        if (el.dataset.upper === '1' || el.classList.contains('u')) t = String(t).toUpperCase();
        el.textContent = t;
      });
    }
    inp.addEventListener('input', set);
    set();
  }

  function applyNames() {
    var a = document.getElementById('n1').value || 'Allison';
    var b = document.getElementById('n2').value || 'Skylar';
    document.querySelectorAll('.N1').forEach(function (el) {
      if (el.dataset.custom === '1') return;
      el.dataset.src = a;
      paintText(el);
    });
    document.querySelectorAll('.N2').forEach(function (el) {
      if (el.dataset.custom === '1') return;
      el.dataset.src = b;
      paintText(el);
    });
    document.querySelectorAll('.pair').forEach(function (el) {
      if (el.dataset.custom === '1') return;
      el.dataset.src = a + (el.dataset.join || ' & ') + b;
      paintText(el);
    });
    document.querySelectorAll('.pair-plus').forEach(function (el) {
      if (el.dataset.custom === '1') return;
      el.dataset.src = a + ' + ' + b;
      paintText(el);
    });
  }

  function applyHeadline() {
    var h = document.getElementById('headline');
    var v = (h && h.value) || 'When we were';
    document.querySelectorAll('.head, .head-u, .k').forEach(function (el) {
      if (el.dataset.custom === '1') return;
      var cur = (el.dataset.src || el.textContent || '').trim();
      if (el.classList.contains('k') && cur && cur.toLowerCase() !== v.toLowerCase() && cur.toLowerCase() !== 'when we were') {
        if (!el.dataset.src) el.dataset.src = cur;
        paintText(el);
        return;
      }
      el.dataset.src = v;
      paintText(el);
    });
  }

  function setPhotos() {
    var r = document.documentElement.style;
    r.setProperty('--ph-a', 'url("' + photoA + '")');
    r.setProperty('--ph-b', 'url("' + photoB + '")');
  }

  function readFile(file, cb) {
    if (!file) return;
    var url = URL.createObjectURL(file);
    cb(url);
    setPhotos();
  }

  function printCard(frame) {
    document.querySelectorAll('.frame.print-me').forEach(function (el) {
      el.classList.remove('print-me');
    });
    frame.classList.add('print-me');
    document.body.classList.add('print-card');
    var s = document.getElementById('print-size');
    if (!s) {
      s = document.createElement('style');
      s.id = 'print-size';
      document.head.appendChild(s);
    }
    s.textContent = '@page { size: 5in 7in; margin: 0; }';
    var done = function () {
      document.body.classList.remove('print-card');
      frame.classList.remove('print-me');
      s.textContent = '';
      window.removeEventListener('afterprint', done);
    };
    window.addEventListener('afterprint', done);
    window.print();
    setTimeout(done, 1200);
  }

  function wirePrintButtons() {
    document.querySelectorAll('.grid > div').forEach(function (card) {
      var meta = card.querySelector('.meta');
      var frame = card.querySelector('.frame');
      if (!meta || !frame || meta.querySelector('.printbtn')) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'xbtn printbtn';
      b.textContent = 'Print 5×7';
      b.addEventListener('click', function () { printCard(frame); });
      meta.appendChild(b);
    });
  }

  function markUpper() {
    document.querySelectorAll('.N1,.N2,.pair,.pair-plus,.head,.num-word').forEach(function (el) {
      if (el.dataset.upper) return;
      var t = (el.textContent || '').trim();
      if (t && t === t.toUpperCase() && /[A-Z]/.test(t)) el.dataset.upper = '1';
    });
  }

  document.querySelectorAll('#cw button').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('#cw button').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      ground = b.dataset.cw;
      applyColor();
    });
  });
  document.querySelectorAll('#tc button').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('#tc button').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      text = b.dataset.tc;
      applyColor();
    });
  });

  document.getElementById('nf').addEventListener('change', applyType);
  document.getElementById('df').addEventListener('change', applyType);
  document.getElementById('tnum').addEventListener('input', applyNumber);
  document.getElementById('pad').addEventListener('change', applyNumber);
  document.getElementById('n1').addEventListener('input', applyNames);
  document.getElementById('n2').addEventListener('input', applyNames);
  document.getElementById('headline').addEventListener('input', applyHeadline);

  var pA = document.getElementById('photoA');
  var pB = document.getElementById('photoB');
  if (pA) pA.addEventListener('change', function () { readFile(this.files[0], function (u) { photoA = u; }); });
  if (pB) pB.addEventListener('change', function () { readFile(this.files[0], function (u) { photoB = u; }); });

  document.getElementById('swap').addEventListener('click', function () {
    var tmp = photoA; photoA = photoB; photoB = tmp; setPhotos();
  });

  function applyScales() {
    var sNum = document.getElementById('sNum');
    var sLab = document.getElementById('sLab');
    var oNum = document.getElementById('oNum');
    var oLab = document.getElementById('oLab');
    var n = sNum ? parseFloat(sNum.value) : 1.22;
    var l = sLab ? parseFloat(sLab.value) : 1.28;
    var r = document.documentElement.style;
    r.setProperty('--numscale', String(n));
    r.setProperty('--labscale', String(l));
    if (oNum) oNum.textContent = n.toFixed(2) + '×';
    if (oLab) oLab.textContent = l.toFixed(2) + '×';
  }

  function markMovers() {
    var n = 0;
    document.querySelectorAll('.print, .num-lg, .k, .pair, .pair-plus, .head, .head-u').forEach(function (el) {
      if (el.parentElement && el.parentElement.closest('.move')) return;
      el.classList.add('move');
      if (!el.dataset.mid) el.dataset.mid = 'm' + (++n);
    });
    document.querySelectorAll('.sign .ph').forEach(function (el) {
      if (el.closest('.print')) return;
      el.classList.add('move');
      if (!el.dataset.mid) el.dataset.mid = 'm' + (++n);
    });
    document.querySelectorAll('.move').forEach(function (el) {
      if (!el.dataset.mid) el.dataset.mid = 'm' + (++n);
    });
  }

  function enableNudge() {
    var moveOn = document.getElementById('moveOn');
    var reset = document.getElementById('resetMove');
    var sNum = document.getElementById('sNum');
    var sLab = document.getElementById('sLab');
    var sPiece = document.getElementById('sPiece');
    var oPiece = document.getElementById('oPiece');
    var undoBtn = document.getElementById('undoBtn');
    var redoBtn = document.getElementById('redoBtn');
    var textRow = document.getElementById('textEditRow');
    var pieceText = document.getElementById('pieceText');
    var caseToggle = document.getElementById('caseToggle');
    var sTrk = document.getElementById('sTrk');
    var oTrk = document.getElementById('oTrk');
    var gear = document.getElementById('gear');
    var panel = document.getElementById('panel');
    var selected = null;
    var drag = null;
    var history = [];
    var histIndex = -1;
    var histLock = false;

    var overlay = document.createElement('div');
    overlay.className = 'selbox';
    overlay.hidden = true;
    overlay.innerHTML =
      '<i class="h nw" data-h="nw"></i>' +
      '<i class="h ne" data-h="ne"></i>' +
      '<i class="h sw" data-h="sw"></i>' +
      '<i class="h se" data-h="se"></i>';

    var PT_STEPS = [8, 9, 10, 11, 12, 14, 16, 18, 21, 24, 28, 30, 36, 42, 48, 54, 60, 72, 84, 96, 108, 120, 144, 168, 192, 216, 240];

    function isTextPiece(el) {
      return !!(el && !el.classList.contains('print') && !el.classList.contains('ph'));
    }

    function pieceScale(el) {
      return parseFloat(getComputedStyle(el).getPropertyValue('--pscale')) || 1;
    }

    function snapPt(n) {
      var best = PT_STEPS[0], d = Infinity, i, dd;
      for (i = 0; i < PT_STEPS.length; i++) {
        dd = Math.abs(PT_STEPS[i] - n);
        if (dd < d) { d = dd; best = PT_STEPS[i]; }
      }
      return best;
    }

    function ptIndex(pt) {
      var i, best = 0, d = Infinity, dd;
      for (i = 0; i < PT_STEPS.length; i++) {
        dd = Math.abs(PT_STEPS[i] - pt);
        if (dd < d) { d = dd; best = i; }
      }
      return best;
    }

    function measurePt(el) {
      var set = parseFloat(el.style.getPropertyValue('--pt'));
      if (set) return set;
      var sign = el.closest('.sign');
      var w = sign ? sign.getBoundingClientRect().width : 0;
      if (!w) return 18;
      var fs = parseFloat(getComputedStyle(el).fontSize) || 16;
      return (fs * pieceScale(el) / w) * 360;
    }

    function setTextPt(el, pt) {
      pt = snapPt(pt);
      el.style.setProperty('--pt', String(pt));
      el.style.removeProperty('--pscale');
      el.classList.add('has-pt');
      return pt;
    }

    function syncPieceSlider() {
      if (!sPiece || !oPiece) return;
      if (!selected) {
        sPiece.disabled = true;
        oPiece.textContent = '—';
        return;
      }
      sPiece.disabled = false;
      if (isTextPiece(selected)) {
        var raw = measurePt(selected);
        var pt = selected.style.getPropertyValue('--pt') ? snapPt(raw) : Math.round(raw);
        sPiece.min = '0';
        sPiece.max = String(PT_STEPS.length - 1);
        sPiece.step = '1';
        sPiece.value = String(ptIndex(raw));
        oPiece.textContent = pt + ' pt';
        return;
      }
      var sc = pieceScale(selected);
      sPiece.min = '0.4';
      sPiece.max = '2.4';
      sPiece.step = '0.02';
      sPiece.value = String(sc);
      oPiece.textContent = sc.toFixed(2) + '×';
    }

    var overlayRaf = 0;
    function placeOverlay() {
      overlayRaf = 0;
      if (!selected || !moveOn || !moveOn.checked) {
        overlay.hidden = true;
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        return;
      }
      var frame = selected.closest('.frame');
      if (!frame) return;
      if (overlay.parentNode !== frame) frame.appendChild(overlay);
      var fr = frame.getBoundingClientRect();
      var r = selected.getBoundingClientRect();
      overlay.style.left = (r.left - fr.left) + 'px';
      overlay.style.top = (r.top - fr.top) + 'px';
      overlay.style.width = Math.max(8, r.width) + 'px';
      overlay.style.height = Math.max(8, r.height) + 'px';
      overlay.hidden = false;
    }
    function placeOverlaySoon() {
      if (overlayRaf) return;
      overlayRaf = requestAnimationFrame(placeOverlay);
    }

    function readMovers() {
      var movers = {};
      document.querySelectorAll('.move[data-mid]').forEach(function (el) {
        var t = textTarget(el);
        movers[el.dataset.mid] = {
          dx: el.style.getPropertyValue('--dx') || '',
          dy: el.style.getPropertyValue('--dy') || '',
          sc: el.style.getPropertyValue('--pscale') || '',
          pt: el.style.getPropertyValue('--pt') || '',
          src: t ? (t.dataset.src || '') : '',
          cse: t ? (t.dataset.case || '') : '',
          custom: t ? (t.dataset.custom || '') : '',
          txt: t ? (t.textContent || '') : '',
          trk: t ? (t.style.getPropertyValue('--trk') || '') : ''
        };
      });
      return movers;
    }

    function currentState() {
      return {
        movers: readMovers(),
        num: sNum ? sNum.value : '1.22',
        lab: sLab ? sLab.value : '1.28'
      };
    }

    function snapshot() {
      if (histLock) return;
      var state = currentState();
      var prev = history[histIndex];
      if (prev && JSON.stringify(prev) === JSON.stringify(state)) return;
      history = history.slice(0, histIndex + 1);
      history.push(state);
      if (history.length > 80) history.shift();
      histIndex = history.length - 1;
    }

    function applyState(state) {
      histLock = true;
      document.querySelectorAll('.move[data-mid]').forEach(function (el) {
        var s = state.movers[el.dataset.mid] || {};
        if (s.dx) el.style.setProperty('--dx', s.dx);
        else el.style.removeProperty('--dx');
        if (s.dy) el.style.setProperty('--dy', s.dy);
        else el.style.removeProperty('--dy');
        if (s.sc) el.style.setProperty('--pscale', s.sc);
        else el.style.removeProperty('--pscale');
        if (s.pt) {
          el.style.setProperty('--pt', s.pt);
          el.classList.add('has-pt');
        } else {
          el.style.removeProperty('--pt');
          el.classList.remove('has-pt');
        }
        var t = textTarget(el);
        if (t) {
          if (s.src) t.dataset.src = s.src;
          else delete t.dataset.src;
          if (s.cse) t.dataset.case = s.cse;
          else delete t.dataset.case;
          if (s.custom) t.dataset.custom = s.custom;
          else delete t.dataset.custom;
          if (s.txt !== undefined) {
            t.textContent = s.txt;
            t.style.textTransform = 'none';
          }
          if (s.trk) {
            t.style.setProperty('--trk', s.trk);
            t.classList.add('has-trk');
          } else {
            t.style.removeProperty('--trk');
            t.classList.remove('has-trk');
          }
        }
      });
      if (sNum) sNum.value = state.num;
      if (sLab) sLab.value = state.lab;
      applyScales();
      histLock = false;
      syncPieceSlider();
      syncTextEdit();
      placeOverlay();
    }

    function undo() {
      if (histIndex <= 0) return;
      histIndex -= 1;
      applyState(history[histIndex]);
    }

    function redo() {
      if (histIndex >= history.length - 1) return;
      histIndex += 1;
      applyState(history[histIndex]);
    }

    function openPanel() {
      if (panel) panel.classList.add('open');
      if (gear) {
        gear.classList.add('open');
        gear.setAttribute('aria-expanded', 'true');
      }
    }

    function select(el) {
      if (selected === el) {
        placeOverlay();
        return;
      }
      if (selected) selected.classList.remove('selected');
      selected = el;
      if (selected) selected.classList.add('selected');
      openPanel();
      syncPieceSlider();
      syncTextEdit();
      placeOverlay();
    }

    function deselect() {
      if (selected) selected.classList.remove('selected');
      selected = null;
      syncPieceSlider();
      syncTextEdit();
      placeOverlay();
    }

    function formatTrk(n) {
      return (+n).toFixed(3).replace(/^(-?)0\./, '$1.');
    }

    function measureTrk(el) {
      var set = el.style.getPropertyValue('--trk');
      if (set) return parseFloat(set);
      var ls = getComputedStyle(el).letterSpacing;
      var fs = parseFloat(getComputedStyle(el).fontSize) || 16;
      if (!ls || ls === 'normal') return 0;
      return parseFloat(ls) / fs;
    }

    function setPieceTrk(el, em) {
      em = Math.max(-0.10, Math.min(0.40, em));
      el.style.setProperty('--trk', em.toFixed(3) + 'em');
      el.classList.add('has-trk');
      return em;
    }

    function syncTrkSlider(t) {
      if (!sTrk || !oTrk) return;
      if (!t) {
        sTrk.disabled = true;
        oTrk.textContent = '—';
        return;
      }
      var em = measureTrk(t);
      sTrk.disabled = false;
      sTrk.value = String(em);
      oTrk.textContent = formatTrk(em);
    }

    function syncTextEdit() {
      var t = selected && isTextPiece(selected) ? textTarget(selected) : null;
      if (textRow) textRow.hidden = !t;
      syncTrkSlider(t);
      if (!pieceText) return;
      if (!t) {
        pieceText.disabled = true;
        pieceText.value = '';
        return;
      }
      if (!t.dataset.src) t.dataset.src = defaultSrc(t);
      if (!t.dataset.case) t.dataset.case = guessCase(t);
      pieceText.disabled = false;
      pieceText.value = t.dataset.src;
      if (caseToggle) {
        caseToggle.querySelectorAll('button').forEach(function (b) {
          b.classList.toggle('on', b.getAttribute('data-case') === t.dataset.case);
        });
      }
    }

    function writeSelectedText(src, makeCustom) {
      var t = selected && isTextPiece(selected) ? textTarget(selected) : null;
      if (!t) return;
      t.dataset.src = src;
      if (makeCustom) t.dataset.custom = '1';
      if (!t.dataset.case) t.dataset.case = guessCase(t);
      paintText(t);
      placeOverlay();
    }

    function setMoving() {
      var on = !!(moveOn && moveOn.checked);
      document.body.classList.toggle('moving', on);
      if (!on) deselect();
    }

    if (sNum) {
      sNum.addEventListener('input', function () { applyScales(); placeOverlay(); });
      sNum.addEventListener('change', snapshot);
    }
    if (sLab) {
      sLab.addEventListener('input', function () { applyScales(); placeOverlay(); });
      sLab.addEventListener('change', snapshot);
    }
    applyScales();

    if (sPiece) {
      sPiece.addEventListener('input', function () {
        if (!selected) return;
        if (isTextPiece(selected)) {
          setTextPt(selected, PT_STEPS[parseInt(sPiece.value, 10)] || 18);
        } else {
          selected.style.setProperty('--pscale', parseFloat(sPiece.value).toFixed(3));
        }
        syncPieceSlider();
        placeOverlay();
      });
      sPiece.addEventListener('change', snapshot);
    }

    if (pieceText) {
      pieceText.addEventListener('input', function () {
        writeSelectedText(pieceText.value, true);
      });
      pieceText.addEventListener('change', snapshot);
    }
    if (sTrk) {
      sTrk.addEventListener('input', function () {
        var t = selected && isTextPiece(selected) ? textTarget(selected) : null;
        if (!t) return;
        setPieceTrk(t, parseFloat(sTrk.value));
        syncTrkSlider(t);
        placeOverlay();
      });
      sTrk.addEventListener('change', snapshot);
    }
    if (gear && panel) {
      gear.addEventListener('click', function () {
        var on = panel.classList.toggle('open');
        gear.classList.toggle('open', on);
        gear.setAttribute('aria-expanded', on ? 'true' : 'false');
      });
    }
    if (caseToggle) {
      caseToggle.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-case]');
        var t = selected && isTextPiece(selected) ? textTarget(selected) : null;
        if (!btn || !t) return;
        t.dataset.case = btn.getAttribute('data-case');
        if (!t.dataset.src) t.dataset.src = defaultSrc(t);
        paintText(t);
        syncTextEdit();
        placeOverlay();
        snapshot();
      });
    }
    document.addEventListener('dblclick', function (e) {
      if (!moveOn || !moveOn.checked) return;
      var el = e.target.closest('.move');
      if (!el || !el.closest('.sign') || !isTextPiece(el)) return;
      select(el);
      if (pieceText && !pieceText.disabled) {
        pieceText.focus();
        pieceText.select();
      }
    });

    if (moveOn) moveOn.addEventListener('change', setMoving);
    setMoving();
    markMovers();

    if (reset) {
      reset.addEventListener('click', function () {
        document.querySelectorAll('.move').forEach(function (el) {
          el.style.removeProperty('--dx');
          el.style.removeProperty('--dy');
          el.style.removeProperty('--pscale');
          el.style.removeProperty('--pt');
          el.classList.remove('has-pt');
        });
        syncPieceSlider();
        placeOverlay();
        snapshot();
      });
    }
    if (undoBtn) undoBtn.addEventListener('click', undo);
    if (redoBtn) redoBtn.addEventListener('click', redo);

    document.addEventListener('pointerdown', function (e) {
      if (!moveOn || !moveOn.checked) return;
      if (e.button !== 0) return;
      if (e.target.closest('button, a, input, label, select, .controls, .meta')) return;

      var handle = e.target.closest('.selbox .h');
      if (handle && selected) {
        var rect = selected.getBoundingClientRect();
        drag = {
          type: 'resize',
          el: selected,
          text: isTextPiece(selected),
          scale: pieceScale(selected),
          startPt: measurePt(selected),
          cx: rect.left + rect.width / 2,
          cy: rect.top + rect.height / 2,
          startDist: Math.hypot(e.clientX - (rect.left + rect.width / 2), e.clientY - (rect.top + rect.height / 2)) || 1
        };
        selected.classList.add('dragging');
        try { handle.setPointerCapture(e.pointerId); } catch (err) {}
        e.preventDefault();
        return;
      }

      var el = e.target.closest('.move');
      if (el && el.closest('.sign')) {
        select(el);
        var sign = el.closest('.sign');
        var w = sign.getBoundingClientRect().width;
        if (!w) return;
        var cs = getComputedStyle(el);
        drag = {
          type: 'move',
          el: el,
          x: e.clientX,
          y: e.clientY,
          dx: parseFloat(cs.getPropertyValue('--dx')) || 0,
          dy: parseFloat(cs.getPropertyValue('--dy')) || 0,
          unit: w / 100,
          dirty: false
        };
        el.classList.add('dragging');
        try { el.setPointerCapture(e.pointerId); } catch (err) {}
        e.preventDefault();
        return;
      }

      if (e.target.closest('.sign')) deselect();
    });

    document.addEventListener('pointermove', function (e) {
      if (!drag) return;
      if (drag.type === 'resize') {
        var dist = Math.hypot(e.clientX - drag.cx, e.clientY - drag.cy);
        var ratio = dist / drag.startDist;
        if (drag.text) {
          setTextPt(drag.el, drag.startPt * ratio);
        } else {
          var ns = drag.scale * ratio;
          ns = Math.max(0.35, Math.min(2.8, ns));
          drag.el.style.setProperty('--pscale', ns.toFixed(3));
        }
        syncPieceSlider();
        placeOverlaySoon();
        return;
      }
      var nx = drag.dx + (e.clientX - drag.x) / drag.unit;
      var ny = drag.dy + (e.clientY - drag.y) / drag.unit;
      if (Math.abs(e.clientX - drag.x) > 2 || Math.abs(e.clientY - drag.y) > 2) drag.dirty = true;
      drag.el.style.setProperty('--dx', nx.toFixed(2) + 'cqi');
      drag.el.style.setProperty('--dy', ny.toFixed(2) + 'cqi');
      placeOverlaySoon();
    });

    function endDrag() {
      if (!drag) return;
      var changed = drag.type === 'resize'
        ? (drag.text
          ? snapPt(measurePt(drag.el)) !== snapPt(drag.startPt)
          : pieceScale(drag.el).toFixed(3) !== drag.scale.toFixed(3))
        : drag.dirty;
      drag.el.classList.remove('dragging');
      drag = null;
      placeOverlay();
      if (changed) snapshot();
    }
    document.addEventListener('pointerup', endDrag);
    document.addEventListener('pointercancel', endDrag);

    document.addEventListener('keydown', function (e) {
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      var z = e.key === 'z' || e.key === 'Z';
      if ((e.metaKey || e.ctrlKey) && z && !e.altKey) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if (e.key === 'Escape') deselect();
    });

    window.addEventListener('resize', placeOverlaySoon);
    window.addEventListener('scroll', placeOverlaySoon, { capture: true, passive: true });

    snapshot();
  }

  markUpper();
  if (window.WeddingMustard) {
    window.WeddingMustard.bind();
    window.WeddingMustard.onChange(function () { applyColor(); });
  }
  applyType();
  applyColor();
  applyNumber();
  applyNames();
  applyHeadline();
  setPhotos();
  wirePrintButtons();
  enableNudge();
})();
