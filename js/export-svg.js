/**
 * Copy / download SVG for welcome-sign layouts, lettering, and graphics.
 * Full-layout export is cutter-ready: 24×36 in (2×3 ft boards).
 * Editable <text> export, or outlined <path> export (no fonts needed for the shop).
 */
(function () {
  'use strict';

  // Physical boards: 2×3 ft birch project panels (24 × 36 in), portrait
  var PANEL_W_IN = 24;
  var PANEL_H_IN = 36;
  var PANEL_W = PANEL_W_IN * 100; // 2400
  var PANEL_H = PANEL_H_IN * 100; // 3600

  // Local OFL fonts for Create-Outlines-equivalent path export
  var FONT_URLS = {
    instrument: 'assets/fonts/InstrumentSerif-Regular.ttf',
    instrumentItalic: 'assets/fonts/InstrumentSerif-Italic.ttf',
    robotomono: 'assets/fonts/RobotoMono-Regular.ttf',
    robotomonoMed: 'assets/fonts/RobotoMono-Medium.ttf'
  };
  var fontCache = {};
  var outlineMode = false;
  var outlineMissed = 0;

  function toast(msg) {
    var el = document.getElementById('svg-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'svg-toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove('show'); }, 2400);
  }

  function download(filename, text) {
    var blob = new Blob([text], { type: 'image/svg+xml;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast('SVG copied — paste into a message or Illustrator');
      return true;
    } catch (err) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        toast('SVG copied — paste into a message or Illustrator');
        return true;
      } catch (e2) {
        toast('Copy failed — use Download instead');
        return false;
      } finally {
        ta.remove();
      }
    }
  }

  function currentFg() {
    var btn = document.querySelector('#tc button.on');
    var map = {
      ink: '#1E1D1A',
      white: '#F4F1EA',
      mustA: (document.getElementById('pA') || {}).value || '#BFA52B',
      mustB: (document.getElementById('pB') || {}).value || '#D0C82F',
      plum: '#5E4266',
      rust: '#C0592B'
    };
    return map[btn ? btn.dataset.tc : 'ink'] || '#1E1D1A';
  }

  function nameFont() {
    var nf = document.getElementById('nf');
    var key = nf ? nf.value : 'instrument';
    var faces = {
      instrument: "'Instrument Serif', 'Times New Roman', serif",
      playfair: "'Playfair Display', 'Times New Roman', serif",
      bodoni: "'Bodoni Moda', 'Times New Roman', serif",
      dmserif: "'DM Serif Display', 'Times New Roman', serif",
      ebgaramond: "'EB Garamond', 'Times New Roman', serif",
      libre: "'Libre Baskerville', 'Times New Roman', serif",
      cormorant: "'Cormorant Garamond', 'Times New Roman', serif",
      fraunces: "'Fraunces', 'Times New Roman', serif",
      frauncessoft: "'Fraunces', 'Times New Roman', serif",
      inter: "Inter, Helvetica, Arial, sans-serif",
      archivo: 'Archivo, Helvetica, Arial, sans-serif',
      dmsans: "'DM Sans', Helvetica, Arial, sans-serif",
      jost: 'Jost, Helvetica, Arial, sans-serif',
      outfit: 'Outfit, Helvetica, Arial, sans-serif',
      spacegrotesk: "'Space Grotesk', Helvetica, Arial, sans-serif",
      bebas: "'Bebas Neue', Impact, sans-serif",
      oswald: 'Oswald, Impact, sans-serif',
      anton: 'Anton, Impact, sans-serif',
      archivoblack: "'Archivo Black', Impact, sans-serif",
      syne: 'Syne, Helvetica, Arial, sans-serif'
    };
    return faces[key] || faces.instrument;
  }

  function detailFont() {
    var df = document.getElementById('df');
    var key = df ? df.value : 'robotomono';
    var faces = {
      robotomono: "'Roboto Mono', 'Courier New', monospace",
      spacemono: "'Space Mono', 'Courier New', monospace",
      plexmono: "'IBM Plex Mono', 'Courier New', monospace",
      inter: 'Inter, Helvetica, Arial, sans-serif',
      archivosans: 'Archivo, Helvetica, Arial, sans-serif',
      serifcaps: "'EB Garamond', 'Times New Roman', serif"
    };
    return faces[key] || faces.robotomono;
  }

  function names() {
    return {
      n1: (document.getElementById('n1') || {}).value || 'Allison',
      n2: (document.getElementById('n2') || {}).value || 'Skylar'
    };
  }

  function slug(s) {
    return String(s || 'export')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 56) || 'export';
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function parsePx(v) {
    var n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  /** Tint a graphic SVG with current lettering colour. */
  function tintGraphic(svgEl, fillColor) {
    var clone = svgEl.cloneNode(true);
    clone.removeAttribute('style');
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    if (!clone.getAttribute('viewBox')) {
      var w = clone.getAttribute('width') || 100;
      var h = clone.getAttribute('height') || 100;
      clone.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    }
    var fill = fillColor || currentFg();
    var xml = new XMLSerializer().serializeToString(clone);
    xml = xml.replace(/currentColor/g, fill);
    if (xml.indexOf('xmlns=') === -1) {
      xml = xml.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + xml + '\n';
  }

  function letteringSvg(opts) {
    opts = opts || {};
    var n = names();
    var fg = opts.color || currentFg();
    var nm = nameFont();
    var det = detailFont();
    var w = opts.width || 2400;
    var h = opts.height || 1400;
    var title = opts.title || (n.n1 + ' + ' + n.n2);
    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="' + esc(title) + '">',
      '  <title>' + esc(title) + ' — lettering</title>',
      '  <desc>Editable text. Fonts: Instrument Serif / Roboto Mono (Google Fonts). In Illustrator: Type → Create Outlines before cutting.</desc>',
      '  <style><![CDATA[',
      '    .nm { font-family: ' + nm + '; font-weight: ' + (getComputedStyle(document.documentElement).getPropertyValue('--nmwt').trim() || '400') + '; font-size: 320px; letter-spacing: ' + (getComputedStyle(document.documentElement).getPropertyValue('--nmtrk').trim() || '-0.006em') + '; fill: ' + fg + '; }',
      '    .acc { font-family: ' + nm + '; font-style: italic; font-size: 220px; fill: ' + fg + '; }',
      '    .det { font-family: ' + det + '; font-weight: 400; font-size: 48px; letter-spacing: 0.16em; fill: ' + fg + '; }',
      '    .k { font-family: ' + det + '; font-weight: 400; font-size: 40px; letter-spacing: 0.2em; fill: ' + fg + '; }',
      '  ]]></style>',
      '  <text class="k" x="120" y="140">WELCOME TO THE WEDDING OF</text>',
      '  <text class="nm" x="120" y="520">' + esc(n.n1) + '</text>',
      '  <text class="acc" x="120" y="780">+</text>',
      '  <text class="nm" x="280" y="780">' + esc(n.n2) + '</text>',
      '  <text class="det" x="120" y="1080">SEPTEMBER 12, 2026</text>',
      '  <text class="det" x="120" y="1160">RUTH BANCROFT GARDEN · WALNUT CREEK, CA</text>',
      '</svg>',
      ''
    ].join('\n');
  }

  function isSkipped(el) {
    return !!(el.closest && (
      el.closest('.export-bar') ||
      el.closest('.meta') ||
      el.closest('script') ||
      el.closest('[data-export-ignore]')
    ));
  }

  function isLayoutContainer(el) {
    var self = getComputedStyle(el);
    // Flex rows that spread items to both edges — emit each child separately
    if ((self.display === 'flex' || self.display === 'inline-flex') &&
        /space-between|space-around|space-evenly/.test(self.justifyContent || '') &&
        el.children.length > 1) {
      return true;
    }
    // Block-level children ⇒ parent is a layout stack (don't flatten to one text run).
    // Inline spans inside .nm (N1/N2) are fine — parent keeps the "+" between them.
    return Array.from(el.children).some(function (c) {
      if (c.tagName === 'BR' || c.tagName === 'WBR') return false;
      var pos = getComputedStyle(c).position;
      if (pos === 'absolute' || pos === 'fixed') return true;
      if (/^(SPAN|I|EM|STRONG|B|A|SMALL|SUP|SUB)$/i.test(c.tagName)) return false;
      var d = getComputedStyle(c).display;
      return d === 'block' || d === 'flex' || d === 'grid' || d === 'list-item' || d === 'table';
    });
  }

  function collectTextLeaves(root) {
    var sel = '.k, .det, .nm, .acc, .jrow, .N1, .N2, [data-fg]';
    var candidates = Array.from(root.querySelectorAll(sel)).filter(function (el) {
      if (isSkipped(el) || el.closest('svg')) return false;
      if (!(el.textContent || '').replace(/\u00a0/g, ' ').trim()) return false;
      if (isLayoutContainer(el)) return false;
      return true;
    });

    // Children of space-between flex rows (plain <span>s without type classes)
    Array.from(root.querySelectorAll('.k, .det, [data-fg]')).forEach(function (el) {
      if (isSkipped(el)) return;
      var cs = getComputedStyle(el);
      if (!((cs.display === 'flex' || cs.display === 'inline-flex') &&
            /space-between|space-around|space-evenly/.test(cs.justifyContent || ''))) return;
      Array.from(el.children).forEach(function (c) {
        if (!(c.textContent || '').replace(/\u00a0/g, ' ').trim()) return;
        if (candidates.indexOf(c) === -1) candidates.push(c);
      });
    });

    return candidates.filter(function (el) {
      return !candidates.some(function (other) {
        return other !== el && other.contains(el);
      });
    });
  }

  function lineBoxesFor(el) {
    try {
      var range = document.createRange();
      range.selectNodeContents(el);
      var rects = Array.from(range.getClientRects()).filter(function (r) {
        return r.width > 0.5 && r.height > 0.5;
      });
      if (!rects.length) {
        var r0 = el.getBoundingClientRect();
        return r0.width > 0 ? [r0] : [];
      }
      // Letter-spacing / ligatures yield per-glyph rects — group into lines by Y
      var lines = [];
      var tol = Math.max(3, (rects[0].height || 10) * 0.35);
      rects.forEach(function (r) {
        var hit = null;
        for (var i = 0; i < lines.length; i++) {
          if (Math.abs(lines[i].top - r.top) <= tol) { hit = lines[i]; break; }
        }
        if (hit) {
          hit.left = Math.min(hit.left, r.left);
          hit.right = Math.max(hit.right, r.right);
          hit.top = Math.min(hit.top, r.top);
          hit.bottom = Math.max(hit.bottom, r.bottom);
          hit.width = hit.right - hit.left;
          hit.height = hit.bottom - hit.top;
        } else {
          lines.push({
            left: r.left, right: r.right, top: r.top, bottom: r.bottom,
            width: r.width, height: r.height
          });
        }
      });
      lines.sort(function (a, b) { return a.top - b.top; });
      return lines;
    } catch (e) {
      var r = el.getBoundingClientRect();
      return (r.width > 0 && r.height > 0) ? [r] : [];
    }
  }

  function textAnchorFromAlign(align, writingMode) {
    if (writingMode && writingMode.indexOf('vertical') === 0) return 'start';
    if (align === 'center' || align === 'middle') return 'middle';
    if (align === 'right' || align === 'end') return 'end';
    return 'start';
  }

  function mapX(rootRect, sx, rect, anchor) {
    if (anchor === 'middle') return (rect.left - rootRect.left + rect.width / 2) * sx;
    if (anchor === 'end') return (rect.right - rootRect.left) * sx;
    return (rect.left - rootRect.left) * sx;
  }

  function resolveFontKey(fontFamily, fontStyle, fontWeight) {
    var f = String(fontFamily || '').toLowerCase();
    var italic = String(fontStyle || '').indexOf('italic') !== -1;
    var wt = parseInt(fontWeight, 10) || 400;
    if (f.indexOf('instrument') !== -1) return italic ? 'instrumentItalic' : 'instrument';
    if (f.indexOf('roboto mono') !== -1) return wt >= 500 ? 'robotomonoMed' : 'robotomono';
    return null;
  }

  function loadFont(key) {
    if (fontCache[key]) return Promise.resolve(fontCache[key]);
    if (typeof opentype === 'undefined') {
      return Promise.reject(new Error('opentype.js not loaded'));
    }
    return fetch(FONT_URLS[key]).then(function (r) {
      if (!r.ok) throw new Error('font fetch failed: ' + key);
      return r.arrayBuffer();
    }).then(function (buf) {
      var font = opentype.parse(buf);
      fontCache[key] = font;
      return font;
    });
  }

  function preloadOutlineFonts() {
    return Promise.all([
      loadFont('instrument'),
      loadFont('instrumentItalic'),
      loadFont('robotomono'),
      loadFont('robotomonoMed')
    ]);
  }

  function parseLetterSpacingPx(letterSpacing, fontSize) {
    if (!letterSpacing || letterSpacing === 'normal' || letterSpacing === '0') return 0;
    var s = String(letterSpacing);
    if (s.indexOf('em') !== -1) return parseFloat(s) * fontSize;
    if (s.indexOf('px') !== -1) return parseFloat(s);
    var n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  function measureRun(font, text, fontSize, tracking) {
    var glyphs = font.stringToGlyphs(text);
    var w = 0;
    for (var i = 0; i < glyphs.length; i++) {
      w += glyphs[i].advanceWidth * (fontSize / font.unitsPerEm);
      if (i < glyphs.length - 1) w += tracking;
    }
    return w;
  }

  function pathDataForRun(font, text, x, y, fontSize, tracking, anchor) {
    var glyphs = font.stringToGlyphs(text);
    var total = measureRun(font, text, fontSize, tracking);
    var pen = x;
    if (anchor === 'middle') pen = x - total / 2;
    if (anchor === 'end') pen = x - total;
    var parts = [];
    var scale = fontSize / font.unitsPerEm;
    for (var i = 0; i < glyphs.length; i++) {
      var g = glyphs[i];
      var p = g.getPath(pen, y, fontSize);
      var d = p.toPathData(2);
      if (d && d !== 'M0,0Z') parts.push(d);
      pen += g.advanceWidth * scale;
      if (i < glyphs.length - 1) pen += tracking;
    }
    return parts.join(' ');
  }

  function pushTextOrPath(out, opts) {
    // opts: text, x, y, fontFamily, fontSize, fontWeight, fontStyle, letterSpacing, fill, anchor, transform
    if (!outlineMode) {
      var attrs =
        (opts.transform
          ? ' transform="' + opts.transform + '"'
          : ' x="' + opts.x.toFixed(1) + '" y="' + opts.y.toFixed(1) + '" text-anchor="' + (opts.anchor || 'start') + '"') +
        ' font-family="' + esc(opts.fontFamily) + '" font-size="' + opts.fontSize.toFixed(1) + '"' +
        ' font-weight="' + esc(String(opts.fontWeight)) + '" font-style="' + esc(opts.fontStyle) + '"' +
        ' letter-spacing="' + esc(opts.letterSpacing) + '" fill="' + opts.fill + '"' +
        (opts.extra || '');
      out.push('<text' + attrs + '>' + esc(opts.text) + '</text>');
      return;
    }
    var key = resolveFontKey(opts.fontFamily, opts.fontStyle, opts.fontWeight);
    var font = key && fontCache[key];
    if (!font) {
      outlineMissed++;
      // Fall back to live text if we don't have that face locally
      var attrs2 =
        (opts.transform
          ? ' transform="' + opts.transform + '"'
          : ' x="' + opts.x.toFixed(1) + '" y="' + opts.y.toFixed(1) + '" text-anchor="' + (opts.anchor || 'start') + '"') +
        ' font-family="' + esc(opts.fontFamily) + '" font-size="' + opts.fontSize.toFixed(1) + '"' +
        ' font-weight="' + esc(String(opts.fontWeight)) + '" font-style="' + esc(opts.fontStyle) + '"' +
        ' letter-spacing="' + esc(opts.letterSpacing) + '" fill="' + opts.fill + '"' +
        (opts.extra || '');
      out.push('<text' + attrs2 + '>' + esc(opts.text) + '</text>');
      return;
    }
    var tracking = parseLetterSpacingPx(opts.letterSpacing, opts.fontSize);
    var d = pathDataForRun(
      font, opts.text,
      opts.transform ? 0 : opts.x,
      opts.transform ? 0 : opts.y,
      opts.fontSize, tracking, opts.anchor || 'start'
    );
    if (!d) return;
    if (opts.transform) {
      out.push('<path transform="' + opts.transform + '" d="' + d + '" fill="' + opts.fill + '"/>');
    } else {
      out.push('<path d="' + d + '" fill="' + opts.fill + '"/>');
    }
  }

  function emitTextEl(el, rootRect, sx, sy, fg, out) {
    var cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) return;

    var writingMode = cs.writingMode || 'horizontal-tb';
    var vertical = writingMode.indexOf('vertical') === 0;
    var align = cs.textAlign;
    var anchor = textAnchorFromAlign(align, writingMode);
    var fontSize = parsePx(cs.fontSize) * sy;
    var fontFamily = cs.fontFamily || nameFont();
    var fontWeight = cs.fontWeight || '400';
    var fontStyle = cs.fontStyle || 'normal';
    var letterSpacing = cs.letterSpacing === 'normal' ? '0' : cs.letterSpacing;
    if (letterSpacing && letterSpacing.indexOf('px') !== -1) {
      letterSpacing = (parsePx(letterSpacing) * sx).toFixed(2) + 'px';
    }
    var fill = solidFg(fg);
    var computed = cs.color;
    if (computed && computed !== 'rgba(0, 0, 0, 0)') {
      // Use layout colour if it's a real solid (multi-tone blocks), else locked lettering colour
      fill = rgbToHex(computed) || fill;
    }
    // Never export translucent type — vinyl is one opaque cut
    if (parseFloat(cs.opacity) < 1) {
      fill = solidFg(fg);
    }

    if (el.classList.contains('jrow')) {
      Array.from(el.children).forEach(function (span) {
        var t = (span.textContent || '').replace(/\u00a0/g, ' ');
        if (!t) return;
        var r = span.getBoundingClientRect();
        var x = (r.left - rootRect.left) * sx;
        var y = (r.top - rootRect.top) * sy + fontSize * 0.8;
        pushTextOrPath(out, {
          text: t, x: x, y: y, anchor: 'start',
          fontFamily: fontFamily, fontSize: fontSize, fontWeight: fontWeight,
          fontStyle: fontStyle, letterSpacing: '0', fill: fill
        });
      });
      return;
    }

    var hasBr = !!el.querySelector('br');
    var text = (el.innerText || el.textContent || '').replace(/\u00a0/g, ' ').replace(/\r/g, '');

    // Single visual line (no <br>): one text node, full string — don't trust glyph rects
    if (!hasBr && !vertical) {
      var line = text.replace(/\s+/g, ' ').trim();
      if (!line) return;
      var box = el.getBoundingClientRect();
      if (box.width < 0.5 || box.height < 0.5) return;
      var x = mapX(rootRect, sx, box, anchor);
      var y = (box.top - rootRect.top) * sy + fontSize * 0.78;
      pushTextOrPath(out, {
        text: line, x: x, y: y, anchor: anchor,
        fontFamily: fontFamily, fontSize: fontSize, fontWeight: fontWeight,
        fontStyle: fontStyle, letterSpacing: letterSpacing, fill: fill
      });
      return;
    }

    var rawLines = text.split('\n').map(function (s) { return s.replace(/\s+/g, ' ').trim(); });
    while (rawLines.length > 1 && rawLines[rawLines.length - 1] === '') rawLines.pop();

    var boxes = lineBoxesFor(el);
    if (!boxes.length) return;

    if (boxes.length === 1 && rawLines.length > 1) {
      var b0 = boxes[0];
      var lineH = b0.height / rawLines.length;
      boxes = rawLines.map(function (_, i) {
        return {
          left: b0.left, right: b0.right, width: b0.width,
          top: b0.top + i * lineH, height: lineH,
          bottom: b0.top + (i + 1) * lineH
        };
      });
    }

    var n = Math.min(rawLines.length, boxes.length) || 0;
    for (var i = 0; i < n; i++) {
      var line2 = rawLines[i];
      if (!line2) continue;
      var r = boxes[i];
      if (vertical) {
        var cx = (r.left - rootRect.left + r.width / 2) * sx;
        var cy = (r.top - rootRect.top) * sy;
        pushTextOrPath(out, {
          text: line2, x: 0, y: 0, anchor: 'start',
          transform: 'translate(' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ') rotate(90)',
          extra: ' dominant-baseline="middle"',
          fontFamily: fontFamily, fontSize: fontSize, fontWeight: fontWeight,
          fontStyle: fontStyle, letterSpacing: letterSpacing, fill: fill
        });
      } else {
        var x2 = mapX(rootRect, sx, r, anchor);
        var y2 = (r.top - rootRect.top) * sy + fontSize * 0.78;
        pushTextOrPath(out, {
          text: line2, x: x2, y: y2, anchor: anchor,
          fontFamily: fontFamily, fontSize: fontSize, fontWeight: fontWeight,
          fontStyle: fontStyle, letterSpacing: letterSpacing, fill: fill
        });
      }
    }
  }

  function rgbToHex(rgb) {
    var m = String(rgb).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
    if (!m) return null;
    // Vinyl is one solid cut colour — ignore any alpha from the page
    return '#' + [m[1], m[2], m[3]].map(function (v) {
      return ('0' + Number(v).toString(16)).slice(-2);
    }).join('');
  }

  function solidFg(preferred) {
    // Always export opaque lettering for the cutter
    return preferred || currentFg() || '#1E1D1A';
  }

  function emitGraphic(svgEl, rootRect, sx, sy, fg, out) {
    if (isSkipped(svgEl)) return;
    var r = svgEl.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;

    var vb = svgEl.viewBox && svgEl.viewBox.baseVal;
    var vbW = (vb && vb.width) || parsePx(svgEl.getAttribute('width')) || 100;
    var vbH = (vb && vb.height) || parsePx(svgEl.getAttribute('height')) || 100;
    var x = (r.left - rootRect.left) * sx;
    var y = (r.top - rootRect.top) * sy;
    var w = r.width * sx;
    var h = r.height * sy;

    var inner = '';
    Array.from(svgEl.childNodes).forEach(function (node) {
      if (node.nodeType !== 1) return;
      inner += new XMLSerializer().serializeToString(node);
    });
    inner = inner.replace(/currentColor/g, fg);

    out.push(
      '<svg x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) +
      '" height="' + h.toFixed(1) + '" viewBox="0 0 ' + vbW + ' ' + vbH +
      '" overflow="visible" fill="' + (svgEl.getAttribute('fill') === 'none' ? 'none' : fg) +
      '" stroke="' + (svgEl.getAttribute('stroke') === 'currentColor' || svgEl.getAttribute('fill') === 'none' ? fg : 'none') + '">' +
      inner + '</svg>'
    );
  }

  function emitRules(el, rootRect, sx, sy, fg, out) {
    if (isSkipped(el) || el.closest('svg')) return;
    var cs = getComputedStyle(el);
    var r = el.getBoundingClientRect();
    var x = (r.left - rootRect.left) * sx;
    var w = r.width * sx;

    ['Top', 'Bottom'].forEach(function (side) {
      var width = parsePx(cs['border' + side + 'Width']);
      var style = cs['border' + side + 'Style'];
      if (width < 0.5 || style === 'none') return;
      var y = side === 'Top'
        ? (r.top - rootRect.top) * sy
        : (r.bottom - rootRect.top) * sy - width * sy;
      out.push(
        '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) +
        '" height="' + Math.max(1, width * sy).toFixed(1) + '" fill="' + fg + '"/>'
      );
    });

    // Hairline divs used as rules (height ~1–3px, solid background)
    var h = r.height;
    if (h > 0 && h <= 4 && cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') {
      var y2 = (r.top - rootRect.top) * sy;
      out.push(
        '<rect x="' + x.toFixed(1) + '" y="' + y2.toFixed(1) + '" width="' + w.toFixed(1) +
        '" height="' + Math.max(1, h * sy).toFixed(1) + '" fill="' + (rgbToHex(cs.backgroundColor) || fg) + '"/>'
      );
    }
  }

  /**
   * Build a 24×36 in (2×3 ft) SVG of the full layout for a vinyl / stencil cutter.
   * Uses real <text> + nested graphics (no foreignObject).
   * Uniform scale so the preview aspect (2:3) maps 1:1 onto the board — nothing clipped or stretched.
   */
  function layoutToCutterSvg(signEl, label, opts) {
    opts = opts || {};
    var frame = signEl.closest('.frame') || signEl;
    var rootRect = frame.getBoundingClientRect();
    // Lock to board aspect: scale uniformly, then letterbox if the on-screen frame
    // is slightly off (subpixel). Content always fits inside 24×36.
    var sx = PANEL_W / Math.max(1, rootRect.width);
    var sy = PANEL_H / Math.max(1, rootRect.height);
    var scale = Math.min(sx, sy);
    sx = scale;
    sy = scale;
    var contentW = rootRect.width * scale;
    var contentH = rootRect.height * scale;
    var padX = (PANEL_W - contentW) / 2;
    var padY = (PANEL_H - contentH) / 2;
    var fg = opts.cutColor || currentFg();
    var includeBoard = opts.includeBoard !== false;
    var board = '#BFA52B';
    var out = [];

    if (includeBoard) {
      out.push('<rect width="' + PANEL_W + '" height="' + PANEL_H + '" fill="' + board + '"/>');
    } else {
      out.push(
        '<rect width="' + PANEL_W + '" height="' + PANEL_H + '" fill="none" stroke="#CCCCCC" stroke-width="2" stroke-dasharray="12 10"/>'
      );
    }

    out.push('<g transform="translate(' + padX.toFixed(2) + ' ' + padY.toFixed(2) + ')">');

    function mapRoot() {
      return {
        left: rootRect.left,
        top: rootRect.top,
        width: rootRect.width,
        height: rootRect.height
      };
    }
    var mappedRoot = mapRoot();

    // Rules first (under type)
    frame.querySelectorAll('.sign, [data-g], [data-fg], [data-inv], [data-band]').forEach(function (el) {
      emitRules(el, mappedRoot, sx, sy, fg, out);
    });
    frame.querySelectorAll('div').forEach(function (el) {
      var cs = getComputedStyle(el);
      var h = el.getBoundingClientRect().height;
      if (h > 0 && h <= 4 && cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        emitRules(el, mappedRoot, sx, sy, fg, out);
      }
    });

    // Graphics
    frame.querySelectorAll('svg').forEach(function (svg) {
      if (svg.closest('.export-bar')) return;
      emitGraphic(svg, mappedRoot, sx, sy, fg, out);
    });

    // Text leaves (outermost type blocks only)
    collectTextLeaves(frame).forEach(function (el) {
      emitTextEl(el, mappedRoot, sx, sy, fg, out);
    });

    out.push('</g>');

    var n = names();
    var face = (document.getElementById('nf') || {}).value || 'instrument';
    var title = label || (n.n1 + ' + ' + n.n2 + ' welcome sign');
    var outlined = !!opts.outline;
    var descFonts = outlined
      ? 'Lettering converted to outlines (paths) — no fonts required to cut. '
      : 'Fonts used: ' + esc(nameFont()) + ' (names), ' + esc(detailFont()) +
        ' (details). Open in Illustrator → Type → Create Outlines before cutting. ';

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<svg xmlns="http://www.w3.org/2000/svg"',
      '  viewBox="0 0 ' + PANEL_W + ' ' + PANEL_H + '"',
      '  width="' + PANEL_W_IN + 'in" height="' + PANEL_H_IN + 'in"',
      '  role="img" aria-label="' + esc(title) + '">',
      '  <title>' + esc(title) + '</title>',
      '  <desc>Allison + Skylar welcome sign layout — ' + PANEL_W_IN + '×' + PANEL_H_IN +
        ' inches (2×3 ft birch board). SOLID ONE-COLOUR artwork for vinyl/stencil — no opacity, no washes. ' +
        descFonts + 'Lettering colour: ' + fg + '.</desc>',
      '  <!-- face:' + esc(face) + ' lettering:' + fg + ' board:24x36 outlined:' + outlined + ' -->',
      '  ' + out.join('\n  '),
      '</svg>',
      ''
    ].join('\n');
  }

  function wireAssetCard(card) {
    var src = card.getAttribute('data-svg-src');
    var name = card.getAttribute('data-svg-name') || 'graphic';
    var preview = card.querySelector('[data-svg-preview]');
    var copyBtn = card.querySelector('[data-action="copy"]');
    var dlBtn = card.querySelector('[data-action="download"]');

    function getSvgText() {
      if (preview && preview.querySelector('svg')) {
        return tintGraphic(preview.querySelector('svg'));
      }
      return fetch(src).then(function (r) { return r.text(); }).then(function (t) {
        return t.replace(/currentColor/g, currentFg());
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        Promise.resolve(getSvgText()).then(function (t) { copyText(t); });
      });
    }
    if (dlBtn) {
      dlBtn.addEventListener('click', function () {
        Promise.resolve(getSvgText()).then(function (t) {
          download(slug(name) + '.svg', t);
          toast('Downloaded ' + slug(name) + '.svg');
        });
      });
    }
  }

  function addExportBar(metaEl, signEl) {
    if (!metaEl || !signEl) return;
    if (metaEl.querySelector('.export-bar')) return;
    var h3 = metaEl.querySelector('h3');
    var label = h3 ? h3.textContent.trim() : 'sign';
    var bar = document.createElement('div');
    bar.className = 'export-bar';
    bar.setAttribute('data-export-ignore', '');
    bar.innerHTML =
      '<button type="button" class="xbtn primary" data-x="dl-cut-outlined" title="Lettering as paths, no board — send this to Etsy">↓ Send to Etsy (outlined)</button>' +
      '<button type="button" class="xbtn" data-x="dl-cut" title="Same layout but editable text — optional backup">↓ Editable backup</button>';

    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-x]');
      if (!btn) return;
      var action = btn.getAttribute('data-x');
      var fileBase = slug(label);

      if (action === 'dl-layout' || action === 'copy-layout') {
        outlineMode = false;
        outlineMissed = 0;
        var full = layoutToCutterSvg(signEl, label, { includeBoard: true });
        if (action === 'copy-layout') copyText(full);
        else {
          download(fileBase + '-layout-24x36.svg', full);
          toast('Downloaded 24×36 layout SVG');
        }
        return;
      }
      if (action === 'dl-cut') {
        outlineMode = false;
        outlineMissed = 0;
        var cut = layoutToCutterSvg(signEl, label, { includeBoard: false });
        download(fileBase + '-cut-file-24x36.svg', cut);
        toast('Downloaded editable backup');
        return;
      }
      if (action === 'dl-cut-outlined') {
        toast('Building outlines…');
        preloadOutlineFonts().then(function () {
          outlineMode = true;
          outlineMissed = 0;
          var cutO = layoutToCutterSvg(signEl, label, { includeBoard: false, outline: true });
          outlineMode = false;
          download(fileBase + '-cut-outlined-24x36.svg', cutO);
          if (outlineMissed > 0) {
            toast('Downloaded — some lines stayed as text (face not bundled)');
          } else {
            toast('Downloaded — send this to Etsy');
          }
        }).catch(function (err) {
          outlineMode = false;
          console.error(err);
          toast('Outline failed — refresh the page and try again');
        });
        return;
      }
    });
    metaEl.appendChild(bar);
  }

  function init() {
    document.querySelectorAll('.asset-card').forEach(wireAssetCard);

    document.querySelectorAll('.grid > div').forEach(function (card) {
      var frame = card.querySelector('.frame');
      var sign = frame && (frame.querySelector('.sign') || frame.querySelector('[data-g]') || frame.firstElementChild);
      var meta = card.querySelector('.meta');
      if (sign && meta) addExportBar(meta, sign);
    });

    var note = document.getElementById('cutter-note');
    if (note) {
      // keep live
    }

    var global = document.getElementById('export-global');
    if (global) {
      global.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-x]');
        if (!btn) return;
        var action = btn.getAttribute('data-x');
        if (action === 'copy-letters' || action === 'dl-letters') {
          var letters = letteringSvg();
          if (action === 'copy-letters') copyText(letters);
          else {
            var n = names();
            download(slug(n.n1 + '-' + n.n2 + '-lettering') + '.svg', letters);
            toast('Downloaded lettering SVG');
          }
        }
        if (action === 'dl-agave') {
          fetch('assets/svg/agave.svg').then(function (r) { return r.text(); }).then(function (t) {
            download('agave.svg', t.replace(/currentColor/g, currentFg()));
            toast('Downloaded agave.svg');
          });
        }
        if (action === 'dl-champagne') {
          fetch('assets/svg/champagne.svg').then(function (r) { return r.text(); }).then(function (t) {
            download('champagne.svg', t.replace(/currentColor/g, currentFg()));
            toast('Downloaded champagne.svg');
          });
        }
        if (action === 'dl-reg') {
          fetch('assets/svg/registration-marks.svg').then(function (r) { return r.text(); }).then(function (t) {
            download('registration-marks.svg', t.replace(/currentColor/g, currentFg()));
            toast('Downloaded registration-marks.svg');
          });
        }
      });
    }
  }

  // Expose for debugging / smoke tests
  window.WeddingSignExport = {
    layoutToCutterSvg: layoutToCutterSvg,
    letteringSvg: letteringSvg
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
