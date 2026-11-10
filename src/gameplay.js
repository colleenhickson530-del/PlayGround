import { CAREERS, LOTS, DISTRICTS, PROJECTS, CRAFT_RECIPES, CREW_JOBS, STYLE, RESOURCES } from './data.js';
import { createCharacter, createMarker, makeTextTexture } from './world.js';
import { saveState, makeDefaultState } from './state.js';

function rankFor(xp) {
  if (xp >= 1200) return { rank: 5, label: 'LEGEND' };
  if (xp >= 720) return { rank: 4, label: 'VETERAN' };
  if (xp >= 360) return { rank: 3, label: 'PRO' };
  if (xp >= 120) return { rank: 2, label: 'REGULAR' };
  return { rank: 1, label: 'ROOKIE' };
}
const randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));

export function installGameplay(Game) {
  Object.assign(Game.prototype, {

    canAfford(cost = {}) {
      for (const [k, v] of Object.entries(cost)) {
        if (k === 'credits') {
          if (this.state.credits < v) return false;
        } else if ((this.state.resources[k] || 0) < v) return false;
      }
      return true;
    },

    payCost(cost = {}) {
      for (const [k, v] of Object.entries(cost)) {
        if (k === 'credits') this.state.credits -= v;
        else this.state.resources[k] = (this.state.resources[k] || 0) - v;
      }
    },

    addRewards(rewards) {
      for (const [k, v] of Object.entries(rewards)) {
        if (k === 'credits') this.state.credits += v;
        else if (k === 'xp') this.state.xp += v;
        else this.state.resources[k] = (this.state.resources[k] || 0) + v;
      }
      this.state.level = 1 + Math.floor(this.state.xp / 160);
    },

    selectCareer(id) {
      if (!CAREERS.some(c => c.id === id)) return;
      this.state.career = id;
      this.audio.reward();
      this.save();
      this.ui.toast(`${CAREERS.find(c => c.id === id).name.toUpperCase()} PATH SELECTED. CLOCK IN WHEN READY.`);
      this.updateHUD(true);
    },

    clearJobMarkers() {
      for (const m of this.jobMarkers) {
        this.scene.remove(m);
        m.traverse?.(o => {
          if (o.geometry) o.geometry.dispose?.();
          if (o.material) {
            if (o.material.map) o.material.map.dispose?.();
            o.material.dispose?.();
          }
        });
      }
      this.jobMarkers = [];
    },

    startJob(careerId) {
      const career = CAREERS.find(c => c.id === careerId);
      if (!career) return;
      if (this.buildMode) this.exitBuild(true);
      this.clearJobMarkers();
      this.state.career = careerId;
      this.state.job = {
        careerId,
        step: 0,
        total: career.steps.length,
        elapsed: 0,
        tasks: career.steps.map(s => ({ ...s, career: careerId })),
      };
      this.spawnJobMarker(0);
      this.ui.close(true);
      this.audio.reward();
      this.updateHUD(true);
      this.save();
      this.ui.toast(`SHIFT OPENED // ${career.tag}. FOLLOW THE ACID DIAMOND.`);
      setTimeout(() => this.ui.toast(`FIRST STOP: ${career.steps[0].label.toUpperCase()}`), 900);
    },

    spawnJobMarker(stepIndex) {
      this.clearJobMarkers();
      const job = this.state.job;
      if (!job) return;
      const career = CAREERS.find(c => c.id === job.careerId);
      const step = career.steps[stepIndex];
      if (!step) return;
      const marker = createMarker(career.color, step.label.toUpperCase());
      marker.position.set(step.at[0], .02, step.at[1]);
      this.scene.add(marker);
      this.jobMarkers = [marker];
    },

    completeTask(task) {
      const job = this.state.job;
      if (!job || !task) return;
      const career = CAREERS.find(c => c.id === job.careerId);
      // Small on-the-job find.
      if (career.id === 'scavenger') this.state.resources.scrap += 2;
      else if (career.id === 'miner') this.state.resources.ore += 1;
      else if (career.id === 'chef') this.state.resources.food += 1;
      else if (career.id === 'engineer') this.state.resources.scrap += 1;
      job.step += 1;
      job.tasks[job.step - 1].done = true;
      this.audio.ui();
      if (job.step >= job.total) {
        this.completeJob();
        return;
      }
      this.spawnJobMarker(job.step);
      this.updateHUD(true);
      this.save();
      this.ui.toast(`STOP ${job.step}/${job.total} CLEAR // ${career.steps[job.step].label.toUpperCase()}`);
    },

    completeJob() {
      const job = this.state.job;
      if (!job) return;
      const career = CAREERS.find(c => c.id === job.careerId);
      const seconds = Math.floor(job.elapsed || 0);
      const rankBefore = rankFor(this.state.careerXp[job.careerId] || 0);
      let base = randInt(career.pay[0], career.pay[1]);
      if (job.careerId === 'netrunner') base = Math.round(base * 1.2);
      if (job.careerId === 'merchant') base = Math.round(base * 1.15);
      if (job.careerId === 'fixer' && this.state.city.districts.undercut) base = Math.round(base * 1.25);
      const speedBonus = seconds < 150 ? 60 : seconds < 260 ? 30 : 0;
      const rankBonus = (rankBefore.rank - 1) * 12;
      const xp = 42 + rankBefore.rank * 9 + (seconds < 240 ? 12 : 0);
      const rewards = { credits: base + speedBonus + rankBonus, xp };
      const extras = {
        scavenger: { scrap: 6 }, miner: { ore: 4 }, engineer: { scrap: 5, fiber: 2 },
        medic: { food: 2, fiber: 2 }, chef: { food: 4 }, mechanic: { scrap: 5, ore: 1 },
        merchant: { credits: 35 }, security: { scrap: 3, credits: 20 }, netrunner: { ore: 2, credits: 30 },
        courier: { fiber: 2 }, fixer: { credits: 60, ore: 2 },
      }[job.careerId] || {};
      for (const [k, v] of Object.entries(extras)) rewards[k] = (rewards[k] || 0) + v;
      this.addRewards(rewards);
      this.state.careerXp[job.careerId] = (this.state.careerXp[job.careerId] || 0) + xp;
      const rankAfter = rankFor(this.state.careerXp[job.careerId]);
      this.state.stats.jobsDone += 1;
      if (job.careerId === 'fixer') this.state.heatFloat = Math.min(5, this.state.heatFloat + 1);
      this.state.job = null;
      this.clearJobMarkers();
      this.updateHUD(true);
      this.save();
      this.audio.reward();
      const flavor = {
        courier: 'Every package arrived. Every hand washed. The city never saw you.',
        engineer: 'The block stayed lit. Somewhere, a child slept through the dark because of you.',
        medic: 'Three people are still breathing who would not have been. That is the whole job.',
        scavenger: 'The stacks gave up their dead metal. You turned it into rent.',
        miner: 'Your arms ache. The Foundry has enough biometal for another week.',
        mechanic: 'The dead coupe turned over on the third try. Nothing down here sounds better.',
        chef: 'The queue ate, paid, and stopped looking at you like a stranger.',
        merchant: 'You sold loud, bought quiet, and the ledger came out clean.',
        security: 'The market gate held. The block sleeps with one eye open, but it sleeps.',
        netrunner: 'The old grid opened like a dead mouth. You took what it remembered.',
        fixer: 'The Undercut knows your name now. That is either power or a countdown.',
      }[job.careerId] || 'The shift is done.';
      this.ui.open('complete', {
        result: {
          rewards, careerName: career.name, rankLabel: rankAfter.label, rank: rankAfter.rank,
          title: speedBonus ? 'CLEAN RUN' : 'SHIFT PAID', stars: speedBonus ? 5 : seconds < 300 ? 4 : 3,
          flavor, seconds, career: job.careerId,
        },
      });
    },

    shopBuy(id) {
      const catalog = {
        food: { price: 18, add: () => { this.state.resources.food += 3; }, label: '+3 rations' },
        scrap: { price: 32, add: () => { this.state.resources.scrap += 4; }, label: '+4 scrap' },
        fiber: { price: 21, add: () => { this.state.resources.fiber += 3; }, label: '+3 fibre' },
        paint: { price: 16, add: () => { this.state.resources.paint += 2; }, label: '+2 spray' },
      }[id];
      if (!catalog) return;
      if (this.state.credits < catalog.price) { this.ui.toast('NOT ENOUGH CREDIT.', 'bad'); return; }
      this.state.credits -= catalog.price;
      catalog.add();
      this.audio.ui();
      this.ui.toast(`PURCHASED // ${catalog.label.toUpperCase()}`);
      this.save();
    },

    shopSell(id) {
      if (!(this.state.resources[id] > 0)) { this.ui.toast('NOTHING TO SELL.', 'warn'); return; }
      const prices = { scrap: 7, ore: 28, fiber: 5, food: 3 };
      if (!prices[id]) return;
      const mult = this.state.career === 'merchant' ? 1.15 : 1;
      this.state.resources[id] -= 1;
      this.state.credits += Math.round(prices[id] * mult);
      this.audio.ui();
      this.save();
    },

    useFoodStall() {
      if (this.state.credits < 12) { this.ui.toast('THE COOK WANTS 12₵.', 'warn'); return; }
      if (this.state.hunger >= 99) { this.ui.toast('YOU ARE ALREADY FULL.', 'warn'); return; }
      this.state.credits -= 12;
      this.state.hunger = Math.min(100, this.state.hunger + 26 * (this.state.career === 'chef' ? 1.25 : 1));
      this.audio.ui();
      this.ui.toast('HOT FUNGUS NOODLES. SALTY. ALIVE. +26 FOOD.');
      this.save();
    },

    useClinic() {
      if (this.state.health >= 100) { this.ui.toast('THE NURSE SAYS YOU ARE FINE. GO AWAY.'); return; }
      if (this.state.credits < 30) { this.ui.toast('CLINIC FEE IS 30₵.', 'bad'); return; }
      this.state.credits -= 30;
      this.state.health = 100;
      this.audio.reward();
      this.ui.toast('PATCHED UP // HEALTH RESTORED.');
      this.save();
    },

    eat() {
      if ((this.state.resources.food || 0) <= 0) { this.ui.toast('NO RATIONS. HARVEST GLOWCAPS OR VISIT THE NOODLE BAR.', 'warn'); return; }
      if (this.state.hunger >= 100) { this.ui.toast('YOU ARE FULL.'); return; }
      this.state.resources.food -= 1;
      this.state.hunger = Math.min(100, this.state.hunger + 30 * (this.state.career === 'chef' ? 1.25 : 1));
      this.audio.ui();
      this.ui.toast('RATION EATEN // +30 FOOD.');
      this.save();
    },

    useItem(id) {
      const count = this.state.inventory[id] || 0;
      if (count <= 0) return;
      if (id === 'medgel') {
        if (this.state.health >= 100) { this.ui.toast('HEALTH ALREADY FULL.'); return; }
        this.state.inventory[id]--;
        this.state.health = Math.min(100, this.state.health + 35);
        this.ui.toast('MED GEL APPLIED // +35 HEALTH.');
      } else if (id === 'ration') {
        if (this.state.hunger >= 100) { this.ui.toast('YOU ARE FULL.'); return; }
        this.state.inventory[id]--;
        this.state.hunger = Math.min(100, this.state.hunger + 35);
        this.ui.toast('HOT RATION EATEN // +35 FOOD.');
      } else if (id === 'repairkit') {
        this.ui.toast('SAVE THE REPAIR KIT FOR THE GARAGE.', 'warn');
        return;
      }
      this.audio.ui();
      this.save();
    },

    craft(id) {
      const recipe = CRAFT_RECIPES.find(r => r.id === id);
      if (!recipe) return;
      if (!this.canAfford(recipe.cost)) { this.ui.toast('MISSING MATERIALS.', 'bad'); return; }
      this.payCost(recipe.cost);
      if (id === 'paint') this.state.resources.paint += recipe.qty;
      else this.state.inventory[id] = (this.state.inventory[id] || 0) + recipe.qty;
      this.audio.ui();
      this.ui.toast(`CRAFTED // ${recipe.name.toUpperCase()}`);
      this.save();
    },

    rest() {
      this.state.health = Math.min(100, this.state.health + 45);
      this.state.stamina = 100;
      this.state.hunger = Math.max(0, this.state.hunger - 4);
      this.audio.reward();
      this.ui.toast('YOU SLEEP IN YOUR OWN BED. +45 HEALTH · STAMINA FULL.');
      this.save();
    },

    respawn() {
      const fee = Math.max(20, Math.round(this.state.credits * .12));
      this.state.credits = Math.max(0, this.state.credits - fee);
      this.state.health = 65;
      this.state.hunger = Math.max(30, this.state.hunger - 20);
      this.state.heatFloat = Math.max(0, this.state.heatFloat - 1);
      this.state.heat = Math.round(this.state.heatFloat);
      this.dead = false;
      this.player.group.position.set(16.4, 0, 9);
      this.player.group.visible = true;
      this.ui.close(true);
      this.updateHUD(true);
      this.save();
      this.ui.toast(`AWAKE AT THE CLINIC. THE BLOCK TOOK ${fee}₵.`, 'warn');
    },

    housingBeds() {
      let beds = 0;
      for (const lotId of this.state.home.owned) {
        const layout = this.state.home.layouts[lotId];
        if (!layout) continue;
        beds += layout.items.filter(i => i.itemId === 'bed').length;
      }
      return beds;
    },

    bedsAt(lotId) {
      return (this.state.home.layouts[lotId]?.items || []).filter(i => i.itemId === 'bed').length;
    },

    inviteCitizen(npc) {
      if (!npc) return;
      if (this.state.crew.some(c => c.id === npc.id)) return;
      const free = this.housingBeds() - this.state.crew.length;
      if (free <= 0) {
        this.ui.toast('NO FREE BED. BUILD A SLEEP POD AT HOME FIRST.', 'bad');
        return;
      }
      const homeLot = this.state.home.owned[0];
      this.state.crew.push({
        id: npc.id, name: npc.name, job: 'idle', look: npc.group.userData.look, homeLot,
        slot: this.state.crew.length,
      });
      npc.recruited = true;
      npc.resident = true;
      const lot = LOTS.find(l => l.id === homeLot) || LOTS[0];
      npc.group.position.set(lot.pos[0] + (this.state.crew.length % 3) * 1.1 - 1, 0, lot.pos[1] + 4);
      npc.group.rotation.y = Math.PI;
      npc.home.set(lot.pos[0], lot.pos[1] + 4);
      npc.marker.material.color.set(0xd8ff45);
      this.state.stats.citizens += 1;
      this.audio.reward();
      this.ui.close(true);
      this.ui.toast(`${npc.name} MOVED INTO THE SHELTER. ASSIGN A JOB IN CREW.`);
      this.updateUI();
      this.save();
    },

    assignCrewJob(id, job) {
      const member = this.state.crew.find(c => c.id === id);
      if (!member || !CREW_JOBS[job]) return;
      member.job = job;
      this.audio.ui();
      this.ui.toast(`${member.name} // ${CREW_JOBS[job].label.toUpperCase()}`);
      this.save();
    },

    claimDistrict(id) {
      const d = DISTRICTS.find(x => x.id === id);
      if (!d || this.state.city.districts[id]) return;
      if (!d.claim) return;
      if (!this.canAfford(d.claim)) { this.ui.toast('NOT ENOUGH RESOURCES TO CLAIM.', 'bad'); return; }
      this.payCost(d.claim);
      this.state.city.districts[id] = true;
      this.state.stats.districts = DISTRICTS.filter(x => this.state.city.districts[x.id]).length;
      const beacon = this.world.beacons[id];
      if (beacon) {
        beacon.secured = true;
        beacon.ring.material.color.set(0x66e7d5);
        beacon.beam.material.color.set(0x66e7d5);
        beacon.light.color.set(0x66e7d5);
        if (beacon.label?.material?.map) {
          const tex = makeTextTexture(`${d.name.toUpperCase()} // SECURED`, { color: '#66e7d5', font: '900 50px "Barlow Condensed", sans-serif' });
          beacon.label.material.map.dispose();
          beacon.label.material.map = tex;
          beacon.label.material.needsUpdate = true;
        }
      }
      this.audio.reward();
      this.ui.toast(`${d.name.toUpperCase()} SECURED. THE CITY GROWS.`, '');
      this.updateHUD(true);
      this.save();
    },

    buildProject(id) {
      const p = PROJECTS.find(x => x.id === id);
      if (!p || this.state.city.projects.includes(id)) return;
      if (!this.state.city.districts[p.district]) { this.ui.toast('SECURE THE DISTRICT FIRST.', 'warn'); return; }
      if (!this.canAfford(p.cost)) { this.ui.toast('NOT ENOUGH MATERIALS.', 'bad'); return; }
      this.payCost(p.cost);
      this.state.city.projects.push(id);
      this.audio.reward();
      this.ui.toast(`PROJECT ONLINE // ${p.name.toUpperCase()}`);
      this.save();
    },

    fastTravel(id) {
      const d = DISTRICTS.find(x => x.id === id);
      if (!d || !this.state.city.districts[id]) return;
      if (this.driving) this.exitCar();
      if (!this.state.city.projects.includes('lift') && id !== 'rustmarket') {
        if (this.state.credits < 15) { this.ui.toast('TRANSIT FARE IS 15₵. NO LIFT BUILT.', 'bad'); return; }
        this.state.credits -= 15;
      }
      this.player.group.position.set(d.x, 0, d.z + 6);
      this.player.group.rotation.y = Math.PI;
      this.camYaw = 0;
      this.updateLocation();
      this.updateHUD(true);
      this.save();
      this.ui.toast(`TRANSIT // ${d.name.toUpperCase()}`);
      this.audio.ui();
    },

    buyProperty(id) {
      const lot = LOTS.find(l => l.id === id);
      if (!lot || this.state.home.owned.includes(id)) return;
      if (lot.districtId && !this.state.city.districts[lot.districtId]) { this.ui.toast('CLAIM THE DISTRICT FIRST.', 'warn'); return; }
      if (this.state.credits < lot.price) { this.ui.toast('NOT ENOUGH CREDIT FOR THE LOT.', 'bad'); return; }
      this.state.credits -= lot.price;
      this.state.home.owned.push(id);
      if (!this.state.home.layouts[id]) this.state.home.layouts[id] = { items: [], baseColor: '#565b4e' };
      this.renderHome(id);
      this.audio.reward();
      this.ui.toast(`${lot.name.toUpperCase()} IS YOURS. VISIT THE LOT AND BUILD.`);
      this.updateHUD(true);
      this.save();
    },

    visitLot(id) {
      const lot = LOTS.find(l => l.id === id);
      if (!lot) return;
      if (this.driving) this.exitCar();
      this.player.group.position.set(lot.pos[0], 0, lot.pos[1] + lot.size + 2);
      this.player.group.rotation.y = Math.PI;
      this.camYaw = 0;
      this.camPitch = .42;
      this.updateLocation();
      this.save();
      this.ui.toast(`${lot.name.toUpperCase()} // ${this.state.home.owned.includes(id) ? 'YOUR LOT' : 'FOR SALE'}`);
    },

    buyCar() {
      if (this.state.car.owned) return;
      const baseCost = this.state.career === 'mechanic' ? 187 : 220;
      const scrapCost = this.state.career === 'mechanic' ? 5 : 6;
      const hasKit = (this.state.inventory.repairkit || 0) > 0;
      const cost = Math.max(0, baseCost - (hasKit ? 60 : 0));
      if (this.state.credits < cost || (this.state.resources.scrap || 0) < scrapCost) {
        this.ui.toast('THE CHOP DOC WANTS CREDITS AND SCRAP UP FRONT.', 'bad');
        return;
      }
      this.state.credits -= cost;
      this.state.resources.scrap -= scrapCost;
      if (hasKit) this.state.inventory.repairkit -= 1;
      this.state.car.owned = true;
      this.state.car.repaired = true;
      this.spawnCar();
      this.audio.reward();
      this.ui.toast(hasKit ? 'REPAIR KIT SPENT. THE COUPE LIVES. OPEN THE GARAGE TO CUSTOMISE.' : 'THE COUPE LIVES. OPEN THE GARAGE TO CUSTOMISE OR DRIVE.');
      this.save();
      this.ui.refresh();
    },

    setCarOption(key, value) {
      if (!this.state.car.owned) return;
      this.state.car[key] = value;
      this.rebuildCar();
      this.audio.ui();
      this.save();
    },

    driveCar() {
      if (!this.state.car.owned) { this.ui.open('garage'); return; }
      if (!this.carObj) this.spawnCar();
      const p = this.player.group.position;
      const d = Math.hypot(this.carObj.position.x - p.x, this.carObj.position.z - p.z);
      if (d > 9) {
        this.carObj.position.set(p.x + Math.sin(this.camYaw) * 3, .03, p.z + Math.cos(this.camYaw) * 3);
        this.carObj.rotation.y = this.camYaw + Math.PI;
        this.carHeading = this.carObj.rotation.y;
      }
      this.ui.close(true);
      this.enterCar();
    },

    setLook(key, value) {
      if (!STYLE[key]?.includes(value)) return;
      this.state.look[key] = value;
      this.rebuildPlayer();
      this.drawAvatarMini();
      this.save();
    },

    randomizeLook() {
      const pick = arr => arr[Math.floor(Math.random() * arr.length)];
      for (const key of ['skin', 'hair', 'hairStyle', 'jacket', 'top', 'bottom', 'accent']) {
        this.state.look[key] = pick(STYLE[key]);
      }
      this.rebuildPlayer();
      this.drawAvatarMini();
      this.save();
    },

    rebuildPlayer() {
      const old = this.player.group;
      const pos = old.position.clone();
      const rot = old.rotation.y;
      const visible = old.visible;
      this.scene.remove(old);
      const group = createCharacter(this.state.look);
      group.position.copy(pos);
      group.rotation.y = rot;
      group.visible = visible;
      this.scene.add(group);
      this.player.group = group;
      this.player.heading = rot;
    },
  });
}
