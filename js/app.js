/* ============================================================
   SAKINA — bootstrap
   ============================================================ */

import { loadSurahs, Store, getReciter, getSurah, buildTrack } from "./data.js";
import { AudioEngine } from "./audio.js";
import { AmbientEngine } from "./ambience.js";
import { App, render, renderChrome, wireEngineEvents, wireGlobalEvents, toast, renderMiniPlayer, navigate } from "./ui.js";
import { RECITERS, validateTrack } from "./data.js";

async function boot() {
  // 1. surah metadata (works from the single-file build too)
  let surahs;
  const preData = window.__SAKINA_DATA__;
  if (preData) {
    surahs = preData.surahs;
    App.quranAr = preData.ar;
    App.quranEn = preData.en;
  } else {
    try {
      const res = await fetch("data/surahs.json");
      surahs = await res.json();
    } catch {
      document.getElementById("view").innerHTML = `<div class="empty">Could not load the app data.</div>`;
      return;
    }
  }
  loadSurahs(surahs);

  // 2. engines
  const audioEl = document.getElementById("audio");
  App.engine = new AudioEngine(audioEl);
  App.ambient = new AmbientEngine();

  // restore volumes
  const set = Store.get("settings", {});
  App.ambient.volume = set.bgVolume ?? 0.45;
  audioEl.volume = set.quranVolume ?? 0.9;

  // accent
  document.documentElement.dataset.accent = set.accent || "sapphire";

  // 3. chrome + routing
  renderChrome();
  wireEngineEvents();
  wireGlobalEvents();
  render();

  // 4. restore last track metadata in the player (no autoplay)
  const lp = Store.get("lastPlayed", null);
  if (lp) {
    const t = buildTrack(lp.reciterId, lp.surahId);
    if (t) {
      App.engine.state.track = t;
      App.engine.state.queue = [t];
      App.engine.state.queueIndex = 0;
      renderMiniPlayer();
    }
  }

  // 5. console self-check (visible proof of the mapping fix)
  runSelfCheck();

  // debug/test handle
  window.__SAKINA = {
    App,
    state: () => ({
      ...App.engine.state,
      track: App.engine.state.track && { ...App.engine.state.track },
    }),
    ambient: App.ambient,
    navigate,
  };

  setTimeout(() => {
    if (Store.get("_greeted") !== true) {
      toast("Welcome to Sakina — choose a reciter to begin");
      Store.set("_greeted", true);
    }
  }, 700);
}

function runSelfCheck() {
  try {
    const lines = [];
    for (const r of RECITERS) {
      if (!r.source) {
        lines.push(`· ${r.name}: no full mushaf available — honest unavailable state (no mislabeled audio)`);
        continue;
      }
      const t1 = buildTrack(r.id, 1);
      const t2 = buildTrack(r.id, 2);
      const p1 = validateTrack(t1);
      const p2 = validateTrack(t2);
      const ok = !p1.length && !p2.length;
      lines.push(`${ok ? "✓" : "✗"} ${r.name}: surah 1 → ${t1.audioUrl.split("/").pop()} | surah 2 → ${t2.audioUrl.split("/").pop()}${ok ? "" : "  " + p1.concat(p2).join("; ")}`);
    }
    console.log("%cSakina self-check — surahId-keyed audio mapping", "font-weight:bold;color:#9db8ff");
    lines.forEach((l) => console.log(l));
  } catch (e) {
    console.warn("self-check skipped", e);
  }
}

boot();
