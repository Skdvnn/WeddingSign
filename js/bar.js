/**
 * Bar-menu explorer — live copy, suite type, print, PNG, and SVG.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'wedding-bar-menu-v1';
  var PNG_W = 1545;
  var PNG_H = 2000;

  var DEFAULT_DRINKS = [
    { name: 'Lychee Mojito', tag: '', ingredients: 'Rum, Lime, Lychee Mint Syrup & Club Soda' },
    { name: 'Passion Fruit Margarita', tag: 'Spicy Optional', ingredients: 'Tequila, Lime Juice, Passion Fruit Syrup & Orange Bitters' },
    { name: 'Lemongrass Coconut Sake', tag: '', ingredients: 'Sake, Coconut Milk & Lemongrass Cordial with Fee Foam' },
    { name: 'Cucumber Elderflower Spritz', tag: 'Mocktail', ingredients: 'Cucumber Juice, Lemon Juice, Elderflower Syrup, Dash Of Ginger & Club Soda' }
  ];

  var G = {
    bone: { hex: '#E7E3DA', name: 'bone' },
    mustard: { hex: '#BFA52B', name: 'mustard board' }
  };
  var T = {
    ink: { hex: '#1E1D1A', name: 'black' },
    white: { hex: '#F4F1EA', name: 'bone' }
  };
  var NF = {
    instrument: { f: 'var(--font-invite-serif)', wt: 400, trk: '-.006em', s: 1, acc: 'var(--font-invite-serif)', n: 'Your invite face.' },
    helveticablack: { f: 'var(--font-std-black)', wt: 900, trk: '-.02em', s: 0.88, acc: 'var(--font-invite-serif)', n: 'Save-the-date display face (Helvetica Neue Black).' },
    playfair: { f: "'Playfair Display',serif", wt: 500, trk: '-.014em', s: 0.92, acc: "'Playfair Display',serif", n: 'Rounder neighbour to Instrument.' },
    bodoni: { f: "'Bodoni Moda',serif", wt: 500, trk: '-.008em', s: 0.94, acc: "'Bodoni Moda',serif", n: 'Higher contrast — dressier, thinner hairlines.' },
    dmserif: { f: "'DM Serif Display',serif", wt: 400, trk: '-.018em', s: 0.92, acc: "'DM Serif Display',serif", n: 'Same silhouette as Instrument, thicker hairlines.' },
    ebgaramond: { f: "'EB Garamond',serif", wt: 500, trk: '-.004em', s: 0.98, acc: "'EB Garamond',serif", n: 'Bookish old-style. Quiet, formal.' }
  };
  var DF = {
    robotomono: { f: 'var(--font-invite-mono)', wt: 400, t1: '.2em', t2: '.13em', n: 'invite details' },
    helveticathin: { f: 'var(--font-std-thin)', wt: 100, t1: '.08em', t2: '.06em', n: 'STD footer' },
    serifcaps: { f: 'var(--font-invite-serif)', wt: 400, t1: '.22em', t2: '.16em', n: 'serif, letterspaced' },
    inter: { f: 'Inter,sans-serif', wt: 500, t1: '.18em', t2: '.12em', n: 'neutral grotesque' }
  };

  var drinks = DEFAULT_DRINKS.map(cloneDrink);
  var header = 'BAR MENU';
  var ground = 'bone';
  var text = 'ink';
  var saveTimer = null;
  var h2cPromise = null;

  function cloneDrink(d) {
    return { name: d.name || '', tag: d.tag || '', ingredients: d.ingredients || '' };
  }

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

  function withAmp(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/ &amp; /g, ' <span class="acc">&amp;</span> ');
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return;
      if (Array.isArray(data.drinks) && data.drinks.length) {
        drinks = DEFAULT_DRINKS.map(function (fallback, i) {
          var next = data.drinks[i] || {};
          return {
            name: typeof next.name === 'string' ? next.name : fallback.name,
            tag: typeof next.tag === 'string' ? next.tag : fallback.tag,
            ingredients: typeof next.ingredients === 'string' ? next.ingredients : fallback.ingredients
          };
        });
      }
      if (typeof data.header === 'string' && data.header.trim()) header = data.header;
      if (data.ground && G[data.ground]) ground = data.ground;
      if (data.text && T[data.text]) text = data.text;
      var nf = document.getElementById('nf');
      var df = document.getElementById('df');
      if (nf && data.nf && NF[data.nf]) nf.value = data.nf;
      if (df && data.df && DF[data.df]) df.value = data.df;
      var sName = document.getElementById('sName');
      var sLab = document.getElementById('sLab');
      if (sName && typeof data.nmscale === 'number') sName.value = String(data.nmscale);
      if (sLab && typeof data.labscale === 'number') sLab.value = String(data.labscale);
    } catch (e) { /* private mode */ }
  }

  function persist() {
    var nf = document.getElementById('nf');
    var df = document.getElementById('df');
    var sName = document.getElementById('sName');
    var sLab = document.getElementById('sLab');
    var payload = {
      header: header,
      drinks: drinks.map(cloneDrink),
      ground: ground,
      text: text,
      nf: nf ? nf.value : 'instrument',
      df: df ? df.value : 'robotomono',
      nmscale: sName ? parseFloat(sName.value) : 1,
      labscale: sLab ? parseFloat(sLab.value) : 1
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch (e) {}
    var saved = document.getElementById('list-saved');
    if (saved) saved.textContent = 'Saved in this browser';
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 180);
    var saved = document.getElementById('list-saved');
    if (saved) saved.textContent = 'Saves as you type';
  }

  function applyColor() {
    var gh = G[ground].hex, fg = T[text].hex;
    var accent = ground === 'mustard' ? T.ink.hex : '#BFA52B';
    var bandFg = ground === 'mustard' ? G.bone.hex : T.ink.hex;
    document.documentElement.style.setProperty('--accent', accent);
    document.querySelectorAll('[data-g]').forEach(function (el) {
      el.style.background = gh;
      el.style.color = fg;
    });
    document.querySelectorAll('[data-fg]').forEach(function (el) { el.style.color = fg; });
    document.querySelectorAll('[data-fgs]').forEach(function (el) { el.style.color = fg; });
    document.querySelectorAll('[data-band]').forEach(function (el) {
      el.style.background = accent;
      el.style.color = bandFg;
    });
    document.querySelectorAll('.tag-mark').forEach(function (el) {
      el.style.color = accent;
    });
    document.querySelectorAll('.col-side').forEach(function (el) {
      el.style.borderLeftColor = accent;
    });
    var r = ratio(gh, fg);
    var w = document.getElementById('warn');
    var t = document.getElementById('warntxt');
    if (w && t) {
      if (r < 4.5) {
        w.classList.add('show');
        t.textContent = T[text].name + ' on ' + G[ground].name + ' is ' + r.toFixed(1) + ':1 — muddy from a few feet.';
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
    el.innerHTML =
      '<span class="swatchdot" style="background:' + G[ground].hex + '"></span><b>' + G[ground].name + '</b> stock' +
      '<span class="dot">·</span><span class="swatchdot" style="background:' + T[text].hex + '"></span><b>' + T[text].name + '</b> type' +
      '<span class="dot">·</span><b>' + (nf ? nf.options[nf.selectedIndex].text : 'Instrument Serif') + '</b>' +
      '<span class="dot">·</span>1545 × 2000';
  }

  function applyType() {
    var nfEl = document.getElementById('nf');
    var dfEl = document.getElementById('df');
    var sName = document.getElementById('sName');
    var sLab = document.getElementById('sLab');
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
    r.setProperty('--nmscale', String((sName ? parseFloat(sName.value) : 1) * n.s));
    r.setProperty('--detfont', d.f);
    r.setProperty('--detwt', String(d.wt));
    r.setProperty('--dettrk', d.t1);
    r.setProperty('--dettrk2', d.t2);
    r.setProperty('--labscale', String(sLab ? parseFloat(sLab.value) : 1));
    var oName = document.getElementById('oName');
    var oLab = document.getElementById('oLab');
    if (oName && sName) oName.textContent = parseFloat(sName.value).toFixed(2) + '×';
    if (oLab && sLab) oLab.textContent = parseFloat(sLab.value).toFixed(2) + '×';
    var note = document.getElementById('typenote');
    if (note) note.innerHTML = '<b>' + n.n + '</b> Details: ' + d.n + '.';
    summarise();
  }

  function paintDrinks() {
    document.querySelectorAll('[data-header]').forEach(function (el) {
      el.textContent = header;
    });
    document.querySelectorAll('[data-drink]').forEach(function (block) {
      var i = parseInt(block.getAttribute('data-drink'), 10);
      var d = drinks[i];
      if (!d) return;
      var nameEl = block.querySelector('[data-dname]');
      var tagEls = block.querySelectorAll('[data-dtag]');
      var ingEl = block.querySelector('[data-ding]');
      if (nameEl) nameEl.innerHTML = withAmp(d.name);
      tagEls.forEach(function (tagEl) {
        if (d.tag && d.tag.trim()) {
          tagEl.innerHTML = withAmp(d.tag);
          tagEl.hidden = false;
          tagEl.removeAttribute('hidden');
          block.classList.remove('no-tag');
        } else {
          tagEl.textContent = '';
          block.classList.add('no-tag');
          if (tagEl.classList.contains('tag-mark')) {
            tagEl.removeAttribute('hidden');
          } else {
            tagEl.hidden = true;
          }
        }
      });
      if (ingEl) ingEl.innerHTML = withAmp(d.ingredients);
    });
    applyColor();
  }

  function renderEditor() {
    var host = document.getElementById('drink-fields');
    if (!host) return;
    host.innerHTML = '';
    drinks.forEach(function (d, i) {
      var card = document.createElement('div');
      card.className = 'drink-card';
      card.innerHTML =
        '<p class="kicker">Drink ' + (i + 1) + '</p>' +
        '<div class="row">' +
          '<div><label for="d-name-' + i + '">Name</label>' +
          '<input class="f" id="d-name-' + i + '" data-field="name" data-i="' + i + '" value=""></div>' +
          '<div><label for="d-tag-' + i + '">Tag</label>' +
          '<input class="f" id="d-tag-' + i + '" data-field="tag" data-i="' + i + '" placeholder="Mocktail, Spicy…" value=""></div>' +
        '</div>' +
        '<label for="d-ing-' + i + '">Ingredients</label>' +
        '<textarea class="f" id="d-ing-' + i + '" data-field="ingredients" data-i="' + i + '"></textarea>';
      host.appendChild(card);
      card.querySelector('[data-field="name"]').value = d.name;
      card.querySelector('[data-field="tag"]').value = d.tag;
      card.querySelector('[data-field="ingredients"]').value = d.ingredients;
    });
  }

  function syncToggles() {
    document.querySelectorAll('#cw button').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-cw') === ground);
    });
    document.querySelectorAll('#tc button').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-tc') === text);
    });
    var h = document.getElementById('header');
    if (h) h.value = header;
  }

  function toast(msg) {
    var t = document.getElementById('png-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'png-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove('show'); }, 2400);
  }

  function slug(s) {
    return String(s || 'bar-menu')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'bar-menu';
  }

  function cardName(card) {
    var h = card.querySelector('.meta h3');
    return h ? h.textContent.trim() : 'bar-menu';
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
    s.textContent = '@page { size: letter portrait; margin: 0; }';
    var done = function () {
      document.body.classList.remove('print-card');
      frame.classList.remove('print-me');
      s.textContent = '';
      window.removeEventListener('afterprint', done);
    };
    window.addEventListener('afterprint', done);
    window.print();
    setTimeout(done, 1400);
  }

  function loadHtml2Canvas() {
    if (window.html2canvas) return Promise.resolve(window.html2canvas);
    if (h2cPromise) return h2cPromise;
    h2cPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      s.onload = function () {
        if (window.html2canvas) resolve(window.html2canvas);
        else reject(new Error('html2canvas missing'));
      };
      s.onerror = function () { reject(new Error('Could not load html2canvas')); };
      document.head.appendChild(s);
    });
    return h2cPromise;
  }

  function exportPng(card, frame, btn) {
    var label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Making PNG…';
    var host = document.createElement('div');
    host.setAttribute('data-export-ignore', '');
    host.style.cssText = 'position:fixed;left:-12000px;top:0;width:' + PNG_W + 'px;height:' + PNG_H + 'px;z-index:-1;background:' + G[ground].hex + ';';
    var clone = frame.cloneNode(true);
    clone.classList.remove('print-me');
    clone.style.width = PNG_W + 'px';
    clone.style.height = PNG_H + 'px';
    clone.style.aspectRatio = 'auto';
    clone.style.boxShadow = 'none';
    clone.style.borderRadius = '0';
    host.appendChild(clone);
    document.body.appendChild(host);
    document.fonts.ready.then(function () { return loadHtml2Canvas(); })
      .then(function (h2c) {
        return h2c(clone, {
          width: PNG_W,
          height: PNG_H,
          scale: 2,
          backgroundColor: G[ground].hex,
          useCORS: true,
          logging: false
        });
      })
      .then(function (canvas) {
        var a = document.createElement('a');
        a.download = slug(cardName(card)) + '-1545x2000.png';
        a.href = canvas.toDataURL('image/png');
        a.click();
        toast('PNG saved · 3090 × 4000 (1545 × 2000 at 2×).');
      })
      .catch(function () {
        toast('PNG failed — use Print this layout → Save as PDF instead.');
      })
      .then(function () {
        host.remove();
        btn.disabled = false;
        btn.textContent = label;
      });
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function rgbToHex(rgb) {
    var m = String(rgb).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return null;
    return '#' + [m[1], m[2], m[3]].map(function (v) {
      return ('0' + Number(v).toString(16)).slice(-2);
    }).join('');
  }

  function parsePx(v) {
    var n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  function exportSvg(card, frame) {
    var root = frame.getBoundingClientRect();
    var sx = PNG_W / Math.max(1, root.width);
    var sy = PNG_H / Math.max(1, root.height);
    var gh = G[ground].hex;
    var fg = T[text].hex;
    var out = [];
    out.push('<rect width="' + PNG_W + '" height="' + PNG_H + '" fill="' + gh + '"/>');

    frame.querySelectorAll('.mustard-band').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.width < 0.5 || r.height < 0.5) return;
      var fill = rgbToHex(getComputedStyle(el).backgroundColor) || (ground === 'mustard' ? T.ink.hex : '#BFA52B');
      out.push(
        '<rect x="' + ((r.left - root.left) * sx).toFixed(1) + '" y="' + ((r.top - root.top) * sy).toFixed(1) +
        '" width="' + (r.width * sx).toFixed(1) + '" height="' + (r.height * sy).toFixed(1) +
        '" fill="' + fill + '"/>'
      );
    });

    frame.querySelectorAll('.rule, .hair, .spine-rule, .menu-rule').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.width < 0.5 || r.height < 0.5) return;
      var fill = rgbToHex(getComputedStyle(el).backgroundColor) || fg;
      out.push(
        '<rect x="' + ((r.left - root.left) * sx).toFixed(1) + '" y="' + ((r.top - root.top) * sy).toFixed(1) +
        '" width="' + (r.width * sx).toFixed(1) + '" height="' + Math.max(1, r.height * sy).toFixed(1) +
        '" fill="' + fill + '"/>'
      );
    });

    frame.querySelectorAll('.col-side').forEach(function (el) {
      var r = el.getBoundingClientRect();
      var cs = getComputedStyle(el);
      var bw = parsePx(cs.borderLeftWidth);
      if (bw < 0.5 || r.height < 0.5) return;
      var fill = rgbToHex(cs.borderLeftColor) || (ground === 'mustard' ? T.ink.hex : '#BFA52B');
      out.push(
        '<rect x="' + ((r.left - root.left) * sx).toFixed(1) + '" y="' + ((r.top - root.top) * sy).toFixed(1) +
        '" width="' + Math.max(2, bw * sx).toFixed(1) + '" height="' + (r.height * sy).toFixed(1) +
        '" fill="' + fill + '"/>'
      );
    });

    frame.querySelectorAll('[data-header], [data-band-sub], .drink-name, .drink-tag, .drink-ing, .ledger-num, .col-label, .menu-foot').forEach(function (el) {
      var cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || el.hidden) return;
      var text = (el.innerText || el.textContent || '').replace(/\s+\n/g, '\n').replace(/\n\s+/g, '\n').trim();
      if (!text) return;
      var box = el.getBoundingClientRect();
      if (box.width < 0.5 || box.height < 0.5) return;
      var fontSize = parsePx(cs.fontSize) * sy;
      var align = cs.textAlign;
      var anchor = align === 'center' || align === 'middle' ? 'middle' : (align === 'right' || align === 'end' ? 'end' : 'start');
      var x = (box.left - root.left) * sx;
      if (anchor === 'middle') x += (box.width * sx) / 2;
      if (anchor === 'end') x += box.width * sx;
      var fill = rgbToHex(cs.color) || fg;
      var lines = text.split('\n');
      var writing = (cs.writingMode || '').indexOf('vertical') === 0;
      lines.forEach(function (line, i) {
        var t = line.replace(/\s+/g, ' ').trim();
        if (!t) return;
        var y = (box.top - root.top) * sy + fontSize * 0.82 + i * fontSize * 1.35;
        if (writing) {
          var cx = (box.left - root.left + box.width / 2) * sx;
          var cy = (box.top - root.top) * sy;
          out.push(
            '<text transform="translate(' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ') rotate(180)" ' +
            'font-family="' + esc(cs.fontFamily) + '" font-size="' + fontSize.toFixed(1) +
            '" font-style="' + esc(cs.fontStyle) + '" font-weight="' + esc(cs.fontWeight) +
            '" letter-spacing="' + esc(cs.letterSpacing) + '" fill="' + fill +
            '" dominant-baseline="hanging">' + esc(t) + '</text>'
          );
        } else {
          out.push(
            '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="' + anchor +
            '" font-family="' + esc(cs.fontFamily) + '" font-size="' + fontSize.toFixed(1) +
            '" font-style="' + esc(cs.fontStyle) + '" font-weight="' + esc(cs.fontWeight) +
            '" letter-spacing="' + esc(cs.letterSpacing) + '" fill="' + fill + '">' + esc(t) + '</text>'
          );
        }
      });
    });

    frame.querySelectorAll('svg.agave, svg.reg').forEach(function (svgEl) {
      var r = svgEl.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      var vb = svgEl.getAttribute('viewBox') || '0 0 100 100';
      var inner = '';
      Array.from(svgEl.childNodes).forEach(function (node) {
        if (node.nodeType === 1) inner += new XMLSerializer().serializeToString(node);
      });
      inner = inner.replace(/currentColor/g, fg);
      out.push(
        '<svg x="' + ((r.left - root.left) * sx).toFixed(1) + '" y="' + ((r.top - root.top) * sy).toFixed(1) +
        '" width="' + (r.width * sx).toFixed(1) + '" height="' + (r.height * sy).toFixed(1) +
        '" viewBox="' + vb + '" overflow="visible" fill="' + (svgEl.getAttribute('fill') === 'none' ? 'none' : fg) +
        '" stroke="' + (svgEl.getAttribute('fill') === 'none' ? fg : 'none') + '">' + inner + '</svg>'
      );
    });

    var title = cardName(card);
    var xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + PNG_W + ' ' + PNG_H + '" width="' + PNG_W + '" height="' + PNG_H + '" role="img" aria-label="' + esc(title) + '">',
      '  <title>' + esc(title) + '</title>',
      '  <desc>Allison + Skylar bar menu — 1545×2000 portrait. Solid ink on ' + G[ground].name + '. Fonts: Instrument Serif / Roboto Mono.</desc>',
      '  ' + out.join('\n  '),
      '</svg>',
      ''
    ].join('\n');
    var blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    var a = document.createElement('a');
    a.download = slug(title) + '-1545x2000.svg';
    a.href = URL.createObjectURL(blob);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
    toast('SVG saved · 1545 × 2000 editable type.');
  }

  function wireExport() {
    document.querySelectorAll('.grid > div').forEach(function (card) {
      var meta = card.querySelector('.meta');
      var frame = card.querySelector('.frame');
      if (!meta || !frame || meta.querySelector('.export-bar')) return;
      var bar = document.createElement('div');
      bar.className = 'export-bar';
      bar.setAttribute('data-export-ignore', '');
      var print = document.createElement('button');
      print.type = 'button';
      print.className = 'xbtn printbtn';
      print.textContent = 'Print this layout';
      print.addEventListener('click', function () { printCard(frame); });
      var png = document.createElement('button');
      png.type = 'button';
      png.className = 'xbtn primary';
      png.textContent = 'PNG';
      png.addEventListener('click', function () { exportPng(card, frame, png); });
      var svg = document.createElement('button');
      svg.type = 'button';
      svg.className = 'xbtn';
      svg.textContent = 'SVG';
      svg.addEventListener('click', function () { exportSvg(card, frame); });
      bar.appendChild(png);
      bar.appendChild(svg);
      bar.appendChild(print);
      meta.appendChild(bar);
    });
  }

  function wireEditor() {
    var host = document.getElementById('drink-fields');
    if (!host) return;
    host.addEventListener('input', function (e) {
      var el = e.target.closest('[data-field]');
      if (!el) return;
      var i = parseInt(el.getAttribute('data-i'), 10);
      var field = el.getAttribute('data-field');
      if (!drinks[i] || !field) return;
      drinks[i][field] = el.value;
      paintDrinks();
      scheduleSave();
    });
  }

  function resetDrinks() {
    drinks = DEFAULT_DRINKS.map(cloneDrink);
    header = 'BAR MENU';
    var h = document.getElementById('header');
    if (h) h.value = header;
    renderEditor();
    paintDrinks();
    persist();
  }

  function resetType() {
    var nf = document.getElementById('nf');
    var df = document.getElementById('df');
    var sName = document.getElementById('sName');
    var sLab = document.getElementById('sLab');
    if (nf) nf.value = 'instrument';
    if (df) df.value = 'robotomono';
    if (sName) sName.value = '1';
    if (sLab) sLab.value = '1';
    applyType();
    persist();
  }

  loadState();
  renderEditor();
  syncToggles();
  applyType();
  paintDrinks();
  wireEditor();
  wireExport();

  document.querySelectorAll('#cw button').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('#cw button').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      ground = b.getAttribute('data-cw');
      applyColor();
      persist();
    });
  });
  document.querySelectorAll('#tc button').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('#tc button').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      text = b.getAttribute('data-tc');
      applyColor();
      persist();
    });
  });
  ['nf', 'df'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('change', function () { applyType(); persist(); });
  });
  ['sName', 'sLab'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', applyType);
      el.addEventListener('change', persist);
    }
  });
  var headerEl = document.getElementById('header');
  if (headerEl) {
    headerEl.addEventListener('input', function () {
      header = headerEl.value || 'BAR MENU';
      paintDrinks();
      scheduleSave();
    });
  }
  var resetCopy = document.getElementById('reset-drinks');
  if (resetCopy) resetCopy.addEventListener('click', resetDrinks);
  var resetTypeBtn = document.getElementById('reset-type');
  if (resetTypeBtn) resetTypeBtn.addEventListener('click', resetType);

  var gear = document.getElementById('gear');
  var panel = document.getElementById('panel');
  if (gear && panel) {
    gear.addEventListener('click', function () {
      var on = panel.classList.toggle('open');
      gear.classList.toggle('open', on);
      gear.setAttribute('aria-expanded', on ? 'true' : 'false');
    });
  }
})();
