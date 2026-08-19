# Sakina — Premium Quran Audio App

A calm, cinematic, glassmorphism Quran listening app. Dark charcoal surfaces, frosted-glass players,
real reciter photographs, explicit surah-ID audio mapping, reading mode with live verse highlighting,
and independent Quran + ambient volume mixing.

## v1.8 — what's new
- **4 new reciters**: Mohamed Ahmed Hassan (25 surahs), Islam Sobhi (109), Abdulrahman Mosaad (12 selected), Moaz Syam (32 selected) — all with authentic photos, verified sources, and honest "Unavailable" states for missing surahs (never mislabeled audio)
- **Arabic UI**: full interface translation (الواجهة كاملة بالعربية) with RTL layout, Arabic reciter names/bios/locations — switchable from Settings
- **Verse-sync fix**: active verse now follows the actual voice with pause-aware timing (no more highlighting ahead of the recitation)
- **Overlay hygiene**: navigating routes always closes sheets/dropdowns

## The three fixes (as requested)

### 1 · Real, authentic reciter photographs
Every reciter portrait is a **real photograph** with documented provenance — no AI faces, no generic
portraits, no reused files:

| Reciter | Source |
|---|---|
| Mishary Alafasy | Quran.com official reciter profile (static.qurancdn.com) |
| Abdul Rahman Al-Sudais | Quran.com official reciter profile |
| Saud Al-Shuraim | Quran.com official reciter profile |
| Maher Al-Muaiqly | Quran.com official reciter profile |
| Saad Al-Ghamdi | Quran.com official reciter profile |
| Mahmoud Khalil Al-Husary | Quran.com official reciter profile |
| Mohamed Siddiq Al-Minshawi | Wikipedia (Elminshwey.jpg) |
| Abdul Basit Abdus Samad | Quran.com official reciter profile |
| Abu Bakr Al-Shatri | Assabile.com reciter photo album (full-size) |
| Yasser Al-Dosari | Wikipedia (Yasser Al-Dosari.jpg) |
| Abdullah Kamil | Al Jazeera news photo (death coverage, 2023) |
| Mohamed Ahmed Hassan | Elbalad.news news photo |
| Islam Sobhi | Alsear.com portrait |
| Abdulrahman Mosaad | Qabilaa.com portrait |
| Moaz Syam | Archive.org video thumbnail |
| Saud Al Jumah | **No verifiable photo — neutral monogram placeholder**, per the "never fake it" rule |

Images are **local, stable assets** (`assets/reciters/*.jpg`, 512×512, ~30–70 KB each) — never random
or hotlinked. Tests assert every photo file exists, is unique (MD5), and is never reused.

### 2 · Correct surah ↔ audio mapping (the critical bug)
- Every track is an explicit object: `{ reciterId, surahId, surahName, surahNameAr, audioUrl }`.
- `audioUrlFor(reciterId, surahId)` is the **only** place URLs are built — from the surah ID, never
  from array position: `server8.mp3quran.net/afs/002.mp3` ⇢ surah 2 (Al-Baqarah), `…/001.mp3` ⇢ surah 1.
- `validateTrack()` rejects any track whose URL, name, or reciter doesn't match its IDs.
- Switching surahs is a strict sequence: **pause → clear src → load new URL → position 0 →
  update metadata → play**. A stale URL can never survive a switch.
- Full-surah files play **through the entire surah** (no stop after Bismillah, no jump to another
  surah). Only when a surah ends does the queue advance per the repeat setting.
- Audio sources (verified 200/206 + range support on every URL):
  - mp3quran.net Hafs Murattal servers (Alafasy, Shuraim, Muaiqly, Ghamdi, Husary, Minshawi,
    Abdul Basit, Shatri, Dosari, **Abdullah Kamil** — 114 surahs, verified)
  - download.quranicaudio.com (Sudais full mushaf, 192 kbps)
  - Al-Fatihah for every reciter is **bundled locally** (`assets/audio/`) so playback works offline;
    duration-validated (37–63 s — genuine full Al-Fatihah, not a preview).
- **Saud Al Jumah**: no structured full-mushaf source exists anywhere (only live/YouTube recordings).
  Per your own rule, his profile shows the truth — no audio is mislabeled with another reciter's voice.

### 3 · Glassmorphism player — cinematic storm edition (matches the reference)
- **Storm environment**: the expanded player floats inside a dark cinematic storm — three
  drifting cloud layers, three staggered lightning bolts with soft white-blue glow (subtle,
  slow flashes that never fight the UI), faint rain streaks, drifting mist and a vignette.
  Pure CSS — no images, GPU-friendly.
- **Verses panel**: the "Show Verses" glass button slides a frosted panel up over the player
  (bottom-sheet on mobile). It shows the current surah's verses with Arabic (Amiri Quran) +
  Saheeh International translation, an Arabic/Translation toggle, and the **active verse
  follows the audio in real time** (highlighted glass card + glow + auto-scroll). Tapping a
  verse seeks the recitation. A compact glass mini-player (reciter photo, prev/play/next,
  progress) stays docked while reading.
- **Smart Escape**: closes layers one at a time — verses panel → sheets → dropdowns → player.

### 3b · Glassmorphism player (core, as before)
- Mini player: floating translucent glass pill — `blur(24px) saturate(160%)`, gradient translucent
  surface, hairline border, inner highlight, soft shadow, progress hairline.
- Expanded player: floating frosted panel over a **darkened, blurred backdrop** (the app stays
  visible underneath), 28 px radius, thin white border, subtle blue/violet ambient glow that drifts
  slowly behind the glass. Controls: speed · prev · play/pause · next · sleep timer, progress slider
  with times, **two independent volume sliders (Quran / Background sound)**, and the rounded
  "Background sound" pill.
- Ambient sounds (Rain, **Thunderstorm with lightning**, Water, Forest, Wind, Ocean, Fireplace,
  Night) are generated live with the Web Audio API — no files, fully independent gain from the
  Quran audio.
- **Live ambient backdrop**: while an ambient sound is active, an animated visual layer runs
  behind the whole app — falling rain streaks, lightning flashes, drifting waves, flickering
  fire glow with rising embers, twinkling stars, sweeping wind, forest light — glowing through
  the glass player, the mini-player, sheets and the (now translucent) reading screen. Selecting
  "None" fades the backdrop away.

## Architecture

```
quran-app/
  index.html              single-page shell
  css/app.css             design system (glass tokens, components, responsive)
  js/data.js              surahs, reciters, THE track resolver + validation + storage
  js/audio.js             playback engine (strict track state, queue, sleep timer, media session)
  js/ambience.js          procedural ambient sound engine
  js/ui.js                screens, mini/expanded player, sheets, dropdowns, toasts
  js/app.js               bootstrap + console self-check of the mapping
  data/surahs.json        114 surah metadata (names EN/AR, ayah counts, Makki/Madani)
  data/quran-ar.json      6 236 verses, Tanzil Uthmani Hafs
  data/quran-en.json      6 236 verses, Saheeh International
  assets/reciters/*.jpg   authentic reciter photographs (512×512)
  assets/audio/*.mp3      bundled Al-Fatihah per reciter
  assets/fonts/*.woff2    Inter, Noto Sans Arabic, Amiri Quran (local — offline-safe)
  tests/verify.mjs        unit + data-integrity suite (node tests/verify.mjs)
  server.mjs              static dev server with HTTP Range support (audio seeking)
```

## Run

```bash
cd quran-app
node server.mjs          # → http://localhost:8080
npm test                 # unit / data-integrity suite
```

## Verification results

| Suite | Result |
|---|---|
| Unit + data integrity (`tests/verify.mjs`) | **184 / 184** ✓ |
| E2E acceptance in headless Chromium (TEST 1 · 2 · 3 + reading + mobile) | **43 / 43** ✓ |
| Functional flows (playlists, favorites, queue, sleep, verse tap, auto-advance) | **16 / 16** ✓ |
| Layout sanity (overflow, centering, images) — desktop 1440px & mobile 390px | no issues ✓ |

### TEST 1 — Reciter → Al-Fatihah → Play
Al-Fatihah by the selected reciter starts from Bismillah and **continues through all 7 verses**
(position advanced past 11 s at the 10 s mark, still on surah 1). ✓

### TEST 2 — Switch to Al-Baqarah mid-play
Previous audio paused, source swapped to `…/002.mp3`, position reset to ~0, player title/reciter
updated, Al-Baqarah playing from its beginning (still surah 2 after 4 s). ✓

### TEST 3 — Expanded player glassmorphism
Card: `backdrop-filter: blur(26px) saturate(1.6)`, translucent gradient surface, 28 px radius,
1 px border, soft shadow; backdrop: dark translucent + `blur(16px)`; both volume sliders verified
independent; ambient selector + procedural rain verified. ✓

## Notes
- Screenshots of the running app: `../screenshots/`
- Recitation audio and photos remain the property of their respective owners; used here for
  identification and personal listening.
- Data: Tanzil text via the open quran-api mirror; Saheeh International via the Quran.com API.
