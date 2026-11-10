export const SAVE_KEY = 'underneath3120_save_v1';

export const DEFAULT_LOOK = {
  skin: '#c98e63', hair: '#141311', hairStyle: 'CROP', jacket: '#171b15',
  top: '#3b4034', bottom: '#20251e', accent: '#d8ff45',
};

export function makeDefaultState() {
  return {
    version: 1,
    started: false,
    name: 'REN',
    level: 1,
    xp: 0,
    credits: 480,
    health: 100,
    hunger: 92,
    stamina: 100,
    heat: 0,
    heatFloat: 0,
    career: null,
    careerXp: {},
    resources: { scrap: 18, wood: 16, fiber: 8, food: 6, paint: 8, ore: 4 },
    inventory: { medgel: 1, ration: 0, repairkit: 0 },
    look: { ...DEFAULT_LOOK },
    position: [0, 16],
    home: {
      owned: ['unit07'],
      layouts: {
        unit07: { items: [{ uid: 'starter-bed', itemId: 'bed', gx: 2, gz: 2, rot: 0, color: '#4d5745' }], baseColor: '#565b4e' },
        neonloft: { items: [], baseColor: '#565b4e' },
        foundry: { items: [], baseColor: '#565b4e' },
      },
    },
    crew: [],
    city: {
      districts: { rustmarket: true, neon: false, foundry: false, undercut: false },
      projects: [],
      productionTimer: 0,
    },
    car: {
      owned: false, repaired: false, paint: '#8f3b2b', rim: '#b9c0b5', underglow: '#ff4fba',
      underglowOn: true, spoiler: true, decal: 'stripe', decalColor: '#d8ff45', headlights: true,
    },
    job: null,
    stats: { jobsDone: 0, citizens: 0, builds: 0, districts: 1 },
    playTime: 0,
    seenIntro: false,
  };
}

function isPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

export function mergeDeep(base, saved) {
  if (Array.isArray(base)) return Array.isArray(saved) ? saved : base;
  if (isPlainObject(base)) {
    const out = { ...base };
    if (isPlainObject(saved)) {
      for (const key of Object.keys(saved)) {
        out[key] = key in base ? mergeDeep(base[key], saved[key]) : saved[key];
      }
    }
    return out;
  }
  return saved === undefined ? base : saved;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return makeDefaultState();
    const saved = JSON.parse(raw);
    const state = mergeDeep(makeDefaultState(), saved);
    // Repair older or partially-written saves.
    if (!state.home.layouts.unit07) state.home.layouts.unit07 = makeDefaultState().home.layouts.unit07;
    if (!Array.isArray(state.home.owned) || !state.home.owned.length) state.home.owned = ['unit07'];
    for (const id of Object.keys(makeDefaultState().home.layouts)) {
      if (!state.home.layouts[id]) state.home.layouts[id] = makeDefaultState().home.layouts[id];
    }
    state.health = Math.max(1, Math.min(100, Number(state.health) || 100));
    state.hunger = Math.max(0, Math.min(100, Number(state.hunger) ?? 92));
    state.stamina = Math.max(0, Math.min(100, Number(state.stamina) ?? 100));
    return state;
  } catch {
    return makeDefaultState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
