/* ============================================================
   SAKINA — UI layer (screens · components · player chrome)
   ============================================================ */

import {
  RECITERS, getReciter, getSurah, getSurahs,
  buildTrack, queueForReciter, validateTrack,
  Store, APP_NAME,
} from "./data.js";
import { AudioEngine, verseTimings } from "./audio.js";
import { AmbientEngine, AMBIENT_SOUNDS } from "./ambience.js";

/* ============================ helpers ============================ */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function fmtTime(s) {
  if (!isFinite(s) || s < 0) return "0:00";
  s = Math.round(s);
  const m = Math.floor(s / 60), r = s % 60;
  if (m >= 60) { const h = Math.floor(m / 60); return `${h}:${String(m % 60).padStart(2, "0")}:${String(r).padStart(2, "0")}`; }
  return `${m}:${String(r).padStart(2, "0")}`;
}

function timeAgo(ts) {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const ICON_PATHS = {
  home: '<path d="M3 10.6 12 3l9 7.6"/><path d="M5.5 9.5V21h4.8v-5.6h3.4V21h4.8V9.5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20.5 20.5-4.2-4.2"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M2.8 20c.7-3.2 3.1-5 6.2-5s5.5 1.8 6.2 5"/><circle cx="17" cy="9" r="2.6"/><path d="M16 15.2c2.6.2 4.4 1.6 5 4.3"/>',
  library: '<rect x="3.5" y="4.5" width="3.6" height="15" rx="1.2"/><rect x="9.2" y="2.8" width="3.6" height="16.7" rx="1.2"/><path d="M15.8 5.2 21 4"/><circle cx="17.6" cy="16.2" r="2.6"/><path d="M20.2 13.6V6.2"/>',
  heart: '<path d="M12 20.4S3.5 15.4 3.5 9.6A4.6 4.6 0 0 1 12 7.3a4.6 4.6 0 0 1 8.5 2.3c0 5.8-8.5 10.8-8.5 10.8Z"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.4 5.4l1.8 1.8M16.8 16.8l1.8 1.8M18.6 5.4l-1.8 1.8M7.2 16.8l-1.8 1.8"/>',
  play: '<path d="M7.5 5.2v13.6L19 12 7.5 5.2Z"/>',
  pause: '<rect x="6.5" y="5" width="3.6" height="14" rx="1.2"/><rect x="13.9" y="5" width="3.6" height="14" rx="1.2"/>',
  prev: '<path d="M19 5.4v13.2L9.6 12 19 5.4Z"/><path d="M5.5 5v14"/>',
  next: '<path d="M5 5.4v13.2L14.4 12 5 5.4Z"/><path d="M18.5 5v14"/>',
  shuffle: '<path d="M2.5 6.5h3.6c3 0 4.2 5.5 6.6 11 .8 1.9 1.9 2.5 3.4 2.5h4.9"/><path d="M17.8 4.7 21.5 8l-3.7 3.3"/><path d="M2.5 17.5h3.6c1.7 0 2.8-.9 3.7-2.6"/><path d="M17.8 15.3 21.5 18l-3.7 3.3"/>',
  repeat: '<path d="m17 2.8 3.4 3.4L17 9.6"/><path d="M3.8 9.5V7.9A2.9 2.9 0 0 1 6.7 5h13.7"/><path d="m7 21.2-3.4-3.4L7 14.4"/><path d="M20.2 14.5v1.6a2.9 2.9 0 0 1-2.9 2.9H3.6"/>',
  repeat1: '<path d="m17 2.8 3.4 3.4L17 9.6"/><path d="M3.8 9.5V7.9A2.9 2.9 0 0 1 6.7 5h13.7"/><path d="m7 21.2-3.4-3.4L7 14.4"/><path d="M20.2 14.5v1.6a2.9 2.9 0 0 1-2.9 2.9H3.6"/><path d="M12.3 16.4v-4.7l-1.6.9"/>',
  more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
  download: '<path d="M12 3.5V15m0 0 4.2-4.2M12 15l-4.2-4.2"/><path d="M4 17.5v1.8A1.7 1.7 0 0 0 5.7 21h12.6a1.7 1.7 0 0 0 1.7-1.7v-1.8"/>',
  queue: '<rect x="3.5" y="4.5" width="4" height="15" rx="1.2"/><rect x="9.6" y="4.5" width="4" height="15" rx="1.2"/><path d="M16.2 17.6 20.5 5.6 21 18.2"/>',
  speed: '<path d="M12 13.5 15.5 9"/><path d="M4.5 17.5A9 9 0 1 1 19.5 17.5"/><path d="M5.8 17.5h12.4"/>',
  moon: '<path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z"/>',
  moonoff: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17"/>',
  volume: '<path d="M4 9.5v5h3.4L12 18.6V5.4L7.4 9.5H4Z"/><path d="M15.5 9a4.4 4.4 0 0 1 0 6"/><path d="M17.8 6.8a7.6 7.6 0 0 1 0 10.4"/>',
  volumex: '<path d="M4 9.5v5h3.4L12 18.6V5.4L7.4 9.5H4Z"/><path d="m15.5 9.5 5 5m0-5-5 5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m4.5 12.5 5 5L19.5 7"/>',
  chevronRight: '<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>',
  chevronDown: '<path d="m5.5 9.5 6.5 6.5 6.5-6.5"/>',
  arrowLeft: '<path d="M19 12H5m0 0 6-6m-6 6 6 6"/>',
  book: '<path d="M2.5 4.5h5.4a4.4 4.4 0 0 1 4.1 3v12a3.2 3.2 0 0 0-3.2-3H2.5v-12Z"/><path d="M21.5 4.5h-5.4a4.4 4.4 0 0 0-4.1 3v12a3.2 3.2 0 0 1 3.2-3h6.3v-12Z"/>',
  flame: '<path d="M12 21.5c4 0 6.5-2.4 6.5-6 0-3.2-2.3-5.3-3.8-7.3-.6-.8-1.2-1.4-1.4-2.2-.7 2.1-2.6 3.2-3.7 4.7-.8 1.1-1.6 2.4-1.6 3.9 0-1.4-.7-2.3-1.1-3.1-.9 1.6-2.9 3-2.9 5.4 0 3.6 2.5 5.6 8 5.6Z"/>',
  droplet: '<path d="M12 3.5s6 6.4 6 10.6a6 6 0 0 1-12 0C6 9.9 12 3.5 12 3.5Z"/>',
  tree: '<path d="M12 21v-4.5"/><path d="M12 16.5 8.5 12h2.2L7.5 7.8h2.6L7 3.5h10l-3.1 4.3h2.6L13.3 12h2.2l-3.5 4.5Z"/>',
  wind: '<path d="M3 8.2h9.2a2.6 2.6 0 1 0-2.4-3.5"/><path d="M3 12.4h14.6a2.7 2.7 0 1 1-2.4 4"/><path d="M3 16.6h6.4"/>',
  waves: '<path d="M2.5 8.5c2 1.8 4 1.8 6 0s4-1.8 6 0 4 1.8 6 0"/><path d="M2.5 14c2 1.8 4 1.8 6 0s4-1.8 6 0 4 1.8 6 0"/>',
  cloudRain: '<path d="M7 17.5a4.5 4.5 0 1 1 .8-8.9A5.5 5.5 0 0 1 18.6 10 3.8 3.8 0 0 1 17.5 17.5H7Z"/><path d="M8.5 18.5v2.6M12 18.5v2.6M15.5 18.5v2.6"/>',
  cloudLightning: '<path d="M8 17.5a4.5 4.5 0 1 1 .8-8.9A5.5 5.5 0 0 1 19.6 10 3.8 3.8 0 0 1 18.5 17.5H8Z"/><path d="m12.6 13.8-2.4 4.4h2.7l-1.5 3.8 4.4-5.5h-2.6l1.6-3.2Z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  trash: '<path d="M4.5 6.5h15M9.5 6V4.5A1.5 1.5 0 0 1 11 3h2a1.5 1.5 0 0 1 1.5 1.5V6"/><path d="M6.5 6.5 7.4 20a1.6 1.6 0 0 0 1.6 1.5h6a1.6 1.6 0 0 0 1.6-1.5l.9-13.5"/><path d="M10 10.5v6.5M14 10.5v6.5"/>',
  share: '<circle cx="18" cy="5.5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="18.5" r="2.6"/><path d="m8.4 10.7 7.2-3.9M8.4 13.3l7.2 3.9"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5"/><circle cx="12" cy="8" r=".4"/>',
  music: '<circle cx="6.5" cy="18.5" r="2.6"/><path d="M9 18.5V5.5l9-1.8v12.3"/><circle cx="15.5" cy="16" r="2.6"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="m4.5 17 4.6-4.6 3.4 3.2 3-2.8 4.5 4.2"/>',
  user: '<circle cx="12" cy="8.5" r="3.6"/><path d="M4.5 20.5c.8-4 3.6-6.2 7.5-6.2s6.7 2.2 7.5 6.2"/>',
  spinner: '<path d="M12 3a9 9 0 1 0 9 9"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  radio: '<circle cx="12" cy="12" r="2.2"/><circle cx="12" cy="12" r="7"/>',
  external: '<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M19 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 4 18.5v-12A1.5 1.5 0 0 1 5.5 5H10"/>',
};

export function icon(name, size = 20, cls = "") {
  const p = ICON_PATHS[name] || ICON_PATHS.info;
  return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ============================ app state ============================ */

export const App = {
  engine: null,
  ambient: null,
  quranAr: null,
  quranEn: null,
  route: { name: "home", params: {} },
  timingsCache: new Map(),
  activeVerse: 0,
  readingSurahId: null,
  defaultReciterId: () => {
    const lp = Store.get("lastPlayed", null);
    if (lp && getReciter(lp.reciterId)) return lp.reciterId;
    const rr = Store.get("recentReciters", []);
    if (rr.length && getReciter(rr[0])) return rr[0];
    return "alafasy";
  },
};

export function settings() {
  return { ...Store.get("settings", {}), ...{ speed: App.engine?.state.speed ?? 1 } };
}

/* ============================ core components ============================ */

export function avatarImg(reciter, size, cls = "") {
  const r = getReciter(reciter && reciter.reciterId ? reciter.reciterId : reciter);
  const s = r || reciter;
  const photo = s?.photo;
  const name = s?.name || "";
  const initials = s?.nameAr ? [...s.nameAr.replace(/^(ال|آل|أل)/, "")][0] : (name[0] || "?");
  if (photo) {
    return `<div class="avatar ${cls}" style="width:${size}px;height:${size}px">
      <img src="${photo}" alt="${esc(name)}" loading="lazy" onerror="this.parentNode.classList.add('avatar-fallback');this.remove()"/>
      <span class="avatar-fb">${esc(initials)}</span>
    </div>`;
  }
  return `<div class="avatar avatar-placeholder ${cls}" style="width:${size}px;height:${size}px"><span>${esc(initials)}</span></div>`;
}

export function playPill(label, cls = "", iconName = "play", extra = "") {
  return `<button class="pill ${cls}" ${extra}>${icon(iconName, 18)}<span>${label}</span></button>`;
}

function progressHTML() {
  const st = App.engine.state;
  const pct = st.duration ? Math.min(100, (st.position / st.duration) * 100) : 0;
  return `
    <div class="progress-block">
      <input type="range" class="slider slider-progress" min="0" max="${st.duration || 0}" value="${st.position}" step="0.1" data-act="seek" style="--fill:${pct}%" aria-label="Seek"/>
      <div class="progress-times"><span>${fmtTime(st.position)}</span><span>${fmtTime(st.duration)}</span></div>
    </div>`;
}

/* ============================ router ============================ */

function parseHash() {
  const h = location.hash.replace(/^#\/?/, "");
  const [path, qs] = h.split("?");
  const parts = path.split("/").filter(Boolean);
  const params = {};
  if (qs) qs.split("&").forEach((kv) => { const [k, v] = kv.split("="); if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || ""); });
  return { name: parts[0] || "home", id: parts[1], params };
}

export function navigate(path) {
  if (location.hash === "#/" + path) { render(); return; }
  location.hash = "#/" + path;
}

export function render() {
  App.route = parseHash();
  const r = App.route;
  const view = $("#view");
  if (!view) return;
  view.classList.remove("page-enter");
  void view.offsetWidth;
  view.classList.add("page-enter");

  let html = "";
  switch (r.name) {
    case "home": html = screenHome(); break;
    case "reciters": html = screenReciters(); break;
    case "reciter": html = screenReciter(r.id); break;
    case "read": html = screenRead(r.id, r.params); break;
    case "search": html = screenSearch(); break;
    case "playlists": html = screenPlaylists(); break;
    case "playlist": html = screenPlaylistDetail(r.id); break;
    case "favorites": html = screenFavorites(); break;
    case "settings": html = screenSettings(); break;
    default: html = screenHome();
  }
  view.innerHTML = html;
  view.classList.add("page-enter");
  updateNav();
  afterRender(r);
}

function afterRender(r) {
  if (r.name === "reciter") bindReciter(r.id);
  if (r.name === "read") bindRead(r.id, r.params);
  if (r.name === "search") bindSearch();
  if (r.name === "playlists") bindPlaylists();
  if (r.name === "playlist") bindPlaylistDetail(r.id);
  if (r.name === "favorites") bindFavorites();
  if (r.name === "settings") bindSettings();
  window.scrollTo({ top: 0 });
}

/* ============================ navigation chrome ============================ */

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: "home" },
  { id: "search", label: "Search", icon: "search" },
  { id: "reciters", label: "Reciters", icon: "users" },
  { id: "playlists", label: "Playlists", icon: "library" },
  { id: "favorites", label: "Favorites", icon: "heart" },
  { id: "settings", label: "Settings", icon: "gear" },
];

export function renderChrome() {
  const side = $("#sidebar");
  side.innerHTML = `
    <div class="brand">
      <div class="brand-mark">${icon("music", 18)}</div>
      <div class="brand-name">${APP_NAME}</div>
    </div>
    <nav class="side-nav">${NAV_ITEMS.map((n) => `
      <button class="nav-item" data-act="nav" data-nav="${n.id}">${icon(n.icon, 19)}<span>${n.label}</span></button>`).join("")}
    </nav>
    <div class="side-foot">
      <div class="side-card">
        <div class="side-card-title">Listen mindfully</div>
        <div class="side-card-sub">Quran audio with ambient sound</div>
        <div class="side-card-ver">v1.4 · ${RECITERS.length} reciters</div>
      </div>
    </div>`;

  const bottom = $("#mobilenav");
  bottom.innerHTML = NAV_ITEMS.map((n) => `
    <button class="mnav-item" data-act="nav" data-nav="${n.id}" aria-label="${n.label}">${icon(n.icon, 21)}<span>${n.label}</span></button>`).join("");

  renderMiniPlayer();
}

function updateNav() {
  const name = App.route.name;
  const active = NAV_ITEMS.find((n) => n.id === name);
  $$(".nav-item").forEach((el) => el.classList.toggle("active", el.dataset.nav === (active ? active.id : "")));
  $$(".mnav-item").forEach((el) => el.classList.toggle("active", el.dataset.nav === (active ? active.id : "")));
}

/* ============================ mini player ============================ */

function miniPlayerHTML() {
  const st = App.engine.state;
  const t = st.track;
  const reciter = t ? getReciter(t.reciterId) : null;
  const pct = st.duration ? (st.position / st.duration) * 100 : 0;
  const repeatIcon = st.repeat === "one" ? "repeat1" : "repeat";
  const sleepChip = App.engine.sleep
    ? `<span class="mini-sleep">${icon("moon", 12)}${sleepLabel()}</span>` : "";
  return `
    <div class="mini-player ${t ? "mini-visible" : ""}" data-act="expand-player" role="button" tabindex="0" aria-label="Open player">
      <div class="mini-progress" style="width:${t ? pct : 0}%"></div>
      <div class="mini-art">${t ? avatarImg(reciter, 44) : `<div class="avatar avatar-placeholder" style="width:44px;height:44px"><span>${icon("music", 18)}</span></div>`}</div>
      <div class="mini-meta">
        <div class="mini-title">${t ? esc(t.surahName) : "Nothing playing"}</div>
        <div class="mini-sub">${t ? esc(t.reciterName) : "Choose a surah to begin"}</div>
        ${sleepChip}
      </div>
      <div class="mini-controls" >
        <button class="icon-btn ${st.shuffle ? "on" : ""}" data-act="shuffle" title="Shuffle">${icon("shuffle", 18)}</button>
        <button class="icon-btn" data-act="prev" title="Previous">${icon("prev", 20)}</button>
        <button class="icon-btn play" data-act="toggle" title="Play / Pause">${st.playing ? icon("pause", 20) : icon("play", 20)}</button>
        <button class="icon-btn" data-act="next" title="Next">${icon("next", 20)}</button>
        <button class="icon-btn ${st.repeat !== "off" ? "on" : ""}" data-act="repeat" title="Repeat">${icon(repeatIcon, 18)}</button>
        <button class="icon-btn" data-act="queue-sheet" title="Queue">${icon("queue", 18)}</button>
        <button class="icon-btn" data-act="mini-more" title="More">${icon("more", 18)}</button>
      </div>
    </div>`;
}

function sleepLabel() {
  const s = App.engine.sleep;
  if (!s) return "";
  if (s.mode === "time") {
    const left = Math.max(0, Math.round((s.endsAt - Date.now()) / 60000));
    return `${left}m`;
  }
  return s.mode === "end-surah" ? "end of surah" : "end of queue";
}

export function renderMiniPlayer() {
  const host = $("#miniplayer");
  if (!host) return;
  host.innerHTML = miniPlayerHTML();
}

/* ============================ expanded player ============================ */

export function renderExpandedPlayer() {
  const st = App.engine.state;
  const t = st.track;
  const reciter = t ? getReciter(t.reciterId) : null;
  const set = settings();
  const pct = st.duration ? (st.position / st.duration) * 100 : 0;
  const ambient = App.ambient;
  const bgName = AMBIENT_SOUNDS.find((s) => s.id === ambient.current)?.name || "None";

  const sleepBtn = App.engine.sleep
    ? `<span class="sleep-dot"></span>` : "";

  const body = `
    <div class="player-backdrop" data-act="close-expanded"></div>
    <div class="player-card glass-strong" role="dialog" aria-label="Player">
      <div class="player-glow"></div>
      <div class="player-head">
        ${t ? avatarImg(reciter, 116, "player-art") : `<div class="avatar avatar-placeholder player-art" style="width:116px;height:116px"><span>${icon("music", 34)}</span></div>`}
        <div class="player-head-meta">
          <div class="player-title">${t ? esc(t.surahName) : "Nothing playing"}</div>
          ${t && t.surahNameAr ? `<div class="player-title-ar" dir="rtl">${esc(t.surahNameAr)}</div>` : ""}
          <div class="player-sub">${t ? esc(t.reciterName) : "Choose a surah to begin"}</div>
          <button class="icon-btn heart ${isFavSurah(t?.surahId) ? "on" : ""}" data-act="fav-track" title="Favorite">${icon("heart", 20)}</button>
        </div>
      </div>

      <div class="player-controls">
        <button class="ctl-pill" data-act="speed-cycle">${icon("speed", 16)}<span id="speedLabel">${st.speed}x</span></button>
        <button class="ctl-btn" data-act="prev" title="Previous">${icon("prev", 26)}</button>
        <button class="ctl-btn ctl-play ${st.buffering ? "buffering" : ""}" data-act="toggle" title="Play / Pause">
          ${st.buffering ? icon("spinner", 26) : st.playing ? icon("pause", 26) : icon("play", 26)}
        </button>
        <button class="ctl-btn" data-act="next" title="Next">${icon("next", 26)}</button>
        <button class="ctl-pill ${App.engine.sleep ? "active" : ""}" data-act="sleep-sheet">${icon("moon", 16)}<span>Sleep</span>${sleepBtn}</button>
      </div>

      <div class="player-progress">${progressHTML()}</div>

      <div class="volume-block">
        <div class="volume-row">
          <div class="volume-label">${icon("volume", 16)}<span>Quran</span></div>
          <input type="range" class="slider" min="0" max="1" step="0.01" value="${App.engine.audio.volume}" data-act="qvol" style="--fill:${App.engine.audio.volume * 100}%" aria-label="Quran volume"/>
        </div>
        <div class="volume-row">
          <div class="volume-label">${icon(ambient.current === "off" ? "moonoff" : "droplet", 16)}<span>Background sound</span></div>
          <input type="range" class="slider" min="0" max="1" step="0.01" value="${ambient.volume}" data-act="bvol" style="--fill:${ambient.volume * 100}%" aria-label="Background volume"/>
        </div>
      </div>

      <div class="player-foot">
        <button class="icon-btn ${st.shuffle ? "on" : ""}" data-act="shuffle" title="Shuffle">${icon("shuffle", 18)}</button>
        <button class="pill pill-ambient" data-act="ambient-sheet">${icon("waves", 16)}<span>Background sound · ${esc(bgName)}</span>${icon("chevronDown", 14)}</button>
        <button class="icon-btn ${st.repeat !== "off" ? "on" : ""}" data-act="repeat" title="Repeat">${icon(st.repeat === "one" ? "repeat1" : "repeat", 18)}</button>
      </div>
    </div>`;

  const overlay = $("#expanded");
  overlay.innerHTML = body;
  overlay.classList.add("show");
  document.body.classList.add("no-scroll");
}

export function closeExpanded() {
  const overlay = $("#expanded");
  overlay.classList.remove("show");
  overlay.innerHTML = "";
  document.body.classList.remove("no-scroll");
}

/* ============================ sheets ============================ */

export function openSheet({ title, body, onMount, className = "" }) {
  const host = $("#sheets");
  const el = document.createElement("div");
  el.className = "sheet-wrap " + className;
  el.innerHTML = `
    <div class="sheet-backdrop" data-act="close-sheet"></div>
    <div class="sheet glass-strong">
      <div class="sheet-handle"></div>
      <div class="sheet-title">${title}</div>
      <div class="sheet-body">${body}</div>
    </div>`;
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add("open"));
  if (onMount) onMount(el);
  return el;
}

export function closeSheets() {
  $$(".sheet-wrap").forEach((el) => {
    el.classList.remove("open");
    setTimeout(() => el.remove(), 260);
  });
}

function queueSheet() {
  const q = App.engine.state.queue;
  const cur = App.engine.state.track;
  const rows = q.length
    ? q.map((t, i) => `
      <button class="queue-row ${cur && t.surahId === cur.surahId && t.reciterId === cur.reciterId ? "active" : ""}" data-act="queue-jump" data-i="${i}">
        <span class="queue-idx">${i + 1}</span>
        <span class="queue-name">${esc(t.surahName)}</span>
        <span class="queue-rec">${esc(t.reciterName)}</span>
        ${cur && t.surahId === cur.surahId && t.reciterId === cur.reciterId ? icon("volume", 15) : icon("play", 15)}
      </button>`).join("")
    : `<div class="empty-inline">The queue is empty — play a surah to begin.</div>`;
  openSheet({ title: "Up next", body: `<div class="queue-list">${rows}</div>` });
}

function sleepSheet() {
  const opts = [
    { mode: "time", minutes: 10, label: "10 minutes" },
    { mode: "time", minutes: 20, label: "20 minutes" },
    { mode: "time", minutes: 30, label: "30 minutes" },
    { mode: "time", minutes: 45, label: "45 minutes" },
    { mode: "time", minutes: 60, label: "1 hour" },
    { mode: "end-surah", label: "End of surah" },
    { mode: "end-queue", label: "End of queue" },
    { mode: "off", label: "Turn off" },
  ];
  const active = App.engine.sleep;
  const rows = opts.map((o) => `
    <button class="sheet-row ${active && active.mode === o.mode && (o.minutes === undefined || active.minutes === o.minutes) ? "active" : ""}" data-act="sleep-set" data-mode="${o.mode}" data-min="${o.minutes || 0}">
      <span>${o.label}</span>${icon("check", 16)}
    </button>`).join("");
  openSheet({ title: "Sleep timer", body: `<div class="sheet-list">${rows}</div>` });
}

function ambientSheet() {
  const rows = AMBIENT_SOUNDS.map((s) => {
    const on = App.ambient.current === s.id;
    return `<button class="ambient-tile ${on ? "active" : ""}" data-act="ambient-set" data-id="${s.id}">
      <span class="ambient-icon">${icon(s.icon, 22)}</span>
      <span class="ambient-name">${s.name}</span>
      <span class="ambient-name-ar" dir="rtl">${s.nameAr}</span>
    </button>`;
  }).join("");
  openSheet({
    title: "Background sound",
    body: `<p class="sheet-hint">Combine recitation with a calm ambient atmosphere. The two volumes are independent.</p><div class="ambient-grid">${rows}</div>`,
  });
}

function playlistPickerSheet(track, menuEl) {
  const playlists = Store.get("playlists", []);
  const rows = playlists.length
    ? playlists.map((p, i) => `
      <button class="sheet-row" data-act="add-to-playlist" data-pl="${i}" data-rid="${track.reciterId}" data-sid="${track.surahId}">
        <span>${esc(p.name)}</span>${icon("plus", 16)}
      </button>`).join("")
    : `<div class="empty-inline">No playlists yet. Create one from the Playlists tab.</div>`;
  openSheet({ title: `Add to playlist · ${esc(track.surahName)}`, body: `<div class="sheet-list">${rows}</div>` });
}

function addToPlaylist(plIndex, reciterId, surahId) {
  const playlists = Store.get("playlists", []);
  const pl = playlists[plIndex];
  if (!pl) return;
  const t = buildTrack(reciterId, surahId);
  if (!t) return toast("This surah is not available yet", "info");
  const dup = pl.tracks.some((x) => x.reciterId === reciterId && x.surahId === surahId);
  if (dup) return toast("Already in playlist", "info");
  pl.tracks.push({ reciterId, surahId });
  Store.set("playlists", playlists);
  toast(`Added to “${pl.name}”`);
  render();
}

/* ============================ toasts & dropdown ============================ */

export function toast(msg, kind = "ok") {
  const host = $("#toasts");
  const el = document.createElement("div");
  el.className = `toast toast-${kind}`;
  el.innerHTML = `<span>${kind === "ok" ? icon("check", 14) : kind === "err" ? icon("x", 14) : icon("info", 14)}</span><div>${esc(msg)}</div>`;
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 300);
  }, 3400);
}

export function openDropdown(items, x, y) {
  closeDropdown();
  const host = $("#dropdowns");
  const el = document.createElement("div");
  el.className = "dropdown glass-strong";
  el.style.left = Math.min(x, window.innerWidth - 220) + "px";
  el.style.top = Math.min(y, window.innerHeight - items.length * 46 - 24) + "px";
  el.innerHTML = items.map((it) => `
    <button class="dropdown-item ${it.danger ? "danger" : ""}" data-act="${it.act}" ${it.data ? it.data : ""}>
      ${icon(it.icon, 17)}<span>${it.label}</span>
    </button>`).join("");
  host.appendChild(el);
  setTimeout(() => el.classList.add("open"), 10);
  el._close = () => el.remove();
}

export function closeDropdown() {
  const host = $("#dropdowns");
  host.innerHTML = "";
}

function surahMenu(reciterId, surahId, x, y) {
  const t = buildTrack(reciterId, surahId);
  const surah = getSurah(surahId);
  const items = [
    { act: "menu-read", icon: "book", label: "Read surah", data: `data-sid="${surahId}" data-rid="${reciterId}"` },
    { act: "menu-fav", icon: "heart", label: isFavSurah(surahId) ? "Remove from favorites" : "Add to favorites", data: `data-sid="${surahId}"` },
    { act: "menu-playlist", icon: "plus", label: "Add to playlist", data: `data-rid="${reciterId}" data-sid="${surahId}"` },
    { act: "menu-download", icon: "download", label: "Download", data: `data-rid="${reciterId}" data-sid="${surahId}"` },
    { act: "menu-share", icon: "share", label: "Share", data: `data-sid="${surahId}"` },
  ];
  openDropdown(items, x, y);
}

/* ============================ actions (delegated) ============================ */

const Actions = {
  nav(el) { navigate(el.dataset.nav); },
  toggle() { App.engine.toggle(); renderMiniPlayer(); syncExpanded(); },
  prev() { App.engine.prev(); },
  next() { App.engine.next(); },
  shuffle() { App.engine.toggleShuffle(); renderMiniPlayer(); syncExpanded(); },
  repeat() { App.engine.cycleRepeat(); renderMiniPlayer(); syncExpanded(); },
  "queue-sheet"() { queueSheet(); },
  "mini-more"(el) {
    const t = App.engine.state.track;
    if (!t) return;
    const rect = el.getBoundingClientRect();
    surahMenu(t.reciterId, t.surahId, rect.right - 200, rect.bottom + 6);
  },
  "expand-player"() { if (App.engine.state.track) renderExpandedPlayer(); },
  "close-expanded"() { closeExpanded(); },
  "close-sheet"() { closeSheets(); },
  "speed-cycle"() {
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const cur = App.engine.state.speed;
    const next = speeds[(speeds.indexOf(cur) + 1) % speeds.length] || 1;
    App.engine.setSpeed(next);
    const lbl = $("#speedLabel");
    if (lbl) lbl.textContent = next + "x";
  },
  "sleep-sheet"() { sleepSheet(); },
  "sleep-set"(el) {
    const m = el.dataset.mode;
    const min = Number(el.dataset.min || 0);
    if (m === "off") App.engine.stopSleep();
    else App.engine.startSleep({ mode: m, minutes: min });
    closeSheets();
    renderMiniPlayer();
    syncExpanded();
    toast(m === "off" ? "Sleep timer off" : "Sleep timer set");
  },
  "ambient-sheet"() { ambientSheet(); },
  "ambient-set"(el) {
    const id = el.dataset.id;
    App.ambient.start(id);
    $$(".ambient-tile").forEach((t) => t.classList.toggle("active", t.dataset.id === id));
    updateAmbientVisuals(id);
    syncExpanded();
  },
  "fav-track"() {
    const t = App.engine.state.track;
    if (!t) return;
    toggleFavSurah(t.surahId);
    syncExpanded();
    toast(isFavSurah(t.surahId) ? "Added to favorites" : "Removed from favorites");
  },
  "queue-jump"(el) { App.engine.jumpTo(Number(el.dataset.i)); closeSheets(); },
  "menu-read"(el) {
    const d = el.dataset;
    closeDropdown();
    navigate(`read/${d.sid}?rec=${d.rid}`);
  },
  "menu-fav"(el) {
    const d = el.dataset;
    toggleFavSurah(Number(d.sid));
    closeDropdown();
    toast(isFavSurah(Number(d.sid)) ? "Added to favorites" : "Removed from favorites");
    render();
  },
  "menu-playlist"(el) {
    const d = el.dataset;
    closeDropdown();
    playlistPickerSheet(buildTrack(d.rid, Number(d.sid)));
  },
  "menu-download"(el) { downloadTrack(el.dataset); },
  "menu-share"(el) {
    const d = el.dataset;
    const s = getSurah(Number(d.sid));
    closeDropdown();
    if (navigator.share) navigator.share({ title: s.name, text: `${s.name} — ${s.nameAr}` }).catch(() => {});
    else navigator.clipboard?.writeText(`Sakina — ${s.name} (${s.nameAr})`).then(() => toast("Copied to clipboard")).catch(() => {});
  },
  "add-to-playlist"(el) {
    const d = el.dataset;
    addToPlaylist(Number(d.pl), d.rid, Number(d.sid));
    closeSheets();
  },
  "play-surah"(el) {
    const d = el.dataset;
    playSurah(d.rid, Number(d.sid));
  },
  "play-reciter"(el) {
    playReciter(el.dataset.rid);
  },
  "fav-reciter"(el) {
    const d = el.dataset;
    toggleFavReciter(d.rid);
    render();
    toast(isFavReciter(d.rid) ? "Reciter added to favorites" : "Reciter removed from favorites");
  },
  "download"(el) { downloadTrack(el.dataset); },
  "read-surah"(el) {
    const d = el.dataset;
    navigate(`read/${d.sid}?rec=${d.rid}`);
  },
  "resume"() {
    const lp = Store.get("lastPlayed", null);
    if (!lp) return;
    const t = buildTrack(lp.reciterId, lp.surahId);
    if (!t) return toast("Recording unavailable", "err");
    App.engine.loadTrack(t, { autoplay: true, position: lp.position > 3 && lp.position < 0.99 * (App.engine.state.duration || 1e9) ? lp.position : 0, queue: queueForReciter(lp.reciterId) });
    renderMiniPlayer();
    toast("Resumed · " + t.surahName);
  },
  "verse-tap"(el) {
    const d = el.dataset;
    seekToVerse(Number(d.ay));
  },
  "playlist-play"(el) {
    const idx = Number(el.dataset.idx);
    const playlists = Store.get("playlists", []);
    const pl = playlists[idx];
    if (!pl || !pl.tracks.length) return toast("Playlist is empty", "info");
    const q = pl.tracks.map((t) => buildTrack(t.reciterId, t.surahId)).filter(Boolean);
    if (!q.length) return toast("No available recordings", "err");
    App.engine.loadTrack(q[0], { autoplay: true, queue: q });
    renderMiniPlayer();
  },
  "playlist-play-shuffle"(el) {
    const idx = Number(el.dataset.idx);
    const playlists = Store.get("playlists", []);
    const pl = playlists[idx];
    if (!pl || !pl.tracks.length) return toast("Playlist is empty", "info");
    const q = pl.tracks.map((t) => buildTrack(t.reciterId, t.surahId)).filter(Boolean);
    if (!q.length) return toast("No available recordings", "err");
    App.engine.setShuffle(true);
    App.engine.loadTrack(q[Math.floor(Math.random() * q.length)], { autoplay: true, queue: q });
    renderMiniPlayer();
  },
  "playlist-remove"(el) {
    const d = el.dataset;
    const playlists = Store.get("playlists", []);
    const pl = playlists[Number(d.pl)];
    if (!pl) return;
    pl.tracks.splice(Number(d.ti), 1);
    Store.set("playlists", playlists);
    render();
  },
  "playlist-delete"(el) {
    const d = el.dataset;
    const playlists = Store.get("playlists", []);
    playlists.splice(Number(d.idx), 1);
    Store.set("playlists", playlists);
    toast("Playlist deleted");
    navigate("playlists");
  },
  "new-playlist"() { newPlaylistSheet(); },
  "create-playlist"() {
    const input = $("#newpl-name");
    const name = (input?.value || "").trim();
    if (!name) return toast("Give the playlist a name", "err");
    const playlists = Store.get("playlists", []);
    playlists.unshift({ id: "pl" + Date.now(), name, createdAt: Date.now(), tracks: [] });
    Store.set("playlists", playlists);
    closeSheets();
    render();
    toast("Playlist created");
  },
  "toggle-setting"(el) {
    const d = el.dataset;
    const s = Store.get("settings", {});
    s[d.key] = el.checked;
    Store.set("settings", s);
    if (d.key === "showTranslation" || d.key === "showVerseNumbers") {
      const r = App.route;
      if (r.name === "read") render();
    }
  },
  "accent-set"(el) {
    const s = Store.get("settings", {});
    s.accent = el.dataset.accent;
    Store.set("settings", s);
    document.documentElement.dataset.accent = s.accent;
    render();
  },
  "clear-data"() {
    if (confirm("Clear all local data (favorites, playlists, settings)?")) {
      ["sakina.v1.favorites", "sakina.v1.playlists", "sakina.v1.settings", "sakina.v1.lastPlayed", "sakina.v1.recent", "sakina.v1.recentReciters", "sakina.v1.repeat", "sakina.v1.shuffle"].forEach((k) => localStorage.removeItem(k));
      location.reload();
    }
  },
  "ambient-off"() { App.ambient.start("off"); updateAmbientVisuals("off"); syncExpanded(); },
};

/* ---------- live ambient backdrop ---------- */
export function updateAmbientVisuals(id) {
  const layer = document.getElementById("ambient-visuals");
  if (!layer) return;
  layer.dataset.sound = id || "off";
}


export function playSurah(reciterId, surahId, { autoplay = true } = {}) {
  const t = buildTrack(reciterId, surahId);
  if (!t) {
    const r = getReciter(reciterId);
    toast(r?.unavailable ? `Full-surah recordings by ${r.name} are not published yet — no audio was faked.` : "Recording unavailable", "err");
    return;
  }
  const ok = App.engine.loadTrack(t, { autoplay, queue: queueForReciter(reciterId) });
  if (ok) {
    renderMiniPlayer();
    syncExpanded();
  }
}

export function playReciter(reciterId, startSurahId = 1) {
  playSurah(reciterId, startSurahId);
}

/* ============================ input handling ============================ */

function onInput(e) {
  const el = e.target;
  if (el.tagName !== "INPUT") return;
  const act = el.dataset.act;
  const v = parseFloat(el.value);
  if (act === "seek") {
    App.engine.seek(v);
    const pct = App.engine.state.duration ? (v / App.engine.state.duration) * 100 : 0;
    el.style.setProperty("--fill", pct + "%");
    const times = el.closest(".progress-block")?.querySelectorAll(".progress-times span");
    if (times) { times[0].textContent = fmtTime(v); }
  } else if (act === "qvol") {
    App.engine.setQuranVolume(v);
    el.style.setProperty("--fill", (v * 100) + "%");
  } else if (act === "bvol") {
    App.ambient.volume = v;
    el.style.setProperty("--fill", (v * 100) + "%");
    const s = Store.get("settings", {});
    s.bgVolume = v;
    Store.set("settings", s);
  } else if (act === "fsize") {
    const s = Store.get("settings", {});
    s.arabicFontSize = v;
    Store.set("settings", s);
    el.style.setProperty("--fill", ((v - 22) / (44 - 22)) * 100 + "%");
    const label = $("#fsize-label");
    if (label) label.textContent = v + "px";
    applyVerseFontSize();
  }
}

/* ============================ screens ============================ */

/* ---------- HOME ---------- */
function screenHome() {
  const lp = Store.get("lastPlayed", null);
  const lpTrack = lp && buildTrack(lp.reciterId, lp.surahId);
  const recent = Store.get("recent", []).slice(0, 5).map((r) => ({ track: buildTrack(r.reciterId, r.surahId), at: r.at })).filter((r) => r.track);
  const featured = RECITERS.filter((r) => r.featured);
  const popular = [1, 2, 18, 36, 55, 56, 67, 78, 93, 112].map((id) => getSurah(id)).filter(Boolean);

  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return `
    <div class="screen home">
      <header class="home-head">
        <div>
          <h1 class="page-title">Good ${new Date().getHours() < 12 ? "morning" : "evening"}</h1>
          <p class="page-sub">${dateStr}</p>
        </div>
        <button class="icon-btn" data-act="nav" data-nav="settings" aria-label="Settings">${icon("gear", 20)}</button>
      </header>

      ${lpTrack ? `
      <section class="continue-card glass" data-act="resume" role="button">
        <div class="continue-art">${avatarImg(getReciter(lpTrack.reciterId), 64)}</div>
        <div class="continue-meta">
          <div class="continue-kicker">Continue listening</div>
          <div class="continue-title">${esc(lpTrack.surahName)}</div>
          <div class="continue-sub">${esc(lpTrack.reciterName)} · ${timeAgo(lp.updatedAt)}</div>
        </div>
        <span class="pill pill-primary continue-btn">${icon("play", 16)}<span>Resume</span></span>
      </section>` : ""}

      <section class="home-section">
        <div class="section-head"><h2>Featured reciters</h2><button class="text-btn" data-act="nav" data-nav="reciters">See all</button></div>
        <div class="reciter-scroll">
          ${featured.map((r) => `
            <button class="reciter-card" data-act="nav" data-nav="reciter/${r.id}">
              ${avatarImg(r, 96)}
              <span class="reciter-card-name">${esc(r.name.split(" ").slice(-1)[0] === "Alafasy" ? "Mishary Alafasy" : r.name)}</span>
              <span class="reciter-card-sub">${esc(r.country)}</span>
            </button>`).join("")}
        </div>
      </section>

      <section class="home-section">
        <div class="section-head"><h2>Popular surahs</h2><button class="text-btn" data-act="nav" data-nav="search">Search</button></div>
        <div class="surah-chips">
          ${popular.map((s) => `
            <button class="chip-card" data-act="play-surah" data-rid="${App.defaultReciterId()}" data-sid="${s.id}">
              <span class="chip-num">${s.id}</span>
              <span class="chip-name">${esc(s.name)}</span>
              <span class="chip-ar" dir="rtl">${s.nameAr}</span>
            </button>`).join("")}
        </div>
      </section>

      ${recent.length ? `
      <section class="home-section">
        <div class="section-head"><h2>Recently played</h2></div>
        <div class="recent-list">
          ${recent.map(({ track, at }) => `
            <button class="recent-row" data-act="play-surah" data-rid="${track.reciterId}" data-sid="${track.surahId}">
              ${avatarImg(getReciter(track.reciterId), 44)}
              <span class="recent-meta"><span class="recent-name">${esc(track.surahName)}</span><span class="recent-sub">${esc(track.reciterName)} · ${timeAgo(at)}</span></span>
              ${icon("play", 18)}
            </button>`).join("")}
        </div>
      </section>` : ""}
    </div>`;
}

/* ---------- RECITERS ---------- */
function screenReciters() {
  return `
    <div class="screen">
      <header class="page-head">
        <h1 class="page-title">Reciters</h1>
        <p class="page-sub">Choose the voice that moves you</p>
      </header>
      <div class="reciters-grid">
        ${RECITERS.map((r) => `
          <button class="reciter-tile" data-act="nav" data-nav="reciter/${r.id}">
            ${avatarImg(r, 112)}
            <span class="reciter-tile-name">${esc(r.name)}</span>
            <span class="reciter-tile-sub">${esc(r.country)}${r.years ? " · " + r.years : ""}</span>
            ${r.unavailable ? `<span class="reciter-tile-tag">Selected recordings</span>` : `<span class="reciter-tile-tag">114 surahs</span>`}
          </button>`).join("")}
      </div>
    </div>`;
}

/* ---------- RECITER PROFILE ---------- */
function screenReciter(id) {
  const r = getReciter(id);
  if (!r) return `<div class="screen"><div class="empty">Reciter not found.</div></div>`;
  const fav = isFavReciter(id);
  return `
    <div class="screen">
      <button class="back-btn" data-act="nav" data-nav="reciters">${icon("arrowLeft", 18)}<span>Reciters</span></button>

      <header class="profile-head">
        ${avatarImg(r, 140)}
        <div class="profile-meta">
          <h1 class="profile-name">${esc(r.name)}</h1>
          <div class="profile-loc">${icon("radio", 13)}<span>${esc(r.city)} · ${esc(r.country)}</span></div>
          <div class="profile-status ${r.years ? "muted" : "live"}"><span class="dot"></span>${r.years ? esc(r.years) : "Reciting today"}</div>
          <p class="profile-bio">${esc(r.bio)}</p>
          <div class="profile-actions">
            <button class="pill ${fav ? "on" : ""}" data-act="fav-reciter" data-rid="${r.id}">${icon("heart", 17)}<span>${fav ? "Favorited" : "Favorite"}</span></button>
            <button class="pill" data-act="play-reciter" data-rid="${r.id}">${icon("shuffle", 16)}<span>Shuffle</span></button>
            <button class="pill pill-primary" data-act="play-surah" data-rid="${r.id}" data-sid="1">${icon("play", 16)}<span>${r.unavailable ? "Unavailable" : "Play"}</span></button>
          </div>
        </div>
      </header>

      <div class="profile-count">${r.unavailable ? "Full mushaf recordings are not yet published" : "114 surahs recorded"}</div>

      <div class="search-field">
        ${icon("search", 17)}
        <input id="surah-search" type="text" placeholder="Search surah" autocomplete="off" />
        <button class="search-clear" id="surah-search-clear" hidden>${icon("x", 15)}</button>
      </div>

      <div class="surah-list" id="surah-list">
        ${surahRows(r, "")}
      </div>
    </div>`;
}

function surahRows(reciter, q) {
  const list = getSurahs();
  const needle = q.trim().toLowerCase();
  const rows = list.filter((s) => {
    if (!needle) return true;
    return s.name.toLowerCase().includes(needle) || s.nameAr.includes(q.trim()) || s.transName.toLowerCase().includes(needle);
  });
  if (!rows.length) return `<div class="empty">No surahs match “${esc(q)}”.</div>`;
  return rows.map((s) => `
    <div class="surah-row" data-act="play-surah" data-rid="${reciter.id}" data-sid="${s.id}" role="button" tabindex="0">
      <span class="surah-badge">${s.id}</span>
      <span class="surah-names">
        <span class="surah-en">${esc(s.name)}</span>
        <span class="surah-sub">${s.place === "makkah" ? "Makki" : "Madani"} · ${s.ayahs} verses</span>
      </span>
      <span class="surah-ar" dir="rtl">${s.nameAr}</span>
      <span class="surah-actions" >
        <button class="icon-btn" data-act="read-surah" data-rid="${reciter.id}" data-sid="${s.id}" title="Read">${icon("book", 18)}</button>
        <button class="icon-btn" data-act="download" data-rid="${reciter.id}" data-sid="${s.id}" title="Download">${icon("download", 18)}</button>
        <button class="icon-btn" data-act="row-menu" data-rid="${reciter.id}" data-sid="${s.id}" title="More">${icon("more", 18)}</button>
      </span>
    </div>`).join("");
}

function bindReciter(id) {
  const input = $("#surah-search");
  const list = $("#surah-list");
  const reciter = getReciter(id);
  if (!input || !list || !reciter) return;
  const apply = () => { list.innerHTML = surahRows(reciter, input.value); };
  input.addEventListener("input", apply);
  $("#surah-search-clear")?.addEventListener("click", () => { input.value = ""; $("#surah-search-clear").hidden = true; apply(); });
  input.addEventListener("keyup", () => { $("#surah-search-clear").hidden = !input.value; });
}

/* ---------- READING MODE ---------- */
function screenRead(surahId, params) {
  const s = getSurah(Number(surahId));
  if (!s) return `<div class="screen"><div class="empty">Surah not found.</div></div>`;
  const reciterId = params.rec || App.defaultReciterId();
  App.readingSurahId = s.id;

  return `
    <div class="screen read-screen">
      <div class="read-glow"></div>
      <header class="read-head">
        <button class="back-btn" data-act="nav" data-nav="reciter/${reciterId}">${icon("arrowLeft", 18)}<span>${esc(getReciter(reciterId)?.name || "")}</span></button>
        <div class="read-title-block">
          <h1 class="read-title" dir="rtl">${s.nameAr}</h1>
          <p class="read-sub">${esc(s.name)} — ${esc(s.transName)} · ${s.place === "makkah" ? "Makki" : "Madani"} · ${s.ayahs} verses</p>
        </div>
        <button class="icon-btn" data-act="sleep-sheet" title="Sleep timer">${icon("moon", 18)}</button>
      </header>

      <div class="read-layout">
        <aside class="read-player-col">
          <div class="read-player glass-strong" id="read-player">
            ${readingPlayerHTML()}
          </div>
        </aside>
        <div class="verses" id="verses" dir="auto">
          <div class="verses-loading">${icon("spinner", 22)}<span>Preparing the mushaf…</span></div>
        </div>
      </div>
    </div>`;
}

function readingPlayerHTML() {
  const st = App.engine.state;
  const t = st.track;
  const reciter = t ? getReciter(t.reciterId) : null;
  const pct = st.duration ? (st.position / st.duration) * 100 : 0;
  return `
    <div class="rp-head">
      ${t ? avatarImg(reciter, 64) : `<div class="avatar avatar-placeholder" style="width:64px;height:64px"><span>${icon("music", 22)}</span></div>`}
      <div class="rp-meta">
        <div class="rp-title">${t ? esc(t.surahName) : "Nothing playing"}</div>
        <div class="rp-sub">${t ? esc(t.reciterName) : "Play from the list"}</div>
      </div>
      <button class="icon-btn heart ${isFavSurah(t?.surahId) ? "on" : ""}" data-act="fav-track" title="Favorite">${icon("heart", 19)}</button>
    </div>
    <div class="rp-controls">
      <button class="ctl-pill" data-act="speed-cycle">${icon("speed", 15)}<span>${st.speed}x</span></button>
      <button class="ctl-btn" data-act="prev">${icon("prev", 22)}</button>
      <button class="ctl-btn ctl-play ${st.buffering ? "buffering" : ""}" data-act="toggle">${st.buffering ? icon("spinner", 22) : st.playing ? icon("pause", 22) : icon("play", 22)}</button>
      <button class="ctl-btn" data-act="next">${icon("next", 22)}</button>
      <button class="ctl-pill ${App.engine.sleep ? "active" : ""}" data-act="sleep-sheet">${icon("moon", 15)}<span>Sleep</span></button>
    </div>
    <div class="rp-progress">${progressHTML()}</div>
    <div class="rp-foot">
      <button class="pill pill-ambient" data-act="ambient-sheet">${icon("waves", 15)}<span>Background sound</span></button>
      <button class="icon-btn" data-act="expand-player" title="Expand">${icon("chevronDown", 18)}</button>
    </div>`;
}

async function renderVerses(surahId) {
  const host = $("#verses");
  if (!host) return;
  if (!App.quranAr) {
    try {
      const [ar, en] = await Promise.all([
        fetch("data/quran-ar.json").then((r) => r.json()),
        fetch("data/quran-en.json").then((r) => r.json()),
      ]);
      App.quranAr = ar; App.quranEn = en;
    } catch {
      host.innerHTML = `<div class="empty">Could not load the mushaf text. Check your connection.</div>`;
      return;
    }
  }
  const s = getSurah(Number(surahId));
  const set = settings();
  const ar = App.quranAr[s.id] || {};
  const en = App.quranEn[s.id] || {};
  const verses = [];
  for (let i = 1; i <= s.ayahs; i++) {
    if (!ar[i]) continue;
    verses.push(`
      <div class="verse ${i === App.activeVerse ? "verse-active" : ""}" data-ay="${i}" data-act="verse-tap" data-ay2="${i}" role="button" tabindex="0">
        <div class="verse-arabic" dir="rtl" style="font-size:${set.arabicFontSize}px">${ar[i]}</div>
        ${set.showTranslation && en[i] ? `<div class="verse-translation" dir="auto">${esc(en[i])}</div>` : ""}
        ${set.showVerseNumbers ? `<span class="verse-num">${i}</span>` : ""}
      </div>`);
  }
  host.innerHTML = verses.join("");
  applyVerseFontSize();
  scrollToActiveVerse(false);
  syncVerseWithTime();
}

function applyVerseFontSize() {
  const size = settings().arabicFontSize;
  $$(".verse-arabic").forEach((el) => { el.style.fontSize = size + "px"; });
}

function scrollToActiveVerse(smooth = true) {
  const el = $(`.verse[data-ay="${App.activeVerse}"]`);
  if (el) el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "center" });
}

async function syncVerseWithTime() {
  const st = App.engine.state;
  const host = $("#verses");
  if (!host || !st.track) return;
  const surahId = App.readingSurahId;
  if (!surahId) return;

  let timings = App.timingsCache.get(`${st.track.reciterId}:${surahId}`);
  if (timings === undefined) {
    timings = await verseTimings(st.track.reciterId, surahId);
    App.timingsCache.set(`${st.track.reciterId}:${surahId}`, timings);
  }

  const s = getSurah(surahId);
  const ayahCount = s.ayahs;
  const time = st.position || 0;
  const duration = st.duration || 0;

  let active = 1;
  if (timings) {
    let last = timings[0]?.start || 0;
    for (const t of timings) {
      if (time >= t.start) { active = t.ayah; last = t.start; } else break;
    }
    // after the last timestamp, keep the final ayah active
  } else if (duration > 0) {
    const ar = App.quranAr?.[surahId] || {};
    const weights = [];
    let total = 0;
    for (let i = 1; i <= ayahCount; i++) { const w = (ar[i] || "").length + 1; weights.push(w); total += w; }
    let acc = 0;
    for (let i = 1; i <= ayahCount; i++) {
      acc += weights[i - 1] / total;
      if (time / duration <= acc) { active = i; break; }
    }
  }

  if (active !== App.activeVerse) {
    App.activeVerse = active;
    $$(".verse").forEach((v) => v.classList.toggle("verse-active", Number(v.dataset.ay) === active));
    scrollToActiveVerse();
  }
}

async function seekToVerse(ayah) {
  const st = App.engine.state;
  const surahId = App.readingSurahId;
  if (!surahId) return;
  const reciterId = st.track ? st.track.reciterId : App.defaultReciterId();

  // If the reader is open on a different surah than the one playing,
  // switch the player to the surah being read (explicit surahId mapping),
  // then seek to the tapped verse once its duration is known.
  if (!st.track || st.track.surahId !== surahId) {
    const t = buildTrack(reciterId, surahId);
    if (!t) return toast("Recording unavailable", "err");
    App.engine.loadTrack(t, { autoplay: true, queue: queueForReciter(reciterId) });
    const target = ayah;
    App.engine.once("duration", async () => {
      const tm = await getTimings(reciterId, surahId);
      if (tm) {
        const v = tm.find((x) => x.ayah === target);
        if (v) App.engine.seek(v.start);
      } else {
        App.engine.seek(estimateOffset(surahId, target));
      }
    });
    return;
  }

  // Same surah — seek directly.
  const timings = await getTimings(reciterId, surahId);
  if (timings) {
    const t = timings.find((x) => x.ayah === ayah);
    if (t) {
      App.engine.seek(t.start);
      App.engine.play();
      return;
    }
  }
  const dur = App.engine.state.duration || 0;
  if (dur) App.engine.seek(estimateOffset(surahId, ayah));
  App.engine.play();
}

async function getTimings(reciterId, surahId) {
  let timings = App.timingsCache.get(`${reciterId}:${surahId}`);
  if (timings === undefined) {
    timings = await verseTimings(reciterId, surahId);
    App.timingsCache.set(`${reciterId}:${surahId}`, timings);
  }
  return timings;
}

function estimateOffset(surahId, ayah) {
  const s = getSurah(surahId);
  const ar = App.quranAr?.[surahId] || {};
  let total = 0;
  const w = [];
  for (let i = 1; i <= s.ayahs; i++) { const x = (ar[i] || "").length + 1; w.push(x); total += x; }
  let acc = 0;
  for (let i = 1; i < ayah; i++) acc += w[i - 1] / total;
  return acc * (App.engine.state.duration || 0);
}

function bindRead(surahId) {
  renderVerses(surahId);
}

/* ---------- SEARCH ---------- */
function screenSearch() {
  return `
    <div class="screen">
      <header class="page-head">
        <h1 class="page-title">Search</h1>
        <p class="page-sub">Surahs and reciters</p>
      </header>
      <div class="search-field big">
        ${icon("search", 18)}
        <input id="global-search" type="text" placeholder="Search surah or reciter…" autocomplete="off" autofocus />
        <button class="search-clear" id="global-search-clear" hidden>${icon("x", 15)}</button>
      </div>
      <div id="search-results"></div>
    </div>`;
}

function searchResults(q) {
  const needle = q.trim().toLowerCase();
  if (!needle) {
    return `<div class="empty">Type to search across surahs and reciters.</div>`;
  }
  const recs = RECITERS.filter((r) => r.name.toLowerCase().includes(needle) || r.nameAr.includes(q.trim()) || r.country.toLowerCase().includes(needle));
  const surahs = getSurahs().filter((s) => s.name.toLowerCase().includes(needle) || s.nameAr.includes(q.trim()) || s.transName.toLowerCase().includes(needle));
  let html = "";
  if (recs.length) {
    html += `<section class="home-section"><div class="section-head"><h2>Reciters</h2></div><div class="reciter-scroll">` +
      recs.map((r) => `<button class="reciter-card" data-act="nav" data-nav="reciter/${r.id}">${avatarImg(r, 80)}<span class="reciter-card-name">${esc(r.name)}</span><span class="reciter-card-sub">${esc(r.country)}</span></button>`).join("") +
      `</div></section>`;
  }
  if (surahs.length) {
    const rid = App.defaultReciterId();
    html += `<section class="home-section"><div class="section-head"><h2>Surahs</h2><span class="page-sub">Played by ${esc(getReciter(rid)?.name || "")}</span></div><div class="surah-chips">` +
      surahs.map((s) => `<button class="chip-card" data-act="play-surah" data-rid="${rid}" data-sid="${s.id}"><span class="chip-num">${s.id}</span><span class="chip-name">${esc(s.name)}</span><span class="chip-ar" dir="rtl">${s.nameAr}</span></button>`).join("") +
      `</div></section>`;
  }
  if (!html) html = `<div class="empty">No results for “${esc(q)}”.</div>`;
  return html;
}

function bindSearch() {
  const input = $("#global-search");
  const out = $("#search-results");
  if (!input || !out) return;
  const apply = () => {
    out.innerHTML = searchResults(input.value);
    $("#global-search-clear").hidden = !input.value;
  };
  input.addEventListener("input", apply);
  $("#global-search-clear")?.addEventListener("click", () => { input.value = ""; apply(); });
  apply();
}

/* ---------- PLAYLISTS ---------- */
function screenPlaylists() {
  const playlists = Store.get("playlists", []);
  return `
    <div class="screen">
      <header class="page-head">
        <h1 class="page-title">Playlists</h1>
        <p class="page-sub">Curate your listening</p>
      </header>
      <div class="playlists-grid">
        <button class="playlist-card new" data-act="new-playlist">
          <span class="pl-plus">${icon("plus", 22)}</span>
          <span class="pl-name">New playlist</span>
        </button>
        ${playlists.map((p, i) => {
          const firsts = p.tracks.slice(0, 2).map((t) => getReciter(t.reciterId));
          const arts = firsts.length ? firsts.map((r) => avatarImg(r, 56)).join("") : `<div class="pl-art-empty">${icon("music", 24)}</div>`;
          return `
          <button class="playlist-card" data-act="nav" data-nav="playlist/${encodeURIComponent(p.id)}">
            <div class="pl-art">${arts}</div>
            <span class="pl-name">${esc(p.name)}</span>
            <span class="pl-sub">${p.tracks.length} track${p.tracks.length === 1 ? "" : "s"}</span>
          </button>`;
        }).join("")}
      </div>
    </div>`;
}

function screenPlaylistDetail(id) {
  const playlists = Store.get("playlists", []);
  const idx = playlists.findIndex((p) => p.id === id);
  if (idx < 0) return `<div class="screen"><div class="empty">Playlist not found.</div></div>`;
  const p = playlists[idx];
  const tracks = p.tracks.map((t, ti) => {
    const tr = buildTrack(t.reciterId, t.surahId);
    const rec = getReciter(t.reciterId);
    return { tr, rec, ti };
  }).filter((x) => x.tr);

  return `
    <div class="screen">
      <button class="back-btn" data-act="nav" data-nav="playlists">${icon("arrowLeft", 18)}<span>Playlists</span></button>
      <header class="pl-detail-head">
        <div class="pl-detail-art">${tracks.length ? tracks.slice(0, 2).map((x) => avatarImg(x.rec, 72)).join("") : `<div class="pl-art-empty">${icon("music", 28)}</div>`}</div>
        <div class="pl-detail-meta">
          <h1 class="profile-name">${esc(p.name)}</h1>
          <p class="page-sub">${p.tracks.length} track${p.tracks.length === 1 ? "" : "s"} · created ${new Date(p.createdAt).toLocaleDateString()}</p>
          <div class="profile-actions">
            <button class="pill pill-primary" data-act="playlist-play" data-idx="${idx}">${icon("play", 16)}<span>Play all</span></button>
            <button class="pill" data-act="playlist-play-shuffle" data-idx="${idx}">${icon("shuffle", 16)}<span>Shuffle</span></button>
            <button class="pill danger-ghost" data-act="playlist-delete" data-idx="${idx}">${icon("trash", 16)}<span>Delete</span></button>
          </div>
        </div>
      </header>
      <div class="surah-list">
        ${tracks.length ? tracks.map(({ tr, rec, ti }) => `
          <div class="surah-row" data-act="play-surah" data-rid="${tr.reciterId}" data-sid="${tr.surahId}" role="button" tabindex="0">
            ${avatarImg(rec, 40)}
            <span class="surah-names"><span class="surah-en">${esc(tr.surahName)}</span><span class="surah-sub">${esc(tr.reciterName)}</span></span>
            <span class="surah-ar" dir="rtl">${tr.surahNameAr}</span>
            <span class="surah-actions" >
              <button class="icon-btn" data-act="playlist-remove" data-pl="${idx}" data-ti="${ti}" title="Remove">${icon("x", 17)}</button>
            </span>
          </div>`).join("") : `<div class="empty">Empty playlist — use the “+” on any surah to add it here.</div>`}
      </div>
    </div>`;
}

function newPlaylistSheet() {
  openSheet({
    title: "New playlist",
    body: `
      <div class="search-field"><input id="newpl-name" type="text" placeholder="Playlist name" maxlength="40" /></div>
      <div class="sheet-actions">
        <button class="pill pill-primary" data-act="create-playlist">${icon("plus", 16)}<span>Create</span></button>
      </div>`,
    onMount(el) {
      setTimeout(() => { const i = el.querySelector("#newpl-name"); if (i) i.focus(); }, 80);
    },
  });
}

function bindPlaylists() {}
function bindPlaylistDetail() {}

/* ---------- FAVORITES ---------- */
function screenFavorites() {
  const favR = Store.get("favorites", { reciters: [], surahs: [] });
  const reciters = favR.reciters.map(getReciter).filter(Boolean);
  const surahs = favR.surahs.map(getSurah).filter(Boolean);
  const rid = App.defaultReciterId();
  return `
    <div class="screen">
      <header class="page-head"><h1 class="page-title">Favorites</h1><p class="page-sub">Your collection</p></header>
      ${reciters.length ? `<section class="home-section"><div class="section-head"><h2>Reciters</h2></div><div class="reciter-scroll">` +
        reciters.map((r) => `<button class="reciter-card" data-act="nav" data-nav="reciter/${r.id}">${avatarImg(r, 84)}<span class="reciter-card-name">${esc(r.name)}</span><span class="reciter-card-sub">${esc(r.country)}</span></button>`).join("") +
        `</div></section>` : ""}
      ${surahs.length ? `<section class="home-section"><div class="section-head"><h2>Surahs</h2><span class="page-sub">Played by ${esc(getReciter(rid)?.name || "")}</span></div><div class="surah-list">` +
        surahs.map((s) => `
          <div class="surah-row" data-act="play-surah" data-rid="${rid}" data-sid="${s.id}" role="button" tabindex="0">
            <span class="surah-badge">${s.id}</span>
            <span class="surah-names"><span class="surah-en">${esc(s.name)}</span><span class="surah-sub">${s.place === "makkah" ? "Makki" : "Madani"} · ${s.ayahs} verses</span></span>
            <span class="surah-ar" dir="rtl">${s.nameAr}</span>
            <span class="surah-actions" >
              <button class="icon-btn" data-act="read-surah" data-rid="${rid}" data-sid="${s.id}" title="Read">${icon("book", 18)}</button>
              <button class="icon-btn" data-act="menu-fav" data-sid="${s.id}" title="Remove">${icon("heart", 18)}</button>
            </span>
          </div>`).join("") + `</div></section>` : ""}
      ${!reciters.length && !surahs.length ? `<div class="empty">${icon("heart", 30)}<span>Tap the heart anywhere to build your collection.</span></div>` : ""}
    </div>`;
}

function bindFavorites() {}

/* ---------- SETTINGS ---------- */
function screenSettings() {
  const s = settings();
  const accents = [
    { id: "sapphire", name: "Sapphire", c: "#8fb3ff" },
    { id: "teal", name: "Teal", c: "#7fd8c8" },
    { id: "violet", name: "Violet", c: "#b9a6ff" },
    { id: "ember", name: "Ember", c: "#ffb98a" },
  ];
  const amb = App.ambient;
  return `
    <div class="screen settings">
      <header class="page-head"><h1 class="page-title">Settings</h1><p class="page-sub">Tune the experience</p></header>

      <section class="settings-section">
        <h3>Playback</h3>
        <div class="setting-row">
          <div class="setting-label">${icon("speed", 18)}<div><div class="sl-name">Default speed</div><div class="sl-sub">Applied to new playback</div></div></div>
          <div class="seg" data-key="speed">
            ${[0.75, 1, 1.25, 1.5, 2].map((v) => `<button class="seg-btn ${s.speed === v ? "on" : ""}" data-act="speed-set" data-v="${v}">${v}x</button>`).join("")}
          </div>
        </div>
        <div class="setting-row">
          <div class="setting-label">${icon("next", 18)}<div><div class="sl-name">Auto-advance</div><div class="sl-sub">Continue to the next surah in the queue</div></div></div>
          <label class="switch"><input type="checkbox" data-act="toggle-setting" data-key="autoAdvance" ${s.autoAdvance ? "checked" : ""} /><span class="track"></span></label>
        </div>
      </section>

      <section class="settings-section">
        <h3>Reading</h3>
        <div class="setting-row">
          <div class="setting-label">${icon("book", 18)}<div><div class="sl-name">Arabic text size</div><div class="sl-sub" id="fsize-label">${s.arabicFontSize}px</div></div></div>
          <input type="range" class="slider" min="22" max="44" step="1" value="${s.arabicFontSize}" data-act="fsize" style="--fill:${((s.arabicFontSize - 22) / 22) * 100}%" />
        </div>
        <div class="setting-row">
          <div class="setting-label">${icon("book", 18)}<div><div class="sl-name">English translation</div><div class="sl-sub">Show Saheeh International below each verse</div></div></div>
          <label class="switch"><input type="checkbox" data-act="toggle-setting" data-key="showTranslation" ${s.showTranslation ? "checked" : ""} /><span class="track"></span></label>
        </div>
        <div class="setting-row">
          <div class="setting-label">${icon("info", 18)}<div><div class="sl-name">Verse numbers</div><div class="sl-sub">Show the numbered badge on each verse</div></div></div>
          <label class="switch"><input type="checkbox" data-act="toggle-setting" data-key="showVerseNumbers" ${s.showVerseNumbers ? "checked" : ""} /><span class="track"></span></label>
        </div>
      </section>

      <section class="settings-section">
        <h3>Audio</h3>
        <div class="setting-row">
          <div class="setting-label">${icon("volume", 18)}<div><div class="sl-name">Quran volume</div><div class="sl-sub">Independent from background sound</div></div></div>
          <input type="range" class="slider" min="0" max="1" step="0.01" value="${App.engine.audio.volume}" data-act="qvol" style="--fill:${App.engine.audio.volume * 100}%" />
        </div>
        <div class="setting-row">
          <div class="setting-label">${icon("droplet", 18)}<div><div class="sl-name">Background volume</div><div class="sl-sub">Ambient layer level</div></div></div>
          <input type="range" class="slider" min="0" max="1" step="0.01" value="${amb.volume}" data-act="bvol" style="--fill:${amb.volume * 100}%" />
        </div>
      </section>

      <section class="settings-section">
        <h3>Appearance</h3>
        <div class="setting-row">
          <div class="setting-label">${icon("droplet", 18)}<div><div class="sl-name">Accent</div><div class="sl-sub">A subtle tint for active elements</div></div></div>
          <div class="accent-row">
            ${accents.map((a) => `<button class="accent-dot ${s.accent === a.id ? "on" : ""}" data-act="accent-set" data-accent="${a.id}" style="--c:${a.c}" title="${a.name}" aria-label="${a.name}"></button>`).join("")}
          </div>
        </div>
      </section>

      <section class="settings-section">
        <h3>Data</h3>
        <div class="about-card glass">
          <div class="about-title">${APP_NAME} — sources & credits</div>
          <ul class="about-list">
            <li>Quran text — Tanzil Uthmani Hafs (via the open quran-api mirror)</li>
            <li>Translation — Saheeh International (via Quran.com API)</li>
            <li>Recitations — mp3quran.net & quranicaudio.com public audio</li>
            <li>Reciter photos — Quran.com official profiles · Wikimedia · Assabile</li>
            <li>Audio maps strictly by surah ID; every track is validated before playback</li>
          </ul>
        </div>
        <div class="setting-row">
          <div class="setting-label">${icon("trash", 18)}<div><div class="sl-name">Clear local data</div><div class="sl-sub">Favorites, playlists and settings on this device</div></div></div>
          <button class="pill danger-ghost" data-act="clear-data">${icon("trash", 16)}<span>Clear</span></button>
        </div>
        <p class="version">${APP_NAME} v1.0 — built for calm listening</p>
      </section>
    </div>`;
}

function bindSettings() {}

/* ============================ favorites helpers ============================ */

export function isFavSurah(id) {
  return Store.get("favorites", { reciters: [], surahs: [] }).surahs.includes(id);
}
export function isFavReciter(id) {
  return Store.get("favorites", { reciters: [], surahs: [] }).reciters.includes(id);
}
export function toggleFavSurah(id) {
  const f = Store.get("favorites", { reciters: [], surahs: [] });
  f.surahs = f.surahs.includes(id) ? f.surahs.filter((x) => x !== id) : [...f.surahs, id];
  Store.set("favorites", f);
}
export function toggleFavReciter(id) {
  const f = Store.get("favorites", { reciters: [], surahs: [] });
  f.reciters = f.reciters.includes(id) ? f.reciters.filter((x) => x !== id) : [...f.reciters, id];
  Store.set("favorites", f);
}

/* ============================ download ============================ */

function downloadTrack(d) {
  const t = buildTrack(d.rid, Number(d.sid));
  if (!t) return toast("Recording unavailable", "err");
  const a = document.createElement("a");
  a.href = t.audioUrl;
  a.download = `${String(t.surahId).padStart(3, "0")}-${t.surahName}-${t.reciterName}.mp3`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  toast(`Downloading ${t.surahName}…`);
}

/* ============================ engine sync (events → UI) ============================ */

function syncExpanded() {
  const overlay = $("#expanded");
  if (overlay && overlay.classList.contains("show")) renderExpandedPlayer();
  const rp = $("#read-player");
  if (rp) rp.innerHTML = readingPlayerHTML();
}

export function wireEngineEvents() {
  const e = App.engine;
  e.on("trackchange", () => {
    App.activeVerse = 0;
    renderMiniPlayer();
    syncExpanded();
    if (App.route.name === "read") {
      App.activeVerse = 0;
      renderVerses(App.readingSurahId).then(() => syncVerseWithTime());
    }
  });
  e.on("playstate", () => { renderMiniPlayer(); syncExpanded(); });
  e.on("time", () => {
    const overlay = $("#expanded");
    const rp = $("#read-player");
    const st = e.state;
    const pct = st.duration ? (st.position / st.duration) * 100 : 0;
    if ((overlay && overlay.classList.contains("show")) || rp) {
      if (overlay && overlay.classList.contains("show")) {
        const s = overlay.querySelector(".slider-progress");
        if (s) { s.value = st.position; s.style.setProperty("--fill", pct + "%"); }
        const times = overlay.querySelectorAll(".progress-times span");
        if (times) { times[0].textContent = fmtTime(st.position); times[1].textContent = fmtTime(st.duration); }
      }
      if (rp) {
        const s = rp.querySelector(".slider-progress");
        if (s) { s.value = st.position; s.style.setProperty("--fill", pct + "%"); }
        const times = rp.querySelectorAll(".progress-times span");
        if (times) { times[0].textContent = fmtTime(st.position); times[1].textContent = fmtTime(st.duration); }
      }
    }
    if (App.route.name === "read") syncVerseWithTime();
    // mini progress
    const mp = $(".mini-progress");
    if (mp && st.track) mp.style.width = pct + "%";
  });
  e.on("duration", () => { renderMiniPlayer(); syncExpanded(); });
  e.on("buffering", () => { renderMiniPlayer(); syncExpanded(); });
  e.on("repeat", () => { renderMiniPlayer(); syncExpanded(); });
  e.on("shuffle", () => { renderMiniPlayer(); syncExpanded(); });
  e.on("sleep", () => { renderMiniPlayer(); syncExpanded(); });
  e.on("error", ({ validation, code, track }) => {
    if (validation && validation.length) {
      console.error("[engine] validation failed:", validation);
      toast("Playback blocked — track validation failed", "err");
      return;
    }
    const label = track ? `${track.surahName} · ${track.reciterName}` : "";
    toast(`Couldn't load audio (${label}). Check your connection.`, "err");
    renderMiniPlayer();
    syncExpanded();
  });
  e.on("queueend", () => {
    if (App.engine.sleep?.mode === "end-queue") {
      App.engine.stopSleep();
      toast("Sleep timer — queue finished");
    }
  });
}

/* ============================ global event wiring ============================ */

export function wireGlobalEvents() {
  document.addEventListener("click", (ev) => {
    const el = ev.target.closest("[data-act]");
    if (!el) return;
    const act = el.dataset.act;
    if (Actions[act]) {
      ev.preventDefault();
      Actions[act](el, ev);
    }
  });

  // row "more" menus inside surah rows
  document.addEventListener("click", (ev) => {
    const el = ev.target.closest('[data-act="row-menu"]');
    if (!el) return;
    ev.stopPropagation();
    const rect = el.getBoundingClientRect();
    surahMenu(el.dataset.rid, Number(el.dataset.sid), rect.right - 200, rect.bottom + 6);
  });

  document.addEventListener("input", onInput);

  document.addEventListener("keydown", (ev) => {
    const target = ev.target;
    const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
    if (typing) return;
    if (ev.code === "Space") {
      ev.preventDefault();
      App.engine.toggle();
      renderMiniPlayer();
      syncExpanded();
    } else if (ev.code === "ArrowRight" && !ev.shiftKey) {
      App.engine.next();
    } else if (ev.code === "ArrowLeft" && !ev.shiftKey) {
      App.engine.prev();
    } else if (ev.code === "Escape") {
      closeExpanded();
      closeSheets();
      closeDropdown();
    }
  });

  document.addEventListener("click", (ev) => {
    if (ev.target.closest('[data-act="row-menu"]')) return; // row-menu handler manages its own menu
    if (!ev.target.closest(".dropdown")) closeDropdown();
  });

  window.addEventListener("hashchange", render);
  window.addEventListener("resize", () => {});
}

/* ============================ speed set from settings ============================ */
document.addEventListener("click", (ev) => {
  const el = ev.target.closest('[data-act="speed-set"]');
  if (!el) return;
  const v = parseFloat(el.dataset.v);
  const s = Store.get("settings", {});
  s.speed = v;
  Store.set("settings", s);
  App.engine.setSpeed(v);
  render();
});
