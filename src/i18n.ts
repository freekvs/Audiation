import { createContext, useContext } from 'react';
import { Platform } from 'react-native';

export type LocaleId = 'nl' | 'en';

export const LOCALE_OPTIONS: { id: LocaleId; label: string }[] = [
  { id: 'nl', label: 'Nederlands' },
  { id: 'en', label: 'English' },
];

export function fmt(
  template: string,
  vars: Record<string, string | number | undefined> = {},
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ''));
}

const nl = {
  language: {
    title: 'Taal',
    hint: 'Voor nu Nederlands of Engels. Later ook Duits, Frans en Spaans.',
    a11y: 'Taal {label}',
  },
  common: {
    back: 'Naar start',
    backA11y: 'Terug naar start',
    start: 'Start',
    startA11y: 'Start oefening',
    again: 'Opnieuw',
    next: 'Volgende',
    check: 'Controleer',
    listen: 'Luister',
    control: 'Controle',
    octave: 'Octaaf',
    tones: 'Tonen',
    slider: 'Schuif',
    together: 'Samen',
    options: 'Opties',
    noPitch: 'geen toon herkend',
    centsBeside: '{cents} cent naast {label}',
  },
  levels: {
    easy: 'Makkelijk',
    next: 'Volgende stap',
    open: 'Open',
    soon: 'Straks',
  },
  home: {
    howTitle: 'Hoe en waarom',
    forWhoLead: 'Voor wie. ',
    forWhoBody:
      'Een inleiding tot audiation. Oefeningen voor een breed publiek, vanaf ongeveer 7 jaar. Je test je innerlijke muzikaliteit en kunt die door oefenen scherpen. Het zijn basisvaardigheden, met oplopende moeilijkheid. Geen geavanceerde onderwerpen, en geen volledigheid. Wel bruikbaarheid. Veel muzikaal plezier.',
    whatLead: 'Wat. ',
    whatBody:
      'Audiation is muziek horen in je hoofd. De toon is er ook als het stil is. Niet de toets, niet de naam: de klank die je vasthoudt.',
    whyLead: 'Waarom. ',
    whyBody:
      'Wie innerlijk hoort, kan naspelen, zingen en later samenklank volgen. Zonder dat blijft muziek nadoen van vingers.',
    howLead: 'Hoe. ',
    howBody:
      'Eerst één toon in de stilte. Dan een nootletter zoeken met de schuif. Dan de afstand tussen twee tonen. Dan de lijn van een korte melodie. Dan die lijn achterstevoren. Dan één akkoord vasthouden: drieklank of vierklank. Dan een tweede toon bij een klinkende toon: majeur of mineur. Dan extensies: 9, 11 of 13 bij een klinkend akkoord. Dan progressies: akkoorden na elkaar, de trede van de grondtoon. Dan ritme: luisteren en natikken. Namen (Do of 1) komen ná het horen, behalve bij noot zoeken: daar is de letter het doel. Zingen of een instrument is een check, niet het doel.',
    moreTitle: 'Meer over audiation',
    moreA11y: 'Meer over audiation',
    moreOpen: 'Open',
    moreClose: 'Sluit',
    moreHint: 'Gevoel, karakter en identiteit.',
    feelingLead: 'Gevoel. ',
    feelingBody:
      'Je ervaart muziek met gevoel. Dat is hoe muziek bij je binnenkomt. Gevoel is echt, en het wisselt.',
    characterLead: 'Karakter. ',
    characterBody:
      'Het karakter van een noot, een interval of een harmonie komt uit het gebruik. Dezelfde C speelt ergens anders een andere rol. Karakter is variabel.',
    identityLead: 'Identiteit. ',
    identityBody:
      'Wat stabiel blijft is de identiteit van die drie. Audiation is die identiteit herkennen, ook als het stil is.',
    practiceTitle: 'Oefenen',
    practiceHint:
      'Werk van boven naar beneden. Opties in een oefening gaan van makkelijk naar moeilijk.',
    simpleTitle: 'Meest 1-voudige instellingen',
    simpleHint:
      'Voor een nieuwe of beginnende gebruiker. Zet alle oefeningen op de makkelijkste opties: één octaaf, voorbeeldtoon aan, één kwaliteit, korte lijnen. Daarna kun je per oefening uitbreiden.',
    simpleButton: 'Meest 1-voudige instellingen',
    simpleDone: 'Alle oefeningen staan op de eenvoudigste stand.',
    simpleA11y: 'Zet alle oefeningen op de meest eenvoudige instellingen',
    savedTitle: 'Mijn instellingen',
    savedButton: 'Sla instellingen op',
    savedDone: 'Je huidige stand is opgeslagen.',
    savedApply: 'Zet mijn instellingen',
    savedA11y: 'Sla de huidige oefeninstellingen op',
    savedApplyA11y: 'Zet je opgeslagen instellingen terug',
    advancedTitle: 'Gevorderd',
    advancedHint: 'Klinkkarakter. Eerst sec. Daarna combo, band of orkest.',
    toolsTitle: 'Gereedschap',
    toolKicker: 'Gereedschap',
    stepA11y: 'Stap {step}, {title}, {level}',
    soonA11y: '{step}. {title}, straks',
    toolA11y: 'Gereedschap {title}',
  },
  about: {
    title: 'Over Audiation',
    a11y: 'Over Audiation',
    beta: 'Beta',
    developed: 'Ontwikkeld door Freek van Steijn, met Cursor.',
    emailLabel: 'E-mail',
    copyright: '© {year} Freek van Steijn. Alle rechten voorbehouden.',
    disclaimer:
      'Je gebruikt deze app op eigen risico. Ik ben niet verantwoordelijk voor enige schade die voortvloeit uit het gebruik van de app.',
  },
  naming: {
    title: 'Benaming',
    hint: 'Alleen de trede in C-majeur. De nootnaam C D E blijft ernaast.',
    a11y: 'Benaming {hint}',
  },
  klank: {
    title: 'Klinkkarakter',
    hint: 'Geen instrumenten. Hoe stemmen samen spreken. Sec is de basis.',
    a11y: 'Klinkkarakter {label}',
    sec: 'Sec',
    combo: 'Combo',
    band: 'Band',
    orchestra: 'Orkest',
    random: 'Aselect',
  },
  help: {
    moreA11y: 'Meer over {term}',
    cMajorTitle: 'C-majeur',
    cMajor:
      'Een toonladder is een vaste volgorde van afstanden. Majeur: heel, heel, half, heel, heel, heel, half. In C is dat C D E F G A B C. E–F en B–C zijn de halve tonen; de rest hele. Dat zijn de witte toetsen van C tot C.',
    triadTitle: 'Drieklank / vierklank',
    triad:
      'Je bouwt ze uit de ladder door telkens één toon over te slaan. Die sprong is een terts. Nog eens overslaan: de kwint vanaf de grondtoon. Drieklank: grondtoon, terts, kwint. Vierklank: nóg een terts erbij (de septiem). In C onthoud je C–E–G–B–D–F–A–C. Begin waar je wilt: drie tonen is een drieklank, vier een vierklank. C–E–G is C. D–F–A is D. En zo verder.',
    voicingTitle: 'Ligging',
    voicing:
      'Ligging is welke toon van het akkoord het laagst klinkt. De samenklank blijft dezelfde. Grondligging: de grondtoon onderop. C–E–G met C onder. Eerste omkering: de terts onderop. E–G–C. Tweede omkering: de kwint onderop. G–C–E. Derde omkering alleen bij vierklank: de septiem onderop. Bij C–E–G–B is dat B onder.',
    modesTitle: 'Modes',
    modes:
      'Een mode is een ladder van zeven treden. De halve tonen staan ergens anders dan in majeur. Hier allemaal vanaf C. Ionian is C-majeur: heel–heel–half–heel–heel–heel–half. C D E F G A B. Dorian: heel–half–heel–heel–heel–half–heel. C D E♭ F G A B♭. Mineurkleur, grote sext. Phrygian: half–heel–heel–heel–half–heel–heel. C D♭ E♭ F G A♭ B♭. Lydian: heel–heel–heel–half–heel–heel–half. C D E F♯ G A B. Majeurkleur, overmatige kwart. Mixolydian: heel–heel–half–heel–heel–half–heel. C D E F G A B♭. Majeurkleur, kleine septiem. Aeolian is natural minor, de zesde mode van majeur. Relatief: A natural minor deelt de noten van C-majeur; start op La / 6. Parallel op C: heel–half–heel–heel–half–heel–heel. C D E♭ F G A♭ B♭. Locrian: half–heel–heel–half–heel–heel–heel. C D♭ E♭ F G♭ A♭ B♭.',
    minorTitle: 'Mineur',
    minor:
      'Drie mineurladders vanaf C. Allemaal kleine terts (E♭). Ze verschillen in de 6e en 7e trede. Natural minor is Aeolian: de zesde mode van majeur. C-majeur en A natural minor zijn dezelfde noten; je start op La / 6. Dat is de relatieve mineur. Parallel vanaf C: 6e en 7e klein. C D E♭ F G A♭ B♭. Harmonic minor: 7e groot, als leidtoon. C D E♭ F G A♭ B. De sprong A♭–B is drie halve tonen. Melodic minor: 6e en 7e groot. C D E♭ F G A B. Harmonic major hoort bij de verwanten: majeur met kleine sext. C D E F G A♭ B.',
    cadenceTitle: 'Cadens',
    cadence:
      'Een cadens is een veelgebruikte sluiting. Authentiek: 5–1. Plagaal: 4–1. Halfslot: blijft op 5, vanuit 1, 2 of 4. Bedrieglijk: 5–6 in plaats van 1. 2–5–1 is de jazzcadens naar 1. Drieklank of vierklank; geen extensies (9, 11, 13).',
    thirdTitle: 'Terts / kwint',
    third:
      'Je hoeft de namen niet te kennen. Luister of het samen klopt. Terts is de kleinere stap naast de klinkende toon: majeur of mineur. Kwint is de grotere stap. Verminderd en overmatig zijn later.',
    extensionTitle: 'Extensie',
    extension:
      'Een extensie is een toon die je bij een klinkend akkoord voegt, boven de drieklank of vierklank. Dezelfde sprong als bij het bouwen van het akkoord: één toon overslaan. In C: C–E–G–B–D–F–A. Na de septiem (B) komt de 9 (D), de 11 (F) en de 13 (A). Die nummers tellen vanaf de grondtoon, ook als die grondtoon zelf niet klinkt. Hier geen verlaagde of verhoogde kleuren.',
    shellTitle: 'Gegeven',
    shell:
      'Gegeven is wat je hoort vóór je schuift. Drieklank: grondtoon, terts, kwint. Vierklank: plus de septiem. Shell: alleen terts en septiem, zonder grondtoon of kwint. De 9, 11 of 13 telt nog steeds vanaf die grondtoon.',
    simple:
      'Tik de knop om alle oefeningen op de makkelijkste stand te zetten. Eén octaaf, voorbeeldtoon aan, alleen majeur, drieklank in grondligging, korte lijnen, cadens met grondtoon. Klinkkarakter terug op sec. In een oefening kun je daarna zelf uitbreiden. Tik de knop opnieuw als je terug wilt naar eenvoudig.',
    saved:
      'Alleen als je in een oefening opties wijzigt. Ga je daarna naar start, dan wordt die stand bewaard als de jouwe. Ongewijzigd verlaten slaat niets extra op. Hier kun je die stand ook meteen opslaan of terugzetten, ook nadat je Meest 1-voudige hebt getikt.',
    advanced:
      'Open dit pas als sec vastzit: één kale toon, afstand of akkoord innerlijk vasthouden. Dit zijn geen nieuwe oefeningen. Dezelfde stappen, andere samenspraak. Zoals je in muziek van combo naar orkest luistert. Ritme, piano en ijking horen hier niet bij.',
    klank:
      'Kies hoe de oefentoon klinkt. Niet als piano of viool: als samenspraak. Sec eerst, altijd. Combo, band of orkest vast: één karakter de hele oefening, om te ontleden. Aselect: per nieuwe ronde een van die drie. Opnieuw in dezelfde ronde houdt hetzelfde karakter. Meest 1-voudige zet dit op sec.',
    klankSec:
      'Begin hier. Kale toon, minste kleur, meeste identiteit. Houd de toon of afstand vast in de stilte. Kom hierop terug als combo, band of orkest afleidt.',
    klankCombo:
      'Weinig stemmen, nog uit elkaar te horen. Alsof een klein ensemble samen speelt. Advies: kies dit als sec vastzit. Ontleed of je de toon nog hoort én de stemmen.',
    klankBand:
      'Dichter, meer aanzet. Alsof een popband samen klinkt. Advies: de identiteit moet de punch overleven. Niet eerder dan na sec, liever na combo.',
    klankOrchestra:
      'Meer massa, langere staart, stemmen versmelten. Alsof een groot orkest. Advies: ontleed of het nog de toon is, of alleen de wolk. Laatste vaste stap voor aselect.',
    klankRandom:
      'Elke nieuwe ronde combo, band of orkest. Zelfde oefening, andere samenspraak. Advies: pas als één vast karakter vastzit. Anders gaat het oor de kleur achterna, niet de toon.',
  },
  drone: {
    title: 'Dronegeluid',
    hint: 'Optioneel. Zachte strings: tonica, kwint (Sol) en de tonica een octaaf lager. Zo kun je de afstand plaatsen.',
    a11y: 'Dronegeluid in- of uitschakelen',
  },
  practice: {
    holdTone: {
      title: 'Toon vasthouden',
      body: 'Eén toon uit C-majeur. Stilte. Houd hem innerlijk vast.',
    },
    findNote: {
      title: 'Noot zoeken',
      body: 'Je ziet een letter. Optioneel hoor je die noot kort. Schuif daarna ernaartoe.',
    },
    interval: {
      title: 'Interval vasthouden',
      body: 'Twee tonen. Houd de afstand vast. Daarna: andere octaven, later andere toonsoorten.',
    },
    melody: {
      title: 'Melodie',
      tagline: 'een opeenvolging van klanken',
      body: 'De lijn van 2 tot 4 tonen in C-majeur. Tik de hoogtes. Geen namen, geen notenbalk.',
    },
    reverse: {
      title: 'Omkeren',
      body: 'Je hoort 3 tonen. Tik de lijn achterstevoren. Begint met de laatste toon.',
    },
    holdChord: {
      title: 'Akkoord vasthouden',
      tagline: 'één samenklank innerlijk vast',
      body: 'Je hoort één akkoord. Stilte. Houd de samenklank vast. Drieklank of vierklank; grondligging of omkering.',
    },
    harmony: {
      title: 'Harmonie',
      tagline: 'een gelijktijdig weergeven van verschillende klanken',
      body: 'Een toon klinkt. Schuif een tweede toon erbij tot het samen klopt. Eerst majeur of mineur; namen komen daarna.',
    },
    extension: {
      title: 'Extensies',
      tagline: '9, 11 of 13 bij een akkoord',
      body: 'Een akkoord klinkt. Schuif de gevraagde extensie erbij. Drieklank, vierklank of shell.',
    },
    progression: {
      title: 'Progressies',
      tagline: 'opeenvolgende samenklanken',
      body: 'Je hoort akkoorden na elkaar. Vul per akkoord de trede van de grondtoon in. In C.',
    },
    rhythm: {
      title: 'Ritme',
      tagline: 'tijd tussen klanken',
      body: 'Luister een 3/4- of 4/4-ritme en tik het na. Of tik er zelf één in. Daarna voorbeeld, jouw tikken, samen.',
    },
  },
  tools: {
    piano: {
      title: 'Piano',
      body: 'Klankbron. C-majeur octaaf, C1 tot C8.',
    },
    calibrate: {
      title: 'IJking',
      body: 'Alleen A440. Controleer of microfoon en app dezelfde La horen.',
    },
  },
  intervals: {
    names: [
      'prime',
      'kleine secunde',
      'grote secunde',
      'kleine terts',
      'grote terts',
      'reine kwart',
      'tritonus',
      'reine kwint',
      'kleine sext',
      'grote sext',
      'kleine septiem',
      'grote septiem',
      'octaaf',
    ],
    findNames: [
      'unison',
      'kleine secunde',
      'grote secunde',
      'kleine terts',
      'grote terts',
      'kwart',
      'overmatige kwart',
      'kwint',
      'kleine sext',
      'grote sext',
      'kleine septiem',
      'grote septiem',
      'octaaf',
    ],
    semitones: '{n} halve tonen',
    octave: 'octaaf',
    octaves: '{n} octaven',
    plusOctave: '{simple} plus octaaf',
    plusOctaves: '{simple} plus {n} octaven',
    higher: 'hoger',
    lower: 'lager',
    onPitch: 'raak',
  },
  piano: {
    title: 'Piano',
    body: 'Eén octaaf vanaf {octave}. Witte toetsen zijn de toonladder; zwarte toetsen zijn de kruizen ertussen.',
    hint: 'Tik een toets, of speel de hele ladder van {first} tot {last}.',
    octaveA11y: 'Kies octaaf {label}',
  },
  calibrate: {
    title: 'IJking',
    body: 'De testtoon is A4, La, 440 Hz. Speel die A met een stemapparaat, piano of toongenerator in de microfoon. Daarna zie je de Hertz en hoor je beide terug.',
    recording: 'Opnemen… houd de toon aan',
    testTone: 'Testtoon: A4 · La · {hz} Hz',
    measured: 'Gemeten opname: {value}',
    cents: '{signed} cent t.o.v. 440 Hz',
    error: 'Opnemen of meten is mislukt.',
    micDenied: 'Microfoon is niet toegestaan.',
    recordUnavailable: 'Opnemen lukt in deze omgeving niet.',
    hearA440: 'Hoor A440 (La)',
    hearA440A11y: 'Speel testtoon A440',
    record: 'Neem je toon op',
    recordA11y: 'Neem je testtoon op',
    hearRecording: 'Hoor je opname',
    hearRecordingA11y: 'Speel je opname',
  },
  hold: {
    titleHold: 'Houd de toon vast',
    titleSing: 'Zing of speel de toon',
    idleSing:
      'Je hoort een toon uit C-majeur in octaaf {octave}. Daarna stilte: houd hem innerlijk vast. Daarna zing je hem, of speel je hem op een instrument in de microfoon. Octaaf lager of hoger telt mee.',
    idleSilent:
      'Je hoort een toon uit C-majeur in octaaf {octave}. Daarna wordt het stil. Houd die toon innerlijk vast. Tik Controleer als je hem nog hoort.',
    playing: 'Luister. Onthoud de toon, niet de naam.',
    holdingSing: 'Het is stil. Houd dezelfde toon in je hoofd. Daarna zing of speel je hem in de microfoon.',
    holdingSilent: 'Het is stil. Houd dezelfde toon in je hoofd.',
    singing:
      'Zing of speel dezelfde toon, ongeveer twee seconden. Stem of instrument: de microfoon luistert. Daarna hoor je kort terug; dat is de meting, geen extra oefening.',
    checkAsk: 'Dit was {tone}. Was het dezelfde toon als in je hoofd?',
    singTitle: 'Inzingen of naspelen',
    singHint:
      'Optioneel. De microfoon van telefoon of computer luistert. Zing de toon, of speel hem op een instrument.',
    singA11y: 'Inzingen of naspelen in- of uitschakelen',
    skipSing: 'Sla over',
    skipSingA11y: 'Sla inzingen over',
    singButton: 'Zing of speel de toon',
    singButtonA11y: 'Zing of speel de toon',
    checkA11y: 'Controleer de toon',
    againA11y: 'Zelfde toon opnieuw vasthouden',
    next: 'Volgende toon',
    nextA11y: 'Volgende toon',
    exerciseTone: 'Oefentoets: {tone} · {hz} Hz',
    measuredSing: 'Gemeten toon: {value}',
    hearExercise: 'Hoor oefentoets',
    hearExerciseA11y: 'Speel de oefentoets',
    hearSinging: 'Hoor je opname',
    hearSingingA11y: 'Speel je opname',
    unavailable:
      'Inzingen lukt nu niet. De toon was {label}. Controleer of de microfoon is toegestaan, of sla over.',
    silent:
      'Geen toon herkend. De toon was {label}. Probeer iets luider, of sla over.',
    hit: 'Je zat in de buurt van {degree}. De toon was {label}.',
    close: 'Bijna: je zat dicht bij {degree}. De toon was {label}.',
    miss: 'Te ver van {label}. Dat kan het oor, de stem of het instrument zijn.',
  },
  holdChord: {
    titleHold: 'Houd het akkoord vast',
    idle: 'Je hoort één akkoord uit C-majeur in octaaf {octave}. Daarna wordt het stil. Houd de samenklank innerlijk vast. Tik Controleer als je hem nog hoort.',
    playing: 'Luister. Onthoud de samenklank, niet de naam.',
    holding: 'Het is stil. Houd hetzelfde akkoord in je hoofd.',
    checkAsk: 'Dit was {chord}. Was het dezelfde samenklank als in je hoofd?',
    size: 'Samenklank',
    sizeHint: 'Drieklank, vierklank, of door elkaar.',
    sizeTriad: 'Drieklank',
    sizeSeventh: 'Vierklank',
    sizeMix: 'Door elkaar',
    inversion: 'Ligging',
    inversionHint: 'Grondligging, eerste of tweede omkering, of door elkaar. Bij vierklank zit in door elkaar ook de derde omkering.',
    invRoot: 'Grondligging',
    invFirst: '1e omkering',
    invSecond: '2e omkering',
    invMix: 'Door elkaar',
    inv3: 'derde omkering',
    maj7: 'majeur 7',
    m7: 'mineur 7',
    dom7: 'dominant 7',
    halfdim: 'halfverminderd',
    other: 'akkoord',
    checkA11y: 'Controleer het akkoord',
    againA11y: 'Zelfde akkoord opnieuw vasthouden',
    nextA11y: 'Volgend akkoord',
  },
  find: {
    titleSeek: 'Zoek de noot',
    idleCue:
      'Je ziet een nootletter en hoort die noot kort. Daarna is het stil. Houd de klank vast. Schuif tot je dezelfde noot weer hoort ({low}–{high}).',
    idleSilent:
      'Je ziet een nootletter. Houd die klank in je hoofd. Schuif tot je dezelfde noot hoort ({low}–{high}).',
    preview: 'Dit is de noot. Onthoud de klank bij de letter. Daarna stilte, dan schuiven.',
    seekingCue: 'Houd de noot vast. Schuif tot je hem weer hoort. De schuif klinkt pas als je hem vastpakt.',
    seekingSilent:
      'Houd de letter in je hoofd. Schuif tot de klank klopt. De schuif klinkt pas als je hem vastpakt.',
    hit: 'Dat was {letter}. Jouw toon en de echte noot klinken hetzelfde.',
    close: 'Bijna {letter}. Je zat een {interval} {direction}.',
    miss: 'De noot was {letter}. Je koos ongeveer {chosen}, een {interval} {direction}.',
    cueTitle: 'Voorbeeldtoon',
    cueHint:
      'Voor beginners. Je hoort de noot van de letter kort. Daarna stilte; de schuif klinkt pas als je schuift.',
    cueA11y: 'Voorbeeldtoon in- of uitschakelen',
    tonesHint: 'Uit welke octaven de nootletter komt. Nu: {list}.',
    tonesA11y: 'Tonen in octaaf {label}',
    sliderA11y: 'Schuif octaaf {label}',
    sliderHint:
      'Bereik van de toon op de schuif: {low} tot {high}. Tik een octaaf aan om te verbreden, tik de rand om te versmallen.',
    sliderFollow: 'De toon volgt de schuif van {low} tot {high}. Geen namen op de balk.',
    sliderAfter: 'Daarna begint de schuif ergens anders.',
    letterKicker: 'Nootletter',
    realNote: 'Echte noot: {letter} · {hz} Hz',
    yourTone: 'Jouw toon: {label} · {hz} Hz',
    deviationOn: 'Afwijking: {cents} cent',
    deviationOff: 'Afwijking: {interval} {direction} · {cents} cent',
    compareYour: 'Jouw toon',
    compareReal: 'Echte noot',
    compareTogether: 'Samen',
    compareIntro: 'Eerst achter elkaar, daarna samen.',
    hearYour: 'Hoor jouw toon',
    hearYourA11y: 'Hoor jouw toon',
    hearReal: 'Hoor echte noot',
    hearRealA11y: 'Hoor de echte noot',
    hearBoth: 'Hoor samen',
    hearBothA11y: 'Hoor beide tonen samen',
    hearCompare: 'Hoor vergelijking',
    hearCompareA11y: 'Hoor achter elkaar en samen',
    lockIn: 'Dit is de toon',
    lockInA11y: 'Dit is de toon',
    againA11y: 'Zelfde noot opnieuw zoeken',
    next: 'Volgende noot',
    nextA11y: 'Volgende noot',
  },
  interval: {
    titleSecond: 'Tweede toon',
    titleFirst: 'Eerste toon',
    titleHold: 'Houd de afstand vast',
    titleSing: 'Zing of speel de tweede toon',
    idle: 'Je hoort twee tonen uit C-majeur, na elkaar. De eerste komt uit {octave}. Stilte: houd de afstand innerlijk vast. De tweede toon mag je zingen of op een instrument naspelen.',
    playingOtherOctave:
      'De tweede toon ligt in een {way} octaaf. Hoor de afstand, geen namen.',
    playingSame: 'Hoor hoe ver de tweede toon van de eerste ligt. Geen namen, alleen de sprong.',
    playingAnchorNamed:
      'Dit is het anker. De naam staat erbij; houd vooral de klank vast.',
    playingAnchor: 'Dit is het anker. Onthoud deze toon innerlijk.',
    holdingDrone: 'De drone blijft. Plaats de afstand tegen de tonica en de kwint.',
    holdingPiano:
      'Het is stil. Houd de afstand in je hoofd. Tik de tweede toon op het octaaf, of speel hem op je eigen instrument.',
    holdingSilent:
      'Het is stil. Houd de afstand in je hoofd. Zing de tweede toon, of speel hem op een instrument.',
    singing:
      'Zing of speel de tweede toon, ongeveer twee seconden. Stem of instrument: de microfoon luistert. De eerste blijft het anker in je hoofd.',
    checkAsk: 'Dit was {interval}. Was het dezelfde afstand als in je hoofd?',
    wayUp: 'hoger',
    wayDown: 'lager',
    firstTone: 'Eerste toon',
    firstToneA11y: 'Eerste toon in octaaf {label}',
    octaves: 'Octaven',
    octavesHint: '1 is hetzelfde octaaf. 2 tot 7: de tweede toon staat in een ander octaaf.',
    octavesA11y: '{n} octaven',
    secondTone: 'Tweede toon',
    secondHint: 'Het octaaf van de tweede toon, ten opzichte van de eerste.',
    octaveUp: 'Octaaf hoger',
    octaveUpA11y: 'Tweede toon een octaaf hoger',
    octaveDown: 'Octaaf lager',
    octaveDownA11y: 'Tweede toon een octaaf lager',
    showAnchor: 'Eerste toon tonen',
    showAnchorHint: 'Makkelijker. Je ziet de naam van het anker terwijl je luistert.',
    showAnchorA11y: 'Eerste toon tonen in- of uitschakelen',
    singTitle: 'Inzingen of naspelen',
    singHint:
      'Optioneel. De microfoon van telefoon of computer luistert. Zing de tweede toon, of speel hem op een instrument.',
    singA11y: 'Inzingen of naspelen in- of uitschakelen',
    pianoTitle: 'Kies op de piano',
    pianoHint:
      'Optioneel. Na de stilte verschijnt een octaaf op het scherm. Tik de tweede toon.',
    pianoA11y: 'Piano-octaaf in- of uitschakelen',
    answerOctaveA11y: 'Antwoord-octaaf C{n}',
    anchor: 'Anker: {tone}',
    secondReveal: 'Tweede toon: {tone} · {hz} Hz',
    yourKey: 'Jouw toets',
    measuredSing: 'Gemeten toon',
    hearInterval: 'Hoor interval',
    hearIntervalA11y: 'Speel het interval opnieuw',
    hearSinging: 'Hoor je opname',
    hearSingingA11y: 'Speel je opname',
    singButton: 'Zing of speel de tweede toon',
    singButtonA11y: 'Zing of speel de tweede toon',
    checkOnly: 'Alleen controleren',
    checkA11y: 'Controleer het interval',
    againA11y: 'Zelfde interval opnieuw vasthouden',
    next: 'Volgend interval',
    nextA11y: 'Volgend interval',
    pianoHit: 'Dat was de tweede toon. Het interval was {interval}.',
    pianoClose:
      'Bijna: je zat een toets ernaast. De tweede toon was {second}. Het interval was {interval}.',
    pianoMiss: 'Dat was niet de tweede toon. Die was {second}. Het interval was {interval}.',
    unavailable:
      'Inzingen lukt nu niet. Het interval was {interval}. Controleer of de microfoon is toegestaan, of sla over.',
    silent:
      'Geen toon herkend. Zing of speel de tweede toon ({second}). Het interval was {interval}.',
    hit: 'Je zat in de buurt van de tweede toon. Het interval was {interval}.',
    close: 'Bijna: je zat dicht bij de tweede toon. Het interval was {interval}.',
    miss: 'Te ver van de tweede toon. Het interval was {interval}. Dat kan het oor, de stem of het instrument zijn.',
  },
  melody: {
    titlePlace: 'Zet de lijn',
    idle: 'Je hoort {count} tonen uit C-majeur in octaaf {octave}. Daarna stilte. Zet per toon een punt: links is eerder, onder is lager. Geen notenbalk — alleen de lijn.',
    playing: 'Luister. Onthoud de lijn, niet de namen.',
    placingDrone:
      'De drone blijft. Tik de lijn tegen de tonica en de kwint. Elk punt een eigen hoogte.',
    placingTwo: 'Tik welke toon hoger was. Boven is hoger. Elk punt een eigen hoogte.',
    placing: 'Tik per kolom de hoogte. Boven is hoger, links is eerder. Elk punt een eigen hoogte.',
    hit: 'Die lijn klopt. {names}.',
    miss: '{correct} van {total} hoogtes goed. De groene lijn is hoe het was. {names}.',
    notes: 'Noten',
    notesHint: '2 tot {core} is de oefening. 5 tot 8 is lastig voor het geheugen.',
    notesA11y: '{n} noten',
    notesA11yAdvice: '{n} noten, aanbevolen',
    hearAgain: 'Hoor opnieuw',
    hearAgainA11y: 'Speel de melodie opnieuw',
    checkA11y: 'Controleer de lijn',
    againA11y: 'Zelfde melodie opnieuw zetten',
    next: 'Volgende melodie',
    nextA11y: 'Volgende melodie',
    adviceUp:
      'Je hebt {streak} lijnen van {count} noten achter elkaar goed. Probeer {next}.',
    adviceDownHard:
      '{count} is lastig voor het geheugen. {core} is de oefening. Terug is prima.',
    adviceDown: 'Terug naar {back} is prima. Eerst de lijn van {back} vastzetten.',
    stats: 'Reeks {streak} · vandaag {correct} goed · {miss} mis',
  },
  reverse: {
    titlePlace: 'Zet achterstevoren',
    idle: 'Je hoort {count} tonen uit C-majeur in octaaf {octave}. Stilte. Tik de lijn achterstevoren: de laatste toon eerst. Geen notenbalk.',
    playing: 'Luister vooruit. In je hoofd draai je de lijn om. Geen namen.',
    placingTwo: 'Tik eerst de laatste toon, dan de eerste. Boven is hoger.',
    placing: 'Tik de omgekeerde lijn. Links is de laatste toon die je hoorde. Boven is hoger.',
    hit: 'Dat is de omkering. Je hoorde {heard}. Achterstevoren: {reverse}.',
    forward:
      'Dat was de lijn vooruit, niet achterstevoren. Achterstevoren begint met de laatste toon. Je hoorde {heard}. Omgekeerd: {reverse}.',
    miss: '{correct} van {total} hoogtes goed. De groene lijn is de omkering. Je hoorde {heard}. Omgekeerd: {reverse}.',
    notesHint: '3 is de oefening. 2 is makkelijker. 4 is de volgende stap. 5 tot 8 is lastig.',
    hearAgainA11y: 'Speel de gehoorde melodie opnieuw',
    hearReverse: 'Hoor omkering',
    hearReverseA11y: 'Speel de omkering',
    checkA11y: 'Controleer de omkering',
    againA11y: 'Zelfde omkering opnieuw zetten',
    next: 'Volgende omkering',
    nextA11y: 'Volgende omkering',
  },
  harmony: {
    titleSeek: 'Zoek de toon',
    idle: 'Een toon klinkt. Schuif er een tweede bij tot de samenklank klopt. Je hoeft de namen niet te kennen. Begin met majeur en mineur; de wijdere sprong is later.',
    seeking: '{task}. Zoek de {hint}. {given}.',
    hit: 'Dat was de {hint}. {task}.',
    close: 'Bijna de {hint}. Je zat een {interval} {direction}.',
    miss: 'De toon was {target}. Je koos ongeveer {chosen}.',
    quality: 'Kwaliteit',
    find: 'Zoek',
    given: 'Gegeven',
    givenOne: '1 noot',
    givenTwo: '2 noten',
    givenHint: 'Twee noten: bij terts hoor je 1–5, bij kwint hoor je 1–3.',
    givenLine: 'Gegeven: {notes}',
    asked: 'Gevraagd: {note} · {hint}',
    yourTone: 'Jouw toon: {label} · {hz} Hz',
    inversions: 'Omkeringen',
    inversionsOn:
      'Grondligging, eerste en tweede omkering. Heeft twee of meer octaven op de schuif nodig.',
    inversionsOff: 'Kies eerst twee of meer octaven op de schuif.',
    inversionsA11y: 'Omkeringen',
    tonesHint: 'Grondtonen uit {list}.',
    sliderHint: '{low} tot {high}.',
    third: 'Terts',
    fifth: 'Kwint',
    major: 'Majeur',
    minor: 'Mineur',
    dim: 'Verminderd',
    aug: 'Overmatig',
    root: 'grondligging',
    inv1: 'eerste omkering',
    inv2: 'tweede omkering',
    minorThird: 'kleine terts',
    majorThird: 'grote terts',
    dimFifth: 'verminderde kwint',
    augFifth: 'overmatige kwint',
    perfectFifth: 'reine kwint',
    compareYours: 'Jouw samenklank',
    compareReal: 'Echte samenklank',
    compareSolo: 'Jouw toon alleen',
    compareIntro: 'Eerst jouw klank, dan de echte.',
    hearCompare: 'Hoor vergelijking',
    hearCompareA11y: 'Hoor vergelijking',
    lockIn: 'Dit is de toon',
    lockInA11y: 'Dit is de toon',
    againA11y: 'Zelfde akkoord opnieuw zoeken',
    nextA11y: 'Volgende akkoord',
  },
  extension: {
    titleSeek: 'Zoek de extensie',
    idle: 'Een akkoord klinkt. Schuif de gevraagde extensie erbij: 9, 11 of 13. Kies drieklank, vierklank of shell als gegeven.',
    seeking: '{task}. Zoek de {hint}. {given}.',
    hit: 'Dat was de {hint}. {task}.',
    close: 'Bijna de {hint}. Je zat een {interval} {direction}.',
    miss: 'De toon was {target}. Je koos ongeveer {chosen}.',
    quality: 'Kwaliteit',
    findHint: 'Eén of meer. De ronde kiest aselect uit wat aanstaat.',
    givenHint: 'Eén soort gegeven per ronde. De gevraagde extensie past bij dat akkoord.',
    givenLine: 'Gegeven: {notes}',
    asked: 'Gevraagd: {note} · {hint}',
    yourTone: 'Jouw toon: {label} · {hz} Hz',
    tonesHint: 'Grondtonen uit {list}.',
    sliderHint: '{low} tot {high}. Twee octaven helpt; 13 ligt hoog.',
    major: 'Majeur',
    minor: 'Mineur',
    dominant: 'Dominant',
    triad: 'Drieklank',
    seventh: 'Vierklank',
    shell: 'Shell',
    ninth: 'none',
    eleventh: 'undecime',
    thirteenth: 'tredecime',
    compareYours: 'Jouw extensie',
    compareReal: 'Echte extensie',
    compareSolo: 'Jouw toon alleen',
    compareIntro: 'Eerst de echte extensie, dan de jouwe.',
    hearCompare: 'Hoor vergelijking',
    hearCompareA11y: 'Hoor vergelijking',
    lockIn: 'Dit is de toon',
    lockInA11y: 'Dit is de toon',
    againA11y: 'Zelfde extensie opnieuw zoeken',
    nextA11y: 'Volgende extensie',
  },
  progression: {
    titleAnswer: 'Vul de treden in',
    idle: 'Je hoort {count} akkoorden na elkaar, met een korte stilte ertussen. Vul daarna per akkoord de trede van de grondtoon in. Niet de omkering.',
    idleCue:
      'Je hoort eerst de grondtoon C, daarna {count} akkoorden. Vul per akkoord de trede in t.o.v. die C. Niet de omkering.',
    playing: 'Luister. Onthoud de grondtonen, niet de ligging.',
    playingCue: 'Eerst de grondtoon, daarna de akkoorden. Onthoud de treden t.o.v. C.',
    answering: 'Tik per akkoord de trede. De kwaliteit zit in de klank.',
    hit: 'Die treden kloppen. {names}.',
    miss: '{correct} van {total} treden goed. Jij: {guessed}. Het was: {names}.',
    chords: 'Akkoorden',
    chordsHint: '2 is diatonisch én chromatisch. 3 tot 8 begint in C-majeur; andere ladders extra aan.',
    chordsA11y: '{n} akkoorden',
    palette: 'Toonwereld',
    paletteMajor: 'C-majeur',
    paletteKnown: 'Bekende schaal',
    paletteRandom: 'Willekeurig',
    paletteMajorHint: 'Eén toonwereld: alleen C-majeur. Makkelijkst om innerlijk vast te houden.',
    paletteKnownHint:
      'Eén bekende ladder per ronde: een mode, harmonic minor of verwant. Jij hoort die wereld; het antwoord is de grondtoon in C.',
    paletteRandomHint:
      'Akkoorden door elkaar uit die ladders. Grotere resolutie: nog steeds horen, ook als de wereld wisselt. F♯ en G♭ zijn dezelfde grondtoon.',
    chromaticNames:
      'Do–Re kan geen ♯ of ♭ dragen. Chromatische treden zijn cijfers: ♯4/♭5 is één grondtoon, zoals F♯/G♭.',
    pattern: 'Patroon',
    patternFree: 'Vrij',
    patternCadence: 'Cadens',
    pattern145: '1–4–5',
    patternHintFree: 'Willekeurige akkoorden uit de toonwereld.',
    patternHintCadence: 'Alleen sluitingen in C. Lengte volgt de cadens.',
    patternHint145: 'Alleen 1–4–5 in C-majeur.',
    idleCadence: 'Je hoort een cadens in C. Vul de treden in. Niet de omkering.',
    idleCadenceCue: 'Je hoort eerst C, daarna een cadens. Vul de treden in t.o.v. die C.',
    idle145: 'Je hoort 1–4–5 in C. Vul de treden in. Niet de omkering.',
    idle145Cue: 'Je hoort eerst C, daarna 1–4–5. Vul de treden in t.o.v. die C.',
    size: 'Samenklank',
    triad: 'Drieklank',
    seventh: 'Vierklank',
    sizeHint: 'Drieklank is de oefening. Vierklank voegt de septiem toe.',
    inversions: 'Omkeringen',
    inversionsOn:
      'Grondligging en omkeringen. Heeft twee of meer octaven nodig. Het antwoord blijft de grondtoon.',
    inversionsOff: 'Kies eerst twee of meer octaven. Het antwoord is altijd de grondtoon.',
    inversionsA11y: 'Omkeringen',
    tonicTitle: 'Grondtoon laten horen',
    tonicHint:
      'Optioneel. Eerst hoor je C (Do / 1). Daarna de akkoorden t.o.v. die toon. Uit laten: absolute pitch, C zelf vasthouden.',
    tonicA11y: 'Grondtoon vooraf laten horen',
    tonicMark: 'Grondtoon',
    tonesHint: 'Ligging in {list}.',
    hearAgain: 'Hoor opnieuw',
    hearAgainA11y: 'Speel de progressie opnieuw',
    checkA11y: 'Controleer de treden',
    againA11y: 'Zelfde progressie opnieuw horen',
    nextA11y: 'Volgende progressie',
    slotA11y: 'Akkoord {n}',
    chipA11y: 'Trede {label}',
    numberPadHint:
      'Tik eerst ♯ of ♭, daarna het cijfer. Alleen een cijfer is de onveranderde trede. ♯4 en ♭5 zijn dezelfde grondtoon.',
    sharpA11y: 'Kruis',
    flatA11y: 'Mol',
    numberA11y: 'Trede {n}',
  },
  rhythm: {
    titleRepeat: 'Tik na',
    titleCompose: 'Tik je ritme',
    idlePreset:
      'Je hoort een {meter}/4-ritme van {bars} maat{plural}. Daarna een tel en jij tikt het na op de toets.',
    barsPlural: 'en',
    idleCompose:
      'Tik je ritme in na de tel. Daarna hoor je het, tikt het na, en volgt dezelfde controle.',
    listening: 'Luister. Houd de tijd vast, niet de vingers.',
    repeating: 'Na de tel: tik het ritme. De speelkop loopt mee.',
    composing: 'Na de tel: tik je ritme. Daarna speelt de app het voor en vraag om het na te tikken.',
    hit: 'Dat viel samen. Eerst het voorbeeld, dan jouw tikken, daarna samen.',
    miss: '{hit} van {total} tikken op tijd{extra}.',
    missExtra: ', {n} extra',
    compareIntro: 'Eerst het voorbeeld, dan jouw tikken, daarna samen.',
    source: 'Bron',
    preset: 'Voorbeeld',
    compose: 'Zelf tikken',
    meter: 'Maatsoort',
    bars: 'Maten',
    sounds: 'Klanken',
    soundsHint: 'Altijd beschikbaar. Meer toetsen, zelfde tijd.',
    pattern: 'Ritme',
    pad: 'Tik',
    low: 'Laag',
    mid: 'Midden',
    high: 'Hoog',
    padA11y: 'Ritmetoets {n}',
    score: '{hit} van {total} op tijd{extra}',
    extraOne: ' · {n} extra tik',
    extraMany: ' · {n} extra tikken',
    compareModel: 'Voorbeeld',
    compareYours: 'Jouw tikken',
    compareTogether: 'Samen',
    compareHint: 'Eerst achter elkaar, daarna samen.',
    hearCompare: 'Hoor vergelijking',
    hearCompareA11y: 'Hoor vergelijking',
    againA11y: 'Zelfde ritme opnieuw tikken',
    nextA11y: 'Volgend ritme',
    composeStart: 'Tik in',
    patterns: {
      '4q': 'Vier kwarten',
      '8e': 'Acht achten',
      '4q-ee': 'Kwart, twee achten, kwart, kwart',
      sync: 'Kwart, acht, kwart, acht, kwart',
      '16-q': 'Vier zestienden, twee kwarten',
      dot: 'Gepunteerde kwart, acht, twee kwarten',
      '3q': 'Drie kwarten',
      '6e': 'Zes achten',
      waltz: 'Kwart, twee achten, kwart',
      '3-16': 'Vier zestienden, twee kwarten',
    },
  },
};

export type Strings = typeof nl;

const en: Strings = {
  language: {
    title: 'Language',
    hint: 'Dutch or English for now. German, French and Spanish come later.',
    a11y: 'Language {label}',
  },
  common: {
    back: 'Home',
    backA11y: 'Back to home',
    start: 'Start',
    startA11y: 'Start exercise',
    again: 'Again',
    next: 'Next',
    check: 'Check',
    listen: 'Listen',
    control: 'Check',
    octave: 'Octave',
    tones: 'Tones',
    slider: 'Slider',
    together: 'Together',
    options: 'Options',
    noPitch: 'no pitch found',
    centsBeside: '{cents} cents from {label}',
  },
  levels: {
    easy: 'Easy',
    next: 'Next step',
    open: 'Open',
    soon: 'Later',
  },
  home: {
    howTitle: 'How and why',
    forWhoLead: 'For whom. ',
    forWhoBody:
      'An introduction to audiation. Exercises for a wide audience, from about age 7. You test your inner musicality and can sharpen it by practice. These are basic skills, with rising difficulty. No advanced topics, and no claim of completeness. Usefulness, yes. Enjoy the music.',
    whatLead: 'What. ',
    whatBody:
      'Audiation is hearing music in your head. The tone is still there in silence. Not the key, not the name: the sound you hold.',
    whyLead: 'Why. ',
    whyBody:
      'If you hear inwardly, you can play back, sing, and later follow harmony. Without that, music stays copying of fingers.',
    howLead: 'How. ',
    howBody:
      'First one tone in silence. Then find a note letter with the slider. Then the distance between two tones. Then the line of a short melody. Then that line backwards. Then hold one chord: triad or seventh. Then a second tone against a sounding tone: major or minor. Then extensions: 9, 11 or 13 on a sounding chord. Then progressions: chords one after another, the degree of the root. Then rhythm: listen and tap it back. Names (Do or 1) come after hearing, except Find note: there the letter is the goal. Singing or an instrument is a check, not the goal.',
    moreTitle: 'More about audiation',
    moreA11y: 'More about audiation',
    moreOpen: 'Open',
    moreClose: 'Close',
    moreHint: 'Feeling, character and identity.',
    feelingLead: 'Feeling. ',
    feelingBody:
      'You experience music with feeling. That is how music reaches you. Feeling is real, and it changes.',
    characterLead: 'Character. ',
    characterBody:
      'The character of a note, an interval or a harmony comes from how it is used. The same C plays a different role elsewhere. Character is variable.',
    identityLead: 'Identity. ',
    identityBody:
      'What stays stable is the identity of those three. Audiation is recognizing that identity, even in silence.',
    practiceTitle: 'Practice',
    practiceHint:
      'Work from top to bottom. Options inside an exercise go from easy to hard.',
    simpleTitle: 'Simplest settings',
    simpleHint:
      'For a new or beginning user. Sets every exercise to the easiest options: one octave, cue tone on, one quality, short lines. You can open them up later inside each exercise.',
    simpleButton: 'Simplest settings',
    simpleDone: 'All exercises are on the simplest settings.',
    simpleA11y: 'Set all exercises to the simplest settings',
    savedTitle: 'My settings',
    savedButton: 'Save settings',
    savedDone: 'Your current setup is saved.',
    savedApply: 'Use my settings',
    savedA11y: 'Save the current exercise settings',
    savedApplyA11y: 'Restore your saved settings',
    advancedTitle: 'Advanced',
    advancedHint: 'Sound character. Sec first. Then combo, band or orchestra.',
    toolsTitle: 'Tools',
    toolKicker: 'Tool',
    stepA11y: 'Step {step}, {title}, {level}',
    soonA11y: '{step}. {title}, later',
    toolA11y: 'Tool {title}',
  },
  about: {
    title: 'About Audiation',
    a11y: 'About Audiation',
    beta: 'Beta',
    developed: 'Developed by Freek van Steijn, with Cursor.',
    emailLabel: 'Email',
    copyright: '© {year} Freek van Steijn. All rights reserved.',
    disclaimer:
      'You use this app at your own risk. I am not responsible for any damage arising from use of the app.',
  },
  naming: {
    title: 'Naming',
    hint: 'Only the degree in C major. The letter name C D E stays beside it.',
    a11y: 'Naming {hint}',
  },
  klank: {
    title: 'Sound character',
    hint: 'Not instruments. How voices speak together. Sec is the base.',
    a11y: 'Sound character {label}',
    sec: 'Plain',
    combo: 'Combo',
    band: 'Band',
    orchestra: 'Orchestra',
    random: 'Random',
  },
  help: {
    moreA11y: 'More about {term}',
    cMajorTitle: 'C major',
    cMajor:
      'A scale is a fixed order of steps. Major: whole, whole, half, whole, whole, whole, half. In C that is C D E F G A B C. E–F and B–C are the half steps; the rest are whole. Those are the white keys from C to C.',
    triadTitle: 'Triad / seventh',
    triad:
      'You build them from the scale by skipping one tone each time. That leap is a third. Skip once more: the fifth from the root. Triad: root, third, fifth. Seventh: one more third (the seventh). In C remember C–E–G–B–D–F–A–C. Start anywhere: three tones is a triad, four a seventh. C–E–G is C. D–F–A is D. And so on.',
    voicingTitle: 'Position',
    voicing:
      'Position is which tone of the chord sounds lowest. The harmony stays the same. Root position: the root at the bottom. C–E–G with C below. First inversion: the third at the bottom. E–G–C. Second inversion: the fifth at the bottom. G–C–E. Third inversion only for a seventh: the seventh at the bottom. For C–E–G–B that is B below.',
    modesTitle: 'Modes',
    modes:
      'A mode is a seven-degree scale. The half steps sit elsewhere than in major. Here they all start on C. Ionian is C major: whole–whole–half–whole–whole–whole–half. C D E F G A B. Dorian: whole–half–whole–whole–whole–half–whole. C D E♭ F G A B♭. Minor colour, major sixth. Phrygian: half–whole–whole–whole–half–whole–whole. C D♭ E♭ F G A♭ B♭. Lydian: whole–whole–whole–half–whole–whole–half. C D E F♯ G A B. Major colour, raised fourth. Mixolydian: whole–whole–half–whole–whole–half–whole. C D E F G A B♭. Major colour, minor seventh. Aeolian is natural minor, the sixth mode of major. Relative: A natural minor shares the notes of C major; start on La / 6. Parallel on C: whole–half–whole–whole–half–whole–whole. C D E♭ F G A♭ B♭. Locrian: half–whole–whole–half–whole–whole–whole. C D♭ E♭ F G♭ A♭ B♭.',
    minorTitle: 'Minor',
    minor:
      'Three minor scales from C. All have a minor third (E♭). They differ on the 6th and 7th degrees. Natural minor is Aeolian: the sixth mode of major. C major and A natural minor are the same notes; you start on La / 6. That is the relative minor. Parallel from C: 6th and 7th minor. C D E♭ F G A♭ B♭. Harmonic minor: 7th major, as leading tone. C D E♭ F G A♭ B. The leap A♭–B is three half steps. Melodic minor: 6th and 7th major. C D E♭ F G A B. Harmonic major is a kin: major with a minor sixth. C D E F G A♭ B.',
    cadenceTitle: 'Cadence',
    cadence:
      'A cadence is a common close. Authentic: 5–1. Plagal: 4–1. Half cadence: stays on 5, from 1, 2 or 4. Deceptive: 5–6 instead of 1. 2–5–1 is the jazz cadence to 1. Triad or seventh; no extensions (9, 11, 13).',
    thirdTitle: 'Third / fifth',
    third:
      'You do not need the names. Listen whether it fits together. A third is the smaller step next to the sounding tone: major or minor. A fifth is the wider step. Diminished and augmented come later.',
    extensionTitle: 'Extension',
    extension:
      'An extension is a tone you add to a sounding chord, above the triad or seventh. Same leap as building the chord: skip one tone. In C: C–E–G–B–D–F–A. After the seventh (B) come the 9th (D), the 11th (F) and the 13th (A). Those numbers count from the root, even if the root itself is silent. No flattened or raised colours here.',
    shellTitle: 'Given',
    shell:
      'Given is what you hear before you slide. Triad: root, third, fifth. Seventh: plus the seventh. Shell: third and seventh only, no root or fifth. The 9, 11 or 13 still counts from that root.',
    simple:
      'Tap the button to set every exercise to the easiest options. One octave, cue tone on, major only, triad in root position, short lines, cadence with tonic. Sound character back to plain. Inside an exercise you can open them up later. Tap the button again to return to simplest.',
    saved:
      'Only if you change options in an exercise. When you then go back to home, that setup is kept as yours. Leaving unchanged does not save extra. Here you can also save or restore that setup, even after tapping Simplest settings.',
    advanced:
      'Open this only after plain holds: one bare tone, interval or chord inwardly. These are not new exercises. Same steps, different speaking-together. As you listen from combo to orchestra in music. Rhythm, piano and calibration stay out of this.',
    klank:
      'Choose how the practice tone speaks. Not as piano or violin: as voices together. Plain first, always. Combo, band or orchestra fixed: one character for the whole exercise, to take apart. Random: each new round one of those three. Repeat in the same round keeps the same character. Simplest settings puts this back to plain.',
    klankSec:
      'Start here. Bare tone, least colour, most identity. Hold the tone or distance in silence. Come back here if combo, band or orchestra pulls you off.',
    klankCombo:
      'Few voices, still separable. As if a small ensemble is playing together. Advice: choose this once plain holds. Take apart whether you still hear the tone and the voices.',
    klankBand:
      'Denser, more attack. As if a pop band is sounding together. Advice: the identity must survive the punch. Not before plain, preferably after combo.',
    klankOrchestra:
      'More mass, longer tail, voices blend. As if a large orchestra. Advice: take apart whether it is still the tone, or only the cloud. Last fixed step before random.',
    klankRandom:
      'Each new round combo, band or orchestra. Same exercise, different speaking-together. Advice: only after one fixed character holds. Otherwise the ear chases colour, not the tone.',
  },
  drone: {
    title: 'Drone',
    hint: 'Optional. Soft strings: tonic, fifth (Sol) and the tonic an octave lower. That helps you place the distance.',
    a11y: 'Turn drone on or off',
  },
  practice: {
    holdTone: {
      title: 'Hold a tone',
      body: 'One tone from C major. Silence. Hold it inwardly.',
    },
    findNote: {
      title: 'Find a note',
      body: 'You see a letter. Optionally you hear that note briefly. Then slide to it.',
    },
    interval: {
      title: 'Hold an interval',
      body: 'Two tones. Hold the distance. Next: other octaves, later other keys.',
    },
    melody: {
      title: 'Melody',
      tagline: 'a succession of sounds',
      body: 'The line of 2 to 4 tones in C major. Tap the heights. No names, no staff.',
    },
    reverse: {
      title: 'Reverse',
      body: 'You hear 3 tones. Tap the line backwards. It starts with the last tone.',
    },
    holdChord: {
      title: 'Hold a chord',
      tagline: 'one harmony held inwardly',
      body: 'You hear one chord. Silence. Hold the sound. Triad or seventh; root position or inversion.',
    },
    harmony: {
      title: 'Harmony',
      tagline: 'different sounds sounding at the same time',
      body: 'A tone sounds. Slide a second tone onto it until the blend fits. First major or minor; names come after.',
    },
    extension: {
      title: 'Extensions',
      tagline: '9, 11 or 13 on a chord',
      body: 'A chord sounds. Slide the asked extension onto it. Triad, seventh or shell.',
    },
    progression: {
      title: 'Progressions',
      tagline: 'chords one after another',
      body: 'You hear chords in succession. Fill in the degree of each root. In C.',
    },
    rhythm: {
      title: 'Rhythm',
      tagline: 'time between sounds',
      body: 'Listen to a 3/4 or 4/4 rhythm and tap it back. Or tap one in yourself. Then model, your taps, together.',
    },
  },
  tools: {
    piano: {
      title: 'Piano',
      body: 'Sound source. C major octave, C1 to C8.',
    },
    calibrate: {
      title: 'Tuning check',
      body: 'A440 only. Check that the microphone and the app hear the same A.',
    },
  },
  intervals: {
    names: [
      'unison',
      'minor second',
      'major second',
      'minor third',
      'major third',
      'perfect fourth',
      'tritone',
      'perfect fifth',
      'minor sixth',
      'major sixth',
      'minor seventh',
      'major seventh',
      'octave',
    ],
    findNames: [
      'unison',
      'minor second',
      'major second',
      'minor third',
      'major third',
      'fourth',
      'augmented fourth',
      'fifth',
      'minor sixth',
      'major sixth',
      'minor seventh',
      'major seventh',
      'octave',
    ],
    semitones: '{n} semitones',
    octave: 'octave',
    octaves: '{n} octaves',
    plusOctave: '{simple} plus an octave',
    plusOctaves: '{simple} plus {n} octaves',
    higher: 'higher',
    lower: 'lower',
    onPitch: 'on pitch',
  },
  piano: {
    title: 'Piano',
    body: 'One octave from {octave}. White keys are the scale; black keys are the sharps in between.',
    hint: 'Tap a key, or play the whole scale from {first} to {last}.',
    octaveA11y: 'Choose octave {label}',
  },
  calibrate: {
    title: 'Tuning check',
    body: 'The test tone is A4, La, 440 Hz. Play that A with a tuner, piano or tone generator into the microphone. Then you see the Hertz and hear both back.',
    recording: 'Recording… keep the tone going',
    testTone: 'Test tone: A4 · La · {hz} Hz',
    measured: 'Measured recording: {value}',
    cents: '{signed} cents from 440 Hz',
    error: 'Recording or measuring failed.',
    micDenied: 'The microphone is not allowed.',
    recordUnavailable: 'Recording is not available in this environment.',
    hearA440: 'Hear A440 (La)',
    hearA440A11y: 'Play test tone A440',
    record: 'Record your tone',
    recordA11y: 'Record your test tone',
    hearRecording: 'Hear your recording',
    hearRecordingA11y: 'Play your recording',
  },
  hold: {
    titleHold: 'Hold the tone',
    titleSing: 'Sing or play the tone',
    idleSing:
      'You hear a tone from C major in octave {octave}. Then silence: hold it inwardly. Then sing it, or play it on an instrument into the microphone. An octave lower or higher still counts.',
    idleSilent:
      'You hear a tone from C major in octave {octave}. Then it goes quiet. Hold that tone inwardly. Tap Check when you still hear it.',
    playing: 'Listen. Remember the tone, not the name.',
    holdingSing: 'It is silent. Hold the same tone in your head. Then sing or play it into the microphone.',
    holdingSilent: 'It is silent. Hold the same tone in your head.',
    singing:
      'Sing or play the same tone for about two seconds. Voice or instrument: the microphone listens. Then you hear it back briefly; that is the measurement, not an extra exercise.',
    checkAsk: 'This was {tone}. Was it the same tone as in your head?',
    singTitle: 'Sing or play',
    singHint:
      'Optional. The microphone on phone or computer listens. Sing the tone, or play it on an instrument.',
    singA11y: 'Turn sing or play check on or off',
    skipSing: 'Skip',
    skipSingA11y: 'Skip singing or playing',
    singButton: 'Sing or play the tone',
    singButtonA11y: 'Sing or play the tone',
    checkA11y: 'Check the tone',
    againA11y: 'Hold the same tone again',
    next: 'Next tone',
    nextA11y: 'Next tone',
    exerciseTone: 'Exercise tone: {tone} · {hz} Hz',
    measuredSing: 'Measured tone: {value}',
    hearExercise: 'Hear exercise tone',
    hearExerciseA11y: 'Play the exercise tone',
    hearSinging: 'Hear your recording',
    hearSingingA11y: 'Play your recording',
    unavailable:
      'This check is not available now. The tone was {label}. Check that the microphone is allowed, or skip.',
    silent: 'No tone found. The tone was {label}. Try a little louder, or skip.',
    hit: 'You were near {degree}. The tone was {label}.',
    close: 'Almost: you were close to {degree}. The tone was {label}.',
    miss: 'Too far from {label}. That can be the ear, the voice or the instrument.',
  },
  holdChord: {
    titleHold: 'Hold the chord',
    idle: 'You hear one chord from C major in octave {octave}. Then it goes quiet. Hold that harmony inwardly. Tap Check when you still hear it.',
    playing: 'Listen. Remember the harmony, not the name.',
    holding: 'It is silent. Hold the same chord in your head.',
    checkAsk: 'This was {chord}. Was it the same harmony as in your head?',
    size: 'Voicing',
    sizeHint: 'Triad, seventh, or mixed.',
    sizeTriad: 'Triad',
    sizeSeventh: 'Seventh',
    sizeMix: 'Mixed',
    inversion: 'Position',
    inversionHint: 'Root position, first or second inversion, or mixed. For sevenths, mixed also includes third inversion.',
    invRoot: 'Root position',
    invFirst: '1st inversion',
    invSecond: '2nd inversion',
    invMix: 'Mixed',
    inv3: 'third inversion',
    maj7: 'major 7',
    m7: 'minor 7',
    dom7: 'dominant 7',
    halfdim: 'half-diminished',
    other: 'chord',
    checkA11y: 'Check the chord',
    againA11y: 'Hold the same chord again',
    nextA11y: 'Next chord',
  },
  find: {
    titleSeek: 'Find the note',
    idleCue:
      'You see a note letter and hear that note briefly. Then silence. Hold the sound. Slide until you hear the same note again ({low}–{high}).',
    idleSilent:
      'You see a note letter. Hold that sound in your head. Slide until you hear the same note ({low}–{high}).',
    preview: 'This is the note. Remember the sound with the letter. Then silence, then slide.',
    seekingCue: 'Hold the note. Slide until you hear it again. The slider sounds only when you grab it.',
    seekingSilent:
      'Keep the letter in your head. Slide until the sound matches. The slider sounds only when you grab it.',
    hit: 'That was {letter}. Your tone and the real note sound the same.',
    close: 'Almost {letter}. You were a {interval} {direction}.',
    miss: 'The note was {letter}. You chose about {chosen}, a {interval} {direction}.',
    cueTitle: 'Cue tone',
    cueHint: 'For beginners. You hear the note of the letter briefly. Then silence; the slider sounds only when you slide.',
    cueA11y: 'Turn cue tone on or off',
    tonesHint: 'Which octaves the note letter comes from. Now: {list}.',
    tonesA11y: 'Tones in octave {label}',
    sliderA11y: 'Slider octave {label}',
    sliderHint:
      'Range of the tone on the slider: {low} to {high}. Tap an octave to widen, tap the edge to narrow.',
    sliderFollow: 'The tone follows the slider from {low} to {high}. No names on the bar.',
    sliderAfter: 'Then the slider starts somewhere else.',
    letterKicker: 'Note letter',
    realNote: 'Real note: {letter} · {hz} Hz',
    yourTone: 'Your tone: {label} · {hz} Hz',
    deviationOn: 'Offset: {cents} cents',
    deviationOff: 'Offset: {interval} {direction} · {cents} cents',
    compareYour: 'Your tone',
    compareReal: 'Real note',
    compareTogether: 'Together',
    compareIntro: 'First one after the other, then together.',
    hearYour: 'Hear your tone',
    hearYourA11y: 'Hear your tone',
    hearReal: 'Hear real note',
    hearRealA11y: 'Hear the real note',
    hearBoth: 'Hear together',
    hearBothA11y: 'Hear both tones together',
    hearCompare: 'Hear comparison',
    hearCompareA11y: 'Hear one after the other and together',
    lockIn: 'This is the tone',
    lockInA11y: 'This is the tone',
    againA11y: 'Find the same note again',
    next: 'Next note',
    nextA11y: 'Next note',
  },
  interval: {
    titleSecond: 'Second tone',
    titleFirst: 'First tone',
    titleHold: 'Hold the distance',
    titleSing: 'Sing or play the second tone',
    idle: 'You hear two tones from C major, one after the other. The first comes from {octave}. Silence: hold the distance inwardly. You may sing the second tone or play it on an instrument.',
    playingOtherOctave: 'The second tone is in a {way} octave. Hear the distance, not names.',
    playingSame: 'Hear how far the second tone is from the first. No names, only the leap.',
    playingAnchorNamed: 'This is the anchor. The name is there; hold the sound most of all.',
    playingAnchor: 'This is the anchor. Remember this tone inwardly.',
    holdingDrone: 'The drone stays. Place the distance against the tonic and the fifth.',
    holdingPiano:
      'It is silent. Hold the distance in your head. Tap the second tone on the octave, or play it on your own instrument.',
    holdingSilent:
      'It is silent. Hold the distance in your head. Sing the second tone, or play it on an instrument.',
    singing:
      'Sing or play the second tone for about two seconds. Voice or instrument: the microphone listens. The first stays the anchor in your head.',
    checkAsk: 'This was {interval}. Was it the same distance as in your head?',
    wayUp: 'higher',
    wayDown: 'lower',
    firstTone: 'First tone',
    firstToneA11y: 'First tone in octave {label}',
    octaves: 'Octaves',
    octavesHint: '1 is the same octave. 2 to 7: the second tone is in another octave.',
    octavesA11y: '{n} octaves',
    secondTone: 'Second tone',
    secondHint: 'The octave of the second tone, relative to the first.',
    octaveUp: 'Octave up',
    octaveUpA11y: 'Second tone an octave higher',
    octaveDown: 'Octave down',
    octaveDownA11y: 'Second tone an octave lower',
    showAnchor: 'Show first tone',
    showAnchorHint: 'Easier. You see the name of the anchor while you listen.',
    showAnchorA11y: 'Turn showing the first tone on or off',
    singTitle: 'Sing or play',
    singHint:
      'Optional. The microphone on phone or computer listens. Sing the second tone, or play it on an instrument.',
    singA11y: 'Turn sing or play check on or off',
    pianoTitle: 'Choose on the piano',
    pianoHint:
      'Optional. After the silence an octave appears on screen. Tap the second tone.',
    pianoA11y: 'Turn piano octave on or off',
    answerOctaveA11y: 'Answer octave C{n}',
    anchor: 'Anchor: {tone}',
    secondReveal: 'Second tone: {tone} · {hz} Hz',
    yourKey: 'Your key',
    measuredSing: 'Measured tone',
    hearInterval: 'Hear interval',
    hearIntervalA11y: 'Play the interval again',
    hearSinging: 'Hear your recording',
    hearSingingA11y: 'Play your recording',
    singButton: 'Sing or play the second tone',
    singButtonA11y: 'Sing or play the second tone',
    checkOnly: 'Check only',
    checkA11y: 'Check the interval',
    againA11y: 'Hold the same interval again',
    next: 'Next interval',
    nextA11y: 'Next interval',
    pianoHit: 'That was the second tone. The interval was {interval}.',
    pianoClose:
      'Almost: you were one key off. The second tone was {second}. The interval was {interval}.',
    pianoMiss: 'That was not the second tone. It was {second}. The interval was {interval}.',
    unavailable:
      'This check is not available now. The interval was {interval}. Check that the microphone is allowed, or skip.',
    silent:
      'No tone found. Sing or play the second tone ({second}). The interval was {interval}.',
    hit: 'You were near the second tone. The interval was {interval}.',
    close: 'Almost: you were close to the second tone. The interval was {interval}.',
    miss: 'Too far from the second tone. The interval was {interval}. That can be the ear, the voice or the instrument.',
  },
  melody: {
    titlePlace: 'Set the line',
    idle: 'You hear {count} tones from C major in octave {octave}. Then silence. Put a point per tone: left is earlier, bottom is lower. No staff — only the line.',
    playing: 'Listen. Remember the line, not the names.',
    placingDrone:
      'The drone stays. Tap the line against the tonic and the fifth. Each point has its own height.',
    placingTwo: 'Tap which tone was higher. Up is higher. Each point has its own height.',
    placing: 'Tap the height per column. Up is higher, left is earlier. Each point has its own height.',
    hit: 'That line is right. {names}.',
    miss: '{correct} of {total} heights right. The green line is how it was. {names}.',
    notes: 'Notes',
    notesHint: '2 to {core} is the exercise. 5 to 8 is hard on memory.',
    notesA11y: '{n} notes',
    notesA11yAdvice: '{n} notes, recommended',
    hearAgain: 'Hear again',
    hearAgainA11y: 'Play the melody again',
    checkA11y: 'Check the line',
    againA11y: 'Set the same melody again',
    next: 'Next melody',
    nextA11y: 'Next melody',
    adviceUp: 'You got {streak} lines of {count} notes in a row. Try {next}.',
    adviceDownHard: '{count} is hard on memory. {core} is the exercise. Going back is fine.',
    adviceDown: 'Back to {back} is fine. First lock in the line of {back}.',
    stats: 'Streak {streak} · today {correct} right · {miss} miss',
  },
  reverse: {
    titlePlace: 'Set it backwards',
    idle: 'You hear {count} tones from C major in octave {octave}. Silence. Tap the line backwards: the last tone first. No staff.',
    playing: 'Listen forwards. In your head you turn the line around. No names.',
    placingTwo: 'Tap the last tone first, then the first. Up is higher.',
    placing: 'Tap the reversed line. Left is the last tone you heard. Up is higher.',
    hit: 'That is the reverse. You heard {heard}. Backwards: {reverse}.',
    forward:
      'That was the line forwards, not backwards. Backwards starts with the last tone. You heard {heard}. Reversed: {reverse}.',
    miss: '{correct} of {total} heights right. The green line is the reverse. You heard {heard}. Reversed: {reverse}.',
    notesHint: '3 is the exercise. 2 is easier. 4 is the next step. 5 to 8 is hard.',
    hearAgainA11y: 'Play the heard melody again',
    hearReverse: 'Hear reverse',
    hearReverseA11y: 'Play the reverse',
    checkA11y: 'Check the reverse',
    againA11y: 'Set the same reverse again',
    next: 'Next reverse',
    nextA11y: 'Next reverse',
  },
  harmony: {
    titleSeek: 'Find the tone',
    idle: 'A tone sounds. Slide a second one onto it until the blend fits. You do not need the names. Start with major and minor; the wider leap comes later.',
    seeking: '{task}. Find the {hint}. {given}.',
    hit: 'That was the {hint}. {task}.',
    close: 'Almost the {hint}. You were a {interval} {direction}.',
    miss: 'The tone was {target}. You chose about {chosen}.',
    quality: 'Quality',
    find: 'Find',
    given: 'Given',
    givenOne: '1 note',
    givenTwo: '2 notes',
    givenHint: 'Two notes: for a third you hear 1–5, for a fifth you hear 1–3.',
    givenLine: 'Given: {notes}',
    asked: 'Asked: {note} · {hint}',
    yourTone: 'Your tone: {label} · {hz} Hz',
    inversions: 'Inversions',
    inversionsOn:
      'Root position, first and second inversion. Needs two or more octaves on the slider.',
    inversionsOff: 'First choose two or more octaves on the slider.',
    inversionsA11y: 'Inversions',
    tonesHint: 'Roots from {list}.',
    sliderHint: '{low} to {high}.',
    third: 'Third',
    fifth: 'Fifth',
    major: 'Major',
    minor: 'Minor',
    dim: 'Diminished',
    aug: 'Augmented',
    root: 'root position',
    inv1: 'first inversion',
    inv2: 'second inversion',
    minorThird: 'minor third',
    majorThird: 'major third',
    dimFifth: 'diminished fifth',
    augFifth: 'augmented fifth',
    perfectFifth: 'perfect fifth',
    compareYours: 'Your harmony',
    compareReal: 'Real harmony',
    compareSolo: 'Your tone alone',
    compareIntro: 'First your sound, then the real one.',
    hearCompare: 'Hear comparison',
    hearCompareA11y: 'Hear comparison',
    lockIn: 'This is the tone',
    lockInA11y: 'This is the tone',
    againA11y: 'Find the same chord again',
    nextA11y: 'Next chord',
  },
  extension: {
    titleSeek: 'Find the extension',
    idle: 'A chord sounds. Slide the asked extension onto it: 9, 11 or 13. Choose triad, seventh or shell as given.',
    seeking: '{task}. Find the {hint}. {given}.',
    hit: 'That was the {hint}. {task}.',
    close: 'Almost the {hint}. You were a {interval} {direction}.',
    miss: 'The tone was {target}. You chose about {chosen}.',
    quality: 'Quality',
    findHint: 'One or more. The round picks at random from what is on.',
    givenHint: 'One given type per round. The asked extension belongs to that chord.',
    givenLine: 'Given: {notes}',
    asked: 'Asked: {note} · {hint}',
    yourTone: 'Your tone: {label} · {hz} Hz',
    tonesHint: 'Roots from {list}.',
    sliderHint: '{low} to {high}. Two octaves helps; 13 sits high.',
    major: 'Major',
    minor: 'Minor',
    dominant: 'Dominant',
    triad: 'Triad',
    seventh: 'Seventh',
    shell: 'Shell',
    ninth: 'ninth',
    eleventh: 'eleventh',
    thirteenth: 'thirteenth',
    compareYours: 'Your extension',
    compareReal: 'Real extension',
    compareSolo: 'Your tone alone',
    compareIntro: 'First the real extension, then yours.',
    hearCompare: 'Hear comparison',
    hearCompareA11y: 'Hear comparison',
    lockIn: 'This is the tone',
    lockInA11y: 'This is the tone',
    againA11y: 'Find the same extension again',
    nextA11y: 'Next extension',
  },
  progression: {
    titleAnswer: 'Fill in the degrees',
    idle: 'You hear {count} chords one after another, with a short silence between them. Then fill in the degree of each root. Not the inversion.',
    idleCue:
      'You first hear the tonic C, then {count} chords. Fill in each degree relative to that C. Not the inversion.',
    playing: 'Listen. Hold the roots, not the voicing.',
    playingCue: 'First the tonic, then the chords. Hold the degrees relative to C.',
    answering: 'Tap the degree for each chord. Quality lives in the sound.',
    hit: 'Those degrees are right. {names}.',
    miss: '{correct} of {total} degrees right. You: {guessed}. It was: {names}.',
    chords: 'Chords',
    chordsHint: '2 is diatonic and chromatic. 3 to 8 starts in C major; other scales are extra.',
    chordsA11y: '{n} chords',
    palette: 'Sound world',
    paletteMajor: 'C major',
    paletteKnown: 'Known scale',
    paletteRandom: 'Random',
    paletteMajorHint: 'One sound world: C major only. Easiest to hold inwardly.',
    paletteKnownHint:
      'One known scale per round: a mode, harmonic minor, or kin. You hear that world; the answer is the root in C.',
    paletteRandomHint:
      'Chords mixed from those scales. Larger resolution: still hearing, even when the world shifts. F♯ and G♭ are the same root.',
    chromaticNames:
      'Do–Re cannot carry ♯ or ♭. Chromatic degrees are numbers: ♯4/♭5 is one root, like F♯/G♭.',
    pattern: 'Pattern',
    patternFree: 'Free',
    patternCadence: 'Cadence',
    pattern145: '1–4–5',
    patternHintFree: 'Random chords from the sound world.',
    patternHintCadence: 'Only closes in C. Length follows the cadence.',
    patternHint145: 'Only 1–4–5 in C major.',
    idleCadence: 'You hear a cadence in C. Fill in the degrees. Not the inversion.',
    idleCadenceCue: 'You first hear C, then a cadence. Fill in the degrees relative to that C.',
    idle145: 'You hear 1–4–5 in C. Fill in the degrees. Not the inversion.',
    idle145Cue: 'You first hear C, then 1–4–5. Fill in the degrees relative to that C.',
    size: 'Voicing',
    triad: 'Triad',
    seventh: 'Seventh',
    sizeHint: 'Triad is the exercise. Four notes add the seventh.',
    inversions: 'Inversions',
    inversionsOn:
      'Root position and inversions. Needs two or more octaves. The answer stays the root.',
    inversionsOff: 'First choose two or more octaves. The answer is always the root.',
    inversionsA11y: 'Inversions',
    tonicTitle: 'Hear the tonic',
    tonicHint:
      'Optional. You first hear C (Do / 1). Then the chords relative to that tone. Leave off for absolute pitch: hold C yourself.',
    tonicA11y: 'Play the tonic first',
    tonicMark: 'Tonic',
    tonesHint: 'Voicing in {list}.',
    hearAgain: 'Hear again',
    hearAgainA11y: 'Play the progression again',
    checkA11y: 'Check the degrees',
    againA11y: 'Hear the same progression again',
    nextA11y: 'Next progression',
    slotA11y: 'Chord {n}',
    chipA11y: 'Degree {label}',
    numberPadHint:
      'Tap ♯ or ♭ first, then the number. A number alone is the unaltered degree. ♯4 and ♭5 are the same root.',
    sharpA11y: 'Sharp',
    flatA11y: 'Flat',
    numberA11y: 'Degree {n}',
  },
  rhythm: {
    titleRepeat: 'Tap it back',
    titleCompose: 'Tap your rhythm',
    idlePreset:
      'You hear a {meter}/4 rhythm of {bars} bar{plural}. Then a count-in and you tap it back on the pad.',
    barsPlural: 's',
    idleCompose:
      'Tap your rhythm in after the count. Then you hear it, tap it back, and the same check follows.',
    listening: 'Listen. Hold the time, not your fingers.',
    repeating: 'After the count: tap the rhythm. The playhead moves with you.',
    composing:
      'After the count: tap your rhythm. Then the app plays it and asks you to tap it back.',
    hit: 'That lined up. First the model, then your taps, then together.',
    miss: '{hit} of {total} taps on time{extra}.',
    missExtra: ', {n} extra',
    compareIntro: 'First the model, then your taps, then together.',
    source: 'Source',
    preset: 'Model',
    compose: 'Tap your own',
    meter: 'Meter',
    bars: 'Bars',
    sounds: 'Sounds',
    soundsHint: 'Always available. More pads, same time.',
    pattern: 'Rhythm',
    pad: 'Tap',
    low: 'Low',
    mid: 'Mid',
    high: 'High',
    padA11y: 'Rhythm pad {n}',
    score: '{hit} of {total} on time{extra}',
    extraOne: ' · {n} extra tap',
    extraMany: ' · {n} extra taps',
    compareModel: 'Model',
    compareYours: 'Your taps',
    compareTogether: 'Together',
    compareHint: 'First one after the other, then together.',
    hearCompare: 'Hear comparison',
    hearCompareA11y: 'Hear comparison',
    againA11y: 'Tap the same rhythm again',
    nextA11y: 'Next rhythm',
    composeStart: 'Tap in',
    patterns: {
      '4q': 'Four quarters',
      '8e': 'Eight eighths',
      '4q-ee': 'Quarter, two eighths, quarter, quarter',
      sync: 'Quarter, eighth, quarter, eighth, quarter',
      '16-q': 'Four sixteenths, two quarters',
      dot: 'Dotted quarter, eighth, two quarters',
      '3q': 'Three quarters',
      '6e': 'Six eighths',
      waltz: 'Quarter, two eighths, quarter',
      '3-16': 'Four sixteenths, two quarters',
    },
  },
};

export const STRINGS: Record<LocaleId, Strings> = { nl, en };

type LocaleContextValue = {
  locale: LocaleId;
  setLocale: (next: LocaleId) => void;
};

export const LocaleContext = createContext<LocaleContextValue>({
  locale: 'nl',
  setLocale: () => undefined,
});

export function useLocale() {
  return useContext(LocaleContext);
}

export function useT(): Strings {
  const { locale } = useLocale();
  return STRINGS[locale];
}

function parseLocale(value: string | null | undefined): LocaleId | null {
  return value === 'en' || value === 'nl' ? value : null;
}

function deviceLocale(): LocaleId {
  try {
    const raw =
      Platform.OS === 'web'
        ? (globalThis.navigator?.language ?? '')
        : Intl.DateTimeFormat().resolvedOptions().locale;
    return raw.toLowerCase().startsWith('en') ? 'en' : 'nl';
  } catch {
    return 'nl';
  }
}

export function guessLocale(): LocaleId {
  return deviceLocale();
}

export async function loadLocale(): Promise<LocaleId> {
  if (Platform.OS === 'web') {
    try {
      return parseLocale(globalThis.localStorage?.getItem('audiation.locale')) ?? deviceLocale();
    } catch {
      return deviceLocale();
    }
  }

  const { File, Paths } = await import('expo-file-system');
  const file = new File(Paths.document, 'audiation-locale-v1.txt');
  if (!file.exists) {
    return deviceLocale();
  }
  return parseLocale((await file.text()).trim()) ?? deviceLocale();
}

export async function saveLocale(locale: LocaleId): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.setItem('audiation.locale', locale);
    } catch {
      // privé-modus
    }
    return;
  }

  const { File, Paths } = await import('expo-file-system');
  const file = new File(Paths.document, 'audiation-locale-v1.txt');
  if (!file.exists) {
    file.create();
  }
  file.write(locale);
}

export type IntervalCopy = Strings['intervals'];

export function intervalNameFromSemitones(semitones: number, copy: IntervalCopy): string {
  if (semitones === 0) {
    return copy.names[0];
  }
  const octaves = Math.floor(semitones / 12);
  const rem = semitones % 12;
  const simple = copy.names[rem] ?? fmt(copy.semitones, { n: rem });
  if (octaves === 0) {
    return simple;
  }
  if (rem === 0) {
    return octaves === 1 ? copy.octave : fmt(copy.octaves, { n: octaves });
  }
  if (octaves === 1) {
    return fmt(copy.plusOctave, { simple });
  }
  return fmt(copy.plusOctaves, { simple, n: octaves });
}

export function intervalNameFromCents(cents: number, copy: IntervalCopy): string {
  const abs = Math.abs(cents);
  if (abs < 40) {
    return copy.findNames[0];
  }
  const semi = Math.max(1, Math.min(12, Math.round(abs / 100)));
  return copy.findNames[semi] ?? copy.findNames[12];
}

export function pitchDirection(cents: number): 'higher' | 'lower' | 'on' {
  const abs = Math.abs(cents);
  if (abs <= 8) {
    return 'on';
  }
  return cents > 0 ? 'higher' : 'lower';
}

export function directionLabel(direction: 'higher' | 'lower' | 'on', copy: IntervalCopy): string {
  if (direction === 'on') {
    return copy.onPitch;
  }
  return direction === 'higher' ? copy.higher : copy.lower;
}
