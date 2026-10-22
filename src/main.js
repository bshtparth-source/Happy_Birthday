import './styles/main.css';
import { loadContent } from './config/content.js';
import { init as initPetals } from './components/petals.js';
import { init as initMusic } from './components/music-player.js';
import { init as initEnvelope } from './components/envelope.js';
import { init as initHero } from './components/hero.js';
import { init as initStats } from './components/stats.js';
import { init as initCake } from './components/cake.js';
import { init as initCakeMic } from './components/cake-mic.js';
import { init as initScratch } from './components/scratch-card.js';
import { init as initScrapbook } from './components/scrapbook.js';
import { init as initLightbox } from './components/lightbox.js';
import { init as initLetter } from './components/letter.js';
import { init as initReasons } from './components/reasons.js';
import { init as initFinale } from './components/finale.js';

const modules = {};
let content = null;

function boot() {
  content = loadContent();

  // 1. Background Petals Canvas
  const petalsCanvas = document.getElementById('petals-canvas');
  modules.petals = initPetals(petalsCanvas);

  // 2. Music Player Pill
  const musicPill = document.getElementById('music-pill');
  modules.music = initMusic(musicPill, content);

  // Check if preview mode is requested (e.g. from Studio iframe)
  const isPreview = new URLSearchParams(window.location.search).get('preview') === '1';

  const envSection = document.getElementById('env-section');
  if (isPreview) {
    if (envSection) envSection.style.display = 'none';
    revealSections();
  } else {
    modules.envelope = initEnvelope(envSection, content, {
      onOpen() {
        modules.music.start();
        revealSections();
      },
    });
  }

  // Dev-only live preview bridge from Studio
  if (import.meta.env.DEV) {
    import('./dev/preview-bridge.js').then(({ init: initBridge }) => {
      initBridge(applyContent);
    });
  }
}

function revealSections() {
  const sectionIds = [
    'hero-section',
    'cake-section',
    'scratch-section',
    'gallery-section',
    'letter-section',
    'finale-section',
  ];

  sectionIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('section--hidden');
  });

  const heroSection = document.getElementById('hero-section');
  modules.hero = initHero(heroSection, content);
  modules.stats = initStats(heroSection, content);

  const cakeSection = document.getElementById('cake-section');
  modules.cake = initCake(cakeSection, content);
  modules.cakeMic = initCakeMic(cakeSection, content, {
    onBlow() {
      modules.cake.blow();
    },
  });

  modules.scratch = initScratch(document.getElementById('scratch-section'), content);

  const lightboxDialog = document.getElementById('lightbox-dialog');
  modules.lightbox = initLightbox(lightboxDialog, content);

  modules.scrapbook = initScrapbook(document.getElementById('gallery-section'), content, {
    onOpenPhoto(index) {
      modules.lightbox.open(index);
    },
  });

  const letterSection = document.getElementById('letter-section');
  modules.letter = initLetter(letterSection, content);
  modules.reasons = initReasons(letterSection, content);

  modules.finale = initFinale(document.getElementById('finale-section'), content, {
    onReplay() {
      replaySurprise();
    },
  });
}

/**
 * Re-applies updated content configuration dynamically.
 * @param {object} newContent
 */
function applyContent(newContent) {
  content = loadContent(newContent);
  Object.values(modules).forEach((mod) => mod?.destroy?.());
  boot();
}

/**
 * Resets all sections back to initial state without reloading the browser.
 */
function replaySurprise() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => {
    Object.values(modules).forEach((mod) => mod?.reset?.());
  }, 450);
}

// Boot application
boot();
