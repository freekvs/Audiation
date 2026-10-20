(function () {
  var KEY = 'audiation.lang';
  var IDS = ['nl', 'en', 'de', 'fr', 'es'];
  var NAMES = {
    nl: 'Nederlands',
    en: 'English',
    de: 'Deutsch',
    fr: 'Français',
    es: 'Español',
  };

  function ok(id) {
    return IDS.indexOf(id) >= 0;
  }

  var redirecting = false;

  function rawPath() {
    var p = location.pathname || '/';
    if (p.length > 1 && p.charAt(p.length - 1) === '/') p = p.slice(0, -1);
    if (p.slice(-11) === '/index.html') p = p.slice(0, -11) || '/';
    else if (p.slice(-5) === '.html') p = p.slice(0, -5) || '/';
    if (p === '/index' || p.slice(-6) === '/index') p = p.slice(0, -6) || '/';
    return p || '/';
  }

  function stripLangPrefix(pathname) {
    var m = String(pathname || '/').match(/^\/(en|de|fr|es)(\/.*)?$/);
    if (!m) return pathname || '/';
    return m[2] || '/';
  }

  function localizedPath(bare, langId) {
    var p = stripLangPrefix(bare || '/');
    if (p.charAt(0) !== '/') p = '/' + p;
    if (p.length > 1 && p.charAt(p.length - 1) === '/') p = p.slice(0, -1);
    if (p.slice(-5) === '.html') p = p.slice(0, -5) || '/';
    if (p === '/index' || p.slice(-6) === '/index') p = p.slice(0, -6) || '/';
    if (!p) p = '/';
    if (langId && langId !== 'nl') return p === '/' ? '/' + langId + '/' : '/' + langId + p;
    return p;
  }

  function pagePath() {
    return stripLangPrefix(rawPath());
  }

  function pathLang() {
    var m = rawPath().match(/^\/(en|de|fr|es)(\/|$)/);
    return m ? m[1] : null;
  }

  function detect() {
    var q = (new URLSearchParams(location.search).get('lang') || '').toLowerCase();
    var fromPath = pathLang();
    if (location.protocol === 'http:' && location.hostname === 'audiation.app') {
      var httpsLang = ok(q) ? q : fromPath || 'nl';
      redirecting = true;
      location.replace('https://audiation.app' + localizedPath(pagePath(), httpsLang) + location.hash);
      return httpsLang;
    }
    if (ok(q)) {
      var target = localizedPath(pagePath(), q);
      if (location.pathname !== target || location.search) {
        redirecting = true;
        location.replace(target + location.hash);
        return q;
      }
    }
    if (fromPath) {
      try {
        localStorage.setItem(KEY, fromPath);
      } catch (e) {}
      return fromPath;
    }
    try {
      var saved = localStorage.getItem(KEY);
      if (ok(saved) && saved !== 'nl') {
        redirecting = true;
        location.replace(localizedPath(pagePath(), saved) + location.hash);
        return saved;
      }
    } catch (e) {}
    return 'nl';
  }

  function get(obj, path) {
    return path.split('.').reduce(function (acc, key) {
      return acc && acc[key] != null ? acc[key] : '';
    }, obj);
  }

  var lang = detect();
  var pack = (window.SITE_I18N && window.SITE_I18N[lang]) || (window.SITE_I18N && window.SITE_I18N.nl);

  window.SITE = {
    lang: lang,
    pack: pack,
    ui: pack.ui,
    t: function (path) {
      return get(pack, path);
    },
    href: function (path) {
      var s = String(path || '/');
      var hash = '';
      var hi = s.indexOf('#');
      if (hi >= 0) {
        hash = s.slice(hi);
        s = s.slice(0, hi);
      }
      return localizedPath(s, lang) + hash;
    },
    setLang: function (id) {
      if (!ok(id) || id === lang) return;
      try {
        localStorage.setItem(KEY, id);
      } catch (e) {}
      location.href = localizedPath(pagePath(), id) + location.hash;
    },
  };

  if (!redirecting && pack) {
    window.AUDIATION = {
      steps: pack.steps,
      homeCopy: pack.homeCopy,
      homeSteps: pack.homeSteps,
      exercises: pack.exercises,
    };
    document.documentElement.lang = lang;
  }

  var UK_SVG = '<svg viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice" focusable="false"><clipPath id="uk-s"><path d="M0,0v30h60V0z"/></clipPath><clipPath id="uk-t"><path d="M30,15h30v15zv15H30zH0V15zV0h30z"/></clipPath><g clip-path="url(#uk-s)"><path d="M0,0v30h60V0z" fill="#012169"/><path d="M0,0 60,30M60,0 0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 60,30M60,0 0,30" clip-path="url(#uk-t)" stroke="#C8102E" stroke-width="4"/><path d="M30,0v30M0,15h60" stroke="#fff" stroke-width="10"/><path d="M30,0v30M0,15h60" stroke="#C8102E" stroke-width="6"/></g></svg>';

  function renderFlags() {
    var nodes = document.querySelectorAll('.lang-flags');
    var html = IDS.map(function (id) {
      return (
        '<button type="button" class="lang-flag' +
        (id === lang ? ' is-on' : '') +
        '" data-lang="' +
        id +
        '" aria-label="' +
        NAMES[id] +
        '" aria-pressed="' +
        (id === lang ? 'true' : 'false') +
        '">' +
        '<span class="flag flag-' +
        id +
        '" aria-hidden="true">' +
        (id === 'en' ? UK_SVG : '') +
        '</span>' +
        '<span class="lang-name">' +
        NAMES[id] +
        '</span></button>'
      );
    }).join('');
    nodes.forEach(function (el) {
      el.innerHTML = html;
      el.querySelectorAll('[data-lang]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          window.SITE.setLang(btn.getAttribute('data-lang'));
        });
      });
    });
  }

  function pageAbs(langId) {
    var p = localizedPath(pagePath(), langId);
    return p === '/' ? 'https://audiation.app/' : 'https://audiation.app' + p;
  }

  function upsertLink(rel, hreflang, href) {
    var sel = hreflang
      ? 'link[rel="' + rel + '"][hreflang="' + hreflang + '"]'
      : 'link[rel="' + rel + '"]:not([hreflang])';
    var el = document.head.querySelector(sel);
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', rel);
      if (hreflang) el.setAttribute('hreflang', hreflang);
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
  }

  function applySeo() {
    upsertLink('canonical', null, pageAbs(lang));
    upsertLink('alternate', 'x-default', pageAbs('nl'));
    IDS.forEach(function (id) {
      upsertLink('alternate', id, pageAbs(id));
    });
  }

  function fill() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = get(pack, el.getAttribute('data-i18n'));
      if (v) el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var v = get(pack, el.getAttribute('data-i18n-html'));
      if (v) el.innerHTML = v;
    });
    var n = Number(document.body.getAttribute('data-exercise') || '0');
    if (n && pack.steps[n - 1]) {
      var title = n + '. ' + pack.steps[n - 1].title;
      var h1 = document.querySelector('h1');
      if (h1) h1.textContent = title;
      document.title = title + ' — Audiation';
    } else if (document.body.getAttribute('data-tour') === 'home') {
      document.title = pack.ui.homeTitle;
    } else if (location.pathname.indexOf('over') !== -1) {
      document.title = pack.ui.aboutTitle + ' — Audiation';
    } else if (location.pathname.indexOf('privacy') !== -1) {
      document.title = pack.ui.privacy + ' — Audiation';
    }

    var pager = document.querySelector('.pager');
    if (pager && n) {
      var parts = [];
      if (n > 1) {
        parts.push(
          '<a href="/oefening-' +
            (n - 1) +
            '">' +
            pack.ui.prev +
            ': ' +
            (n - 1) +
            '. ' +
            pack.steps[n - 2].title +
            '</a>'
        );
      }
      if (n < pack.steps.length) {
        parts.push(
          '<a href="/oefening-' +
            (n + 1) +
            '">' +
            pack.ui.next +
            ': ' +
            (n + 1) +
            '. ' +
            pack.steps[n].title +
            '</a>'
        );
      }
      pager.innerHTML = parts.join('');
    }
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href || href.indexOf('mailto:') === 0 || href.indexOf('http') === 0) return;
      if (href.charAt(0) === '#') return;
      try {
        var u = new URL(href, location.origin);
        if (u.origin !== location.origin) return;
        if (/\.(css|js|png|jpe?g|svg|webp|gif|ico|xml|txt|woff2?)$/i.test(u.pathname)) return;
        a.setAttribute('href', localizedPath(u.pathname, lang) + u.hash);
      } catch (e) {}
    });
    applySeo();
    renderFlags();
  }

  if (!redirecting) fill();
})();
