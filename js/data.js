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
   - alsear.com / elbalad.news / qabilaa.com news portraits
   - archive.org video thumbnails (Moaz Syam)
  audioSource templates were validated against the live servers.
  `source.available` = list of surah ids present (partial mushafs).
  `source.files`     = per-surah filename map (archive.org Arabic names).
*/

export const RECITERS = [
  {
    id: "alafasy",
    name: "Mishary Rashid Alafasy",
    nameAr: "مشاري راشد العفاسي",
    country: "Kuwait",
    countryAr: "الكويت",
    city: "Kuwait City",
    cityAr: "مدينة الكويت",
    bio: "World-renowned qari and munshid. Imam of Masjid Al-Kabir in Kuwait City, known worldwide for his serene full-mushaf murattal recordings.",
    bioAr: "قارئ كويتي عالمي وإمام مسجد الكبير بالكويت، اشتهر بمصاحفه المرتلة الهادئة وأناشيده المؤثرة.",
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
    countryAr: "السعودية",
    city: "Makkah",
    cityAr: "مكة المكرمة",
    bio: "Imam and khateeb of Masjid al-Haram in Makkah and President General of the Affairs of the Two Holy Mosques. A voice synonymous with the Haram since 1984.",
    bioAr: "إمام وخطيب المسجد الحرام بمكة والرئيس العام لشؤون الحرمين الشريفين، من أبرز أصوات الحرم منذ عام 1984.",
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
    countryAr: "السعودية",
    city: "Makkah",
    cityAr: "مكة المكرمة",
    bio: "Former imam and khateeb of Masjid al-Haram, senior qadi and hafiz. One of the most beloved voices of Makkan taraweeh for two decades.",
    bioAr: "إمام وخطيب سابق بالمسجد الحرام وقاضٍ كبير، من أشهر أصوات تراويح مكة المكرمة لعقدين من الزمن.",
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
    countryAr: "السعودية",
    city: "Makkah",
    cityAr: "مكة المكرمة",
    bio: "Imam and khateeb of Masjid al-Haram since 2005 and of Masjid an-Nabawi. His taraweeh and murattal recitations are followed by millions every Ramadan.",
    bioAr: "إمام وخطيب المسجد الحرام والمسجد النبوي، من أكثر الأصوات استماعًا في صلوات التراويح حول العالم.",
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
    countryAr: "السعودية",
    city: "Madinah",
    cityAr: "المدينة المنورة",
    bio: "Saudi qari and former imam of Masjid Quba in Madinah. His measured, hushed murattal mushaf is a staple of every Quran app.",
    bioAr: "قارئ سعودي وإمام سابق لمسجد قباء بالمدينة المنورة، مشهور بمصحفه المرتل الهادئ والمتقن.",
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
    countryAr: "مصر",
    city: "Fayoum",
    cityAr: "الفيوم",
    bio: "The beloved Egyptian qari (1985–2023) known for his deeply moving recitation. Blind since birth, he memorised the Quran in braille, graduated from Dar Al-Ulum, and became famous nationwide after winning first place on Al-Mizmar Al-Dhahabi — earning him the title 'Ambassador of the Quran'.",
    bioAr: "القارئ المصري الشهير (1985–2023) الملقب بسفير القرآن، كفيف منذ ولادته حفظ القرآن بطريقة برايل، وبطل برنامج المزمار الذهبي.",
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
    countryAr: "مصر",
    city: "Tanta / Cairo",
    cityAr: "طنطا / القاهرة",
    bio: "The celebrated Egyptian qari (1917–1980) famed for flawless tajweed. His 1961 murattal mushaf was the first complete Quran recording broadcast by Egyptian radio.",
    bioAr: "القارئ المصري صاحب الترتيل المتقن (1917–1980)، وكان مصحفه المرتل عام 1961 أول تسجيل كامل للقرآن تذيعه الإذاعة المصرية.",
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
    countryAr: "مصر",
    city: "Sohag",
    cityAr: "سوهاج",
    bio: "One of Egypt's most emotional voices (1920–1969), treasured for his mujawwad and murattal mushaf recordings and his distinctive penetrating style.",
    bioAr: "القارئ المصري (1920–1969) صاحب الصوت الباكي المميز، من أعمدة التلاوة في مصر والعالم.",
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
    countryAr: "مصر",
    city: "Armant",
    cityAr: "أرمنت",
    bio: "Known as the golden throat (1927–1988), one of the most widely listened-to reciters of the 20th century with a uniquely powerful yet warm delivery.",
    bioAr: "القارئ المصري صاحب الحنجرة الذهبية (1927–1988)، من أكثر قراء القرآن استماعًا في القرن العشرين.",
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
    countryAr: "السعودية",
    city: "Jeddah",
    cityAr: "جدة",
    bio: "Saudi imam and qari known for a clean, gentle murattal style. Imam of mosques in Jeddah and a popular taraweeh voice during Ramadan.",
    bioAr: "إمام وقارئ سعودي من جدة، معروف بأدائه المرتل النظيف والهادئ، وصوت محبب في تراويح رمضان.",
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
    countryAr: "السعودية",
    city: "Riyadh",
    cityAr: "الرياض",
    bio: "Saudi qari and scholar who leads taraweeh in Masjid al-Haram. His murattal mushaf is among the most streamed on Quran audio platforms.",
    bioAr: "قارئ سعودي وعالم دين، إمام تراويح المسجد الحرام، من أكثر المصاحف المرتلة استماعًا.",
    years: null,
    riwayah: "Hafs",
    photo: "assets/reciters/dosari.jpg",
    photoCredit: "Wikipedia (Yasser Al-Dosari.jpg)",
    source: { base: "https://server11.mp3quran.net/yasser/", zeroPad: 3 },
    localFatihah: "assets/audio/010-dosari.mp3",
  },
  {
    id: "mohamedahmedhassan",
    name: "Mohamed Ahmed Hassan",
    nameAr: "محمد أحمد حسن",
    country: "Egypt",
    countryAr: "مصر",
    city: "Alexandria",
    cityAr: "الإسكندرية",
    bio: "The legendary Egyptian qari (1947–2025) from Alexandria, known as 'Al-Qari' Al-Saghir'. Blind since birth, he memorised the Quran as a child and rose to become one of Egypt's most emotionally powerful voices.",
    bioAr: "القارئ المصري الكبير (1947–2025) من الإسكندرية، عُرف بلقب «القارئ الصغير»، كفيف حفظ القرآن صغيرًا وأصبح من أكثر الأصوات المصرية خشوعًا وتأثيرًا.",
    years: "1947–2025",
    riwayah: "Hafs",
    photo: "assets/reciters/mohamedahmedhassan.jpg",
    photoCredit: "Elbalad.news photo",
    source: { base: "https://archive.org/download/muhammad-ahmad-hassan/", zeroPad: 3, available: [1, 7, 9, 13, 15, 17, 18, 19, 20, 23, 34, 35, 36, 47, 48, 49, 55, 56, 58, 67, 69, 75, 87, 89, 92] },
    localFatihah: "assets/audio/012-mohamedahmedhassan.mp3",
    featured: true,
  },
  {
    id: "islamsobhi",
    name: "Islam Sobhi",
    nameAr: "إسلام صبحي",
    country: "Egypt",
    countryAr: "مصر",
    city: "Menoufia",
    cityAr: "المنوفية",
    bio: "Egyptian qari (b. 1998), a medical student at Menoufia University whose deeply moving recitations became a global digital phenomenon.",
    bioAr: "قارئ مصري شاب (مواليد 1998) طالب بكلية الطب، تحولت تلاواته الخاشعة إلى ظاهرة عالمية على الإنترنت.",
    years: null,
    riwayah: "Hafs",
    photo: "assets/reciters/islamsobhi.jpg",
    photoCredit: "Alsear.com portrait",
    source: { base: "https://server14.mp3quran.net/islam/Rewayat-Hafs-A-n-Assem/", zeroPad: 3, available: (() => { const a = []; for (let i = 1; i <= 114; i++) a.push(i); return a.filter((s) => ![37, 39, 40, 45, 65].includes(s)); })() },
    localFatihah: "assets/audio/013-islamsobhi.mp3",
    featured: true,
  },
  {
    id: "abdulrahmanmusad",
    name: "Abdulrahman Mosaad",
    nameAr: "عبد الرحمن مسعد",
    country: "Egypt",
    countryAr: "مصر",
    city: "Cairo",
    cityAr: "القاهرة",
    bio: "Egyptian qari (b. 1989) whose gentle, deeply emotional recitations have spread across social media. A selection of his verified recordings is included.",
    bioAr: "قارئ مصري شاب (مواليد 1989) اشتهر بتلاواته الهادئة المؤثرة التي انتشرت على السوشيال ميديا. التطبيق يضم نخبة من تلاواته الموثقة.",
    years: null,
    riwayah: "Hafs",
    photo: "assets/reciters/abdulrahmanmusad.jpg",
    photoCredit: "Qabilaa.com portrait",
    source: { base: "https://archive.org/download/010_20221110/", zeroPad: 3, available: [10, 19, 23, 29, 32, 49, 73, 78, 87, 88, 100, 107] },
    localFatihah: null,
  },
  {
    id: "moazsyam",
    name: "Moaz Syam",
    nameAr: "معاذ صيام",
    country: "Egypt",
    countryAr: "مصر",
    city: "Cairo",
    cityAr: "القاهرة",
    bio: "Young Egyptian qari (Moaz Ayman Syam) whose calm, hushed recitations have become a favourite of the social-media generation. A selection of his verified recordings is included.",
    bioAr: "قارئ مصري شاب (معاذ أيمن صيام) اشتهر بتلاواته الهادئة الخاشعة على السوشيال ميديا، ويضم التطبيق نخبة من تلاواته الموثقة.",
    years: null,
    riwayah: "Hafs",
    photo: "assets/reciters/moazsyam.jpg",
    photoCredit: "Archive.org video thumbnail",
    source: {
      base: "https://archive.org/download/20240226_20240226_1858/",
      files: {"1":"001  1  سورة الفاتحة معاذ ايمن صيام.mp3", "12":"012  12  سورة يوسف كاملة _ معاذ أيمن  Moaz syam.mp3", "17":"017  17 سورة الاسراء كاملة _ للقارئ معاذ أيمن  Moaz Syam.mp3", "18":"018  18  سورة الكهف كاملة _ معاذ أيمن صيام  Moaz Syam.mp3", "19":"019  19  سورة مريم كاملة _ من أجمل السور   معاذ أيمن  MoazSyam.mp3", "2":"002  2  سورة البقرة (كاملة) _ للقارئ  معاذ أيمن  Surah Albaqarah  Moaz Syam.mp3", "20":"020  20  ما تيسر من سورة طه _ معاذ أيمن.mp3", "23":"023  23  سورة المؤمنون _ تلاوة هادئة _ معاذ أيمن  Moaz Syam.mp3", "27":"027  27  سورة النمل من أروع السور _ القارئ معاذ أيمن  Moez syam.mp3", "3":"003  3  تلاوة هادئة _ ما تيسر من سورة آل عمران  معاذ أيمن.mp3", "32":"032  32  سورة السجدة _ معاذ أيمن  Moaz Syam.mp3", "39":"039  39  سورة الزمر.mp3", "4":"004  4  سورة النساء [ كاملة ] _ معاذ ايمن.mp3", "44":"044  44  سورة الدخان _ معاذ أيمن  Moaz Syam.mp3", "49":"049  49  سورة الحجرات _ من أروع السور _ معاذ أيمن  Moaz Syam.mp3", "50":"050  50  من أروع السور _ سورة ق كاملة _ معاذ أيمن  Moaz syam.mp3", "51":"051  51 سورة الذاريات _ راحة للقلوب _ معاذ أيمن  Moaz syam.mp3", "52":"052  52  سورة الطور سورة تريح القلوب بسماعها _ معاذ أيمن  Moaz Syam.mp3", "53":"053  53 سورة النجم _ راحة للقلوب _ معاذ أيمن صيام  Moaz Syam.mp3", "54":"054  54  سورة القمر _ معاذ أيمن  Moaz Syam.mp3", "55":"055  55  سورة الرحمن (عروس القران ) _ معاذ أيمن  Moaz Syam.mp3", "56":"056  56  سورة الواقعة _ معاذ أيمن  Moaz Syam.mp3", "58":"058  58  أرح سمعك وقلبك _ سورة المجادلة [ كاملة ] _ معاذ أيمن صيام  _.mp3", "59":"059  59  سورة الحشر   معاذ أيمن  Moaz syam.mp3", "67":"067  67  سورة الملك _ معاذ أيمن  Moaz Syam.mp3", "68":"068  68  سورة القلم وقصة أصحاب الجنة _ معاذ أيمن  Moaz Syam.mp3", "69":"069  69  سورة الحاقة كاملة _ معاذ أيمن صيام  Moaz Syam.mp3", "72":"072  72  سورة الجن _ تلاوة هادئة _ معاذ أيمن  Moaz Syam.mp3", "75":"075  75  ســــــورة القيامة _ معاذ أيمن صيام  al_qyamah _ Moaz ayman syam.mp3", "76":"076  76  سورة الإنسان _ معاذ أيمن صيام  Moaz syam.mp3", "78":"078  78  سورة النبأ  معاذ صيام.mp3", "79":"079  79  سورة النازعات _ معاذ أيمن.mp3"},
    },
    localFatihah: "assets/audio/014-moazsyam.mp3",
    featured: true,
  },
  {
    id: "jumah",
    name: "Saud Al Jumah",
    nameAr: "سعود آل جمعة",
    country: "Saudi Arabia",
    countryAr: "السعودية",
    city: "Riyadh",
    cityAr: "الرياض",
    bio: "Saudi qari and imam of Masjid Uthman Al-Rashid in Riyadh, beloved for moving taraweeh recitations. A complete structured mushaf of his is not yet published — his profile shows only verified recordings, and never another reciter's voice.",
    bioAr: "قارئ سعودي وإمام جامع عثمان الرشيد بالرياض، محبوب بصوته الخاشع في التراويح. لم يُنشر له مصحف كامل منظم بعد — يعرض ملفه التلاوات الموثقة فقط.",
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
   Partial mushafs declare `available` (surah ids) or `files`.
   ============================================================ */

export function audioUrlFor(reciter, surahId) {
  if (!reciter || !reciter.source) return null;
  if (surahId < 1 || surahId > 114) return null;
  const src = reciter.source;
  if (src.available && !src.available.includes(surahId)) return null;
  if (src.files) {
    const fname = src.files[surahId];
    if (!fname) return null;
    return src.base + encodeURIComponent(fname);
  }
  const n = src.zeroPad
    ? String(surahId).padStart(src.zeroPad, "0")
    : String(surahId);
  return src.base + n + ".mp3";
}

/** Number of surahs with audio for a reciter. */
export function availableSurahCount(reciter) {
  if (!reciter || !reciter.source) return 0;
  if (reciter.source.files) return Object.keys(reciter.source.files).length;
  if (reciter.source.available) return reciter.source.available.length;
  return 114;
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
    lang: "en",
  },
  lastPlayed: null,   // { reciterId, surahId, position, updatedAt }
  recent: [],          // [{ reciterId, surahId, at }]
  recentReciters: [],  // [reciterId]
};
