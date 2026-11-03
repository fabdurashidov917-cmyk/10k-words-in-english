const fs = require('fs');
const path = require('path');
const vm = require('vm');

const baseDir = 'C:\\Users\\user\\.gemini\\word-game';

// Build a browser simulation context
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
    _dump: () => store
  };
})();

// Minimal DOM mock
class MockElement {
  constructor(tag, id = '', className = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.className = className;
    this.children = [];
    this.style = {};
    this.dataset = {};
    this.innerHTML = '';
    this.textContent = '';
    this.classList = {
      _classes: new Set(className ? className.split(' ') : []),
      add: function(...cls) { cls.forEach(c => this._classes.add(c)); },
      remove: function(...cls) { cls.forEach(c => this._classes.delete(c)); },
      contains: function(c) { return this._classes.has(c); },
      toggle: function(c) { if (this._classes.has(c)) this._classes.delete(c); else this._classes.add(c); }
    };
  }
  appendChild(child) { this.children.push(child); return child; }
  removeChild(child) { this.children = this.children.filter(c => c !== child); return child; }
  querySelector(sel) { return new MockElement('div'); }
  querySelectorAll(sel) { return [new MockElement('div')]; }
  addEventListener(evt, fn) {}
  removeEventListener(evt, fn) {}
  setAttribute(attr, val) { this[attr] = val; }
  getAttribute(attr) { return this[attr] || null; }
  focus() {}
  blur() {}
  scrollIntoView() {}
}

const mockDoc = {
  getElementById: (id) => new MockElement('div', id),
  querySelector: (sel) => new MockElement('div'),
  querySelectorAll: (sel) => [new MockElement('div'), new MockElement('div')],
  createElement: (tag) => new MockElement(tag),
  body: new MockElement('body'),
  addEventListener: (evt, fn) => {}
};

const sandbox = {
  window: {},
  document: mockDoc,
  localStorage: localStorageMock,
  navigator: { userAgent: 'NodeTest' },
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  Math: Math,
  Array: Array,
  Object: Object,
  Set: Set,
  Map: Map,
  String: String,
  Number: Number,
  Boolean: Boolean,
  Date: Date,
  RegExp: RegExp,
  JSON: JSON,
  crypto: {
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 0xFFFFFFFF);
      }
      return arr;
    }
  },
  Uint32Array: Uint32Array,
  AudioContext: class {
    createOscillator() { return { type: '', frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {} }; }
    createGain() { return { gain: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {} }; }
    get currentTime() { return 0; }
    get destination() { return {}; }
  },
  addEventListener: (evt, fn) => {},
  removeEventListener: (evt, fn) => {},
  speechSynthesis: {
    speak: () => {},
    cancel: () => {},
    getVoices: () => [{ lang: 'en-US' }]
  },
  SpeechSynthesisUtterance: class {
    constructor(t) { this.text = t; }
  }
};

sandbox.window = sandbox;
sandbox.window.crypto = sandbox.crypto;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.window.document = sandbox.document;
sandbox.window.AudioContext = sandbox.AudioContext;
sandbox.window.speechSynthesis = sandbox.speechSynthesis;
sandbox.window.SpeechSynthesisUtterance = sandbox.SpeechSynthesisUtterance;

const context = vm.createContext(sandbox);

function runFile(relPath) {
  const fullPath = path.join(baseDir, relPath);
  const code = fs.readFileSync(fullPath, 'utf8');
  vm.runInContext(code, context, { filename: relPath });
}

console.log('--- STARTING END-TO-END SYSTEM SIMULATION ---');

// 1. Load Data
console.log('1. Loading words_data.js & flashcards_data.js...');
runFile('js/words_data.js');
runFile('js/flashcards_data.js');

console.log(`✓ GLOBAL_WORDS_DATA count: ${sandbox.GLOBAL_WORDS_DATA.length}`);
console.log(`✓ FLASHCARDS_DATA count: ${sandbox.FLASHCARDS_DATA.length}`);

if (sandbox.GLOBAL_WORDS_DATA.length < 9900) {
  throw new Error(`Expected at least 9,900 words, got ${sandbox.GLOBAL_WORDS_DATA.length}`);
}
if (sandbox.FLASHCARDS_DATA.length !== 1000) {
  throw new Error(`Expected 1,000 flashcards, got ${sandbox.FLASHCARDS_DATA.length}`);
}

// Check duplicates in GLOBAL_WORDS_DATA
const wordsMap = new Map();
let dupCount = 0;
sandbox.GLOBAL_WORDS_DATA.forEach(item => {
  const key = item.en.toUpperCase();
  if (wordsMap.has(key)) {
    dupCount++;
  } else {
    wordsMap.set(key, 1);
  }
});
console.log(`✓ Duplicates in GLOBAL_WORDS_DATA: ${dupCount} (Must be 0)`);
if (dupCount !== 0) throw new Error('Found duplicate words in GLOBAL_WORDS_DATA!');

// 2. Load Core Engines
console.log('2. Loading audio.js, effects.js, words.js...');
runFile('js/audio.js');
runFile('js/effects.js');
runFile('js/words.js');

console.log('✓ Checking sound engine aliases:');
const requiredSounds = ['buttonClick', 'cardFlip', 'playClick', 'playCorrect', 'playSuccess', 'playWrong', 'playError', 'playBombTick', 'playBombExplode', 'playExplosion', 'playLevelUp', 'playDefused', 'speak'];
requiredSounds.forEach(fn => {
  if (typeof sandbox.soundEngine[fn] !== 'function') {
    throw new Error(`soundEngine.${fn} is not a function!`);
  }
});
console.log(`  All ${requiredSounds.length} sound methods verified.`);

console.log('✓ Checking effectsEngine aliases:');
const requiredEffects = ['triggerComboPill', 'burstConfetti', 'showFloatingReaction', 'launchConfetti'];
requiredEffects.forEach(fn => {
  if (typeof sandbox.effectsEngine[fn] !== 'function') {
    throw new Error(`effectsEngine.${fn} is not a function!`);
  }
});
console.log(`  All ${requiredEffects.length} effect methods verified.`);

// 3. Test WordBank and Anti-Repetition Cooldown Buffer
console.log('3. Testing WordBank & Anti-Repetition Cooldown...');
const wb = sandbox.wordBank;
console.log(`✓ Total WordBank words: ${wb.words.length}`);
if (wb.words.length < 9900) throw new Error(`WordBank words count too low: ${wb.words.length}`);

// Test marathon modes
[30, 50, 100].forEach(rounds => {
  wb.setRoundsCount(rounds);
  if (wb.getRoundsCount() !== rounds) throw new Error(`Rounds count mismatch for ${rounds}`);
});

// Test Anti-Repetition across 4 consecutive 30-word games:
// Words drawn in Game 1 must NOT appear in Game 2, 3, or 4!
wb.resetHistory();
wb.setRoundsCount(30);

const game1 = wb.getWords(30, 'all');
const game2 = wb.getWords(30, 'all');
const game3 = wb.getWords(30, 'all');
const game4 = wb.getWords(30, 'all');

const ids1 = new Set(game1.map(w => w.id));
const ids2 = new Set(game2.map(w => w.id));
const ids3 = new Set(game3.map(w => w.id));
const ids4 = new Set(game4.map(w => w.id));

let overlap12 = game2.filter(w => ids1.has(w.id)).length;
let overlap13 = game3.filter(w => ids1.has(w.id)).length;
let overlap14 = game4.filter(w => ids1.has(w.id)).length;

console.log(`✓ Game 1 words overlap in Game 2: ${overlap12} (Must be 0)`);
console.log(`✓ Game 1 words overlap in Game 3: ${overlap13} (Must be 0)`);
console.log(`✓ Game 1 words overlap in Game 4: ${overlap14} (Must be 0)`);

if (overlap12 !== 0 || overlap13 !== 0 || overlap14 !== 0) {
  throw new Error(`Anti-repetition failed! Overlaps: G1-G2: ${overlap12}, G1-G3: ${overlap13}, G1-G4: ${overlap14}`);
}

// Test categories
const catTestWords = wb.getByCategory('airport', 12);
console.log(`✓ getByCategory('airport', 12) returned ${catTestWords.length} words`);
if (catTestWords.length !== 12) throw new Error('getByCategory length mismatch');

const mixedTest = wb.getMixedCategoryWords(50);
console.log(`✓ getMixedCategoryWords(50) returned ${mixedTest.length} words`);
if (mixedTest.length !== 50) throw new Error('getMixedCategoryWords length mismatch');

// Test distractors
const target = mixedTest[0];
const distractors = wb.getDistractors(target, 3);
if (distractors.length !== 3) throw new Error('Distractors count mismatch');
distractors.forEach(d => {
  if (d.id === target.id) throw new Error('Distractor matches target!');
});
console.log('✓ getDistractors verified.');

// 4. Load & Test Game Modules
console.log('4. Loading games and simulating gameplay...');
runFile('js/games/pixel_detective.js');
runFile('js/games/text_cipher.js');
runFile('js/games/pair_blitz.js');
runFile('js/games/spelling_bomb.js');
runFile('js/games/sentence_builder.js');

// Test PixelDetectiveGame
const pdGame = new sandbox.PixelDetectiveGame();
pdGame.start('all', 30);
console.log(`✓ PixelDetectiveGame initialized with ${pdGame.wordsList.length} rounds.`);
if (pdGame.wordsList.length !== 30) throw new Error('PixelDetectiveGame rounds mismatch');
pdGame.destroy();

// Test TextCipherGame
const tcGame = new sandbox.TextCipherGame();
tcGame.start('all', 30);
console.log(`✓ TextCipherGame initialized with ${tcGame.wordsList.length} rounds.`);
if (tcGame.wordsList.length !== 30) throw new Error('TextCipherGame rounds mismatch');
tcGame.destroy();

// Test PairBlitzGame
const pbGame = new sandbox.PairBlitzGame();
pbGame.start('all', 30);
console.log(`✓ PairBlitzGame initialized with ${pbGame.totalPairs} pairs.`);
if (pbGame.totalPairs !== 6) throw new Error('PairBlitzGame pairs mismatch');
pbGame.destroy();

// Test SpellingBombGame (including virtual keyboard)
const sbGame = new sandbox.SpellingBombGame();
sbGame.start('all', 30);
console.log(`✓ SpellingBombGame initialized with ${sbGame.wordsList.length} rounds.`);
if (sbGame.wordsList.length !== 30) throw new Error('SpellingBombGame rounds mismatch');
sbGame.destroy();

// Test SentenceBuilderGame (with 30, 50, 100 rounds)
const sbgGame = new sandbox.SentenceBuilderGame();
sbgGame.start('all', 30);
console.log(`✓ SentenceBuilderGame 30 rounds initialized with ${sbgGame.challenges.length} challenges.`);
if (sbgGame.challenges.length !== 30) throw new Error('SentenceBuilder 30-round mismatch');

sbgGame.start('all', 100);
console.log(`✓ SentenceBuilderGame 100 rounds marathon initialized with ${sbgGame.challenges.length} challenges.`);
if (sbgGame.challenges.length !== 100) throw new Error('SentenceBuilder 100-round marathon failed');
sbgGame.destroy();

// 5. Load and Test Flashcards Viewer
console.log('5. Loading flashcards.js and testing 1,000 cards viewer...');
runFile('js/flashcards.js');
const fcViewer = sandbox.flashcards;
fcViewer.init();
console.log(`✓ FlashcardsEngine loaded ${fcViewer.allCards.length} cards.`);
if (fcViewer.allCards.length !== 1000) throw new Error(`Flashcards expected 1000 cards, got ${fcViewer.allCards.length}`);

// Test packs
const packs = ['1-100', '101-250', '251-400', '401-550', '551-700', '701-850', '851-1000'];
packs.forEach(p => {
  const inPack = fcViewer.allCards.filter(c => c.pack === p);
  if (inPack.length === 0) throw new Error(`Pack ${p} has 0 cards!`);
});
console.log(`✓ All 7 Flashcard Packs verified (1000 cards distributed across packs).`);

console.log('--- ALL SIMULATIONS & INTEGRATION TESTS PASSED 100% SUCCESSFULLY! ---');
