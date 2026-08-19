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
import { OfflineStore } from "./offline.js";
import { t, setLang, getLang, fmtWeekday } from "./i18n.js";
import { availableSurahCount, audioUrlFor, localFatihahFor } from "./data.js";

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
  if (m < 1) return t("home.justnow");
  if (m < 60) return t("home.minago", { m });
  const h = Math.floor(m / 60);
  if (h < 24) return t("home.hourago", { h });
  return t("home.dayago", { d: Math.floor(h / 24) });
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
  versesOpen: false,
  versesShowTranslation: true,
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
  // navigating to another route must never leave overlays behind
  closeSheets();
  closeDropdown();
  if (r.name !== "read") App.versesOpen = false;
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
  { id: "home", labelKey: "nav.home", icon: "home" },
  { id: "search", labelKey: "nav.search", icon: "search" },
  { id: "reciters", labelKey: "nav.reciters", icon: "users" },
  { id: "playlists", labelKey: "nav.playlists", icon: "library" },
  { id: "favorites", labelKey: "nav.favorites", icon: "heart" },
  { id: "settings", labelKey: "nav.settings", icon: "gear" },
];

export function renderChrome() {
  const side = $("#sidebar");
  side.innerHTML = `
    <div class="brand">
      <div class="brand-mark">${icon("music", 18)}</div>
      <div class="brand-name">${APP_NAME}</div>
    </div>
    <nav class="side-nav">${NAV_ITEMS.map((n) => `
      <button class="nav-item" data-act="nav" data-nav="${n.id}">${icon(n.icon, 19)}<span>${t(n.labelKey)}</span></button>`).join("")}
    </nav>
    <div class="side-foot">
      <div class="side-card">
        <div class="side-card-title">${t("side.title")}</div>
        <div class="side-card-sub">${t("side.sub")}</div>
        <div class="side-card-ver">${t("side.ver", { n: RECITERS.length })}</div>
      </div>
    </div>`;

  const bottom = $("#mobilenav");
  bottom.innerHTML = NAV_ITEMS.map((n) => `
    <button class="mnav-item" data-act="nav" data-nav="${n.id}" aria-label="${t(n.labelKey)}">${icon(n.icon, 21)}<span>${t(n.labelKey)}</span></button>`).join("");

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
  const tr = st.track;
  const reciter = tr ? getReciter(tr.reciterId) : null;
  const pct = st.duration ? (st.position / st.duration) * 100 : 0;
  const repeatIcon = st.repeat === "one" ? "repeat1" : "repeat";
  const sleepChip = App.engine.sleep
    ? `<span class="mini-sleep">${icon("moon", 12)}${sleepLabel()}</span>` : "";
  return `
    <div class="mini-player ${tr ? "mini-visible" : ""}" data-act="expand-player" role="button" tabindex="0" aria-label="Open player">
      <div class="mini-progress" style="width:${tr ? pct : 0}%"></div>
      <div class="mini-art">${tr ? avatarImg(reciter, 44) : `<div class="avatar avatar-placeholder" style="width:44px;height:44px"><span>${icon("music", 18)}</span></div>`}</div>
      <div class="mini-meta">
        <div class="mini-title">${tr ? esc(tr.surahName) : esc(t("pl.nothing"))}${st.offline ? ` <span class="offline-dot">${t("pl.offline")}</span>` : ""}</div>
        <div class="mini-sub">${tr ? esc(recName(getReciter(tr.reciterId))) : t("pl.choose")}</div>
        ${sleepChip}
      </div>
      <div class="mini-controls" >
        <button class="icon-btn ${st.shuffle ? "on" : ""}" data-act="shuffle" title="${t("pl.shuffle")}">${icon("shuffle", 18)}</button>
        <button class="icon-btn" data-act="prev" title="${t("pl.prev")}">${icon("prev", 20)}</button>
        <button class="icon-btn play" data-act="toggle" title="${t("pl.toggle")}">${st.playing ? icon("pause", 20) : icon("play", 20)}</button>
        <button class="icon-btn" data-act="next" title="${t("pl.next")}">${icon("next", 20)}</button>
        <button class="icon-btn ${st.repeat !== "off" ? "on" : ""}" data-act="repeat" title="${t("pl.repeat")}">${icon(repeatIcon, 18)}</button>
        <button class="icon-btn" data-act="queue-sheet" title="${t("pl.queue")}">${icon("queue", 18)}</button>
        <button class="icon-btn" data-act="mini-more" title="${t("pl.more")}">${icon("more", 18)}</button>
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

const BOLT_SVG = `<svg viewBox="0 0 28 72" fill="none" aria-hidden="true"><path d="M18 1 5 41h8.5L10 71l14-38h-8.5L20 1z" fill="#e9f0ff" opacity=".85"/><path d="M18 1 5 41h8.5L10 71l14-38h-8.5L20 1z" fill="none" stroke="#fff" stroke-width=".6" opacity=".5"/></svg>`;

export function renderExpandedPlayer() {
  const st = App.engine.state;
  const tr = st.track;
  const reciter = tr ? getReciter(tr.reciterId) : null;
  const pct = st.duration ? (st.position / st.duration) * 100 : 0;
  const ambient = App.ambient;
  const bgName = AMBIENT_SOUNDS.find((s) => s.id === ambient.current)?.name || "None";
  const sleepBtn = App.engine.sleep ? `<span class="sleep-dot"></span>` : "";

  const overlay = $("#expanded");
  overlay.innerHTML = `
    <div class="player-scene" aria-hidden="true">
      <div class="ps-sky"></div>
      <div class="ps-cloud ps-c1"></div>
      <div class="ps-cloud ps-c2"></div>
      <div class="ps-cloud ps-c3"></div>
      <div class="ps-bolt ps-b1">${BOLT_SVG}<div class="ps-glow"></div></div>
      <div class="ps-bolt ps-b2">${BOLT_SVG}<div class="ps-glow"></div></div>
      <div class="ps-bolt ps-b3">${BOLT_SVG}<div class="ps-glow"></div></div>
      <div class="ps-rain"></div>
      <div class="ps-mist"></div>
      <div class="ps-vignette"></div>
    </div>
    <div class="player-backdrop" data-act="close-expanded"></div>
    <div class="expanded-stack">
      <div class="player-card glass-strong player-glass" role="dialog" aria-label="Player">
        <div class="player-glow"></div>
        <div class="player-now">${t("pl.now")}</div>
        <div class="player-head">
          ${tr ? avatarImg(reciter, 116, "player-art") : `<div class="avatar avatar-placeholder player-art" style="width:116px;height:116px"><span>${icon("music", 34)}</span></div>`}
          <div class="player-head-meta">
            <div class="player-title">${tr ? esc(tr.surahName) : esc(t("pl.nothing"))}</div>
            ${t && tr.surahNameAr ? `<div class="player-title-ar" dir="rtl">${esc(tr.surahNameAr)}</div>` : ""}
            <div class="player-sub">${tr ? esc(recName(getReciter(tr.reciterId))) : t("pl.choose")}</div>
            <div class="player-head-actions">
              <button class="icon-btn" data-act="queue-sheet" title="Queue">${icon("queue", 19)}</button>
              <button class="icon-btn heart ${isFavSurah(t?.surahId) ? "on" : ""}" data-act="fav-track" title="${t("fav.added")}">${icon("heart", 20)}</button>
              <button class="icon-btn" data-act="player-more" title="${t("pl.more")}">${icon("more", 20)}</button>
            </div>
          </div>
        </div>

        <div class="player-progress">
          <div class="player-meta-row">
            <span class="player-surah-chip">${tr ? t("pl.surahChip", { n: tr.surahId }) : ""}${st.offline ? ` · <span class="offline-dot">${t("pl.offline")}</span>` : ""}</span>
            <span class="player-ayah-count">${t && getSurah(tr.surahId) ? t("rec.verses", { n: getSurah(tr.surahId).ayahs }) : ""}</span>
          </div>
          ${progressHTML()}
        </div>

        <div class="player-controls">
          <button class="ctl-pill" data-act="speed-cycle">${icon("speed", 16)}<span id="speedLabel">${t("pl.speed", { s: st.speed })}</span></button>
          <button class="ctl-btn" data-act="prev" title="${t("pl.prev")}">${icon("prev", 26)}</button>
          <button class="ctl-btn ctl-play ${st.buffering ? "buffering" : ""}" data-act="toggle" title="${t("pl.toggle")}">
            ${st.buffering ? icon("spinner", 26) : st.playing ? icon("pause", 26) : icon("play", 26)}
          </button>
          <button class="ctl-btn" data-act="next" title="${t("pl.next")}">${icon("next", 26)}</button>
          <button class="ctl-pill ${App.engine.sleep ? "active" : ""}" data-act="sleep-sheet">${icon("moon", 16)}<span>${t("pl.sleep")}</span>${sleepBtn}</button>
        </div>

        <div class="volume-block">
          <div class="volume-row">
            <div class="volume-label">${icon("volume", 16)}<span>${t("pl.quranVol")}</span></div>
            <input type="range" class="slider" min="0" max="1" step="0.01" value="${App.engine.audio.volume}" data-act="qvol" style="--fill:${App.engine.audio.volume * 100}%" aria-label="Quran volume"/>
          </div>
          <div class="volume-row">
            <div class="volume-label">${icon(ambient.current === "off" ? "moonoff" : "cloudLightning", 16)}<span>${t("pl.bgVol")}</span></div>
            <input type="range" class="slider" min="0" max="1" step="0.01" value="${ambient.volume}" data-act="bvol" style="--fill:${ambient.volume * 100}%" aria-label="Background volume"/>
          </div>
        </div>

        <div class="player-foot">
          <button class="pill pill-ambient" data-act="ambient-sheet">${icon("waves", 16)}<span id="ambientPillLabel">${t("pl.bgPill", { name: bgName })}</span>${icon("chevronDown", 14)}</button>
          <button class="pill pill-verses" data-act="toggle-verses">${icon("book", 16)}<span id="versesBtnLabel">${t("pl.showVerses")}</span></button>
        </div>
      </div>

      <div class="verses-panel glass-strong" id="verses-panel"></div>
    </div>`;

  overlay.classList.add("show");
  document.body.classList.add("no-scroll");
  if (App.versesOpen) {
    overlay.classList.add("verses-open");
    renderVersesPanel();
  }
}

export function closeExpanded() {
  App.versesOpen = false;
  const overlay = $("#expanded");
  overlay.classList.remove("show", "verses-open");
  overlay.innerHTML = "";
  document.body.classList.remove("no-scroll");
}

/* ============================ verses panel (player) ============================ */

async function ensureQuranData() {
  if (App.quranAr && App.quranEn) return true;
  const preData = window.__SAKINA_DATA__;
  if (preData) { App.quranAr = preData.ar; App.quranEn = preData.en; return true; }
  try {
    const [ar, en] = await Promise.all([
      fetch("data/quran-ar.json").then((r) => r.json()),
      fetch("data/quran-en.json").then((r) => r.json()),
    ]);
    App.quranAr = ar; App.quranEn = en;
    return true;
  } catch { return false; }
}

/* Estimate per-verse start times (seconds) for a surah.
   Pause-aware: reciters pause ~0.8s between verses, so a pure
   character-proportion estimate races ahead of the audio.
   This keeps the active-verse highlight in sync with the voice. */
export function estimateVerseStarts(surahId, duration) {
  const s = getSurah(surahId);
  const ar = App.quranAr?.[surahId] || {};
  if (!s || !duration || duration <= 0) return null;
  const N = s.ayahs;
  const PAUSE = 0.8; // typical gap between verses in murattal
  const chars = [];
  let total = 0;
  for (let i = 1; i <= N; i++) { const c = (ar[i] || "").length + 1; chars.push(c); total += c; }
  const usable = Math.max(0.2, duration - PAUSE * (N - 1));
  const starts = [0];
  let acc = 0;
  for (let i = 1; i <= N; i++) {
    starts.push((acc / total) * usable + (i - 1) * PAUSE);
    acc += chars[i - 1];
  }
  return starts;
}

async function computeActiveAyah(surahId, time, duration) {
  const reciterId = App.engine.state.track?.reciterId;
  if (!reciterId || !surahId || time <= 0.35) return 1;
  const timings = await getTimings(reciterId, surahId);
  if (timings && timings.length) {
    // stretch official timings to the actual file duration (recordings differ slightly)
    const last = timings[timings.length - 1].start;
    const k = (duration && last > 0) ? Math.min(1.6, Math.max(0.6, duration / last)) : 1;
    let active = timings[0].ayah;
    for (const tt of timings) { if (time >= tt.start * k) active = tt.ayah; else break; }
    return active;
  }
  const starts = estimateVerseStarts(surahId, duration);
  if (!starts) return 1;
  let active = 1;
  for (let i = 1; i < starts.length; i++) { if (time >= starts[i]) active = i; else break; }
  return active;
}

export async function openVerses() {
  const tr = App.engine.state.track;
  if (!t) return toast(t("toast.notPlaying"), "info");
  App.versesOpen = true;
  const overlay = $("#expanded");
  if (!overlay) return;
  overlay.classList.add("verses-open");
  const lbl = $("#versesBtnLabel");
  if (lbl) lbl.textContent = t("pl.hideVerses");
  await renderVersesPanel();
}

export function closeVerses() {
  App.versesOpen = false;
  const overlay = $("#expanded");
  if (overlay) overlay.classList.remove("verses-open");
  const lbl = $("#versesBtnLabel");
  if (lbl) lbl.textContent = t("pl.showVerses");
}

async function renderVersesPanel() {
  const panel = $("#verses-panel");
  if (!panel) return;
  const t = App.engine.state.track;
  if (!t) return;
  const s = getSurah(t.surahId);
  if (!s) return;
  const both = App.versesShowTranslation !== false;

  panel.innerHTML = `
    <div class="pv-head">
      <div class="pv-head-meta">
        <div class="pv-surah-ar" dir="rtl">${esc(s.nameAr)}</div>
        <div class="pv-surah-en">Surah ${s.id} · ${esc(s.name)} — ${esc(t.reciterName)}</div>
      </div>
      <div class="pv-toggle">
        <button class="pv-toggle-btn ${both ? "" : "active"}" data-act="verses-lang" data-mode="ar">Arabic</button>
        <button class="pv-toggle-btn ${both ? "active" : ""}" data-act="verses-lang" data-mode="both">+ Translation</button>
      </div>
      <button class="icon-btn" data-act="close-verses" title="Close">${icon("x", 20)}</button>
    </div>
    <div class="pv-list"><span class="empty-inline">Loading verses…</span></div>
    <div class="pv-mini">
      <div class="pv-mini-progress" id="pv-mini-progress"></div>
      <div class="pv-mini-row">
        ${avatarImg(getReciter(t.reciterId), 40)}
        <div class="pv-mini-meta">
          <div class="pv-mini-title">${esc(t.surahName)}</div>
          <div class="pv-mini-sub">${esc(recName(getReciter(t.reciterId)))}</div>
        </div>
        <button class="icon-btn" data-act="prev" title="Previous">${icon("prev", 19)}</button>
        <button class="icon-btn pv-play" data-act="toggle" title="Play / Pause">${App.engine.state.playing ? icon("pause", 19) : icon("play", 19)}</button>
        <button class="icon-btn" data-act="next" title="Next">${icon("next", 19)}</button>
      </div>
    </div>`;

  const okData = await ensureQuranData();
  const list = panel.querySelector(".pv-list");
  if (!list) return;
  if (!okData) { list.innerHTML = `<div class="empty-inline">${t("pv.loadErr")}</div>`; return; }

  const ar = App.quranAr[s.id] || {};
  const en = App.quranEn[s.id] || {};
  const fsize = settings().arabicFontSize;
  let html = "";
  for (let i = 1; i <= s.ayahs; i++) {
    if (!ar[i]) continue;
    html += `
      <div class="pv-verse" data-ay="${i}" data-act="verse-tap" role="button" tabindex="0">
        <span class="pv-num">${i}</span>
        <div class="pv-arabic" dir="rtl" style="font-size:${fsize}px">${ar[i]}</div>
        ${both && en[i] ? `<div class="pv-translation">${esc(en[i])}</div>` : ""}
      </div>`;
  }
  list.innerHTML = html;
  refreshVersesMini();
  await syncPlayerVerses(true);
}

async function syncPlayerVerses(forceScroll = false) {
  const panel = $("#verses-panel");
  if (!panel || !App.versesOpen) return;
  const st = App.engine.state;
  const t = st.track;
  if (!t) return;
  const ay = await computeActiveAyah(t.surahId, st.position || 0, st.duration || 0);
  const prev = panel.querySelector(".pv-verse.active");
  if (prev && Number(prev.dataset.ay) === ay) return;
  panel.querySelectorAll(".pv-verse").forEach((v) => v.classList.toggle("active", Number(v.dataset.ay) === ay));
  const el = panel.querySelector(`.pv-verse[data-ay="${ay}"]`);
  if (el) {
    const list = panel.querySelector(".pv-list");
    if (!list) return;
    const target = el.offsetTop - list.clientHeight / 2 + el.clientHeight / 2;
    list.scrollTo({ top: Math.max(0, target), behavior: forceScroll ? "auto" : "smooth" });
  }
}

function refreshVersesMini() {
  const panel = $("#verses-panel");
  if (!panel) return;
  const st = App.engine.state;
  const play = panel.querySelector('.pv-mini [data-act="toggle"]');
  if (play) play.innerHTML = st.playing ? icon("pause", 19) : icon("play", 19);
  const prog = panel.querySelector("#pv-mini-progress");
  if (prog && st.duration) prog.style.width = Math.min(100, (st.position / st.duration) * 100) + "%";
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
    : `<div class="empty-inline">${t("sh.queueEmpty")}</div>`;
  openSheet({ title: t("q.upnext"), body: `<div class="queue-list">${rows}</div>` });
}

function sleepSheet() {
  const opts = [
    { mode: "time", minutes: 10, label: t("sh.sleep10") },
    { mode: "time", minutes: 20, label: t("sh.sleep20") },
    { mode: "time", minutes: 30, label: t("sh.sleep30") },
    { mode: "time", minutes: 45, label: t("sh.sleep45") },
    { mode: "time", minutes: 60, label: t("sh.sleep60") },
    { mode: "end-surah", label: t("sh.sleepEndSurah") },
    { mode: "end-queue", label: t("sh.sleepEndQueue") },
    { mode: "off", label: t("sh.sleepOff") },
  ];
  const active = App.engine.sleep;
  const rows = opts.map((o) => `
    <button class="sheet-row ${active && active.mode === o.mode && (o.minutes === undefined || active.minutes === o.minutes) ? "active" : ""}" data-act="sleep-set" data-mode="${o.mode}" data-min="${o.minutes || 0}">
      <span>${o.label}</span>${icon("check", 16)}
    </button>`).join("");
  openSheet({ title: t("sh.sleepTitle"), body: `<div class="sheet-list">${rows}</div>` });
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
    title: t("sh.bgTitle"),
    body: `<p class="sheet-hint">${t("sh.bgHint")}</p><div class="ambient-grid">${rows}</div>`,
  });
}

function playlistPickerSheet(track, menuEl) {
  const playlists = Store.get("playlists", []);
  const rows = playlists.length
    ? playlists.map((p, i) => `
      <button class="sheet-row" data-act="add-to-playlist" data-pl="${i}" data-rid="${track.reciterId}" data-sid="${track.surahId}">
        <span>${esc(p.name)}</span>${icon("plus", 16)}
      </button>`).join("")
    : `<div class="empty-inline">${t("sh.noPlaylists")}</div>`;
  openSheet({ title: t("sh.addToPlaylist", { name: esc(track.surahName) }), body: `<div class="sheet-list">${rows}</div>` });
}

function addToPlaylist(plIndex, reciterId, surahId) {
  const playlists = Store.get("playlists", []);
  const pl = playlists[plIndex];
  if (!pl) return;
  const t = buildTrack(reciterId, surahId);
  if (!t) return toast(t("toast.recUnavailable"), "info");
  const dup = pl.tracks.some((x) => x.reciterId === reciterId && x.surahId === surahId);
  if (dup) return toast(t("sh.alreadyIn"), "info");
  pl.tracks.push({ reciterId, surahId });
  Store.set("playlists", playlists);
  toast(t("sh.addedTo", { name: pl.name }));
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
    toast(m === "off" ? t("sh.sleepOffToast") : t("sh.sleepSet"));
  },
  "ambient-sheet"() { ambientSheet(); },
  "ambient-set"(el) {
    const id = el.dataset.id;
    App.ambient.start(id);
    $$(".ambient-tile").forEach((t) => t.classList.toggle("active", t.dataset.id === id));
    updateAmbientVisuals(id);
    const lbl = $("#ambientPillLabel");
    if (lbl) lbl.textContent = t("pl.bgPill", { name: AMBIENT_SOUNDS.find((s) => s.id === id)?.name || "None" });
  },
  "fav-track"() {
    const t = App.engine.state.track;
    if (!t) return;
    toggleFavSurah(t.surahId);
    syncExpanded();
    toast(isFavSurah(t.surahId) ? t("fav.added") : t("fav.removed"));
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
    toast(isFavSurah(Number(d.sid)) ? t("fav.added") : t("fav.removed"));
    render();
  },
  "menu-playlist"(el) {
    const d = el.dataset;
    closeDropdown();
    playlistPickerSheet(buildTrack(d.rid, Number(d.sid)));
  },
  "menu-download"(el) { downloadOffline(el.dataset.rid, Number(el.dataset.sid)); },
  "menu-share"(el) {
    const d = el.dataset;
    const s = getSurah(Number(d.sid));
    closeDropdown();
    if (navigator.share) navigator.share({ title: s.name, text: `${s.name} — ${s.nameAr}` }).catch(() => {});
    else navigator.clipboard?.writeText(`Sakina — ${s.name} (${s.nameAr})`).then(() => toast(t("toast.copied"))).catch(() => {});
  },
  "add-to-playlist"(el) {
    const d = el.dataset;
    addToPlaylist(Number(d.pl), d.rid, Number(d.sid));
    closeSheets();
  },
  "surah-unavailable"(el) {
    const d = el.dataset;
    const rec = getReciter(d.rid);
    const n = rec ? availableSurahCount(rec) : 0;
    toast(t("rec.notAvailToast", { name: recName(rec), n }), "info");
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
    toast(isFavReciter(d.rid) ? t("fav.addedRec") : t("fav.removedRec"));
  },
  "download"(el) { downloadOffline(el.dataset.rid, Number(el.dataset.sid)); },
  "read-surah"(el) {
    const d = el.dataset;
    navigate(`read/${d.sid}?rec=${d.rid}`);
  },
  "resume"() {
    const lp = Store.get("lastPlayed", null);
    if (!lp) return;
    const tr = buildTrack(lp.reciterId, lp.surahId);
    if (!tr) return toast(t("toast.recUnavailable"), "err");
    App.engine.loadTrack(tr, { autoplay: true, position: lp.position > 3 && lp.position < 0.99 * (App.engine.state.duration || 1e9) ? lp.position : 0, queue: queueForReciter(lp.reciterId) });
    renderMiniPlayer();
    toast(t("toast.resumed", { name: tr.surahName }));
  },
  "verse-tap"(el) {
    const d = el.dataset;
    seekToVerse(Number(d.ay));
  },
  "playlist-play"(el) {
    const idx = Number(el.dataset.idx);
    const playlists = Store.get("playlists", []);
    const pl = playlists[idx];
    if (!pl || !pl.tracks.length) return toast(t("pls.empty"), "info");
    const q = pl.tracks.map((tr) => buildTrack(tr.reciterId, tr.surahId)).filter(Boolean);
    if (!q.length) return toast(t("toast.recUnavailable"), "err");
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
    toast(t("pls.deleted"));
    navigate("playlists");
  },
  "new-playlist"() { newPlaylistSheet(); },
  "create-playlist"() {
    const input = $("#newpl-name");
    const name = (input?.value || "").trim();
    if (!name) return toast(t("sh.giveName"), "err");
    const playlists = Store.get("playlists", []);
    playlists.unshift({ id: "pl" + Date.now(), name, createdAt: Date.now(), tracks: [] });
    Store.set("playlists", playlists);
    closeSheets();
    render();
    toast(t("sh.playlistCreated"));
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
  "lang-set"(el) {
    const lang = el.dataset.lang;
    const s = Store.get("settings", {});
    s.lang = lang;
    Store.set("settings", s);
    setLang(lang);
    renderChrome();
    render();
    toast(lang === "ar" ? "تم التبديل إلى العربية" : "Switched to English");
  },
  "accent-set"(el) {
    const s = Store.get("settings", {});
    s.accent = el.dataset.accent;
    Store.set("settings", s);
    document.documentElement.dataset.accent = s.accent;
    render();
  },
  "clear-data"() {
    if (confirm(t("set.clearConfirm"))) {
      ["sakina.v1.favorites", "sakina.v1.playlists", "sakina.v1.settings", "sakina.v1.lastPlayed", "sakina.v1.recent", "sakina.v1.recentReciters", "sakina.v1.repeat", "sakina.v1.shuffle"].forEach((k) => localStorage.removeItem(k));
      location.reload();
    }
  },
  "ambient-off"() { App.ambient.start("off"); updateAmbientVisuals("off"); },
  "show-verses"() { openVerses(); },
  "toggle-verses"() {
    if (App.versesOpen) closeVerses(); else openVerses();
  },
  "close-verses"() { closeVerses(); },
  "verses-lang"(el) {
    App.versesShowTranslation = el.dataset.mode === "both";
    renderVersesPanel();
  },
  "player-more"(el) {
    const t = App.engine.state.track;
    if (!t) return;
    const rect = el.getBoundingClientRect();
    openDropdown([
      { act: "sleep-sheet", icon: "moon", label: "Sleep timer" },
      { act: "queue-sheet", icon: "queue", label: "Up next" },
      { act: "menu-download", icon: "download", label: "Download", data: `data-rid="${t.reciterId}" data-sid="${t.surahId}"` },
      { act: "menu-share", icon: "share", label: "Share", data: `data-sid="${t.surahId}"` },
    ], rect.right - 200, rect.bottom + 6);
  },
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
    toast(r?.unavailable ? t("toast.noFake", { name: r.name }) : t("toast.recUnavailable"), "err");
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
          <h1 class="page-title">${t(new Date().getHours() < 12 ? "home.greeting.am" : "home.greeting.pm")}</h1>
          <p class="page-sub">${fmtWeekday(new Date())}</p>
        </div>
        <button class="icon-btn" data-act="nav" data-nav="settings" aria-label="Settings">${icon("gear", 20)}</button>
      </header>

      ${lpTrack ? `
      <section class="continue-card glass" data-act="resume" role="button">
        <div class="continue-art">${avatarImg(getReciter(lpTrack.reciterId), 64)}</div>
        <div class="continue-meta">
          <div class="continue-kicker">${t("home.continue")}</div>
          <div class="continue-title">${esc(lpTrack.surahName)}</div>
          <div class="continue-sub">${esc(recName(getReciter(lpTrack.reciterId)))} · ${timeAgo(lp.updatedAt)}</div>
        </div>
        <span class="pill pill-primary continue-btn">${icon("play", 16)}<span>${t("home.resume")}</span></span>
      </section>` : ""}

      <section class="home-section">
        <div class="section-head"><h2>${t("home.featured")}</h2><button class="text-btn" data-act="nav" data-nav="reciters">${t("home.seeall")}</button></div>
        <div class="reciter-scroll">
          ${featured.map((r) => `
            <button class="reciter-card" data-act="nav" data-nav="reciter/${r.id}">
              ${avatarImg(r, 96)}
              <span class="reciter-card-name">${esc(recName(r))}</span>
              <span class="reciter-card-sub">${getLang() === "ar" ? esc(r.countryAr || "") : esc(r.country)}</span>
            </button>`).join("")}
        </div>
      </section>

      <section class="home-section">
        <div class="section-head"><h2>${t("home.popular")}</h2><button class="text-btn" data-act="nav" data-nav="search">${t("nav.search")}</button></div>
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
        <div class="section-head"><h2>${t("home.recent")}</h2></div>
        <div class="recent-list">
          ${recent.map(({ track, at }) => `
            <button class="recent-row" data-act="play-surah" data-rid="${track.reciterId}" data-sid="${track.surahId}">
              ${avatarImg(getReciter(track.reciterId), 44)}
              <span class="recent-meta"><span class="recent-name">${esc(track.surahName)}</span><span class="recent-sub">${esc(recName(getReciter(track.reciterId)))} · ${timeAgo(at)}</span></span>
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
        <h1 class="page-title">${t("rec.title")}</h1>
        <p class="page-sub">${t("rec.sub")}</p>
      </header>
      <div class="reciters-grid">
        ${RECITERS.map((r) => `
          <button class="reciter-tile" data-act="nav" data-nav="reciter/${r.id}">
            ${avatarImg(r, 112)}
            <span class="reciter-tile-name">${esc(recName(r))}</span>
            <span class="reciter-tile-sub">${getLang() === "ar" ? esc(r.countryAr || "") : esc(r.country)}${r.years ? " · " + r.years : ""}</span>
            ${r.unavailable ? `<span class="reciter-tile-tag">${t("rec.selected")}</span>` : availableSurahCount(r) < 114 ? `<span class="reciter-tile-tag">${t("rec.count", { n: availableSurahCount(r) })}</span>` : `<span class="reciter-tile-tag">${t("rec.114")}</span>`}
          </button>`).join("")}
      </div>
    </div>`;
}

/* ---------- RECITER PROFILE ---------- */
function screenReciter(id) {
  const r = getReciter(id);
  if (!r) return `<div class="screen"><div class="empty">${t("rec.notFound")}</div></div>`;
  const fav = isFavReciter(id);
  return `
    <div class="screen">
      <button class="back-btn" data-act="nav" data-nav="reciters">${icon("arrowLeft", 18)}<span>${t("nav.reciters")}</span></button>

      <header class="profile-head">
        ${avatarImg(r, 140)}
        <div class="profile-meta">
          <h1 class="profile-name">${esc(recName(r))}</h1>
          <div class="profile-loc">${icon("radio", 13)}<span>${esc(recLoc(r))}</span></div>
          <div class="profile-status ${r.years ? "muted" : "live"}"><span class="dot"></span>${r.years ? esc(r.years) : t("rec.recitingToday")}</div>
          <p class="profile-bio">${esc(recBio(r))}</p>
          <div class="profile-actions">
            <button class="pill ${fav ? "on" : ""}" data-act="fav-reciter" data-rid="${r.id}">${icon("heart", 17)}<span>${fav ? t("rec.favorited") : t("rec.favorite")}</span></button>
            <button class="pill" data-act="play-reciter" data-rid="${r.id}">${icon("shuffle", 16)}<span>${t("rec.shuffle")}</span></button>
            <button class="pill pill-primary" data-act="play-surah" data-rid="${r.id}" data-sid="1">${icon("play", 16)}<span>${r.unavailable || !localFatihahFor(r) ? t("rec.unavailable") : t("rec.play")}</span></button>
          </div>
        </div>
      </header>

      <div class="profile-count">${r.unavailable ? t("rec.noMushaf") : t("rec.count", { n: availableSurahCount(r) })}</div>

      <div class="search-field">
        ${icon("search", 17)}
        <input id="surah-search" type="text" placeholder="${t("rec.search")}" autocomplete="off" />
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
  if (!rows.length) return `<div class="empty">${t("rec.noMatch", { q })}</div>`;
  return rows.map((s) => {
    const hasAudio = audioUrlFor(reciter, s.id) !== null || (s.id === 1 && localFatihahFor(reciter));
    if (!hasAudio) {
      return `
      <div class="surah-row unavailable" data-act="surah-unavailable" data-rid="${reciter.id}" data-sid="${s.id}" role="button" tabindex="0" title="${t("rec.unavailable")}">
        <span class="surah-badge">${s.id}</span>
        <span class="surah-names">
          <span class="surah-en">${esc(s.name)}</span>
          <span class="surah-sub">${t("rec.unavailable")}</span>
        </span>
        <span class="surah-ar" dir="rtl">${s.nameAr}</span>
        <span class="surah-actions" >
          <button class="icon-btn" data-act="read-surah" data-rid="${reciter.id}" data-sid="${s.id}" title="${t("rec.read")}">${icon("book", 18)}</button>
        </span>
      </div>`;
    }
    return `
    <div class="surah-row" data-act="play-surah" data-rid="${reciter.id}" data-sid="${s.id}" role="button" tabindex="0">
      <span class="surah-badge">${s.id}</span>
      <span class="surah-names">
        <span class="surah-en">${esc(s.name)}</span>
        <span class="surah-sub">${t(s.place === "makkah" ? "rec.makki" : "rec.madani")} · ${t("rec.verses", { n: s.ayahs })}</span>
      </span>
      <span class="surah-ar" dir="rtl">${s.nameAr}</span>
      <span class="surah-actions" >
        <button class="icon-btn" data-act="read-surah" data-rid="${reciter.id}" data-sid="${s.id}" title="${t("rec.read")}">${icon("book", 18)}</button>
        <button class="icon-btn" data-act="download" data-rid="${reciter.id}" data-sid="${s.id}" title="${t("rec.download")}">${icon("download", 18)}</button>
        <button class="icon-btn" data-act="row-menu" data-rid="${reciter.id}" data-sid="${s.id}" title="${t("rec.more")}">${icon("more", 18)}</button>
      </span>
    </div>`;
  }).join("");
}

function bindReciter(id) {
  const input = $("#surah-search");
  const list = $("#surah-list");
  const reciter = getReciter(id);
  if (!input || !list || !reciter) return;
  const apply = () => { list.innerHTML = surahRows(reciter, input.value); decorateOfflineRows(list); };
  decorateOfflineRows(list);
  input.addEventListener("input", apply);
  $("#surah-search-clear")?.addEventListener("click", () => { input.value = ""; $("#surah-search-clear").hidden = true; apply(); });
  input.addEventListener("keyup", () => { $("#surah-search-clear").hidden = !input.value; });
}

/* ---------- READING MODE ---------- */
function screenRead(surahId, params) {
  const s = getSurah(Number(surahId));
  if (!s) return `<div class="screen"><div class="empty">${t("read.notFound")}</div></div>`;
  const reciterId = params.rec || App.defaultReciterId();
  App.readingSurahId = s.id;

  return `
    <div class="screen read-screen">
      <div class="read-glow"></div>
      <header class="read-head">
        <button class="back-btn" data-act="nav" data-nav="reciter/${reciterId}">${icon("arrowLeft", 18)}<span>${esc(getReciter(reciterId)?.name || "")}</span></button>
        <div class="read-title-block">
          <h1 class="read-title" dir="rtl">${s.nameAr}</h1>
          <p class="read-sub">${esc(s.name)} — ${esc(s.transName)} · ${t(s.place === "makkah" ? "rec.makki" : "rec.madani")} · ${t("rec.verses", { n: s.ayahs })}</p>
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
          <div class="verses-loading">${icon("spinner", 22)}<span>${t("pv.loading")}</span></div>
        </div>
      </div>
    </div>`;
}

function readingPlayerHTML() {
  const st = App.engine.state;
  const tr = st.track;
  const reciter = tr ? getReciter(tr.reciterId) : null;
  const pct = st.duration ? (st.position / st.duration) * 100 : 0;
  return `
    <div class="rp-head">
      ${tr ? avatarImg(reciter, 64) : `<div class="avatar avatar-placeholder" style="width:64px;height:64px"><span>${icon("music", 22)}</span></div>`}
      <div class="rp-meta">
        <div class="rp-title">${t ? esc(t.surahName) : esc(t("pl.nothing"))}</div>
        <div class="rp-sub">${t ? esc(recName(getReciter(t.reciterId))) : t("pl.choose")}</div>
      </div>
      <button class="icon-btn heart ${isFavSurah(t?.surahId) ? "on" : ""}" data-act="fav-track" title="${t("fav.added")}">${icon("heart", 19)}</button>
    </div>
    <div class="rp-controls">
      <button class="ctl-pill" data-act="speed-cycle">${icon("speed", 15)}<span>${st.speed}x</span></button>
      <button class="ctl-btn" data-act="prev">${icon("prev", 22)}</button>
      <button class="ctl-btn ctl-play ${st.buffering ? "buffering" : ""}" data-act="toggle">${st.buffering ? icon("spinner", 22) : st.playing ? icon("pause", 22) : icon("play", 22)}</button>
      <button class="ctl-btn" data-act="next">${icon("next", 22)}</button>
      <button class="ctl-pill ${App.engine.sleep ? "active" : ""}" data-act="sleep-sheet">${icon("moon", 15)}<span>${t("pl.sleep")}</span></button>
    </div>
    <div class="rp-progress">${progressHTML()}</div>
    <div class="rp-foot">
      <button class="pill pill-ambient" data-act="ambient-sheet">${icon("waves", 15)}<span>${t("pl.bgVol")}</span></button>
      <button class="icon-btn" data-act="expand-player" title="Expand">${icon("chevronDown", 18)}</button>
    </div>`;
}

async function renderVerses(surahId) {
  const host = $("#verses");
  if (!host) return;
  if (!(await ensureQuranData())) {
    host.innerHTML = `<div class="empty">${t("pv.loadErr")}</div>`;
    return;
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
  const active = await computeActiveAyah(surahId, st.position || 0, st.duration || 0);
  if (active !== App.activeVerse) {
    App.activeVerse = active;
    $$(".verse").forEach((v) => v.classList.toggle("verse-active", Number(v.dataset.ay) === active));
    scrollToActiveVerse();
  }
}

async function seekToVerse(ayah) {
  const st = App.engine.state;
  let surahId = App.readingSurahId;
  let reciterId = st.track ? st.track.reciterId : App.defaultReciterId();
  if (App.versesOpen && st.track) { surahId = st.track.surahId; reciterId = st.track.reciterId; }
  if (!surahId) return;

  // If the reader is open on a different surah than the one playing,
  // switch the player to the surah being read (explicit surahId mapping),
  // then seek to the tapped verse once its duration is known.
  if (!st.track || st.track.surahId !== surahId) {
    const t = buildTrack(reciterId, surahId);
    if (!t) return toast(t("toast.recUnavailable"), "err");
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
  const starts = estimateVerseStarts(surahId, App.engine.state.duration || 0);
  if (!starts) return 0;
  return starts[Math.min(ayah, starts.length - 1)] || 0;
}

function bindRead(surahId) {
  renderVerses(surahId);
}

/* ---------- SEARCH ---------- */
function screenSearch() {
  return `
    <div class="screen">
      <header class="page-head">
        <h1 class="page-title">${t("sr.title")}</h1>
        <p class="page-sub">${t("sr.sub")}</p>
      </header>
      <div class="search-field big">
        ${icon("search", 18)}
        <input id="global-search" type="text" placeholder="${t("sr.placeholder")}" autocomplete="off" autofocus />
        <button class="search-clear" id="global-search-clear" hidden>${icon("x", 15)}</button>
      </div>
      <div id="search-results"></div>
    </div>`;
}

function searchResults(q) {
  const needle = q.trim().toLowerCase();
  if (!needle) {
    return `<div class="empty">${t("sr.hint")}</div>`;
  }
  const recs = RECITERS.filter((r) => r.name.toLowerCase().includes(needle) || r.nameAr.includes(q.trim()) || r.country.toLowerCase().includes(needle));
  const surahs = getSurahs().filter((s) => s.name.toLowerCase().includes(needle) || s.nameAr.includes(q.trim()) || s.transName.toLowerCase().includes(needle));
  let html = "";
  if (recs.length) {
    html += `<section class="home-section"><div class="section-head"><h2>${t("fav.reciters")}</h2></div><div class="reciter-scroll">` +
      recs.map((r) => `<button class="reciter-card" data-act="nav" data-nav="reciter/${r.id}">${avatarImg(r, 80)}<span class="reciter-card-name">${esc(recName(r))}</span><span class="reciter-card-sub">${getLang() === "ar" ? esc(r.countryAr || "") : esc(r.country)}</span></button>`).join("") +
      `</div></section>`;
  }
  if (surahs.length) {
    const rid = App.defaultReciterId();
    html += `<section class="home-section"><div class="section-head"><h2>${t("fav.surahs")}</h2><span class="page-sub">${t("sr.playedBy", { name: esc(getReciter(rid)?.name || "") })}</span></div><div class="surah-chips">` +
      surahs.map((s) => `<button class="chip-card" data-act="play-surah" data-rid="${rid}" data-sid="${s.id}"><span class="chip-num">${s.id}</span><span class="chip-name">${esc(s.name)}</span><span class="chip-ar" dir="rtl">${s.nameAr}</span></button>`).join("") +
      `</div></section>`;
  }
  if (!html) html = `<div class="empty">${t("sr.none", { q: esc(q) })}</div>`;
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
        <h1 class="page-title">${t("pls.title")}</h1>
        <p class="page-sub">${t("pls.sub")}</p>
      </header>
      <div class="playlists-grid">
        <button class="playlist-card new" data-act="new-playlist">
          <span class="pl-plus">${icon("plus", 22)}</span>
          <span class="pl-name">${t("pls.new")}</span>
        </button>
        ${playlists.map((p, i) => {
          const firsts = p.tracks.slice(0, 2).map((t) => getReciter(t.reciterId));
          const arts = firsts.length ? firsts.map((r) => avatarImg(r, 56)).join("") : `<div class="pl-art-empty">${icon("music", 24)}</div>`;
          return `
          <button class="playlist-card" data-act="nav" data-nav="playlist/${encodeURIComponent(p.id)}">
            <div class="pl-art">${arts}</div>
            <span class="pl-name">${esc(p.name)}</span>
            <span class="pl-sub">${t(p.tracks.length === 1 ? "pls.track" : "pls.tracks", { n: p.tracks.length })}</span>
          </button>`;
        }).join("")}
      </div>
    </div>`;
}

function screenPlaylistDetail(id) {
  const playlists = Store.get("playlists", []);
  const idx = playlists.findIndex((p) => p.id === id);
  if (idx < 0) return `<div class="screen"><div class="empty">${t("pls.notFound")}</div></div>`;
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
          <p class="page-sub">${t(p.tracks.length === 1 ? "pls.track" : "pls.tracks", { n: p.tracks.length })} · ${t("pls.created", { d: new Date(p.createdAt).toLocaleDateString() })}</p>
          <div class="profile-actions">
            <button class="pill pill-primary" data-act="playlist-play" data-idx="${idx}">${icon("play", 16)}<span>${t("pls.playAll")}</span></button>
            <button class="pill" data-act="playlist-play-shuffle" data-idx="${idx}">${icon("shuffle", 16)}<span>${t("rec.shuffle")}</span></button>
            <button class="pill danger-ghost" data-act="playlist-delete" data-idx="${idx}">${icon("trash", 16)}<span>${t("pls.delete")}</span></button>
          </div>
        </div>
      </header>
      <div class="surah-list">
        ${tracks.length ? tracks.map(({ tr, rec, ti }) => `
          <div class="surah-row" data-act="play-surah" data-rid="${tr.reciterId}" data-sid="${tr.surahId}" role="button" tabindex="0">
            ${avatarImg(rec, 40)}
            <span class="surah-names"><span class="surah-en">${esc(tr.surahName)}</span><span class="surah-sub">${esc(recName(getReciter(tr.reciterId)))}</span></span>
            <span class="surah-ar" dir="rtl">${tr.surahNameAr}</span>
            <span class="surah-actions" >
              <button class="icon-btn" data-act="playlist-remove" data-pl="${idx}" data-ti="${ti}" title="Remove">${icon("x", 17)}</button>
            </span>
          </div>`).join("") : `<div class="empty">${t("pls.empty")}</div>`}
      </div>
    </div>`;
}

function newPlaylistSheet() {
  openSheet({
    title: t("sh.newPlaylist"),
    body: `
      <div class="search-field"><input id="newpl-name" type="text" placeholder="${t("sh.playlistName")}" maxlength="40" /></div>
      <div class="sheet-actions">
        <button class="pill pill-primary" data-act="create-playlist">${icon("plus", 16)}<span>${t("sh.create")}</span></button>
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
      <header class="page-head"><h1 class="page-title">${t("fav.title")}</h1><p class="page-sub">${t("fav.sub")}</p></header>
      ${reciters.length ? `<section class="home-section"><div class="section-head"><h2>${t("fav.reciters")}</h2></div><div class="reciter-scroll">` +
        reciters.map((r) => `<button class="reciter-card" data-act="nav" data-nav="reciter/${r.id}">${avatarImg(r, 84)}<span class="reciter-card-name">${esc(recName(r))}</span><span class="reciter-card-sub">${getLang() === "ar" ? esc(r.countryAr || "") : esc(r.country)}</span></button>`).join("") +
        `</div></section>` : ""}
      ${surahs.length ? `<section class="home-section"><div class="section-head"><h2>${t("fav.surahs")}</h2><span class="page-sub">${t("sr.playedBy", { name: esc(getReciter(rid)?.name || "") })}</span></div><div class="surah-list">` +
        surahs.map((s) => `
          <div class="surah-row" data-act="play-surah" data-rid="${rid}" data-sid="${s.id}" role="button" tabindex="0">
            <span class="surah-badge">${s.id}</span>
            <span class="surah-names"><span class="surah-en">${esc(s.name)}</span><span class="surah-sub">${t(s.place === "makkah" ? "rec.makki" : "rec.madani")} · ${t("rec.verses", { n: s.ayahs })}</span></span>
            <span class="surah-ar" dir="rtl">${s.nameAr}</span>
            <span class="surah-actions" >
              <button class="icon-btn" data-act="read-surah" data-rid="${rid}" data-sid="${s.id}" title="Read">${icon("book", 18)}</button>
              <button class="icon-btn" data-act="menu-fav" data-sid="${s.id}" title="Remove">${icon("heart", 18)}</button>
            </span>
          </div>`).join("") + `</div></section>` : ""}
      ${!reciters.length && !surahs.length ? `<div class="empty">${icon("heart", 30)}<span>${t("fav.empty")}</span></div>` : ""}
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
      <header class="page-head"><h1 class="page-title">${t("set.title")}</h1><p class="page-sub">${t("set.sub")}</p></header>

      <section class="settings-section">
        <h3>${t("set.language")}</h3>
        <div class="setting-row">
          <div class="setting-label">${icon("info", 18)}<div><div class="sl-name">${t("set.language")}</div><div class="sl-sub">${t("set.langSub")}</div></div></div>
          <div class="seg">
            <button class="seg-btn ${getLang() === "en" ? "on" : ""}" data-act="lang-set" data-lang="en">English</button>
            <button class="seg-btn ${getLang() === "ar" ? "on" : ""}" data-act="lang-set" data-lang="ar">العربية</button>
          </div>
        </div>
      </section>

      <section class="settings-section">
        <h3>${t("set.playback")}</h3>
        <div class="setting-row">
          <div class="setting-label">${icon("speed", 18)}<div><div class="sl-name">${t("set.speed")}</div><div class="sl-sub">${t("set.speedSub")}</div></div></div>
          <div class="seg" data-key="speed">
            ${[0.75, 1, 1.25, 1.5, 2].map((v) => `<button class="seg-btn ${s.speed === v ? "on" : ""}" data-act="speed-set" data-v="${v}">${v}x</button>`).join("")}
          </div>
        </div>
        <div class="setting-row">
          <div class="setting-label">${icon("next", 18)}<div><div class="sl-name">${t("set.autoAdvance")}</div><div class="sl-sub">${t("set.autoAdvanceSub")}</div></div></div>
          <label class="switch"><input type="checkbox" data-act="toggle-setting" data-key="autoAdvance" ${s.autoAdvance ? "checked" : ""} /><span class="track"></span></label>
        </div>
      </section>

      <section class="settings-section">
        <h3>${t("set.reading")}</h3>
        <div class="setting-row">
          <div class="setting-label">${icon("book", 18)}<div><div class="sl-name">${t("set.fontSize")}</div><div class="sl-sub" id="fsize-label">${s.arabicFontSize}px</div></div></div>
          <input type="range" class="slider" min="22" max="44" step="1" value="${s.arabicFontSize}" data-act="fsize" style="--fill:${((s.arabicFontSize - 22) / 22) * 100}%" />
        </div>
        <div class="setting-row">
          <div class="setting-label">${icon("book", 18)}<div><div class="sl-name">${t("set.translation")}</div><div class="sl-sub">${t("set.translationSub")}</div></div></div>
          <label class="switch"><input type="checkbox" data-act="toggle-setting" data-key="showTranslation" ${s.showTranslation ? "checked" : ""} /><span class="track"></span></label>
        </div>
        <div class="setting-row">
          <div class="setting-label">${icon("info", 18)}<div><div class="sl-name">${t("set.verseNumbers")}</div><div class="sl-sub">${t("set.verseNumbersSub")}</div></div></div>
          <label class="switch"><input type="checkbox" data-act="toggle-setting" data-key="showVerseNumbers" ${s.showVerseNumbers ? "checked" : ""} /><span class="track"></span></label>
        </div>
      </section>

      <section class="settings-section">
        <h3>${t("set.audio")}</h3>
        <div class="setting-row">
          <div class="setting-label">${icon("volume", 18)}<div><div class="sl-name">${t("set.quranVol")}</div><div class="sl-sub">${t("set.quranVolSub")}</div></div></div>
          <input type="range" class="slider" min="0" max="1" step="0.01" value="${App.engine.audio.volume}" data-act="qvol" style="--fill:${App.engine.audio.volume * 100}%" />
        </div>
        <div class="setting-row">
          <div class="setting-label">${icon("droplet", 18)}<div><div class="sl-name">${t("set.bgVol")}</div><div class="sl-sub">${t("set.bgVolSub")}</div></div></div>
          <input type="range" class="slider" min="0" max="1" step="0.01" value="${amb.volume}" data-act="bvol" style="--fill:${amb.volume * 100}%" />
        </div>
      </section>

      <section class="settings-section">
        <h3>${t("set.appearance")}</h3>
        <div class="setting-row">
          <div class="setting-label">${icon("droplet", 18)}<div><div class="sl-name">${t("set.accent")}</div><div class="sl-sub">${t("set.accentSub")}</div></div></div>
          <div class="accent-row">
            ${accents.map((a) => `<button class="accent-dot ${s.accent === a.id ? "on" : ""}" data-act="accent-set" data-accent="${a.id}" style="--c:${a.c}" title="${a.name}" aria-label="${a.name}"></button>`).join("")}
          </div>
        </div>
      </section>

      <section class="settings-section">
        <h3>${t("set.data")}</h3>
        <div class="about-card glass">
          <div class="about-title">${t("set.aboutTitle")}</div>
          <ul class="about-list">
            <li>${t("set.about1")}</li>
            <li>${t("set.about2")}</li>
            <li>${t("set.about3")}</li>
            <li>${t("set.about4")}</li>
            <li>${t("set.about5")}</li>
          </ul>
        </div>
        <div class="setting-row">
          <div class="setting-label">${icon("trash", 18)}<div><div class="sl-name">${t("set.clear")}</div><div class="sl-sub">${t("set.clearSub")}</div></div></div>
          <button class="pill danger-ghost" data-act="clear-data">${icon("trash", 16)}<span>${t("set.clearBtn")}</span></button>
        </div>
        <p class="version">${t("set.version")}</p>
      </section>
    </div>`;
}

function bindSettings() {}

/* ============================ favorites helpers ============================ */

export function recName(r) { return getLang() === "ar" && r?.nameAr ? r.nameAr : (r?.name || ""); }
export function recLoc(r) { return getLang() === "ar" ? (r?.cityAr || r?.city || "") + " · " + (r?.countryAr || r?.country || "") : (r?.city || "") + " · " + (r?.country || ""); }
export function recBio(r) { return getLang() === "ar" ? (r?.bioAr || r?.bio || "") : (r?.bio || ""); }

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

let _downloading = new Set();

async function downloadOffline(reciterId, surahId) {
  const tr = buildTrack(reciterId, surahId);
  if (!tr) return toast(t("toast.recUnavailable"), "err");
  if (!isOfflineSupported()) return toast(t("toast.noOfflineSupport"), "err");
  const key = `${reciterId}:${surahId}`;
  if (_downloading.has(key)) return;
  const existing = await OfflineStore.get(reciterId, surahId);
  if (existing) {
    await OfflineStore.remove(reciterId, surahId);
    toast(t("toast.downloadRemoved", { name: tr.surahName }), "info");
    render();
    return;
  }
  _downloading.add(key);
  toast(t("toast.downloadStart", { name: tr.surahName }), "info");
  const okSaved = await OfflineStore.downloadTrack(tr, (p) => {
    const pct = Math.round(p * 100);
    const toasts = document.querySelectorAll(".toast");
    const el = toasts[toasts.length - 1]?.querySelector("div");
    if (el) el.textContent = t("toast.downloadProgress", { name: tr.surahName, p: pct });
  });
  _downloading.delete(key);
  if (okSaved) {
    toast(t("toast.downloadSaved", { name: tr.surahName }));
    render();
  } else {
    toast(t("toast.downloadFail"), "err");
  }
}

function isOfflineSupported() {
  return typeof indexedDB !== "undefined";
}

/** mark rows of stored tracks with an offline badge */
export async function decorateOfflineRows(root) {
  const rows = (root || document).querySelectorAll("[data-rid][data-sid]");
  if (!rows.length) return;
  const stored = await OfflineStore.list();
  const keys = new Set(stored.map((s) => `${s.meta?.reciterName ? "" : ""}${s.key}`));
  rows.forEach((r) => {
    const k = `${r.dataset.rid}:${r.dataset.sid}`;
    let badge = r.querySelector(".offline-badge");
    if (keys.has(k)) {
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "offline-badge";
        badge.title = "Available offline";
        badge.textContent = "●";
        (r.querySelector(".surah-actions") || r).appendChild(badge);
      }
    } else if (badge) badge.remove();
  });
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
    if (App.versesOpen) renderVersesPanel();
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
    if (App.versesOpen) { syncPlayerVerses(false); refreshVersesMini(); }
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
      if (App.versesOpen) closeVerses();
      else if ($$(".sheet-wrap.open").length) closeSheets();
      else if ($("#dropdowns").children.length) closeDropdown();
      else closeExpanded();
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
