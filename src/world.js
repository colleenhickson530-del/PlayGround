import * as THREE from 'three';
import { LOTS, DISTRICTS, NPC_NAMES, NPC_LINES, CAR_MODELS } from './data.js';

const TAU = Math.PI * 2;
let seed = 3120;
function rand() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}
const pick = arr => arr[Math.floor(rand() * arr.length)];

const MAT = {
  asphalt: new THREE.MeshStandardMaterial({ color: 0x161a15, roughness: 0.78, metalness: 0.16 }),
  sidewalk: new THREE.MeshStandardMaterial({ color: 0x2b2f27, roughness: 0.9 }),
  curb: new THREE.MeshStandardMaterial({ color: 0x555b4b, roughness: 0.85 }),
  darkMetal: new THREE.MeshStandardMaterial({ color: 0x1b201a, roughness: 0.56, metalness: 0.62 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x555c50, roughness: 0.46, metalness: 0.67 }),
  rust: new THREE.MeshStandardMaterial({ color: 0x6b3e28, roughness: 0.84, metalness: 0.3 }),
  concrete: new THREE.MeshStandardMaterial({ color: 0x54574c, roughness: 0.92 }),
  black: new THREE.MeshStandardMaterial({ color: 0x0b0e0a, roughness: 0.7 }),
  glass: new THREE.MeshStandardMaterial({ color: 0x26332d, roughness: 0.15, metalness: 0.72, transparent: true, opacity: 0.72 }),
  cable: new THREE.MeshStandardMaterial({ color: 0x11130f, roughness: 0.85 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x5d432c, roughness: 0.9 }),
  acid: new THREE.MeshStandardMaterial({ color: 0xd8ff45, emissive: 0xd8ff45, emissiveIntensity: 1.5, toneMapped: false }),
  orange: new THREE.MeshStandardMaterial({ color: 0xff7a2f, emissive: 0xff7a2f, emissiveIntensity: 1.35, toneMapped: false }),
  pink: new THREE.MeshStandardMaterial({ color: 0xff4fba, emissive: 0xff4fba, emissiveIntensity: 1.3, toneMapped: false }),
  cyan: new THREE.MeshStandardMaterial({ color: 0x66e7d5, emissive: 0x66e7d5, emissiveIntensity: 1.25, toneMapped: false }),
  red: new THREE.MeshStandardMaterial({ color: 0xff4545, emissive: 0xff4545, emissiveIntensity: 1.2, toneMapped: false }),
};

const WINDOW_COLORS = [0xcfe3a0, 0xffcf82, 0x88e8d9, 0xaeb8a3, 0xff8bc9, 0xdfe5c9];

function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  return mesh;
}
function cyl(rt, rb, h, seg, mat, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  mesh.position.set(x, y, z);
  return mesh;
}

export function makeTextTexture(text, opts = {}) {
  const {
    width = 512, height = 256, color = '#d8ff45', bg = 'rgba(4,6,4,.88)', font = '900 128px "Barlow Condensed", sans-serif',
    vertical = false, border = true, glow = 26,
  } = opts;
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);
  if (border) {
    ctx.strokeStyle = color; ctx.globalAlpha = 0.65; ctx.lineWidth = Math.max(2, width / 160);
    ctx.strokeRect(8, 8, width - 16, height - 16);
    ctx.globalAlpha = 1;
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = font;
  ctx.shadowColor = color; ctx.shadowBlur = glow;
  ctx.fillStyle = color;
  if (vertical) {
    const chars = [...text];
    const step = Math.min(height / (chars.length + 1), 76);
    chars.forEach((ch, i) => ctx.fillText(ch, width / 2, step * (i + 1)));
  } else {
    const max = width - 40;
    let size = parseInt(font.match(/(\d+)px/)?.[1] || 128, 10);
    while (ctx.measureText(text).width > max && size > 18) {
      size -= 4; ctx.font = font.replace(/\d+px/, `${size}px`);
    }
    ctx.fillText(text, width / 2, height / 2 + 4);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function signPlane(text, w, h, color, opts = {}) {
  const tex = makeTextTexture(text, { color, bg: opts.bg || 'rgba(5,8,5,.9)', width: opts.vw || (opts.vertical ? 180 : 512), height: opts.vh || (opts.vertical ? 512 : 220), vertical: opts.vertical, font: opts.font });
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, side: THREE.DoubleSide, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  return mesh;
}

function addWindows(windows, w, d, h, base, colorBias = 0) {
  const floors = Math.max(1, Math.floor((h - 4) / 2.35));
  for (let f = 0; f < floors; f++) {
    const y = 3.5 + f * 2.35;
    const cols = Math.max(2, Math.floor(w / 2.1));
    for (let c = 0; c < cols; c++) {
      if (rand() < 0.22) continue;
      const x = -w / 2 + 1.35 + c * ((w - 2.7) / Math.max(1, cols - 1));
      const col = WINDOW_COLORS[(Math.floor(rand() * WINDOW_COLORS.length) + colorBias) % WINDOW_COLORS.length];
      if (rand() > 0.16) windows.push({ x: base.x + x, y: base.y + y, z: base.z + d / 2 + 0.012, ry: 0, color: col, s: 0.65 + rand() * 0.4 });
      if (rand() > 0.35) windows.push({ x: base.x + x, y: base.y + y, z: base.z - d / 2 - 0.012, ry: Math.PI, color: col, s: 0.6 + rand() * 0.35 });
    }
    const sideCols = Math.max(1, Math.floor(d / 2.4));
    for (let c = 0; c < sideCols; c++) {
      if (rand() < 0.3) continue;
      const z = -d / 2 + 1.35 + c * ((d - 2.7) / Math.max(1, sideCols - 1));
      const col = pick(WINDOW_COLORS);
      if (rand() > 0.2) windows.push({ x: base.x + w / 2 + 0.012, y: base.y + y, z: base.z + z, ry: Math.PI / 2, color: col, s: 0.55 + rand() * 0.3 });
      if (rand() > 0.45) windows.push({ x: base.x - w / 2 - 0.012, y: base.y + y, z: base.z + z, ry: -Math.PI / 2, color: col, s: 0.55 + rand() * 0.3 });
    }
  }
}

function building(spec, windows, colliders, scene) {
  const { x, z, w, d, h, color, sign, signColor = '#d8ff45', style = 'stack', district = 'rustmarket' } = spec;
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.76, metalness: 0.2 });
  const tower = box(w, h, d, mat, 0, h / 2, 0);
  g.add(tower);
  const trimMat = rand() > 0.5 ? MAT.darkMetal : MAT.rust;
  g.add(box(w + 0.4, 0.35, d + 0.4, trimMat, 0, h - 0.08, 0));
  g.add(box(w + 0.18, 0.3, d + 0.18, trimMat, 0, 0.18, 0));
  if (h > 10) {
    g.add(box(w * 0.7, h * 0.55, d * 0.7, new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.72), roughness: 0.8 }), 0, h + h * 0.27, 0));
    g.add(box(w * 0.9, 0.22, d * 0.9, trimMat, 0, h * 1.55, 0));
  }
  // facade ribs
  const ribMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(1.24), roughness: 0.8 });
  const ribs = Math.max(2, Math.floor(w / 3.4));
  for (let i = 0; i <= ribs; i++) {
    const rx = -w / 2 + (w / ribs) * i;
    g.add(box(0.12, h - 0.8, 0.16, ribMat, rx, h / 2, d / 2 + 0.04));
  }
  // ground floor awning
  if (style !== 'shack') {
    const awning = box(Math.min(w - 1, 6), 0.16, 1.55, trimMat, 0, 3.1, d / 2 + 0.75);
    awning.rotation.x = 0.12; g.add(awning);
  }
  if (style === 'industrial') {
    const pipeMat = MAT.rust;
    for (let i = 0; i < 3; i++) {
      const p = cyl(0.22, 0.22, h * 0.9, 8, pipeMat, -w / 2 - 0.4 + i * 0.7, h * 0.45, d / 2 + 0.3);
      p.rotation.z = 0.04 * (i - 1); g.add(p);
      const elbow = cyl(0.28, 0.28, 0.5, 8, pipeMat, -w / 2 - 0.4 + i * 0.7, h * 0.1, d / 2 + 0.5);
      elbow.rotation.x = Math.PI / 2; g.add(elbow);
    }
    g.add(box(w * 0.55, 1.8, 0.5, MAT.darkMetal, w * 0.08, h * 0.6, d / 2 + 0.4));
  }
  if (style === 'shack') {
    const roof = box(w + 1, 0.22, d + 1, MAT.rust, 0, h, 0);
    roof.rotation.z = 0.025; g.add(roof);
    for (let i = 0; i < 3; i++) g.add(box(0.16, h, 0.16, MAT.rust, -w / 2 + 0.6 + i * (w - 1.2) / 2, h / 2, d / 2 + 0.2));
  }
  // signage
  if (sign) {
    const sw = Math.min(w * 0.72, 7);
    const plane = signPlane(sign, sw, sw * 0.28, signColor, { font: `900 ${Math.floor(72 + sw * 6)}px "Barlow Condensed", sans-serif` });
    plane.position.set(0, Math.min(4.3, h * 0.68), d / 2 + 0.1);
    g.add(plane);
    const under = box(sw + 0.25, 0.06, 0.08, new THREE.MeshBasicMaterial({ color: signColor, toneMapped: false }), 0, Math.min(4.3, h * 0.68) - sw * 0.15, d / 2 + 0.14);
    g.add(under);
    if (h > 12) {
      const vert = signPlane(sign.split(' ')[0], 1.1, 4.2, signColor, { vertical: true, font: '900 92px "Barlow Condensed", sans-serif' });
      vert.position.set(w / 2 + 0.05, h * 0.55, d * 0.18);
      vert.rotation.y = Math.PI / 2;
      g.add(vert);
    }
  }
  // roof clutter
  const cap = rand();
  if (cap > 0.35) {
    for (let i = 0; i < 3; i++) {
      const tank = cyl(0.5, 0.5, 1.1, 8, MAT.metal, (rand() - 0.5) * w * 0.5, h + 0.7, (rand() - 0.5) * d * 0.5);
      g.add(tank);
    }
    const antenna = cyl(0.06, 0.06, 4 + rand() * 4, 5, MAT.metal, (rand() - 0.5) * w * 0.4, h + 3, (rand() - 0.5) * d * 0.3);
    g.add(antenna);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 4), MAT.red);
    bulb.position.set(antenna.position.x, antenna.position.y + 2.4, antenna.position.z);
    g.add(bulb);
  }
  scene.add(g);
  addWindows(windows, w, d, h, { x, y: 0, z }, district === 'neon' ? 2 : district === 'foundry' ? 1 : 0);
  colliders.push({ minX: x - w / 2 - 0.25, maxX: x + w / 2 + 0.25, minZ: z - d / 2 - 0.25, maxZ: z + d / 2 + 0.25, y: h });
  return g;
}

export function createCharacter(opts = {}) {
  const skin = opts.skin || '#c98e63';
  const hair = opts.hair || '#141311';
  const top = opts.top || '#363b2f';
  const bottom = opts.bottom || '#232820';
  const jacket = opts.jacket || '#181d16';
  const accent = opts.accent || '#d8ff45';
  const style = opts.hairStyle || 'CROP';
  const scale = opts.scale || 1;
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const skinMat = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.75 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hair, roughness: 0.92 });
  const topMat = new THREE.MeshStandardMaterial({ color: top, roughness: 0.86 });
  const jacketMat = new THREE.MeshStandardMaterial({ color: jacket, roughness: 0.78, metalness: 0.1 });
  const bottomMat = new THREE.MeshStandardMaterial({ color: bottom, roughness: 0.88 });
  const accentMat = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.5, roughness: 0.5 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.62, 3, 7), jacketMat);
  torso.position.y = 1.42; torso.scale.set(1.13, 1, 0.77); body.add(torso);
  const shirt = box(0.4, 0.48, 0.09, topMat, 0, 1.43, 0.27); body.add(shirt);
  const belt = box(0.64, 0.09, 0.35, accentMat, 0, 1.02, 0); body.add(belt);
  const neck = cyl(0.11, 0.12, 0.15, 6, skinMat, 0, 1.82, 0); body.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.235, 9, 7), skinMat);
  head.scale.set(0.94, 1.12, 0.94); head.position.y = 2.02; body.add(head);
  // face visor / eyes
  const visor = box(0.28, 0.055, 0.04, new THREE.MeshStandardMaterial({ color: 0x11140f, roughness: 0.4, metalness: .6 }), 0, 2.045, 0.218); body.add(visor);
  const eyeL = box(0.035, 0.024, 0.012, accentMat, -0.07, 2.045, 0.24); body.add(eyeL);
  const eyeR = eyeL.clone(); eyeR.position.x = 0.07; body.add(eyeR);
  // hair
  if (style !== 'SHAVED') {
    if (style === 'MOHAWK') {
      const m = box(0.1, 0.13, 0.38, hairMat, 0, 2.225, -0.01); body.add(m);
      for (let i = 0; i < 3; i++) { const s = box(0.08, 0.24 + i * 0.02, 0.06, hairMat, 0, 2.28 + i * 0.03, -0.15 + i * 0.15); body.add(s); }
    } else if (style === 'LONG') {
      const h = box(0.36, 0.34, 0.32, hairMat, 0, 2.14, -0.02); body.add(h);
      const backHair = box(0.29, 0.47, 0.12, hairMat, 0, 1.94, -0.18); body.add(backHair);
    } else if (style === 'BUN') {
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6), hairMat); h.scale.set(1, .58, 1); h.position.set(0, 2.16, -.03); body.add(h);
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.14, 7, 5), hairMat); bun.position.set(0, 2.23, -.22); body.add(bun);
    } else if (style === 'BRAIDS') {
      const h = box(0.34, 0.25, 0.3, hairMat, 0, 2.16, -0.02); body.add(h);
      for (let i = 0; i < 3; i++) body.add(box(0.055, 0.46, 0.055, hairMat, -0.14 + i * 0.14, 1.91, -0.2));
    } else {
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 5), hairMat); h.scale.set(1.02, .58, 1.03); h.position.set(0, 2.16, -0.02); body.add(h);
    }
  }
  // arms
  const armL = new THREE.Group(); armL.position.set(-0.42, 1.68, 0);
  const armR = new THREE.Group(); armR.position.set(0.42, 1.68, 0);
  const armMeshL = box(0.16, 0.72, 0.19, jacketMat, 0, -0.32, 0); armMeshL.userData.depth = 1; armL.add(armMeshL);
  const handL = box(0.13, 0.17, 0.16, skinMat, 0, -0.71, 0); armL.add(handL);
  armR.add(armMeshL.clone()); armR.add(handL.clone());
  body.add(armL); body.add(armR);
  // legs
  const legL = new THREE.Group(); legL.position.set(-0.17, 1.01, 0);
  const legR = new THREE.Group(); legR.position.set(0.17, 1.01, 0);
  const thighL = box(0.24, 0.58, 0.27, bottomMat, 0, -0.28, 0); legL.add(thighL);
  const shinL = box(0.21, 0.43, 0.23, bottomMat, 0, -0.76, 0); legL.add(shinL);
  const bootL = box(0.23, 0.16, 0.37, MAT.black, 0, -1.02, 0.06); legL.add(bootL);
  const stripe = box(0.245, 0.06, 0.28, accentMat, 0, -0.42, 0); legL.add(stripe);
  legR.add(thighL.clone()); legR.add(shinL.clone()); legR.add(bootL.clone()); const st2 = stripe.clone(); legR.add(st2);
  body.add(legL); body.add(legR);
  root.scale.setScalar(scale);
  root.userData.rig = { body, armL, armR, legL, legR, head };
  root.userData.look = opts;
  // blob shadow
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.55, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.31, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.017; root.add(shadow);
  return root;
}

export function createCar(config = {}, opts = {}) {
  const paint = config.paint || '#8f3b2b';
  const rim = config.rim || '#b9c0b5';
  const underglow = config.underglow || '#ff4fba';
  const root = new THREE.Group();
  const car = new THREE.Group(); root.add(car);
  const paintMat = new THREE.MeshStandardMaterial({ color: paint, roughness: 0.3, metalness: 0.52 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x11140f, roughness: 0.55, metalness: 0.4 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x111c1c, roughness: 0.08, metalness: 0.82, transparent: true, opacity: .78 });
  const chrome = new THREE.MeshStandardMaterial({ color: rim, roughness: 0.25, metalness: 0.95 });
  const body = box(2.05, 0.48, 4.1, paintMat, 0, 0.63, 0); car.add(body);
  const hood = box(1.92, 0.15, 1.3, paintMat, 0, 0.9, 1.25); hood.rotation.x = -0.035; car.add(hood);
  const trunk = box(1.94, 0.18, 0.9, paintMat, 0, 0.88, -1.55); car.add(trunk);
  const cabin = box(1.66, 0.58, 1.78, paintMat, 0, 1.16, -0.2); car.add(cabin);
  const roof = box(1.58, 0.1, 1.58, trim, 0, 1.48, -0.22); car.add(roof);
  const windshieldF = box(1.48, 0.5, 0.06, glass, 0, 1.2, 0.73); windshieldF.rotation.x = -0.55; car.add(windshieldF);
  const windshieldB = box(1.48, 0.42, 0.06, glass, 0, 1.2, -1.1); windshieldB.rotation.x = 0.55; car.add(windshieldB);
  const sideGlassL = box(0.04, 0.36, 1.18, glass, -0.84, 1.23, -0.18); car.add(sideGlassL);
  const sideGlassR = sideGlassL.clone(); sideGlassR.position.x = 0.84; car.add(sideGlassR);
  const bumperF = box(2.02, 0.18, 0.18, trim, 0, 0.46, 2.05); car.add(bumperF);
  const bumperB = bumperF.clone(); bumperB.position.z = -2.05; car.add(bumperB);
  const grille = box(0.95, 0.16, 0.04, trim, 0, 0.6, 2.08); car.add(grille);
  const headMat = new THREE.MeshBasicMaterial({ color: 0xf4ffbe, toneMapped: false });
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2929, toneMapped: false });
  car.add(box(0.48, 0.14, 0.06, headMat, -0.62, 0.68, 2.08));
  car.add(box(0.48, 0.14, 0.06, headMat, 0.62, 0.68, 2.08));
  car.add(box(0.55, 0.1, 0.05, tailMat, -0.6, 0.67, -2.08));
  car.add(box(0.55, 0.1, 0.05, tailMat, 0.6, 0.67, -2.08));
  // wheels
  const wheelGeo = new THREE.CylinderGeometry(0.43, 0.43, 0.31, 12);
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x0b0d0b, roughness: 0.95 });
  const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.325, 10);
  const wheels = [];
  [[-1.02, 1.28], [1.02, 1.28], [-1.02, -1.3], [1.02, -1.3]].forEach(([x, z]) => {
    const w = new THREE.Mesh(wheelGeo, tireMat);
    w.rotation.z = Math.PI / 2; w.position.set(x, 0.45, z); car.add(w);
    const r = new THREE.Mesh(rimGeo, chrome); r.rotation.z = Math.PI / 2; r.position.set(x + Math.sign(x) * 0.01, 0.45, z); car.add(r);
    wheels.push(w);
  });
  // side stripe / decal
  if (config.decal === 'stripe') {
    const stripeMat = new THREE.MeshStandardMaterial({ color: config.decalColor || '#d8ff45', roughness: .45, metalness: .3 });
    car.add(box(2.08, 0.09, 1.3, stripeMat, 0, 0.85, 0.15));
    car.add(box(0.02, 0.28, 2.9, stripeMat, -1.035, 0.66, -0.15));
    car.add(box(0.02, 0.28, 2.9, stripeMat, 1.035, 0.66, -0.15));
  } else if (config.decal === 'tribal') {
    const stripeMat = new THREE.MeshStandardMaterial({ color: config.decalColor || '#ff7a2f', roughness: .4, metalness: .4 });
    for (let i = 0; i < 4; i++) {
      const slash = box(0.02, 0.18, 0.55 - i * 0.08, stripeMat, -1.036, 0.68, 0.55 - i * 0.35);
      slash.rotation.x = -0.4; car.add(slash);
      const slash2 = slash.clone(); slash2.position.x = 1.036; car.add(slash2);
    }
  }
  if (config.spoiler) {
    const spoilerMat = new THREE.MeshStandardMaterial({ color: config.spoilerColor || '#151914', roughness: .35, metalness: .65 });
    car.add(box(1.9, 0.07, 0.46, spoilerMat, 0, 1.23, -1.93));
    car.add(box(0.07, 0.32, 0.18, spoilerMat, -0.7, 1.06, -1.92));
    car.add(box(0.07, 0.32, 0.18, spoilerMat, 0.7, 1.06, -1.92));
  }
  if (config.headlights) {
    const pl = new THREE.PointLight(0xf4ffcc, 22, 15, 2);
    pl.position.set(0, 0.75, 2.5); car.add(pl);
  }
  // underglow
  const glowMat = new THREE.MeshBasicMaterial({ color: underglow, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 4.6), glowMat);
  glow.rotation.x = -Math.PI / 2; glow.position.y = 0.035; car.add(glow);
  const glowLight = new THREE.PointLight(underglow, config.underglow ? 12 : 4, 7, 2);
  glowLight.position.set(0, 0.18, 0); car.add(glowLight);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.45, 4.5), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .35, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.008; car.add(shadow);
  root.userData.car = { wheels, paintMat, chrome, glowMat, glowLight, config };
  root.traverse(o => { if (o.isMesh) o.userData.carPart = true; });
  return root;
}

function createHomeLot(lot, scene) {
  const group = new THREE.Group();
  group.position.set(lot.pos[0], 0, lot.pos[1]);
  const slab = box(lot.size * 2, 0.22, lot.size * 2, new THREE.MeshStandardMaterial({ color: 0x565b4e, roughness: .94 }), 0, 0.12, 0);
  group.add(slab);
  const edgeMat = MAT.darkMetal;
  group.add(box(lot.size * 2 + .4, .3, .4, edgeMat, 0, .2, -lot.size));
  group.add(box(lot.size * 2 + .4, .3, .4, edgeMat, 0, .2, lot.size));
  group.add(box(.4, .3, lot.size * 2, edgeMat, -lot.size, .2, 0));
  group.add(box(.4, .3, lot.size * 2, edgeMat, lot.size, .2, 0));
  // floor grid glow
  const gridMat = new THREE.LineBasicMaterial({ color: 0xd8ff45, transparent: true, opacity: .14 });
  const pts = [];
  for (let i = -lot.size; i <= lot.size; i += 2) {
    pts.push(new THREE.Vector3(i, .24, -lot.size), new THREE.Vector3(i, .24, lot.size));
    pts.push(new THREE.Vector3(-lot.size, .24, i), new THREE.Vector3(lot.size, .24, i));
  }
  const grid = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), gridMat);
  group.add(grid);
  // posts and wire
  const postMat = MAT.metal;
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const px = Math.cos(a) * (lot.size - .6), pz = Math.sin(a) * (lot.size - .6);
    group.add(cyl(.06, .07, 2.4, 5, postMat, px, 1.45, pz));
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(.08, 5, 4), MAT.acid);
    bulb.position.set(px, 2.68, pz); group.add(bulb);
  }
  // lot marker
  const sign = signPlane(`${lot.name.toUpperCase()} // ${lot.district.toUpperCase()}`, 6.5, 1.1, lot.owned ? '#d8ff45' : '#ff7a2f', { font: '900 54px "Barlow Condensed", sans-serif' });
  sign.position.set(0, 3.2, -lot.size - .3); group.add(sign);
  group.add(cyl(.08, .09, 3.2, 6, MAT.metal, -3.3, 1.6, -lot.size - .2));
  group.add(cyl(.08, .09, 3.2, 6, MAT.metal, 3.3, 1.6, -lot.size - .2));
  // perimeter lighting rope
  const ropePts = [];
  const step = (lot.size * 2) / 22;
  for (let i = 0; i <= 22; i++) ropePts.push(new THREE.Vector3(-lot.size + i * step, 1.8, -lot.size));
  for (let i = 0; i <= 22; i++) ropePts.push(new THREE.Vector3(-lot.size + i * step, 1.8, lot.size));
  const rope = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ropePts), new THREE.LineBasicMaterial({ color: lot.owned ? 0xd8ff45 : 0x6b3e28, transparent: true, opacity: .7 }));
  group.add(rope);
  scene.add(group);
  return group;
}

function makeLamp(x, z, color = 0xd8ff45, height = 5.4) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.add(cyl(.06, .09, height, 5, MAT.metal, 0, height / 2, 0));
  const arm = box(1.1, .07, .07, MAT.metal, .45, height, 0); g.add(arm);
  const bulbMat = new THREE.MeshBasicMaterial({ color, toneMapped: false });
  const bulb = box(.5, .05, .14, bulbMat, .95, height - .04, 0); g.add(bulb);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.8), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .045, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.rotation.x = -Math.PI / 2; glow.position.set(.95, .02, 0); g.add(glow);
  return g;
}

function createCrate(x, z, scale = 1, rot = 0, mat = MAT.wood) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
  const c = box(.8 * scale, .72 * scale, .8 * scale, mat, 0, .36 * scale, 0); g.add(c);
  const band = box(.84 * scale, .08 * scale, .84 * scale, MAT.darkMetal, 0, .38 * scale, 0); g.add(band);
  return g;
}

function makeBeacon(district, colliders, scene) {
  const g = new THREE.Group();
  const color = new THREE.Color(district.color);
  g.position.set(district.x, 0, district.z);
  const base = box(2.3, .3, 2.3, MAT.darkMetal, 0, .15, 0); g.add(base);
  g.add(cyl(.86, 1, .42, 8, MAT.metal, 0, .55, 0));
  const pylon = cyl(.13, .32, 4.6, 6, MAT.darkMetal, 0, 2.9, 0); g.add(pylon);
  const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .9, toneMapped: false });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.25, .035, 5, 28), ringMat);
  ring.position.y = 3.2; ring.rotation.x = Math.PI / 2; g.add(ring);
  const holo = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 1.1, 20, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .08, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  holo.position.y = 3.6; g.add(holo);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.05, .35, 22, 8, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .09, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  beam.position.y = 12; g.add(beam);
  const label = signPlane(district.owned ? `${district.name.toUpperCase()} // SECURED` : `${district.name.toUpperCase()} // UNCLAIMED`, 5.5, .9, district.owned ? '#66e7d5' : district.color, { font: '900 50px "Barlow Condensed", sans-serif' });
  label.position.set(0, 5.9, 0); g.add(label);
  const light = new THREE.PointLight(color, 18, 18, 2); light.position.y = 3.6; g.add(light);
  scene.add(g);
  colliders.push({ minX: district.x - 1.2, maxX: district.x + 1.2, minZ: district.z - 1.2, maxZ: district.z + 1.2, y: 6 });
  return { group: g, ring, holo, beam, light, label, color, secured: district.owned };
}

function makeTrain(scene) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x555c4f, roughness: .35, metalness: .65 });
  const train = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const car = box(5.4, 1.9, 1.75, bodyMat, i * 5.65, 0, 0); train.add(car);
    const glassMat = new THREE.MeshBasicMaterial({ color: 0xffd48c, toneMapped: false });
    for (let j = 0; j < 5; j++) train.add(box(.55, .45, .025, glassMat, i * 5.65 - 1.85 + j * .92, .2, .89));
    train.add(box(5.5, .07, 1.8, MAT.acid, i * 5.65, -.72, 0));
  }
  g.add(train);
  g.position.set(0, 10.4, -28);
  const railL = box(120, .11, .11, MAT.metal, 0, 11.4, -28.95); scene.add(railL);
  const railR = box(120, .11, .11, MAT.metal, 0, 11.4, -27.05); scene.add(railR);
  for (let x = -55; x <= 55; x += 18) {
    scene.add(box(.3, 11, .3, MAT.darkMetal, x, 5.5, -28));
    scene.add(box(.3, 2, 10, MAT.darkMetal, x, 10.8, -28));
  }
  const light = new THREE.PointLight(0xffc46a, 18, 24, 2); light.position.set(0, -.2, 2); train.add(light);
  scene.add(g);
  return { group: g, train, speed: 6.5, min: -75, max: 75 };
}

function createGangster(opts = {}) {
  const c = createCharacter({
    skin: pick(['#9b6444', '#c98e63', '#6c4633', '#3e2d26']),
    hair: '#151311', hairStyle: pick(['SHAVED', 'MOHAWK', 'CROP']),
    top: '#59201e', bottom: '#211c1a', jacket: '#3b1918', accent: '#ff4545',
  });
  const badge = new THREE.Mesh(new THREE.OctahedronGeometry(.12, 0), MAT.red);
  badge.position.y = 2.6; c.add(badge);
  c.userData.gangster = { alive: true, hp: 100, maxHp: 100, cooldown: 0, badge };
  return c;
}

export function buildWorld(scene) {
  seed = 3120;
  const colliders = [];
  const interactables = [];
  const windows = [];
  const npcs = [];
  const gangsters = [];
  const smoke = [];
  const homeGroups = {};
  const beacons = {};
  const districtState = {};

  scene.background = new THREE.Color(0x090d0a);
  scene.fog = new THREE.FogExp2(0x0d120d, 0.0138);
  const hemi = new THREE.HemisphereLight(0xb2c69a, 0x0a0d08, 2.0); scene.add(hemi);
  const amb = new THREE.AmbientLight(0x4b5a43, 1.08); scene.add(amb);
  const dir = new THREE.DirectionalLight(0xdcefc2, 3.0); dir.position.set(-25, 50, 30); scene.add(dir);
  const rim = new THREE.DirectionalLight(0x6fa694, 1.5); rim.position.set(30, 15, -40); scene.add(rim);

  // Ground
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 140), MAT.asphalt);
  ground.rotation.x = -Math.PI / 2; scene.add(ground);
  // damp reflection puddles
  for (let i = 0; i < 13; i++) {
    const p = new THREE.Mesh(new THREE.CircleGeometry(1 + rand() * 2.4, 12), new THREE.MeshStandardMaterial({ color: 0x0a0f0c, roughness: .12, metalness: .9, transparent: true, opacity: .6 }));
    p.scale.x = 1.4 + rand(); p.rotation.x = -Math.PI / 2; p.position.set(-45 + rand() * 90, .012, -38 + rand() * 85); scene.add(p);
  }
  // roads: main vertical
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x1f241d, roughness: .64, metalness: .2 });
  const mainRoad = new THREE.Mesh(new THREE.PlaneGeometry(15, 108), roadMat); mainRoad.rotation.x = -Math.PI / 2; mainRoad.position.set(0, .02, 2); scene.add(mainRoad);
  const crossRoad = new THREE.Mesh(new THREE.PlaneGeometry(112, 11), roadMat); crossRoad.rotation.x = -Math.PI / 2; crossRoad.position.set(0, .025, 0); scene.add(crossRoad);
  // sidewalk strips
  for (const x of [-8.2, 8.2]) {
    const sw = box(1.7, .18, 108, MAT.sidewalk, x, .09, 2); scene.add(sw);
    for (let z = -49; z < 55; z += 5) scene.add(box(.05, .19, .3, MAT.curb, x + (x > 0 ? -.83 : .83), .09, z));
  }
  for (const z of [-6.1, 6.1]) {
    const sw = box(112, .18, 1.7, MAT.sidewalk, 0, .1, z); scene.add(sw);
  }
  // lane markings emissive
  for (let z = -47; z < 50; z += 7) {
    const dash = box(.13, .02, 2.2, new THREE.MeshBasicMaterial({ color: 0x667044, toneMapped: false }), 0, .05, z); scene.add(dash);
  }
  for (let x = -52; x < 57; x += 8) {
    if (Math.abs(x) < 8) continue;
    const dash = box(2.5, .02, .13, new THREE.MeshBasicMaterial({ color: 0x667044, toneMapped: false }), x, .05, 0); scene.add(dash);
  }
  // acid lane glow along market
  scene.add(box(.14, .012, 37, new THREE.MeshBasicMaterial({ color: 0xd8ff45, transparent: true, opacity: .42, toneMapped: false }), -6.8, .055, 25));
  scene.add(box(.14, .012, 37, new THREE.MeshBasicMaterial({ color: 0xd8ff45, transparent: true, opacity: .42, toneMapped: false }), 6.8, .055, 25));

  // Skyline backdrop blocks
  for (let i = 0; i < 25; i++) {
    const x = -78 + rand() * 156;
    const z = -62 + rand() * 8 - (rand() > .55 ? 100 : 0);
    const w = 5 + rand() * 10, d = 5 + rand() * 8, h = 15 + rand() * 38;
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(.19, .12, .09 + rand() * .05), roughness: .9 });
    g.add(box(w, h, d, mat, 0, h / 2, 0));
    g.add(box(w * .7, h * .3, d * .7, mat, 0, h + h * .15, 0));
    scene.add(g);
    addWindows(windows, w, d, h, { x, y: 0, z }, Math.floor(rand() * 3));
  }

  // Main city buildings
  const specs = [
    { x: -21, z: 15, w: 11, d: 9, h: 17, color: 0x3f4637, sign: 'SCRAP & BONE', signColor: '#d8ff45', district: 'rustmarket' },
    { x: 21, z: 14, w: 11, d: 10, h: 23, color: 0x454d3d, sign: 'PODS//07', signColor: '#ff4fba', district: 'rustmarket' },
    { x: -21, z: -14, w: 12, d: 8, h: 14, color: 0x3b4139, sign: 'REALTY', signColor: '#66e7d5', district: 'rustmarket' },
    { x: 21, z: -14, w: 13, d: 9, h: 12, color: 0x4c503f, sign: 'CHOP SHOP', signColor: '#ff7a2f', district: 'rustmarket' },
    { x: 35, z: 15, w: 12, d: 9, h: 31, color: 0x332c3d, sign: 'NOODLE 24H', signColor: '#ff4fba', district: 'neon' },
    { x: 49, z: 12, w: 9, d: 9, h: 25, color: 0x282f34, sign: 'HOTEL//9', signColor: '#66e7d5', district: 'neon' },
    { x: 35, z: -15, w: 12, d: 8, h: 27, color: 0x3b2937, sign: 'NEON ROW', signColor: '#ff4fba', district: 'neon' },
    { x: 48, z: -16, w: 8, d: 7, h: 34, color: 0x282b32, sign: 'DREAM', signColor: '#8e5dff', district: 'neon' },
    { x: -35, z: 15, w: 12, d: 9, h: 20, color: 0x40372e, sign: 'FOUNDRY', signColor: '#ff7a2f', style: 'industrial', district: 'foundry' },
    { x: -49, z: 10, w: 10, d: 11, h: 16, color: 0x353832, sign: 'ORE//CO', signColor: '#ff7a2f', style: 'industrial', district: 'foundry' },
    { x: -35, z: -14, w: 14, d: 8, h: 11, color: 0x45392f, sign: 'MELT', signColor: '#ff7a2f', style: 'industrial', district: 'foundry' },
    { x: -50, z: -12, w: 8, d: 8, h: 19, color: 0x2d3531, sign: 'LIFT 4', signColor: '#66e7d5', style: 'industrial', district: 'foundry' },
    { x: -12, z: -38, w: 9, d: 7, h: 8, color: 0x332825, sign: 'NO LAW', signColor: '#ff4545', style: 'shack', district: 'undercut' },
    { x: 12, z: -39, w: 10, d: 6, h: 7, color: 0x302724, sign: 'BLOOD', signColor: '#ff4545', style: 'shack', district: 'undercut' },
    { x: -22, z: -49, w: 11, d: 8, h: 10, color: 0x2d2522, sign: 'STASH', signColor: '#ff4545', style: 'shack', district: 'undercut' },
    { x: 22, z: -50, w: 9, d: 8, h: 9, color: 0x292322, sign: 'CREW', signColor: '#ff4545', style: 'shack', district: 'undercut' },
    { x: -21, z: 44, w: 13, d: 9, h: 22, color: 0x3b4035, sign: 'SHELTER', signColor: '#d8ff45', district: 'rustmarket' },
    { x: 21, z: 44, w: 13, d: 9, h: 18, color: 0x3c4138, sign: 'CLINIC', signColor: '#66e7d5', district: 'rustmarket' },
    { x: 0, z: -61, w: 24, d: 8, h: 44, color: 0x252b25, sign: 'UNDERNEATH', signColor: '#d8ff45', style: 'industrial', district: 'undercut' },
    { x: -57, z: 26, w: 12, d: 10, h: 24, color: 0x33372e, sign: 'DEPOT', signColor: '#d8ff45' },
    { x: 57, z: 28, w: 10, d: 10, h: 21, color: 0x33372e, sign: 'MOTEL', signColor: '#ff4fba' },
    { x: -55, z: -34, w: 12, d: 10, h: 18, color: 0x2f322d, sign: 'VOID', signColor: '#8e5dff', style: 'industrial' },
    { x: 56, z: -36, w: 11, d: 9, h: 23, color: 0x2e3230, sign: 'CARGO', signColor: '#66e7d5' },
  ];
  for (const spec of specs) building(spec, windows, colliders, scene);

  // Big facade sign at far end
  const bigSign = signPlane('NO GODS ABOVE', 18, 2.4, '#d8ff45', { font: '900 84px "Barlow Condensed", sans-serif' });
  bigSign.position.set(0, 13.5, -56.9); scene.add(bigSign);

  // Instanced windows
  const windowGeo = new THREE.PlaneGeometry(.48, .34);
  const windowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, side: THREE.DoubleSide });
  const inst = new THREE.InstancedMesh(windowGeo, windowMat, windows.length);
  const dummy = new THREE.Object3D();
  windows.forEach((w, i) => {
    dummy.position.set(w.x, w.y, w.z); dummy.rotation.set(0, w.ry, 0); dummy.scale.set(w.s, w.s, w.s); dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
    inst.setColorAt(i, new THREE.Color(w.color).multiplyScalar(.56 + rand() * .46));
  });
  inst.instanceMatrix.needsUpdate = true;
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  scene.add(inst);

  // ---- Central props ----
  // Gig board
  const gig = new THREE.Group(); gig.position.set(0, 0, 7);
  gig.add(box(3.1, .18, 1.6, MAT.metal, 0, .1, 0));
  gig.add(cyl(.16, .22, 2.25, 6, MAT.darkMetal, -1.1, 1.2, 0));
  gig.add(cyl(.16, .22, 2.25, 6, MAT.darkMetal, 1.1, 1.2, 0));
  const board = box(3, 1.7, .18, MAT.black, 0, 2.2, 0); gig.add(board);
  const boardTexture = makeTextTexture('GIGS // 11 PATHS', { width: 640, height: 360, color: '#d8ff45', bg: '#0d1608', font: '900 74px "Barlow Condensed", sans-serif' });
  const boardFace = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.5), new THREE.MeshBasicMaterial({ map: boardTexture, toneMapped: false }));
  boardFace.position.set(0, 2.2, .1); gig.add(boardFace);
  const gigGlow = new THREE.PointLight(0xd8ff45, 22, 12, 2); gigGlow.position.set(0, 2.6, 1.1); gig.add(gigGlow);
  gig.add(box(3.2, .02, .02, MAT.acid, 0, 3.08, .13));
  scene.add(gig);
  interactables.push({ id: 'gigs', label: 'GIG BOARD', sub: 'Choose your career path', action: 'careers', pos: [0, 7], radius: 3.2 });
  colliders.push({ minX: -1.7, maxX: 1.7, minZ: 6.2, maxZ: 7.8, y: 3 });

  // central clutter / benches
  for (const [x, z] of [[-4.8, 9], [4.8, 9], [-4.8, 3], [4.8, 3]]) scene.add(createCrate(x, z, .75, rand()));
  const bench = new THREE.Group(); bench.position.set(-3.4, 0, 4.4); bench.rotation.y = .3;
  bench.add(box(2.4, .12, .55, MAT.wood, 0, .52, 0)); bench.add(box(.12, .52, .5, MAT.metal, -1, .26, 0)); bench.add(box(.12, .52, .5, MAT.metal, 1, .26, 0)); scene.add(bench);

  // Market stalls
  const market = new THREE.Group(); market.position.set(-13, 0, 10);
  for (let i = 0; i < 3; i++) {
    const stall = new THREE.Group(); stall.position.set(i * 3.1 - 3.1, 0, 0);
    stall.add(box(2.7, .9, 1.7, MAT.wood, 0, .55, 0));
    stall.add(cyl(.06, .06, 2.8, 5, MAT.metal, -1.2, 1.4, -.65));
    stall.add(cyl(.06, .06, 2.8, 5, MAT.metal, 1.2, 1.4, -.65));
    const canopy = box(2.9, .09, 2.1, i === 1 ? MAT.acid : MAT.rust, 0, 2.75, 0); canopy.rotation.x = -.08; stall.add(canopy);
    for (let j = 0; j < 3; j++) stall.add(box(.35, .18, .35, new THREE.MeshStandardMaterial({ color: pick([0x8e5d3b, 0x5d6b42, 0x7d3d3d]) }), -.7 + j * .7, 1.12, .25));
    if (i === 0) {
      const s = signPlane('PAWN', 2.2, .45, '#d8ff45', { font: '900 80px "Barlow Condensed", sans-serif' }); s.position.set(0, 3.1, 1); stall.add(s);
    }
    market.add(stall);
  }
  scene.add(market);
  const marketLight = new THREE.PointLight(0xd8ff45, 24, 13, 2); marketLight.position.set(-13, 3.4, 10); scene.add(marketLight);
  interactables.push({ id: 'market', label: 'MARKET ROW', sub: 'Buy supplies and sell salvage', action: 'shop', pos: [-13, 7.8], radius: 3.6 });
  colliders.push({ minX: -17, maxX: -9, minZ: 9, maxZ: 11.2, y: 2.8 });

  // food stall
  const foodStall = new THREE.Group(); foodStall.position.set(-18, 0, 16); foodStall.rotation.y = .6;
  foodStall.add(box(3.4, 1, 1.8, MAT.rust, 0, .55, 0));
  foodStall.add(box(3.2, .08, 2.7, MAT.orange, 0, 2.8, .1));
  foodStall.add(cyl(.06, .06, 2.75, 5, MAT.metal, -1.45, 1.4, -.7));
  foodStall.add(cyl(.06, .06, 2.75, 5, MAT.metal, 1.45, 1.4, -.7));
  const fs = signPlane('HOT FUNGUS', 2.9, .6, '#ffbb55', { font: '900 70px "Barlow Condensed", sans-serif' }); fs.position.set(0, 3.05, .15); foodStall.add(fs);
  const steamMat = new THREE.MeshBasicMaterial({ color: 0xccd6bd, transparent: true, opacity: .1, depthWrite: false });
  for (let i = 0; i < 3; i++) {
    const st = new THREE.Mesh(new THREE.SphereGeometry(.25 + i * .12, 5, 4), steamMat);
    st.position.set((i - 1) * .5, 1.7 + i * .6, .3); foodStall.add(st); smoke.push({ mesh: st, base: st.position.clone(), speed: .15 + rand() * .2, phase: rand() * 6 });
  }
  scene.add(foodStall);
  interactables.push({ id: 'foodstall', label: 'HOT FUNGUS', sub: 'Eat now · 12₵', action: 'food', pos: [-17.5, 15], radius: 2.9 });
  colliders.push({ minX: -20, maxX: -16, minZ: 14.5, maxZ: 17.6, y: 3 });

  // Workbench street version
  const benchStation = new THREE.Group(); benchStation.position.set(9.5, 0, 7); benchStation.rotation.y = -.2;
  benchStation.add(box(2.7, .14, 1.2, MAT.wood, 0, 1.03, 0));
  benchStation.add(box(.14, 1, .9, MAT.metal, -1.15, .5, 0));
  benchStation.add(box(.14, 1, .9, MAT.metal, 1.15, .5, 0));
  benchStation.add(box(.9, .3, .5, MAT.darkMetal, -.3, 1.18, -.15));
  benchStation.add(box(.35, .5, .2, MAT.rust, .6, 1.25, -.3));
  for (let i = 0; i < 3; i++) benchStation.add(box(.25, .25, .25, MAT.metal, .7 + i * .2, 1.15, .2));
  scene.add(benchStation);
  interactables.push({ id: 'workbench', label: 'WORKBENCH', sub: 'Craft survival gear', action: 'craft', pos: [9.5, 8.2], radius: 2.5 });
  colliders.push({ minX: 8, maxX: 11, minZ: 6.3, maxZ: 7.8, y: 1.4 });

  // stash chest
  const stash = new THREE.Group(); stash.position.set(12.7, 0, 7);
  stash.add(box(1.5, .85, .9, MAT.rust, 0, .5, 0));
  stash.add(box(1.55, .12, .95, MAT.darkMetal, 0, .98, 0));
  const padlock = box(.2, .28, .06, MAT.acid, 0, .68, .47); stash.add(padlock);
  scene.add(stash);
  interactables.push({ id: 'stash', label: 'BLOCK STASH', sub: 'Shared survival storage', action: 'stash', pos: [12.7, 8], radius: 2.3 });
  colliders.push({ minX: 11.9, maxX: 13.5, minZ: 6.5, maxZ: 7.6, y: 1 });

  // Realty terminal
  const realty = new THREE.Group(); realty.position.set(-16, 0, -6);
  realty.add(box(.3, 2.5, .3, MAT.darkMetal, 0, 1.25, 0));
  const realtyScreen = box(1.7, 1.1, .13, MAT.black, 0, 2.15, 0);
  realtyScreen.rotation.y = -.2; realty.add(realtyScreen);
  const rs = signPlane('LOTS // 3', 1.5, .5, '#66e7d5', { font: '900 62px "Barlow Condensed", sans-serif' }); rs.position.set(0, 2.15, .08); rs.rotation.y = -.2; realty.add(rs);
  scene.add(realty);
  interactables.push({ id: 'realty', label: 'REALTY TERMINAL', sub: 'Buy a lot, build a future', action: 'properties', pos: [-16, -4.9], radius: 2.7 });
  colliders.push({ minX: -16.5, maxX: -15.5, minZ: -6.4, maxZ: -5.6, y: 2 });

  // Clinic nook
  const clinic = new THREE.Group(); clinic.position.set(16.4, 0, 5);
  clinic.add(box(4.2, 2.6, 3.4, new THREE.MeshStandardMaterial({ color: 0x39453d, roughness: .7 }), 0, 1.3, 0));
  const cs = signPlane('CLINIC // OPEN', 3.6, .6, '#66e7d5', { font: '900 66px "Barlow Condensed", sans-serif' }); cs.position.set(0, 2.9, 1.75); clinic.add(cs);
  clinic.add(box(2.4, .15, 1.1, MAT.metal, 0, .95, 1.75));
  clinic.add(box(.15, .95, .8, MAT.metal, -1.1, .48, 1.75)); clinic.add(box(.15, .95, .8, MAT.metal, 1.1, .48, 1.75));
  scene.add(clinic);
  interactables.push({ id: 'clinic', label: 'STREET CLINIC', sub: 'Patch up · 30₵', action: 'clinic', pos: [16.4, 7], radius: 2.8 });
  colliders.push({ minX: 14, maxX: 18.6, minZ: 3, maxZ: 6.9, y: 2.7 });

  // Garage bay marker + car area
  const garageBay = new THREE.Group(); garageBay.position.set(17, 0, -8);
  for (const [x, z] of [[-2.3, -2.8], [2.3, -2.8], [-2.3, 2.8], [2.3, 2.8]]) garageBay.add(cyl(.08, .08, 3.2, 5, MAT.metal, x, 1.6, z));
  garageBay.add(box(5, .1, .1, MAT.orange, 0, 3.1, -2.8));
  garageBay.add(box(5, .1, .1, MAT.orange, 0, 3.1, 2.8));
  const gs = signPlane('CHOP SHOP // BAY 2', 5.5, .8, '#ff7a2f', { font: '900 54px "Barlow Condensed", sans-serif' }); gs.position.set(0, 3.3, -2.9); garageBay.add(gs);
  scene.add(garageBay);
  interactables.push({ id: 'garagebay', label: 'GARAGE BAY', sub: 'Repair, paint, drive', action: 'garage', pos: [17, -5], radius: 3.2 });

  // Broken car wreck in bay (visual only before player owns)
  const wreck = createCar({ paint: '#3b3129', rim: '#5b5a50', underglow: '#000000' });
  wreck.position.set(17, 0, -8); wreck.rotation.y = Math.PI * .97; wreck.scale.setScalar(.98);
  wreck.traverse(o => {
    if (o.isMesh) {
      if (o.material?.color && o.material.color.getHex() !== 0x000000) {
        const c = o.material.color.getHex();
        if (c !== 0x0b0d0b && c !== 0x11140f) { o.material = o.material.clone(); o.material.color.multiplyScalar(.72); o.material.roughness = .9; }
      }
    }
  });
  wreck.position.y = .03;
  scene.add(wreck);
  // smoke from wreck
  for (let i = 0; i < 4; i++) {
    const st = new THREE.Mesh(new THREE.SphereGeometry(.2 + i * .1, 5, 4), new THREE.MeshBasicMaterial({ color: 0x777d70, transparent: true, opacity: .09, depthWrite: false }));
    st.position.set(17 + (rand() - .5) * .8, 1.4 + i * .4, -9.2); scene.add(st);
    smoke.push({ mesh: st, base: st.position.clone(), speed: .2 + rand() * .15, phase: rand() * 5 });
  }

  // Under cut gate at z -30
  const gate = new THREE.Group(); gate.position.set(0, 0, -30);
  for (const x of [-7.5, 7.5]) {
    gate.add(box(.75, 7, .75, MAT.rust, x, 3.5, 0));
    gate.add(box(1.15, .18, 1.15, MAT.darkMetal, x, 7, 0));
  }
  gate.add(box(16, .5, .8, MAT.rust, 0, 7, 0));
  const gateSign = signPlane('THE UNDERCUT // NO LAW', 11, 1.25, '#ff4545', { font: '900 76px "Barlow Condensed", sans-serif', bg: 'rgba(14,5,5,.94)' });
  gateSign.position.set(0, 8.2, .2); gate.add(gateSign);
  const redL = new THREE.PointLight(0xff4545, 40, 25, 2); redL.position.set(0, 5, 1); gate.add(redL);
  scene.add(gate);
  colliders.push({ minX: -8.1, maxX: -6.9, minZ: -30.5, maxZ: -29.5, y: 7 });
  colliders.push({ minX: 6.9, maxX: 8.1, minZ: -30.5, maxZ: -29.5, y: 7 });

  // Neighborhood shops & details
  const noodle = new THREE.Group(); noodle.position.set(30, 0, 7);
  noodle.add(box(3.6, 1.1, 2.2, MAT.rust, 0, .55, 0));
  noodle.add(box(4, .12, 3.2, MAT.pink, 0, 3, 0));
  const ns = signPlane('NOODLES // 24H', 3.8, .65, '#ff4fba', { font: '900 74px "Barlow Condensed", sans-serif' }); ns.position.set(0, 3.4, .6); noodle.add(ns);
  scene.add(noodle);
  interactables.push({ id: 'noodles', label: 'NOODLE BAR', sub: 'Cheap food, loud music', action: 'shop', pos: [30, 8.6], radius: 3.1 });
  colliders.push({ minX: 28, maxX: 32, minZ: 5.8, maxZ: 8.2, y: 3.4 });

  const foundryStall = new THREE.Group(); foundryStall.position.set(-30, 0, 7);
  foundryStall.add(box(4.2, 1.35, 2.2, MAT.darkMetal, 0, .68, 0));
  foundryStall.add(cyl(.6, .6, 1.2, 8, MAT.rust, -1.1, 1.9, 0));
  const sparksMat = new THREE.MeshBasicMaterial({ color: 0xffb15c, toneMapped: false });
  for (let i = 0; i < 7; i++) foundryStall.add(box(.03, .03, .7, sparksMat, -1.1 + (rand() - .5) * 1.8, 1.8 + rand() * 2.2, (rand() - .5) * 1.4));
  const fss = signPlane('ORE BUYER', 3.3, .6, '#ff7a2f', { font: '900 66px "Barlow Condensed", sans-serif' }); fss.position.set(0, 3.1, 1.12); foundryStall.add(fss);
  scene.add(foundryStall);
  interactables.push({ id: 'orebuyer', label: 'ORE BUYER', sub: 'Sell biometal at good rates', action: 'shop', pos: [-30, 8], radius: 2.8 });
  colliders.push({ minX: -32.3, maxX: -27.8, minZ: 5.8, maxZ: 8.3, y: 3.2 });

  // home lots
  for (const lot of LOTS) { homeGroups[lot.id] = createHomeLot(lot, scene); }
  interactables.push({ id: 'build-unit07', label: 'UNIT 07 // BUILD', sub: 'Open build mode', action: 'build', pos: [LOTS[0].pos[0], LOTS[0].pos[1] + LOTS[0].size + 1.8], radius: 4, lot: 'unit07' });
  interactables.push({ id: 'build-neonloft', label: 'PINK LOFT // BUILD', sub: 'Construction lot', action: 'build', pos: [LOTS[1].pos[0], LOTS[1].pos[1] + LOTS[1].size + 1.8], radius: 4, lot: 'neonloft' });
  interactables.push({ id: 'build-foundry', label: 'FOUNDRY ANNEX // BUILD', sub: 'Construction lot', action: 'build', pos: [LOTS[2].pos[0], LOTS[2].pos[1] + LOTS[2].size + 1.8], radius: 4, lot: 'foundry' });

  // Beacons
  for (const d of DISTRICTS) {
    const b = makeBeacon(d, colliders, scene);
    beacons[d.id] = b;
    districtState[d.id] = { secured: d.owned, group: b.group };
    interactables.push({ id: `beacon-${d.id}`, label: `${d.name.toUpperCase()} BEACON`, sub: d.owned ? 'District secured' : 'Claim this district', action: 'district', pos: [d.x, d.z + 2.6], radius: 3.3, district: d.id });
  }

  // lamps
  const lampPositions = [[-7, 18, 0xd8ff45], [7, 23, 0xd8ff45], [-7, -10, 0xd8ff45], [7, -18, 0xd8ff45], [25, 0, 0xff4fba], [43, 4, 0xff4fba], [-25, 0, 0xff7a2f], [-43, -5, 0xff7a2f], [0, -26, 0xff4545], [-15, 35, 0xd8ff45]];
  for (const [x, z, c] of lampPositions) scene.add(makeLamp(x, z, c));

  // random props
  for (let i = 0; i < 28; i++) {
    const zone = Math.floor(rand() * 4);
    let x, z;
    if (zone === 0) { x = -45 + rand() * 85; z = 12 + rand() * 30; }
    else if (zone === 1) { x = 27 + rand() * 24; z = -22 + rand() * 36; }
    else { x = -54 + rand() * 18; z = -22 + rand() * 36; }
    if (Math.abs(x) < 10 && z > 5) continue;
    if (rand() > .5) scene.add(createCrate(x, z, .5 + rand() * .7, rand() * TAU, rand() > .5 ? MAT.rust : MAT.wood));
    else {
      const barrel = cyl(.35, .38, .9, 8, rand() > .5 ? MAT.rust : MAT.metal, x, .45, z); scene.add(barrel);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.36, .025, 4, 10), MAT.darkMetal); ring.position.set(x, .55, z); ring.rotation.x = Math.PI / 2; scene.add(ring);
    }
  }
  // dumpsters
  for (const [x, z, ry] of [[-18.5, 7, .3], [14, 18, -.2], [27, -6, 1.2], [-28, -6, .1]]) {
    const d = new THREE.Group(); d.position.set(x, 0, z); d.rotation.y = ry;
    d.add(box(2.3, 1.1, 1.1, new THREE.MeshStandardMaterial({ color: 0x263229, roughness: .85, metalness: .3 }), 0, .68, 0));
    d.add(box(2.35, .1, 1.2, MAT.darkMetal, 0, 1.26, 0));
    scene.add(d);
  }
  // cables overhead
  for (let i = 0; i < 6; i++) {
    const start = new THREE.Vector3(-9, 5 + rand() * 5, -24 + i * 9);
    const end = new THREE.Vector3(9, 5 + rand() * 4, -24 + i * 9);
    const mid = start.clone().lerp(end, .5); mid.y -= 1.3 + rand();
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 8, .035, 4, false), MAT.cable); scene.add(tube);
  }
  // market string lights
  const stringPts = [];
  for (let i = 0; i <= 9; i++) {
    const t = i / 9; stringPts.push(new THREE.Vector3(-17 + t * 8, 3.5 - Math.sin(t * Math.PI) * .8, 7.3));
  }
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(stringPts), new THREE.LineBasicMaterial({ color: 0xffbb55, transparent: true, opacity: .4 })));
  for (let i = 1; i < 9; i++) {
    const t = i / 9; const bulb = new THREE.Mesh(new THREE.SphereGeometry(.07, 5, 4), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffbb55 : 0xd8ff45, toneMapped: false }));
    bulb.position.set(-17 + t * 8, 3.45 - Math.sin(t * Math.PI) * .8, 7.3); scene.add(bulb);
  }

  // tunnel walls / boulders
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x191d18, roughness: 1, flatShading: true });
  for (let i = 0; i < 40; i++) {
    const side = Math.floor(rand() * 4);
    const x = side < 2 ? (side === 0 ? -76 : 76) + rand() * 6 : -70 + rand() * 140;
    const z = side < 2 ? -58 + rand() * 120 : (side === 2 ? -73 : 66) + rand() * 5;
    const r = 2 + rand() * 7;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), rockMat);
    rock.position.set(x, r * .75, z); rock.rotation.set(rand() * 3, rand() * 3, rand() * 3); rock.scale.y = 1.3 + rand();
    scene.add(rock);
  }
  // ceiling / stalactites
  const ceiling = box(150, 2, 140, new THREE.MeshStandardMaterial({ color: 0x090c09, roughness: 1 }), 0, 40, 0); scene.add(ceiling);
  for (let i = 0; i < 18; i++) {
    const r = .8 + rand() * 2.6, h = 2 + rand() * 8;
    const st = new THREE.Mesh(new THREE.ConeGeometry(r, h, 5), rockMat);
    st.position.set(-68 + rand() * 136, 38 - h / 2, -60 + rand() * 112); st.rotation.y = rand() * TAU; scene.add(st);
  }
  // dust
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(1000 * 3);
  for (let i = 0; i < 1000; i++) {
    dustPos[i * 3] = -65 + rand() * 130; dustPos[i * 3 + 1] = .4 + rand() * 20; dustPos[i * 3 + 2] = -55 + rand() * 115;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xc9d4ad, size: .045, transparent: true, opacity: .5, depthWrite: false }));
  scene.add(dust);

  const train = makeTrain(scene);

  // NPCs
  const npcSpots = [
    { x: -4, z: 12 }, { x: -11, z: 17 }, { x: 5, z: 17 }, { x: 15, z: 2 }, { x: -19, z: 2 }, { x: 29, z: 3 },
    { x: 40, z: 8 }, { x: 33, z: -8 }, { x: -28, z: 3 }, { x: -38, z: 8 }, { x: -24, z: 13 }, { x: 22, z: 22 },
    { x: -6, z: 22 }, { x: 12, z: 23 }, { x: 45, z: 20 }, { x: -15, z: -17 },
  ];
  npcSpots.forEach((spot, i) => {
    const [name, job] = NPC_NAMES[i % NPC_NAMES.length];
    const looks = {
      skin: pick(['#e7b58a', '#c98e63', '#9b6444', '#6c4633', '#3e2d26', '#f0cbb3', '#7e5139']),
      hair: pick(['#141311', '#3a261b', '#84552f', '#c6b18b', '#d8ff45', '#ff4fba', '#66e7d5']),
      hairStyle: pick(['CROP', 'MOHAWK', 'LONG', 'BUN', 'SHAVED', 'BRAIDS']),
      jacket: pick(['#171b15', '#3a3e32', '#8b2c2c', '#bd6e2d', '#5b3f79', '#2e5f66']),
      top: pick(['#20251e', '#3b4034', '#d8ff45', '#ff7a2f', '#ff4fba', '#66e7d5', '#f2e8cf']),
      bottom: pick(['#20251e', '#394035', '#4a3a2a', '#5a5f51']),
      accent: pick(['#d8ff45', '#ff7a2f', '#ff4fba', '#66e7d5']),
    };
    const c = createCharacter(looks);
    c.position.set(spot.x, 0, spot.z);
    c.rotation.y = rand() * TAU;
    const marker = new THREE.Mesh(new THREE.OctahedronGeometry(.07, 0), new THREE.MeshBasicMaterial({ color: 0x66e7d5, toneMapped: false }));
    marker.position.y = 2.58; c.add(marker);
    scene.add(c);
    const angle = rand() * TAU;
    const target = new THREE.Vector2(spot.x + Math.cos(angle) * (4 + rand() * 6), spot.z + Math.sin(angle) * (4 + rand() * 6));
    npcs.push({
      id: `npc-${i}`, name, job, group: c, marker, home: new THREE.Vector2(spot.x, spot.z), target,
      speed: .55 + rand() * .4, wait: rand() * 4, walkT: rand() * 10, recruited: false, jobAssigned: null,
      dialogue: NPC_LINES[i % NPC_LINES.length],
    });
  });

  // gang crew visual
  for (const [x, z, rot] of [[-3, -36, .3], [-8, -41, 1.6], [5, -38, -.8], [10, -45, 2.4]]) {
    const g = createGangster();
    g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g);
    const bar = makeHealthBar(); bar.position.y = 2.85; g.add(bar); g.userData.gangster.bar = bar;
    gangsters.push(g);
  }

  // district point lights
  const pls = [
    [0x67d9c2, 22, 32, [0, 6, 8]], [0xff4fba, 22, 30, [36, 7, 4]], [0xff7a2f, 24, 30, [-36, 6, 3]], [0xff4545, 28, 28, [0, 6, -38]],
  ];
  for (const [c, i, d, p] of pls) { const l = new THREE.PointLight(c, i, d, 2); l.position.set(...p); scene.add(l); }

  // return config
  return {
    colliders, interactables, npcs, gangsters, homeGroups, beacons, districtState, windowsInst: inst,
    wreck, garageCar: null, playerCar: null,
    update(dt, time) {
      dust.rotation.y += dt * .002;
      train.group.position.x += train.speed * dt;
      if (train.group.position.x > train.max) train.group.position.x = train.min;
      for (const n of npcs) {
        if (n.recruited) continue;
        const gp = n.group.position;
        n.walkT += dt;
        if (n.wait > 0) {
          n.wait -= dt;
          const rig = n.group.userData.rig;
          rig.legL.rotation.x *= .86; rig.legR.rotation.x *= .86;
          rig.body.position.y = Math.sin(time * 1.7 + n.walkT) * .008;
          n.group.rotation.y = Math.atan2(n.target.x - gp.x, n.target.y - gp.z) + Math.sin(time * .3) * .1;
          continue;
        }
        const dx = n.target.x - gp.x, dz = n.target.y - gp.z;
        const dist = Math.hypot(dx, dz);
        if (dist < .4) {
          n.wait = 2 + rand() * 5;
          const a = rand() * TAU, r = 3 + rand() * 9;
          n.target.set(n.home.x + Math.cos(a) * r, n.home.y + Math.sin(a) * r);
        } else {
          const step = n.speed * dt;
          gp.x += dx / dist * step; gp.z += dz / dist * step;
          n.group.rotation.y = Math.atan2(dx, dz);
          const rig = n.group.userData.rig;
          const sw = Math.sin(n.walkT * 7.5) * .5;
          rig.legL.rotation.x = sw; rig.legR.rotation.x = -sw;
          rig.armL.rotation.x = -sw * .7; rig.armR.rotation.x = sw * .7;
          rig.body.position.y = Math.abs(Math.sin(n.walkT * 7.5)) * .035;
        }
      }
      for (const s of smoke) {
        const p = s.base;
        s.mesh.position.y = p.y + ((time * s.speed + s.phase) % 3) * .55;
        s.mesh.position.x = p.x + Math.sin(time * .4 + s.phase) * .12;
        s.mesh.scale.setScalar(1 + ((time * s.speed + s.phase) % 3) * .28);
        s.mesh.material.opacity = .05 + (1 - ((time * s.speed + s.phase) % 3) / 3) * .06;
      }
      for (const d of Object.values(beacons)) {
        d.ring.rotation.z += dt * .5;
        d.holo.material.opacity = .055 + Math.sin(time * 1.5 + d.group.position.x) * .025;
        d.light.intensity = d.secured ? 12 + Math.sin(time * 2) * 2 : 18;
      }
      for (const g of gangsters) {
        if (!g.userData.gangster.alive) continue;
        const bar = g.userData.gangster.bar;
        bar.rotation.y = -g.rotation.y;
        const badge = g.userData.gangster.badge;
        badge.rotation.y += dt * 2;
        badge.position.y = 2.6 + Math.sin(time * 2 + g.position.x) * .06;
      }
    },
  };
}

export function makeHealthBar() {
  const g = new THREE.Group();
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(.86, .09), new THREE.MeshBasicMaterial({ color: 0x201014, transparent: true, opacity: .9, depthWrite: false }));
  const fill = new THREE.Mesh(new THREE.PlaneGeometry(.8, .055), new THREE.MeshBasicMaterial({ color: 0xff4545, toneMapped: false, depthWrite: false }));
  fill.position.z = .002; g.add(bg); g.add(fill); g.userData.fill = fill;
  return g;
}

export function createMarker(color = '#d8ff45', label = '') {
  const g = new THREE.Group();
  const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .75, toneMapped: false, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.35, 1.5, 32), ringMat);
  ring.rotation.x = -Math.PI / 2; ring.position.y = .06; g.add(ring);
  const inner = new THREE.Mesh(new THREE.RingGeometry(.3, .42, 20), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .3, toneMapped: false, side: THREE.DoubleSide }));
  inner.rotation.x = -Math.PI / 2; inner.position.y = .07; g.add(inner);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.32, .8, 5.5, 8, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .075, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  beam.position.y = 2.8; g.add(beam);
  const diamond = new THREE.Mesh(new THREE.OctahedronGeometry(.36, 0), new THREE.MeshBasicMaterial({ color, toneMapped: false }));
  diamond.position.y = 4.9; g.add(diamond);
  g.userData = { ring, inner, beam, diamond, color };
  if (label) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeTextTexture(label, { width: 512, height: 128, color, bg: 'rgba(4,6,4,.75)', font: '800 62px "Barlow Condensed", sans-serif', border: false }), transparent: true, depthWrite: false, toneMapped: false }));
    sprite.scale.set(4.4, 1.1, 1); sprite.position.y = 6; g.add(sprite);
  }
  return g;
}

export function createFurniture(type, color = '#6d7167', glow = '#d8ff45') {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: .82, metalness: .1 });
  const metalMat = MAT.metal;
  const woodMat = MAT.wood;
  if (type === 'floor') {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1.92, 1.92), new THREE.MeshStandardMaterial({ color, roughness: .9, metalness: .05 }));
    p.rotation.x = -Math.PI / 2; p.position.y = .012; g.add(p); return g;
  }
  if (type === 'wall') {
    const w = box(1.9, 2.4, .16, mat, 0, 1.2, 0); g.add(w);
    g.add(box(1.9, .06, .22, MAT.darkMetal, 0, 2.4, 0));
    if (glow) {
      const strip = box(.06, 2, .03, new THREE.MeshBasicMaterial({ color: glow, toneMapped: false }), .84, 1.2, .1);
      g.add(strip);
    }
    return g;
  }
  if (type === 'bed') {
    g.add(box(3.2, .28, 1.65, MAT.darkMetal, 0, .28, 0));
    g.add(box(3.0, .26, 1.48, new THREE.MeshStandardMaterial({ color: 0x4d5745, roughness: .9 }), 0, .53, 0));
    g.add(box(2.1, .2, 1.35, new THREE.MeshStandardMaterial({ color: 0x8c947e, roughness: .8 }), .25, .72, 0));
    g.add(box(.6, .24, 1.2, new THREE.MeshStandardMaterial({ color: 0xd8ff45, roughness: .9 }), -1.15, .78, 0));
    g.add(box(3.25, .22, .08, MAT.metal, 0, .55, -.84));
    g.add(box(3.25, .75, .08, MAT.darkMetal, 0, .9, -.83));
    return g;
  }
  if (type === 'crate') {
    g.add(box(1.5, 1.1, 1.25, woodMat, 0, .55, 0));
    g.add(box(1.55, .09, 1.3, MAT.darkMetal, 0, .38, 0));
    g.add(box(.35, .2, .05, new THREE.MeshBasicMaterial({ color: 0xd8ff45, toneMapped: false }), 0, .8, .64));
    return g;
  }
  if (type === 'workbench') {
    g.add(box(3.2, .16, 1.3, woodMat, 0, 1.05, 0));
    g.add(box(.16, 1, .95, metalMat, -1.4, .5, 0));
    g.add(box(.16, 1, .95, metalMat, 1.4, .5, 0));
    g.add(box(1, .32, .55, MAT.darkMetal, -.5, 1.24, -.1));
    g.add(box(.4, .55, .22, MAT.rust, .8, 1.32, -.2));
    g.add(box(2.4, .06, .06, MAT.acid, 0, 1.7, -.6));
    return g;
  }
  if (type === 'stove') {
    g.add(box(1.5, 1.3, 1.45, MAT.darkMetal, 0, .65, 0));
    g.add(box(1.25, .1, 1.1, MAT.rust, 0, 1.33, 0));
    for (let i = 0; i < 2; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.26, .035, 5, 12), new THREE.MeshBasicMaterial({ color: 0xff7a2f, toneMapped: false }));
      ring.rotation.x = Math.PI / 2; ring.position.set(-.32 + i * .64, 1.4, 0); g.add(ring);
    }
    g.add(box(1.05, .4, .05, new THREE.MeshBasicMaterial({ color: 0xffa45c, transparent: true, opacity: .45, toneMapped: false }), 0, .65, .73));
    return g;
  }
  if (type === 'couch') {
    g.add(box(3.1, .45, 1.35, new THREE.MeshStandardMaterial({ color: 0x515a4a, roughness: .96 }), 0, .4, 0));
    g.add(box(3.1, .75, .3, new THREE.MeshStandardMaterial({ color: 0x434c3e, roughness: .96 }), 0, .8, -.55));
    g.add(box(.28, .55, 1.35, new THREE.MeshStandardMaterial({ color: 0x434c3e, roughness: .96 }), -1.42, .64, 0));
    g.add(box(.28, .55, 1.35, new THREE.MeshStandardMaterial({ color: 0x434c3e, roughness: .96 }), 1.42, .64, 0));
    g.add(box(.7, .16, .8, new THREE.MeshStandardMaterial({ color: 0xd8ff45, roughness: .9 }), -.7, .7, 0));
    return g;
  }
  if (type === 'table') {
    g.add(box(1.65, .12, 1.6, woodMat, 0, .9, 0));
    for (const [x, z] of [[-.65, -.6], [.65, -.6], [-.65, .6], [.65, .6]]) g.add(box(.11, .9, .11, MAT.metal, x, .45, z));
    g.add(box(.5, .35, .05, new THREE.MeshBasicMaterial({ color: 0x66e7d5, toneMapped: false }), .15, 1.05, .82));
    return g;
  }
  if (type === 'lamp') {
    g.add(cyl(.06, .07, 2.4, 5, MAT.metal, 0, 1.2, 0));
    g.add(box(.7, .5, .7, MAT.darkMetal, 0, 2.45, 0));
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(.13, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffcf8c, toneMapped: false }));
    bulb.position.y = 2.4; g.add(bulb);
    const l = new THREE.PointLight(0xffb15c, 8, 5, 2); l.position.y = 2.2; g.add(l);
    return g;
  }
  if (type === 'planter') {
    g.add(box(1.4, .6, 1.4, MAT.rust, 0, .3, 0));
    for (let i = 0; i < 5; i++) {
      const stem = cyl(.035, .05, .5 + rand() * .4, 4, new THREE.MeshStandardMaterial({ color: 0x5e7a48 }), (rand() - .5) * .9, .7, (rand() - .5) * .9);
      g.add(stem);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(.18 + rand() * .12, 5, 4), new THREE.MeshBasicMaterial({ color: 0xa6ff7a, toneMapped: false }));
      cap.scale.y = .6; cap.position.set(stem.position.x, .95 + rand() * .3, stem.position.z); g.add(cap);
    }
    const l = new THREE.PointLight(0x9dff6d, 4, 3, 2); l.position.y = 1.2; g.add(l);
    return g;
  }
  if (type === 'neon') {
    g.add(cyl(.12, .16, 2.2, 5, MAT.darkMetal, 0, 1.1, 0));
    const sign = signPlane('3120', 1.8, .8, glow || '#ff4fba', { font: '900 90px "Barlow Condensed", sans-serif' });
    sign.position.y = 2.2; g.add(sign);
    const l = new THREE.PointLight(glow || 0xff4fba, 8, 4, 2); l.position.set(0, 2.2, .4); g.add(l);
    return g;
  }
  if (type === 'shelf') {
    g.add(box(.18, 2.5, 1.4, MAT.metal, -.8, 1.25, 0));
    g.add(box(.18, 2.5, 1.4, MAT.metal, .8, 1.25, 0));
    for (let i = 0; i < 4; i++) {
      g.add(box(1.7, .1, 1.3, woodMat, 0, .2 + i * .65, 0));
      for (let j = 0; j < 3; j++) if (rand() > .3) g.add(box(.2, .25, .25, new THREE.MeshStandardMaterial({ color: pick([0x8c5a36, 0xb1c39a, 0xa13535, 0x526c73]) }), -.5 + j * .5, .4 + i * .65, .1));
    }
    return g;
  }
  g.add(box(1, 1, 1, mat, 0, .5, 0));
  return g;
}

export function worldMapData() {
  return {
    roads: [
      { x1: -7.5, x2: 7.5, z1: -52, z2: 55 },
      { x1: -56, x2: 58, z1: -5.5, z2: 5.5 },
    ],
    buildings: [
      [-21, 15, 11, 9], [21, 14, 11, 10], [-21, -14, 12, 8], [21, -14, 13, 9], [35, 15, 12, 9], [49, 12, 9, 9],
      [35, -15, 12, 8], [48, -16, 8, 7], [-35, 15, 12, 9], [-49, 10, 10, 11], [-35, -14, 14, 8], [-50, -12, 8, 8],
      [-12, -38, 9, 7], [12, -39, 10, 6], [-22, -49, 11, 8], [22, -50, 9, 8], [-21, 44, 13, 9], [21, 44, 13, 9], [0, -61, 24, 8],
    ],
  };
}
