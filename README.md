# Audiation

Klein startproject om te zien en horen wat je programmeert: drie knoppen (Do-Mi-Sol) spelen een toon.

Werkt in de browser op deze Windows-pc en op een Android- of iPhone via de app Expo Go.

## Starten

In deze map:

```powershell
npm start
```

Daarna:

- druk op w voor de browser
- of scan de QR-code met Expo Go op je telefoon (zelfde wifi als de pc)

Telefoon-apps:

- Android: https://play.google.com/store/apps/details?id=host.exp.exponent
- iPhone: https://apps.apple.com/app/expo-go/id982107779

## Projectstructuur

- App.tsx — het scherm
- src/notes.ts — Do, Mi, Sol (toonhoogte en kleur)
- src/NoteButton.tsx — knop die de toon afspeelt
- assets/tones/ — gegenereerde WAV-bestanden
- scripts/generate-tones.mjs — maakt die WAV-bestanden opnieuw

Tonen opnieuw genereren:

```powershell
npm run tones
```

## Let op

Een iPhone-simulator draait niet op Windows. Testen op een echte iPhone met Expo Go is de bedoeling.
