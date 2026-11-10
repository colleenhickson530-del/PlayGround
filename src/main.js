import './styles.css';
import { Game } from './game.js';

async function boot() {
  try {
    await document.fonts?.ready;
  } catch {}
  try {
    const game = new Game();
    window.underneath = game;
    // Small debug surface for automated checks and players who like to tinker.
    window.__UNDERNEATH__ = {
      game,
      save: () => game.save(),
      state: () => game.state,
    };
  } catch (error) {
    console.error(error);
    const loading = document.getElementById('loadingScreen');
    if (loading) {
      loading.innerHTML = `<div class="loader-mark">◒</div><div class="loader-title" style="color:#ff7a2f">THE CITY FAILED TO BOOT</div><div class="loader-quote" style="max-width:440px;text-align:center;line-height:1.6">${String(error.message || error)}</div>`;
    }
  }
}

boot();
