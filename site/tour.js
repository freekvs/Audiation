(function () {
  const data = window.AUDIATION;
  if (!data) return;

  const mode = document.body.dataset.tour || 'home';
  const exerciseN = Number(document.body.dataset.exercise || '0');

  const ui = (window.SITE && window.SITE.ui) || {};
  const ph = (window.SITE && window.SITE.pack && window.SITE.pack.phone) || {};
  const LABELS_HOME = ui.labelsHome || {
    who: 'Wie',
    why: 'Waarom — doel',
    can: 'Gewenst kunnen',
    how: 'Hoe -- gebruik',
  };
  const LABELS_EX = ui.labelsEx || {
    who: 'In het pad',
    why: 'Waarom',
    can: 'Wat de oefening doet',
    how: 'Wat jij kunt bereiken',
    harder: 'Hoe je al trainend moeilijker maakt',
  };

function chips(items, selected) {
    return (
      '<div class="ex-chips">' +
      items
        .map(function (label) {
          return '<span class="ex-chip' + (label === selected ? ' on' : '') + '">' + label + '</span>';
        })
        .join('') +
      '</div>'
    );
  }

  function switchRow(title) {
    return (
      '<div class="ex-switch"><span class="ex-opt-title">' +
      title +
      '</span><span class="ex-toggle"></span></div>'
    );
  }

  function startRow() {
    return '<div class="ex-start-row"><span class="ex-lamp"></span><span class="ex-start">' + (ph.start || 'Start') + '</span></div>';
  }

  function opt(title, body) {
    return '<p class="ex-opt-title">' + title + '</p>' + body;
  }

  function exerciseScreenMarkup(n) {
    const step = data.steps[n - 1];
    const oct = chips(['C3', 'C4', 'C5', 'C6'], 'C4');
    const head =
      '<p class="ex-back">' + (ph.back || 'Naar start') + '</p>' +
      '<h2 class="ex-title">' + n + '. ' + step.title + '</h2>' +
      '<p class="ex-sub">' + step.body + '</p>';
    let mid = '';
    if (n === 1) {
      mid = opt(ph.octave || 'Octaaf', oct) + switchRow(ph.sing || 'Inzingen of naspelen') +
        '<div class="ex-stage"><span class="ex-orb"></span></div>';
    } else if (n === 2) {
      mid = switchRow(ph.cue || 'Voorbeeldtoon') + opt(ph.tones || 'Tonen', oct) + opt(ph.slider || 'Schuif', oct) +
        '<div class="ex-letter"><p class="ex-kicker">' + (ph.letter || 'Nootletter') + '</p><p class="ex-letter-g">G</p></div>';
    } else if (n === 3) {
      mid = opt(ph.firstTone || 'Eerste toon', oct) + opt(ph.octaves || 'Octaven', chips(['1', '2', '3', '4'], '1')) +
        '<div class="ex-stage"><span class="ex-orb sm"></span><span class="ex-gap"></span><span class="ex-orb sm"></span></div>';
    } else if (n === 4) {
      mid = '<p class="ex-tag">' + (ph.tagMelody || 'een opeenvolging van klanken') + '</p>' +
        opt(ph.notesN || 'Noten', chips(['2', '3', '4'], '2')) + opt(ph.octave || 'Octaaf', oct) +
        '<div class="ex-contour c2"><i></i><i></i><i></i><i></i></div>';
    } else if (n === 5) {
      mid = opt(ph.notesN || 'Noten', chips(['3'], '3')) + opt(ph.octave || 'Octaaf', oct) +
        '<div class="ex-contour c3"><i></i><i></i><i></i><i></i><i></i><i></i></div>';
    } else if (n === 6) {
      mid = '<p class="ex-tag">' + (ph.tagChord || 'een samenklank innerlijk vast') + '</p>' +
        opt(ph.sound || 'Samenklank', chips([ph.triad || 'Drieklank', ph.seventh || 'Vierklank'], ph.triad || 'Drieklank')) +
        opt(ph.voicing || 'Ligging', chips([ph.root || 'Grondligging', ph.inv1 || '1e omkering'], ph.root || 'Grondligging')) +
        '<div class="ex-stage chord"><span class="ex-orb sm"></span><span class="ex-orb sm"></span><span class="ex-orb sm"></span></div>';
    } else if (n === 7) {
      mid = '<p class="ex-tag">' + (ph.tagHarmony || 'gelijktijdige klanken') + '</p>' +
        opt(ph.quality || 'Kwaliteit', chips([ph.major || 'Majeur', ph.minor || 'Mineur'], ph.major || 'Majeur')) +
        opt(ph.find || 'Zoek', chips([ph.third || 'Terts', ph.fifth || 'Kwint'], ph.third || 'Terts')) +
        '<div class="ex-slider"><span class="ex-thumb"></span></div>';
    } else if (n === 8) {
      mid = '<p class="ex-tag">' + (ph.tagExt || '9, 11 of 13 bij een akkoord') + '</p>' +
        opt(ph.ext || 'Extensie', chips(['9', '11', '13'], '9')) +
        opt(ph.given || 'Gegeven', chips([ph.triad || 'Drieklank', ph.seventh || 'Vierklank', ph.shell || 'Shell'], ph.triad || 'Drieklank')) +
        '<div class="ex-slider"><span class="ex-thumb"></span></div>';
    } else if (n === 9) {
      mid = '<p class="ex-tag">' + (ph.tagProg || 'opeenvolgende samenklanken') + '</p>' +
        switchRow(ph.tonic || 'Hoor de tonica') +
        opt(ph.pattern || 'Patroon', chips(['1-4-5', ph.cadence || 'Cadens', ph.free || 'Vrij'], '1-4-5')) +
        '<div class="ex-degrees"><span class="on">I</span><span>IV</span><span>V</span></div>';
    } else {
      const cells = [0, 4, 8, 12];
      let grid = '';
      for (let i = 0; i < 16; i += 1) {
        grid += '<span' + (cells.indexOf(i) >= 0 ? ' class="on"' : '') + '></span>';
      }
      mid = '<p class="ex-tag">' + (ph.tagRhythm || 'tijd tussen klanken') + '</p>' +
        opt(ph.source || 'Bron', chips([ph.preset || 'Voorbeeld', ph.compose || 'Zelf tikken'], ph.preset || 'Voorbeeld')) +
        opt(ph.meter || 'Maatsoort', chips(['4/4', '3/4'], '4/4')) +
        '<div class="ex-rhythm">' + grid + '</div>';
    }
    return '<div class="ex-screen" id="app-inner">' + head + mid + startRow() + '</div>';
  }

  
  function langChips() {
    var cur = (window.SITE && window.SITE.lang) || 'nl';
    var items = [
      ['nl', 'Nederlands'],
      ['en', 'English'],
      ['de', 'Deutsch'],
      ['fr', 'Français'],
      ['es', 'Español'],
    ];
    return (
      '<div class="chips">' +
      items
        .map(function (it) {
          return '<span class="chip' + (it[0] === cur ? ' on' : '') + '">' + it[1] + '</span>';
        })
        .join('') +
      '</div>'
    );
  }

  function homeScreenMarkup() {
    return (
      '<div class="launcher" id="launcher"><div class="wallpaper"></div>' +
      '<p class="clock">9:41</p><p class="date">' + (ph.date || 'zaterdag 5 september') + '</p>' +
      '<div class="grid">' +
      '<div class="app-icon" data-hue="klok"><span>' + (ph.clock || 'Klok') + '</span></div>' +
      '<div class="app-icon" data-hue="weer"><span>' + (ph.weather || 'Weer') + '</span></div>' +
      '<div class="app-icon" data-hue="notities"><span>' + (ph.notes || 'Notities') + '</span></div>' +
      '<div class="app-icon" data-hue="foto"><span>' + (ph.photos || 'Foto') + '</span></div>' +
      '<div class="app-icon" data-hue="muziek"><span>' + (ph.music || 'Muziek') + '</span></div>' +
      '<div class="app-icon" data-hue="mail"><span>' + (ph.mail || 'Mail') + '</span></div>' +
      '<div class="app-icon" data-hue="agenda"><span>' + (ph.cal || 'Agenda') + '</span></div>' +
      '<div class="app-icon" data-hue="kaart"><span>' + (ph.map || 'Kaart') + '</span></div>' +
      '</div><div class="dock">' +
      '<div class="app-icon" data-hue="tel"></div><div class="app-icon" data-hue="msg"></div>' +
      '<div class="app-icon" data-hue="web"></div>' +
      '<div class="app-icon is-audiation" id="app-icon" title="Audiation"><span class="mark">A</span></div>' +
      '</div></div>' +
      '<div class="app" id="app"><div class="splash" id="splash">Audiation</div>' +
      '<div class="app-body" id="app-body"><div class="app-inner" id="app-inner">' +
      '<h2 class="app-title">Audiation</h2>' + langChips() +
      '<section class="panel" id="intro"><h3>' + (ph.howTitle || 'Hoe en waarom') + '</h3>' +
      '<p><b>' + (ph.forWho || 'Voor wie.') + '</b>' + (ph.forWhoBody || ' Inleiding tot audiation, vanaf ongeveer 7 jaar.') + '</p>' +
      '<p><b>' + (ph.what || 'Wat.') + '</b>' + (ph.whatBody || ' Muziek horen in je hoofd. Ook als het stil is.') + '</p>' +
      '<p><b>' + (ph.why || 'Waarom.') + '</b>' + (ph.whyBody || ' Innerlijk horen, niet nadoen van vingers.') + '</p>' +
      '<p><b>' + (ph.how || 'Hoe.') + '</b>' + (ph.howBody || ' Tien stappen, van boven naar beneden.') + '</p></section>' +
      '<h3 class="practice-title">' + (ph.practice || 'Oefenen') + '</h3>' +
      '<p class="practice-hint">' + (ph.practiceHint || 'Werk van boven naar beneden.') + '</p>' +
      '<div id="cards"></div></div></div></div>' +
      '<div class="finger" id="finger"></div>'
    );
  }

  function phoneMarkup() {
    const open = mode === 'exercise' ? ' is-open is-exercise' : '';
    const inner = mode === 'exercise' ? exerciseScreenMarkup(exerciseN) : homeScreenMarkup();
    return (
      '<div class="phone" aria-hidden="true"><div class="bezel"><div class="screen' +
      open +
      '" id="screen">' +
      '<div class="status"><span>9:41</span><span class="pill"></span><span class="signal">...</span></div>' +
      inner +
      '<div class="home-bar"></div></div></div></div>'
    );
  }

  function copyMarkup(labels) {
    return (
      '<aside class="copy"><p class="kicker" id="kicker"></p>' +
      '<h2 class="copy-title" id="copyTitle"></h2>' +
      '<div class="copy-body" id="copyBody">' +
      '<section><h3>' + labels.who + '</h3><p id="who"></p></section>' +
      '<section><h3>' + labels.why + '</h3><p id="why"></p></section>' +
      '<section><h3>' + labels.can + '</h3><p id="can"></p></section>' +
      '<section><h3>' + labels.how + '</h3><p id="how"></p></section>' +
      (labels.harder
        ? '<section><h3>' + labels.harder + '</h3><p id="harder"></p></section>'
        : '') +
      '</div><div class="dots" id="dots" hidden></div></aside>'
    );
  }

  function homeScenes() {
    const open = data.homeCopy;
    const scenes = [
      { id: 'launcher', ...open[0] },
      { id: 'tap', ...open[1] },
      { id: 'open', ...open[2] },
      { id: 'home', ...open[3], highlight: 'intro' },
    ];
    data.steps.forEach((step, i) => {
      const copy = data.homeSteps[i];
      scenes.push({
        id: 'step-' + (i + 1),
        kicker: (ui.step || 'Stap') + ' ' + (i + 1),
        title: i + 1 + '. ' + step.title,
        who: copy.who,
        why: copy.why,
        can: copy.can,
        how: copy.how,
        highlight: 'step-' + (i + 1),
        step: i,
      });
    });
    return scenes;
  }

  function exerciseScenes(n) {
    const step = data.steps[n - 1];
    const deep = data.exercises[n - 1];
    const inPad = (ui.inPad || 'Stap {n} van tien: {title}.').replace('{n}', n).replace('{title}', step.title);
    const shared = {
      who: inPad,
      why: deep.why,
      can: deep.does,
      how: deep.achieve,
      harder: deep.harder || '',
    };
    return [
      {
        id: 'focus',
        kicker: (ui.step || 'Stap') + ' ' + n,
        title: n + '. ' + step.title,
        highlight: 'step-' + n,
        step: n - 1,
        ...shared,
      },
    ];
  }

  const labels = mode === 'exercise' ? LABELS_EX : LABELS_HOME;
  const scenes = mode === 'exercise' ? exerciseScenes(exerciseN) : homeScenes();
  const tour = document.getElementById('tour');
  tour.innerHTML = phoneMarkup() + copyMarkup(labels);

  const screen = document.getElementById('screen');
  const finger = document.getElementById('finger');
  const appIcon = document.getElementById('app-icon');
  const cardsEl = document.getElementById('cards');
  const appInner = document.getElementById('app-inner');
  const kickerEl = document.getElementById('kicker');
  const titleEl = document.getElementById('copyTitle');
  const whoEl = document.getElementById('who');
  const whyEl = document.getElementById('why');
  const canEl = document.getElementById('can');
  const howEl = document.getElementById('how');
  const harderEl = document.getElementById('harder');
  const dotsEl = document.getElementById('dots');
  const hintEl = document.getElementById('hint');
  const replayBtn = document.getElementById('replay');
  const nextBtn = document.getElementById('next');
  const after = document.getElementById('after');
  const bar = document.getElementById('bar');

  let index = 0;
  let view = 'phone';
  let tapTimer = 0;
  let done = false;

  function renderCards() {
    if (!cardsEl) return;
    cardsEl.innerHTML = data.steps
      .map((step, i) => {
        const n = i + 1;
        const levelClass = step.levelClass ? ' ' + step.levelClass : '';
        return (
          '<article class="card" id="step-' + n + '">' +
          '<div class="card-head"><span class="step">' + n + '</span>' +
          '<span class="level' + levelClass + '">' + step.level + '</span></div>' +
          '<h4>' + step.title + '</h4><p>' + step.body + '</p></article>'
        );
      })
      .join('');
  }

  function renderDots() {
    dotsEl.hidden = false;
    dotsEl.innerHTML = data.steps.map((_, i) => '<span class="dot" data-n="' + (i + 1) + '"></span>').join('');
  }

  function renderMenu(el) {
    if (!el) return;
    el.innerHTML = data.steps
      .map((step, i) => {
        const n = i + 1;
        return (
          '<a href="/oefening-' + n + '.html' + ((window.SITE && window.SITE.lang) ? ('?lang=' + window.SITE.lang) : '') + '">' +
          '<span class="ex-n">' + n + '</span>' +
          '<span class="ex-title">' + step.title + '</span>' +
          '<span class="ex-body">' + step.body + '</span></a>'
        );
      })
      .join('');
  }

  function placeFinger() {
    if (!finger || !appIcon) return;
    const screenBox = screen.getBoundingClientRect();
    const iconBox = appIcon.getBoundingClientRect();
    finger.style.left = iconBox.left - screenBox.left + iconBox.width / 2 + 'px';
    finger.style.top = iconBox.top - screenBox.top + iconBox.height / 2 + 'px';
  }

  function scrollToId(id) {
    if (!appInner) return;
    if (!id || id === 'intro') {
      appInner.style.transform = 'translateY(0)';
      return;
    }
    const target = document.getElementById(id);
    if (!target) return;
    appInner.style.transform = 'translateY(' + -Math.max(0, target.offsetTop - 28) + 'px)';
  }

  function setStage(scene) {
    window.clearTimeout(tapTimer);
    if (mode === 'exercise') return;
    screen.classList.toggle('is-finger', scene.id === 'tap');
    screen.classList.toggle('is-press', false);
    screen.classList.toggle('is-open', scene.id !== 'launcher' && scene.id !== 'tap');
    screen.classList.toggle('is-splash', scene.id === 'open');
    screen.classList.toggle('is-tour', Boolean(scene.highlight));
    document.querySelectorAll('.card.on, .panel.on').forEach((node) => node.classList.remove('on'));
    if (scene.highlight) {
      const node = document.getElementById(scene.highlight);
      if (node) node.classList.add('on');
      scrollToId(scene.highlight);
    } else {
      scrollToId(null);
    }
    document.querySelectorAll('.dot').forEach((dot) => {
      const n = Number(dot.getAttribute('data-n'));
      dot.classList.toggle('on', scene.step !== undefined && n === scene.step + 1);
    });
    dotsEl.classList.toggle('is-on', scene.step !== undefined);
    if (scene.id === 'launcher' || scene.id === 'tap') placeFinger();
    if (scene.id === 'tap' && view === 'phone') {
      tapTimer = window.setTimeout(() => screen.classList.add('is-press'), 400);
    }
  }

  function fillCopy(scene) {
    kickerEl.textContent = scene.kicker;
    titleEl.textContent = scene.title;
    whoEl.textContent = scene.who;
    whyEl.textContent = scene.why;
    canEl.textContent = scene.can;
    howEl.textContent = scene.how;
    if (harderEl) harderEl.textContent = scene.harder || '';
  }

  function setView(nextView) {
    view = nextView;
    tour.classList.toggle('is-phone', view === 'phone');
    tour.classList.toggle('is-text', view === 'text');
    if (hintEl) {
      hintEl.textContent =
        view === 'phone' ? (ui.hintPhone || 'Volgende toont de uitleg.') : (ui.hintText || 'Volgende toont het volgende scherm.');
    }
  }

  function showScene(to, nextView) {
    index = (to + scenes.length) % scenes.length;
    setView(nextView);
    fillCopy(scenes[index]);
    setStage(scenes[index]);
  }

  function showPlaying() {
    done = false;
    tour.hidden = false;
    if (bar) bar.hidden = false;
    showScene(0, 'phone');
  }

  function showDone() {
    done = true;
    window.clearTimeout(tapTimer);
    if (after) {
      after.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function next() {
    if (done) return;
    if (view === 'phone') {
      setView('text');
      return;
    }
    if (index === scenes.length - 1) {
      showDone();
      return;
    }
    showScene(index + 1, 'phone');
  }

  renderCards();
  renderDots();
  renderMenu(document.getElementById('ex-menu'));
  renderMenu(document.getElementById('nav-ex'));
  showPlaying();

  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      window.clearTimeout(tapTimer);
      showPlaying();
    });
  }
  const replayAfter = document.getElementById('replay-after');
  if (replayAfter) replayAfter.addEventListener('click', showPlaying);
  if (nextBtn) nextBtn.addEventListener('click', next);
  window.addEventListener('resize', placeFinger);
})();
