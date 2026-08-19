/* ============================================================
   SAKINA — Audio engine
   ------------------------------------------------------------
   Playback state ALWAYS holds the full track:
     { reciterId, reciterName, surahId, surahName, audioUrl, photo }
   Switching surahs is a strict sequence:
     pause → clear src → new track → position 0 → metadata → play
   The engine never carries a stale audioUrl across tracks.
   ============================================================ */

import { validateTrack, Store, getReciter, getSurah } from "./data.js";
import { OfflineStore } from "./offline.js";

export const REPEAT = { OFF: "off", ALL: "all", ONE: "one" };

export class AudioEngine {
  constructor(el) {
    this.audio = el;
    this.state = {
      track: null,
      playing: false,
      position: 0,
      duration: 0,
      buffering: false,
      speed: Store.get("settings", {}).speed || 1,
      repeat: Store.get("repeat", REPEAT.OFF),
      shuffle: Store.get("shuffle", false),
      queue: [],
      queueIndex: -1,
      error: null,
    };
    this._listeners = {};
    this.sleep = null; // { mode, endsAt } or { mode:'end' }
    this._bound = this._bindEvents();
    this.audio.playbackRate = this.state.speed;
    this.audio.preload = "auto";
    this.audio.volume = Store.get("settings", {}).quranVolume ?? 0.9;
  }

  on(ev, fn) { (this._listeners[ev] = this._listeners[ev] || []).push(fn); return this; }
  once(ev, fn) {
    const wrap = (p) => { this.off(ev, wrap); fn(p); };
    this.on(ev, wrap);
    return this;
  }
  off(ev, fn) {
    this._listeners[ev] = (this._listeners[ev] || []).filter((f) => f !== fn);
  }
  emit(ev, payload) {
    (this._listeners[ev] || []).forEach((fn) => { try { fn(payload); } catch (e) { console.error(e); } });
  }

  _bindEvents() {
    const a = this.audio;
    a.addEventListener("timeupdate", () => {
      this.state.position = a.currentTime || 0;
      this.emit("time", this.state.position);
    });
    a.addEventListener("loadedmetadata", () => {
      this.state.duration = a.duration || 0;
      this.emit("duration", this.state.duration);
    });
    a.addEventListener("durationchange", () => {
      this.state.duration = a.duration || 0;
      this.emit("duration", this.state.duration);
    });
    a.addEventListener("waiting", () => { this.state.buffering = true; this.emit("buffering", true); });
    a.addEventListener("playing", () => {
      this.state.buffering = false;
      this.emit("buffering", false);
    });
    a.addEventListener("canplay", () => {
      this.state.buffering = false;
      this.emit("buffering", false);
    });
    a.addEventListener("play", () => {
      this.state.playing = true;
      this.state.error = null;
      this.emit("playstate", true);
      this._touchMediaSession();
    });
    a.addEventListener("pause", () => {
      this.state.playing = false;
      this.emit("playstate", false);
      this._persistLastPlayed();
    });
    a.addEventListener("ended", () => this._onEnded());
    a.addEventListener("error", () => {
      const code = a.error ? a.error.code : -1;
      if (!this.state.track) return;
      this.state.error = code;
      this.state.playing = false;
      this.emit("error", { code, track: this.state.track });
    });
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      const ms = navigator.mediaSession;
      try {
        ms.setActionHandler("play", () => this.play());
        ms.setActionHandler("pause", () => this.pause());
        ms.setActionHandler("previoustrack", () => this.prev());
        ms.setActionHandler("nexttrack", () => this.next());
        ms.setActionHandler("seekto", (d) => { if (d.seekTime != null) this.seek(d.seekTime); });
      } catch {}
    }
  }

  /* ---------- loading a track (the strict sequence) ---------- */

  async loadTrack(track, { autoplay = true, position = 0, queue = null } = {}) {
    const problems = validateTrack(track);
    if (problems.length) {
      console.error("[engine] refusing invalid track", problems, track);
      this.emit("error", { validation: problems, track });
      return false;
    }
    const prev = this.state.track;
    const sameTrack = prev && prev.reciterId === track.reciterId && prev.surahId === track.surahId && prev.audioUrl === track.audioUrl;

    // 1. stop previous audio entirely
    const a = this.audio;
    try { a.pause(); } catch {}
    a.removeAttribute("src");
    try { a.load(); } catch {}

    // 2. new track state
    this.state.track = { ...track };
    this.state.position = 0;
    this.state.duration = 0;
    this.state.error = null;
    this.state.playing = false;

    // 3. queue context
    if (queue) {
      this.state.queue = queue;
      this.state.queueIndex = Math.max(0, queue.findIndex((t) => t.surahId === track.surahId && t.reciterId === track.reciterId));
      if (this.state.queueIndex < 0) this.state.queueIndex = 0;
    } else if (!sameTrack) {
      this.state.queue = [track];
      this.state.queueIndex = 0;
    }

    // 4. set the new source — prefer an offline copy when available
    const offline = await OfflineStore.get(track.reciterId, track.surahId);
    if (offline && offline.blob) {
      if (this._objURL) { try { URL.revokeObjectURL(this._objURL); } catch {} }
      this._objURL = URL.createObjectURL(offline.blob);
      a.src = this._objURL;
      this.state.offline = true;
    } else {
      a.src = track.audioUrl;
      this.state.offline = false;
    }
    a.playbackRate = this.state.speed;

    // 5. reset position to the requested point (default 0 — never carry over the previous surah's position)
    try { a.currentTime = 0; } catch {}
    this.state.position = 0;
    if (position > 0) {
      try { a.currentTime = position; } catch {}
      this.state.position = position;
    }

    // 6. start
    if (autoplay) {
      const p = a.play();
      if (p && p.catch) p.catch(() => {
        // autoplay policy — retry on next explicit gesture
        this.state.playing = false;
        this.emit("playstate", false);
      });
    }

    this.emit("trackchange", { track: this.state.track, same: sameTrack });
    this._updateMediaSession(track);
    this._remember(track);
    return true;
  }

  /** Re-load the same track at a position (resume). */
  resumeTrack(track, position) {
    return this.loadTrack(track, { autoplay: true, position, queue: this.state.queue });
  }

  play() {
    if (!this.state.track) return false;
    if (this.state.error) { this.loadTrack(this.state.track, { autoplay: true, position: this.state.position }); return true; }
    const p = this.audio.play();
    if (p && p.catch) p.catch(() => {});
    return true;
  }

  pause() {
    try { this.audio.pause(); } catch {}
  }

  toggle() {
    if (!this.state.track) return false;
    if (this.state.playing) this.pause();
    else this.play();
    return true;
  }

  seek(t) {
    if (!this.state.track || !isFinite(t)) return;
    try {
      this.audio.currentTime = Math.max(0, Math.min(t, this.state.duration || t));
      this.state.position = this.audio.currentTime;
    } catch {}
  }

  seekBy(delta) {
    this.seek((this.audio.currentTime || 0) + delta);
  }

  setSpeed(s) {
    this.state.speed = s;
    this.audio.playbackRate = s;
    const s2 = Store.get("settings", {});
    s2.speed = s;
    Store.set("settings", s2);
    this.emit("speed", s);
  }

  setRepeat(mode) {
    this.state.repeat = mode;
    Store.set("repeat", mode);
    this.emit("repeat", mode);
  }

  cycleRepeat() {
    const order = [REPEAT.OFF, REPEAT.ALL, REPEAT.ONE];
    this.setRepeat(order[(order.indexOf(this.state.repeat) + 1) % order.length]);
  }

  setShuffle(v) {
    this.state.shuffle = !!v;
    Store.set("shuffle", this.state.shuffle);
    this.emit("shuffle", this.state.shuffle);
  }

  toggleShuffle() { this.setShuffle(!this.state.shuffle); }

  setQuranVolume(v) {
    this.audio.volume = Math.max(0, Math.min(1, v));
    const s2 = Store.get("settings", {});
    s2.quranVolume = this.audio.volume;
    Store.set("settings", s2);
  }

  /* ---------- queue navigation ---------- */

  _step(delta) {
    const q = this.state.queue;
    if (!q.length) return null;
    if (this.state.shuffle && q.length > 2) {
      let i;
      do { i = Math.floor(Math.random() * q.length); } while (i === this.state.queueIndex);
      return q[i];
    }
    let idx = this.state.queueIndex + delta;
    if (idx >= q.length) idx = this.state.repeat === REPEAT.ALL ? 0 : -1;
    if (idx < 0) idx = this.state.repeat === REPEAT.ALL ? q.length - 1 : -1;
    return idx >= 0 ? q[idx] : null;
  }

  next() {
    const t = this._step(1);
    if (t) this.loadTrack(t);
    return !!t;
  }

  prev() {
    const a = this.audio;
    if (a.currentTime > 3) { this.seek(0); return true; }
    const t = this._step(-1);
    if (t) this.loadTrack(t);
    return !!t;
  }

  jumpTo(index) {
    const t = this.state.queue[index];
    if (t) { this.state.queueIndex = index; this.loadTrack(t); }
  }

  _onEnded() {
    // sleep timer: stop at the end of the current surah / queue
    if (this.sleep && this.sleep.mode === "end-surah") {
      const mode = this.sleep.mode;
      this.stopSleep();
      this.pause();
      this.emit("sleepfire", { mode });
      return;
    }
    if (this.sleep && this.sleep.mode === "end-queue") {
      const mode = this.sleep.mode;
      this.stopSleep();
      this.pause();
      this.emit("sleepfire", { mode });
      return;
    }
    if (this.state.repeat === REPEAT.ONE) {
      this.seek(0);
      this.play();
      return;
    }
    const n = this._step(1);
    if (n) { this.loadTrack(n); return; }
    this.state.playing = false;
    this.emit("playstate", false);
    this.emit("queueend");
  }

  /* ---------- sleep timer ---------- */

  startSleep({ mode, minutes = 0 }) {
    this.sleep = { mode, minutes, endsAt: mode === "time" ? Date.now() + minutes * 60000 : null };
    if (mode === "time") {
      clearTimeout(this._sleepTimer);
      this._sleepTimer = setTimeout(() => this._fireSleep(), minutes * 60000);
    }
    this.emit("sleep", this.sleep);
  }

  stopSleep() {
    clearTimeout(this._sleepTimer);
    this.sleep = null;
    this.emit("sleep", null);
  }

  _fireSleep() {
    const mode = this.sleep ? this.sleep.mode : "time";
    if (mode === "end-surah" || mode === "end-queue") return; // handled on ended/queueend
    this.pause();
    this.stopSleep();
    this.emit("sleepfire", { mode: "time" });
  }

  /* ---------- helpers ---------- */

  _persistLastPlayed() {
    if (!this.state.track) return;
    Store.set("lastPlayed", {
      reciterId: this.state.track.reciterId,
      surahId: this.state.track.surahId,
      position: this.audio.currentTime || 0,
      updatedAt: Date.now(),
    });
  }

  _remember(track) {
    const recents = Store.get("recent", []);
    const rec = recents.filter((r) => !(r.reciterId === track.reciterId && r.surahId === track.surahId));
    rec.unshift({ reciterId: track.reciterId, surahId: track.surahId, at: Date.now() });
    Store.set("recent", rec.slice(0, 12));

    const rr = Store.get("recentReciters", []);
    if (!rr.includes(track.reciterId)) Store.set("recentReciters", [track.reciterId, ...rr].slice(0, 8));
  }

  _updateMediaSession(track) {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.surahNameAr ? track.surahName + " · " + track.surahNameAr : track.surahName,
        artist: track.reciterName,
        album: "Sakina — Quran Audio",
        artwork: track.photo ? [{ src: track.photo, sizes: "512x512", type: "image/jpeg" }] : [],
      });
    } catch {}
  }

  _touchMediaSession() {
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      try { navigator.mediaSession.playbackState = this.state.playing ? "playing" : "paused"; } catch {}
    }
  }

  /** Restore a stored track (does not autoplay). Returns true when restored. */
  restoreLastPlayed() {
    const lp = Store.get("lastPlayed", null);
    if (!lp) return false;
    const reciter = getReciter(lp.reciterId);
    const surah = getSurah(lp.surahId);
    if (!reciter || !surah || reciter.unavailable) return false;
    return true;
  }
}

/** Timestamp helpers for verse sync — quran.com segments or character-weighted estimate. */
export async function verseTimings(reciterId, surahId) {
  const map = { alafasy: 7, sudais: 3, shuraim: 10, husary: 6, minshawi: 9, abdulbasit: 2, shatri: 4 };
  const recId = map[reciterId];
  if (recId) {
    try {
      const res = await fetch(`https://api.quran.com/api/v4/quran/recitations/${recId}/${surahId}`);
      if (res.ok) {
        const d = await res.json();
        const files = d.audio_files || [];
        if (files.length && files[0].segments && files[0].segments.length) {
          return files.map((f) => ({ ayah: Number(f.verse_key.split(":")[1]), start: f.segments[0][0] / 1000 }));
        }
      }
    } catch {}
  }
  return null; // caller falls back to proportional estimate
}
