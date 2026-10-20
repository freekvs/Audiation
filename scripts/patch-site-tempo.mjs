import fs from 'node:fs';

const path = 'G:/users/freek/Audiation/site/i18n.js';
const raw = fs.readFileSync(path, 'utf8');
const json = raw.replace(/^window\.SITE_I18N\s*=\s*/, '').replace(/;\s*$/, '');
const data = JSON.parse(json);

const COUNT = {
  nl: [
    ['Oefening 1-10', 'Oefening 1-11'],
    ['1 tot 10', '1 tot 11'],
    ['tien oefeningen', 'elf oefeningen'],
    ['van tien:', 'van elf:'],
    ['tien stappen', 'elf stappen'],
    [' Tien stappen,', ' Elf stappen,'],
    ['Daarna tien stappen', 'Daarna elf stappen'],
  ],
  en: [
    ['Exercises 1-10', 'Exercises 1-11'],
    ['1 to 10', '1 to 11'],
    ['the ten exercises', 'the eleven exercises'],
    ['of ten:', 'of eleven:'],
    ['ten steps', 'eleven steps'],
    [' Ten steps,', ' Eleven steps,'],
    ['Then ten steps', 'Then eleven steps'],
  ],
  de: [
    ['Übung 1-10', 'Übung 1-11'],
    ['1 bis 10', '1 bis 11'],
    ['zehn Übungen', 'elf Übungen'],
    ['von zehn:', 'von elf:'],
    ['zehn Schritten', 'elf Schritten'],
    ['zehn Schritte', 'elf Schritte'],
    [' Zehn Schritte,', ' Elf Schritte,'],
    ['Dann zehn Schritte', 'Dann elf Schritte'],
  ],
  fr: [
    ['Exercices 1-10', 'Exercices 1-11'],
    ['1 à 10', '1 à 11'],
    ['les dix exercices', 'les onze exercices'],
    ['sur dix :', 'sur onze :'],
    ['dix étapes', 'onze étapes'],
    [' Dix étapes,', ' Onze étapes,'],
    ['Ensuite dix étapes', 'Ensuite onze étapes'],
  ],
  es: [
    ['Ejercicios 1-10', 'Ejercicios 1-11'],
    ['1 a 10', '1 a 11'],
    ['las diez prácticas', 'las once prácticas'],
    ['de diez:', 'de once:'],
    ['diez pasos', 'once pasos'],
    [' Diez pasos,', ' Once pasos,'],
    ['Luego diez pasos', 'Luego once pasos'],
  ],
};

function applyCount(str, pairs) {
  let out = str;
  for (const [from, to] of pairs) out = out.split(from).join(to);
  return out;
}

const PHONE = {
  nl: {
    tagTempo: 'slagen per minuut',
    bpm: 'Slagen per minuut',
    tapValue: 'Tik deze waarde',
    whole: 'Hele',
    half: 'Halve',
    quarter: 'Kwart',
    eighth: 'Achtste',
    sixteenth: 'Zestiende',
    triplet: 'Triool',
    tap: 'Tik',
  },
  en: {
    tagTempo: 'beats per minute',
    bpm: 'Beats per minute',
    tapValue: 'Tap this value',
    whole: 'Whole',
    half: 'Half',
    quarter: 'Quarter',
    eighth: 'Eighth',
    sixteenth: 'Sixteenth',
    triplet: 'Triplet',
    tap: 'Tap',
  },
  de: {
    tagTempo: 'Schläge pro Minute',
    bpm: 'Schläge pro Minute',
    tapValue: 'Tippe diesen Wert',
    whole: 'Ganze',
    half: 'Halbe',
    quarter: 'Viertel',
    eighth: 'Achtel',
    sixteenth: 'Sechzehntel',
    triplet: 'Triole',
    tap: 'Tipp',
  },
  fr: {
    tagTempo: 'battements par minute',
    bpm: 'Battements par minute',
    tapValue: 'Tape cette valeur',
    whole: 'Ronde',
    half: 'Blanche',
    quarter: 'Noire',
    eighth: 'Croche',
    sixteenth: 'Double croche',
    triplet: 'Triolet',
    tap: 'Tape',
  },
  es: {
    tagTempo: 'pulsos por minuto',
    bpm: 'Pulsos por minuto',
    tapValue: 'Marca este valor',
    whole: 'Redonda',
    half: 'Blanca',
    quarter: 'Negra',
    eighth: 'Corchea',
    sixteenth: 'Semicorchea',
    triplet: 'Tresillo',
    tap: 'Marca',
  },
};

const STEP = {
  nl: {
    title: 'Tempo',
    level: 'Volgende stap',
    levelClass: 'next',
    body: 'Stel de metronoom in. Tik een nootwaarde tegen die slag: hele tot zestiende, of triool.',
  },
  en: {
    title: 'Tempo',
    level: 'Next step',
    levelClass: 'next',
    body: 'Set the metronome. Tap a note value against that beat: whole to sixteenth, or triplet.',
  },
  de: {
    title: 'Tempo',
    level: 'Nächster Schritt',
    levelClass: 'next',
    body: 'Stell das Metronom ein. Tippe einen Notenwert gegen diesen Schlag: Ganze bis Sechzehntel, oder Triole.',
  },
  fr: {
    title: 'Tempo',
    level: 'Étape suivante',
    levelClass: 'next',
    body: 'Règle le métronome. Tape une valeur de note contre ce temps : ronde à double croche, ou triolet.',
  },
  es: {
    title: 'Tempo',
    level: 'Siguiente paso',
    levelClass: 'next',
    body: 'Ajusta el metrónomo. Marca un valor de nota contra ese pulso: redonda a semicorchea, o tresillo.',
  },
};

const HOME_STEP = {
  nl: {
    who: 'Wie ritme al oefent en nu het tempo van de slag wil voelen: hoeveel slagen per minuut.',
    why: 'Tempo is de snelheid van de puls. Het doel is die slag innerlijk te houden en een nootwaarde ertegen te tikken, niet een cijfer te raden.',
    can: 'Een metronoom op een bekend tempo zetten en een gekozen nootwaarde — hele tot zestiende, of triool — op de slag tikken.',
    how: 'Stel de schuif in. Kies wat je tikt. De slag is de kwartnoot in 4/4. Meet eerst de tikvertraging als muis, vinger of Bluetooth laat aanvoelt.',
  },
  en: {
    who: 'Who already practises rhythm and now wants to feel the tempo of the beat: how many beats per minute.',
    why: 'Tempo is the speed of the pulse. The aim is to hold that beat inwardly and tap a note value against it, not to guess a number.',
    can: 'Set a metronome to a known tempo and tap a chosen note value — whole to sixteenth, or triplet — on the beat.',
    how: 'Set the slider. Choose what you tap. The beat is the quarter note in 4/4. First measure tap delay if mouse, finger or Bluetooth feels late.',
  },
  de: {
    who: 'Wer Rhythmus schon übt und jetzt das Tempo des Schlags spüren will: wie viele Schläge pro Minute.',
    why: 'Tempo ist die Geschwindigkeit des Pulses. Das Ziel ist, diesen Schlag innerlich zu halten und einen Notenwert dagegen zu tippen, nicht eine Zahl zu raten.',
    can: 'Ein Metronom auf ein bekanntes Tempo stellen und einen gewählten Notenwert — Ganze bis Sechzehntel, oder Triole — auf den Schlag tippen.',
    how: 'Stell den Schieber. Wähle, was du tippst. Der Schlag ist die Viertelnote in 4/4. Miss zuerst die Tippverzögerung, wenn Maus, Finger oder Bluetooth spät wirken.',
  },
  fr: {
    who: 'Qui pratique déjà le rythme et veut maintenant sentir le tempo du temps : combien de battements par minute.',
    why: 'Le tempo est la vitesse de la pulsation. Le but est de tenir ce temps intérieurement et de taper une valeur de note contre lui, pas de deviner un chiffre.',
    can: 'Régler un métronome sur un tempo connu et taper une valeur choisie — ronde à double croche, ou triolet — sur le temps.',
    how: 'Règle le curseur. Choisis ce que tu tapes. Le temps est la noire en 4/4. Mesure d’abord le délai du tap si souris, doigt ou Bluetooth semble tard.',
  },
  es: {
    who: 'Quien ya practica el ritmo y ahora quiere sentir el tempo del pulso: cuántos pulsos por minuto.',
    why: 'El tempo es la velocidad del pulso. El objetivo es sujetar ese pulso por dentro y marcar un valor de nota contra él, no adivinar un número.',
    can: 'Poner un metrónomo a un tempo conocido y marcar un valor elegido — redonda a semicorchea, o tresillo — en el pulso.',
    how: 'Ajusta el deslizador. Elige qué marcas. El pulso es la negra en 4/4. Primero mide el retraso del toque si ratón, dedo o Bluetooth se sienten tarde.',
  },
};

const EXERCISE = {
  nl: {
    why: 'Ritme is het patroon in de tijd. Tempo is hoe snel die tijd loopt: slagen per minuut. Deze oefening bestaat omdat wie alleen patronen natikt, de snelheid van de puls nog niet als iets eigens voelt. 60 is geen cijfer op een scherm; het is een slag die je innerlijk kunt houden. De metronoom blijft klinken, zodat je anticipeert op de slag die je hoort.',
    does: 'Je zet de metronoom (40–180). Een slag is de kwartnoot in 4/4. Je tikt een gekozen waarde: hele, halve, kwart, achtste, zestiende of triool (drie achtsten per slag). De ronde duurt minstens tien seconden en stopt op een maatstreep. Optioneel wordt de metronoom stil na de tel. Meet de tikvertraging als muis, vinger of Bluetooth laat aankomt: daarna klinkt de klik zoveel eerder.',
    achieve: 'Je voelt wat 60 of 120 slagen per minuut is, en je kunt een onderverdeling tegen die slag zetten. Dat is dirigeren zonder stok, samenspelen zonder achter de klik aan te hollen, en later een tempo aanhouden als de metronoom wegvalt. Wie ritme én tempo innerlijk heeft, hoort wanneer — en hoe snel.',
    harder:
      'Begin op 60, kwartnoten, metronoom aan. Als die slag vastzit: halve of achtste, dan zestiende of triool. Daarna een ander tempo op de schuif. Zwaarder: metronoom stil na de tel. Meet de tikvertraging op elk apparaat of koptelefoon; Bluetooth is later.',
  },
  en: {
    why: 'Rhythm is the pattern in time. Tempo is how fast that time runs: beats per minute. This exercise exists because who only taps patterns back does not yet feel the speed of the pulse as its own thing. 60 is not a number on a screen; it is a beat you can hold inwardly. The metronome stays sounding, so you anticipate the beat you hear.',
    does: 'You set the metronome (40–180). A beat is the quarter note in 4/4. You tap a chosen value: whole, half, quarter, eighth, sixteenth or triplet (three eighths per beat). The round lasts at least ten seconds and ends on a barline. Optionally the metronome is silent after the count. Measure tap delay if mouse, finger or Bluetooth arrives late: then the click sounds that much earlier.',
    achieve: 'You feel what 60 or 120 beats per minute is, and you can put a subdivision against that beat. That is conducting without a stick, playing together without chasing the click, and later holding a tempo when the metronome drops out. Who has rhythm and tempo inwardly hears when — and how fast.',
    harder:
      'Start at 60, quarter notes, metronome on. When that beat holds: half or eighth, then sixteenth or triplet. Then another tempo on the slider. Harder: metronome silent after the count. Measure tap delay on each device or headphones; Bluetooth is later.',
  },
  de: {
    why: 'Rhythmus ist das Muster in der Zeit. Tempo ist, wie schnell diese Zeit läuft: Schläge pro Minute. Diese Übung existiert, weil wer nur Muster nachtippt, die Geschwindigkeit des Pulses noch nicht als Eigenes fühlt. 60 ist keine Zahl auf einem Bildschirm; es ist ein Schlag, den du innerlich halten kannst. Das Metronom bleibt klingen, damit du den Schlag vorwegnimmst, den du hörst.',
    does: 'Du stellst das Metronom (40–180). Ein Schlag ist die Viertelnote in 4/4. Du tippst einen gewählten Wert: Ganze, Halbe, Viertel, Achtel, Sechzehntel oder Triole (drei Achtel pro Schlag). Die Runde dauert mindestens zehn Sekunden und endet auf einem Taktstrich. Optional ist das Metronom nach dem Zählzeit still. Miss die Tippverzögerung, wenn Maus, Finger oder Bluetooth spät ankommen: danach klingt der Klick so viel früher.',
    achieve: 'Du spürst, was 60 oder 120 Schläge pro Minute sind, und kannst eine Unterteilung gegen diesen Schlag setzen. Das ist Dirigieren ohne Stock, Zusammenspiel ohne hinter dem Klick herzulaufen, und später ein Tempo halten, wenn das Metronom wegfällt. Wer Rhythmus und Tempo innerlich hat, hört wann — und wie schnell.',
    harder:
      'Beginne bei 60, Viertel, Metronom an. Wenn der Schlag hält: Halbe oder Achtel, dann Sechzehntel oder Triole. Dann ein anderes Tempo am Schieber. Schwerer: Metronom still nach dem Zählzeit. Miss die Tippverzögerung an jedem Gerät oder Kopfhörer; Bluetooth ist später.',
  },
  fr: {
    why: 'Le rythme est le motif dans le temps. Le tempo est la vitesse de ce temps : battements par minute. Cet exercice existe parce que qui ne fait que retaper des motifs ne sent pas encore la vitesse de la pulsation comme une chose à soi. 60 n’est pas un chiffre sur un écran ; c’est un temps que tu peux tenir intérieurement. Le métronome continue de sonner, pour que tu anticipes le temps que tu entends.',
    does: 'Tu règles le métronome (40–180). Un temps est la noire en 4/4. Tu tapes une valeur choisie : ronde, blanche, noire, croche, double croche ou triolet (trois croches par temps). La manche dure au moins dix secondes et s’arrête sur une barre de mesure. En option le métronome est silencieux après le compte. Mesure le délai du tap si souris, doigt ou Bluetooth arrive tard : ensuite le clic sonne d’autant plus tôt.',
    achieve: 'Tu sens ce que sont 60 ou 120 battements par minute, et tu peux poser une subdivision contre ce temps. C’est diriger sans baguette, jouer ensemble sans courir après le clic, et plus tard tenir un tempo quand le métronome s’arrête. Qui a rythme et tempo intérieurement entend quand — et à quelle vitesse.',
    harder:
      'Commence à 60, noires, métronome allumé. Quand ce temps tient : blanche ou croche, puis double croche ou triolet. Puis un autre tempo sur le curseur. Plus dur : métronome silencieux après le compte. Mesure le délai du tap sur chaque appareil ou casque ; le Bluetooth est plus tard.',
  },
  es: {
    why: 'El ritmo es el patrón en el tiempo. El tempo es lo rápido que corre ese tiempo: pulsos por minuto. Este ejercicio existe porque quien solo repite patrones aún no siente la velocidad del pulso como algo propio. 60 no es un número en una pantalla; es un pulso que puedes sujetar por dentro. El metrónomo sigue sonando, para que anticipes el pulso que oyes.',
    does: 'Ajustas el metrónomo (40–180). Un pulso es la negra en 4/4. Marcas un valor elegido: redonda, blanca, negra, corchea, semicorchea o tresillo (tres corcheas por pulso). La ronda dura al menos diez segundos y termina en una barra de compás. Opcional: el metrónomo en silencio tras la cuenta. Mide el retraso del toque si ratón, dedo o Bluetooth llega tarde: luego el clic suena tanto antes.',
    achieve: 'Sientes qué son 60 o 120 pulsos por minuto, y puedes poner una subdivisión contra ese pulso. Eso es dirigir sin batuta, tocar juntos sin ir detrás del clic, y más tarde mantener un tempo cuando el metrónomo desaparece. Quien tiene ritmo y tempo por dentro oye cuándo — y qué tan rápido.',
    harder:
      'Empieza en 60, negras, metrónomo encendido. Cuando ese pulso se sostiene: blanca o corchea, luego semicorchea o tresillo. Luego otro tempo en el deslizador. Más difícil: metrónomo en silencio tras la cuenta. Mide el retraso del toque en cada aparato o auriculares; Bluetooth es más tarde.',
  },
};

const langs = ['nl', 'en', 'de', 'fr', 'es'];
for (const lang of langs) {
  const pack = data[lang];
  if (!pack) throw new Error('missing lang ' + lang);
  const pairs = COUNT[lang];
  pack.ui.exercises = applyCount(pack.ui.exercises, pairs);
  pack.ui.homeLead = applyCount(pack.ui.homeLead, pairs);
  pack.ui.afterTitle = applyCount(pack.ui.afterTitle, pairs);
  pack.ui.inPad = applyCount(pack.ui.inPad, pairs);
  pack.phone.howBody = applyCount(pack.phone.howBody, pairs);
  pack.about.p3 = applyCount(pack.about.p3, pairs);
  pack.about.toEx = applyCount(pack.about.toEx, pairs);
  pack.homeCopy[3].how = applyCount(pack.homeCopy[3].how, pairs);
  Object.assign(pack.phone, PHONE[lang]);
  const rhythm = pack.steps[9];
  if (rhythm) {
    rhythm.level = pack.steps[8].level;
    rhythm.levelClass = '';
  }
  if (pack.steps.length === 10) {
    pack.steps.push(STEP[lang]);
    pack.homeSteps.push(HOME_STEP[lang]);
    pack.exercises.push(EXERCISE[lang]);
  } else {
    pack.steps[10] = STEP[lang];
    pack.homeSteps[10] = HOME_STEP[lang];
    pack.exercises[10] = EXERCISE[lang];
  }
}

fs.writeFileSync(path, 'window.SITE_I18N = ' + JSON.stringify(data, null, 2) + ';\n', 'utf8');
for (const lang of langs) {
  const p = data[lang];
  console.log(
    lang,
    'steps=' + p.steps.length,
    'home=' + p.homeSteps.length,
    'ex=' + p.exercises.length,
    JSON.stringify(p.ui.exercises),
    JSON.stringify(p.steps[10].title),
    JSON.stringify(p.phone.howBody),
    JSON.stringify(p.phone.quarter),
  );
}
