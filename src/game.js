import * as THREE from 'three';
import {
  CAREERS, LOTS, DISTRICTS, PROJECTS, CREW_JOBS, RESOURCES, PAINTS,
} from './data.js';
import { buildWorld, createCharacter, createCar, createFurniture, createMarker, worldMapData } from './world.js';
import { UI, drawBust } from './ui.js';
import { loadState, saveState, mergeDeep, makeDefaultState } from './state.js';
import { GameAudio } from './audio.js';
import { installGameplay } from './gameplay.js';
import { installBuild } from './build.js';

const lerp = THREE.MathUtils.lerp;
function lerpAngle(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class Game {
  constructor() {
    this.state = loadState();
    const playBtn = document.getElementById('playBtn');
    if (playBtn && this.state.started) playBtn.textContent = 'CONTINUE';
    this.audio = new GameAudio();
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.time = 0;
    this.elapsed = 0;
    this.keys = new Set();
    this.mode = 'splash';
    this.started = false;
    this.driving = false;
    this.buildMode = false;
    this.dead = false;
    this.touchMove = { x: 0, y: 0 };
    this.camYaw = 0.12;
    this.camPitch = 0.39;
    this.camDist = 11.5;
    this.camLook = new THREE.Vector3(0, 1, 0);
    this.nearest = null;
    this.hold = null;
    this.attackTime = 0;
    this.damageCooldown = 0;
    this.jobMarkers = [];
    this.furnitureGroups = {};
    this.furnitureSpots = {};
    this.saveClock = 0;
    this.hudClock = 0;
    this.mapClock = 0;
    this.location = '';
    this.lastPromptKey = '';
    this.onModalClose = () => {};
    this.initRenderer();
    this.world = buildWorld(this.scene);
    this.ui = new UI(this);
    this.setupPlayer();
    this.setupCar();
    this.renderAllHomes();
    this.restoreCrew();
    if (this.state.job) this.spawnJobMarker(this.state.job.step);
    this.setupEvents();
    this.setupJoystick();
    this.updateHUD(true);
    this.drawAvatarMini();
    this.resize();
    this.renderer.setAnimationLoop(() => this.frame());
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.save(); });
    setTimeout(() => {
      document.getElementById('loadingScreen')?.classList.add('out');
      setTimeout(() => document.getElementById('loadingScreen')?.remove(), 720);
    }, 160);
  }

  initRenderer() {
    const host = document.getElementById('scene');
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = false;
    this.renderer.domElement.setAttribute('aria-label', 'Underneath 3120 game world');
    host.appendChild(this.renderer.domElement);
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 260);
    this.camera.position.set(8, 16, 43);
    this.camera.lookAt(4, 4, 0);
    this.ndc = new THREE.Vector2();
    this.ray = new THREE.Raycaster();
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    const maxDpr = w < 760 ? 1.25 : 1.6;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w < 760 ? 67 : 55;
    this.camera.updateProjectionMatrix();
  }

  setupPlayer() {
    const look = this.state.look;
    const group = createCharacter(look);
    group.position.set(this.state.position[0] ?? 0, 0, this.state.position[1] ?? 16);
    group.rotation.y = Math.PI;
    this.scene.add(group);
    this.player = { group, heading: Math.PI, walk: 0, jumpY: 0, vy: 0, grounded: true };
    this.playerLookHash = JSON.stringify(look);
  }

  setupCar() {
    this.carObj = null;
    if (!this.state.car.owned) return;
    this.spawnCar();
  }

  spawnCar() {
    if (this.carObj) { this.scene.remove(this.carObj); this.carObj = null; }
    const p = this.state.car.position || [17, -8];
    this.carObj = createCar(this.state.car);
    this.carObj.position.set(p[0], 0.03, p[1] ?? -8);
    this.carObj.rotation.y = p[2] ?? Math.PI * .97;
    this.carHeading = this.carObj.rotation.y;
    this.carSpeed = 0;
    this.scene.add(this.carObj);
    if (this.world.wreck) {
      this.scene.remove(this.world.wreck);
      this.world.wreck = null;
    }
  }

  rebuildCar() {
    const old = this.carObj;
    const pos = old ? old.position.clone() : new THREE.Vector3(17, 0.03, -8);
    const rot = old ? old.rotation.y : Math.PI * .97;
    if (old) this.scene.remove(old);
    this.carObj = createCar(this.state.car);
    this.carObj.position.copy(pos);
    this.carObj.rotation.y = rot;
    this.scene.add(this.carObj);
    this.carHeading = rot;
    this.state.car.position = [pos.x, pos.z, rot];
  }

  restoreCrew() {
    for (const member of this.state.crew) {
      const npc = this.world.npcs.find(n => n.id === member.id);
      if (!npc) continue;
      npc.recruited = true;
      npc.resident = true;
      const home = LOTS.find(l => l.id === member.homeLot) || LOTS[0];
      npc.group.position.set(home.pos[0] + (member.slot || 0) * 1.2 - 2, 0, home.pos[1] + 4);
      npc.group.rotation.y = Math.PI;
      npc.marker.material.color.set(0xd8ff45);
      npc.home.set(home.pos[0], home.pos[1] + 4);
    }
  }

  startGame() {
    if (this.started) return;
    this.started = true;
    this.mode = 'follow';
    this.state.started = true;
    this.state.seenIntro = true;
    document.getElementById('splash').classList.add('out');
    setTimeout(() => { const s = document.getElementById('splash'); if (s) s.style.display = 'none'; }, 820);
    const game = document.getElementById('game');
    game.classList.remove('hidden'); game.setAttribute('aria-hidden', 'false');
    document.body.classList.add('playing');
    this.audio.start();
    this.updateHUD(true);
    setTimeout(() => {
      this.ui.toast('WELCOME TO RUSTMARKET. THE GIG BOARD IS NORTH OF YOU.', '');
      setTimeout(() => this.ui.toast('PRESS J TO CHOOSE A CAREER. PRESS B AT YOUR LOT TO BUILD.'), 1300);
    }, 700);
    this.save();
  }

  save() {
    if (this.player) {
      this.state.position = [this.player.group.position.x, this.player.group.position.z];
    }
    if (this.carObj) this.state.car.position = [this.carObj.position.x, this.carObj.position.z, this.carObj.rotation.y];
    this.state.level = 1 + Math.floor(this.state.xp / 160);
    saveState(this.state);
    this.saveClock = 0;
  }

  updateUI() {
    this.ui?.syncNav();
    this.drawAvatarMini();
  }

  drawAvatarMini() {
    const host = document.getElementById('avatarMini');
    if (!host) return;
    let cv = host.querySelector('canvas');
    if (!cv) { cv = document.createElement('canvas'); cv.width = 100; cv.height = 100; host.appendChild(cv); }
    drawBust(cv, this.state.look, { w: 100, h: 100 });
  }

  setupEvents() {
    document.getElementById('playBtn').addEventListener('click', () => this.startGame());
    document.getElementById('creditsBtn').addEventListener('click', () => this.ui.open('help'));
    const help = document.getElementById('helpBtn');
    help.addEventListener('click', () => this.ui.open('help'));
    const sound = document.getElementById('soundBtn');
    sound.addEventListener('click', () => {
      const on = this.audio.toggle();
      sound.textContent = on ? '♪' : '×';
      sound.title = on ? 'Mute audio' : 'Enable audio';
      if (on) this.ui.toast('AUDIO ONLINE');
    });
    if (!this.audio.enabled) { sound.textContent = '×'; sound.title = 'Enable audio'; }

    const canvas = this.renderer.domElement;
    let dragging = false, lastX = 0, lastY = 0, moved = 0;
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    canvas.addEventListener('pointerdown', e => {
      if (this.buildMode && e.button === 0) { this.placeBuildFromPointer(); return; }
      if (this.ui.openState) return;
      dragging = true; lastX = e.clientX; lastY = e.clientY; moved = 0;
      canvas.setPointerCapture?.(e.pointerId);
    });
    canvas.addEventListener('pointermove', e => {
      this.ndc.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.ndc.y = -(e.clientY / window.innerHeight) * 2 + 1;
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      moved += Math.abs(dx) + Math.abs(dy);
      lastX = e.clientX; lastY = e.clientY;
      this.camYaw -= dx * 0.0052;
      this.camPitch = clamp(this.camPitch + dy * 0.0032, 0.13, 1.18);
    });
    const endDrag = () => { dragging = false; };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('wheel', e => {
      if (this.ui.openState) return;
      this.camDist = clamp(this.camDist + Math.sign(e.deltaY) * 1.15, 6.8, this.buildMode ? 27 : 19);
      e.preventDefault();
    }, { passive: false });

    document.addEventListener('keydown', e => this.onKeyDown(e));
    document.addEventListener('keyup', e => {
      this.keys.delete(e.code);
      if (e.code === 'KeyE' && this.hold) { this.hold = null; document.getElementById('holdRing').style.setProperty('--hold', '0%'); }
    });
    window.addEventListener('blur', () => { this.keys.clear(); this.hold = null; });

    const touchInteract = document.getElementById('touchInteract');
    const endTouchHold = () => {
      this.touchHolding = false;
      if (this.hold) {
        this.hold = null;
        document.getElementById('holdRing')?.style.setProperty('--hold', '0%');
      }
    };
    touchInteract.addEventListener('pointerdown', e => {
      e.preventDefault();
      this.touchHolding = true;
      try { touchInteract.setPointerCapture?.(e.pointerId); } catch {}
      this.interact();
    });
    touchInteract.addEventListener('pointerup', endTouchHold);
    touchInteract.addEventListener('pointercancel', endTouchHold);
    touchInteract.addEventListener('pointerleave', e => { if (e.buttons) endTouchHold(); });
    document.getElementById('touchAttack').addEventListener('pointerdown', e => { e.preventDefault(); this.attack(); });
    document.getElementById('touchJump').addEventListener('pointerdown', e => { e.preventDefault(); this.jump(); });
  }

  setupJoystick() {
    const base = document.getElementById('joystick');
    const stick = document.getElementById('stick');
    let active = false, pointerId = null, cx = 0, cy = 0;
    const radius = 34;
    const reset = () => {
      active = false; pointerId = null; this.touchMove.x = 0; this.touchMove.y = 0;
      if (stick) stick.style.transform = 'translate(-50%,-50%)';
    };
    if (!base) return;
    base.addEventListener('pointerdown', e => {
      e.preventDefault(); active = true; pointerId = e.pointerId;
      const r = base.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2;
      base.setPointerCapture?.(e.pointerId);
    });
    base.addEventListener('pointermove', e => {
      if (!active || e.pointerId !== pointerId) return;
      let dx = e.clientX - cx, dy = e.clientY - cy;
      const d = Math.hypot(dx, dy);
      if (d > radius) { dx = dx / d * radius; dy = dy / d * radius; }
      this.touchMove.x = dx / radius; this.touchMove.y = -dy / radius;
      if (stick) stick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    });
    base.addEventListener('pointerup', reset);
    base.addEventListener('pointercancel', reset);
    base.addEventListener('pointerleave', e => { if (active) reset(); });
  }

  onKeyDown(e) {
    if (e.target.matches('input, textarea, select')) return;
    this.keys.add(e.code);
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
    if (this.buildMode) {
      if (e.code === 'Escape' || e.code === 'KeyB') this.exitBuild();
      if (e.code === 'KeyR') this.buildRotate();
      if (e.code === 'KeyX') this.buildToggleErase();
      return;
    }
    if (this.ui.openState) return;
    if (e.repeat) return;
    if (e.code === 'KeyE') this.interact();
    if (e.code === 'KeyF') this.attack();
    if (e.code === 'KeyB') this.openPanel('build');
    if (e.code === 'KeyJ') this.openPanel('careers');
    if (e.code === 'KeyI') this.openPanel('inventory');
    if (e.code === 'KeyM') this.openPanel('map');
    if (e.code === 'KeyG') this.openPanel('garage');
    if (e.code === 'KeyC') this.openPanel('style');
    if (e.code === 'Space') this.jump();
    if (e.code === 'Escape') this.ui.close();
  }

  openPanel(name, opts = {}) {
    if (!this.started) return;
    if (this.buildMode) this.exitBuild(true);
    this.audio.ui();
    if (name === 'build') {
      const near = this.nearestOwnedLot(12);
      if (near) { this.enterBuild(near.id); return; }
      this.ui.open('properties');
      this.ui.toast('VISIT AN OWNED LOT TO ENTER BUILD MODE.', 'warn');
      return;
    }
    if (name === 'inventory' && opts.stash) { this.ui.open('inventory', { stash: true }); return; }
    if (name === 'garage' && this.driving) return;
    this.ui.open(name, opts);
  }

  nearestOwnedLot(maxDist = 99) {
    const p = this.player.group.position;
    let best = null, bd = maxDist;
    for (const lot of LOTS) {
      if (!this.state.home.owned.includes(lot.id)) continue;
      const d = Math.hypot(p.x - lot.pos[0], p.z - lot.pos[1]);
      if (d < bd) { bd = d; best = lot; }
    }
    return best;
  }

  frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.time += dt;
    if (this.started) {
      this.elapsed += dt;
      this.state.playTime += dt;
      if (!this.ui.openState && !this.buildMode) {
        if (this.driving) this.updateDriving(dt);
        else this.updatePlayer(dt);
      } else {
        this.animateIdle(dt);
      }
      this.updateSurvival(dt);
      this.updateGangsters(dt);
      this.updateJob(dt);
      this.updateHold(dt);
      this.updateProduction(dt);
      this.saveClock += dt;
      if (this.saveClock > 22) this.save();
    } else {
      this.animateIdle(dt);
    }
    this.world.update(dt, this.time);
    this.updateCamera(dt);
    if (this.buildMode) this.updateBuildGhost();
    this.updatePrompt();
    this.hudClock += dt;
    if (this.hudClock > 0.16) { this.updateHUD(); this.hudClock = 0; }
    this.mapClock += dt;
    if (this.mapClock > 0.1) { this.drawMinimap(); this.mapClock = 0; }
    this.renderer.render(this.scene, this.camera);
  }

  updatePlayer(dt) {
    const p = this.player;
    const group = p.group;
    if (!group.visible) group.visible = true;
    let ix = 0, iz = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) iz += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) iz -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) ix += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) ix -= 1;
    ix += this.touchMove.x; iz += this.touchMove.y;
    const len = Math.hypot(ix, iz);
    if (len > 1) { ix /= len; iz /= len; }
    const moving = len > 0.08;
    const sprinting = (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) && moving && this.state.stamina > 3;
    let speed = sprinting ? 7.2 : 4.35;
    if (this.state.career === 'courier') speed *= 1.12;
    if (this.state.hunger <= 0) speed *= .72;
    const fwd = new THREE.Vector3(-Math.sin(this.camYaw), 0, -Math.cos(this.camYaw));
    const right = new THREE.Vector3(Math.cos(this.camYaw), 0, -Math.sin(this.camYaw));
    const dir = new THREE.Vector3().addScaledVector(fwd, iz).addScaledVector(right, ix);
    if (dir.lengthSq() > 0) dir.normalize();
    if (moving) {
      const nx = group.position.x + dir.x * speed * dt;
      const nz = group.position.z + dir.z * speed * dt;
      if (!this.collides(nx, group.position.z, 0.38)) group.position.x = nx;
      if (!this.collides(group.position.x, nz, 0.38)) group.position.z = nz;
      group.position.x = clamp(group.position.x, -68, 68);
      group.position.z = clamp(group.position.z, -58, 58);
      p.heading = Math.atan2(dir.x, dir.z);
      p.walk += dt * (sprinting ? 12 : 8.5);
      if (sprinting) this.state.stamina = Math.max(0, this.state.stamina - dt * 15);
    } else {
      this.state.stamina = Math.min(100, this.state.stamina + dt * 12);
    }
    if (!sprinting) this.state.stamina = Math.min(100, this.state.stamina + dt * 5);
    group.rotation.y = lerpAngle(group.rotation.y, p.heading, 1 - Math.exp(-14 * dt));
    const rig = group.userData.rig;
    const targetSwing = moving ? Math.sin(p.walk) * (sprinting ? .82 : .62) : 0;
    rig.legL.rotation.x = lerp(rig.legL.rotation.x, targetSwing, 1 - Math.exp(-14 * dt));
    rig.legR.rotation.x = lerp(rig.legR.rotation.x, -targetSwing, 1 - Math.exp(-14 * dt));
    rig.armL.rotation.x = lerp(rig.armL.rotation.x, -targetSwing * .65, 1 - Math.exp(-12 * dt));
    rig.armR.rotation.x = lerp(rig.armR.rotation.x, targetSwing * .65, 1 - Math.exp(-12 * dt));
    rig.body.position.y = moving ? Math.abs(Math.sin(p.walk)) * .035 : Math.sin(this.time * 1.7) * .012;
    // jump
    if (p.jumpY > 0 || !p.grounded) {
      p.vy -= 17 * dt;
      p.jumpY += p.vy * dt;
      if (p.jumpY <= 0) { p.jumpY = 0; p.vy = 0; p.grounded = true; }
    }
    group.position.y = p.jumpY;
    if (this.attackTime > 0) {
      this.attackTime -= dt;
      const sw = Math.sin((1 - this.attackTime / .32) * Math.PI);
      rig.armR.rotation.x = -1.7 * sw;
      rig.armR.rotation.z = -0.4 * sw;
    } else {
      rig.armR.rotation.z = lerp(rig.armR.rotation.z, 0, dt * 12);
    }
    this.updateLocation();
  }

  animateIdle(dt) {
    if (!this.player) return;
    const rig = this.player.group.userData.rig;
    rig.body.position.y = Math.sin(this.time * 1.5) * .009;
    rig.armL.rotation.x *= .92;
    rig.armR.rotation.x *= .92;
    rig.legL.rotation.x *= .92;
    rig.legR.rotation.x *= .92;
  }

  jump() {
    if (this.driving || this.ui.openState || this.buildMode || this.player.jumpY > 0) return;
    this.player.vy = 5.6;
    this.player.grounded = false;
    this.player.jumpY = .01;
  }

  collides(x, z, r = 0.4) {
    if (x < -69 || x > 69 || z < -59 || z > 59) return true;
    for (const c of this.world.colliders) {
      if (x + r > c.minX && x - r < c.maxX && z + r > c.minZ && z - r < c.maxZ) return true;
    }
    return false;
  }

  updateDriving(dt) {
    const car = this.carObj;
    if (!car) { this.driving = false; return; }
    const throttle = (this.keys.has('KeyW') || this.keys.has('ArrowUp')) ? 1 : (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? -1 : 0);
    const steer = (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0) + (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? -1 : 0);
    const boost = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const handbrake = this.keys.has('Space');
    const max = boost ? 31 : 25;
    if (throttle > 0) this.carSpeed += dt * 12.5;
    else if (throttle < 0) this.carSpeed -= dt * (this.carSpeed > 0 ? 19 : 8);
    else this.carSpeed *= Math.pow(.18, dt);
    if (handbrake) this.carSpeed *= Math.pow(.02, dt);
    this.carSpeed = clamp(this.carSpeed, -8, max);
    if (Math.abs(this.carSpeed) > .2) {
      const turn = steer * dt * (1.1 + Math.abs(this.carSpeed) / 38);
      this.carHeading += turn * Math.sign(this.carSpeed) * (handbrake ? 1.8 : 1);
    }
    const forward = new THREE.Vector3(Math.sin(this.carHeading), 0, Math.cos(this.carHeading));
    const nx = car.position.x + forward.x * this.carSpeed * dt;
    const nz = car.position.z + forward.z * this.carSpeed * dt;
    if (this.collides(nx, car.position.z, 1.12)) { this.carSpeed *= -.22; this.audio.hit(); }
    else car.position.x = nx;
    if (this.collides(car.position.x, nz, 1.12)) { this.carSpeed *= -.22; this.audio.hit(); }
    else car.position.z = nz;
    car.position.x = clamp(car.position.x, -66, 66);
    car.position.z = clamp(car.position.z, -56, 56);
    car.rotation.y = this.carHeading;
    const wheels = car.userData.car.wheels;
    wheels.forEach(w => { w.rotation.x -= this.carSpeed * dt * 2.1; });
    const targetYaw = this.carHeading + Math.PI;
    this.camYaw = lerpAngle(this.camYaw, targetYaw, 1 - Math.exp(-3.6 * dt));
    this.audio.setEngineSpeed(this.carSpeed);
    const speedEl = document.getElementById('carSpeed');
    if (speedEl) speedEl.textContent = String(Math.round(Math.abs(this.carSpeed) * 7.6)).padStart(3, '0');
    const gear = document.getElementById('carGear');
    if (gear) gear.textContent = this.carSpeed < -.3 ? 'R' : Math.abs(this.carSpeed) < .3 ? 'N' : 'D';
    document.body.classList.toggle('speeding', Math.abs(this.carSpeed) > 20);
    this.updateLocation();
  }

  enterCar() {
    if (!this.state.car.owned || !this.carObj) { this.ui.open('garage'); return; }
    this.driving = true;
    this.player.group.visible = false;
    this.ui.close(true);
    this.camDist = 10.5;
    this.camPitch = .3;
    this.carSpeed = 0;
    document.getElementById('carHud').classList.remove('hidden');
    document.getElementById('carName').textContent = 'RUSTLER GT';
    this.audio.engine(true);
    this.ui.toast('ENGINE AWAKE. W/S THROTTLE · A/D STEER · SPACE HANDBRAKE.');
  }

  exitCar() {
    if (!this.driving) return;
    this.driving = false;
    document.getElementById('carHud').classList.add('hidden');
    document.body.classList.remove('speeding');
    this.audio.engine(false);
    const car = this.carObj;
    const side = new THREE.Vector3(Math.cos(this.carHeading), 0, -Math.sin(this.carHeading)).multiplyScalar(1.8);
    this.player.group.position.set(car.position.x + side.x, 0, car.position.z + side.z);
    this.player.group.visible = true;
    this.player.heading = this.carHeading + Math.PI / 2;
    this.carSpeed = 0;
    this.state.car.position = [car.position.x, car.position.z, this.carHeading];
  }

  attack() {
    if (this.ui.openState || this.buildMode || this.driving) return;
    if (this.attackTime > .16) return;
    this.attackTime = .32;
    this.audio.hit();
    const p = this.player.group.position;
    let hit = false;
    for (const g of this.world.gangsters) {
      if (!g.userData.gangster.alive) continue;
      const d = Math.hypot(g.position.x - p.x, g.position.z - p.z);
      if (d < 3.2) {
        const data = g.userData.gangster;
        const dmg = this.state.career === 'fixer' ? 42 : 34;
        data.hp = Math.max(0, data.hp - dmg);
        data.cooldown = .5;
        hit = true;
        const fill = data.bar.userData.fill;
        fill.scale.x = data.hp / data.maxHp;
        fill.position.x = -(1 - data.hp / data.maxHp) * .4;
        this.showHit(g.position);
        if (!data.alive) break;
        if (data.hp <= 0) {
          data.alive = false;
          g.rotation.z = 1.35;
          g.position.y = .2;
          setTimeout(() => { g.visible = false; }, 800);
          setTimeout(() => { g.visible = true; g.userData.gangster.alive = true; g.userData.gangster.hp = 100; g.rotation.z = 0; g.position.y = 0; }, 22000);
          const loot = 8 + Math.floor(Math.random() * 8);
          this.state.resources.scrap += loot;
          this.state.resources.ore += 1;
          this.state.heatFloat = Math.min(5, this.state.heatFloat + 1);
          this.ui.toast(`CREW MEMBER DOWN. +${loot} SCRAP · HEAT RISING`, 'warn');
          this.audio.reward();
        }
      }
    }
    if (hit) this.damageCooldown = .2;
  }

  showHit(pos) {
    const el = document.createElement('div');
    el.className = 'weapon-hit';
    el.style.left = `${window.innerWidth / 2 + (Math.random() - .5) * 40}px`;
    el.style.top = `${window.innerHeight / 2 + (Math.random() - .5) * 40}px`;
    document.getElementById('game').appendChild(el);
    setTimeout(() => el.remove(), 320);
  }

  updateGangsters(dt) {
    if (this.damageCooldown > 0) this.damageCooldown -= dt;
    const p = this.player.group.position;
    for (const g of this.world.gangsters) {
      const data = g.userData.gangster;
      if (!data.alive) continue;
      const d = Math.hypot(g.position.x - p.x, g.position.z - p.z);
      if (d < 4.3 && !this.ui.openState && !this.driving && !this.buildMode) {
        g.rotation.y = Math.atan2(p.x - g.position.x, p.z - g.position.z);
        data.cooldown -= dt;
        if (data.cooldown <= 0) {
          data.cooldown = 1.4 + Math.random();
          this.state.health = Math.max(0, this.state.health - 7);
          this.flashDamage();
          this.audio.hit();
          if (this.state.health <= 0) { this.die(); break; }
        }
      }
    }
    this.state.heatFloat = Math.max(0, this.state.heatFloat - dt * .008);
    this.state.heat = Math.round(this.state.heatFloat);
  }

  flashDamage() {
    const el = document.getElementById('damageFlash');
    if (!el) return;
    el.classList.add('on');
    setTimeout(() => el.classList.remove('on'), 130);
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.keys.clear();
    if (this.driving) this.exitCar();
    this.state.health = 0;
    this.audio.engine(false);
    this.ui.open('dead');
    this.save();
  }

  interact() {
    if (this.ui.openState || this.buildMode || this.dead) return;
    if (this.driving) { this.exitCar(); return; }
    const n = this.nearest;
    if (!n) return;
    if (n.kind === 'npc') {
      this.ui.open('dialogue', { npc: n.npc });
      return;
    }
    if (n.kind === 'task') {
      const duration = this.state.career === 'miner' ? 2.6 : n.task.career === 'fixer' ? 1.5 : 1.15;
      this.hold = { target: n, duration, elapsed: 0, ring: document.getElementById('holdRing') };
      return;
    }
    this.doWorldAction(n);
  }

  startHold(target, duration) {
    this.hold = { target, duration, elapsed: 0, ring: document.getElementById('holdRing') };
  }

  updateHold(dt) {
    if (!this.hold) return;
    if (!this.keys.has('KeyE') && !this.touchHolding) { this.hold = null; return; }
    this.hold.elapsed += dt;
    const pct = Math.min(100, (this.hold.elapsed / this.hold.duration) * 100);
    this.hold.ring?.style.setProperty('--hold', `${pct}%`);
    if (this.hold.elapsed >= this.hold.duration) {
      const target = this.hold.target;
      this.hold = null;
      this.hold?.ring?.style.setProperty('--hold', '0%');
      document.getElementById('holdRing')?.style.setProperty('--hold', '0%');
      if (target.kind === 'task') this.completeTask(target.task);
    }
  }

  updateLocation() {
    const p = this.driving && this.carObj ? this.carObj.position : this.player.group.position;
    let name = 'RUSTMARKET', sub = 'LOWER SPINE';
    if (p.z < -30) { name = 'THE UNDERCUT'; sub = 'NO LAW PAST THE ARCH'; }
    else if (p.x > 26) { name = 'NEON ROW'; sub = 'ELECTRIC DREAMS'; }
    else if (p.x < -26) { name = 'THE FOUNDRY'; sub = 'HOT METAL / COLD JUSTICE'; }
    else if (p.z > 32) { name = 'SHELTER ROW'; sub = 'HOMES IN THE DARK'; }
    if (name !== this.location) {
      this.location = name;
      const n = document.getElementById('locationName');
      if (n) n.textContent = name;
      const s = document.getElementById('locationSub');
      if (s) s.textContent = `${sub} // ${this.cityTime()}`;
      const dn = document.getElementById('districtName');
      if (dn) dn.textContent = name;
    }
  }

  cityTime() {
    const start = 22 * 60 + 47;
    const m = (start + Math.floor(this.elapsed / 5)) % 1440;
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  }

  updateCamera(dt) {
    const target = new THREE.Vector3();
    let desiredDist = this.camDist;
    let pitch = this.camPitch;
    if (!this.started) {
      const t = this.time;
      this.camera.position.set(7 + Math.sin(t * .09) * 2.2, 15.6 + Math.sin(t * .12) * .35, 43);
      target.set(4 + Math.sin(t * .06) * 1.2, 4.2, 1);
      this.camLook.lerp(target, .1);
      this.camera.lookAt(this.camLook);
      return;
    }
    if (this.buildMode) {
      const lot = LOTS.find(l => l.id === this.buildState?.lotId) || LOTS[0];
      target.set(lot.pos[0] + 1, 1.3, lot.pos[1] + 1);
      const desired = new THREE.Vector3(lot.pos[0] + 1, 19.5, lot.pos[1] + 15.5);
      this.camera.position.lerp(desired, 1 - Math.exp(-4.6 * dt));
      this.camLook.lerp(target, 1 - Math.exp(-5.4 * dt));
      this.camera.lookAt(this.camLook);
      return;
    }
    if (this.driving && this.carObj) {
      target.set(this.carObj.position.x, 1.1, this.carObj.position.z);
      desiredDist = 10.2;
      pitch = .28;
    } else {
      target.set(this.player.group.position.x, this.player.group.position.y + 1.4, this.player.group.position.z);
      if (this.mode === 'splash') {
        this.camera.position.lerp(new THREE.Vector3(8, 16, 43), 1 - Math.exp(-3 * dt));
        this.camLook.lerp(new THREE.Vector3(4, 4, 1), 1 - Math.exp(-4 * dt));
        this.camera.lookAt(this.camLook);
        return;
      }
    }
    const horizontal = Math.cos(pitch) * desiredDist;
    const want = new THREE.Vector3(
      target.x + Math.sin(this.camYaw) * horizontal,
      target.y + Math.sin(pitch) * desiredDist,
      target.z + Math.cos(this.camYaw) * horizontal
    );
    const safe = this.avoidCameraWalls(target, want);
    this.camera.position.lerp(safe, 1 - Math.exp(-8.5 * dt));
    this.camLook.lerp(target, 1 - Math.exp(-12 * dt));
    this.camera.lookAt(this.camLook);
  }

  avoidCameraWalls(target, want) {
    // Pull the camera in front of buildings so the view never ends up inside a wall.
    const steps = 16;
    for (let i = 2; i <= steps; i++) {
      const t = i / steps;
      const x = target.x + (want.x - target.x) * t;
      const y = target.y + (want.y - target.y) * t;
      const z = target.z + (want.z - target.z) * t;
      for (const c of this.world.colliders) {
        if ((c.y ?? 8) < 3.6) continue;
        if (y > (c.y ?? 8) + .35) continue;
        if (x > c.minX - .2 && x < c.maxX + .2 && z > c.minZ - .2 && z < c.maxZ + .2) {
          return target.clone().lerp(want, Math.max(.16, (i - 1.35) / steps));
        }
      }
    }
    return want;
  }

  updatePrompt() {
    if (!this.started) return;
    const prompt = document.getElementById('interaction');
    if (!prompt) return;
    if (this.ui.openState || this.buildMode || this.dead || this.driving) {
      prompt.classList.remove('show'); this.nearest = null; this.lastPromptKey = ''; return;
    }
    this.nearest = this.findNearest();
    if (!this.nearest) {
      prompt.classList.remove('show'); this.lastPromptKey = ''; return;
    }
    const key = `${this.nearest.kind}-${this.nearest.id}`;
    if (key !== this.lastPromptKey) {
      this.lastPromptKey = key;
      document.getElementById('promptTitle').textContent = this.nearest.label;
      document.getElementById('promptSub').textContent = this.nearest.sub || 'Press E';
      const keyEl = prompt.querySelector('.prompt-key');
      if (keyEl) keyEl.textContent = this.nearest.kind === 'task' ? 'HOLD' : 'E';
      prompt.classList.add('show');
    }
  }

  findNearest() {
    const p = this.player.group.position;
    let best = null, bestD = Infinity;
    if (this.state.job) {
      const m = this.jobMarkers[0];
      if (m) {
        const d = Math.hypot(m.position.x - p.x, m.position.z - p.z);
        if (d < 3.2) {
          const step = this.state.job.tasks[this.state.job.step];
          return { kind: 'task', id: `task-${this.state.job.step}`, label: step ? step.label.toUpperCase() : 'JOB STOP', sub: 'Hold E to complete the stop', task: step, d };
        }
      }
    }
    if (this.carObj && this.state.car.owned) {
      const d = Math.hypot(this.carObj.position.x - p.x, this.carObj.position.z - p.z);
      if (d < 3.2 && d < bestD) { bestD = d; best = { kind: 'car', id: 'car', label: 'RUSTLER GT', sub: 'Enter vehicle', d }; }
    }
    for (const npc of this.world.npcs) {
      if (!npc.group.visible) continue;
      const d = Math.hypot(npc.group.position.x - p.x, npc.group.position.z - p.z);
      if (d < 2.7 && d < bestD) {
        bestD = d;
        best = { kind: 'npc', id: npc.id, label: npc.name, sub: this.state.crew.some(c => c.id === npc.id) ? 'Crew resident · talk' : `${npc.job} · looking for work`, npc, d };
      }
    }
    for (const it of this.world.interactables) {
      const d = Math.hypot(it.pos[0] - p.x, it.pos[1] - p.z);
      if (d < (it.radius || 2.6) && d < bestD) {
        bestD = d;
        best = { kind: 'world', id: it.id, label: it.label, sub: it.sub, data: it, d };
      }
    }
    for (const [lotId, spots] of Object.entries(this.furnitureSpots || {})) {
      if (!this.state.home.owned.includes(lotId)) continue;
      for (const spot of spots) {
        const d = Math.hypot(spot.x - p.x, spot.z - p.z);
        if (d < 2.4 && d < bestD) {
          bestD = d;
          best = { kind: 'furniture', id: spot.uid, label: spot.label, sub: spot.sub, data: spot, d };
        }
      }
    }
    return best;
  }

  doWorldAction(n) {
    const it = n.data;
    if (n.kind === 'car') { this.enterCar(); return; }
    if (n.kind === 'furniture') {
      const action = it.action;
      if (action === 'rest') this.rest();
      else if (action === 'craft') this.ui.open('inventory', { stash: false });
      else if (action === 'stash') this.ui.open('inventory', { stash: true });
      else if (action === 'cook') this.ui.open('inventory');
      return;
    }
    if (!it) return;
    switch (it.action) {
      case 'careers': this.ui.open('careers'); break;
      case 'garage': this.ui.open('garage'); break;
      case 'properties': this.ui.open('properties'); break;
      case 'shop': this.ui.open('shop', { shop: it.id === 'orebuyer' ? 'ore' : it.id === 'noodles' ? 'noodles' : 'market' }); break;
      case 'food': this.useFoodStall(); break;
      case 'craft': this.ui.open('inventory'); break;
      case 'stash': this.ui.open('inventory', { stash: true }); break;
      case 'clinic': this.useClinic(); break;
      case 'build': {
        if (this.state.home.owned.includes(it.lot)) this.enterBuild(it.lot);
        else { this.ui.open('properties'); this.ui.toast('THAT LOT IS NOT YOURS YET.', 'warn'); }
        break;
      }
      case 'district': this.ui.open('map'); break;
      default: break;
    }
  }

  updateSurvival(dt) {
    if (!this.started || this.ui.openState || this.dead) return;
    this.state.hunger = Math.max(0, this.state.hunger - dt * .105);
    if (this.state.hunger <= 0) this.state.health = Math.max(0, this.state.health - dt * 1.4);
    if (this.state.career === 'medic' && this.state.health < 100 && this.state.health > 0) {
      this.state.health = Math.min(100, this.state.health + dt * .45);
    }
    if (this.state.health <= 0 && !this.dead) this.die();
  }

  updateJob(dt) {
    if (!this.state.job) return;
    this.state.job.elapsed = (this.state.job.elapsed || 0) + dt;
    const marker = this.jobMarkers[0];
    if (marker) {
      marker.userData.ring.rotation.z += dt * .7;
      marker.userData.diamond.position.y = 4.9 + Math.sin(this.time * 2.2) * .18;
      marker.userData.diamond.rotation.y += dt * 1.2;
    }
  }

  updateHUD(force = false) {
    const s = this.state;
    const set = (id, val) => { const el = document.getElementById(id); if (el && el.textContent !== String(val)) el.textContent = val; };
    set('credits', Math.round(s.credits).toLocaleString('en-US'));
    set('playerName', s.name);
    set('playerLevel', `LV.${String(s.level).padStart(2, '0')}`);
    const hb = document.getElementById('healthBar'); if (hb) hb.style.width = `${clamp(s.health, 0, 100)}%`;
    const fb = document.getElementById('hungerBar'); if (fb) fb.style.width = `${clamp(s.hunger, 0, 100)}%`;
    const sb = document.getElementById('staminaBar'); if (sb) sb.style.width = `${clamp(s.stamina, 0, 100)}%`;
    const heat = document.getElementById('heatStars');
    if (heat) heat.textContent = s.heat ? '◆'.repeat(s.heat) + '◇'.repeat(Math.max(0, 3 - s.heat)) : '';
    const town = DISTRICTS.filter(d => s.city.districts[d.id]).length;
    set('townCount', `${town} / 4 DISTRICTS SECURED`);
    set('crewCount', s.crew.length);
    const sub = document.getElementById('locationSub');
    if (sub) sub.textContent = `${this.location === 'THE UNDERCUT' ? 'NO LAW PAST THE ARCH' : this.location === 'NEON ROW' ? 'ELECTRIC DREAMS' : this.location === 'THE FOUNDRY' ? 'HOT METAL / COLD JUSTICE' : 'LOWER SPINE'} // ${this.cityTime()}`;
    this.updateHUDMission();
  }

  updateHUDMission() {
    const title = document.getElementById('missionTitle');
    if (!title) return;
    const s = this.state;
    if (s.job) {
      const career = CAREERS.find(c => c.id === s.job.careerId) || CAREERS[0];
      const step = s.job.tasks[s.job.step];
      title.textContent = career.tag;
      document.getElementById('missionDesc').textContent = step?.hint || step?.label || 'Return to the board.';
      const pct = (s.job.step / s.job.total) * 100;
      document.getElementById('missionProgress').style.width = `${pct}%`;
      document.getElementById('missionStep').textContent = `STOP ${Math.min(s.job.step + 1, s.job.total)} / ${s.job.total}`;
      document.getElementById('missionPay').textContent = `₵ ${career.pay[0]}–${career.pay[1]}`;
      const t = Math.floor(s.job.elapsed || 0);
      document.getElementById('missionTimer').textContent = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
    } else if (s.career) {
      const c = CAREERS.find(c => c.id === s.career);
      title.textContent = 'Ready for a shift';
      document.getElementById('missionDesc').textContent = `${c?.name || 'Career'} selected. Open the gig board and clock in.`;
      document.getElementById('missionProgress').style.width = '0%';
      document.getElementById('missionStep').textContent = 'CLOCK IN';
      document.getElementById('missionPay').textContent = `₵ ${c?.pay[0] || 0}+`;
      document.getElementById('missionTimer').textContent = '--:--';
    } else {
      title.textContent = 'Find your footing';
      document.getElementById('missionDesc').textContent = 'Open the GIGS board and choose a career path.';
      document.getElementById('missionProgress').style.width = '0%';
      document.getElementById('missionStep').textContent = 'STEP 0 / 0';
      document.getElementById('missionPay').textContent = '₵ 0';
      document.getElementById('missionTimer').textContent = '--:--';
    }
  }

  drawMinimap() {
    if (!this.started) return;
    const canvas = document.getElementById('minimap');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const center = W / 2;
    const scale = 3.55;
    const p = this.driving && this.carObj ? this.carObj.position : this.player.group.position;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0b100a'; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(center, center, 10, center, center, W * .7);
    g.addColorStop(0, 'rgba(216,255,69,.05)'); g.addColorStop(1, 'transparent');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const toMap = (x, z) => [center + (x - p.x) * scale, center + (z - p.z) * scale];
    // grid
    ctx.strokeStyle = 'rgba(216,255,69,.055)'; ctx.lineWidth = 1;
    const grid = 10 * scale;
    const ox = ((p.x * scale) % grid + grid) % grid;
    const oz = ((p.z * scale) % grid + grid) % grid;
    for (let x = center - ox; x < W; x += grid) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = center - oz; y < H; y += grid) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // roads
    const roadW = 15 * scale;
    ctx.strokeStyle = 'rgba(67,78,59,.88)'; ctx.lineWidth = roadW;
    ctx.beginPath(); ctx.moveTo(...toMap(0, -70)); ctx.lineTo(...toMap(0, 70)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(...toMap(-75, 0)); ctx.lineTo(...toMap(75, 0)); ctx.stroke();
    ctx.strokeStyle = 'rgba(216,255,69,.14)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(...toMap(0, -70)); ctx.lineTo(...toMap(0, 70)); ctx.stroke();
    // buildings (simplified from data, nearby only)
    for (const [x, z, w, d] of this.worldMapBuildings || []) {
      const [mx, my] = toMap(x - w / 2, z - d / 2);
      const [mx2, my2] = toMap(x + w / 2, z + d / 2);
      if (mx2 < -20 || mx > W + 20 || my2 < -20 || my > H + 20) continue;
      ctx.fillStyle = 'rgba(67,74,59,.84)';
      ctx.fillRect(mx, my, mx2 - mx, my2 - my);
      ctx.strokeStyle = 'rgba(216,255,69,.12)'; ctx.strokeRect(mx, my, mx2 - mx, my2 - my);
    }
    // active job target
    if (this.state.job && this.jobMarkers[0]) {
      const m = this.jobMarkers[0];
      const [mx, my] = toMap(m.position.x, m.position.z);
      const pulse = 4 + (Math.sin(this.time * 4) + 1) * 2;
      ctx.strokeStyle = '#d8ff45'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(mx, my, pulse + 4, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#d8ff45'; ctx.beginPath(); ctx.moveTo(mx, my - 5); ctx.lineTo(mx + 5, my); ctx.lineTo(mx, my + 5); ctx.lineTo(mx - 5, my); ctx.fill();
    }
    // NPC dots
    for (const npc of this.world.npcs) {
      if (npc.recruited) continue;
      const [nx, ny] = toMap(npc.group.position.x, npc.group.position.z);
      if (nx < 5 || nx > W - 5 || ny < 5 || ny > H - 5) continue;
      ctx.fillStyle = 'rgba(102,231,213,.7)'; ctx.beginPath(); ctx.arc(nx, ny, 1.8, 0, Math.PI * 2); ctx.fill();
    }
    // gang dots
    for (const g of this.world.gangsters) {
      if (!g.userData.gangster.alive) continue;
      const [nx, ny] = toMap(g.position.x, g.position.z);
      if (nx < 5 || nx > W - 5 || ny < 5 || ny > H - 5) continue;
      ctx.fillStyle = '#ff4545'; ctx.beginPath(); ctx.arc(nx, ny, 2.2, 0, Math.PI * 2); ctx.fill();
    }
    // lots
    for (const lot of LOTS) {
      if (!this.state.home.owned.includes(lot.id)) continue;
      const [nx, ny] = toMap(lot.pos[0], lot.pos[1]);
      ctx.strokeStyle = 'rgba(102,231,213,.8)'; ctx.lineWidth = 1.5;
      ctx.strokeRect(nx - 5, ny - 5, 10, 10);
    }
    // player arrow
    ctx.save(); ctx.translate(center, center);
    if (this.driving) ctx.rotate(-this.carHeading + Math.PI); else ctx.rotate(-this.player.group.rotation.y + Math.PI);
    ctx.fillStyle = '#d8ff45';
    ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(8, 8); ctx.lineTo(0, 4); ctx.lineTo(-8, 8); ctx.closePath(); ctx.fill();
    ctx.restore();
    // view cone
    ctx.save(); ctx.translate(center, center); ctx.rotate(-this.camYaw + Math.PI);
    const cone = ctx.createLinearGradient(0, 0, 0, -W * .48);
    cone.addColorStop(0, 'rgba(216,255,69,.11)'); cone.addColorStop(1, 'transparent');
    ctx.fillStyle = cone; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, W * .48, -Math.PI / 2 - .45, -Math.PI / 2 + .45); ctx.closePath(); ctx.fill(); ctx.restore();
    // clip vignette
    const vig = ctx.createRadialGradient(center, center, W * .18, center, center, W * .55);
    vig.addColorStop(0, 'transparent'); vig.addColorStop(1, 'rgba(4,6,4,.86)');
    ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
    // edge ticks
    ctx.strokeStyle = 'rgba(216,255,69,.2)'; ctx.lineWidth = 1;
    ctx.strokeRect(6, 6, W - 12, H - 12);
  }

  updateProduction(dt) {
    if (!this.started || this.dead) return;
    this.state.city.productionTimer += dt;
    if (this.state.city.productionTimer < 30) return;
    this.state.city.productionTimer -= 30;
    const gains = {};
    const add = (k, v) => { gains[k] = (gains[k] || 0) + v; };
    if (this.state.city.districts.rustmarket) add('credits', 8);
    if (this.state.city.districts.neon) add('credits', 12);
    if (this.state.city.districts.foundry) add('ore', 2);
    if (this.state.city.districts.undercut) add('credits', 20);
    if (this.state.city.projects.includes('water')) add('food', 1);
    if (this.state.city.projects.includes('nightmarket')) add('credits', 15);
    for (const c of this.state.crew) {
      const inc = CREW_JOBS[c.job]?.income || {};
      for (const [k, v] of Object.entries(inc)) add(k, v);
    }
    for (const lot of LOTS) if (this.state.home.owned.includes(lot.id) && lot.income) add('credits', lot.income);
    for (const [k, v] of Object.entries(gains)) {
      if (k === 'credits') this.state.credits += v;
      else this.state.resources[k] = (this.state.resources[k] || 0) + v;
    }
    const summary = Object.entries(gains).map(([k, v]) => `+${v} ${k === 'credits' ? '₵' : RESOURCES[k]?.short}`).join(' · ');
    this.ui.toast(`SHELTER CYCLE // ${summary}`);
  }

  onModalClose() {
    this.keys.clear();
    this.state.stamina = Math.max(this.state.stamina, 20);
    this.updateHUD();
  }
}

// Methods that depend on systems in separate files.
installGameplay(Game);
installBuild(Game);

Game.prototype.worldMapBuildings = worldMapData().buildings;
