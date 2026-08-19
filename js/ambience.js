/* ============================================================
   SAKINA — ambient background sounds (Web Audio, procedural)
   Rain · Water · Forest · Wind · Ocean · Fireplace · Night
   Each sound is generated live — no audio files needed,
   fully independent from the Quran audio path.
   ============================================================ */

export const AMBIENT_SOUNDS = [
  { id: "storm",   name: "Thunder",       nameAr: "عاصفة رعدية", icon: "cloud-lightning" },
  { id: "rain",    name: "Rain",          nameAr: "مطر",        icon: "cloud-rain" },
  { id: "ocean",   name: "Ocean",         nameAr: "محيط",       icon: "waves" },
  { id: "wind",    name: "Wind",          nameAr: "رياح",       icon: "wind" },
  { id: "fire",    name: "Fireplace",     nameAr: "موقد",       icon: "flame" },
  { id: "water",   name: "Water",         nameAr: "ماء",        icon: "droplet" },
  { id: "forest",  name: "Forest",        nameAr: "غابة",       icon: "tree" },
  { id: "night",   name: "Night",         nameAr: "ليل هادئ",   icon: "moon" },
  { id: "off",     name: "None",          nameAr: "بدون",       icon: "moon-off" },
];

export class AmbientEngine {
  constructor() {
    this.ctx = null;
    this.gain = null;
    this.nodes = [];
    this.timers = [];
    this.current = "off";
    this._volume = 0.45;
  }

  get volume() { return this._volume; }
  set volume(v) {
    this._volume = v;
    if (this.gain && this.ctx) {
      this.gain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1);
    }
  }

  _ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.gain = this.ctx.createGain();
      this.gain.gain.value = 0;
      this.gain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  _noiseBuffer(type = "white") {
    const ctx = this.ctx;
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (type === "white") d[i] = w;
      else if (type === "pink") {
        // Paul Kellet refined pink noise
        let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
        // simple one-pole approximation per sample is too heavy; use fixed algo below
        d[i] = 0;
      } else { // brown
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      }
    }
    if (type === "pink") {
      // regenerate with proper pink algorithm
      const d2 = buf.getChannelData(0);
      let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.96900 * b2 + w * 0.1538520;
        b3 = 0.86650 * b3 + w * 0.3104856;
        b4 = 0.55000 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.0168980;
        d2[i] = (b0+b1+b2+b3+b4+b5+b6+w*0.5362) * 0.11;
        b6 = w * 0.115926;
      }
    }
    return buf;
  }

  _source(buf, loop = true) {
    const s = this.ctx.createBufferSource();
    s.buffer = buf;
    s.loop = loop;
    s.connect(this.gain);
    s.start();
    this.nodes.push(s);
    return s;
  }

  _filter(type, freq, q = 1) {
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    f.connect(this.gain);
    this.nodes.push(f);
    return f;
  }

  _gainNode(v) {
    const g = this.ctx.createGain();
    g.gain.value = v;
    g.connect(this.gain);
    this.nodes.push(g);
    return g;
  }

  _every(sec, fn) {
    const t = setInterval(fn, sec * 1000);
    this.timers.push(t);
    return t;
  }

  start(id) {
    this.stop();
    if (!id || id === "off") { this.current = "off"; return; }
    const ctx = this._ensure();
    this.current = id;
    const g = this.gain;
    g.gain.cancelScheduledValues(ctx.currentTime);
    g.gain.setTargetAtTime(this._volume, ctx.currentTime, 0.6);

    switch (id) {
      case "rain": {
        const src = this._source(this._noiseBuffer("white"));
        const hp = this._filter("highpass", 400);
        const lp = this._filter("lowpass", 5200, 0.6);
        src.connect(hp); hp.connect(lp); lp.connect(g);
        // droplets
        this._every(0.11, () => {
          if (Math.random() < 0.28) {
            const drop = ctx.createBufferSource();
            const dlen = Math.floor(ctx.sampleRate * 0.05);
            const dbuf = ctx.createBuffer(1, dlen, ctx.sampleRate);
            const dd = dbuf.getChannelData(0);
            for (let i = 0; i < dlen; i++) dd[i] = (Math.random()*2-1) * Math.pow(1 - i/dlen, 2.2);
            drop.buffer = dbuf;
            const df = ctx.createBiquadFilter(); df.type = "bandpass"; df.frequency.value = 1800 + Math.random()*1400; df.Q.value = 1.6;
            const dg = ctx.createGain(); dg.gain.value = 0.10 + Math.random()*0.10;
            drop.connect(df); df.connect(dg); dg.connect(this.gain);
            drop.start();
            this.nodes.push(drop, df, dg);
          }
        });
        break;
      }
      case "storm": {
        // rain bed
        const src = this._source(this._noiseBuffer("white"));
        const hp = this._filter("highpass", 380);
        const lp = this._filter("lowpass", 4600, 0.6);
        src.connect(hp); hp.connect(lp); lp.connect(g);
        // distant thunder rumbles
        this._every(8, () => {
          if (Math.random() < 0.75) {
            const t0 = ctx.currentTime + Math.random() * 1.4;
            const dur = 2.4 + Math.random() * 2.6;
            const len = Math.floor(ctx.sampleRate * dur);
            const dbuf = ctx.createBuffer(1, len, ctx.sampleRate);
            const dd = dbuf.getChannelData(0);
            let last = 0;
            for (let i = 0; i < len; i++) {
              last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
              dd[i] = last * 3.2;
            }
            const boom = ctx.createBufferSource();
            boom.buffer = dbuf;
            const bf = ctx.createBiquadFilter();
            bf.type = "lowpass";
            bf.frequency.value = 130 + Math.random() * 90;
            const bg = ctx.createGain();
            bg.gain.setValueAtTime(0, t0);
            bg.gain.linearRampToValueAtTime(0.35 + Math.random() * 0.3, t0 + 0.12);
            bg.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
            boom.connect(bf); bf.connect(bg); bg.connect(this.gain);
            boom.start(t0);
            this.nodes.push(boom, bf, bg);
          }
        });
        break;
      }
      case "water": {
        const src = this._source(this._noiseBuffer("pink"));
        const bp = this._filter("bandpass", 900, 0.7);
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.13;
        const lfoG = ctx.createGain(); lfoG.gain.value = 220;
        lfo.connect(lfoG); lfoG.connect(bp.frequency); lfo.start();
        const g2 = this._gainNode(0.9);
        src.connect(bp); bp.connect(g2);
        this.nodes.push(lfo, lfoG);
        break;
      }
      case "forest": {
        const src = this._source(this._noiseBuffer("pink"));
        const bp = this._filter("bandpass", 620, 0.9);
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
        const lfoG = ctx.createGain(); lfoG.gain.value = 160;
        lfo.connect(lfoG); lfoG.connect(bp.frequency); lfo.start();
        const g2 = this._gainNode(0.5);
        src.connect(bp); bp.connect(g2);
        this.nodes.push(lfo, lfoG);
        // gentle bird chirps
        this._every(2.4, () => {
          if (Math.random() < 0.5) {
            const t0 = ctx.currentTime + Math.random() * 0.6;
            const base = 2200 + Math.random() * 1600;
            const osc = ctx.createOscillator();
            osc.type = "sine";
            osc.frequency.setValueAtTime(base, t0);
            osc.frequency.exponentialRampToValueAtTime(base * 1.35, t0 + 0.09);
            osc.frequency.exponentialRampToValueAtTime(base * 0.9, t0 + 0.2);
            const og = ctx.createGain();
            og.gain.setValueAtTime(0, t0);
            og.gain.linearRampToValueAtTime(0.045, t0 + 0.03);
            og.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35);
            osc.connect(og); og.connect(this.gain);
            osc.start(t0); osc.stop(t0 + 0.4);
            this.nodes.push(osc, og);
          }
        });
        break;
      }
      case "wind": {
        const src = this._source(this._noiseBuffer("brown"));
        const bp = this._filter("bandpass", 300, 0.9);
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05;
        const lfoG = ctx.createGain(); lfoG.gain.value = 220;
        lfo.connect(lfoG); lfoG.connect(bp.frequency); lfo.start();
        const lfo2 = ctx.createOscillator(); lfo2.frequency.value = 0.023;
        const lfoG2 = ctx.createGain(); lfoG2.gain.value = 0.18;
        lfo2.connect(lfoG2); lfoG2.connect(g.gain); lfo2.start();
        const g2 = this._gainNode(0.8);
        src.connect(bp); bp.connect(g2);
        this.nodes.push(lfo, lfoG, lfo2, lfoG2);
        break;
      }
      case "ocean": {
        const src = this._source(this._noiseBuffer("pink"));
        const lp = this._filter("lowpass", 900, 0.5);
        const g2 = this._gainNode(0.9);
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.075;
        const lfoG = ctx.createGain(); lfoG.gain.value = 0.5;
        lfo.connect(lfoG); lfoG.connect(g2.gain); lfo.start();
        const lfo2 = ctx.createOscillator(); lfo2.frequency.value = 0.011;
        const lfoG2 = ctx.createGain(); lfoG2.gain.value = 0.3;
        lfo2.connect(lfoG2); lfoG2.connect(g2.gain); lfo2.start();
        src.connect(lp); lp.connect(g2);
        this.nodes.push(lfo, lfoG, lfo2, lfoG2);
        break;
      }
      case "fire": {
        const src = this._source(this._noiseBuffer("brown"));
        const lp = this._filter("lowpass", 420, 0.8);
        const g2 = this._gainNode(0.85);
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.31;
        const lfoG = ctx.createGain(); lfoG.gain.value = 0.09;
        lfo.connect(lfoG); lfoG.connect(g2.gain); lfo.start();
        src.connect(lp); lp.connect(g2);
        this.nodes.push(lfo, lfoG);
        // crackles
        this._every(0.16, () => {
          if (Math.random() < 0.35) {
            const t0 = ctx.currentTime;
            const dlen = Math.floor(ctx.sampleRate * 0.035);
            const dbuf = ctx.createBuffer(1, dlen, ctx.sampleRate);
            const dd = dbuf.getChannelData(0);
            for (let i = 0; i < dlen; i++) dd[i] = (Math.random()*2-1) * Math.pow(1 - i/dlen, 3);
            const drop = ctx.createBufferSource(); drop.buffer = dbuf;
            const df = ctx.createBiquadFilter(); df.type = "highpass"; df.frequency.value = 2400;
            const dg = ctx.createGain(); dg.gain.value = 0.05 + Math.random()*0.09;
            drop.connect(df); df.connect(dg); dg.connect(this.gain);
            drop.start(t0);
            this.nodes.push(drop, df, dg);
          }
        });
        break;
      }
      case "night": {
        const src = this._source(this._noiseBuffer("pink"));
        const lp = this._filter("lowpass", 700, 0.6);
        const g2 = this._gainNode(0.35);
        src.connect(lp); lp.connect(g2);
        // faint cricket
        this._every(0.9, () => {
          if (Math.random() < 0.4) {
            const t0 = ctx.currentTime;
            const osc = ctx.createOscillator();
            osc.type = "triangle";
            const f0 = 4200 + Math.random() * 300;
            osc.frequency.value = f0;
            const og = ctx.createGain();
            const n = 3 + Math.floor(Math.random() * 4);
            for (let i = 0; i < n; i++) {
              const st = t0 + i * 0.11;
              og.gain.setValueAtTime(0, st);
              og.gain.linearRampToValueAtTime(0.028, st + 0.03);
              og.gain.linearRampToValueAtTime(0, st + 0.09);
            }
            osc.connect(og); og.connect(this.gain);
            osc.start(t0); osc.stop(t0 + n * 0.12);
            this.nodes.push(osc, og);
          }
        });
        break;
      }
    }
  }

  stop() {
    this.timers.forEach(clearInterval);
    this.timers = [];
    if (this.ctx && this.gain) {
      const t = this.ctx.currentTime;
      this.gain.gain.cancelScheduledValues(t);
      this.gain.gain.setTargetAtTime(0, t, 0.6);
      // disconnect after the fade completes
      const nodes = this.nodes;
      const ctx = this.ctx;
      setTimeout(() => {
        nodes.forEach((n) => {
          try { if (n.stop) n.stop(0); } catch {}
          try { n.disconnect(); } catch {}
        });
        if (this.nodes === nodes) this.nodes = [];
      }, 900);
      this.nodes = [];
    } else {
      this.nodes = [];
    }
    this.current = "off";
  }
}
