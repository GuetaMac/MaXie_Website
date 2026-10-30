import { useEffect, useRef } from "react";
import * as THREE from "three";
import petSounds from "../utils/petSounds.js";

/* ---------- helpers ---------- */
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
const rand = (a, b) => a + Math.random() * (b - a);

const COLOR = {
  fur: 0x3d4a6e, // navy na balahibo
  belly: 0xfffaf5,
  beak: 0xffb04a,
  cheek: 0xffa3ba,
  dark: 0x2a2236,
  rug: 0xd9f0ff,
  rugEdge: 0xaee0ff,
};

/**
 * 3D pet (procedural, walang model file).
 * Props:
 *  - stats: { happiness, hunger, energy, clean, bond }
 *  - action: "feed" | "play" | "pet" | "sleep" | "bath" | "gift" | null
 *  - actionId: dagdagan every trigger para mag-restart kahit parehong action
 *  - onTap: tinatawag kapag tinap ang pet (hindi kapag drag)
 *  - accessory: "none" | "bow" | "scarf" | "crown"
 */
export default function PetAvatar({
  stats,
  action = null,
  actionId = 0,
  onTap,
  accessory = "none",
}) {
  const mountRef = useRef(null);
  const propsRef = useRef({ stats, accessory, onTap });
  const apiRef = useRef(null);
  propsRef.current = { stats, accessory, onTap };

  /* ---------- build scene (once) ---------- */
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const reduceMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const motion = reduceMotion ? 0.35 : 1;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      mount.innerHTML =
        '<div style="display:flex;height:100%;align-items:center;justify-content:center;font-size:72px">🐧</div>';
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block;outline:none";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
    camera.position.set(0, 3.0, 9.6);
    camera.lookAt(0, 1.7, 0);

    /* lights */
    const hemi = new THREE.HemisphereLight(0xfff1f5, 0xffd0de, 1.1);
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(3, 6, 5);
    const rim = new THREE.DirectionalLight(0xffb3d0, 0.7);
    rim.position.set(-4, 3, -3);
    scene.add(hemi, sun, rim);

    /* ---------- textures ---------- */
    const textures = [];
    const canvasTex = (draw, size = 128) => {
      const c = document.createElement("canvas");
      c.width = c.height = size;
      draw(c.getContext("2d"), size);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      textures.push(t);
      return t;
    };

    const heartTex = canvasTex((g, s) => {
      const cx = s / 2;
      const cy = s / 2 + 6;
      const r = s * 0.2;
      g.fillStyle = "#ff6b9a";
      g.beginPath();
      g.moveTo(cx, cy + r * 1.9);
      g.bezierCurveTo(
        cx - r * 3.0,
        cy - r * 0.2,
        cx - r * 1.6,
        cy - r * 2.4,
        cx,
        cy - r * 0.9,
      );
      g.bezierCurveTo(
        cx + r * 1.6,
        cy - r * 2.4,
        cx + r * 3.0,
        cy - r * 0.2,
        cx,
        cy + r * 1.9,
      );
      g.fill();
      g.fillStyle = "rgba(255,255,255,0.55)";
      g.beginPath();
      g.ellipse(
        cx - r * 1.0,
        cy - r * 0.8,
        r * 0.45,
        r * 0.28,
        -0.6,
        0,
        Math.PI * 2,
      );
      g.fill();
    });

    const sparkTex = canvasTex((g, s) => {
      const cx = s / 2;
      const cy = s / 2;
      g.fillStyle = "#ffd25e";
      g.beginPath();
      for (let i = 0; i < 8; i++) {
        const rad = i % 2 === 0 ? s * 0.42 : s * 0.11;
        const a = (Math.PI / 4) * i - Math.PI / 2;
        const x = cx + Math.cos(a) * rad;
        const y = cy + Math.sin(a) * rad;
        if (i === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.closePath();
      g.fill();
    });

    const zTex = canvasTex((g, s) => {
      g.font = `bold ${s * 0.72}px Quicksand, "Segoe UI", sans-serif`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.lineWidth = 8;
      g.strokeStyle = "#ffffff";
      g.strokeText("Z", s / 2, s / 2 + 4);
      g.fillStyle = "#8b7cff";
      g.fillText("Z", s / 2, s / 2 + 4);
    });

    const bubbleTex = canvasTex((g, s) => {
      const grad = g.createRadialGradient(
        s * 0.4,
        s * 0.38,
        s * 0.05,
        s / 2,
        s / 2,
        s * 0.42,
      );
      grad.addColorStop(0, "rgba(255,255,255,0.9)");
      grad.addColorStop(0.6, "rgba(190,235,255,0.35)");
      grad.addColorStop(1, "rgba(120,200,255,0.65)");
      g.fillStyle = grad;
      g.beginPath();
      g.arc(s / 2, s / 2, s * 0.42, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "rgba(255,255,255,0.8)";
      g.lineWidth = 3;
      g.stroke();
    });

    const crumbTex = canvasTex((g, s) => {
      const grad = g.createRadialGradient(
        s / 2,
        s / 2,
        2,
        s / 2,
        s / 2,
        s * 0.4,
      );
      grad.addColorStop(0, "#f6c177");
      grad.addColorStop(1, "#d9944a");
      g.fillStyle = grad;
      g.beginPath();
      g.arc(s / 2, s / 2, s * 0.38, 0, Math.PI * 2);
      g.fill();
    }, 64);

    const shadowTex = canvasTex((g, s) => {
      const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      grad.addColorStop(0, "rgba(90,40,70,0.38)");
      grad.addColorStop(1, "rgba(90,40,70,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, s, s);
    }, 128);

    /* ---------- mesh helpers ---------- */
    const std = (color, roughness = 0.85) =>
      new THREE.MeshStandardMaterial({ color, roughness });
    const ball = (r, mat, sx = 1, sy = 1, sz = 1) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), mat);
      m.scale.set(sx, sy, sz);
      return m;
    };

    const furMat = std(COLOR.fur, 0.8);
    const bellyMat = std(COLOR.belly, 0.9);
    const beakMat = std(COLOR.beak, 0.5);
    const cheekMat = std(COLOR.cheek, 0.9);
    const darkMat = new THREE.MeshStandardMaterial({
      color: COLOR.dark,
      roughness: 0.35,
    });
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    /* ---------- ground ---------- */
    const rug = new THREE.Mesh(
      new THREE.CircleGeometry(2.7, 56),
      new THREE.MeshStandardMaterial({
        color: COLOR.rug,
        roughness: 1,
        transparent: true,
        opacity: 0.7,
      }),
    );
    rug.rotation.x = -Math.PI / 2;
    rug.position.y = 0.004;
    const rugEdge = new THREE.Mesh(
      new THREE.RingGeometry(2.38, 2.7, 56),
      new THREE.MeshStandardMaterial({
        color: COLOR.rugEdge,
        roughness: 1,
        transparent: true,
        opacity: 0.85,
      }),
    );
    rugEdge.rotation.x = -Math.PI / 2;
    rugEdge.position.y = 0.006;
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 3.2),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.012;
    scene.add(rug, rugEdge, shadow);

    /* ---------- the pet (penguin) ---------- */
    const pet = new THREE.Group();
    scene.add(pet);

    const bodyMesh = ball(0.8, furMat, 1, 0.9, 1);
    bodyMesh.position.set(0, 0.72, 0);
    const belly = ball(0.68, bellyMat, 0.95, 0.95, 0.62);
    belly.position.set(0, 0.66, 0.5);
    pet.add(bodyMesh, belly);

    const feet = [-1, 1].map((side) => {
      const f = ball(0.26, beakMat, 1.1, 0.35, 1.5);
      f.position.set(side * 0.35, 0.1, 0.55);
      pet.add(f);
      return f;
    });
    const arms = [-1, 1].map((side) => {
      const a = ball(0.2, furMat, 0.45, 1.6, 0.95);
      a.position.set(side * 0.86, 0.85, 0.1);
      a.rotation.z = side * 0.35;
      pet.add(a);
      return a;
    });

    /* tail (maliit na buntot sa likod) */
    const tail = new THREE.Group();
    tail.position.set(0, 0.45, -0.7);
    const tailMesh = ball(0.2, furMat, 1, 0.5, 1.4);
    tailMesh.position.set(0, 0, -0.18);
    tail.add(tailMesh);
    pet.add(tail);

    /* head */
    const head = new THREE.Group();
    head.position.set(0, 1.75, 0.05);
    pet.add(head);
    head.add(ball(0.95, furMat, 1.12, 0.95, 1));
    const facePatch = ball(0.85, bellyMat, 1, 0.8, 0.62);
    facePatch.position.set(0, -0.06, 0.45);
    head.add(facePatch);

    const ears = []; // penguin: walang tenga (iniwan para sa animation loop)

    /* eyes: open / happy (^ ^) / sleep (u u) */
    const eyesOpen = new THREE.Group();
    const eyeGroups = [-1, 1].map((side) => {
      const g = new THREE.Group();
      g.position.set(side * 0.4, 0.03, 0.9);
      const eye = ball(0.12, darkMat, 1, 1.3, 0.6);
      const hl = ball(0.04, whiteMat);
      hl.position.set(0.035, 0.08, 0.07);
      const hl2 = ball(0.02, whiteMat);
      hl2.position.set(-0.035, -0.05, 0.07);
      g.add(eye, hl, hl2);
      eyesOpen.add(g);
      return g;
    });
    const arcGeo = new THREE.TorusGeometry(0.1, 0.028, 8, 20, Math.PI);
    const eyesHappy = new THREE.Group();
    const eyesSleep = new THREE.Group();
    [-1, 1].forEach((side) => {
      const h = new THREE.Mesh(arcGeo, darkMat);
      h.position.set(side * 0.4, 0.01, 0.93);
      eyesHappy.add(h);
      const s2 = new THREE.Mesh(arcGeo, darkMat);
      s2.position.set(side * 0.4, 0.06, 0.93);
      s2.rotation.z = Math.PI;
      eyesSleep.add(s2);
    });
    eyesHappy.visible = false;
    eyesSleep.visible = false;
    head.add(eyesOpen, eyesHappy, eyesSleep);

    /* cheeks */
    [-1, 1].forEach((side) => {
      const c = ball(0.16, cheekMat, 1.25, 0.7, 0.3);
      c.position.set(side * 0.62, -0.2, 0.8);
      c.rotation.y = side * 0.5;
      head.add(c);
    });

    /* beak: upper + lower (bumubuka kapag kumakain / humihikab) */
    const beakUpper = new THREE.Mesh(
      new THREE.ConeGeometry(0.15, 0.3, 18),
      beakMat,
    );
    beakUpper.rotation.x = Math.PI / 2;
    beakUpper.scale.z = 0.55;
    beakUpper.position.set(0, -0.1, 1.02);
    head.add(beakUpper);
    const lowerBeak = new THREE.Group();
    lowerBeak.position.set(0, -0.17, 0.95);
    const lowerCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.11, 0.22, 16),
      beakMat,
    );
    lowerCone.rotation.x = Math.PI / 2;
    lowerCone.scale.z = 0.5;
    lowerCone.position.set(0, 0, 0.1);
    lowerBeak.add(lowerCone);
    head.add(lowerBeak);

    /* accessories */
    const bow = new THREE.Group();
    {
      const bowMat = std(0xff6f91, 0.5);
      [-1, 1].forEach((side) => {
        const w = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.36, 18), bowMat);
        w.position.x = side * 0.18;
        w.rotation.z = -side * (Math.PI / 2);
        w.scale.z = 0.7;
        bow.add(w);
      });
      bow.add(ball(0.09, std(0xff4f79, 0.5)));
      bow.position.set(0.62, 0.62, 0.5);
      bow.rotation.z = -0.4;
      head.add(bow);
    }
    const crown = new THREE.Group();
    {
      const gold = new THREE.MeshStandardMaterial({
        color: 0xffc857,
        roughness: 0.3,
        metalness: 0.6,
      });
      const band = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.44, 0.2, 20, 1, true),
        gold,
      );
      band.material.side = THREE.DoubleSide;
      crown.add(band);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const spike = new THREE.Mesh(
          new THREE.ConeGeometry(0.09, 0.26, 10),
          gold,
        );
        spike.position.set(Math.cos(a) * 0.41, 0.2, Math.sin(a) * 0.41);
        crown.add(spike);
      }
      const gem = ball(0.06, std(0xff5470, 0.2));
      gem.position.set(0, 0, 0.44);
      crown.add(gem);
      crown.position.set(0, 0.84, 0.05);
      crown.rotation.x = 0.12;
      head.add(crown);
    }
    const scarf = new THREE.Group();
    {
      const sm = std(0xff8fa3, 0.95);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.8, 0.17, 12, 36),
        sm,
      );
      ring.rotation.x = Math.PI / 2;
      const hang = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.55, 0.1), sm);
      hang.position.set(0.45, -0.28, 0.66);
      hang.rotation.z = 0.15;
      scarf.add(ring, hang);
      scarf.position.set(0, 1.02, 0.02);
      pet.add(scarf);
    }
    bow.visible = crown.visible = scarf.visible = false;

    /* ---------- props ---------- */
    const bowl = new THREE.Group();
    const bowlBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.36, 0.26, 28),
      std(0xff9fb5, 0.6),
    );
    bowlBody.position.y = 0.13;
    const food = new THREE.Mesh(
      new THREE.CylinderGeometry(0.44, 0.44, 0.04, 28),
      std(0xf6c177),
    );
    food.position.y = 0.25;
    const fish = new THREE.Group();
    fish.position.y = 0.4;
    const fishBody = ball(0.2, std(0x7fc8f8, 0.5), 1.7, 0.8, 0.7);
    const fishTail = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.24, 12),
      std(0x5fb3ee, 0.5),
    );
    fishTail.position.x = -0.42;
    fishTail.rotation.z = -Math.PI / 2;
    const fishEye = ball(0.03, darkMat);
    fishEye.position.set(0.22, 0.04, 0.1);
    fish.add(fishBody, fishTail, fishEye);
    bowl.add(bowlBody, food, fish);
    bowl.position.set(0, 0, 1.75);
    bowl.visible = false;
    scene.add(bowl);

    const yarn = new THREE.Group();
    yarn.add(ball(0.32, std(0xff7a90, 0.9)));
    [0, 1].forEach((i) => {
      const t = new THREE.Mesh(
        new THREE.TorusGeometry(0.33, 0.018, 6, 28),
        std(0xffb0bd, 0.9),
      );
      t.rotation.set(i * 1.1, i * 0.6, i * 0.4);
      yarn.add(t);
    });
    yarn.visible = false;
    scene.add(yarn);

    const gift = new THREE.Group();
    const giftBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.5, 0.7),
      std(0xb9a7ff, 0.7),
    );
    giftBox.position.y = 0.25;
    const ribbonMat = std(0xffd166, 0.5);
    const rb1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.51, 0.72),
      ribbonMat,
    );
    rb1.position.y = 0.25;
    const rb2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.51, 0.14),
      ribbonMat,
    );
    rb2.position.y = 0.25;
    const lid = new THREE.Group();
    const lidBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.16, 0.8),
      std(0xa08cff, 0.7),
    );
    const lr1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.17, 0.82),
      ribbonMat,
    );
    const lr2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 0.17, 0.14),
      ribbonMat,
    );
    const lb1 = ball(0.1, ribbonMat, 1.4, 1, 1);
    lb1.position.set(-0.1, 0.13, 0);
    const lb2 = ball(0.1, ribbonMat, 1.4, 1, 1);
    lb2.position.set(0.1, 0.13, 0);
    lid.add(lidBox, lr1, lr2, lb1, lb2);
    lid.position.y = 0.58;
    gift.add(giftBox, rb1, rb2, lid);
    gift.position.set(0, 0, 1.7);
    gift.visible = false;
    scene.add(gift);

    const water = new THREE.Group();
    const waterDisc = new THREE.Mesh(
      new THREE.CircleGeometry(2.1, 48),
      new THREE.MeshStandardMaterial({
        color: 0x9be7ff,
        roughness: 0.2,
        transparent: true,
        opacity: 0.55,
      }),
    );
    waterDisc.rotation.x = -Math.PI / 2;
    const waterRing = new THREE.Mesh(
      new THREE.RingGeometry(2.0, 2.15, 48),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
      }),
    );
    waterRing.rotation.x = -Math.PI / 2;
    water.add(waterDisc, waterRing);
    water.position.y = 0.02;
    water.visible = false;
    scene.add(water);

    const pillow = ball(0.8, std(0xcfc4ff, 0.95), 1.4, 0.32, 1.05);
    pillow.position.set(0, 0.12, 0.78);
    pillow.visible = false;
    scene.add(pillow);

    /* ---------- particles ---------- */
    const particles = [];
    const spawn = (tex, x, y, z, vx, vy, vz, life, size, opts = {}) => {
      const mat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        opacity: 0,
      });
      const s = new THREE.Sprite(mat);
      s.position.set(x, y, z);
      s.scale.setScalar(size);
      scene.add(s);
      particles.push({
        s,
        mat,
        vx,
        vy,
        vz,
        life,
        size,
        age: 0,
        grow: opts.grow || 0,
        grav: opts.grav || 0,
        rot: opts.rot || 0,
      });
    };
    const hearts = (n = 1, spread = 0.7) => {
      for (let i = 0; i < n; i++) {
        spawn(
          heartTex,
          rand(-spread, spread),
          rand(2.6, 3.2),
          rand(0.2, 0.8),
          rand(-0.2, 0.2),
          rand(0.9, 1.3),
          0,
          1.7,
          rand(0.45, 0.65),
          { rot: rand(-0.6, 0.6) },
        );
      }
    };
    const sparkles = (n = 1, spread = 1.1) => {
      for (let i = 0; i < n; i++) {
        spawn(
          sparkTex,
          rand(-spread, spread),
          rand(0.8, 3.2),
          rand(0.2, 1.2),
          rand(-0.3, 0.3),
          rand(0.2, 0.8),
          0,
          1.2,
          rand(0.3, 0.5),
          { rot: rand(-2, 2), grow: 0.3 },
        );
      }
    };

    /* ---------- animation state ---------- */
    const A = {
      time: 0,
      action: null,
      t0: 0,
      timers: {},
      fired: {},
      lie: 0,
      lean: 0,
      happy: 0,
      droop: 0,
      mouth: 0,
      jump: 0,
      squish: 0,
      wiggle: 0,
      dim: 0,
      tailAmp: 0.25,
      tailSpd: 1.4,
      tailPhase: 0,
      eyeOpen: 1,
      look: { x: 0, y: 0 },
      lookBias: 0,
      pointer: { x: 0, y: 0, active: false },
      drag: 0,
      dragTarget: 0,
      bowl: 0,
      ball: 0,
      gift: 0,
      water: 0,
      nextBlink: 2,
      blinkAt: -1,
      wakeAt: -10,
      pokeAt: -10,
    };
    const hemiBase = new THREE.Color(0xfff1f5);
    const hemiNight = new THREE.Color(0x9aa8ff);
    const sunBase = new THREE.Color(0xffffff);
    const sunNight = new THREE.Color(0xb9c4ff);

    const every = (key, dt, interval, fn) => {
      A.timers[key] = (A.timers[key] ?? 0) - dt;
      if (A.timers[key] <= 0) {
        A.timers[key] = interval;
        fn();
      }
    };
    const once = (key, fn) => {
      if (!A.fired[key]) {
        A.fired[key] = true;
        fn();
      }
    };

    apiRef.current = {
      setAction(name) {
        const prev = A.action;
        A.action = name || null;
        A.t0 = A.time;
        A.timers = {};
        A.fired = {};
        if (prev === "sleep" && !name) {
          A.wakeAt = A.time;
          petSounds.yawn();
        }
        if (name) petSounds.forAction(name);
      },
    };

    /* ---------- frame ---------- */
    function frame(dt) {
      A.time += dt;
      const t = A.time;
      const { stats: st, accessory: acc } = propsRef.current;
      const act = A.action;
      const el = t - A.t0;
      const avg = (st.happiness + st.energy + st.hunger + st.clean) / 4;
      const we = t - A.wakeAt;
      const waking = we < 1.1;

      let lieT = 0,
        leanT = 0,
        happyT = 0,
        droopT = 0,
        mouthT = 0,
        dimT = 0;
      let tailAmp = 0.25,
        tailSpd = 1.4,
        eyeT = 1,
        squishT = 0;
      let jumpT = null,
        wiggleT = null;
      let bowlT = 0,
        ballT = 0,
        waterT = 0,
        lookBiasT = 0,
        bob = 0;

      /* mood from stats */
      if (st.energy < 25) {
        droopT = 0.5;
        eyeT = 0.55;
        leanT = 0.12;
        tailAmp = 0.1;
        tailSpd = 0.8;
      } else if (st.hunger < 30) {
        droopT = 0.35;
        leanT = 0.08;
        tailAmp = 0.15;
      } else if (avg > 75) {
        tailAmp = 0.5;
        tailSpd = 2.2;
      }

      /* actions */
      if (act === "sleep") {
        lieT = 1;
        dimT = 1;
        eyeT = 0.1;
        tailAmp = 0.05;
        tailSpd = 0.5;
        if (el > 0.8)
          every("z", dt, 1.25, () => {
            spawn(zTex, rand(0.5, 0.9), 2.7, 0.7, 0.25, 0.55, 0, 2.6, 0.5, {
              grow: 0.9,
              rot: -0.2,
            });
          });
      } else if (act === "feed") {
        const eating = el > 0.5 && el < 2.6;
        bowlT = el < 3.0 ? 1 : 0;
        leanT = eating ? 1 : el < 0.5 ? 0.5 : 0.15;
        if (eating) {
          mouthT = 0.5 + 0.5 * Math.sin(el * 16);
          bob = Math.sin(el * 16) * 0.05;
          every("crumb", dt, 0.13, () =>
            spawn(
              crumbTex,
              rand(-0.25, 0.25),
              0.85,
              1.55,
              rand(-0.5, 0.5),
              rand(0.5, 1.1),
              rand(0.2, 0.6),
              0.7,
              0.13,
              { grav: -3.2 },
            ),
          );
          tailAmp = 0.45;
          tailSpd = 3;
        }
        if (el > 2.6) {
          happyT = 1;
          once("fh", () => hearts(3));
        }
      } else if (act === "play") {
        ballT = el < 2.7 ? 1 : 0;
        if (el > 0.2 && el < 2.6) {
          jumpT = Math.abs(Math.sin((el - 0.2) * 6)) * 0.55;
          lookBiasT = Math.sin(el * 2.2) * 0.5;
          every("pl", dt, 0.5, () => sparkles(1, 1.2));
        } else jumpT = 0;
        leanT = 0.1;
        tailAmp = 0.6;
        tailSpd = 4;
        if (el > 2.6) {
          happyT = 1;
          once("ph", () => hearts(2));
        }
      } else if (act === "pet") {
        happyT = 1;
        tailAmp = 0.6;
        tailSpd = 5;
        squishT = Math.sin(el * 10) * 0.05;
        every("h", dt, 0.28, () => hearts(1, 0.5));
      } else if (act === "bath") {
        waterT = el < 3.4 ? 1 : 0;
        happyT = 1;
        tailAmp = 0.4;
        tailSpd = 4;
        if (el < 3.2) {
          wiggleT = Math.sin(el * 22) * 0.1;
          every("b", dt, 0.07, () =>
            spawn(
              bubbleTex,
              rand(-1.2, 1.2),
              rand(0.2, 1.6),
              rand(0, 1.1),
              rand(-0.15, 0.15),
              rand(0.5, 1.1),
              0,
              rand(1.2, 2),
              rand(0.18, 0.42),
            ),
          );
        } else {
          every("bs", dt, 0.12, () => sparkles(1, 1));
        }
      } else if (act === "gift") {
        const opened = el > 1.0;
        if (opened) {
          happyT = 1;
          tailAmp = 0.6;
          tailSpd = 4;
          once("g", () => {
            hearts(4, 0.9);
            sparkles(8, 1.2);
          });
          if (el > 1.1 && el < 2.4)
            jumpT = Math.abs(Math.sin((el - 1.1) * 7)) * 0.5;
          else jumpT = 0;
        } else leanT = 0.25;
      }

      /* wake-up stretch + yawn */
      if (!act && waking) {
        const k = Math.sin((Math.PI * we) / 1.1);
        squishT = -0.16 * k;
        mouthT = k;
      }
      /* poke squash */
      const pe = t - A.pokeAt;
      if (pe < 0.35) squishT += 0.12 * Math.sin((Math.PI * pe) / 0.35);

      /* smooth state */
      A.lie = damp(A.lie, lieT, 3.2, dt);
      A.lean = damp(A.lean, leanT, 8, dt);
      A.happy = damp(A.happy, happyT, 10, dt);
      A.droop = damp(A.droop, droopT, 4, dt);
      A.mouth = damp(A.mouth, mouthT, 22, dt);
      A.squish = damp(A.squish, squishT, 14, dt);
      A.dim = damp(A.dim, dimT, 2.2, dt);
      A.tailAmp = damp(A.tailAmp, tailAmp, 4, dt);
      A.tailSpd = damp(A.tailSpd, tailSpd, 4, dt);
      A.eyeOpen = damp(A.eyeOpen, eyeT, 8, dt);
      A.jump = jumpT !== null ? jumpT * motion : damp(A.jump, 0, 14, dt);
      A.wiggle =
        wiggleT !== null ? wiggleT * motion : damp(A.wiggle, 0, 12, dt);
      A.bowl = damp(A.bowl, bowlT, 8, dt);
      A.ball = damp(A.ball, ballT, 8, dt);
      A.water = damp(A.water, waterT, 4, dt);
      A.lookBias = damp(A.lookBias, lookBiasT, 6, dt);
      A.drag = damp(A.drag, A.dragTarget, 10, dt);

      const L = A.lie;

      /* pointer look */
      const idleSway = A.pointer.active ? 0 : Math.sin(t * 0.35) * 0.18;
      A.look.x = damp(A.look.x, A.pointer.x * 0.55 + idleSway, 5, dt);
      A.look.y = damp(A.look.y, -A.pointer.y * 0.25, 5, dt);
      const lookFade = (1 - A.lean * 0.8) * (1 - L * 0.9);

      /* root */
      pet.position.y = A.jump;
      pet.rotation.y = A.drag * 0.9 + Math.sin(t * 0.5) * 0.04 * (1 - L);
      pet.rotation.z = L * 0.08 + A.wiggle * 0.5;
      const sq = A.squish;
      pet.scale.set(1 + sq, 1 - sq, 1 + sq);

      /* breathing */
      const breath = Math.sin(t * (L > 0.5 ? 1.3 : 2.2));
      const amp = lerp(0.025, 0.055, L);
      bodyMesh.scale.set(
        lerp(1, 1.25, L) * (1 + breath * amp * 0.3),
        lerp(0.9, 0.62, L) * (1 + breath * amp),
        lerp(1, 1.15, L),
      );
      bodyMesh.position.y = lerp(0.72, 0.5, L);
      belly.position.y = lerp(0.66, 0.5, L);
      belly.position.z = lerp(0.5, 0.6, L);
      belly.scale.set(
        0.95 * lerp(1, 1.2, L),
        lerp(0.95, 0.6, L) * (1 + breath * amp),
        0.62,
      );

      /* head */
      head.position.set(
        0,
        lerp(
          1.75 - 0.3 * A.lean - A.droop * 0.1 + bob + breath * 0.012,
          1.05,
          L,
        ),
        lerp(0.05 + 0.3 * A.lean, 0.6, L),
      );
      head.rotation.x =
        0.5 * A.lean + 0.12 * A.droop + A.look.y * lookFade + lerp(0, 0.1, L);
      head.rotation.y = (A.look.x + A.lookBias) * lookFade + A.wiggle * 0.6;
      head.rotation.z =
        A.droop * 0.1 +
        Math.sin(t * 0.7) * 0.02 * (1 - L) +
        0.22 * L +
        A.wiggle;

      /* ears */
      const flick = Math.pow(Math.max(0, Math.sin(t * 1.3 + 1)), 24) * 0.25;
      ears.forEach(({ g, side }, i) => {
        const base = 0.35 + A.droop * 0.4 + L * 0.6 + (i === 0 ? flick : 0);
        g.rotation.z = -side * base;
      });

      /* eyes */
      if (t > A.nextBlink) {
        A.blinkAt = t;
        A.nextBlink = t + rand(2, 5.5);
      }
      const bt = t - A.blinkAt;
      const blink = bt < 0.14 ? Math.sin((Math.PI * bt) / 0.14) : 0;
      const sleepy = L > 0.6 || (!act && we < 0.8);
      const happyMode = A.happy > 0.5 && !sleepy;
      eyesOpen.visible = !sleepy && !happyMode;
      eyesHappy.visible = happyMode;
      eyesSleep.visible = sleepy;
      eyeGroups.forEach((g) => {
        g.scale.y = Math.max(0.1, A.eyeOpen * (1 - 0.9 * blink));
      });

      /* beak */
      lowerBeak.rotation.x = A.mouth * 0.6;

      /* flippers + feet */
      const flap = A.happy > 0.5 ? Math.sin(t * 10) * 0.35 + 0.3 : 0;
      arms.forEach((a2, i) => {
        const sd = i === 0 ? -1 : 1;
        a2.position.set(
          sd * lerp(0.86, 0.92, L),
          lerp(0.85, 0.55, L),
          lerp(0.1, 0.35, L),
        );
        a2.rotation.z = sd * (0.35 + flap + L * 0.5);
      });
      feet.forEach((f, i) => {
        const sd = i === 0 ? -1 : 1;
        f.position.x = sd * lerp(0.35, 0.5, L);
        f.position.z = lerp(0.55, 0.75, L);
        f.position.y = lerp(0.1, 0.08, L);
      });

      /* tail */
      A.tailPhase += dt * A.tailSpd * 3;
      tail.rotation.y = Math.sin(A.tailPhase) * A.tailAmp * 0.9;
      tail.rotation.x =
        lerp(-0.15, 0.05, L) + Math.sin(A.tailPhase * 0.5) * 0.04;
      tail.position.y = lerp(0.5, 0.35, L);

      /* accessories */
      bow.visible = acc === "bow";
      crown.visible = acc === "crown";
      scarf.visible = acc === "scarf";

      /* shadow */
      const sc = 1 - A.jump * 0.35 + L * 0.2;
      shadow.scale.set(sc, sc, sc);
      shadow.material.opacity = 1 - A.jump * 0.4;

      /* props */
      bowl.visible = A.bowl > 0.02;
      bowl.scale.setScalar(Math.max(0.001, A.bowl));
      const foodK = act === "feed" ? 1 - clamp((el - 0.4) / 2.2) * 0.92 : 1;
      fish.scale.setScalar(Math.max(0.05, foodK));
      food.scale.set(1, 1, 1);

      yarn.visible = A.ball > 0.02;
      if (yarn.visible) {
        const e = act === "play" ? el : 0;
        yarn.position.set(
          Math.sin(e * 2.2) * 1.5,
          0.32 + Math.abs(Math.sin(e * 6 + 0.5)) * 0.9,
          1.7,
        );
        yarn.rotation.x += dt * 6;
        yarn.rotation.z += dt * 3;
        yarn.scale.setScalar(Math.max(0.001, A.ball));
      }

      if (act === "gift" && el < 3.0) {
        gift.visible = true;
        const y = el < 0.6 ? lerp(5, 0, easeOut(el / 0.6)) : 0;
        gift.position.y = y;
        gift.rotation.y = el < 0.6 ? el * 3 : 0;
        const lidK = clamp((el - 1.0) / 0.8);
        lid.position.set(lidK * 0.3, 0.58 + easeOut(lidK) * 1.1, 0);
        lid.rotation.z = lidK * 0.8;
        lid.visible = lidK < 1 || el < 1.8;
        lid.scale.setScalar(1 - clamp((el - 1.4) / 0.6) * 0.9);
        const away = el > 2.5 ? 1 - clamp((el - 2.5) / 0.5) : 1;
        gift.scale.setScalar(Math.max(0.001, away));
      } else gift.visible = false;

      water.visible = A.water > 0.02;
      water.scale.setScalar(
        Math.max(0.001, A.water) * (1 + Math.sin(t * 3) * 0.015),
      );

      pillow.visible = L > 0.05;
      pillow.scale.set(1.4 * L, 0.32 * L, 1.05 * L);

      /* night tint */
      hemi.intensity = 1.1 * (1 - 0.35 * A.dim);
      sun.intensity = 1.6 * (1 - 0.5 * A.dim);
      hemi.color.copy(hemiBase).lerp(hemiNight, A.dim);
      sun.color.copy(sunBase).lerp(sunNight, A.dim);

      /* particles */
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.age += dt;
        const k = p.age / p.life;
        if (k >= 1) {
          scene.remove(p.s);
          p.mat.dispose();
          particles.splice(i, 1);
          continue;
        }
        p.vy += p.grav * dt;
        p.s.position.x += p.vx * dt;
        p.s.position.y += p.vy * dt;
        p.s.position.z += p.vz * dt;
        p.mat.opacity =
          k < 0.15 ? k / 0.15 : 1 - Math.pow((k - 0.15) / 0.85, 1.5);
        p.s.scale.setScalar(p.size * (1 + p.grow * k));
        p.mat.rotation += p.rot * dt;
      }
    }

    /* ---------- sizing ---------- */
    const resize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w / h < 1.05 ? 41 : 35;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    /* ---------- input: look, drag-to-rotate, tap ---------- */
    const dom = renderer.domElement;
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const hitPet = (e) => {
      const r = dom.getBoundingClientRect();
      ndc.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        -((e.clientY - r.top) / r.height) * 2 + 1,
      );
      ray.setFromCamera(ndc, camera);
      return ray.intersectObject(pet, true).length > 0;
    };
    let press = null;

    const onMove = (e) => {
      const r = dom.getBoundingClientRect();
      A.pointer.x = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
      A.pointer.y = clamp(-(((e.clientY - r.top) / r.height) * 2 - 1), -1, 1);
      A.pointer.active = true;
      if (press) {
        const dx = e.clientX - press.x;
        if (Math.abs(dx) > 6) press.moved = true;
        if (press.moved) A.dragTarget = clamp(dx / 110, -1, 1);
      }
    };
    const onDown = (e) => {
      press = { x: e.clientX, moved: false, onPet: hitPet(e) };
      try {
        dom.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };
    const onUp = () => {
      if (press && !press.moved && press.onPet) {
        A.pokeAt = A.time;
        petSounds.poke();
        propsRef.current.onTap?.();
      }
      press = null;
      A.dragTarget = 0;
    };
    const onLeave = () => {
      A.pointer.active = false;
      A.pointer.x = 0;
      A.pointer.y = 0;
    };
    dom.addEventListener("pointermove", onMove);
    dom.addEventListener("pointerdown", onDown);
    dom.addEventListener("pointerup", onUp);
    dom.addEventListener("pointercancel", onUp);
    dom.addEventListener("pointerleave", onLeave);

    /* ---------- loop ---------- */
    let raf = 0;
    let last = performance.now();
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      frame(dt);
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(loop);

    /* ---------- cleanup ---------- */
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      dom.removeEventListener("pointermove", onMove);
      dom.removeEventListener("pointerdown", onDown);
      dom.removeEventListener("pointerup", onUp);
      dom.removeEventListener("pointercancel", onUp);
      dom.removeEventListener("pointerleave", onLeave);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            m.dispose(),
          );
        }
      });
      textures.forEach((tx) => tx.dispose());
      renderer.dispose();
      if (dom.parentNode === mount) mount.removeChild(dom);
      apiRef.current = null;
    };
  }, []);

  /* ---------- react to actions ---------- */
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    apiRef.current?.setAction(action || null);
  }, [action, actionId]);

  return (
    <div
      ref={mountRef}
      className="relative h-80 w-full select-none"
      style={{ touchAction: "pan-y" }}
      role="img"
      aria-label="Your 3D pet"
    />
  );
}
