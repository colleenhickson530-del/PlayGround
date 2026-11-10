import {
  CAREERS, BUILD_ITEMS, BUILD_CATS, PAINTS, LOTS, DISTRICTS, PROJECTS, CRAFT_RECIPES,
  CREW_JOBS, STYLE, CAR_COLORS, RIM_COLORS, NPC_LINES, HELP_STEPS, RESOURCES,
} from './data.js';
import { worldMapData } from './world.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const fmt = n => Math.round(n).toLocaleString('en-US');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function rankFor(xp) {
  if (xp >= 1200) return { rank: 5, label: 'LEGEND' };
  if (xp >= 720) return { rank: 4, label: 'VETERAN' };
  if (xp >= 360) return { rank: 3, label: 'PRO' };
  if (xp >= 120) return { rank: 2, label: 'REGULAR' };
  return { rank: 1, label: 'ROOKIE' };
}

function costHtml(cost, state, compact = false) {
  if (!cost) return '';
  return Object.entries(cost).filter(([, v]) => v > 0).map(([k, v]) => {
    const have = state[k] ?? state.resources?.[k] ?? 0;
    const icon = RESOURCES[k]?.icon || '';
    const label = k === 'credits' ? fmt(v) : `${v}${compact ? '' : ''}`;
    return `<span class="cost ${have < v ? 'unmet' : ''}">${compact ? '' : icon + ' '}<b>${label}</b></span>`;
  }).join('');
}

function iconSvg(career) {
  return `<span class="career-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${career.icon}</svg></span>`;
}

export function drawBust(canvas, look = {}, opts = {}) {
  if (!canvas) return;
  const w = opts.w || 240, h = opts.h || 320;
  canvas.width = w; canvas.height = h;
  const c = canvas.getContext('2d');
  const skin = look.skin || '#c98e63';
  const hair = look.hair || '#141311';
  const hairStyle = look.hairStyle || 'CROP';
  const jacket = look.jacket || '#171b15';
  const top = look.top || '#3b4034';
  const bottom = look.bottom || '#20251e';
  const accent = look.accent || '#d8ff45';
  const g = c.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#29321e'); g.addColorStop(.55, '#12170f'); g.addColorStop(1, '#080b07');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  // grid
  c.strokeStyle = 'rgba(216,255,69,.055)'; c.lineWidth = 1;
  for (let x = 0; x < w; x += 22) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
  for (let y = 0; y < h; y += 22) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
  // halo
  const halo = c.createRadialGradient(w * .52, h * .35, 3, w * .52, h * .35, w * .55);
  halo.addColorStop(0, 'rgba(216,255,69,.16)'); halo.addColorStop(1, 'rgba(216,255,69,0)');
  c.fillStyle = halo; c.fillRect(0, 0, w, h);
  c.strokeStyle = 'rgba(216,255,69,.24)'; c.lineWidth = 1;
  c.beginPath(); c.arc(w * .52, h * .4, w * .32, 0, Math.PI * 2); c.stroke();
  c.fillStyle = 'rgba(216,255,69,.05)'; c.fill();
  const cx = w * .5;
  const base = h * .97;
  const scale = w / 240;
  // torso / jacket
  c.fillStyle = jacket;
  c.beginPath();
  c.moveTo(cx - 84 * scale, base);
  c.lineTo(cx - 64 * scale, h * .64);
  c.quadraticCurveTo(cx - 45 * scale, h * .56, cx - 22 * scale, h * .53);
  c.lineTo(cx + 22 * scale, h * .53);
  c.quadraticCurveTo(cx + 46 * scale, h * .57, cx + 65 * scale, h * .65);
  c.lineTo(cx + 86 * scale, base);
  c.closePath(); c.fill();
  // inner shirt
  c.fillStyle = top;
  c.beginPath();
  c.moveTo(cx - 22 * scale, h * .53);
  c.lineTo(cx + 22 * scale, h * .53);
  c.lineTo(cx + 31 * scale, base);
  c.lineTo(cx - 31 * scale, base);
  c.closePath(); c.fill();
  // jacket lapels
  c.fillStyle = 'rgba(0,0,0,.30)';
  c.beginPath(); c.moveTo(cx - 22 * scale, h * .53); c.lineTo(cx - 29 * scale, base); c.lineTo(cx - 10 * scale, base); c.lineTo(cx - 1 * scale, h * .64); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(cx + 22 * scale, h * .53); c.lineTo(cx + 29 * scale, base); c.lineTo(cx + 10 * scale, base); c.lineTo(cx + 1 * scale, h * .64); c.closePath(); c.fill();
  // accent strap
  c.strokeStyle = accent; c.globalAlpha = .85; c.lineWidth = 3 * scale;
  c.beginPath(); c.moveTo(cx - 42 * scale, h * .72); c.lineTo(cx + 36 * scale, h * .6); c.stroke(); c.globalAlpha = 1;
  // neck
  c.fillStyle = skin;
  c.fillRect(cx - 12 * scale, h * .43, 24 * scale, 35 * scale);
  c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(cx - 12 * scale, h * .43, 24 * scale, 9 * scale);
  // head
  c.fillStyle = skin;
  c.beginPath();
  c.ellipse(cx, h * .34, 35 * scale, 44 * scale, 0, 0, Math.PI * 2); c.fill();
  // ears
  c.beginPath(); c.ellipse(cx - 35 * scale, h * .36, 6 * scale, 11 * scale, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(cx + 35 * scale, h * .36, 6 * scale, 11 * scale, 0, 0, Math.PI * 2); c.fill();
  // hair
  c.fillStyle = hair;
  if (hairStyle === 'SHAVED') {
    c.globalAlpha = .45; c.beginPath(); c.ellipse(cx, h * .3, 36 * scale, 26 * scale, 0, Math.PI, 0); c.fill(); c.globalAlpha = 1;
  } else if (hairStyle === 'MOHAWK') {
    c.beginPath(); c.moveTo(cx - 4 * scale, h * .25); c.lineTo(cx - 3 * scale, h * .16); c.lineTo(cx + 10 * scale, h * .18); c.lineTo(cx + 11 * scale, h * .29); c.closePath(); c.fill();
    c.beginPath(); c.ellipse(cx, h * .29, 34 * scale, 15 * scale, 0, Math.PI, 0); c.fill();
  } else if (hairStyle === 'LONG') {
    c.beginPath(); c.ellipse(cx, h * .28, 39 * scale, 31 * scale, 0, Math.PI, 0); c.fill();
    c.beginPath(); c.moveTo(cx - 38 * scale, h * .28); c.quadraticCurveTo(cx - 47 * scale, h * .44, cx - 34 * scale, h * .56); c.lineTo(cx - 24 * scale, h * .53); c.quadraticCurveTo(cx - 31 * scale, h * .4, cx - 29 * scale, h * .29); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(cx + 38 * scale, h * .28); c.quadraticCurveTo(cx + 47 * scale, h * .44, cx + 34 * scale, h * .56); c.lineTo(cx + 24 * scale, h * .53); c.quadraticCurveTo(cx + 31 * scale, h * .4, cx + 29 * scale, h * .29); c.closePath(); c.fill();
  } else if (hairStyle === 'BUN') {
    c.beginPath(); c.arc(cx, h * .18, 18 * scale, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(cx, h * .29, 35 * scale, 21 * scale, 0, Math.PI, 0); c.fill();
  } else if (hairStyle === 'BRAIDS') {
    c.beginPath(); c.ellipse(cx, h * .28, 37 * scale, 25 * scale, 0, Math.PI, 0); c.fill();
    for (let i = -1; i <= 1; i++) {
      c.fillRect(cx + i * 24 * scale - 4 * scale, h * .31, 8 * scale, h * .28);
      c.fillStyle = accent; c.globalAlpha = .65; c.fillRect(cx + i * 24 * scale - 4 * scale, h * .47, 8 * scale, 4 * scale); c.fillStyle = hair; c.globalAlpha = 1;
    }
  } else {
    c.beginPath(); c.ellipse(cx, h * .28, 37 * scale, 27 * scale, 0, Math.PI, 0); c.fill();
    c.fillRect(cx - 37 * scale, h * .25, 7 * scale, 17 * scale);
    c.fillRect(cx + 30 * scale, h * .25, 7 * scale, 17 * scale);
  }
  // brows
  c.strokeStyle = 'rgba(18,16,13,.7)'; c.lineWidth = 2.2 * scale;
  c.beginPath(); c.moveTo(cx - 20 * scale, h * .337); c.lineTo(cx - 8 * scale, h * .33); c.stroke();
  c.beginPath(); c.moveTo(cx + 20 * scale, h * .337); c.lineTo(cx + 8 * scale, h * .33); c.stroke();
  // eye visor
  c.fillStyle = '#151a13';
  c.fillRect(cx - 23 * scale, h * .346, 46 * scale, 7 * scale);
  c.fillStyle = accent;
  c.fillRect(cx - 18 * scale, h * .348, 8 * scale, 3 * scale);
  c.fillRect(cx + 10 * scale, h * .348, 8 * scale, 3 * scale);
  // nose
  c.strokeStyle = 'rgba(70,35,20,.35)'; c.lineWidth = 1.7 * scale;
  c.beginPath(); c.moveTo(cx + 2 * scale, h * .36); c.lineTo(cx - 2 * scale, h * .39); c.lineTo(cx + 2 * scale, h * .397); c.stroke();
  // mouth
  c.strokeStyle = 'rgba(65,28,22,.5)'; c.lineWidth = 2 * scale;
  c.beginPath(); c.moveTo(cx - 9 * scale, h * .42); c.quadraticCurveTo(cx, h * .431, cx + 10 * scale, h * .419); c.stroke();
  // tech tattoo / scar
  c.strokeStyle = accent; c.globalAlpha = .45; c.lineWidth = 1.2 * scale;
  c.beginPath(); c.moveTo(cx + 21 * scale, h * .39); c.lineTo(cx + 29 * scale, h * .4); c.lineTo(cx + 26 * scale, h * .43); c.stroke(); c.globalAlpha = 1;
  // bottom gradient
  const bg = c.createLinearGradient(0, h * .7, 0, h);
  bg.addColorStop(0, 'rgba(7,9,7,0)'); bg.addColorStop(1, 'rgba(7,9,7,.9)');
  c.fillStyle = bg; c.fillRect(0, h * .68, w, h * .32);
}

function carSvg(car) {
  const paint = car.paint || '#8f3b2b';
  const rim = car.rim || '#b9c0b5';
  const glow = car.underglowOn === false ? '#1a1a1a' : (car.underglow || '#ff4fba');
  const decal = car.decalColor || '#d8ff45';
  return `<svg viewBox="0 0 640 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Custom car preview">
    <defs>
      <linearGradient id="bodyPaint" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${paint}" stop-opacity="1"/><stop offset=".52" stop-color="${paint}"/><stop offset="1" stop-color="#080b08"/></linearGradient>
      <linearGradient id="windowG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b9e5d1" stop-opacity=".52"/><stop offset=".55" stop-color="#18221f" stop-opacity=".92"/></linearGradient>
      <radialGradient id="underGlow"><stop offset="0" stop-color="${glow}" stop-opacity=".9"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="9"/></filter>
    </defs>
    <ellipse cx="330" cy="218" rx="230" ry="24" fill="#000" opacity=".65"/>
    <ellipse cx="330" cy="211" rx="220" ry="22" fill="url(#underGlow)" opacity="${car.underglowOn === false ? .08 : .7}" filter="url(#blur)"/>
    <path d="M80 172 L104 136 L192 124 L250 88 L393 84 L466 121 L547 138 L568 167 L556 185 L90 185 Z" fill="url(#bodyPaint)" stroke="rgba(5,7,5,.65)" stroke-width="2"/>
    <path d="M250 88 L393 84 L454 123 L191 128 Z" fill="url(#windowG)" stroke="rgba(216,255,69,.15)" stroke-width="1.4"/>
    <path d="M325 88 L319 126 M399 84 L397 126" stroke="rgba(6,8,6,.65)" stroke-width="7"/>
    <path d="M104 137 L550 138 L562 163 L95 163 Z" fill="${paint}" opacity=".8"/>
    <path d="M132 155 L535 154" stroke="${decal}" stroke-width="4" opacity=".9"/>
    <path d="M150 161 L510 160" stroke="${decal}" stroke-width="1.2" opacity=".55"/>
    <path d="M90 177 L558 176" stroke="rgba(0,0,0,.7)" stroke-width="9"/>
    <path d="M109 171 L205 171" stroke="#f5ffd7" stroke-width="7" opacity=".9"/>
    <path d="M438 171 L525 170" stroke="#ff4545" stroke-width="6" opacity=".9"/>
    <path d="M110 169 L112 154 L139 154 L147 171 Z" fill="#121712"/>
    <circle cx="196" cy="183" r="43" fill="#090b08"/>
    <circle cx="196" cy="183" r="28" fill="#1b1e19" stroke="${rim}" stroke-width="3"/>
    <circle cx="196" cy="183" r="15" fill="${rim}" opacity=".8"/>
    <circle cx="196" cy="183" r="5" fill="#090b08"/>
    <circle cx="458" cy="183" r="43" fill="#090b08"/>
    <circle cx="458" cy="183" r="28" fill="#1b1e19" stroke="${rim}" stroke-width="3"/>
    <circle cx="458" cy="183" r="15" fill="${rim}" opacity=".8"/>
    <circle cx="458" cy="183" r="5" fill="#090b08"/>
    <path d="M236 93 L278 91 L272 107 L230 109 Z" fill="#0e120e" opacity=".8"/>
    <path d="M407 89 L441 91 L447 109 L413 107 Z" fill="#0e120e" opacity=".8"/>
    <path d="M181 127 L217 123 L216 132 L181 136 Z" fill="rgba(0,0,0,.2)"/>
    ${car.spoiler ? `<path d="M512 109 L579 108 L584 118 L514 120 Z" fill="#121612" stroke="${rim}" stroke-width="1"/><path d="M525 119 L532 151 M559 119 L567 151" stroke="#121612" stroke-width="7"/>` : ''}
    ${car.decal === 'tribal' ? `<path d="M250 148 L282 138 L299 148 L318 139 L339 148" fill="none" stroke="${decal}" stroke-width="4" opacity=".85"/><path d="M374 148 L400 137 L417 148 L438 139 L457 148" fill="none" stroke="${decal}" stroke-width="4" opacity=".85"/>` : ''}
    <path d="M103 142 L121 142" stroke="#f5ffd7" stroke-width="2" opacity=".6"/>
    <text x="330" y="235" text-anchor="middle" fill="${decal}" font-family="Share Tech Mono, monospace" font-size="9" letter-spacing="4" opacity=".55">SECTOR 07 // REGISTERED</text>
  </svg>`;
}

function renderPortraitCard(look) {
  return `<canvas class="portrait-canvas" data-portrait='${esc(JSON.stringify(look))}' width="220" height="130"></canvas>`;
}

export class UI {
  constructor(game) {
    this.game = game;
    this.layer = $('#modalLayer');
    this.modal = $('#modal');
    this.body = $('#modalBody');
    this.current = null;
    this.currentOpts = null;
    this.dialogueNpc = null;
    this.buildOpen = false;
    this.bind();
    this.syncNav();
  }

  get openState() { return Boolean(this.current); }

  bind() {
    $('#modalClose').addEventListener('click', () => this.close());
    $('.modal-backdrop', this.layer).addEventListener('click', () => this.close());
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.current && this.current !== 'build') this.close();
    });
    $$('.action-btn').forEach(btn => btn.addEventListener('click', () => this.game.openPanel(btn.dataset.panel)));
    this.body.addEventListener('click', e => this.handleClick(e));
    this.body.addEventListener('change', e => {
      if (e.target.matches('[data-crew-job]')) {
        this.game.assignCrewJob(e.target.dataset.crewJob, e.target.value);
        this.refresh();
      }
    });
    this.body.addEventListener('input', e => {
      if (e.target.matches('#avatarName')) {
        this.game.state.name = e.target.value.toUpperCase().slice(0, 14) || 'REN';
        this.game.updateUI();
      }
    });
  }

  syncNav() {
    const count = this.game?.state?.crew?.length || 0;
    const el = $('#crewCount'); if (el) el.textContent = count;
  }

  toast(message, type = '') {
    const stack = $('#toasts');
    if (!stack) return;
    const t = document.createElement('div');
    t.className = `toast ${type}`.trim();
    t.textContent = message;
    stack.appendChild(t);
    while (stack.children.length > 3) stack.firstElementChild.remove();
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 320); }, 2900);
  }

  open(name, opts = {}) {
    this.current = name;
    this.currentOpts = opts;
    const renderers = {
      careers: () => this.renderCareers(opts),
      crew: () => this.renderCrew(opts),
      inventory: () => this.renderInventory(opts),
      map: () => this.renderMap(opts),
      garage: () => this.renderGarage(opts),
      style: () => this.renderStyle(opts),
      properties: () => this.renderProperties(opts),
      dialogue: () => this.renderDialogue(opts),
      shop: () => this.renderShop(opts),
      complete: () => this.renderComplete(opts),
      dead: () => this.renderDead(opts),
      help: () => this.renderHelp(opts),
    };
    const fn = renderers[name];
    if (!fn) return;
    this.body.innerHTML = fn();
    this.body.scrollTop = 0;
    this.layer.classList.add('open');
    this.layer.setAttribute('aria-hidden', 'false');
    this.postRender(name);
    this.game.audio?.ui();
  }

  refresh() {
    if (this.current) {
      const scroll = this.body.scrollTop;
      this.open(this.current, this.currentOpts);
      this.body.scrollTop = scroll;
    }
  }

  close(silent = false) {
    if (!this.current && !this.layer.classList.contains('open')) return;
    this.current = null;
    this.currentOpts = null;
    this.dialogueNpc = null;
    this.layer.classList.remove('open');
    this.layer.setAttribute('aria-hidden', 'true');
    this.body.innerHTML = '';
    if (!silent) this.game.audio?.ui();
    this.game.onModalClose?.();
  }

  postRender(name) {
    if (name === 'style') {
      const cv = $('#stylePortrait');
      if (cv) drawBust(cv, this.game.state.look, { w: 300, h: 380 });
    }
    $$('[data-portrait]', this.body).forEach(cv => {
      try { drawBust(cv, JSON.parse(cv.dataset.portrait), { w: 220, h: 130 }); } catch {}
    });
    if (name === 'map') this.drawCityMap();
  }

  handleClick(e) {
    const el = e.target.closest('[data-action], [data-career], [data-start-job], [data-invite], [data-manage], [data-crew-job], [data-buy], [data-sell], [data-item], [data-craft], [data-paint], [data-rim], [data-glow], [data-decal], [data-spoiler], [data-headlights], [data-underglow], [data-car-purchase], [data-drive], [data-prop-buy], [data-prop-visit], [data-lot-build], [data-style-key], [data-style-random], [data-claim], [data-project], [data-travel], [data-respawn], [data-continue], [data-close]');
    if (!el) return;
    const d = el.dataset;
    if (d.career) { this.game.selectCareer(d.career); this.refresh(); return; }
    if (d.startJob) { this.game.startJob(d.startJob); return; }
    if (d.action) { this.handleAction(d.action, d); return; }
    if (d.invite !== undefined) { this.game.inviteCitizen(this.dialogueNpc); return; }
    if (d.manage !== undefined) { this.close(); this.game.openPanel('crew'); return; }
    if (d.buy) { this.game.shopBuy(d.buy); this.refresh(); return; }
    if (d.sell) { this.game.shopSell(d.sell); this.refresh(); return; }
    if (d.item) { this.game.useItem(d.item); this.refresh(); return; }
    if (d.craft) { this.game.craft(d.craft); this.refresh(); return; }
    if (d.paint) { this.game.setCarOption('paint', d.paint); this.refresh(); return; }
    if (d.rim) { this.game.setCarOption('rim', d.rim); this.refresh(); return; }
    if (d.glow) { this.game.setCarOption('underglow', d.glow); this.refresh(); return; }
    if (d.decal) { this.game.setCarOption('decal', d.decal); this.refresh(); return; }
    if (d.spoiler !== undefined) { this.game.setCarOption('spoiler', d.spoiler === '1'); this.refresh(); return; }
    if (d.headlights !== undefined) { this.game.setCarOption('headlights', d.headlights === '1'); this.refresh(); return; }
    if (d.underglow !== undefined) { this.game.setCarOption('underglowOn', d.underglow === '1'); this.refresh(); return; }
    if (d.carPurchase) { this.game.buyCar(); return; }
    if (d.drive) { this.game.driveCar(); return; }
    if (d.propBuy) { this.game.buyProperty(d.propBuy); this.refresh(); return; }
    if (d.propVisit) { this.game.visitLot(d.propVisit); this.close(); return; }
    if (d.lotBuild) { this.close(); this.game.enterBuild(d.lotBuild); return; }
    if (d.styleKey) { this.game.setLook(d.styleKey, d.styleValue); this.refresh(); return; }
    if (d.styleRandom) { this.game.randomizeLook(); this.refresh(); return; }
    if (d.claim) { this.game.claimDistrict(d.claim); this.refresh(); return; }
    if (d.project) { this.game.buildProject(d.project); this.refresh(); return; }
    if (d.travel) { this.game.fastTravel(d.travel); this.close(); return; }
    if (d.respawn) { this.game.respawn(); return; }
    if (d.continue) { this.close(); return; }
    if (d.close !== undefined) { this.close(); return; }
  }

  handleAction(action, d) {
    const g = this.game;
    if (action === 'eat') { g.eat(); this.refresh(); }
    else if (action === 'clinic') { g.useClinic(); this.close(); }
    else if (action === 'sleep') { g.rest(); this.close(); }
    else if (action === 'craft') { g.openPanel('inventory'); }
    else if (action === 'stash') { g.openPanel('inventory', { stash: true }); }
  }

  header(kicker, title, desc, extra = '') {
    return `<div class="panel-head"><div><span class="kicker">${kicker}</span><h2>${title}</h2></div><p>${desc}</p>${extra}</div>`;
  }

  renderCareers(opts = {}) {
    const s = this.game.state;
    const selected = opts.selected || s.career || 'courier';
    const career = CAREERS.find(c => c.id === selected) || CAREERS[0];
    const rank = rankFor(s.careerXp?.[selected] || 0);
    const active = s.job;
    return `${this.header('GIG ECONOMY // 11 PATHS', 'CHOOSE YOUR HUSTLE', 'The underground does not hand out purpose. Clock in, do the work, get paid. Every path is open.')}
      <div class="careers-body">
        <div class="career-top">
          <div class="desc">Each career sends you into the city for a real shift. Movement, timing and nerve matter. Finish the route to earn credits, resources and rank.</div>
          <div class="currency">₵ ${fmt(s.credits)} AVAILABLE</div>
        </div>
        <div class="career-grid">
          ${CAREERS.map(c => {
            const r = rankFor(s.careerXp?.[c.id] || 0);
            const isWorking = active && active.careerId === c.id;
            return `<button class="career-card ${c.id === selected ? 'active' : ''} ${isWorking ? 'working' : ''}" data-career="${c.id}">
              <div class="card-top">${iconSvg(c)}<span class="${isWorking ? 'badge' : 'tag grey'}">${isWorking ? 'ON SHIFT' : c.gang ? 'GANG' : c.risk}</span></div>
              <h4>${c.name}</h4>
              <p>${c.desc}</p>
              <span class="pay">₵${c.pay[0]}–${c.pay[1]} / SHIFT</span>
              <span class="rank">RANK ${r.rank} · ${r.label} ${c.perk ? '· ' + c.perk : ''}</span>
            </button>`;
          }).join('')}
        </div>
        <div class="career-footer">
          <div class="selected-info"><b>${career.name} <span class="tag ${career.gang ? 'pink' : ''}" style="vertical-align:middle">${career.tag}</span></b><span>${career.perk} · ${career.steps.length} stops · ${career.risk} risk</span></div>
          ${active && active.careerId === selected
            ? `<button class="cta secondary" data-action="close">RETURN TO SHIFT</button>`
            : `<button class="cta ${active ? 'orange' : ''}" data-start-job="${selected}">${active ? 'ABANDON + CLOCK IN' : 'CLOCK IN'} →</button>`}
        </div>
        ${career.warning ? `<div class="warning-line">${career.warning}</div>` : ''}
        ${active ? `<div class="warning-line" style="color:#ffbb55">ACTIVE SHIFT: ${CAREERS.find(c => c.id === active.careerId)?.name} · ${active.step}/${active.total} STOPS COMPLETE</div>` : ''}
      </div>`;
  }

  renderCrew() {
    const s = this.game.state;
    const beds = this.game.housingBeds();
    const free = beds - s.crew.length;
    const totalIncome = s.crew.reduce((acc, c) => {
      const inc = CREW_JOBS[c.job]?.income || {};
      for (const [k, v] of Object.entries(inc)) acc[k] = (acc[k] || 0) + v;
      return acc;
    }, {});
    const incomeText = Object.entries(totalIncome).map(([k, v]) => `${v} ${RESOURCES[k]?.short || k}`).join(' · ') || 'No production';
    return `${this.header('SHELTER CITY // RESIDENTS', 'YOUR CREW', 'Every resident needs a bed. Assign work and the town produces while you are out on shift.')}
      <div class="panel-content">
        <div class="crew-summary">
          <div class="stat-card"><b>${s.crew.length}</b><span>RESIDENTS</span></div>
          <div class="stat-card"><b>${beds}</b><span>BEDS BUILT</span></div>
          <div class="stat-card"><b>${free}</b><span>FREE BEDS</span></div>
          <div class="stat-card"><b style="font-size:17px">${incomeText}</b><span>PER CITY CYCLE</span></div>
        </div>
        ${s.crew.length ? `<div class="crew-grid">${s.crew.map(c => {
          const job = CREW_JOBS[c.job] || CREW_JOBS.idle;
          return `<div class="crew-card">
            <div class="portrait">${renderPortraitCard(c.look)}</div>
            <h4>${esc(c.name)} <span class="hire-job">${job.label.toUpperCase()}</span></h4>
            <p>${job.desc} ${Object.entries(job.income).map(([k, v]) => `<b style="color:#d8ff45">+${v} ${RESOURCES[k]?.short}</b>`).join(' ')}</p>
            <select data-crew-job="${c.id}" aria-label="Assign ${esc(c.name)} a job">
              ${Object.entries(CREW_JOBS).map(([id, j]) => `<option value="${id}" ${id === c.job ? 'selected' : ''}>${j.label}</option>`).join('')}
            </select>
          </div>`;
        }).join('')}</div>` : `<div class="empty-state"><b>THE SHELTER IS QUIET</b>Meet citizens in the streets and invite them home.<br />You can house ${free} more resident${free === 1 ? '' : 's'}. Build more beds to grow.</div>`}
        <div class="warning-line">To invite a resident you need a free bed. Open BUILD at an owned lot to place a Sleep Pod.</div>
      </div>`;
  }

  renderInventory(opts = {}) {
    const s = this.game.state;
    const items = [
      ['medgel', 'Med Gel', 'Restores 35 health.'],
      ['ration', 'Cooked Ration', 'A hot meal. +35 food.'],
      ['repairkit', 'Repair Kit', 'Used at the garage.'],
    ].filter(([id]) => (s.inventory?.[id] || 0) > 0);
    return `${this.header(opts.stash ? 'BLOCK STASH // SHARED' : 'PACK // SURVIVAL', opts.stash ? 'STASH & CRAFT' : 'YOUR PACK', 'Everything you own fits in a bag. Build crates at home to keep the rest.')}
      <div class="panel-content inv-layout">
        <div>
          <div class="section-label"><span>RESOURCES</span><b>${fmt(s.credits)} CREDITS</b></div>
          <div class="resource-grid">
            ${Object.entries(RESOURCES).filter(([k]) => k !== 'credits').map(([k, r]) => `<div class="resource-card"><div class="res-icon">${r.icon}</div><div><span>${r.label.toUpperCase()}</span><b>${fmt(s.resources[k] || 0)}</b></div></div>`).join('')}
          </div>
          <div class="section-label" style="margin-top:20px"><span>CONSUMABLES</span><b>${items.length ? items.length + ' ITEMS' : 'NOTHING'}</b></div>
          ${items.length ? `<div class="item-list">${items.map(([id, name, desc]) => `<div class="item-row"><div class="res-icon">${id === 'medgel' ? '✚' : id === 'ration' ? '◉' : '⚒'}</div><div><b>${name}</b><span>${desc}</span></div><em>x${s.inventory[id]}</em><button class="eat-btn" style="width:auto;padding:5px 9px;font-size:10px" data-item="${id}">USE</button></div>`).join('')}</div>` : `<div class="empty-state" style="padding:20px"><b>PACK IS LIGHT</b>Loot salvage, harvest glowcaps, or craft supplies at a workbench.</div>`}
          <div class="section-label" style="margin-top:20px"><span>QUICK ACTIONS</span></div>
          <button class="eat-btn" data-action="eat">EAT A RATION · +30 FOOD</button>
        </div>
        <aside class="side-panel">
          <h3>CRAFT STATION</h3>
          <p>Workbenches turn scrap into survival. Crafting is available anywhere, but a bench makes it cheaper.</p>
          <div class="craft-list">
            ${CRAFT_RECIPES.map(r => `<div class="recipe"><div><b>${r.name}</b><span>${r.desc} · ${Object.entries(r.cost).map(([k, v]) => `${v} ${RESOURCES[k]?.short}`).join(' + ')}</span></div><button class="eat-btn" data-craft="${r.id}">CRAFT</button></div>`).join('')}
          </div>
          <div class="divider"></div>
          <div class="section-label"><span>BODY</span><b>${Math.round(s.hunger)}% FED</b></div>
          <div class="progress-mini"><i style="width:${Math.round(s.hunger)}%"></i></div>
          <p style="margin-top:8px">Hunger drains slowly. At zero it starts taking health. Sleep, food, and med gel restore you.</p>
        </aside>
      </div>`;
  }

  renderMap(opts = {}) {
    const s = this.game.state;
    const owned = DISTRICTS.filter(d => s.city.districts[d.id]).length;
    const projectsDone = s.city.projects.length;
    return `${this.header('CITY NETWORK // BUILD TOWN BY TOWN', 'THE UNDERGROUND', 'Claim districts, fund public works, and turn a survival camp into a city. Each district adds production and a place in the world.')}
      <div class="panel-content map-layout">
        <div class="city-map"><canvas id="cityMap"></canvas>
          <div class="map-overlay-stats"><b>LIVE NETWORK</b><span>${owned} / 4 DISTRICTS SECURED</span><span>${s.crew.length} RESIDENTS · ${projectsDone} PROJECTS</span><span>CYCLE ${s.city.productionTimer.toFixed(0)}s / 30s</span></div>
          <div class="map-legend"><span>FRIENDLY</span><span class="owned">SECURED</span><span class="enemy">CONTESTED</span></div>
        </div>
        <div>
          <div class="section-label"><span>DISTRICT CONTROL</span><b>${fmt(s.credits)} ₵</b></div>
          <div class="district-list">
            ${DISTRICTS.map(d => {
              const isOwned = s.city.districts[d.id];
              const claim = d.claim;
              return `<div class="district-card ${isOwned ? 'owned' : d.contested ? 'contested' : ''}">
                <h4>${d.name}<span class="tag ${isOwned ? '' : d.contested ? 'orange' : 'grey'}" style="${isOwned ? 'border-color:#66e7d5;color:#66e7d5' : ''}">${isOwned ? 'SECURED' : 'CONTESTED'}</span></h4>
                <p>${d.desc}</p>
                <div class="row"><span class="tag orange" style="border-color:rgba(238,240,227,.13);color:#9aa18f">${d.production}</span>${isOwned ? `<button class="cta small secondary" data-travel="${d.id}">TRAVEL</button>` : `<button class="cta small" data-claim="${d.id}" ${d.claim && !this.game.canAfford(d.claim) ? 'style="opacity:.65"' : ''}>CLAIM · ${costHtml(claim, s, true)}</button>`}</div>
              </div>`;
            }).join('')}
          </div>
          <div class="section-label" style="margin-top:16px"><span>PUBLIC WORKS</span><b>${projectsDone} BUILT</b></div>
          <div class="project-grid">
            ${PROJECTS.map(p => {
              const done = s.city.projects.includes(p.id);
              const districtOwned = s.city.districts[p.district];
              return `<div class="project ${done ? 'done' : ''}"><h5>${p.name}<span style="font-family:var(--mono);font-size:6px;color:${done ? '#66e7d5' : '#7e8673'}">${done ? 'ONLINE' : districtOwned ? 'READY' : 'LOCKED'}</span></h5><p>${p.desc}</p><button class="build-project" data-project="${p.id}" ${done || !districtOwned ? 'disabled style="opacity:.4"' : ''}>${done ? 'COMPLETED' : `BUILD · ${Object.entries(p.cost).map(([k, v]) => v + RESOURCES[k]?.short).join(' ')}`}</button></div>`;
            }).join('')}
          </div>
        </div>
      </div>`;
  }

  drawCityMap() {
    const canvas = $('#cityMap'); if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(360, Math.floor(rect.width * 2)); canvas.height = Math.max(400, Math.floor(rect.height * 2));
    const c = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    c.fillStyle = '#080c08'; c.fillRect(0, 0, W, H);
    const worldToMap = (x, z) => [((x + 72) / 144) * W, ((z + 66) / 126) * H];
    // grid
    c.strokeStyle = 'rgba(216,255,69,.05)'; c.lineWidth = 1;
    for (let i = 0; i < 20; i++) { c.beginPath(); c.moveTo(i * W / 20, 0); c.lineTo(i * W / 20, H); c.stroke(); c.beginPath(); c.moveTo(0, i * H / 20); c.lineTo(W, i * H / 20); c.stroke(); }
    // district glow
    for (const d of DISTRICTS) {
      const owned = this.game.state.city.districts[d.id];
      const [x, y] = worldToMap(d.x, d.z);
      const grad = c.createRadialGradient(x, y, 2, x, y, W * .22);
      grad.addColorStop(0, owned ? 'rgba(102,231,213,.18)' : 'rgba(255,69,69,.09)');
      grad.addColorStop(1, 'transparent');
      c.fillStyle = grad; c.fillRect(0, 0, W, H);
    }
    // roads
    c.strokeStyle = '#2a3226'; c.lineWidth = W * .062;
    c.beginPath(); c.moveTo(...worldToMap(0, -66)); c.lineTo(...worldToMap(0, 60)); c.stroke();
    c.beginPath(); c.moveTo(...worldToMap(-72, 0)); c.lineTo(...worldToMap(72, 0)); c.stroke();
    c.strokeStyle = 'rgba(216,255,69,.24)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(...worldToMap(0, -66)); c.lineTo(...worldToMap(0, 60)); c.stroke();
    // buildings
    for (const [x, z, w, d] of worldMapData().buildings) {
      const [px, py] = worldToMap(x, z);
      const [x2, y2] = worldToMap(x + w / 2, z + d / 2);
      const [x1, y1] = worldToMap(x - w / 2, z - d / 2);
      c.fillStyle = '#3b4335'; c.fillRect(x1, y1, x2 - x1, y2 - y1);
      c.strokeStyle = 'rgba(216,255,69,.13)'; c.strokeRect(x1, y1, x2 - x1, y2 - y1);
    }
    // US symbol
    c.strokeStyle = 'rgba(216,255,69,.32)'; c.lineWidth = 1;
    const [ux, uy] = worldToMap(0, 7);
    c.beginPath(); c.arc(ux, uy, 5, 0, Math.PI * 2); c.stroke();
    // lots
    for (const lot of LOTS) {
      const owned = this.game.state.home.owned.includes(lot.id);
      const [x, y] = worldToMap(lot.pos[0], lot.pos[1]);
      c.fillStyle = owned ? 'rgba(102,231,213,.65)' : 'rgba(255,255,255,.25)';
      c.fillRect(x - 4, y - 4, 8, 8);
      c.strokeStyle = owned ? '#66e7d5' : '#8c9480'; c.strokeRect(x - 7, y - 7, 14, 14);
    }
    // beacons
    for (const d of DISTRICTS) {
      const [x, y] = worldToMap(d.x, d.z);
      c.fillStyle = this.game.state.city.districts[d.id] ? '#66e7d5' : '#ff4545';
      c.beginPath(); c.moveTo(x, y - 7); c.lineTo(x + 7, y); c.lineTo(x, y + 7); c.lineTo(x - 7, y); c.fill();
    }
    // active job
    if (this.game.jobMarkers?.length) {
      for (const m of this.game.jobMarkers) {
        const [x, y] = worldToMap(m.position.x, m.position.z);
        c.fillStyle = '#d8ff45'; c.beginPath(); c.arc(x, y, 5 + (Math.sin(performance.now() / 300) + 1) * 2, 0, Math.PI * 2); c.fill();
      }
    }
    // player
    const p = this.game.player.group.position;
    const [px, py] = worldToMap(p.x, p.z);
    c.save(); c.translate(px, py); c.rotate(-this.game.player.group.rotation.y);
    c.fillStyle = '#d8ff45'; c.beginPath(); c.moveTo(0, -9); c.lineTo(7, 7); c.lineTo(0, 3); c.lineTo(-7, 7); c.closePath(); c.fill();
    c.restore();
    // labels
    c.font = '600 12px "Share Tech Mono", monospace'; c.textAlign = 'center';
    for (const d of DISTRICTS) {
      const [x, y] = worldToMap(d.x, d.z);
      c.fillStyle = this.game.state.city.districts[d.id] ? d.color : '#8d9580';
      c.fillText(d.short, x, y + 25);
    }
    c.fillStyle = 'rgba(216,255,69,.5)'; c.font = '8px "Share Tech Mono", monospace'; c.fillText('N', W - 18, 18);
  }

  renderGarage() {
    const s = this.game.state;
    const car = s.car;
    const mechanic = s.career === 'mechanic';
    const hasKit = (s.inventory?.repairkit || 0) > 0;
    const baseCost = mechanic ? 187 : 220;
    const repairCost = Math.max(0, baseCost - (hasKit ? 60 : 0));
    const scrapCost = mechanic ? 5 : 6;
    const canBuy = s.credits >= repairCost && s.resources.scrap >= scrapCost;
    return `${this.header('CHOP SHOP // BAY 02', car.owned ? 'YOUR RIDE' : 'THE DEAD COUPE', 'Buy the wreck, rebuild it, then make it yours. Paint, rims, underglow, decals and a spoiler change the actual car in the world.')}
      <div class="panel-content garage-layout">
        <div>
          <div class="garage-preview">
            <span class="garage-watermark">RUSTLER GT // S/N 3120–088</span>
            ${carSvg(car)}
            <div class="preview-name"><b>${car.owned ? 'RUSTLER GT' : 'WRECK // UNCLAIMED'}</b><span>${car.owned ? 'READY TO DRIVE' : 'NEEDS A SPINE'}</span></div>
          </div>
          <div class="spec-row"><span>TOP SPEED</span><b>212 KM/H</b></div>
          <div class="spec-row"><span>DRIVE</span><b>REAR / AUTOMATIC</b></div>
          <div class="spec-row"><span>OWNER</span><b>${car.owned ? esc(s.name) : 'NOBODY'}</b></div>
          <div class="spec-row"><span>VALUE</span><b>${car.owned ? '₵ 1,840' : `₵ ${repairCost} + ${scrapCost} SCRAP`}</b></div>
        </div>
        <div class="garage-controls">
          ${car.owned ? `
            <h3>MAKE IT ILLEGAL</h3>
            <p class="garage-desc">The paint shop is open. Every change applies live to the car parked outside.</p>
            <div class="paint-row"><span>BODY PAINT</span><div class="swatches">${CAR_COLORS.map(c => `<button class="swatch ${car.paint === c ? 'active' : ''}" style="background:${c}" data-paint="${c}" aria-label="Paint ${c}"></button>`).join('')}</div></div>
            <div class="paint-row"><span>RIM FINISH</span><div class="swatches">${RIM_COLORS.map(c => `<button class="swatch ${car.rim === c ? 'active' : ''}" style="background:${c}" data-rim="${c}" aria-label="Rims ${c}"></button>`).join('')}</div></div>
            <div class="paint-row"><span>UNDERGLOW</span><div class="swatches">${['#ff4fba', '#d8ff45', '#66e7d5', '#8e5dff', '#ff7a2f'].map(c => `<button class="swatch ${car.underglow === c ? 'active' : ''}" style="background:${c}" data-glow="${c}" aria-label="Glow ${c}"></button>`).join('')}</div></div>
            <div class="paint-row"><span>DECAL</span><div class="swatches">
              <button class="style-option ${car.decal === 'none' ? 'active' : ''}" data-decal="none">NONE</button>
              <button class="style-option ${car.decal === 'stripe' ? 'active' : ''}" data-decal="stripe">STRIPE</button>
              <button class="style-option ${car.decal === 'tribal' ? 'active' : ''}" data-decal="tribal">TRIBAL</button>
            </div></div>
            <div class="toggle-row"><span>REAR SPOILER</span><button class="switch ${car.spoiler ? 'on' : ''}" data-spoiler="${car.spoiler ? '0' : '1'}" aria-label="Toggle spoiler"></button></div>
            <div class="toggle-row"><span>UNDERGLOW ACTIVE</span><button class="switch ${car.underglowOn ? 'on' : ''}" data-underglow="${car.underglowOn ? '0' : '1'}" aria-label="Toggle underglow"></button></div>
            <div class="toggle-row"><span>HEADLIGHTS</span><button class="switch ${car.headlights ? 'on' : ''}" data-headlights="${car.headlights ? '0' : '1'}" aria-label="Toggle headlights"></button></div>
            <div class="garage-actions"><button class="cta" data-drive="1">DRIVE OUT →</button><button class="cta secondary" data-action="close">LEAVE BAY</button></div>
          ` : `
            <h3>BRING IT BACK</h3>
            <p class="garage-desc">The coupe has a cracked block, dead cells, and a family of mushrooms in the footwell. The frame is straight. That’s enough.</p>
            <div class="buy-box">
              <p>REPAIR + TITLE + KEYS</p>
              <div class="price-line">₵ ${repairCost} <span>+ ${scrapCost} SCRAP${hasKit ? ' · KIT APPLIED' : ''}</span></div>
              <p>${hasKit ? 'Your repair kit covers the labour. Customise after purchase.' : 'Includes basic paint. Craft a repair kit to cut ₵60 off the bill.'}</p>
              <button class="cta ${canBuy ? '' : 'dim'}" data-car-purchase="1">BUY & REPAIR →</button>
            </div>
            <div class="spec-row"><span>MECHANIC PERK</span><b>−15% REPAIR COST</b></div>
            <p class="garage-desc">Tip: take the Mechanic career shift or bring a repair kit to fix the coupe yourself. The garage remembers.</p>
          `}
        </div>
      </div>`;
  }

  renderStyle() {
    const look = this.game.state.look;
    return `${this.header('CIVILIAN ID // SELF-IMAGE', 'MAKE YOURSELF', 'Face, hair, clothes, colour. You are whoever you decide to be down here.')}
      <div class="panel-content style-layout">
        <div class="avatar-stage"><span class="stage-line"></span><canvas id="stylePortrait"></canvas></div>
        <div class="style-controls">
          <h3>IDENTITY</h3>
          <div class="style-group"><label>NAME <span>${look.hairStyle} / ${look.accent}</span></label><input id="avatarName" class="name-input" maxlength="14" value="${esc(this.game.state.name)}" /></div>
          <div class="style-group"><label>SKIN TONE</label><div class="style-options">${STYLE.skin.map(c => `<button class="color-option ${look.skin === c ? 'active' : ''}" style="background:${c}" data-style-key="skin" data-style-value="${c}" aria-label="Skin ${c}"></button>`).join('')}</div></div>
          <div class="style-group"><label>HAIR COLOUR</label><div class="style-options">${STYLE.hair.map(c => `<button class="color-option ${look.hair === c ? 'active' : ''}" style="background:${c}" data-style-key="hair" data-style-value="${c}" aria-label="Hair ${c}"></button>`).join('')}</div></div>
          <div class="style-group"><label>HAIR STYLE</label><div class="style-options">${STYLE.hairStyle.map(v => `<button class="style-option ${look.hairStyle === v ? 'active' : ''}" data-style-key="hairStyle" data-style-value="${v}">${v}</button>`).join('')}</div></div>
          <div class="style-group"><label>JACKET</label><div class="style-options">${STYLE.jacket.map(c => `<button class="color-option ${look.jacket === c ? 'active' : ''}" style="background:${c}" data-style-key="jacket" data-style-value="${c}" aria-label="Jacket ${c}"></button>`).join('')}</div></div>
          <div class="style-group"><label>SHIRT</label><div class="style-options">${STYLE.top.map(c => `<button class="color-option ${look.top === c ? 'active' : ''}" style="background:${c}" data-style-key="top" data-style-value="${c}" aria-label="Shirt ${c}"></button>`).join('')}</div></div>
          <div class="style-group"><label>TROUSERS</label><div class="style-options">${STYLE.bottom.map(c => `<button class="color-option ${look.bottom === c ? 'active' : ''}" style="background:${c}" data-style-key="bottom" data-style-value="${c}" aria-label="Trousers ${c}"></button>`).join('')}</div></div>
          <div class="style-group"><label>ACCENT / NEON</label><div class="style-options">${STYLE.accent.map(c => `<button class="color-option ${look.accent === c ? 'active' : ''}" style="background:${c}" data-style-key="accent" data-style-value="${c}" aria-label="Accent ${c}"></button>`).join('')}</div></div>
          <div class="style-footer"><span>Changes apply instantly to your avatar.</span><button class="cta secondary small" data-style-random="1">RANDOMISE</button><button class="cta small" data-action="close">DONE</button></div>
        </div>
      </div>`;
  }

  renderProperties() {
    const s = this.game.state;
    return `${this.header('REAL ESTATE // DEAD-END DREAMS', 'OWN A HOLE IN THE WORLD', 'Buy a lot, build a home, paint the walls. Property income is paid every city cycle.')}
      <div class="panel-content">
        <div class="section-label"><span>AVAILABLE LOTS</span><b>${fmt(s.credits)} ₵ AVAILABLE</b></div>
        <div class="property-grid">
          ${LOTS.map(lot => {
            const owned = s.home.owned.includes(lot.id);
            const districtSecured = !lot.districtId || s.city.districts[lot.districtId];
            const canBuy = s.credits >= lot.price && districtSecured;
            const beds = this.game.bedsAt(lot.id);
            return `<div class="property-card">
              <div class="property-image"><span>${lot.district.toUpperCase()} / ${lot.size * lot.size} TILES</span><svg class="prop-art" viewBox="0 0 300 122" preserveAspectRatio="none"><path d="M0 105 L35 82 L52 96 L82 64 L104 85 L137 51 L167 78 L200 40 L226 72 L255 55 L300 84 L300 122 L0 122Z" fill="rgba(10,14,9,.8)"/><rect x="102" y="47" width="88" height="75" fill="#39412f"/><rect x="115" y="60" width="15" height="20" fill="#d8ff45" opacity=".55"/><rect x="145" y="60" width="15" height="20" fill="#d8ff45" opacity=".28"/><rect x="160" y="88" width="18" height="34" fill="#242b20"/><path d="M92 48 L145 28 L198 48" stroke="#7c886c" stroke-width="3" fill="none"/></svg></div>
              <div class="property-info"><h4>${lot.name}</h4><p>${lot.desc}</p>
                <div class="row"><span class="prop-price">${owned ? 'OWNED' : lot.price ? '₵ ' + fmt(lot.price) : 'STARTER PLOT'}</span>${owned ? `<span class="prop-owned">${beds} BED${beds === 1 ? '' : 'S'} · ${lot.income ? '+' + lot.income + '₵/CYCLE' : 'HOME'}</span>` : districtSecured ? `<button class="cta small ${canBuy ? '' : 'dim'}" data-prop-buy="${lot.id}">BUY LOT</button>` : `<span class="tag orange">CLAIM ${lot.district.toUpperCase()}</span>`}</div>
                ${owned ? `<button class="cta secondary small" data-lot-build="${lot.id}">VISIT + BUILD</button>` : `<button class="cta secondary small" data-prop-visit="${lot.id}">VIEW LOT</button>`}
              </div>
            </div>`;
          }).join('')}
        </div>
        <div class="warning-line">Build beds to increase housing. Beds placed in any owned lot count citywide.</div>
      </div>`;
  }

  renderDialogue(opts) {
    const npc = opts.npc || this.dialogueNpc;
    if (!npc) return '';
    this.dialogueNpc = npc;
    const s = this.game.state;
    const free = this.game.housingBeds() - s.crew.length;
    const resident = s.crew.find(c => c.id === npc.id);
    return `<div class="dialogue-layout">
      <div class="dialogue-portrait"><canvas data-portrait='${esc(JSON.stringify(npc.group.userData.look))}'></canvas></div>
      <div class="dialogue-content">
        <div class="dialogue-meta"><span>RESIDENT OF THE STACKS</span><b>${npc.job.toUpperCase()}</b><span>·</span><b>${resident ? 'IN YOUR CREW' : 'LOOKING FOR A HOME'}</b></div>
        <h2 class="dialogue-name">${esc(npc.name)}<span>“${npc.dialogue}”</span></h2>
        <p class="dialogue-text">“${resident ? 'Got a bed and a job. That makes you family, or at least my landlord. Either way, I’m in.' : `I heard you’re building something. I can work. I can keep my mouth shut. All I need is a bed and a reason to stay.`}”</p>
        <div class="dialogue-actions">
          ${resident
            ? `<button class="cta small" data-manage="1">MANAGE CREW →</button>`
            : `<button class="cta small ${free > 0 ? '' : 'dim'}" data-invite="1">INVITE TO SHELTER ${free > 0 ? `(${free} BED FREE)` : '(NO BED)'}</button>`}
          <button class="cta secondary small" data-close="1">WALK AWAY</button>
        </div>
      </div>
    </div>`;
  }

  renderShop(opts = {}) {
    const s = this.game.state;
    const id = opts.shop || 'market';
    const title = id === 'noodles' ? 'NOODLE BAR // 24H' : id === 'ore' ? 'ORE BUYER // FOUNDRY' : 'MARKET ROW';
    const foodMult = s.career === 'merchant' ? 1.15 : 1;
    const buys = [
      { id: 'food', name: 'Glowcap Noodles', desc: '+3 rations. Hot, salty, alive.', price: 18, icon: '◉' },
      { id: 'scrap', name: 'Scrap Bundle', desc: '+4 scrap for building.', price: 32, icon: '▧' },
      { id: 'fiber', name: 'Fibre Roll', desc: '+3 fibre for beds and clothes.', price: 21, icon: '≋' },
      { id: 'paint', name: 'Spray Can', desc: '+2 spray. Any colour.', price: 16, icon: '◐' },
    ];
    return `${this.header(`TRADE // ${title}`, 'BUY, SELL, SURVIVE', 'The market takes credits and salvage. Prices shift with your career. Selling gives clean credit, no questions.')}
      <div class="panel-content">
        <div class="inv-layout">
          <div>
            <div class="section-label"><span>BUY SUPPLIES</span><b>₵ ${fmt(s.credits)}</b></div>
            <div class="item-list">
              ${buys.map(b => `<div class="item-row"><div class="res-icon">${b.icon}</div><div><b>${b.name}</b><span>${b.desc}</span></div><em>₵ ${Math.round(b.price * (id === 'noodles' ? 1.2 : 1))}</em><button class="eat-btn" style="width:auto;padding:6px 10px" data-buy="${b.id}">BUY</button></div>`).join('')}
            </div>
          </div>
          <aside class="side-panel">
            <h3>SELL SALVAGE</h3>
            <p>Your pack: ${Object.entries(s.resources).map(([k, v]) => `${v} ${RESOURCES[k]?.short}`).join(' · ')}</p>
            <div class="item-list">
              <div class="item-row"><div><b>Scrap</b><span>₵ 7 each</span></div><button class="eat-btn" style="width:auto;padding:6px 10px" data-sell="scrap">SELL 1</button></div>
              <div class="item-row"><div><b>Biometal</b><span>₵ ${Math.round(28 * foodMult)} each</span></div><button class="eat-btn" style="width:auto;padding:6px 10px" data-sell="ore">SELL 1</button></div>
              <div class="item-row"><div><b>Fibre</b><span>₵ 5 each</span></div><button class="eat-btn" style="width:auto;padding:6px 10px" data-sell="fiber">SELL 1</button></div>
            </div>
            <div class="divider"></div>
            <p style="color:#d8ff45">${s.career === 'merchant' ? 'STALL SHARK PERK ACTIVE: +15% SELL VALUE' : 'Choose the Stall Trader path for better sell prices.'}</p>
            <button class="cta secondary" style="width:100%;margin-top:12px" data-close="1">BACK TO THE STREET</button>
          </aside>
        </div>
      </div>`;
  }

  renderComplete(opts) {
    const r = opts.result || { rewards: {}, career: 'courier', seconds: 0, rank: 1, title: 'Shift complete' };
    return `<div class="complete-card">
      <div class="kicker">SHIFT CLOSED // PAYROLL RELEASED</div>
      <div class="star-strip">${'★'.repeat(Math.min(5, r.stars))}${'☆'.repeat(Math.max(0, 5 - r.stars))}</div>
      <h2>${esc(r.title)}</h2>
      <p>${esc(r.rankLabel)} ${esc(r.careerName)}. ${r.flavor || 'The block remembers who showed up.'}</p>
      <div class="reward-row">
        ${Object.entries(r.rewards).map(([k, v]) => `<div class="reward-chip"><span>${RESOURCES[k]?.label.toUpperCase() || k.toUpperCase()}</span><b>${k === 'xp' ? '+' + v + ' XP' : k === 'credits' ? '₵ ' + fmt(v) : '+' + v}</b></div>`).join('')}
      </div>
      <button class="cta" data-continue="1">BACK TO THE STREET →</button>
    </div>`;
  }

  renderDead() {
    const s = this.game.state;
    const fee = Math.max(20, Math.round(s.credits * .12));
    return `<div class="dead-card"><div class="kicker" style="color:#ff7a2f">VITALS LOST // THE CITY KEEPS GOING</div><h2>FLATLINE</h2><p>They dragged you to the street clinic. The block took its cut. You are still breathing — that is the good news.</p><div class="med-cost">CLINIC FEE: ₵ ${fee} · RATIONS LOST · HEAT +1</div><button class="cta orange" data-respawn="1">WAKE UP AT THE CLINIC →</button></div>`;
  }

  renderHelp() {
    return `${this.header('FIELD MANUAL // GRIMLINE', 'HOW TO SURVIVE', 'A short manual for the last city. Read once, improvise forever.')}
      <div class="panel-content manual-layout">
        <div class="manual-steps">${HELP_STEPS.map(([n, t, d]) => `<div class="manual-step"><b>${n}</b><div><h4>${t}</h4><p>${d}</p></div></div>`).join('')}</div>
        <aside class="manual-side">
          <h3>CONTROLS</h3>
          <div class="key-row"><span>MOVE</span><kbd>W A S D</kbd></div>
          <div class="key-row"><span>SPRINT / JUMP</span><kbd>SHIFT / SPACE</kbd></div>
          <div class="key-row"><span>INTERACT / HOLD</span><kbd>E</kbd></div>
          <div class="key-row"><span>STRIKE</span><kbd>F</kbd></div>
          <div class="key-row"><span>ORBIT CAMERA</span><kbd>DRAG MOUSE</kbd></div>
          <div class="key-row"><span>BUILD</span><kbd>B</kbd></div>
          <div class="key-row"><span>CAREERS</span><kbd>J</kbd></div>
          <div class="key-row"><span>PACK</span><kbd>I</kbd></div>
          <div class="key-row"><span>TOWN</span><kbd>M</kbd></div>
          <div class="key-row"><span>GARAGE</span><kbd>G</kbd></div>
          <div class="key-row"><span>STYLE</span><kbd>C</kbd></div>
          <div class="key-row"><span>TOUCH</span><kbd>JOYSTICK + BUTTONS</kbd></div>
          <div class="divider"></div>
          <p>Jobs are real routes: follow the acid diamond, hold E at each stop, and return. Sleep in a bed. Eat before hunger empties. If a gangster swings first, swing harder.</p>
        </aside>
      </div>`;
  }

  // ---------- BUILD UI ----------
  openBuildUI(lot, selection) {
    this.buildOpen = true;
    let el = $('#buildUI');
    if (el) el.remove();
    el = document.createElement('div');
    el.id = 'buildUI'; el.className = 'build-ui';
    el.innerHTML = this.buildMarkup(lot, selection);
    $('#game').appendChild(el);
    this.bindBuild(el);
    document.body.classList.add('building');
  }

  closeBuildUI() {
    this.buildOpen = false;
    $('#buildUI')?.remove();
    document.body.classList.remove('building');
  }

  buildMarkup(lot, sel) {
    const s = this.game.state;
    const cat = sel.category || 'furniture';
    const items = BUILD_ITEMS.filter(i => i.cat === cat);
    return `<div class="build-top">
      <div class="title">BUILD MODE // <span>${esc(lot.name.toUpperCase())}</span></div>
      <div class="res-row">${['scrap', 'wood', 'fiber', 'paint', 'ore'].map(k => `<span data-bres="${k}">${RESOURCES[k].icon} <b>${s.resources[k] || 0}</b></span>`).join('')}</div>
      <button class="exit-build" data-bexit="1">EXIT BUILD</button>
    </div>
    <div class="build-info">
      <b>${esc(lot.district.toUpperCase())} LOT</b>
      <p>Click a cell to place. Rotate with R. Erase with X. The city remembers every wall.</p>
      <div class="room-count">${this.game.bedsAt(lot.id)} BED${this.game.bedsAt(lot.id) === 1 ? '' : 'S'} · ${(s.home.layouts?.[lot.id]?.items?.length || 0)} PIECES PLACED</div>
    </div>
    <div class="build-catalog">
      <div class="cat-tabs">
        ${BUILD_CATS.map(c => `<button class="${cat === c.id ? 'active' : ''}" data-bcat="${c.id}">${c.label}</button>`).join('')}
      </div>
      ${cat === 'paint' ? `<div class="section-label"><span>SPRAY COLOUR</span><b>CLICK A TILE</b></div>
        <div class="paint-swatches">${PAINTS.map(c => `<button style="background:${c}" class="${sel.paint === c ? 'active' : ''}" data-bpaint="${c}" aria-label="Paint ${c}"></button>`).join('')}</div>
        <p style="font-size:8px;color:#7e8673;line-height:1.5;margin-top:10px">Paint placed floors, walls and furniture. Click bare slab to colour the base floor.</p>`
      : `<div class="section-label"><span>${cat.toUpperCase()}</span><b>${sel.eraser ? 'ERASER' : 'PLACE'}</b></div>
        <div class="catalog-grid">${items.map(i => `<button class="catalog-item ${sel.item === i.id && !sel.eraser ? 'active' : ''}" data-bitem="${i.id}"><b>${i.name}</b><span>${Object.entries(i.cost).map(([k, v]) => `${v}${RESOURCES[k]?.short}`).join(' + ') || 'FREE'}${i.footprint ? ` · ${i.footprint[0]}×${i.footprint[1]}` : ''}</span></button>`).join('')}</div>`}
      <div class="build-tools"><button class="${sel.eraser ? 'active' : ''}" data-berase="1">ERASER [X]</button><button data-brotate="1">ROTATE [R]</button></div>
      <div class="build-hint" style="position:static;transform:none;border:0;padding:8px 0 0;background:none;font-size:6px;color:#69715f">LEFT CLICK place · RIGHT DRAG orbit · SCROLL zoom</div>
    </div>
    <div class="build-hint"><kbd>CLICK</kbd> PLACE <kbd>R</kbd> ROTATE <kbd>X</kbd> ERASE <kbd>ESC</kbd> EXIT</div>`;
  }

  bindBuild(el) {
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const d = b.dataset;
      if (d.bexit) this.game.exitBuild();
      else if (d.bcat) this.game.buildCategory(d.bcat);
      else if (d.bitem) this.game.buildSelectItem(d.bitem);
      else if (d.bpaint) this.game.buildSelectPaint(d.bpaint);
      else if (d.berase) this.game.buildToggleErase();
      else if (d.brotate) this.game.buildRotate();
    });
  }

  refreshBuildUI() {
    if (!this.buildOpen || !this.game.buildState) return;
    const el = $('#buildUI');
    if (!el) return;
    const data = this.game.buildState;
    const s = this.game.state;
    $$('[data-bres]', el).forEach(n => {
      const k = n.dataset.bres;
      n.innerHTML = `${RESOURCES[k].icon} <b>${s.resources[k] || 0}</b>`;
    });
    $$('[data-bcat]', el).forEach(n => n.classList.toggle('active', n.dataset.bcat === data.category));
    $$('[data-bitem]', el).forEach(n => n.classList.toggle('active', n.dataset.bitem === data.item && !data.eraser));
    $$('[data-berase]', el).forEach(n => n.classList.toggle('active', data.eraser));
    if (data.category === 'paint') {
      // Re-render just the catalog to keep swatch state in sync.
      const old = $('.build-catalog', el);
      if (old) {
        const temp = document.createElement('div');
        temp.innerHTML = this.buildMarkup(this.game.currentLot, data);
        const fresh = $('.build-catalog', temp);
        old.replaceWith(fresh);
      }
    } else {
      $$('[data-bitem]', el).forEach(n => n.classList.toggle('active', n.dataset.bitem === data.item && !data.eraser));
    }
  }

  updateUI() {
    this.syncNav();
  }
}
