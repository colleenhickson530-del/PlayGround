import * as THREE from 'three';
import { LOTS, BUILD_ITEMS, PAINTS, RESOURCES } from './data.js';
import { createFurniture } from './world.js';

const cellCenter = (lot, gx, gz) => [lot.pos[0] + (gx - 4.5) * 2, lot.pos[1] + (gz - 4.5) * 2];

function footprintOf(item, rot = 0) {
  const [w, d] = item.footprint || [1, 1];
  return rot % Math.PI === 0 || Math.abs(rot - Math.PI) < .01 ? [w, d] : [d, w];
}

export function installBuild(Game) {
  Object.assign(Game.prototype, {
    renderAllHomes() {
      for (const lot of LOTS) this.renderHome(lot.id);
    },

    renderHome(lotId) {
      const lot = LOTS.find(l => l.id === lotId);
      if (!lot) return;
      if (this.furnitureGroups[lotId]) {
        this.scene.remove(this.furnitureGroups[lotId]);
        this.furnitureGroups[lotId].traverse?.(o => {
          if (o.geometry) o.geometry.dispose?.();
          if (o.material) {
            if (Array.isArray(o.material)) o.material.forEach(m => m.dispose?.());
            else o.material.dispose?.();
          }
        });
      }
      const group = new THREE.Group();
      this.scene.add(group);
      this.furnitureGroups[lotId] = group;
      const layout = this.state.home.layouts[lotId] || { items: [], baseColor: '#565b4e' };
      const home = this.world.homeGroups[lotId];
      if (home?.children?.[0]?.material) {
        home.children[0].material.color.set(layout.baseColor || '#565b4e');
      }
      const spots = [];
      for (const item of layout.items) {
        const def = BUILD_ITEMS.find(i => i.id === item.itemId);
        if (!def) continue;
        const [w, d] = footprintOf(def, item.rot || 0);
        const [cx, cz] = cellCenter(lot, item.gx + (w - 1) / 2, item.gz + (d - 1) / 2);
        const mesh = createFurniture(def.type, item.color || def.color || '#6d7167', def.glow || item.glow);
        mesh.position.set(cx, .245, cz);
        mesh.rotation.y = item.rot || 0;
        group.add(mesh);
        if (['bed', 'crate', 'workbench', 'stove', 'couch'].includes(def.type)) {
          const copy = {
            bed: ['SLEEP POD', 'Sleep · restore health', 'rest'],
            crate: ['STORAGE CRATE', 'Open your stash', 'stash'],
            workbench: ['WORKBENCH', 'Craft survival gear', 'craft'],
            stove: ['COOK STOVE', 'Cook rations', 'cook'],
            couch: ['SCRAP COUCH', 'Rest a moment', 'rest'],
          }[def.type];
          spots.push({ uid: item.uid, x: cx, z: cz, label: copy[0], sub: copy[1], action: copy[2], lot: lotId });
        }
      }
      this.furnitureSpots[lotId] = spots;
    },

    enterBuild(lotId) {
      if (!this.started) return;
      const lot = LOTS.find(l => l.id === lotId);
      if (!lot) return;
      if (!this.state.home.owned.includes(lotId)) {
        this.ui.toast('YOU DO NOT OWN THIS LOT.', 'bad');
        this.ui.open('properties');
        return;
      }
      if (this.driving) this.exitCar();
      if (this.ui.openState) this.ui.close(true);
      this.buildMode = true;
      this.player.group.visible = false;
      this.buildState = {
        lotId, category: 'furniture', item: 'bed', eraser: false,
        paint: this.state.home.layouts[lotId]?.baseColor || PAINTS[1], rot: 0, cell: null, valid: false,
      };
      this.currentLot = lot;
      const preview = new THREE.Group();
      const tile = new THREE.Mesh(
        new THREE.PlaneGeometry(1.92, 1.92),
        new THREE.MeshBasicMaterial({ color: 0xd8ff45, transparent: true, opacity: .2, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
      );
      tile.rotation.x = -Math.PI / 2;
      preview.add(tile);
      this.scene.add(preview);
      this.buildPreview = preview;
      this.buildTile = tile;
      this.buildGhost = null;
      this.makeBuildGhost();
      this.ui.openBuildUI(lot, this.buildState);
      document.body.classList.add('building');
      this.audio.ui();
      this.ui.toast('BUILD MODE // CLICK TO PLACE. R ROTATES. X ERASES.');
      this.updateBuildGhost();
    },

    exitBuild(silent = false) {
      if (!this.buildMode) return;
      this.buildMode = false;
      this.player.group.visible = true;
      document.body.classList.remove('building');
      if (this.buildPreview) {
        this.scene.remove(this.buildPreview);
        this.buildPreview.traverse?.(o => {
          if (o.geometry) o.geometry.dispose?.();
          if (o.material) o.material.dispose?.();
        });
        this.buildPreview = null;
      }
      if (this.buildGhost) {
        this.scene.remove(this.buildGhost);
        this.buildGhost.traverse?.(o => {
          if (o.geometry) o.geometry.dispose?.();
          if (o.material) {
            if (Array.isArray(o.material)) o.material.forEach(m => m.dispose?.());
            else o.material.dispose?.();
          }
        });
        this.buildGhost = null;
      }
      this.buildTile = null;
      this.ui.closeBuildUI();
      this.buildState = null;
      this.currentLot = null;
      this.camPitch = .39;
      this.camDist = 11.5;
      this.save();
      this.updateHUD(true);
      if (!silent) this.ui.toast('BUILD MODE CLOSED // CHANGES SAVED.');
    },

    makeBuildGhost() {
      if (this.buildGhost) {
        this.scene.remove(this.buildGhost);
        this.buildGhost.traverse?.(o => {
          if (o.geometry) o.geometry.dispose?.();
          if (o.material) {
            if (Array.isArray(o.material)) o.material.forEach(m => m.dispose?.());
            else o.material.dispose?.();
          }
        });
        this.buildGhost = null;
      }
      if (!this.buildState || this.buildState.category === 'paint' || this.buildState.eraser) return;
      const def = BUILD_ITEMS.find(i => i.id === this.buildState.item);
      if (!def) return;
      const g = createFurniture(def.type, def.color || '#d8ff45', def.glow);
      g.traverse(o => {
        if (o.isLight) o.visible = false;
        if (o.isMesh) {
          o.material = o.material.clone();
          o.material.transparent = true;
          o.material.opacity = .34;
          o.material.depthWrite = false;
          if (o.material.color) o.material.color.set('#d8ff45');
          if (o.material.emissive) { o.material.emissive.set('#d8ff45'); o.material.emissiveIntensity = .35; }
        }
      });
      g.visible = false;
      this.scene.add(g);
      this.buildGhost = g;
    },

    buildCategory(cat) {
      if (!this.buildState) return;
      this.buildState.category = cat;
      this.buildState.eraser = false;
      if (cat === 'paint') this.buildState.item = null;
      else this.buildState.item = BUILD_ITEMS.find(i => i.cat === cat)?.id || null;
      this.makeBuildGhost();
      this.ui.openBuildUI(this.currentLot, this.buildState);
      this.updateBuildGhost();
    },

    buildSelectItem(id) {
      if (!this.buildState) return;
      const def = BUILD_ITEMS.find(i => i.id === id);
      if (!def) return;
      this.buildState.category = def.cat;
      this.buildState.item = id;
      this.buildState.eraser = false;
      this.makeBuildGhost();
      this.ui.refreshBuildUI();
      this.updateBuildGhost();
      this.audio.ui();
    },

    buildSelectPaint(color) {
      if (!this.buildState) return;
      this.buildState.category = 'paint';
      this.buildState.paint = color;
      this.buildState.eraser = false;
      this.buildState.item = null;
      this.makeBuildGhost();
      this.ui.refreshBuildUI();
      this.audio.ui();
    },

    buildToggleErase() {
      if (!this.buildState) return;
      this.buildState.eraser = !this.buildState.eraser;
      this.makeBuildGhost();
      this.ui.refreshBuildUI();
      this.updateBuildGhost();
      this.audio.ui();
    },

    buildRotate() {
      if (!this.buildState) return;
      this.buildState.rot = (this.buildState.rot + Math.PI / 2) % (Math.PI * 2);
      this.updateBuildGhost();
      this.audio.ui();
    },

    updateBuildGhost() {
      if (!this.buildMode || !this.buildState || !this.buildPreview) return;
      const lot = LOTS.find(l => l.id === this.buildState.lotId);
      if (!lot) return;
      this.ray.setFromCamera(this.ndc, this.camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.24);
      const hit = new THREE.Vector3();
      if (!this.ray.ray.intersectPlane(plane, hit)) { this.buildPreview.visible = false; if (this.buildGhost) this.buildGhost.visible = false; return; }
      const gxRaw = Math.round((hit.x - lot.pos[0]) / 2 + 4.5);
      const gzRaw = Math.round((hit.z - lot.pos[1]) / 2 + 4.5);
      if (gxRaw < 0 || gxRaw > 9 || gzRaw < 0 || gzRaw > 9) {
        this.buildPreview.visible = false;
        if (this.buildGhost) this.buildGhost.visible = false;
        this.buildState.cell = null;
        return;
      }
      this.buildPreview.visible = true;
      this.buildState.cell = [gxRaw, gzRaw];
      const [wx, wz] = cellCenter(lot, gxRaw, gzRaw);
      this.buildTile.position.set(wx, .253, wz);
      this.buildTile.material.color.set(this.buildState.eraser ? 0xff4545 : this.buildState.category === 'paint' ? 0x66e7d5 : 0xd8ff45);
      const valid = this.validateBuildCell(gxRaw, gzRaw);
      this.buildState.valid = valid;
      if (!this.buildState.eraser && this.buildState.category !== 'paint') {
        this.buildTile.material.color.set(valid ? 0xd8ff45 : 0xff4545);
      }
      if (this.buildGhost) {
        this.buildGhost.visible = !this.buildState.eraser && this.buildState.category !== 'paint';
        if (this.buildGhost.visible) {
          const def = BUILD_ITEMS.find(i => i.id === this.buildState.item);
          let [w, d] = footprintOf(def, this.buildState.rot);
          const [cx, cz] = cellCenter(lot, gxRaw + (w - 1) / 2, gzRaw + (d - 1) / 2);
          this.buildGhost.position.set(cx, .245, cz);
          this.buildGhost.rotation.y = this.buildState.rot;
          this.buildGhost.traverse(o => {
            if (o.isMesh && o.material) {
              if (!this.buildGhost.userData.baseColors) this.buildGhost.userData.baseColors = new Map();
            }
          });
        }
      }
    },

    occupiedBuildCells(excludeUid = null) {
      const layout = this.state.home.layouts[this.buildState?.lotId];
      const cells = new Set();
      if (!layout) return cells;
      for (const item of layout.items) {
        if (item.uid === excludeUid) continue;
        const def = BUILD_ITEMS.find(i => i.id === item.itemId);
        if (!def || def.type === 'floor') continue;
        const [w, d] = footprintOf(def, item.rot || 0);
        for (let x = item.gx; x < item.gx + w; x++) {
          for (let z = item.gz; z < item.gz + d; z++) cells.add(`${x},${z}`);
        }
      }
      return cells;
    },

    validateBuildCell(gx, gz) {
      if (!this.buildState) return false;
      const layout = this.state.home.layouts[this.buildState.lotId];
      if (!layout) return false;
      const def = BUILD_ITEMS.find(i => i.id === this.buildState.item);
      if (!def) return true;
      const [w, d] = footprintOf(def, this.buildState.rot);
      if (gx < 0 || gz < 0 || gx + w > 10 || gz + d > 10) return false;
      if (!this.canAfford(def.cost)) return false;
      if (def.type === 'floor') return true;
      const occupied = this.occupiedBuildCells();
      for (let x = gx; x < gx + w; x++) {
        for (let z = gz; z < gz + d; z++) {
          if (occupied.has(`${x},${z}`)) return false;
        }
      }
      return true;
    },

    placeBuildFromPointer() {
      if (!this.buildMode || !this.buildState?.cell) return;
      const [gx, gz] = this.buildState.cell;
      const lot = LOTS.find(l => l.id === this.buildState.lotId);
      if (!lot) return;
      const layout = this.state.home.layouts[this.buildState.lotId];
      if (!layout) return;
      if (this.buildState.eraser) {
        let removed = false;
        const idx = layout.items.findIndex(item => {
          const def = BUILD_ITEMS.find(i => i.id === item.itemId);
          if (!def) return false;
          const [w, d] = footprintOf(def, item.rot || 0);
          return gx >= item.gx && gx < item.gx + w && gz >= item.gz && gz < item.gz + d;
        });
        if (idx >= 0) { layout.items.splice(idx, 1); removed = true; }
        if (!removed) {
          if (layout.baseColor !== '#565b4e') { layout.baseColor = '#565b4e'; removed = true; }
        }
        if (removed) {
          this.renderHome(lot.id);
          this.audio.ui();
          this.save();
          this.ui.refreshBuildUI();
        }
        return;
      }
      if (this.buildState.category === 'paint') {
        if ((this.state.resources.paint || 0) <= 0) { this.ui.toast('NO SPRAY LEFT. CRAFT OR BUY MORE.', 'warn'); return; }
        let painted = false;
        const item = layout.items.find(it => {
          const def = BUILD_ITEMS.find(i => i.id === it.itemId);
          if (!def) return false;
          const [w, d] = footprintOf(def, it.rot || 0);
          return gx >= it.gx && gx < it.gx + w && gz >= it.gz && gz < it.gz + d;
        });
        if (item) { item.color = this.buildState.paint; painted = true; }
        else { layout.baseColor = this.buildState.paint; painted = true; }
        if (painted) {
          this.state.resources.paint -= 1;
          this.renderHome(lot.id);
          this.audio.ui();
          this.save();
          this.ui.refreshBuildUI();
        }
        return;
      }
      const def = BUILD_ITEMS.find(i => i.id === this.buildState.item);
      if (!def) return;
      if (!this.validateBuildCell(gx, gz)) {
        const costOk = this.canAfford(def.cost);
        this.ui.toast(costOk ? 'THAT CELL IS BLOCKED.' : 'NOT ENOUGH MATERIALS.', 'bad');
        return;
      }
      this.payCost(def.cost);
      layout.items.push({
        uid: `b-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
        itemId: def.id, gx, gz, rot: this.buildState.rot,
        color: def.type === 'floor' || def.type === 'wall' ? (def.color || '#6d7167') : undefined,
      });
      this.state.stats.builds += 1;
      this.renderHome(lot.id);
      if (def.id === 'bed') this.ui.toast('SLEEP POD PLACED // +1 HOUSING BED');
      this.audio.ui();
      this.save();
      this.ui.refreshBuildUI();
      this.updateHUD(true);
    },
  });
}
