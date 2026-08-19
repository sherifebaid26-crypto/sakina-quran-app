/* ============================================================
   SAKINA — offline audio store (IndexedDB)
   Downloads a surah once → plays forever without internet.
   Key: `${reciterId}:${surahId}` → { blob, meta }
   ============================================================ */

const DB_NAME = "sakina-offline";
const DB_VER = 1;
const STORE = "tracks";

let _db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (_db) return resolve(_db);
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "key" });
      }
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}

export const OfflineStore = {
  async get(reciterId, surahId) {
    try {
      const db = await openDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const r = tx.objectStore(STORE).get(`${reciterId}:${surahId}`);
        r.onsuccess = () => resolve(r.result || null);
        r.onerror = () => reject(r.error);
      });
    } catch { return null; }
  },

  async save(reciterId, surahId, blob, meta = {}) {
    try {
      const db = await openDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put({ key: `${reciterId}:${surahId}`, blob, meta, savedAt: Date.now() });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    } catch { return false; }
  },

  async remove(reciterId, surahId) {
    try {
      const db = await openDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).delete(`${reciterId}:${surahId}`);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    } catch { return false; }
  },

  async list() {
    try {
      const db = await openDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const r = tx.objectStore(STORE).getAll();
        r.onsuccess = () => resolve(r.result || []);
        r.onerror = () => reject(r.error);
      });
    } catch { return []; }
  },

  async size() {
    try {
      const all = await this.list();
      return all.reduce((a, x) => a + (x.blob ? x.blob.size : 0), 0);
    } catch { return 0; }
  },

  /** Download a track's audio to the store. Returns true on success. */
  async downloadTrack(track, onProgress) {
    try {
      const res = await fetch(track.audioUrl);
      if (!res.ok) throw new Error("http " + res.status);
      const total = Number(res.headers.get("Content-Length")) || 0;
      if (!res.body) {
        const blob = await res.blob();
        return await this.save(track.reciterId, track.surahId, blob, {
          reciterName: track.reciterName,
          surahName: track.surahName,
        });
      }
      // stream with progress
      const reader = res.body.getReader();
      const chunks = [];
      let received = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (onProgress && total) onProgress(received / total);
      }
      const blob = new Blob(chunks, { type: "audio/mpeg" });
      return await this.save(track.reciterId, track.surahId, blob, {
        reciterName: track.reciterName,
        surahName: track.surahName,
      });
    } catch (e) {
      console.error("[offline] download failed", e);
      return false;
    }
  },

  /** Build a playable object URL from the stored blob (revoke old ones). */
  async urlFor(reciterId, surahId) {
    const rec = await this.get(reciterId, surahId);
    if (!rec || !rec.blob) return null;
    return URL.createObjectURL(rec.blob);
  },
};

export function isIndexedDBAvailable() {
  return typeof indexedDB !== "undefined";
}
