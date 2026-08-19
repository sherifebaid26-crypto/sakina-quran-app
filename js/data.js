/* ============================================================
   SAKINA — Quran Audio · data model
   ------------------------------------------------------------
   CRITICAL DESIGN RULE (fix #2):
   Every track is resolved from an EXPLICIT surahId + reciterId.
   No array-position/index assumptions anywhere.
   Track = { reciterId, surahId, surahName, surahNameAr, audioUrl }
   ============================================================ */

export const APP_NAME = "Sakina";

/* ---------------- Surah metadata (114) ---------------- */
let SURAHS = [];
export function loadSurahs(list) { SURAHS = list; }
export const getSurahs = () => SURAHS;
export const getSurah = (id) => SURAHS.find((s) => s.id === id) || null;
export const surahCount = () => SURAHS.length;

/* ---------------- Reciters ---------------- */
/*
  photo provenance (all REAL photographs, verified by source):
   - quran.com official reciter profile images (static.qurancdn.com)
   - Wikimedia/Wikipedia captioned portraits
   - assabile.com curated reciter photo album
  audioSource templates were validated against the live servers
  (surah 1 & 2 returned 200 with correct Al-Fatihah / Al-Baqarah sizes).
*/

export const RECITERS = [
  {
    id: "alafasy",
    name: "Mishary Rashid Alafasy",
    nameAr: "مشاري راشد العفاسي",
    country: "Kuwait",
    city: "Kuwait City",
    bio: "World-renowned qari and munshid. Imam of Masjid Al-Kabir in Kuwait City, known worldwide for his serene full-mushaf murattal recordings.",
    years: null,
    riwayah: "Hafs",
    photo: "assets/reciters/alafasy.jpg",
    photoCredit: "Quran.com official reciter profile",
    source: { base: "https://server8.mp3quran.net/afs/", zeroPad: 3 },
    localFatihah: "assets/audio/001-alafasy.mp3",
    featured: true,
  },
  {
    id: "sudais",
    name: "Abdul Rahman Al-Sudais",
    nameAr: "عبد الرحمن السديس",
    country: "Saudi Arabia",
    city: "Makkah",
    bio: "Imam and khateeb of Masjid al-Haram in Makkah and President General of the Affairs of the Two Holy Mosques. A voice synonymous with the Haram since 1984.",
    years: null,
    riwayah: "Hafs",
    photo: "assets/reciters/sudais.jpg",
    photoCredit: "Quran.com official reciter profile",
    source: { base: "https://download.quranicaudio.com/quran/abdurrahmaan_as-sudays/", zeroPad: 3 },
    localFatihah: "assets/audio/002-sudais.mp3",
    featured: true,
  },
  {
    id: "shuraim",
    name: "Saud Al-Shuraim",
    nameAr: "سعود الشريم",
    country: "Saudi Arabia",
    city: "Makkah",
    bio: "Former imam and khateeb of Masjid al-Haram, senior qadi and hafiz. One of the most beloved voices of Makkan taraweeh for two decades.",
    years: null,
    riwayah: "Hafs",
    photo: "assets/reciters/shuraim.jpg",
    photoCredit: "Quran.com official reciter profile",
    source: { base: "https://server7.mp3quran.net/shur/", zeroPad: 3 },
    localFatihah: "assets/audio/003-shuraim.mp3",
    featured: true,
  },
  {
    id: "muaiqly",
    name: "Maher Al-Muaiqly",
    nameAr: "ماهر المعيقلي",
    country: "Saudi Arabia",
    city: "Makkah",
    bio: "Imam and khateeb of Masjid al-Haram since 2005 and of Masjid an-Nabawi. His taraweeh and murattal recitations are followed by millions every Ramadan.",
    years: null,
    riwayah: "Hafs",
    photo: "assets/reciters/muaiqly.jpg",
    photoCredit: "Quran.com official reciter profile",
    source: { base: "https://server12.mp3quran.net/maher/", zeroPad: 3 },
    localFatihah: "assets/audio/004-muaiqly.mp3",
    featured: true,
  },
  {
    id: "ghamdi",
    name: "Saad Al-Ghamdi",
    nameAr: "سعد الغامدي",
    country: "Saudi Arabia",
    city: "Madinah",
    bio: "Saudi qari and former imam of Masjid Quba in Madinah. His measured, hushed murattal mushaf is a staple of every Quran app.",
    years: null,
    riwayah: "Hafs",
    photo: "assets/reciters/ghamdi.jpg",
    photoCredit: "Quran.com official reciter profile",
    source: { base: "https://server7.mp3quran.net/s_gmd/", zeroPad: 3 },
    localFatihah: "assets/audio/005-ghamdi.mp3",
    featured: true,
  },
  {
    id: "kamil",
    name: "Abdullah Kamil",
    nameAr: "عبد الله كامل",
    country: "Egypt",
    city: "Fayoum",
    bio: "The beloved Egyptian qari (1985–2023) known for his deeply moving recitation. Blind since birth, he memorised the Quran in braille, graduated from Dar Al-Ulum, and became famous nationwide after winning first place on Al-Mizmar Al-Dhahabi — earning him the title 'Ambassador of the Quran'.",
    years: "1985–2023",
    riwayah: "Hafs",
    photo: "assets/reciters/kamil.jpg",
    photoCredit: "Al Jazeera news photo",
    source: { base: "https://server16.mp3quran.net/kamel/Rewayat-Hafs-A-n-Assem/", zeroPad: 3 },
    localFatihah: "assets/audio/011-kamil.mp3",
    featured: true,
  },
  {
    id: "husary",
    name: "Mahmoud Khalil Al-Husary",
    nameAr: "محمود خليل الحصري",
    country: "Egypt",
    city: "Tanta / Cairo",
    bio: "The celebrated Egyptian qari (1917–1980) famed for flawless tajweed. His 1961 murattal mushaf was the first complete Quran recording broadcast by Egyptian radio.",
    years: "1917–1980",
    riwayah: "Hafs",
    photo: "assets/reciters/husary.jpg",
    photoCredit: "Quran.com official reciter profile",
    source: { base: "https://server13.mp3quran.net/husr/", zeroPad: 3 },
    localFatihah: "assets/audio/006-husary.mp3",
  },
  {
    id: "minshawi",
    name: "Mohamed Siddiq Al-Minshawi",
    nameAr: "محمد صديق المنشاوي",
    country: "Egypt",
    city: "Sohag",
    bio: "One of Egypt's most emotional voices (1920–1969), treasured for his mujawwad and murattal mushaf recordings and his distinctive penetrating style.",
    years: "1920–1969",
    riwayah: "Hafs",
    photo: "assets/reciters/minshawi.jpg",
    photoCredit: "Wikipedia (Elminshwey.jpg)",
    source: { base: "https://server10.mp3quran.net/minsh/", zeroPad: 3 },
    localFatihah: "assets/audio/007-minshawi.mp3",
  },
  {
    id: "abdulbasit",
    name: "Abdul Basit Abdus Samad",
    nameAr: "عبد الباسط عبد الصمد",
    country: "Egypt",
    city: "Armant",
    bio: "Known as the golden throat (1927–1988), one of the most widely listened-to reciters of the 20th century with a uniquely powerful yet warm delivery.",
    years: "1927–1988",
    riwayah: "Hafs",
    photo: "assets/reciters/abdulbasit.jpg",
    photoCredit: "Quran.com official reciter profile",
    source: { base: "https://server7.mp3quran.net/basit/", zeroPad: 3 },
    localFatihah: "assets/audio/008-abdulbasit.mp3",
  },
  {
    id: "shatri",
    name: "Abu Bakr Al-Shatri",
    nameAr: "أبو بكر الشاطري",
    country: "Saudi Arabia",
    city: "Jeddah",
    bio: "Saudi imam and qari known for a clean, gentle murattal style. Imam of mosques in Jeddah and a popular taraweeh voice during Ramadan.",
    years: null,
    riwayah: "Hafs",
    photo: "assets/reciters/shatri.jpg",
    photoCredit: "Assabile.com reciter photo album",
    source: { base: "https://server11.mp3quran.net/shatri/", zeroPad: 3 },
    localFatihah: "assets/audio/009-shatri.mp3",
  },
  {
    id: "dosari",
    name: "Yasser Al-Dosari",
    nameAr: "ياسر الدوسري",
    country: "Saudi Arabia",
    city: "Riyadh",
    bio: "Saudi qari and scholar who leads taraweeh in Masjid al-Haram. His murattal mushaf is among the most streamed on Quran audio platforms.",
    years: null,
    riwayah: "Hafs",
    photo: "assets/reciters/dosari.jpg",
    photoCredit: "Wikipedia (Yasser Al-Dosari.jpg)",
    source: { base: "https://server11.mp3quran.net/yasser/", zeroPad: 3 },
    localFatihah: "assets/audio/010-dosari.mp3",
  },
  {
    id: "jumah",
    name: "Saud Al Jumah",
    nameAr: "سعود آل جمعة",
    country: "Saudi Arabia",
    city: "Riyadh",
    bio: "Saudi qari and imam of Masjid Uthman Al-Rashid in Riyadh, beloved for moving taraweeh recitations. A complete structured mushaf of his is not yet published — his profile shows only verified recordings, and never another reciter's voice.",
    years: null,
    riwayah: "Hafs",
    photo: null,
    photoCredit: null,
    source: null,
    localFatihah: null,
    unavailable: true,
  },
];

export const getReciter = (id) => RECITERS.find((r) => r.id === id) || null;

/* ============================================================
   Track resolution — THE ONLY place audio URLs are built.
   URL is always derived from (reciterId, surahId) explicitly.
   ============================================================ */

export function audioUrlFor(reciter, surahId) {
  if (!reciter || !reciter.source) return null;
  if (surahId < 1 || surahId > 114) return null;
  const n = reciter.source.zeroPad
    ? String(surahId).padStart(reciter.source.zeroPad, "0")
    : String(surahId);
  return reciter.source.base + n + ".mp3";
}

/** Local bundled copy of the same Al-Fatihah recording (works offline). */
export function localFatihahFor(reciter) {
  return reciter && reciter.localFatihah ? reciter.localFatihah : null;
}

/* ---------------- Track objects ---------------- */

export function buildTrack(reciterId, surahId, opts = {}) {
  const reciter = getReciter(reciterId);
  const surah = getSurah(surahId);
  if (!reciter || !surah) return null;

  const useLocal = surahId === 1 && !opts.remote && localFatihahFor(reciter);
  const audioUrl = useLocal ? localFatihahFor(reciter) : audioUrlFor(reciter, surahId);
  if (!audioUrl) return null;

  return {
    reciterId: reciter.id,
    reciterName: reciter.name,
    reciterNameAr: reciter.nameAr,
    photo: reciter.photo,
    surahId: surah.id,
    surahName: surah.name,
    surahNameAr: surah.nameAr,
    audioUrl,
    local: !!useLocal,
  };
}

/* ---------------- Validation (used at runtime + tests) ---------------- */

export function validateTrack(track) {
  const problems = [];
  const reciter = getReciter(track.reciterId);
  const surah = getSurah(track.surahId);
  if (!reciter) problems.push("unknown reciterId: " + track.reciterId);
  if (!surah) problems.push("unknown surahId: " + track.surahId);
  if (!track.audioUrl) problems.push("missing audioUrl");
  if (reciter && reciter.source) {
    const expected = audioUrlFor(reciter, track.surahId);
    const local = localFatihahFor(reciter);
    const isLocalOk = track.surahId === 1 && local && track.audioUrl === local;
    if (!isLocalOk && track.audioUrl !== expected) {
      problems.push("audioUrl does not match (reciterId, surahId) mapping");
    }
  }
  if (track.surahName !== surah?.name) problems.push("surahName mismatch with surahId");
  if (track.reciterName !== reciter?.name) problems.push("reciterName mismatch with reciterId");
  return problems;
}

/** Build the ordered queue for a reciter (1..114 by surahId). */
export function queueForReciter(reciterId) {
  const reciter = getReciter(reciterId);
  if (!reciter) return [];
  const q = [];
  for (let id = 1; id <= 114; id++) {
    const t = buildTrack(reciterId, id);
    if (t) q.push(t);
  }
  return q;
}

/* ---------------- Persistence (localStorage) ---------------- */

const KEY = "sakina.v1.";
export const Store = {
  get(k, fallback) {
    try {
      const v = localStorage.getItem(KEY + k);
      return v === null ? fallback : JSON.parse(v);
    } catch { return fallback; }
  },
  set(k, v) {
    try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch {}
  },
  remove(k) {
    try { localStorage.removeItem(KEY + k); } catch {}
  },
};

export const storeDefaults = {
  favorites: { reciters: [], surahs: [] },
  playlists: [],
  settings: {
    speed: 1,
    autoAdvance: true,
    showTranslation: true,
    showVerseNumbers: true,
    arabicFontSize: 34,
    accent: "sapphire",
    quranVolume: 0.9,
    bgVolume: 0.45,
  },
  lastPlayed: null,   // { reciterId, surahId, position, updatedAt }
  recent: [],          // [{ reciterId, surahId, at }]
  recentReciters: [],  // [reciterId]
};
