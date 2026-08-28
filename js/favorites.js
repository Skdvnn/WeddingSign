/**
 * Star layouts → move into Favorites section. Persists in localStorage.
 */
(function () {
  'use strict';

  var STORAGE_KEY =
    document.documentElement.getAttribute('data-fav-key') ||
    'wedding-sign-favorites-v1';

  var ALIASES = {
    'c1-hanging-caps': 'longrows',
    'c2-s2-ledger': 's2',
    'c3-spine-letters': 'spine',
    'c4-invite-field': 'invite',
    'c5-last-name-ledger': 'band',
    'c6-letter-rules': 'alpha',
    'c7-wide-open': 'across',
    'c8-the-ledger': 'river',
    'c9-three-ledgers': 'twoup',
    'c10-split-letters': 'alpha',
    'c10-the-ages': 'ages',
    'c11-the-ages': 'ages',
    'c11-dot-leaders': 'crooked',
    'c12-dot-leaders': 'crooked',
    'c12-directory-lettered': 'spineRight',
    'c13-directory-lettered': 'spineRight',
    'c13-lettered-ledger': 'stamp',
    'c14-index-ledger': 'stamp',
    'c14-three-across': 'stamp',
    'c14-lettered-ledger': 'stamp',
    'c14-quiet-ages': 'whisper',
    'c15-directory': 'band',
    'c16-quiet-ages': 'whisper',
    'split': 'alpha',
    'pills': 'band'
  };

  function slug(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 64);
  }

  function cardId(card) {
    var sign = card.querySelector('[data-layout]');
    var layout = sign && sign.getAttribute('data-layout');
    if (layout) return layout;
    var preset = card.getAttribute('data-fav-id');
    if (preset) return preset;
    var h3 = card.querySelector('h3');
    return slug(h3 && h3.textContent);
  }

  function loadFavs() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function saveFavs(ids) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch (e) { /* private mode etc. */ }
  }

  function starIcon() {
    return (
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path class="star-outline" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" ' +
          'd="M12 3.6l2.4 4.86 5.36.78-3.88 3.78.92 5.34L12 15.9l-4.8 2.52.92-5.34-3.88-3.78 5.36-.78L12 3.6z"/>' +
        '<path class="star-fill" fill="currentColor" ' +
          'd="M12 3.6l2.4 4.86 5.36.78-3.88 3.78.92 5.34L12 15.9l-4.8 2.52.92-5.34-3.88-3.78 5.36-.78L12 3.6z"/>' +
      '</svg>'
    );
  }

  function homeGrid(home) {
    var named = document.querySelector('[data-home-grid="' + home + '"]');
    if (named) return named;
    if (home === 'rest') return document.getElementById('rest-grid');
    return document.getElementById('shortlist-grid');
  }

  function updateFavoritesUI(count) {
    var empty = document.getElementById('favorites-empty');
    var heading = document.getElementById('favorites-heading');
    var grid = document.getElementById('favorites-grid');
    if (empty) empty.style.display = count ? 'none' : 'block';
    if (grid) grid.style.display = count ? '' : 'none';
    if (heading) {
      heading.textContent = count ? ('Favorites · ' + count) : 'Favorites';
    }
  }

  function setStarred(card, on) {
    var btn = card.querySelector('.starbtn');
    card.classList.toggle('is-fav', on);
    if (btn) {
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.setAttribute('aria-label', on ? 'Remove from favorites' : 'Add to favorites');
      btn.title = on ? 'Unstar — send back' : 'Star — move to Favorites';
    }
  }

  function moveToFavorites(card) {
    var grid = document.getElementById('favorites-grid');
    if (!grid) return;
    grid.appendChild(card);
    setStarred(card, true);
  }

  function moveHome(card) {
    var home = card.getAttribute('data-home') || 'shortlist';
    var grid = homeGrid(home);
    if (!grid) return;
    // Restore roughly original order: by data-order index
    var order = parseInt(card.getAttribute('data-order') || '0', 10);
    var placed = false;
    Array.from(grid.children).forEach(function (sib) {
      if (placed) return;
      var sibOrder = parseInt(sib.getAttribute('data-order') || '0', 10);
      if (order < sibOrder) {
        grid.insertBefore(card, sib);
        placed = true;
      }
    });
    if (!placed) grid.appendChild(card);
    setStarred(card, false);
  }

  function syncFromStorage() {
    var favs = loadFavs();
    var byId = {};
    var bySlug = {};
    document.querySelectorAll('.layout-card').forEach(function (card) {
      var id = card.getAttribute('data-layout-id');
      byId[id] = card;
      var h3 = card.querySelector('h3');
      if (h3) bySlug[slug(h3.textContent)] = id;
    });

    var resolved = [];
    favs.forEach(function (id) {
      var next = id;
      if (!byId[next] && ALIASES[next]) next = ALIASES[next];
      if (!byId[next] && bySlug[id]) next = bySlug[id];
      if (byId[next] && resolved.indexOf(next) === -1) resolved.push(next);
    });
    if (resolved.join('\0') !== favs.join('\0')) saveFavs(resolved);

    var favSet = {};
    resolved.forEach(function (id) { favSet[id] = true; });

    resolved.forEach(function (id) {
      if (byId[id]) moveToFavorites(byId[id]);
    });

    // Ensure unstarred are home
    document.querySelectorAll('.layout-card').forEach(function (card) {
      var id = card.getAttribute('data-layout-id');
      if (!favSet[id] && card.parentElement && card.parentElement.id === 'favorites-grid') {
        moveHome(card);
      } else if (!favSet[id]) {
        setStarred(card, false);
      }
    });

    updateFavoritesUI(document.querySelectorAll('#favorites-grid .layout-card').length);
  }

  function toggle(card) {
    var id = card.getAttribute('data-layout-id');
    var favs = loadFavs();
    var idx = favs.indexOf(id);
    if (idx === -1) {
      favs.push(id);
      moveToFavorites(card);
    } else {
      favs.splice(idx, 1);
      moveHome(card);
    }
    saveFavs(favs);
    updateFavoritesUI(document.querySelectorAll('#favorites-grid .layout-card').length);

    // Re-apply paint colours in case anything was missed (safe no-op if apply gone)
    // Scroll favorites into view on first star
    if (idx === -1) {
      var section = document.getElementById('favorites-section');
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function wireCard(card, home, order) {
    card.classList.add('layout-card');
    card.setAttribute('data-home', home);
    card.setAttribute('data-order', String(order));

    var meta = card.querySelector('.meta');
    if (!meta) return;
    var h3 = meta.querySelector('h3');
    if (!h3) return;

    var id = cardId(card);
    card.setAttribute('data-layout-id', id);

    if (meta.querySelector('.starbtn')) return;

    var head = document.createElement('div');
    head.className = 'meta-head';
    h3.parentNode.insertBefore(head, h3);
    head.appendChild(h3);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'starbtn';
    btn.innerHTML = starIcon();
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', 'Add to favorites');
    btn.title = 'Star — move to Favorites';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggle(card);
    });
    head.appendChild(btn);
  }

  function init() {
    var homes = document.querySelectorAll('[data-home-grid]');
    if (homes.length) {
      homes.forEach(function (grid) {
        var home = grid.getAttribute('data-home-grid');
        Array.from(grid.children).forEach(function (card, i) {
          if (card.querySelector && card.querySelector('.meta')) wireCard(card, home, i);
        });
      });
    } else {
      var shortlist = document.getElementById('shortlist-grid');
      var rest = document.getElementById('rest-grid');

      if (!shortlist) {
        var grids = document.querySelectorAll('.grid');
        shortlist = grids[0];
        if (shortlist) shortlist.id = 'shortlist-grid';
      }
      if (!rest) {
        var grids2 = document.querySelectorAll('.grid');
        rest = grids2[grids2.length - 1];
        if (rest && rest.id !== 'shortlist-grid' && rest.id !== 'favorites-grid') {
          rest.id = 'rest-grid';
        }
      }

      if (shortlist) {
        Array.from(shortlist.children).forEach(function (card, i) {
          if (card.querySelector && card.querySelector('.meta')) wireCard(card, 'shortlist', i);
        });
      }
      if (rest) {
        Array.from(rest.children).forEach(function (card, i) {
          if (card.querySelector && card.querySelector('.meta')) wireCard(card, 'rest', i);
        });
      }
    }

    // Ensure favorites grid exists
    if (!document.getElementById('favorites-grid')) {
      var section = document.getElementById('favorites-section');
      if (section) {
        var g = document.createElement('div');
        g.className = 'grid';
        g.id = 'favorites-grid';
        section.appendChild(g);
      }
    }

    syncFromStorage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
