import fs from 'fs';

const path = 'G:/users/freek/Audiation/site/i18n.js';
const raw = fs.readFileSync(path, 'utf8');
const json = raw.replace(/^window\.SITE_I18N\s*=\s*/, '').replace(/;\s*$/, '');
const data = JSON.parse(json);

const LABEL = {
  nl: 'Hoe je al trainend moeilijker maakt',
  en: 'How to make it stepwise harder while you train',
  de: 'Wie du es beim Üben schrittweise schwerer machst',
  fr: 'Comment le rendre plus difficile, pas à pas, en t’entraînant',
  es: 'Cómo hacerlo más difícil, paso a paso, mientras entrenas',
};

const HARDER = {
  nl: [
    'Begin in één octaaf, zonder microfoon. Als die toon in de stilte blijft: zet meer octaven aan, zodat hij uit C3 of C5 kan komen. Daarna mag zingen of een instrument als check, niet als doel. Klinkkarakter (combo, band, orkest) hoort bij Gevorderd: pas als de identiteit in een kale toon vastzit.',
    'Begin met voorbeeldtoon aan, in één octaaf: de letter komt daar vandaan en je zoekt daar. Als dat vastzit: voorbeeldtoon uit. Daarna meer octaven waar de letter vandaan komt, of een bredere schuif. Extra stap: houd de basistoon in hetzelfde octaaf en zet de schuif op een ander octaaf. Je zoekt dezelfde letter hoger of lager. Tik Opnieuw: de basistoon blijft de oorspronkelijke noot; de schuif is waar je zoekt.',
    'Begin met twee tonen in hetzelfde octaaf, kleine afstand, eerste toon tonen aan, zonder piano en zonder zingen. Als de sprong vastzit: eerste toon tonen uit. Daarna grotere afstand, tot over octaven. Dan omlaag in plaats van omhoog. Optioneel een octaaf om de tweede toon te tikken, of je zingt hem. De eerste toon blijft het anker in je hoofd.',
    'Begin met twee tonen in één octaaf. Als de lijn blijft: drie, dan vier. Andere octaven later. Tik hoogtes, geen namen. Langer dan vier is de zware stand: meer punten, dezelfde stilte na het horen.',
    'Begin met twee tonen achterstevoren, in één octaaf. Als dat lukt: drie, dan vier of meer. De laatste toon eerst. Andere octaven later. De lijn vooruit tikken is een andere oefening; hier dwingt de omkering je de hele lijn innerlijk vast te houden.',
    'Begin met een drieklank in grondligging, één octaaf. Als de samenklank in de stilte blijft: vierklank. Daarna omkeringen — daarvoor heb je twee octaven op de schuif nodig. De check is of je de klank nog hoort, niet of je de ligging kunt benoemen.',
    'Begin met majeur, één klinkende toon, zoek de terts. Als dat samenklopt: mineur, andere kwaliteiten, of de kwint. Daarna twee gegeven tonen, later omkeringen (twee octaven op de schuif). Namen komen ná het horen.',
    'Begin met een majeur-drieklank en zoek de 9. Als die extensie vastzit: 11 of 13. Daarna andere kwaliteiten, of een vierklank of shell als gegeven akkoord. Een bredere schuif helpt; 13 ligt hoog. Het antwoord blijft de gevraagde toon, niet de naam van het akkoord.',
    'Begin kort: twee akkoorden, cadens, je hoort de tonica. Als de treden blijven: langer, zonder tonica-hulp, andere paletten. Daarna omkeringen of vierklanken. Je vult de trede van de grondtoon in, in C.',
    'Begin in 4/4, één maat, één stem, een vast patroon natikken. Als de puls blijft: 3/4, meer maten, twee stemmen. Daarna zelf een ritme intikken en dat als model gebruiken. Luisteren, vasthouden, natikken — in die volgorde.',
    'Begin op 60, kwartnoten, metronoom aan. Als die slag vastzit: halve of achtste, dan zestiende of triool. Daarna een ander tempo op de schuif. Zwaarder: metronoom stil na de tel. Meet de tikvertraging op elk apparaat of koptelefoon; Bluetooth is later.',
  ],
  en: [
    'Start in one octave, without the microphone. When that tone stays in the silence: add more octaves, so it can come from C3 or C5. Then singing or an instrument may be a check, not the aim. Sound character (combo, band, orchestra) belongs under Advanced: only after the identity holds in a plain tone.',
    'Start with the cue tone on, in one octave: the letter comes from there and you search there. When that holds: cue off. Then more octaves the letter comes from, or a wider slider. Extra step: keep the base tone in the same octave and set the slider to another octave. You search for the same letter higher or lower. Tap Again: the base tone stays the original note; the slider is where you search.',
    'Start with two tones in the same octave, a small distance, first tone shown, no piano and no singing. When the leap holds: hide the first tone. Then a larger distance, even across octaves. Then down instead of up. Optionally an octave appears so you can tap the second tone, or you sing it. The first tone stays the anchor in your head.',
    'Start with two tones in one octave. When the line stays: three, then four. Other octaves later. Tap heights, no names. Longer than four is the hard setting: more points, the same silence after hearing.',
    'Start with two tones backwards, in one octave. When that works: three, then four or more. Last tone first. Other octaves later. Tapping the line forwards is a different exercise; here the reverse forces you to hold the whole line inwardly.',
    'Start with a triad in root position, one octave. When the harmony stays in the silence: sevenths. Then inversions — those need two octaves on the slider. The check is whether you still hear the sound, not whether you can name the voicing.',
    'Start with major, one sounding tone, find the third. When that blend fits: minor, other qualities, or the fifth. Then two given tones, later inversions (two octaves on the slider). Names come after hearing.',
    'Start with a major triad and find the 9th. When that extension holds: 11 or 13. Then other qualities, or a seventh or shell as the given chord. A wider slider helps; 13 sits high. The answer stays the asked tone, not the name of the chord.',
    'Start short: two chords, a cadence, you hear the tonic. When the degrees stay: longer, without the tonic cue, other palettes. Then inversions or sevenths. You fill in the degree of each root, in C.',
    'Start in 4/4, one bar, one voice, tap back a fixed pattern. When the pulse stays: 3/4, more bars, two voices. Then tap a rhythm in yourself and use that as the model. Listen, hold, tap back — in that order.',
    'Start at 60, quarter notes, metronome on. When that beat holds: half or eighth, then sixteenth or triplet. Then another tempo on the slider. Harder: metronome silent after the count. Measure tap delay on each device or headphones; Bluetooth is later.',
  ],
  de: [
    'Beginne in einer Oktave, ohne Mikrofon. Wenn der Ton in der Stille bleibt: weitere Oktaven dazu, damit er aus C3 oder C5 kommen kann. Danach darf Singen oder ein Instrument die Probe sein, nicht das Ziel. Klangcharakter gehört zu Fortgeschritten: erst wenn die Identität in einem schlichten Ton hält.',
    'Beginne mit Beispielton an, in einer Oktave: der Buchstabe kommt von dort, und du suchst dort. Wenn das hält: Beispielton aus. Dann mehr Oktaven, aus denen der Buchstabe kommt, oder ein breiterer Schieber. Extra: halte den Grundton in derselben Oktave und setze den Schieber in eine andere. Du suchst denselben Buchstaben höher oder tiefer. Nochmal: der Grundton bleibt die ursprüngliche Note; der Schieber ist, wo du suchst.',
    'Beginne mit zwei Tönen in derselben Oktave, kleinem Abstand, ersten Ton anzeigen an, ohne Klavier und ohne Singen. Wenn der Sprung hält: ersten Ton anzeigen aus. Dann größerer Abstand, auch über Oktaven. Dann abwärts statt aufwärts. Optional erscheint eine Oktave zum Antippen des zweiten Tons, oder du singst ihn. Der erste Ton bleibt der Anker im Kopf.',
    'Beginne mit zwei Tönen in einer Oktave. Wenn die Linie bleibt: drei, dann vier. Andere Oktaven später. Höhen antippen, keine Namen. Länger als vier ist die schwere Stufe: mehr Punkte, dieselbe Stille nach dem Hören.',
    'Beginne mit zwei Tönen rückwärts, in einer Oktave. Wenn das gelingt: drei, dann vier oder mehr. Der letzte Ton zuerst. Andere Oktaven später. Die Linie vorwärts zu tippen ist eine andere Übung; hier zwingt die Umkehrung dich, die ganze Linie innerlich zu halten.',
    'Beginne mit einem Dreiklang in Grundstellung, eine Oktave. Wenn der Zusammenklang in der Stille bleibt: Vierklang. Dann Umkehrungen — dafür brauchst du zwei Oktaven auf dem Schieber. Die Probe ist, ob du den Klang noch hörst, nicht ob du die Lage benennen kannst.',
    'Beginne mit Dur, einem klingenden Ton, suche die Terz. Wenn das zusammenpasst: Moll, andere Qualitäten oder die Quinte. Dann zwei gegebene Töne, später Umkehrungen (zwei Oktaven auf dem Schieber). Namen kommen nach dem Hören.',
    'Beginne mit einem Dur-Dreiklang und suche die 9. Wenn die Extension hält: 11 oder 13. Dann andere Qualitäten, oder Vierklang oder Shell als gegebenes Akkord. Ein breiterer Schieber hilft; 13 liegt hoch. Die Antwort bleibt der gefragte Ton, nicht der Name des Akkords.',
    'Beginne kurz: zwei Akkorde, Kadenz, du hörst die Tonika. Wenn die Stufen bleiben: länger, ohne Tonika-Hilfe, andere Paletten. Dann Umkehrungen oder Vierklänge. Du füllst die Stufe des Grundtons aus, in C.',
    'Beginne in 4/4, einem Takt, einer Stimme, ein festes Muster nachklopfen. Wenn der Puls bleibt: 3/4, mehr Takte, zwei Stimmen. Dann selbst ein Rhythmus eintippen und das als Modell nutzen. Hören, halten, nachklopfen — in dieser Reihenfolge.',
    'Beginne bei 60, Viertel, Metronom an. Wenn der Schlag hält: Halbe oder Achtel, dann Sechzehntel oder Triole. Dann ein anderes Tempo am Schieber. Schwerer: Metronom still nach dem Zählzeit. Miss die Tippverzögerung an jedem Gerät oder Kopfhörer; Bluetooth ist später.',
  ],
  fr: [
    'Commence dans une octave, sans micro. Quand cette note tient dans le silence : ajoute d’autres octaves, pour qu’elle puisse venir de C3 ou C5. Ensuite, chanter ou un instrument peut servir de contrôle, pas de but. Le caractère du son est pour Avancé : seulement quand l’identité tient dans un son simple.',
    'Commence avec l’exemple sonore allumé, dans une octave : la lettre vient de là et tu cherches là. Quand ça tient : exemple éteint. Puis plus d’octaves d’où vient la lettre, ou un curseur plus large. Étape en plus : garde la note de base dans la même octave et mets le curseur sur une autre. Tu cherches la même lettre plus haut ou plus bas. Recommencer : la note de base reste la note d’origine ; le curseur est l’endroit où tu cherches.',
    'Commence par deux sons dans la même octave, petite distance, première note affichée, sans piano et sans chant. Quand le saut tient : cache la première note. Puis plus grande distance, même d’une octave à l’autre. Puis vers le bas au lieu du haut. En option, une octave apparaît pour toucher le second son, ou tu le chantes. Le premier son reste l’ancre dans ta tête.',
    'Commence par deux sons dans une octave. Quand la ligne tient : trois, puis quatre. Autres octaves plus tard. Touche les hauteurs, pas de noms. Plus de quatre, c’est le niveau lourd : plus de points, le même silence après l’écoute.',
    'Commence par deux sons à l’envers, dans une octave. Quand ça marche : trois, puis quatre ou plus. La dernière note d’abord. Autres octaves plus tard. Toucher la ligne en avant est un autre exercice ; ici l’envers t’oblige à tenir toute la ligne intérieurement.',
    'Commence par un accord parfait en position fondamentale, une octave. Quand l’harmonie tient dans le silence : accords de septième. Puis les renversements — il faut deux octaves sur le curseur. Le contrôle est d’entendre encore le son, pas de nommer la position.',
    'Commence en majeur, un son donné, cherche la tierce. Quand ça s’accorde : mineur, d’autres qualités, ou la quinte. Puis deux sons donnés, plus tard les renversements (deux octaves sur le curseur). Les noms viennent après l’écoute.',
    'Commence par un accord parfait majeur et cherche la 9. Quand cette extension tient : 11 ou 13. Puis d’autres qualités, ou un accord de septième ou un shell comme accord donné. Un curseur plus large aide ; la 13 est haute. La réponse reste la note demandée, pas le nom de l’accord.',
    'Commence court : deux accords, cadence, tu entends la tonique. Quand les degrés tiennent : plus long, sans aide de tonique, d’autres palettes. Puis renversements ou accords de septième. Tu indiques le degré de chaque fondamentale, en do.',
    'Commence en 4/4, une mesure, une voix, reproduire un motif fixe. Quand la pulsation tient : 3/4, plus de mesures, deux voix. Puis tape toi-même un rythme et prends-le comme modèle. Écouter, tenir, reproduire — dans cet ordre.',
    'Commence à 60, noires, métronome allumé. Quand ce temps tient : blanche ou croche, puis double croche ou triolet. Puis un autre tempo sur le curseur. Plus dur : métronome silencieux après le compte. Mesure le délai du tap sur chaque appareil ou casque ; le Bluetooth est plus tard.',
  ],
  es: [
    'Empieza en una octava, sin micrófono. Cuando esa nota se queda en el silencio: añade más octavas, para que pueda venir de C3 o C5. Después, cantar o un instrumento puede ser la comprobación, no el objetivo. El carácter del sonido es para Avanzado: solo cuando la identidad se sostiene en un tono simple.',
    'Empieza con el tono de ejemplo encendido, en una octava: la letra sale de ahí y buscas ahí. Cuando eso se sostiene: ejemplo apagado. Luego más octavas de donde sale la letra, o un deslizador más ancho. Paso extra: deja el tono base en la misma octava y pon el deslizador en otra. Buscas la misma letra más aguda o más grave. Otra vez: el tono base sigue siendo la nota original; el deslizador es donde buscas.',
    'Empieza con dos tonos en la misma octava, poca distancia, primer tono visible, sin piano y sin cantar. Cuando el salto se sostiene: oculta el primer tono. Luego más distancia, incluso entre octavas. Luego hacia abajo en vez de hacia arriba. Opcional: aparece una octava para pulsar el segundo tono, o lo cantas. El primer tono sigue siendo el ancla en la cabeza.',
    'Empieza con dos tonos en una octava. Cuando la línea se sostiene: tres, luego cuatro. Otras octavas después. Pulsa alturas, sin nombres. Más de cuatro es el nivel duro: más puntos, el mismo silencio después de oír.',
    'Empieza con dos tonos al revés, en una octava. Cuando sale: tres, luego cuatro o más. La última nota primero. Otras octavas después. Pulsar la línea hacia adelante es otro ejercicio; aquí el revés te obliga a retener toda la línea por dentro.',
    'Empieza con una tríada en estado fundamental, una octava. Cuando la sonoridad se queda en el silencio: séptimas. Luego inversiones: hacen falta dos octavas en el deslizador. La comprobación es si aún oyes el sonido, no si puedes nombrar la posición.',
    'Empieza en mayor, un tono que suena, busca la tercera. Cuando encaja: menor, otras cualidades, o la quinta. Luego dos tonos dados, más tarde inversiones (dos octavas en el deslizador). Los nombres vienen después de oír.',
    'Empieza con una tríada mayor y busca la 9. Cuando esa extensión se sostiene: 11 o 13. Luego otras cualidades, o una séptima o un shell como acorde dado. Un deslizador más ancho ayuda; la 13 queda alta. La respuesta sigue siendo la nota pedida, no el nombre del acorde.',
    'Empieza corto: dos acordes, cadencia, oyes la tónica. Cuando los grados se sostienen: más largo, sin ayuda de tónica, otras paletas. Luego inversiones o séptimas. Rellenas el grado de cada fundamental, en do.',
    'Empieza en 4/4, un compás, una voz, repetir un patrón fijo. Cuando el pulso se sostiene: 3/4, más compases, dos voces. Luego marca tú un ritmo y úsalo de modelo. Escuchar, retener, repetir — en ese orden.',
    'Empieza en 60, negras, metrónomo encendido. Cuando ese pulso se sostiene: blanca o corchea, luego semicorchea o tresillo. Luego otro tempo en el deslizador. Más difícil: metrónomo en silencio tras la cuenta. Mide el retraso del toque en cada aparato o auriculares; Bluetooth es más tarde.',
  ],
};

const FIND_BODY = {
  nl: 'Je ziet een letter. Optioneel hoor je die noot kort. Schuif daarna ernaartoe. Uitbreiding: dezelfde noot in een ander octaaf.',
  en: 'You see a letter. Optionally you hear that note briefly. Then slide to it. Expansion: the same note in another octave.',
  de: 'Du siehst einen Buchstaben. Optional hörst du den Ton kurz. Dann schiebst du hin. Erweiterung: derselbe Ton in einer anderen Oktave.',
  fr: 'Tu vois une lettre. En option tu entends cette note brièvement. Puis tu glisses vers elle. Extension : la même note dans une autre octave.',
  es: 'Ves una letra. Opcional: oyes esa nota un momento. Luego deslizas hacia ella. Ampliación: la misma nota en otra octava.',
};

for (const lang of Object.keys(LABEL)) {
  const pack = data[lang];
  pack.ui.labelsEx.harder = LABEL[lang];
  pack.steps[1].body = FIND_BODY[lang];
  HARDER[lang].forEach((text, i) => {
    pack.exercises[i].harder = text;
  });
}

fs.writeFileSync(path, 'window.SITE_I18N = ' + JSON.stringify(data, null, 2) + ';\n', 'utf8');
console.log('patched i18n.js', fs.statSync(path).size);
