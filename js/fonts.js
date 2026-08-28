/**
 * Load Google Fonts only when a non-suite face is picked.
 * Instrument Serif + Roboto Mono ship locally in assets/fonts/suite.css.
 */
(function (w) {
  'use strict';
  var GF = {
    playfair: 'Playfair+Display:ital,wght@0,400..700;1,400',
    bodoni: 'Bodoni+Moda:ital,opsz,wght@0,6..96,400..700',
    dmserif: 'DM+Serif+Display:ital@0;1',
    ebgaramond: 'EB+Garamond:ital,wght@0,500;1,400',
    libre: 'Libre+Baskerville:ital,wght@0,400;0,700;1,400',
    cormorant: 'Cormorant+Garamond:ital,wght@0,500',
    fraunces: 'Fraunces:opsz,wght@9..144,500',
    frauncessoft: 'Fraunces:opsz,wght@9..144,600',
    dmsans: 'DM+Sans:opsz,wght@9..40,600',
    jost: 'Jost:wght@500',
    outfit: 'Outfit:wght@500',
    spacegrotesk: 'Space+Grotesk:wght@600',
    bebas: 'Bebas+Neue',
    oswald: 'Oswald:wght@500',
    anton: 'Anton',
    archivoblack: 'Archivo+Black',
    syne: 'Syne:wght@700',
    archivo: 'Archivo:wght@700',
    spacemono: 'Space+Mono:wght@400',
    plexmono: 'IBM+Plex+Mono:wght@400',
    inter: 'Inter:wght@500',
    serifcaps: 'EB+Garamond:wght@500'
  };

  function ensure(key) {
    if (!key || document.getElementById('gf-' + key)) return;
    var spec = GF[key];
    if (!spec) return;
    var l = document.createElement('link');
    l.id = 'gf-' + key;
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + spec + '&display=swap';
    document.head.appendChild(l);
  }

  w.WeddingFonts = { ensure: ensure };
})(window);
