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

  function detect() {
    var q = new URLSearchParams(location.search).get('lang');
    if (ok(q)) return q;
    try {
      var saved = localStorage.getItem(KEY);
      if (ok(saved)) return saved;
    } catch (e) {}
    var nav = String(navigator.language || 'nl').slice(0, 2).toLowerCase();
    if (ok(nav)) return nav;
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
    setLang: function (id) {
      if (!ok(id) || id === lang) return;
      try {
        localStorage.setItem(KEY, id);
      } catch (e) {}
      var url = new URL(location.href);
      url.searchParams.set('lang', id);
      location.href = url.pathname + url.search + url.hash;
    },
  };

  window.AUDIATION = {
    steps: pack.steps,
    homeCopy: pack.homeCopy,
    homeSteps: pack.homeSteps,
    exercises: pack.exercises,
  };

  document.documentElement.lang = lang;

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
            '.html">' +
            pack.ui.prev +
            ': ' +
            (n - 1) +
            '. ' +
            pack.steps[n - 2].title +
            '</a>'
        );
      }
      if (n < 10) {
        parts.push(
          '<a href="/oefening-' +
            (n + 1) +
            '.html">' +
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
        u.searchParams.set('lang', lang);
        a.setAttribute('href', u.pathname + u.search + u.hash);
      } catch (e) {}
    });
    renderFlags();
  }

  fill();
})();
