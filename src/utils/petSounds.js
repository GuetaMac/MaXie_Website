// Synthesized pet sounds (WebAudio) — walang audio files na kailangan.
// Lahat ay gawa sa oscillators + noise, kaya magaan at offline-friendly.

let ctx = null;
let master = null;
let noiseBuf = null;
let muted = false;

try {
  muted = localStorage.getItem("pet-muted") === "1";
} catch {
  /* ignore */
}

function ac() {
  if (muted) return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone({
  freq,
  to,
  dur = 0.2,
  type = "sine",
  vol = 0.25,
  at = 0,
  attack = 0.01,
}) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise({
  dur = 0.1,
  freq = 1000,
  q = 1,
  type = "bandpass",
  vol = 0.25,
  at = 0,
}) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + at;
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.05);
}

// Baby-penguin chirp: dalawang mabilis na "pip-pip" + maliit na honk
function meow(at = 0, pitch = 1, dur = 0.45, vol = 0.22) {
  const v = Math.min(vol, 0.2);
  tone({
    freq: 900 * pitch,
    to: 1500 * pitch,
    dur: 0.09,
    type: "triangle",
    vol: v,
    at,
  });
  tone({
    freq: 1000 * pitch,
    to: 1700 * pitch,
    dur: 0.1,
    type: "triangle",
    vol: v,
    at: at + 0.13,
  });
  tone({
    freq: 420 * pitch,
    to: 330 * pitch,
    dur: Math.max(0.15, dur * 0.4),
    type: "sawtooth",
    vol: v * 0.35,
    at: at + 0.28,
  });
}

const sounds = {
  poke() {
    tone({ freq: 700, to: 1150, dur: 0.09, type: "triangle", vol: 0.18 });
  },

  feed() {
    meow(0, 1.15, 0.3, 0.18);
    for (let i = 0; i < 8; i++) {
      const at = 0.6 + i * 0.2;
      noise({ dur: 0.07, freq: 700, type: "lowpass", vol: 0.4, at });
      tone({ freq: 190, to: 120, dur: 0.07, type: "triangle", vol: 0.15, at });
    }
    tone({ freq: 520, to: 700, dur: 0.35, type: "sine", vol: 0.14, at: 2.7 });
  },

  play() {
    for (let i = 0; i < 5; i++) {
      const at = 0.26 + i * 0.52;
      tone({
        freq: 600 + i * 40,
        to: 1500,
        dur: 0.12,
        type: "sine",
        vol: 0.2,
        at,
      });
      tone({ freq: 220, to: 110, dur: 0.12, type: "triangle", vol: 0.12, at });
    }
    meow(0.05, 1.3, 0.25, 0.14);
  },

  pet() {
    // masayang pip-pip-pip habang hinahaplos
    for (let i = 0; i < 5; i++) {
      tone({
        freq: 1000 + i * 70,
        to: 1600 + i * 60,
        dur: 0.08,
        type: "triangle",
        vol: 0.14,
        at: i * 0.16,
      });
    }
    tone({ freq: 440, to: 520, dur: 0.3, type: "sine", vol: 0.1, at: 0.9 });
  },

  sleep() {
    // maliit na music-box lullaby + malambot na paghinga
    const notes = [659, 784, 988, 784, 880, 659, 523];
    notes.forEach((f, i) => {
      tone({ freq: f, dur: 0.9, type: "sine", vol: 0.1, at: i * 0.5 });
      tone({ freq: f * 2, dur: 0.5, type: "sine", vol: 0.03, at: i * 0.5 });
    });
    noise({ dur: 1.3, freq: 320, type: "lowpass", vol: 0.07, at: 3.4 });
    noise({ dur: 1.3, freq: 320, type: "lowpass", vol: 0.07, at: 5.4 });
  },

  bath() {
    noise({ dur: 0.45, freq: 2200, q: 0.8, vol: 0.28, at: 0 });
    noise({ dur: 0.45, freq: 1800, q: 0.8, vol: 0.22, at: 0.9 });
    noise({ dur: 0.45, freq: 2600, q: 0.8, vol: 0.22, at: 1.8 });
    for (let i = 0; i < 14; i++) {
      const f = 300 + Math.random() * 600;
      tone({
        freq: f,
        to: f * 1.9,
        dur: 0.08,
        type: "sine",
        vol: 0.12,
        at: 0.1 + Math.random() * 3.2,
      });
    }
    tone({ freq: 880, to: 1320, dur: 0.25, type: "sine", vol: 0.1, at: 3.2 });
  },

  gift() {
    noise({ dur: 0.18, freq: 220, type: "lowpass", vol: 0.45, at: 0.5 });
    [523, 659, 784, 1047].forEach((f, i) =>
      tone({ freq: f, dur: 0.35, type: "sine", vol: 0.14, at: 1.0 + i * 0.09 }),
    );
    [1319, 1568, 1976].forEach((f, i) =>
      tone({
        freq: f,
        dur: 0.3,
        type: "triangle",
        vol: 0.07,
        at: 1.35 + i * 0.07,
      }),
    );
    meow(1.5, 1.25, 0.3, 0.16);
  },

  yawn() {
    meow(0, 0.62, 0.9, 0.16);
  },

  sparkle() {
    [1320, 1760, 2093].forEach((f, i) =>
      tone({ freq: f, dur: 0.25, type: "sine", vol: 0.1, at: i * 0.08 }),
    );
  },
};

const petSounds = {
  ...sounds,
  play: sounds.play,
  isMuted: () => muted,
  setMuted(v) {
    muted = !!v;
    try {
      localStorage.setItem("pet-muted", muted ? "1" : "0");
    } catch {
      /* ignore */
    }
  },
  // para sa mga action name na walang sariling sound
  forAction(name) {
    if (name && typeof sounds[name] === "function") sounds[name]();
  },
};

export default petSounds;
