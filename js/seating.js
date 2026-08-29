/**
 * Seating-chart explorer — live list, suite type, and print.
 */
(function () {
  'use strict';

  var ASSIGN_KEY = 'wedding-seating-assign-v1';
  var RULE_KEY = 'wedding-seating-rule-v1';
  var STYLE_KEY = 'wedding-seating-rule-style-v1';
  var SPINE_KEY = 'wedding-seating-spine-style-v1';
  var SIT_KEY = 'wedding-seating-lead-sit-v1';
  var NUDGE_KEY = 'wedding-seating-nudge-v1';
  var TABLE_MAX = 15;
  var ROW_LEN = 5;
  var SIGN_CAP = 6;
  var PLACE_KEY = 'wedding-seating-place-v1';
  var LAYOUT_KEY = 'wedding-seating-layouts-v1';
  var WIPED_KEY = 'wedding-seating-wiped-v1';
  var LAST_SAVED_ID = 'keep:Last saved';
  var SEED_REV = 'friday-2134';
  var SEED_REV_KEY = 'wedding-seating-seed-rev-v1';
  var HEAD_SLOTS = [
    ['arthur-dann', 7, 3],
    ['rainya-dann', 7, 4],
    ['skylar-dann', 7, 5],
    ['allison-fong', 8, 3],
    ['simon-fong', 8, 4],
    ['yan-zhen-li', 8, 5],
    ['jeffrey-dann', 7, 0],
    ['christopher-hobbs', 7, 1],
    ['cindy', 7, 2],
    ['bruno-lopez', 8, 1],
    ['can-chao-kuang', 8, 2]
  ];
  var KIN_GROUPS = [
    {
      ids: ['justin-chen', 'aly-henneberry', 'ray-crockett', 'ahyoung-an', 'jon-ganey', 'mallory-wang'],
      prefer: 1
    },
    {
      ids: ['paige-cross', 'waylon-cross', 'peter-cross', 'vicki-moore-cross', 'kathy-cross-brown'],
      prefer: 6
    }
  ];
  var guests = [];
  var assign = {};
  var place = {};
  var selectedTable = 1;
  var pickedId = '';

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
    instrument: { f: 'var(--font-invite-serif)', wt: 400, trk: '-.006em', s: 1 },
    helveticablack: { f: 'var(--font-std-black)', wt: 900, trk: '-.02em', s: 0.88 },
    playfair: { f: "'Playfair Display',serif", wt: 500, trk: '-.014em', s: 0.92 },
    bodoni: { f: "'Bodoni Moda',serif", wt: 500, trk: '-.008em', s: 0.94 },
    dmserif: { f: "'DM Serif Display',serif", wt: 400, trk: '-.018em', s: 0.92 }
  };
  var DF = {
    robotomono: { f: 'var(--font-invite-mono)', wt: 400, t1: '.18em', t2: '.1em' },
    helveticathin: { f: 'var(--font-std-thin)', wt: 100, t1: '.08em', t2: '.06em' },
    serifcaps: { f: 'var(--font-invite-serif)', wt: 400, t1: '.2em', t2: '.14em' },
    inter: { f: 'Inter,sans-serif', wt: 500, t1: '.16em', t2: '.1em' }
  };

  var ground = 'bone';
  var text = 'ink';
  var paper = '24x36';
  var rule = 0.65;
  var ruleStyle = 'solid';
  var spineStyle = 'solid';
  var leadSit = 'bot';

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function parseSeats(raw) {
    var text = (raw || '').replace(/\r/g, '');
    var tables = [];
    var blocks = text.split(/\n{2,}/);
    blocks.forEach(function (block) {
      var lines = block.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
      if (!lines.length) return;
      var head = lines[0];
      var inline = head.match(/^(\d{1,2})\s*[:.—–-]\s*(.+)$/);
      var n;
      var guests;
      if (inline) {
        n = parseInt(inline[1], 10);
        guests = inline[2].split(/\s*,\s*/).filter(Boolean);
      } else if (/^\d{1,2}$/.test(head)) {
        n = parseInt(head, 10);
        guests = lines.slice(1);
      } else {
        return;
      }
      if (!n || n < 1) n = 1;
      if (n > TABLE_MAX) n = TABLE_MAX;
      tables.push({ n: n, guests: guests });
    });
    tables.sort(function (a, b) { return a.n - b.n; });
    return tables;
  }

  function loadAssign() {
    try {
      var raw = localStorage.getItem(ASSIGN_KEY);
      var obj = raw ? JSON.parse(raw) : {};
      assign = obj && typeof obj === 'object' ? obj : {};
      Object.keys(assign).forEach(function (id) {
        var n = parseInt(assign[id], 10);
        if (!n || n < 1 || n > TABLE_MAX) delete assign[id];
        else assign[id] = n;
      });
    } catch (e) {
      assign = {};
    }
  }

  var workTimer = 0;

  function persistAssign() {
    try { localStorage.setItem(ASSIGN_KEY, JSON.stringify(assign)); } catch (e) {}
    savePlace();
  }

  function wasWiped() {
    try { return localStorage.getItem(WIPED_KEY) === '1'; } catch (e) { return false; }
  }

  function markWiped() {
    try { localStorage.setItem(WIPED_KEY, '1'); } catch (e) {}
  }

  function clearWiped() {
    try { localStorage.removeItem(WIPED_KEY); } catch (e) {}
  }

  function roomCount() {
    var n = 0;
    Object.keys(assign).forEach(function (id) { if (assign[id]) n += 1; });
    return n;
  }

  function layoutSeated(item) {
    return item && item.assign ? Object.keys(item.assign).length : 0;
  }

  function isPinnedLayout(x) {
    return !!(x && (x.id === LAST_SAVED_ID || x.id === 'keep:Working copy' ||
      x.name === 'Last saved' || x.name === 'Working copy'));
  }

  function findNamedLayout(name, id) {
    return loadLayouts().filter(function (x) {
      return (id && x.id === id) || x.name === name;
    })[0];
  }

  function touchLayoutOption(id, name, at) {
    var sel = document.getElementById('layout-pick');
    if (!sel) return;
    var opt = Array.prototype.filter.call(sel.options, function (o) {
      return o.value === id;
    })[0];
    if (opt) opt.textContent = name + (at ? ' · ' + layoutWhen(at) : '');
    else fillLayoutPick();
  }

  function pinLastSaved() {
    if (wasWiped()) return;
    var n = roomCount();
    if (n < 1) return;
    var prev = findNamedLayout('Last saved', LAST_SAVED_ID);
    if (prev && layoutSeated(prev) > n) return;
    var item = snapshotRoom('Last saved', LAST_SAVED_ID);
    var list = loadLayouts().filter(function (x) {
      return x.id !== LAST_SAVED_ID && x.name !== 'Last saved';
    });
    list.unshift(item);
    writeLayouts(list);
    touchLayoutOption(LAST_SAVED_ID, item.name, item.at);
    return item;
  }

  function writeWorking() {
    var n = roomCount();
    var prev = findNamedLayout('Working copy', 'keep:Working copy');
    if (n < 1 && prev && layoutSeated(prev) > 0) {
      markSaved(prev.at);
      return prev;
    }
    var id = 'keep:Working copy';
    var item = snapshotRoom('Working copy', id);
    var list = loadLayouts();
    var found = false;
    list = list.map(function (x) {
      if (x.id === id || x.name === 'Working copy') {
        found = true;
        return item;
      }
      return x;
    });
    if (!found) list.unshift(item);
    writeLayouts(list);
    touchLayoutOption(id, item.name, item.at);
    pinLastSaved();
    markSaved(item.at);
    return item;
  }

  function rememberWorking(flush) {
    if (wasWiped()) return;
    if (flush) {
      if (workTimer) {
        clearTimeout(workTimer);
        workTimer = 0;
      }
      writeWorking();
      return;
    }
    if (workTimer) clearTimeout(workTimer);
    workTimer = setTimeout(function () {
      workTimer = 0;
      writeWorking();
    }, 400);
  }

  function markSaved(at) {
    var el = document.getElementById('layout-saved');
    if (!el) return;
    el.textContent = 'Saved as you work · ' + layoutWhen(at || Date.now());
  }

  function saveAssign(flush) {
    persistAssign();
    rememberWorking(flush === true);
  }

  function loadPlace() {
    try {
      var raw = localStorage.getItem(PLACE_KEY);
      var obj = raw ? JSON.parse(raw) : {};
      place = obj && typeof obj === 'object' ? obj : {};
    } catch (e) {
      place = {};
    }
    Object.keys(place).forEach(function (id) {
      var s = parseInt(place[id], 10);
      if (!assign[id] || s !== s || s < 0 || s >= SIGN_CAP) delete place[id];
      else place[id] = s;
    });
  }

  function applyPlaces() {
    Object.keys(assign).forEach(function (id) {
      if (!guests.some(function (g) { return g.id === id; })) {
        delete assign[id];
        delete place[id];
      }
    });
    Object.keys(place).forEach(function (id) {
      if (!assign[id] || !guests.some(function (g) { return g.id === id; })) delete place[id];
    });
    for (var t = 1; t <= TABLE_MAX; t++) fillSeats(t);
  }

  function applySeedData(data) {
    if (!data || !data.assign || typeof data.assign !== 'object') return false;
    assign = cloneMap(data.assign);
    place = cloneMap(data.place || {});
    applyPlaces();
    persistAssign();
    pinLastSaved();
    return seatedCount() >= 40;
  }

  function savePlace() {
    try { localStorage.setItem(PLACE_KEY, JSON.stringify(place)); } catch (e) {}
  }

  function cloneMap(obj) {
    try { return JSON.parse(JSON.stringify(obj || {})); } catch (e) { return {}; }
  }

  function layoutWhen(t) {
    var d = new Date(t);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  function loadLayouts() {
    try {
      var raw = localStorage.getItem(LAYOUT_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function writeLayouts(list) {
    var pinned = [];
    var rest = [];
    var seen = {};
    (list || []).forEach(function (x) {
      if (!x) return;
      if (isPinnedLayout(x)) {
        var key = x.id || x.name;
        if (seen[key]) return;
        seen[key] = true;
        pinned.push(x);
      } else rest.push(x);
    });
    pinned.sort(function (a, b) {
      var order = { 'Last saved': 0, 'Working copy': 1 };
      return (order[a.name] != null ? order[a.name] : 2) - (order[b.name] != null ? order[b.name] : 2);
    });
    var extra = Math.max(0, 24 - pinned.length);
    var out = pinned.concat(rest.slice(0, extra));
    try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(out)); } catch (e) {}
  }

  function fillLayoutPick() {
    var sel = document.getElementById('layout-pick');
    if (!sel) return;
    var list = loadLayouts();
    var rank = { 'Last saved': 0, 'Working copy': 1, 'Last session': 2 };
    list.sort(function (a, b) {
      var ra = rank.hasOwnProperty(a.name) ? rank[a.name] : 10;
      var rb = rank.hasOwnProperty(b.name) ? rank[b.name] : 10;
      if (ra !== rb) return ra - rb;
      return (b.at || 0) - (a.at || 0);
    });
    var cur = sel.value;
    sel.innerHTML = '';
    if (!list.length) {
      var empty = document.createElement('option');
      empty.value = '';
      empty.textContent = 'No saved layouts yet';
      sel.appendChild(empty);
      return;
    }
    list.forEach(function (item) {
      var opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = item.name + (item.at ? ' · ' + layoutWhen(item.at) : '');
      sel.appendChild(opt);
    });
    if (cur && list.some(function (item) { return item.id === cur; })) sel.value = cur;
  }

  function snapshotRoom(name, id) {
    return {
      id: id || String(Date.now()),
      name: name,
      at: Date.now(),
      assign: cloneMap(assign),
      place: cloneMap(place)
    };
  }

  function upsertLayout(name) {
    var list = loadLayouts();
    var id = 'keep:' + name;
    var item = snapshotRoom(name, id);
    list = list.filter(function (x) { return x.id !== id && x.name !== name; });
    list.unshift(item);
    writeLayouts(list);
    fillLayoutPick();
    return item;
  }

  function applyLayout(item) {
    if (!item || !item.assign) return;
    clearWiped();
    assign = cloneMap(item.assign);
    place = cloneMap(item.place);
    applyPlaces();
    saveAssign(true);
    renderAssign();
    renderAllSoon();
  }

  function findLayout(id) {
    return loadLayouts().filter(function (item) { return item.id === id; })[0];
  }

  function seedWorkingLayout() {
    var work = loadLayouts().filter(function (x) {
      return x.id === 'keep:Working copy' || x.name === 'Working copy';
    })[0];
    if (work) {
      markSaved(work.at);
      return;
    }
    writeWorking();
  }

  function wireLayouts() {
    var saveBtn = document.getElementById('save-layout');
    var loadBtn = document.getElementById('load-layout');
    var delBtn = document.getElementById('delete-layout');
    var downBtn = document.getElementById('download-layout');
    var file = document.getElementById('import-layout');
    var openBtn = document.getElementById('import-layout-btn');
    var sel = document.getElementById('layout-pick');
    fillLayoutPick();
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var name = window.prompt('Name this layout', 'Working ' + layoutWhen(Date.now()));
        if (name == null) return;
        name = String(name).trim() || ('Working ' + layoutWhen(Date.now()));
        var list = loadLayouts();
        list.unshift(snapshotRoom(name));
        writeLayouts(list);
        fillLayoutPick();
        if (sel) sel.value = list[0].id;
      });
    }
    if (loadBtn) {
      loadBtn.addEventListener('click', function () {
        if (!sel || !sel.value) return;
        var item = findLayout(sel.value);
        if (!item) return;
        if (item.id !== 'keep:Before load') upsertLayout('Before load');
        applyLayout(item);
        fillLayoutPick();
      });
    }
    if (delBtn) {
      delBtn.addEventListener('click', function () {
        if (!sel || !sel.value) return;
        var item = findLayout(sel.value);
        if (!item) return;
        if (item.id === LAST_SAVED_ID || item.name === 'Last saved' ||
            item.id === 'keep:Working copy' || item.name === 'Working copy') {
          window.alert('That copy stays so the last saved room can come back after a reload.');
          return;
        }
        if (!window.confirm('Delete “' + item.name + '”?')) return;
        writeLayouts(loadLayouts().filter(function (x) { return x.id !== item.id; }));
        fillLayoutPick();
      });
    }
    if (downBtn) {
      downBtn.addEventListener('click', function () {
        var payload = {
          name: 'Download ' + layoutWhen(Date.now()),
          at: Date.now(),
          assign: cloneMap(assign),
          place: cloneMap(place)
        };
        var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'seating-layout.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
      });
    }
    if (openBtn && file) {
      openBtn.addEventListener('click', function () { file.click(); });
      file.addEventListener('change', function () {
        var chosen = file.files && file.files[0];
        file.value = '';
        if (!chosen) return;
        var reader = new FileReader();
        reader.onload = function () {
          try {
            var data = JSON.parse(String(reader.result || ''));
            if (!data || typeof data !== 'object' || !data.assign) return;
            upsertLayout('Before load');
            applyLayout({
              assign: data.assign,
              place: data.place || {}
            });
            fillLayoutPick();
          } catch (err) {}
        };
        reader.readAsText(chosen);
      });
    }
  }

  function seatOf(id) {
    var s = parseInt(place[id], 10);
    return (s >= 0 && s < SIGN_CAP) ? s : -1;
  }

  function whoAt(n, s) {
    var found = null;
    guests.forEach(function (g) {
      if (assign[g.id] === n && seatOf(g.id) === s) found = g;
    });
    return found;
  }

  function fillSeats(n, prefer) {
    var taken = {};
    var locked = {};
    (prefer || []).forEach(function (id) { locked[id] = true; });
    var need = [];
    function claim(g) {
      var s = seatOf(g.id);
      if (s >= 0 && !taken[s]) {
        taken[s] = g.id;
        place[g.id] = s;
        return true;
      }
      return false;
    }
    guests.forEach(function (g) {
      if (assign[g.id] !== n || !locked[g.id]) return;
      if (!claim(g)) need.push(g);
    });
    guests.forEach(function (g) {
      if (assign[g.id] !== n || locked[g.id]) return;
      if (!claim(g)) need.push(g);
    });
    var next = 0;
    need.forEach(function (g) {
      while (next < SIGN_CAP && taken[next]) next += 1;
      if (next < SIGN_CAP) {
        place[g.id] = next;
        taken[next] = g.id;
        next += 1;
      } else delete place[g.id];
    });
  }

  function across(s) {
    return s < 3 ? s + 3 : s - 3;
  }

  function colOf(s) {
    return s < 3 ? s : s - 3;
  }

  function acrossOrder(start) {
    var s0 = start >= 0 && start < SIGN_CAP ? start : 0;
    var col = colOf(s0);
    var cols = [col, (col + 1) % 3, (col + 2) % 3];
    var out = [];
    cols.forEach(function (c) {
      if (s0 < 3) {
        out.push(c);
        out.push(c + 3);
      } else {
        out.push(c + 3);
        out.push(c);
      }
    });
    return out;
  }

  function alongOrder(start) {
    var side = start >= 0 && start < 3 ? [0, 1, 2] : [3, 4, 5];
    var s0 = start >= 0 && start < SIGN_CAP ? start : 3;
    if (side.indexOf(s0) < 0) s0 = side[0];
    var i = side.indexOf(s0);
    var out = side.slice(i).concat(side.slice(0, i));
    var other = s0 < 3 ? [3, 4, 5] : [0, 1, 2];
    return out.concat(other);
  }

  function arrangeFacing(n, lock) {
    lock = lock || {};
    var used = {};
    guests.forEach(function (g) {
      if (assign[g.id] !== n) return;
      if (!(lock[g.id] || isHost(g))) return;
      var s = seatOf(g.id);
      if (s >= 0) used[s] = g.id;
    });
    function freeCol() {
      var c;
      for (c = 0; c < 3; c++) {
        if (!used[c] && !used[c + 3]) return c;
      }
      return -1;
    }
    function takeCol(c, a, b) {
      var far = c;
      var near = c + 3;
      place[a.id] = far;
      place[b.id] = near;
      used[far] = a.id;
      used[near] = b.id;
    }
    function seated(id) {
      var s;
      for (s = 0; s < SIGN_CAP; s++) if (used[s] === id) return true;
      return false;
    }
    var parties = uniqueParties().filter(function (p) {
      return p.members.filter(function (g) { return assign[g.id] === n; }).length > 1;
    });
    parties.sort(function (a, b) { return b.members.length - a.members.length; });
    parties.forEach(function (p) {
      if (p.members.some(function (g) { return isHost(g) || lock[g.id]; })) return;
      var mine = p.members.filter(function (g) { return assign[g.id] === n; });
      var left = mine.slice();
      while (left.length >= 2) {
        var c = freeCol();
        if (c < 0) break;
        takeCol(c, left[0], left[1]);
        left = left.slice(2);
      }
      left.forEach(function (g) {
        var s;
        for (s = 0; s < SIGN_CAP; s++) {
          if (!used[s]) {
            place[g.id] = s;
            used[s] = g.id;
            return;
          }
        }
      });
    });
    guests.forEach(function (g) {
      if (assign[g.id] !== n || seated(g.id)) return;
      var s;
      for (s = 0; s < SIGN_CAP; s++) {
        if (!used[s]) {
          place[g.id] = s;
          used[s] = g.id;
          return;
        }
      }
      delete place[g.id];
    });
  }

  function firstName(g) {
    if (g && g.first) return g.first;
    return String((g && g.name) || '').trim().split(/\s+/)[0] || '';
  }

  function chairLabel(g) {
    if (g && g.id === 'yan-zhen-li') return 'Yen';
    return firstName(g);
  }

  function seatedCount() {
    var n = 0;
    guests.forEach(function (g) { if (assign[g.id]) n += 1; });
    return n;
  }

  function guestLast(g) {
    if (g && g.last) return g.last;
    var parts = String((g && g.name) || '').trim().split(/\s+/);
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }

  function lastTokens(last) {
    return String(last || '')
      .toLowerCase()
      .replace(/['’]/g, '')
      .split(/[\s/-]+/)
      .filter(function (t) { return t.length > 1; });
  }

  function partyTokens(p) {
    var seen = {};
    (p.members || []).forEach(function (g) {
      lastTokens(guestLast(g)).forEach(function (t) { seen[t] = true; });
    });
    return Object.keys(seen);
  }

  function kinOf(p) {
    var tokens = {};
    partyTokens(p).forEach(function (t) { tokens[t] = true; });
    if (!Object.keys(tokens).length) return [p];
    return uniqueParties().filter(function (q) {
      return partyTokens(q).some(function (t) { return tokens[t]; });
    });
  }

  function countAt(n) {
    var c = 0;
    guests.forEach(function (g) { if (assign[g.id] === n) c += 1; });
    return c;
  }

  function packParties(list, start, skip) {
    var CAP = SIGN_CAP;
    skip = skip || {};
    list.forEach(function (p) {
      p.members.forEach(function (g) {
        delete assign[g.id];
        delete place[g.id];
      });
    });
    var t = start || 1;
    while (skip[t] && t < TABLE_MAX) t += 1;
    var head = countAt(t);
    list.forEach(function (p) {
      var n = p.members.length;
      while (t < TABLE_MAX && (skip[t] || (head > 0 && head + n > CAP))) {
        t += 1;
        while (skip[t] && t < TABLE_MAX) t += 1;
        head = countAt(t);
      }
      if (skip[t] || head + n > CAP) {
        var dest = firstTableWithRoom(n, skip);
        if (!dest) return;
        p.members.forEach(function (g) { assign[g.id] = dest; });
        return;
      }
      p.members.forEach(function (g) { assign[g.id] = t; });
      head += n;
    });
    for (var i = 1; i <= TABLE_MAX; i++) arrangeFacing(i);
  }

  function headIds() {
    var ids = {};
    HEAD_SLOTS.forEach(function (slot) { ids[slot[0]] = true; });
    return ids;
  }

  function putSeat(id, n, s) {
    var occ = whoAt(n, s);
    if (occ && occ.id !== id) {
      delete assign[occ.id];
      delete place[occ.id];
    }
    if (!guests.some(function (g) { return g.id === id; })) return;
    assign[id] = n;
    place[id] = s;
  }

  function seatAllChairs(lock) {
    lock = lock || headIds();
    var t;
    for (t = 1; t <= TABLE_MAX; t++) arrangeFacing(t, lock);
  }

  function firstTableWithRoom(need, skip) {
    var t;
    for (t = 1; t <= TABLE_MAX; t++) {
      if (skip && skip[t]) continue;
      if (countAt(t) + need <= SIGN_CAP) return t;
    }
    return 0;
  }

  function reuniteParties(lock) {
    lock = lock || {};
    uniqueParties().forEach(function (p) {
      if (p.members.length < 2) return;
      if (p.members.some(function (g) { return isHost(g) || lock[g.id]; })) return;
      var tables = {};
      p.members.forEach(function (g) {
        var n = assign[g.id] || 0;
        tables[n] = (tables[n] || 0) + 1;
      });
      var occupied = Object.keys(tables).map(Number).filter(function (n) { return n > 0; });
      if (occupied.length <= 1 && !tables[0]) return;
      var dest = 0;
      occupied.sort(function (a, b) { return tables[b] - tables[a]; });
      var i;
      for (i = 0; i < occupied.length; i++) {
        var t = occupied[i];
        if (countAt(t) - tables[t] + p.members.length <= SIGN_CAP) {
          dest = t;
          break;
        }
      }
      if (!dest) dest = firstTableWithRoom(p.members.length);
      if (!dest) return;
      p.members.forEach(function (g) {
        assign[g.id] = dest;
        delete place[g.id];
      });
    });
  }

  function drainOverflow(lock) {
    lock = lock || {};
    var t;
    for (t = 1; t <= TABLE_MAX; t++) {
      var guard = 0;
      while (countAt(t) > SIGN_CAP && guard < 40) {
        guard += 1;
        var here = uniqueParties().filter(function (p) {
          return p.members.every(function (g) { return assign[g.id] === t; }) &&
            !p.members.some(function (g) { return isHost(g) || lock[g.id]; });
        });
        here.sort(function (a, b) { return a.members.length - b.members.length; });
        var moved = false;
        var skip = {};
        skip[t] = true;
        var i;
        for (i = 0; i < here.length; i++) {
          var p = here[i];
          var dest = firstTableWithRoom(p.members.length, skip);
          if (!dest || dest === t) continue;
          if (countAt(dest) + p.members.length > SIGN_CAP) continue;
          p.members.forEach(function (g) {
            assign[g.id] = dest;
            delete place[g.id];
          });
          moved = true;
          break;
        }
        if (!moved) {
          var extras = guests.filter(function (g) {
            return assign[g.id] === t && !isHost(g) && !lock[g.id];
          });
          extras.sort(function (a, b) {
            return partyMembers(partyId(a)).length - partyMembers(partyId(b)).length;
          });
          var j;
          for (j = 0; j < extras.length; j++) {
            var destOne = firstTableWithRoom(1, skip);
            if (!destOne || destOne === t) continue;
            assign[extras[j].id] = destOne;
            delete place[extras[j].id];
            moved = true;
            break;
          }
        }
        if (!moved) break;
      }
    }
  }

  function seatUnassigned() {
    uniqueParties(guests.filter(function (g) { return !assign[g.id]; })).forEach(function (p) {
      var n = firstTableWithRoom(p.members.length);
      if (!n) return;
      p.members.forEach(function (g) { assign[g.id] = n; });
    });
  }

  function placeHead() {
    HEAD_SLOTS.forEach(function (slot) {
      putSeat(slot[0], slot[1], slot[2]);
    });
  }

  function knownIds(ids) {
    return ids.filter(function (id) {
      return guests.some(function (g) { return g.id === id; });
    });
  }

  function groupTable(ids) {
    var tables = {};
    ids.forEach(function (id) {
      var n = assign[id];
      if (n) tables[n] = (tables[n] || 0) + 1;
    });
    var keys = Object.keys(tables).map(Number);
    if (keys.length === 1 && tables[keys[0]] === ids.length) return keys[0];
    return 0;
  }

  function seatKinGroup(ids, skip, prefer) {
    ids = knownIds(ids);
    if (!ids.length) return 0;
    skip = skip || { 7: true, 8: true };
    var together = groupTable(ids);
    if (together && !skip[together] && (!prefer || together === prefer)) return together;
    var dest = prefer && !skip[prefer] ? prefer : 0;
    if (!dest) {
      var votes = {};
      ids.forEach(function (id) {
        var n = assign[id];
        if (n && !skip[n]) votes[n] = (votes[n] || 0) + 1;
      });
      Object.keys(votes).forEach(function (raw) {
        var n = parseInt(raw, 10);
        var foreign = countAt(n) - votes[n];
        if (foreign + ids.length <= SIGN_CAP && (!dest || votes[n] > votes[dest])) dest = n;
      });
    }
    if (!dest) {
      var t;
      for (t = 1; t <= TABLE_MAX; t++) {
        if (skip[t]) continue;
        var foreign = 0;
        guests.forEach(function (g) {
          if (assign[g.id] === t && ids.indexOf(g.id) < 0) foreign += 1;
        });
        if (foreign === 0) {
          dest = t;
          break;
        }
      }
    }
    if (!dest) dest = firstTableWithRoom(ids.length, skip);
    if (!dest) dest = prefer || 0;
    if (!dest) return 0;
    guests.forEach(function (g) {
      if (assign[g.id] !== dest || ids.indexOf(g.id) >= 0) return;
      if (isHost(g) || headIds()[g.id]) return;
      partyMembers(partyId(g)).forEach(function (m) {
        delete assign[m.id];
        delete place[m.id];
      });
    });
    ids.forEach(function (id) {
      assign[id] = dest;
      delete place[id];
    });
    arrangeFacing(dest, headIds());
    return dest;
  }

  function seatKinGroups() {
    var skip = { 7: true, 8: true };
    KIN_GROUPS.forEach(function (g) {
      var n = seatKinGroup(g.ids, skip, g.prefer);
      if (n) skip[n] = true;
    });
    seatUnassigned();
    drainOverflow(headIds());
    seatAllChairs();
  }

  function applyPlaceholders() {
    assign = {};
    place = {};
    var locked = headIds();
    var grouped = {};
    var skip = { 7: true, 8: true };
    KIN_GROUPS.forEach(function (g) {
      var list = knownIds(g.ids);
      list.forEach(function (id) { grouped[id] = true; });
      var t = g.prefer && !skip[g.prefer] ? g.prefer : firstTableWithRoom(list.length, skip);
      list.forEach(function (id) { assign[id] = t; });
      skip[t] = true;
    });
    var rest = uniqueParties().filter(function (p) {
      return !p.members.some(function (g) { return locked[g.id] || grouped[g.id]; });
    });
    var weight = {};
    guests.forEach(function (g) {
      lastTokens(guestLast(g)).forEach(function (t) { weight[t] = (weight[t] || 0) + 1; });
    });
    rest.sort(function (a, b) {
      function key(p) {
        var tokens = partyTokens(p);
        tokens.sort(function (x, y) {
          return (weight[y] || 0) - (weight[x] || 0) || x.localeCompare(y);
        });
        return tokens[0] || p.label.toLowerCase();
      }
      return key(a).localeCompare(key(b)) || a.label.localeCompare(b.label);
    });
    packParties(rest, 1, skip);
    placeHead();
    seatUnassigned();
    reuniteParties(locked);
    drainOverflow(locked);
    seatAllChairs(locked);
    persistAssign();
  }

  function partyId(g) {
    return g.party || g.id;
  }

  function partyLabel(g) {
    return g.partyLabel || g.name;
  }

  function partyMembers(pid) {
    return guests.filter(function (g) { return partyId(g) === pid; });
  }

  function uniqueParties(list) {
    var source = list || guests;
    var seen = {};
    var out = [];
    source.forEach(function (g) {
      var id = partyId(g);
      if (seen[id]) return;
      seen[id] = true;
      var all = partyMembers(id);
      var members = list
        ? all.filter(function (m) {
            return source.some(function (x) { return x.id === m.id; });
          })
        : all;
      if (!members.length) return;
      out.push({
        id: id,
        label: members.length === all.length
          ? partyLabel(members[0])
          : members.map(function (m) { return m.name; }).join(' & '),
        members: members,
        diet: members.some(function (m) { return m.diet; })
      });
    });
    return out;
  }

  function lastSortKey(p) {
    var weight = {};
    guests.forEach(function (g) {
      lastTokens(guestLast(g)).forEach(function (t) { weight[t] = (weight[t] || 0) + 1; });
    });
    var tokens = [];
    (p.members || []).forEach(function (g) {
      lastTokens(guestLast(g)).forEach(function (t) { tokens.push(t); });
    });
    var shared = tokens.filter(function (t) { return (weight[t] || 0) > 1; });
    var pool = shared.length ? shared : lastTokens(guestLast((p.members || [])[0]));
    pool.sort(function (a, b) {
      return (weight[b] || 0) - (weight[a] || 0) || a.localeCompare(b);
    });
    return pool[0] || (p.label || '').toLowerCase();
  }

  function isHost(g) {
    return g && (g.id === 'allison-fong' || g.id === 'skylar-dann');
  }

  function tableMap() {
    var by = {};
    guests.forEach(function (g) {
      if (isHost(g)) return;
      var n = parseInt(assign[g.id], 10);
      if (!n || n < 1 || n > TABLE_MAX) return;
      if (!by[n]) by[n] = { n: n, guests: [] };
      by[n].guests.push({
        label: g.name,
        last: (guestLast(g) || g.name || '').toLowerCase()
      });
    });
    return by;
  }

  function allTables() {
    var by = tableMap();
    var out = [];
    for (var i = 1; i <= TABLE_MAX; i++) out.push(by[i] || { n: i, guests: [] });
    return out;
  }

  function currentSeats() {
    return allTables().filter(function (t) { return t.guests.length; });
  }

  function setParty(pid, n) {
    clearWiped();
    partyMembers(pid).forEach(function (g) {
      if (!n) {
        delete assign[g.id];
        delete place[g.id];
      } else assign[g.id] = n;
    });
    if (n) arrangeFacing(n);
    saveAssign();
    renderAssign();
    renderAllSoon();
  }

  function seatWithKin(pid, n) {
    clearWiped();
    var p = uniqueParties().filter(function (x) { return x.id === pid; })[0];
    if (!p || !n) {
      setParty(pid, n);
      return;
    }
    packParties(kinOf(p), n);
    selectedTable = n;
    saveAssign();
    renderAssign();
    renderAllSoon();
  }

  function placeMembers(members, n, start) {
    var mine = members.filter(function (g) { return assign[g.id] === n; });
    var taken = {};
    guests.forEach(function (g) {
      if (assign[g.id] !== n) return;
      if (mine.some(function (m) { return m.id === g.id; })) return;
      var s = seatOf(g.id);
      if (s >= 0) taken[s] = true;
    });
    var order = mine.some(isHost) ? alongOrder(start) : acrossOrder(start);
    var oi = 0;
    mine.forEach(function (g) {
      while (oi < order.length && taken[order[oi]]) oi += 1;
      if (oi < order.length) {
        place[g.id] = order[oi];
        taken[order[oi]] = true;
        oi += 1;
      } else delete place[g.id];
    });
  }

  function seatPartyAt(pid, n, start, leadId) {
    clearWiped();
    var p = uniqueParties().filter(function (x) { return x.id === pid; })[0];
    if (!p || !n) {
      setParty(pid, n);
      return;
    }
    var members = p.members.slice();
    if (leadId) {
      members.sort(function (a, b) {
        if (a.id === leadId) return -1;
        if (b.id === leadId) return 1;
        return 0;
      });
    }
    if (members.some(isHost)) {
      members.forEach(function (g) { assign[g.id] = n; });
      placeMembers(members, n, start);
      var hostLock = {};
      members.forEach(function (g) { hostLock[g.id] = true; });
      arrangeFacing(n, hostLock);
      selectedTable = n;
      saveAssign();
      renderAssign();
      renderAllSoon();
      return;
    }
    packParties(kinOf(p), n);
    placeMembers(members, n, start);
    var lock = {};
    members.forEach(function (g) { lock[g.id] = true; });
    arrangeFacing(n, lock);
    saveAssign();
    renderAssign();
    renderAllSoon();
  }

  function swapSigns(a, b) {
    clearWiped();
    a = parseInt(a, 10);
    b = parseInt(b, 10);
    if (!a || !b || a === b) return;
    guests.forEach(function (g) {
      if (assign[g.id] === a) assign[g.id] = b;
      else if (assign[g.id] === b) assign[g.id] = a;
    });
    selectedTable = b;
    saveAssign();
    renderAssign();
    renderAllSoon();
  }

  function moveGuest(id, n, s) {
    clearWiped();
    var g = guests.filter(function (x) { return x.id === id; })[0];
    if (!g) return;
    if (!n) {
      delete assign[id];
      delete place[id];
      saveAssign();
      renderAssign();
      renderAllSoon();
      return;
    }
    var prevN = assign[id];
    var prevS = seatOf(id);
    var occ = (s >= 0) ? whoAt(n, s) : null;
    assign[id] = n;
    if (occ && occ.id !== id) {
      if (prevN && prevS >= 0) {
        assign[occ.id] = prevN;
        place[occ.id] = prevS;
      } else {
        var bump = -1;
        for (var i = 0; i < SIGN_CAP; i++) {
          if (i !== s && !whoAt(n, i)) { bump = i; break; }
        }
        if (bump >= 0) place[occ.id] = bump;
        else delete place[occ.id];
      }
    }
    if (s >= 0) place[id] = s;
    else fillSeats(n);
    if (prevN && prevN !== n) fillSeats(prevN);
    fillSeats(n);
    saveAssign();
    renderAssign();
    renderAllSoon();
  }

  var drag = null;

  function dragPoint(e) {
    var el = document.elementFromPoint(e.clientX, e.clientY);
    if (el && el.closest && el.closest('.gchip-ghost, .chair-ghost, .psign-ghost')) {
      el = document.elementsFromPoint(e.clientX, e.clientY).filter(function (node) {
        return !node.closest || !node.closest('.gchip-ghost, .chair-ghost, .psign-ghost');
      })[0];
    }
    if (!el) return {};
    var chair = el.closest('.chair');
    var atbl = el.closest('.atbl');
    var age = el.closest('.agebar button');
    var pool = el.closest('#unassigned');
    var n = chair ? parseInt(chair.getAttribute('data-n'), 10)
      : atbl ? parseInt(atbl.getAttribute('data-n'), 10)
      : age ? parseInt(age.getAttribute('data-n'), 10)
      : 0;
    var s = chair && chair.hasAttribute('data-s') ? parseInt(chair.getAttribute('data-s'), 10) : -1;
    return {
      n: n,
      s: s,
      pool: !!pool,
      atbl: atbl,
      chair: chair,
      age: age,
      poolEl: pool
    };
  }

  function clearDrops() {
    document.querySelectorAll('.drop').forEach(function (el) { el.classList.remove('drop'); });
  }

  function endDrag() {
    if (!drag) return;
    if (drag.ghost) drag.ghost.remove();
    if (drag.chip) drag.chip.classList.remove('dragging');
    if (drag.sign) drag.sign.classList.remove('dragging');
    clearDrops();
    drag = null;
  }

  function guestChip(g, seated, p) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'gchip' + (isHost(g) ? ' host' : '');
    b.textContent = g.name;
    b.title = seated
      ? g.name + ' · drag to a chair or click to unseat'
      : g.name + (p.members.length === 2 && !p.members.some(isHost)
        ? ' · drop on a chair, partner sits across'
        : ' · drop on a chair');
    if (g.diet) b.title += ' · ' + g.diet;
    b.addEventListener('pointerdown', function (e) {
      if (e.button) return;
      e.stopPropagation();
      endDrag();
      drag = {
        pid: p.id,
        gid: g.id,
        seated: seated,
        chip: b,
        x: e.clientX,
        y: e.clientY,
        moved: false,
        ghost: null
      };
      try { b.setPointerCapture(e.pointerId); } catch (err) {}
    });
    b.addEventListener('pointermove', function (e) {
      if (!drag || drag.gid !== g.id || drag.kind === 'table') return;
      if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 7) return;
      if (!drag.moved) {
        drag.moved = true;
        var ghost = b.cloneNode(true);
        ghost.className = b.className + ' gchip-ghost';
        ghost.style.width = b.offsetWidth + 'px';
        document.body.appendChild(ghost);
        drag.ghost = ghost;
        b.classList.add('dragging');
      }
      drag.ghost.style.left = (e.clientX + 10) + 'px';
      drag.ghost.style.top = (e.clientY - 14) + 'px';
    });
    b.addEventListener('pointerup', function (e) {
      if (!drag || drag.gid !== g.id || drag.kind === 'table') return;
      var moved = drag.moved;
      var pid = drag.pid;
      var gid = drag.gid;
      var wasSeated = drag.seated;
      var hit = moved ? dragPoint(e) : {};
      endDrag();
      if (moved) {
        if (wasSeated) {
          if (hit.s >= 0 && hit.n) moveGuest(gid, hit.n, hit.s);
          else if (hit.n) moveGuest(gid, hit.n, -1);
          else if (hit.pool) moveGuest(gid, 0, -1);
        } else if (hit.s >= 0 && hit.n) seatPartyAt(pid, hit.n, hit.s, gid);
        else if (hit.n) seatWithKin(pid, hit.n);
        return;
      }
      if (wasSeated) moveGuest(gid, 0, -1);
      else seatWithKin(pid, selectedTable);
    });
    b.addEventListener('click', function (e) { e.stopPropagation(); });
    b.addEventListener('pointercancel', endDrag);
    return b;
  }

  function pairLink() {
    var bar = document.createElement('span');
    bar.className = 'pair-link';
    bar.setAttribute('aria-hidden', 'true');
    return bar;
  }

  function partyBlock(p, seated) {
    if (p.members.length === 1) return guestChip(p.members[0], seated, p);
    if (p.members.length === 2) {
      var pair = document.createElement('div');
      pair.className = 'pair' + (p.members.some(isHost) ? ' along' : '');
      pair.appendChild(guestChip(p.members[0], seated, p));
      pair.appendChild(pairLink());
      pair.appendChild(guestChip(p.members[1], seated, p));
      return pair;
    }
    var group = document.createElement('div');
    group.className = 'party-group';
    p.members.forEach(function (g) {
      group.appendChild(guestChip(g, seated, p));
    });
    return group;
  }

  function bindTableDrag(handle, box, n) {
    handle.addEventListener('pointerdown', function (e) {
      if (e.button) return;
      e.preventDefault();
      e.stopPropagation();
      endDrag();
      drag = {
        kind: 'table',
        from: n,
        sign: box,
        x: e.clientX,
        y: e.clientY,
        moved: false,
        ghost: null
      };
      try { handle.setPointerCapture(e.pointerId); } catch (err) {}
    });
    handle.addEventListener('pointermove', function (e) {
      if (!drag || drag.kind !== 'table' || drag.from !== n) return;
      e.stopPropagation();
      if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 7) return;
      if (!drag.moved) {
        drag.moved = true;
        var ghost = document.createElement('div');
        ghost.className = 'psign-ghost';
        ghost.textContent = pad(n);
        document.body.appendChild(ghost);
        drag.ghost = ghost;
        box.classList.add('dragging');
      }
      drag.ghost.style.left = (e.clientX + 10) + 'px';
      drag.ghost.style.top = (e.clientY - 14) + 'px';
    });
    handle.addEventListener('pointerup', function (e) {
      if (!drag || drag.kind !== 'table' || drag.from !== n) return;
      e.stopPropagation();
      var moved = drag.moved;
      var from = drag.from;
      var hit = moved ? dragPoint(e) : {};
      endDrag();
      if (moved && hit.n && hit.n !== from) swapSigns(from, hit.n);
    });
    handle.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); });
    handle.addEventListener('pointercancel', endDrag);
  }

  function dropPicked(n, s) {
    if (!pickedId) return;
    var id = pickedId;
    pickedId = '';
    moveGuest(id, n, s);
  }

  function bindGuestDrag(el, g, n, s) {
    el.addEventListener('pointerdown', function (e) {
      if (e.button) return;
      e.preventDefault();
      e.stopPropagation();
      endDrag();
      drag = {
        kind: 'person',
        gid: g.id,
        n: n,
        s: s,
        seated: true,
        chip: el,
        x: e.clientX,
        y: e.clientY,
        moved: false,
        ghost: null
      };
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
    });
    el.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
    });
  }

  function bindEmptyChair(el, n, s) {
    el.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    el.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (pickedId) dropPicked(n, s);
    });
  }

  function makeChair(n, s) {
    var g = whoAt(n, s);
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chair' + (g ? ' filled' : ' empty') + (g && isHost(g) ? ' host' : '');
    btn.setAttribute('data-n', String(n));
    btn.setAttribute('data-s', String(s));
    if (g) {
      btn.textContent = chairLabel(g);
      btn.title = g.name + (g.diet ? ' · ' + g.diet : '') + ' · click to pick up, or drag';
      bindGuestDrag(btn, g, n, s);
    } else {
      btn.title = pickedId ? 'Drop here' : 'Empty chair';
      bindEmptyChair(btn, n, s);
    }
    return btn;
  }

  function tickPersonDrag(e) {
    if (!drag || drag.kind !== 'person') return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
    if (!drag.moved) {
      drag.moved = true;
      if (drag.chip) {
        var ghost = drag.chip.cloneNode(true);
        ghost.classList.add('chair-ghost');
        ghost.style.width = drag.chip.offsetWidth + 'px';
        document.body.appendChild(ghost);
        drag.ghost = ghost;
        drag.chip.classList.add('dragging');
      }
    }
    if (drag.ghost) {
      drag.ghost.style.left = (e.clientX + 10) + 'px';
      drag.ghost.style.top = (e.clientY - 14) + 'px';
    }
  }

  function dropPersonDrag(e) {
    if (!drag || drag.kind !== 'person') return;
    var moved = drag.moved;
    var gid = drag.gid;
    var fromN = drag.n;
    var fromS = drag.s;
    var hit = moved ? dragPoint(e) : {};
    endDrag();
    if (moved) {
      pickedId = '';
      if (hit.s >= 0 && hit.n) moveGuest(gid, hit.n, hit.s);
      else if (hit.n) moveGuest(gid, hit.n, -1);
      else if (hit.pool) moveGuest(gid, 0, -1);
      return;
    }
    if (pickedId && pickedId !== gid) {
      dropPicked(fromN, fromS);
      return;
    }
    pickedId = pickedId === gid ? '' : gid;
    renderAssign();
  }

  function filterChips() {
    var input = document.getElementById('planner-q');
    var q = input ? input.value.trim().toLowerCase() : '';
    document.querySelectorAll('.pair, .party-group, #unassigned > .gchip, .seat-overflow > .gchip').forEach(function (el) {
      if (el.classList.contains('gchip-ghost')) return;
      el.classList.toggle('miss', !!(q && el.textContent.toLowerCase().indexOf(q) === -1));
    });
  }

  function renderAssign() {
    var bar = document.getElementById('agebar');
    var pool = document.getElementById('unassigned');
    var count = document.getElementById('unassigned-count');
    var boxes = document.getElementById('assigned-tables');
    var note = document.getElementById('rsvpnote');
    var stats = document.getElementById('planner-stats');
    if (!pool || !boxes) return;

    var tFill;
    for (tFill = 1; tFill <= TABLE_MAX; tFill++) fillSeats(tFill);

    var seatedN = 0;
    var over = 0;
    guests.forEach(function (g) { if (assign[g.id]) seatedN += 1; });
    for (var s = 1; s <= TABLE_MAX; s++) {
      if (countAt(s) > SIGN_CAP) over += 1;
    }
    var parties = uniqueParties();
    var waiting = 0;
    guests.forEach(function (g) { if (!assign[g.id]) waiting += 1; });
    if (note) {
      note.textContent = guests.length + ' attending · ' + parties.length + ' parties · ' +
        seatedN + ' seated. Couples sit across. You two sit together on this side.';
    }
    if (stats) {
      stats.innerHTML = '<b>' + seatedN + '</b> seated<span class="dot">·</span><b>' + waiting + '</b> waiting' +
        (over ? '<span class="dot">·</span><b class="over">' + over + ' over full</b>' : '');
    }

    if (bar) {
      bar.innerHTML = '';
      var used = {};
      guests.forEach(function (g) { if (assign[g.id]) used[assign[g.id]] = true; });
      for (var i = 1; i <= TABLE_MAX; i++) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = pad(i);
        btn.setAttribute('data-n', String(i));
        if (selectedTable === i) btn.classList.add('on');
        if (used[i]) btn.classList.add('has');
        btn.addEventListener('click', function (n) {
          return function () { selectedTable = n; renderAssign(); };
        }(i));
        bar.appendChild(btn);
      }
    }

    pool.innerHTML = '';
    var open = uniqueParties(guests.filter(function (g) { return !assign[g.id]; }));
    open.sort(function (a, b) {
      return (a.members[0].last || a.label).localeCompare(b.members[0].last || b.label);
    });
    if (count) count.textContent = String(waiting);
    open.forEach(function (p) { pool.appendChild(partyBlock(p, false)); });

    boxes.innerHTML = '';
    boxes.className = 'planner-longs';
    var all = allTables();
    for (var r = 0; r < 3; r++) {
      var block = document.createElement('div');
      block.className = 'along';
      var rowPeople = 0;
      var slice = all.slice(r * ROW_LEN, r * ROW_LEN + ROW_LEN);
      slice.forEach(function (t) {
        guests.forEach(function (g) { if (assign[g.id] === t.n) rowPeople += 1; });
      });
      var head = document.createElement('div');
      head.className = 'along-head';
      var title = document.createElement('h4');
      var a = r * ROW_LEN + 1;
      title.textContent = 'Long table ' + (r + 1);
      var meta = document.createElement('span');
      meta.textContent = pad(a) + '–' + pad(a + 4) + ' · ' + rowPeople + ' people · couples sit across' +
        (r === 1 ? ' · you two, this side' : '');
      head.appendChild(title);
      head.appendChild(meta);
      block.appendChild(head);
      var grid = document.createElement('div');
      grid.className = 'planner-plank';
      slice.forEach(function (t) {
        var nHere = countAt(t.n);
        var hostsHere = false;
        guests.forEach(function (g) {
          if (assign[g.id] === t.n && isHost(g)) hostsHere = true;
        });
        var box = document.createElement('div');
        box.className = 'atbl psign'
          + (nHere > SIGN_CAP ? ' packed' : '')
          + (!nHere ? ' empty' : '')
          + (hostsHere ? ' us' : '');
        box.setAttribute('data-n', String(t.n));
        var top = document.createElement('div');
        top.className = 'psign-top';
        var h = document.createElement('b');
        h.className = 'psign-num';
        h.textContent = pad(t.n);
        var meta = document.createElement('div');
        meta.className = 'psign-top-meta';
        var cap = document.createElement('span');
        cap.textContent = nHere + ' / ' + SIGN_CAP + (hostsHere ? ' · you' : '');
        var grip = document.createElement('button');
        grip.type = 'button';
        grip.className = 'psign-move';
        grip.title = 'Drag to swap this whole table';
        grip.setAttribute('aria-label', 'Move table ' + pad(t.n));
        grip.innerHTML = '<i></i><i></i>';
        meta.appendChild(cap);
        meta.appendChild(grip);
        top.appendChild(h);
        top.appendChild(meta);
        box.appendChild(top);
        bindTableDrag(grip, box, t.n);
        var map = document.createElement('div');
        map.className = 'seatmap';
        var far = document.createElement('div');
        far.className = 'seat-row';
        far.appendChild(makeChair(t.n, 0));
        far.appendChild(makeChair(t.n, 1));
        far.appendChild(makeChair(t.n, 2));
        var board = document.createElement('div');
        board.className = 'seat-board';
        var near = document.createElement('div');
        near.className = 'seat-row';
        near.appendChild(makeChair(t.n, 3));
        near.appendChild(makeChair(t.n, 4));
        near.appendChild(makeChair(t.n, 5));
        map.appendChild(far);
        map.appendChild(board);
        map.appendChild(near);
        box.appendChild(map);
        var extra = guests.filter(function (g) {
          return assign[g.id] === t.n && seatOf(g.id) < 0;
        });
        if (extra.length) {
          var overflow = document.createElement('div');
          overflow.className = 'seat-overflow';
          uniqueParties(extra).forEach(function (p) {
            overflow.appendChild(partyBlock(p, true));
          });
          box.appendChild(overflow);
        }
        grid.appendChild(box);
      });
      block.appendChild(grid);
      boxes.appendChild(block);
    }
    filterChips();
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

  function applyColor() {
    var gh = G[ground].hex, fg = T[text].hex;
    document.querySelectorAll('[data-g]').forEach(function (el) {
      el.style.background = gh;
      el.style.color = fg;
    });
    document.querySelectorAll('[data-fg]').forEach(function (el) { el.style.color = fg; });
    var band = ground === 'mustard' ? '#1E1D1A' : (ground === 'ink' ? '#E7E3DA' : '#BFA52B');
    var onBand = ratio(band, '#F4F1EA') > ratio(band, '#1E1D1A') ? '#F4F1EA' : '#1E1D1A';
    document.querySelectorAll('[data-band]').forEach(function (el) {
      el.style.background = band;
      el.style.color = onBand;
    });
    var r = ratio(gh, fg);
    var w = document.getElementById('warn');
    var t = document.getElementById('warntxt');
    if (w && t) {
      if (r < 4.5) {
        w.classList.add('show');
        t.textContent = T[text].name + ' on ' + G[ground].name + ' is ' + r.toFixed(1) + ':1.';
      } else {
        w.classList.remove('show');
      }
    }
    summarise();
  }

  function applyType() {
    var nf = document.getElementById('nf');
    var df = document.getElementById('df');
    if (!nf || !df) return;
    if (window.WeddingFonts) {
      window.WeddingFonts.ensure(nf.value);
      window.WeddingFonts.ensure(df.value);
    }
    var n = NF[nf.value] || NF.instrument;
    var d = DF[df.value] || DF.robotomono;
    var r = document.documentElement.style;
    r.setProperty('--nmfont', n.f);
    r.setProperty('--nmwt', String(n.wt));
    r.setProperty('--nmtrk', n.trk);
    r.setProperty('--nmscale', String(n.s));
    r.setProperty('--detfont', d.f);
    r.setProperty('--detwt', String(d.wt));
    r.setProperty('--dettrk', d.t1);
    r.setProperty('--dettrk2', d.t2);
    summarise();
  }

  function applyPaper() {
    document.querySelectorAll('.frame').forEach(function (el) {
      el.classList.add('size-24');
      el.classList.remove('size-18');
    });
    summarise();
  }

  function ruleLabel(n) {
    if (n <= 0.5) return 'hairline';
    if (n <= 0.8) return 'thin';
    if (n <= 1.2) return 'regular';
    return 'heavy';
  }

  function nearestPreset(n) {
    var presets = [0.4, 0.65, 1, 1.5];
    var best = presets[0];
    var dist = Math.abs(n - best);
    presets.forEach(function (p) {
      var d = Math.abs(n - p);
      if (d < dist) { best = p; dist = d; }
    });
    return dist <= 0.08 ? best : null;
  }

  function applyRule(n, fromPreset) {
    if (n == null || isNaN(n)) n = rule;
    n = Math.round(Math.min(2, Math.max(0.25, n)) * 20) / 20;
    rule = n;
    document.documentElement.style.setProperty('--rule', n + 'px');
    document.documentElement.style.setProperty('--rule-scale', String(n));
    var slider = document.getElementById('rule');
    var out = document.getElementById('rule-out');
    if (slider && slider.value !== String(n)) slider.value = String(n);
    if (out) out.textContent = n.toFixed(2) + ' px';
    var match = fromPreset != null ? fromPreset : nearestPreset(n);
    document.querySelectorAll('#rule-presets button').forEach(function (b) {
      b.classList.toggle('on', parseFloat(b.getAttribute('data-rule')) === match);
    });
    try { localStorage.setItem(RULE_KEY, String(n)); } catch (e) {}
    summarise();
  }

  function applyRuleStyle(style, skipPair) {
    if (style !== 'dash' && style !== 'dot') style = 'solid';
    if (!skipPair && style === 'dot' && spineStyle === 'dot') applySpineStyle('solid', true);
    ruleStyle = style;
    var root = document.documentElement;
    root.classList.remove('is-rule-solid', 'is-rule-dash', 'is-rule-dot');
    root.classList.add('is-rule-' + style);
    document.querySelectorAll('#rule-style button').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-style') === style);
    });
    try { localStorage.setItem(STYLE_KEY, style); } catch (e) {}
    summarise();
  }

  function applyLeadSit(sit) {
    if (sit !== 'top' && sit !== 'mid') sit = 'bot';
    leadSit = sit;
    var root = document.documentElement;
    root.classList.remove('is-lead-top', 'is-lead-mid', 'is-lead-bot');
    root.classList.add('is-lead-' + sit);
    document.querySelectorAll('#lead-sit button').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-sit') === sit);
    });
    try { localStorage.setItem(SIT_KEY, sit); } catch (e) {}
    summarise();
  }

  function applySpineStyle(style, skipPair) {
    if (style !== 'dash' && style !== 'dot') style = 'solid';
    if (!skipPair && style === 'dot' && ruleStyle === 'dot') applyRuleStyle('solid', true);
    spineStyle = style;
    var root = document.documentElement;
    root.classList.remove('is-spine-solid', 'is-spine-dash', 'is-spine-dot');
    root.classList.add('is-spine-' + style);
    document.querySelectorAll('#spine-style button').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-spine') === style);
    });
    try { localStorage.setItem(SPINE_KEY, style); } catch (e) {}
    summarise();
  }

  function loadRule() {
    try {
      var raw = parseFloat(localStorage.getItem(RULE_KEY));
      if (!isNaN(raw)) rule = raw;
    } catch (e) {}
    applyRule(rule);
    try {
      var st = localStorage.getItem(STYLE_KEY);
      if (st) ruleStyle = st;
    } catch (e) {}
    try {
      var sp = localStorage.getItem(SPINE_KEY);
      if (sp) spineStyle = sp;
    } catch (e) {}
    if (ruleStyle === 'dot' && spineStyle === 'dot') spineStyle = 'solid';
    applyRuleStyle(ruleStyle, true);
    applySpineStyle(spineStyle, true);
    try {
      var sit = localStorage.getItem(SIT_KEY);
      if (sit) leadSit = sit;
    } catch (e) {}
    applyLeadSit(leadSit);
  }

  function copy() {
    return {
      head: (document.getElementById('headline') || {}).value || 'Find your table',
      kicker: '',
      a: (document.getElementById('n1') || {}).value || 'Allison',
      b: (document.getElementById('n2') || {}).value || 'Skylar',
      where: (document.getElementById('where') || {}).value || 'Ruth Bancroft Garden'
    };
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function tableLines(t) {
    return (t.guests || []).map(function (g) { return typeof g === 'string' ? g : g.label; });
  }

  function coupleChunks(name) {
    var i = name.lastIndexOf(' & ');
    if (i === -1) return [name];
    return [name.slice(0, i), '& ' + name.slice(i + 3)];
  }

  function fillNames(host, names, kind) {
    if (!names.length) {
      host.appendChild(el('div', 'tg mute', ''));
      return;
    }
    names.forEach(function (name) {
      var party = el('div', 'party');
      coupleChunks(name).forEach(function (part) {
        party.appendChild(el('div', 'tg', part));
      });
      host.appendChild(party);
    });
  }

  function addMast(sign, c, kind) {
    if (kind === 'none') return;
    if (kind === 's2') {
      var s2 = el('div', 's2');
      s2.appendChild(el('div', 'display', c.head));
      sign.appendChild(s2);
      return;
    }
    if (kind === 'invite') {
      sign.appendChild(el('div', 'display k-top', c.head));
      return;
    }
    if (kind === 'tall') {
      var tall = el('div', 'mast tall');
      tall.appendChild(el('div', 'k', c.head));
      sign.appendChild(tall);
      return;
    }
    if (kind === 'band') {
      var band = el('div', 'band');
      band.setAttribute('data-band', '');
      band.appendChild(el('div', 'display', c.head));
      sign.appendChild(band);
      return;
    }
    var mast = el('div', 'mast tight');
    mast.appendChild(el('div', (kind === 'plain' || kind === 'default') ? 'k' : 'display', c.head));
    sign.appendChild(mast);
  }

  function addSpine(sign, c, side) {
    sign.classList.add('row-sign');
    var sp = el('div', 'spine');
    var rule = el('div', 'spine-rule');
    var slot = el('div', 'vert-slot');
    var lab = el('div', 'k vert', c.head.toUpperCase());
    slot.appendChild(lab);
    if (side === 'right') {
      sp.appendChild(rule);
      sp.appendChild(slot);
    } else {
      sp.appendChild(slot);
      sp.appendChild(rule);
    }
    return sp;
  }

  function signSeat(t, kind) {
    var box = el('div', 'sign-seat' + (kind ? ' ' + kind : ''));
    box.appendChild(el('div', 'tnum', pad(t.n)));
    var g = el('div', 'tguests');
    fillNames(g, tableLines(t), kind);
    box.appendChild(g);
    return box;
  }

  function addRoom(host, tables, opts) {
    opts = opts || {};
    var room = el('div', 'room planks'
      + (opts.bare ? ' bare' : '')
      + (opts.loud ? ' loud' : '')
      + (opts.jog ? ' jog' : '')
      + (opts.tight ? ' tight' : ''));
    for (var r = 0; r < 3; r++) {
      var plank = el('div', 'plank');
      if (!opts.hideHead) {
        var head = el('div', 'plank-head');
        var a = r * ROW_LEN + 1;
        head.appendChild(el('div', 'row-lbl', 'Long table ' + (r + 1)));
        head.appendChild(el('div', 'row-lbl', pad(a) + '–' + pad(a + 4)));
        plank.appendChild(head);
      }
      var seats = el('div', 'plank-signs');
      tables.slice(r * ROW_LEN, r * ROW_LEN + ROW_LEN).forEach(function (t) {
        seats.appendChild(signSeat(t, opts.kind || ''));
      });
      plank.appendChild(seats);
      room.appendChild(plank);
    }
    host.appendChild(room);
  }

  function seatedRows(tables) {
    var seated = [];
    tables.forEach(function (t) {
      (t.guests || []).forEach(function (g) {
        var label = typeof g === 'string' ? g : g.label;
        var last = typeof g === 'string' ? g : (g.last || label);
        seated.push({ label: label, n: t.n, sort: last });
      });
    });
    seated.sort(function (a, b) {
      return a.sort.localeCompare(b.sort) || a.label.localeCompare(b.label);
    });
    return seated;
  }

  function displayLast(sort) {
    var s = String(sort || '').trim();
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function givenOf(label, last) {
    var raw = String(last || '').trim();
    if (!raw) return label;
    var escaped = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var out = String(label || '').replace(new RegExp('\\s+' + escaped + '\\b', 'i'), '');
    out = out.replace(/\s{2,}/g, ' ').replace(/\s+&\s+/g, ' & ').trim();
    return out || label;
  }

  function firstLetter(item) {
    return ((item && (item.sort || item.label)) || '').charAt(0).toUpperCase();
  }

  function alphaColumns(seated, cols, opts) {
    opts = opts || {};
    if (cols <= 1 || !seated.length) return [seated];
    if (opts.letters && !opts.lead) {
      var weights = [];
      var letter = '';
      var total = 0;
      seated.forEach(function (item) {
        var L = firstLetter(item);
        var w = 1;
        if (L && L !== letter) {
          letter = L;
          w += 1.6;
        }
        weights.push(w);
        total += w;
      });
      var cuts = [];
      var run = 0;
      var next = 1;
      for (var i = 0; i < seated.length && next < cols; i++) {
        run += weights[i];
        if (run >= total * next / cols) {
          cuts.push(i + 1);
          next += 1;
        }
      }
      var out = [];
      var start = 0;
      cuts.concat([seated.length]).forEach(function (end) {
        out.push(seated.slice(start, end));
        start = end;
      });
      return out;
    }
    var per = Math.ceil(seated.length / cols) || 1;
    var out = [];
    for (var i = 0; i < cols; i++) out.push(seated.slice(i * per, i * per + per));
    return out;
  }

  function addNum(n) {
    return el('span', 'tnum', pad(n));
  }

  function addName(item) {
    return el('span', 'tg', item.label);
  }

  function addRow(item, opts, mark) {
    var row = el('div', 'alpha-row');
    if (mark) row.classList.add('is-break');
    if (opts.lead) row.appendChild(el('span', 'alpha-mark', mark || ''));
    if (opts.numFirst) row.appendChild(addNum(item.n));
    if (opts.surname) {
      var who = el('span', 'who');
      who.appendChild(el('span', 'last', displayLast(item.sort)));
      who.appendChild(document.createTextNode(' '));
      who.appendChild(el('span', 'given', givenOf(item.label, item.sort)));
      row.appendChild(who);
    } else {
      row.appendChild(addName(item));
    }
    if (!opts.numFirst) {
      if (opts.leaders) row.appendChild(el('span', 'leader', ''));
      row.appendChild(addNum(item.n));
    }
    return row;
  }

  function makeIndex(seated) {
    var seen = {};
    seated.forEach(function (item) {
      var L = firstLetter(item);
      if (L) seen[L] = true;
    });
    var bar = el('div', 'alpha-index');
    Object.keys(seen).sort().forEach(function (L) {
      bar.appendChild(el('span', '', L));
    });
    return bar;
  }

  function addAlpha(host, tables, opts) {
    opts = opts || {};
    var seated = seatedRows(tables);
    var cols = opts.cols || 2;
    if (opts.index) host.appendChild(makeIndex(seated));
    var list = el('div', [
      'alpha',
      'cols-' + cols,
      opts.open ? 'open' : '',
      opts.soft ? 'soft' : '',
      opts.wide ? 'wide' : '',
      opts.lead ? 'lead' : '',
      opts.surname ? 'surname' : '',
      opts.numFirst ? 'num-first' : '',
      opts.loud ? 'loud' : '',
      opts.quiet ? 'quiet' : '',
      opts.gutter ? 'gutter' : '',
      opts.air ? 'air' : '',
      opts.fill ? 'fill' : '',
      opts.spread ? 'spread' : '',
      opts.leaders ? 'leaders' : '',
      opts.tuck ? 'tuck' : ''
    ].filter(Boolean).join(' '));

    alphaColumns(seated, cols, opts).forEach(function (chunk) {
      var col = el('div', 'alpha-col');
      var letter = '';
      chunk.forEach(function (item) {
        var next = firstLetter(item);
        var mark = '';
        if (opts.letters && next && next !== letter) {
          letter = next;
          if (opts.lead) mark = letter;
          else col.appendChild(el('div', 'alpha-letter', letter));
        }
        col.appendChild(addRow(item, opts, mark));
      });
      list.appendChild(col);
    });
    if (!seated.length) list.appendChild(el('div', 'tg mute', 'Seat people in Our seating — this list fills in A–Z.'));
    host.appendChild(list);
  }

  function roomRows(sign, tables, c, opts) {
    opts = opts || {};
    if (opts.spine) {
      var sp = addSpine(sign, c, opts.spine);
      var main = el('div', 'spine-main');
      addAlpha(main, tables, opts);
      if (opts.spine === 'right') {
        sign.appendChild(main);
        sign.appendChild(sp);
      } else {
        sign.appendChild(sp);
        sign.appendChild(main);
      }
      return;
    }
    addMast(sign, c, opts.mast || 'default');
    addAlpha(sign, tables, opts);
  }

  function addLedgers(sign, tables, c) {
    addMast(sign, c, 'plain');
    var seated = seatedRows(tables);
    var wrap = el('div', 'ledgers');
    alphaColumns(seated, 3, {}).forEach(function (chunk) {
      if (!chunk.length) return;
      var book = el('div', 'ledger');
      var a = firstLetter(chunk[0]);
      var b = firstLetter(chunk[chunk.length - 1]);
      book.appendChild(el('div', 'ledger-range', a === b ? a : (a + '–' + b)));
      var list = el('div', 'alpha cols-1 fill leaders open');
      var col = el('div', 'alpha-col');
      chunk.forEach(function (item) {
        col.appendChild(addRow(item, { leaders: true }));
      });
      list.appendChild(col);
      book.appendChild(list);
      wrap.appendChild(book);
    });
    sign.appendChild(wrap);
  }

  var LAY = {
    longrows: function (sign, tables, c) {
      roomRows(sign, tables, c, { letters: true, lead: true, open: true, cols: 3, spread: true });
    },
    s2: function (sign, tables, c) {
      roomRows(sign, tables, c, { mast: 's2', cols: 3, fill: true, leaders: true, open: true });
    },
    spine: function (sign, tables, c) {
      roomRows(sign, tables, c, {
        spine: 'left', letters: true, soft: true, open: true,
        cols: 2, quiet: true, gutter: true, tuck: true
      });
    },
    spineLead: function (sign, tables, c) {
      roomRows(sign, tables, c, {
        spine: 'left', leaders: true, open: true, wide: true,
        cols: 2, fill: true, gutter: true
      });
      sign.classList.add('spine-lead');
    },
    spineLeadTop: function (sign, tables, c) {
      LAY.spineLead(sign, tables, c);
      sign.classList.add('spine-top');
    },
    invite: function (sign, tables, c) {
      roomRows(sign, tables, c, { mast: 'invite', letters: true, lead: true, open: true, cols: 3, spread: true });
    },
    band: function (sign, tables, c) {
      roomRows(sign, tables, c, { mast: 'plain', surname: true, cols: 2, fill: true, leaders: true, open: true });
    },
    alpha: function (sign, tables, c) {
      roomRows(sign, tables, c, { mast: 'plain', letters: true, soft: true, cols: 3, fill: true });
    },
    across: function (sign, tables, c) {
      roomRows(sign, tables, c, { open: true, cols: 3, air: true, spread: true });
    },
    river: function (sign, tables, c) {
      roomRows(sign, tables, c, { mast: 'plain', cols: 3, fill: true, leaders: true, open: true });
    },
    twoup: function (sign, tables, c) {
      addLedgers(sign, tables, c);
    },
    ages: function (sign, tables, c) {
      roomRows(sign, tables, c, { letters: true, soft: true, loud: true, cols: 3, fill: true });
    },
    crooked: function (sign, tables, c) {
      roomRows(sign, tables, c, { mast: 'tall', leaders: true, open: true, wide: true, cols: 2, fill: true });
    },
    spineRight: function (sign, tables, c) {
      roomRows(sign, tables, c, {
        mast: 'plain', letters: true, soft: true, surname: true,
        cols: 2, fill: true, leaders: true, open: true
      });
    },
    stamp: function (sign, tables, c) {
      roomRows(sign, tables, c, {
        mast: 'plain', letters: true, soft: true, cols: 3,
        fill: true, leaders: true, open: true
      });
    },
    whisper: function (sign, tables, c) {
      roomRows(sign, tables, c, { open: true, wide: true, quiet: true, fill: true });
    }
  };

  var nudges = {};
  var arrangeDrag = null;
  var arrangeSelected = null;

  function loadNudges() {
    try {
      var raw = JSON.parse(localStorage.getItem(NUDGE_KEY) || '{}');
      if (raw && typeof raw === 'object') nudges = raw;
    } catch (e) {
      nudges = {};
    }
  }

  function saveNudges() {
    try { localStorage.setItem(NUDGE_KEY, JSON.stringify(nudges)); } catch (e) {}
  }

  function markPieces() {
    document.querySelectorAll('[data-layout]').forEach(function (sign) {
      function tag(el, id) {
        if (!el) return;
        el.classList.add('piece');
        el.setAttribute('data-piece', id);
      }
      tag(sign.querySelector('.vert'), 'title');
      tag(sign.querySelector('.mast'), 'title');
      tag(sign.querySelector('.s2'), 'title');
      tag(sign.querySelector('.display.k-top'), 'title');
      tag(sign.querySelector('.spine-rule'), 'spine');
      tag(sign.querySelector('.spine-main') || sign.querySelector(':scope > .alpha'), 'list');
    });
  }

  function applyPieceStyle(el, state) {
    if (!el) return;
    if (state && state.dx) el.style.setProperty('--dx', state.dx);
    else el.style.removeProperty('--dx');
    if (state && state.dy) el.style.setProperty('--dy', state.dy);
    else el.style.removeProperty('--dy');
    if (state && state.sc) el.style.setProperty('--pscale', state.sc);
    else el.style.removeProperty('--pscale');
  }

  function applyNudges() {
    document.querySelectorAll('[data-layout]').forEach(function (sign) {
      var map = nudges[sign.getAttribute('data-layout')] || {};
      sign.querySelectorAll('.piece[data-piece]').forEach(function (el) {
        applyPieceStyle(el, map[el.getAttribute('data-piece')]);
      });
    });
  }

  function writePieceNudge(el) {
    var sign = el && el.closest('[data-layout]');
    if (!sign) return;
    var key = sign.getAttribute('data-layout');
    var id = el.getAttribute('data-piece');
    if (!key || !id) return;
    if (!nudges[key]) nudges[key] = {};
    var dx = el.style.getPropertyValue('--dx');
    var dy = el.style.getPropertyValue('--dy');
    var sc = el.style.getPropertyValue('--pscale');
    if (!dx && !dy && !sc) {
      delete nudges[key][id];
      if (!Object.keys(nudges[key]).length) delete nudges[key];
    } else {
      nudges[key][id] = { dx: dx, dy: dy, sc: sc };
    }
    saveNudges();
  }

  function selectPiece(el) {
    if (arrangeSelected === el) return;
    if (arrangeSelected) arrangeSelected.classList.remove('selected');
    arrangeSelected = el || null;
    if (arrangeSelected) arrangeSelected.classList.add('selected');
  }

  function enableArrange() {
    var moveOn = document.getElementById('moveOn');
    var reset = document.getElementById('resetMove');
    if (!moveOn) return;

    function setMoving() {
      document.body.classList.toggle('arranging', moveOn.checked);
      if (!moveOn.checked) selectPiece(null);
    }

    moveOn.addEventListener('change', setMoving);
    setMoving();

    if (reset) {
      reset.addEventListener('click', function () {
        nudges = {};
        saveNudges();
        document.querySelectorAll('.piece').forEach(function (el) {
          applyPieceStyle(el, null);
        });
        selectPiece(null);
      });
    }

    document.addEventListener('pointerdown', function (e) {
      if (!moveOn.checked) return;
      if (e.button !== 0) return;
      if (e.target.closest('button, a, input, label, select, .controls, .meta, .lightbox, .assign')) return;
      var el = e.target.closest('.piece');
      if (!el || !el.closest('.sign')) {
        if (e.target.closest('.sign')) selectPiece(null);
        return;
      }
      selectPiece(el);
      var sign = el.closest('.sign');
      var w = sign.getBoundingClientRect().width;
      if (!w) return;
      var cs = getComputedStyle(el);
      arrangeDrag = {
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
    });

    document.addEventListener('pointermove', function (e) {
      if (!arrangeDrag) return;
      var nx = arrangeDrag.dx + (e.clientX - arrangeDrag.x) / arrangeDrag.unit;
      var ny = arrangeDrag.dy + (e.clientY - arrangeDrag.y) / arrangeDrag.unit;
      if (Math.abs(e.clientX - arrangeDrag.x) > 2 || Math.abs(e.clientY - arrangeDrag.y) > 2) {
        arrangeDrag.dirty = true;
      }
      arrangeDrag.el.style.setProperty('--dx', nx.toFixed(2) + 'cqi');
      arrangeDrag.el.style.setProperty('--dy', ny.toFixed(2) + 'cqi');
    });

    function endDrag() {
      if (!arrangeDrag) return;
      arrangeDrag.el.classList.remove('dragging');
      if (arrangeDrag.dirty) writePieceNudge(arrangeDrag.el);
      arrangeDrag = null;
    }
    document.addEventListener('pointerup', endDrag);
    document.addEventListener('pointercancel', endDrag);
  }

  var renderRaf = 0;
  function renderAll() {
    renderRaf = 0;
    var tables = allTables();
    var c = copy();
    document.querySelectorAll('[data-layout]').forEach(function (sign) {
      var key = sign.getAttribute('data-layout');
      sign.innerHTML = '';
      sign.classList.remove('row-sign', 'spine-lead', 'spine-top');
      var fn = LAY[key];
      if (fn) fn(sign, tables, c);
    });
    applyColor();
    markPieces();
    applyNudges();
  }
  function renderAllSoon() {
    if (!document.querySelector('[data-layout]')) return;
    if (renderRaf) clearTimeout(renderRaf);
    renderRaf = setTimeout(function () {
      renderRaf = 0;
      renderAll();
    }, 320);
  }

  function summarise() {
    var el = document.getElementById('summary');
    if (!el) return;
    var n = currentSeats().length;
    el.innerHTML =
      '<span class="ui-pill"><i class="swatchdot" style="background:' + G[ground].hex + '"></i><b>' + G[ground].name + '</b> stock</span>' +
      '<span class="ui-pill"><i class="swatchdot" style="background:' + T[text].hex + '"></i><b>' + T[text].name + '</b> type</span>' +
      '<span class="ui-pill"><b>' + n + '</b> signs</span>' +
      '<span class="ui-pill"><b>' + ruleLabel(rule) + '</b> ' + ruleStyle +
      (spineStyle !== 'solid' ? ' · spine ' + spineStyle : '') +
      (leadSit !== 'bot' ? ' · sit ' + (leadSit === 'mid' ? 'center' : 'top') : '') + '</span>' +
      '<span class="ui-pill">24 × 36</span>';
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
    s.textContent = '@page { size: 24in 36in; margin: 0; }';
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

  var FIGMA_W = 864;
  var FIGMA_H = 1296;
  var WAG_W = 1800;
  var WAG_H = 2700;
  var h2cPromise = null;

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

  function figmaName(card) {
    var h = card.querySelector('.meta h3');
    return (h ? h.textContent : 'seating')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'seating';
  }

  function exportFigma(card, frame, btn) {
    var label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Making PNG…';
    var host = document.createElement('div');
    host.setAttribute('data-export-ignore', '');
    host.style.cssText = 'position:fixed;left:-12000px;top:0;width:' + FIGMA_W + 'px;height:' + FIGMA_H + 'px;z-index:-1;';
    var clone = frame.cloneNode(true);
    clone.classList.remove('print-me');
    clone.style.width = FIGMA_W + 'px';
    clone.style.height = FIGMA_H + 'px';
    clone.style.aspectRatio = 'auto';
    clone.style.boxShadow = 'none';
    clone.style.borderRadius = '0';
    host.appendChild(clone);
    document.body.appendChild(host);
    document.fonts.ready.then(function () { return loadHtml2Canvas(); })
      .then(function (h2c) {
        return h2c(clone, {
          width: FIGMA_W,
          height: FIGMA_H,
          scale: 2,
          backgroundColor: null,
          useCORS: true,
          logging: false
        });
      })
      .then(function (canvas) {
        var a = document.createElement('a');
        a.download = figmaName(card) + '-24x36-1728x2592.png';
        a.href = canvas.toDataURL('image/png');
        a.click();
        toast('PNG saved · drop into a 1728 × 2592 Figma frame (24 × 36 in).');
      })
      .catch(function () {
        toast('PNG failed — use Print chart → Save as PDF instead.');
      })
      .then(function () {
        host.remove();
        btn.disabled = false;
        btn.textContent = label;
      });
  }

  function cloneFrame(frame, w, h) {
    var host = document.createElement('div');
    host.setAttribute('data-export-ignore', '');
    host.style.cssText = 'position:fixed;left:-12000px;top:0;width:' + w + 'px;height:' + h + 'px;z-index:-1;background:' + G[ground].hex + ';';
    var clone = frame.cloneNode(true);
    clone.classList.remove('print-me');
    clone.style.width = w + 'px';
    clone.style.height = h + 'px';
    clone.style.aspectRatio = 'auto';
    clone.style.boxShadow = 'none';
    clone.style.borderRadius = '0';
    clone.style.background = G[ground].hex;
    host.appendChild(clone);
    document.body.appendChild(host);
    return { host: host, clone: clone };
  }

  function canvasJpeg(canvas, quality) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (!blob) reject(new Error('Could not make JPEG'));
        else resolve(blob);
      }, 'image/jpeg', quality);
    });
  }

  function downloadBlob(blob, name) {
    var a = document.createElement('a');
    a.download = name;
    a.href = URL.createObjectURL(blob);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }

  function exportWalgreens(card, frame, btn) {
    var label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Making JPEG…';
    var packed = cloneFrame(frame, WAG_W, WAG_H);
    function render(scale) {
      return document.fonts.ready.then(function () { return loadHtml2Canvas(); })
        .then(function (h2c) {
          return h2c(packed.clone, {
            width: WAG_W,
            height: WAG_H,
            scale: scale,
            backgroundColor: G[ground].hex,
            useCORS: true,
            logging: false
          });
        });
    }
    render(3)
      .catch(function () { return render(2); })
      .then(function (canvas) { return canvasJpeg(canvas, 0.92); })
      .then(function (blob) {
        downloadBlob(blob, figmaName(card) + '-walgreens-24x36.jpg');
        toast('JPEG saved · 24×36 for Walgreens. Upload as a Poster, full resolution, don’t crop.');
      })
      .catch(function () {
        toast('JPEG failed — try Chrome, close other tabs, then hit the button again.');
      })
      .then(function () {
        packed.host.remove();
        btn.disabled = false;
        btn.textContent = label;
      });
  }

  function wireLightbox() {
    var lb = document.getElementById('lightbox');
    var stage = document.getElementById('lb-stage');
    var caption = document.getElementById('lb-caption');
    var prevBtn = lb && lb.querySelector('.lb-prev');
    var nextBtn = lb && lb.querySelector('.lb-next');
    if (!lb || !stage || !caption || !prevBtn || !nextBtn) return;

    var source = null;
    var lastFocus = null;

    function cards() {
      return Array.from(document.querySelectorAll('.grid > div')).filter(function (card) {
        return card.querySelector('.frame .sign[data-layout]');
      });
    }

    function titleOf(card) {
      var h = card.querySelector('.meta h3');
      return h ? h.textContent : 'Seating chart';
    }

    function fill(card) {
      source = card;
      var frame = card.querySelector('.frame');
      if (!frame) return;
      stage.innerHTML = '';
      var clone = frame.cloneNode(true);
      clone.classList.remove('print-me');
      clone.removeAttribute('role');
      clone.removeAttribute('tabindex');
      clone.removeAttribute('aria-label');
      clone.removeAttribute('title');
      stage.appendChild(clone);
      caption.textContent = titleOf(card);
      var list = cards();
      var many = list.length > 1;
      prevBtn.hidden = !many;
      nextBtn.hidden = !many;
    }

    function open(card) {
      if (document.body.classList.contains('arranging')) return;
      if (!card || !card.querySelector('.frame')) return;
      lastFocus = document.activeElement;
      fill(card);
      lb.hidden = false;
      requestAnimationFrame(function () { lb.classList.add('is-open'); });
      document.body.classList.add('lb-open');
      var closeBtn = lb.querySelector('.lb-x');
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      if (lb.hidden) return;
      lb.classList.remove('is-open');
      document.body.classList.remove('lb-open');
      stage.innerHTML = '';
      source = null;
      lb.hidden = true;
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    }

    function step(dir) {
      var list = cards();
      if (!list.length) return;
      var i = source ? list.indexOf(source) : 0;
      if (i < 0) i = 0;
      fill(list[(i + dir + list.length) % list.length]);
    }

    document.querySelectorAll('.grid .frame').forEach(function (frame) {
      var card = frame.parentElement;
      if (!card || !card.querySelector('.meta')) return;
      frame.setAttribute('role', 'button');
      frame.setAttribute('tabindex', '0');
      frame.setAttribute('title', 'View larger');
      frame.setAttribute('aria-label', 'View ' + titleOf(card) + ' larger');
      frame.addEventListener('click', function () {
        if (document.body.classList.contains('arranging')) return;
        open(card);
      });
      frame.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(card);
        }
      });
    });

    lb.querySelector('.lb-back').addEventListener('click', close);
    lb.querySelector('.lb-x').addEventListener('click', close);
    prevBtn.addEventListener('click', function () { step(-1); });
    nextBtn.addEventListener('click', function () { step(1); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        step(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        step(1);
      }
    });
  }

  function wirePrint() {
    document.querySelectorAll('.grid > div').forEach(function (card) {
      var meta = card.querySelector('.meta');
      var frame = card.querySelector('.frame');
      if (!meta || !frame || meta.querySelector('.export-bar')) return;
      var bar = document.createElement('div');
      bar.className = 'export-bar';
      var print = document.createElement('button');
      print.type = 'button';
      print.className = 'xbtn printbtn';
      print.textContent = 'Print 24×36';
      print.addEventListener('click', function () { printCard(frame); });
      var png = document.createElement('button');
      png.type = 'button';
      png.className = 'xbtn figmabtn';
      png.textContent = 'PNG for Figma';
      png.addEventListener('click', function () { exportFigma(card, frame, png); });
      var wag = document.createElement('button');
      wag.type = 'button';
      wag.className = 'xbtn wagbtn';
      wag.textContent = 'JPEG for Walgreens';
      wag.addEventListener('click', function () { exportWalgreens(card, frame, wag); });
      bar.appendChild(wag);
      bar.appendChild(print);
      bar.appendChild(png);
      meta.appendChild(bar);
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
  ['nf', 'df'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('change', function () { applyType(); renderAll(); });
  });
  ['headline', 'where'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', renderAllSoon);
  });
  var ruleSlider = document.getElementById('rule');
  if (ruleSlider) {
    ruleSlider.addEventListener('input', function () {
      applyRule(parseFloat(ruleSlider.value));
    });
  }
  document.querySelectorAll('#rule-presets button').forEach(function (b) {
    b.addEventListener('click', function () {
      applyRule(parseFloat(b.getAttribute('data-rule')), parseFloat(b.getAttribute('data-rule')));
    });
  });
  document.querySelectorAll('#rule-style button').forEach(function (b) {
    b.addEventListener('click', function () {
      applyRuleStyle(b.getAttribute('data-style'));
    });
  });
  document.querySelectorAll('#spine-style button').forEach(function (b) {
    b.addEventListener('click', function () {
      applySpineStyle(b.getAttribute('data-spine'));
    });
  });
  document.querySelectorAll('#lead-sit button').forEach(function (b) {
    b.addEventListener('click', function () {
      applyLeadSit(b.getAttribute('data-sit'));
    });
  });

  var gear = document.getElementById('gear');
  var panel = document.getElementById('panel');
  if (gear && panel) {
    gear.addEventListener('click', function () {
      var on = panel.classList.toggle('open');
      gear.classList.toggle('open', on);
      gear.setAttribute('aria-expanded', on ? 'true' : 'false');
    });
  }

  applyType();
  applyPaper();
  loadRule();
  loadNudges();
  loadAssign();
  loadPlace();
  wirePrint();
  wireLightbox();
  enableArrange();

  var refill = document.getElementById('refill');
  if (refill) {
    refill.addEventListener('click', function () {
      upsertLayout('Before reset');
      pinLastSaved();
      markWiped();
      applyPlaceholders();
      renderAssign();
      renderAll();
    });
  }
  var clearRoom = document.getElementById('clear-room');
  if (clearRoom) {
    clearRoom.addEventListener('click', function () {
      upsertLayout('Before clear');
      pinLastSaved();
      markWiped();
      assign = {};
      place = {};
      persistAssign();
      renderAssign();
      renderAll();
    });
  }
  var printRoom = document.getElementById('print-room');
  if (printRoom) {
    printRoom.addEventListener('click', function () {
      document.body.classList.add('print-planner');
      var done = function () {
        document.body.classList.remove('print-planner');
        window.removeEventListener('afterprint', done);
      };
      window.addEventListener('afterprint', done);
      window.print();
      setTimeout(done, 1200);
    });
  }
  var find = document.getElementById('planner-q');
  if (find) find.addEventListener('input', filterChips);
  wireLayouts();

  function flushSession() {
    persistAssign();
    if (wasWiped() || roomCount() < 1) return;
    rememberWorking(true);
    upsertLayout('Last session');
  }
  window.addEventListener('pagehide', flushSession);
  window.addEventListener('beforeunload', flushSession);
  document.addEventListener('pointermove', tickPersonDrag);
  document.addEventListener('pointerup', dropPersonDrag);

  function bestStoredLayout() {
    var rank = {
      'Last saved': 0,
      'Working copy': 1,
      'Last session': 2,
      'Before reset': 3,
      'Before load': 4,
      'Before clear': 5
    };
    var list = loadLayouts().filter(function (x) { return layoutSeated(x) > 0; });
    list.sort(function (a, b) {
      var ra = rank.hasOwnProperty(a.name) ? rank[a.name] : 10;
      var rb = rank.hasOwnProperty(b.name) ? rank[b.name] : 10;
      if (ra !== rb) return ra - rb;
      var diff = layoutSeated(b) - layoutSeated(a);
      if (diff) return diff;
      return (b.at || 0) - (a.at || 0);
    });
    return list[0] || null;
  }

  function restoreSavedRoom() {
    var pick = bestStoredLayout();
    if (wasWiped() && pick) {
      assign = cloneMap(pick.assign);
      place = cloneMap(pick.place || {});
      applyPlaces();
      persistAssign();
      clearWiped();
      return true;
    }
    if (seatedCount() > 0) return false;
    if (!pick) return false;
    assign = cloneMap(pick.assign);
    place = cloneMap(pick.place || {});
    applyPlaces();
    persistAssign();
    return true;
  }

  function startPlanner(keepSeed) {
    if (!keepSeed) restoreSavedRoom();
    if (seatedCount() < 1) applyPlaceholders();
    seedWorkingLayout();
    fillLayoutPick();
    renderAssign();
    renderAll();
  }

  function seedRev() {
    try { return localStorage.getItem(SEED_REV_KEY) || ''; } catch (e) { return ''; }
  }

  function markSeedRev() {
    try { localStorage.setItem(SEED_REV_KEY, SEED_REV); } catch (e) {}
  }

  function isFridayNight(data) {
    var a = data && data.assign;
    return !!(a && a['skylar-dann'] === 3 && a['allison-fong'] === 3 && a.jim === 9);
  }

  function loadOfficialSeed(done) {
    fetch('data/seating-state.json?v=' + SEED_REV)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (seed) {
        if (seed && isFridayNight(seed)) {
          clearWiped();
          applySeedData(seed);
          writeWorking();
          markSeedRev();
          done(true);
          return;
        }
        done(false);
      })
      .catch(function () { done(false); });
  }

  fetch('data/guests.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      guests = (data && data.guests) || [];
      applyPlaces();
      if (seedRev() !== SEED_REV) {
        loadOfficialSeed(startPlanner);
        return;
      }
      restoreSavedRoom();
      if (seatedCount() >= 40) {
        startPlanner();
        return;
      }
      loadOfficialSeed(startPlanner);
    })
    .catch(function () {
      var note = document.getElementById('rsvpnote');
      if (note) note.textContent = 'Couldn’t load data/guests.json — check the local server.';
      renderAll();
    });
})();
