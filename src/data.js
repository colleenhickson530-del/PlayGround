export const RESOURCES = {
  credits: { label: 'Credits', short: '₵', icon: '₵', color: '#d8ff45' },
  scrap: { label: 'Scrap', short: 'SC', icon: '▧', color: '#b7c2a3' },
  wood: { label: 'Timber', short: 'WD', icon: '▤', color: '#c8985b' },
  fiber: { label: 'Fibre', short: 'FB', icon: '≋', color: '#d5e2a0' },
  food: { label: 'Rations', short: 'FD', icon: '◉', color: '#ffbb55' },
  paint: { label: 'Spray', short: 'PT', icon: '◐', color: '#ff64c2' },
  ore: { label: 'Biometal', short: 'BM', icon: '◆', color: '#65e5d2' },
};

export const CAREERS = [
  {
    id: 'courier', name: 'Courier', tag: 'DEAD DROP', pay: [140, 220], color: '#d8ff45',
    desc: 'Move packages between districts. Faster feet, better tips.',
    perk: '+12% sprint speed', risk: 'LOW',
    icon: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/><path d="M7 9v5"/>',
    steps: [
      { label: 'Pick up the parcel', at: [-8, 13], hint: 'The locker behind the noodle stall.' },
      { label: 'Drop with the fence', at: [38, 7], hint: 'Neon Row, under the pink sign.' },
      { label: 'Return the receipt', at: [0, 7], hint: 'Back to the gig board.' },
    ],
  },
  {
    id: 'engineer', name: 'Engineer', tag: 'GRID FIXER', pay: [180, 260], color: '#ffc45c',
    desc: 'Keep the last grid alive. Patch junction boxes before the block goes dark.',
    perk: 'Build costs -10%', risk: 'MEDIUM',
    icon: '<path d="M14 3L5 14h6l-1 7 10-12h-6z"/><path d="M3 5h5M17 18h4"/>',
    steps: [
      { label: 'Patch junction A-12', at: [-12, 3], hint: 'Behind the market hall.' },
      { label: 'Patch junction C-04', at: [15, -3], hint: 'Garage service alley.' },
      { label: 'Patch junction E-09', at: [35, 14], hint: 'Neon Row service hatch.' },
    ],
  },
  {
    id: 'medic', name: 'Street Medic', tag: 'STREET DOC', pay: [170, 250], color: '#66e7d5',
    desc: 'Stitch up the people the clinics won’t touch. Keep the block breathing.',
    perk: 'Slow health regen', risk: 'MEDIUM',
    icon: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
    steps: [
      { label: 'Treat the scrap cut', at: [8, 12], hint: 'By the workbench bench.' },
      { label: 'Stabilise the dockhand', at: [-31, 5], hint: 'Foundry loading bay.' },
      { label: 'Check the night nurse', at: [36, 17], hint: 'Neon Row back alley.' },
    ],
  },
  {
    id: 'scavenger', name: 'Scavenger', tag: 'SALVAGE RUN', pay: [150, 240], color: '#c6d79f',
    desc: 'Pull value from the wreckage. The city throws away everything but people.',
    perk: '+1 bonus scrap per haul', risk: 'LOW',
    icon: '<path d="M4 9l8-5 8 5-8 5z"/><path d="M4 9v7l8 5 8-5V9M12 14v7"/><path d="M8 7l8 4"/>',
    steps: [
      { label: 'Strip the collapsed awning', at: [-25, 17], hint: 'Empty lot off the west lane.' },
      { label: 'Crack the derelict pod', at: [-36, -9], hint: 'Foundry scrap yard.' },
      { label: 'Haul the loot home', at: [-20, 26], hint: 'Your plot in Rustmarket.' },
    ],
  },
  {
    id: 'miner', name: 'Deep Miner', tag: 'DEEP CUT', pay: [200, 300], color: '#ff925c',
    desc: 'The city eats metal. You feed it. Break biometal seams in the Foundry.',
    perk: 'Mining 35% faster', risk: 'HIGH',
    icon: '<path d="M4 20l7-7M8 4l3 2 7 7-2 2-7-7z"/><path d="M4 8l8-4M14 4l6 6M17 3l4 4"/>',
    steps: [
      { label: 'Crack seam 01', at: [-42, 2], hint: 'Deepworks incline, red ore.' },
      { label: 'Crack seam 02', at: [-47, 12], hint: 'Below the heat exchangers.' },
      { label: 'Haul ore to the lift', at: [-33, -2], hint: 'Foundry freight lift.' },
    ],
  },
  {
    id: 'mechanic', name: 'Mechanic', tag: 'CHOP DOC', pay: [190, 280], color: '#ff7a2f',
    desc: 'Resurrect dead machines. Every wreck has a price and a story.',
    perk: 'Repairs cost -15%', risk: 'MEDIUM',
    icon: '<path d="M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.7 2.7-2.3-2.3z"/>',
    steps: [
      { label: 'Diagnose the dead coupe', at: [17, -9], hint: 'Garage bay 02.' },
      { label: 'Tighten the axle bolts', at: [13, -15], hint: 'Parts rack in the service lane.' },
      { label: 'Fire the engine', at: [17, -9], hint: 'Back to the coupe.' },
    ],
  },
  {
    id: 'chef', name: 'Fungus Cook', tag: 'NIGHT KITCHEN', pay: [130, 220], color: '#ffbb55',
    desc: 'Turn cave slop into something people trade their last credits for.',
    perk: 'Food restores +25%', risk: 'LOW',
    icon: '<path d="M5 12h14M7 12a5 5 0 015-5 5 5 0 015 5M4 19h16"/><path d="M9 4c0 1-1 1-1 2M14 3c0 1-1 1-1 2"/>',
    steps: [
      { label: 'Forage glowcaps', at: [-23, 18], hint: 'Mushroom trough behind the market.' },
      { label: 'Slice and season', at: [-17, 12], hint: 'Street kitchen prep table.' },
      { label: 'Serve the night queue', at: [-13, 10], hint: 'Hand it to the stall queue.' },
    ],
  },
  {
    id: 'merchant', name: 'Stall Trader', tag: 'STALL SHARK', pay: [160, 280], color: '#ff4fba',
    desc: 'Buy low, sell loud. The underground runs on favours and clean credit.',
    perk: 'Sell prices +15%', risk: 'LOW',
    icon: '<path d="M4 10l3-6h10l3 6M4 10h16v3H4zM6 13v7h12v-7M10 20v-4h4v4"/>',
    steps: [
      { label: 'Pitch the scrap bundle', at: [-11, 9], hint: 'Market row, west aisle.' },
      { label: 'Flip the med gel', at: [-18, 7], hint: 'To the clinic runner.' },
      { label: 'Close the night ledger', at: [0, 7], hint: 'Gig board terminal.' },
    ],
  },
  {
    id: 'security', name: 'Block Warden', tag: 'KEEP ORDER', pay: [210, 310], color: '#7da3ff',
    desc: 'No badges down here. Just a baton and a block that needs to sleep safe.',
    perk: '+20 max health', risk: 'HIGH',
    icon: '<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/><path d="M9 11l2 2 4-4"/>',
    steps: [
      { label: 'Walk the market checkpoint', at: [-13, 5], hint: 'West market gate.' },
      { label: 'Clear the scraphead taggers', at: [23, 12], hint: 'East lane, alley mouth.' },
      { label: 'Lock down the underpass', at: [0, -23], hint: 'North underpass barrier.' },
    ],
  },
  {
    id: 'netrunner', name: 'Netrunner', tag: 'GHOSTWIRE', pay: [240, 360], color: '#b58cff',
    desc: 'Jack into the dead grid. Steal secrets older than the city itself.',
    perk: 'Hack jobs pay +20%', risk: 'HIGH',
    icon: '<path d="M7 8a6 6 0 000 8M4 5a10 10 0 000 14M17 8a6 6 0 010 8M20 5a10 10 0 010 14"/><circle cx="12" cy="12" r="2.5"/>',
    steps: [
      { label: 'Jack the transit terminal', at: [11, 4], hint: 'South platform data pillar.' },
      { label: 'Siphon the archive node', at: [-15, -8], hint: 'Foundry admin basement.' },
      { label: 'Burn trace at the relay', at: [39, 10], hint: 'Neon Row relay tower.' },
    ],
  },
  {
    id: 'fixer', name: 'The Fixer', tag: 'GANG PATH', pay: [320, 480], color: '#ff4545',
    desc: 'Take what the city owes. Run contraband, lean on crews, own the dark.',
    perk: '+25% melee damage & heat', risk: 'EXTREME', gang: true,
    icon: '<path d="M6 3h12M8 3v4l4 4-4 4v4M16 3v4l-4 4 4 4v4"/><path d="M5 21h14"/>',
    steps: [
      { label: 'Lean on the stash runner', at: [-5, -39], hint: 'The Undercut, red container.' },
      { label: 'Crack the crew lockbox', at: [-11, -47], hint: 'Behind the chain fence.' },
      { label: 'Tag the Fixer’s mark', at: [0, -33], hint: 'North gate, spray the sigil.' },
    ],
    warning: 'This path marks you. Rival crews remember faces.',
  },
];

export const BUILD_ITEMS = [
  { id: 'floor-concrete', name: 'Concrete', cat: 'floor', type: 'floor', cost: {}, color: '#6d7167', desc: 'Standard poured slab' },
  { id: 'floor-circuit', name: 'Circuit Tile', cat: 'floor', type: 'floor', cost: { scrap: 1 }, color: '#37403a', emissive: '#6ff0d4', desc: 'Reclaimed datafloor' },
  { id: 'floor-rust', name: 'Rust Weave', cat: 'floor', type: 'floor', cost: { scrap: 1 }, color: '#71462d', desc: 'Warm scrapyard weave' },
  { id: 'floor-rug', name: 'Plush Rug', cat: 'floor', type: 'floor', cost: { fiber: 2 }, color: '#6e2e47', desc: 'A little luxury down here' },
  { id: 'wall-scrap', name: 'Scrap Wall', cat: 'wall', type: 'wall', cost: { scrap: 4, wood: 2 }, desc: 'Salvaged privacy' },
  { id: 'wall-plaster', name: 'Plaster Wall', cat: 'wall', type: 'wall', cost: { wood: 3, fiber: 1 }, desc: 'Clean partition' },
  { id: 'wall-neon', name: 'Neon Rail', cat: 'wall', type: 'wall', cost: { scrap: 3, paint: 2 }, glow: '#ff4fba', desc: 'Light as a wall' },
  { id: 'bed', name: 'Sleep Pod', cat: 'furniture', type: 'bed', cost: { wood: 6, fiber: 5 }, desc: '+1 housing capacity. Restores HP.', footprint: [2, 1] },
  { id: 'crate', name: 'Storage Crate', cat: 'furniture', type: 'crate', cost: { wood: 5, scrap: 4 }, desc: 'Personal stash and storage.', footprint: [1, 1] },
  { id: 'workbench', name: 'Workbench', cat: 'furniture', type: 'workbench', cost: { wood: 5, scrap: 8 }, desc: 'Craft survival gear at home.', footprint: [2, 1] },
  { id: 'stove', name: 'Cook Stove', cat: 'furniture', type: 'stove', cost: { scrap: 9, ore: 2 }, desc: 'Turn rations into real meals.', footprint: [1, 1] },
  { id: 'couch', name: 'Scrap Couch', cat: 'furniture', type: 'couch', cost: { fiber: 5, wood: 3 }, desc: 'Sit. Exist. Recover.', footprint: [2, 1] },
  { id: 'table', name: 'Work Table', cat: 'furniture', type: 'table', cost: { wood: 4, scrap: 2 }, desc: 'A flat surface. A luxury.', footprint: [1, 1] },
  { id: 'lamp', name: 'Cage Lamp', cat: 'furniture', type: 'lamp', cost: { scrap: 3, ore: 1 }, desc: 'Warm light. Safe shadows.', footprint: [1, 1], glow: '#ffb15c' },
  { id: 'planter', name: 'Glow Planter', cat: 'furniture', type: 'planter', cost: { wood: 3, food: 2 }, desc: 'Grow food while you sleep.', footprint: [1, 1], glow: '#a6ff7a' },
  { id: 'neon', name: 'Neon Sigil', cat: 'furniture', type: 'neon', cost: { scrap: 3, paint: 2 }, desc: 'Make the pod unmistakably yours.', footprint: [1, 1], glow: '#ff4fba' },
  { id: 'shelf', name: 'Pipe Shelf', cat: 'furniture', type: 'shelf', cost: { scrap: 4, wood: 2 }, desc: 'Display your found objects.', footprint: [1, 1] },
];

export const PAINTS = ['#6d7167', '#d8ff45', '#ff7a2f', '#ff4fba', '#66e7d5', '#8e5dff', '#f2e8cf', '#2a3027', '#7b3f2a', '#2c5d69'];

export const BUILD_CATS = [
  { id: 'furniture', label: 'FURNITURE' }, { id: 'wall', label: 'WALLS' }, { id: 'floor', label: 'FLOORS' }, { id: 'paint', label: 'PAINT' },
];

export const LOTS = [
  {
    id: 'unit07', name: 'Unit 07', district: 'Rustmarket', price: 0, income: 0,
    pos: [-20, 26], size: 10, desc: 'A dead-end slab behind the market. Yours if you can keep it.', owned: true, starter: true,
  },
  {
    id: 'neonloft', name: 'The Pink Loft', district: 'Neon Row', price: 900, income: 18,
    pos: [39, 25], size: 10, desc: 'A second-floor shell above a noodle bar. Loud, bright, full of possibility.', owned: false, districtId: 'neon',
  },
  {
    id: 'foundry', name: 'Foundry Annex', district: 'The Foundry', price: 1350, income: 26,
    pos: [-43, -20], size: 10, desc: 'An old toolhouse with industrial bones. Smells like ozone and rain.', owned: false, districtId: 'foundry',
  },
];

export const DISTRICTS = [
  {
    id: 'rustmarket', name: 'Rustmarket', short: 'RUSTMARKET', x: 0, z: 8, color: '#d8ff45', owned: true,
    desc: 'The market heart. Scrap, noodles, and people who still believe in tomorrow.',
    claim: null, production: 'Trade hub', bonus: 'Market prices +5%',
  },
  {
    id: 'neon', name: 'Neon Row', short: 'NEON ROW', x: 37, z: 5, color: '#ff4fba', owned: false,
    desc: 'Ad screens that never sleep. A fortune in debt and a dancefloor in the back.',
    claim: { credits: 240, scrap: 16, fiber: 8 }, production: '+12 credits / cycle', bonus: 'Unlocks the Pink Loft',
  },
  {
    id: 'foundry', name: 'The Foundry', short: 'FOUNDRY', x: -37, z: 1, color: '#ff7a2f', owned: false,
    desc: 'Where the city is reforged. Ore dust, hot metal, and a union with no name.',
    claim: { credits: 300, scrap: 24, wood: 12 }, production: '+2 biometal / cycle', bonus: 'Build costs -8% citywide',
  },
  {
    id: 'undercut', name: 'The Undercut', short: 'UNDERCUT', x: -3, z: -40, color: '#ff4545', owned: false,
    desc: 'No law past the red arch. The crews decide who eats and who disappears.',
    claim: { credits: 420, scrap: 30, ore: 8 }, production: '+20 credits / cycle', bonus: 'Gang jobs pay +25%', contested: true,
  },
];

export const PROJECTS = [
  { id: 'water', name: 'Water Reclaimer', desc: '+1 ration per production cycle.', cost: { scrap: 18, fiber: 10, credits: 160 }, district: 'rustmarket' },
  { id: 'nightmarket', name: 'Night Market', desc: '+15 credits per production cycle.', cost: { scrap: 20, wood: 14, credits: 220 }, district: 'neon' },
  { id: 'defense', name: 'Watchtower', desc: 'Reduces gang heat and raid risk.', cost: { scrap: 25, ore: 5, credits: 260 }, district: 'foundry' },
  { id: 'lift', name: 'Transit Lift', desc: 'Fast travel between owned districts.', cost: { scrap: 22, ore: 4, credits: 300 }, district: 'rustmarket' },
];

export const CRAFT_RECIPES = [
  { id: 'medgel', name: 'Med Gel', desc: 'Restores 35 health.', cost: { fiber: 2, food: 1 }, qty: 1 },
  { id: 'ration', name: 'Cooked Ration', desc: 'A hot meal. Restores hunger.', cost: { food: 2 }, qty: 1 },
  { id: 'paint', name: 'Spray Can', desc: 'One can of pigment.', cost: { scrap: 1, food: 1 }, qty: 2 },
  { id: 'repairkit', name: 'Repair Kit', desc: 'Required to fix your ride.', cost: { scrap: 4, ore: 1 }, qty: 1 },
];

export const NPC_NAMES = [
  ['MARA VOSS', 'scavenger'], ['DEX', 'mechanic'], ['NIX', 'netrunner'], ['JUNO K.', 'medic'],
  ['BRICK', 'security'], ['SABLE', 'merchant'], ['TAMSIN', 'courier'], ['RAZ', 'miner'],
  ['PIP', 'chef'], ['KESTREL', 'engineer'], ['DOVE', 'medic'], ['MOTH', 'scavenger'],
  ['CINDER', 'mechanic'], ['HALO', 'netrunner'], ['OTIS', 'courier'], ['WREN', 'engineer'],
];

export const NPC_LINES = [
  'I used to work the surface lifts. Then the lifts stopped. Now I fix what falls down.',
  'The Foundry pays good. It also eats lungs. Depends what you’re short of.',
  'You build a place with a door that locks? That’s a whole religion down here.',
  'Neon Row looks expensive. It is. Everything except the people.',
  'I saw the Fixer’s crew moving crates through the underpass. Didn’t see a thing after that.',
  'A bed, a lockbox, a hot meal. That’s the whole dream in 3120.',
  'If you find a working car, don’t paint it loud. Loud gets noticed.',
  'The gangs tax the air. The rest of us split what’s left.',
  'They say there used to be a sky. I think it’s a story parents tell kids.',
  'Market’s buying scrap. Don’t let them weigh it wet.',
  'You want a crew? Feed them first. Loyalty is just a full stomach with better manners.',
  'I’m not scared of the dark. I’m scared of what learned to live in it.',
  'Real estate down here is just a hole you agree to defend.',
  'The grid’s got ghosts. Old voices, old passwords. Don’t listen too long.',
  'If the Fixer offers you a job, ask who’s not coming back.',
  'Water’s clean today. That means something’s wrong upstream.',
];

export const CREW_JOBS = {
  idle: { label: 'Idle', income: {}, desc: 'Unassigned. Still eats.' },
  scavenger: { label: 'Scrap Runner', income: { scrap: 2 }, desc: 'Hunts salvage through the stacks.' },
  vendor: { label: 'Stall Vendor', income: { credits: 14 }, desc: 'Works the market and brings home credit.' },
  grower: { label: 'Mushroom Grower', income: { food: 2 }, desc: 'Tends glowcap troughs.' },
  mechanic: { label: 'Garage Hand', income: { credits: 8, scrap: 1 }, desc: 'Repairs wrecks and sells the parts.' },
  engineer: { label: 'Grid Engineer', income: { ore: 1, credits: 6 }, desc: 'Keeps the district power on.' },
};

export const STYLE = {
  skin: ['#e7b58a', '#c98e63', '#9b6444', '#6c4633', '#3e2d26', '#f0cbb3', '#7e5139'],
  hair: ['#141311', '#3a261b', '#84552f', '#c6b18b', '#d8ff45', '#ff4fba', '#66e7d5', '#a9b5bd'],
  hairStyle: ['CROP', 'MOHAWK', 'LONG', 'BUN', 'SHAVED', 'BRAIDS'],
  top: ['#20251e', '#3b4034', '#d8ff45', '#ff7a2f', '#ff4fba', '#66e7d5', '#8e5dff', '#f2e8cf', '#8f2b2b'],
  bottom: ['#20251e', '#394035', '#4a3a2a', '#161816', '#5a5f51', '#3e3152'],
  jacket: ['#171b15', '#3a3e32', '#8b2c2c', '#bd6e2d', '#5b3f79', '#2e5f66', '#d8ff45'],
  accent: ['#d8ff45', '#ff7a2f', '#ff4fba', '#66e7d5', '#eef0e3', '#ff4545'],
};

export const CAR_COLORS = ['#d8ff45', '#ff7a2f', '#ff4fba', '#66e7d5', '#8e5dff', '#eef0e3', '#1b1e19', '#c8c9c1', '#8f2b2b', '#2e5f66'];
export const RIM_COLORS = ['#b9c0b5', '#d8ff45', '#ff4fba', '#ff7a2f', '#161816'];
export const CAR_MODELS = [
  { id: 'rustler', name: 'Rustler GT', body: '#8f3b2b', top: 0, desc: 'A dead coupe with a good spine. Cheap to wake up.' },
];

export const HELP_STEPS = [
  ['01', 'PICK A HUSTLE', 'Press J or visit the GIG BOARD. Choose one of eleven paths, then clock in. Every shift sends you into the city for real work.'],
  ['02', 'GET PAID, GET FED', 'Shifts pay credits, XP, and resources. Eat from the PACK, harvest glowcaps, or buy noodles. Hunger is slow but it is real.'],
  ['03', 'BUILD A LIFE', 'Visit your lot and press B to build. Floors, walls, furniture, paint — anything you place is permanent, and beds attract residents.'],
  ['04', 'MAKE A CREW', 'Talk to citizens in the street. If you have a free bed, invite them home. Assign jobs and your town starts producing while you work.'],
  ['05', 'SECURE THE TOWNS', 'Open TOWN or use a district beacon. Pay the claim cost to bring a district under your flag, then fund works projects for passive income.'],
  ['06', 'RUN THE DARK', 'The Undercut answers to no one. Take the Fixer path, fight with F, and watch your heat. Or keep the block safe as a Warden.'],
];

export const CINEMATIC_CAMERAS = {
  splash: { x: 18, y: 17, z: 42, tx: -2, ty: 3, tz: -8 },
};
