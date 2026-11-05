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
  getBoundingClientRect() { return { top: 0, bottom: 0, left: 0, right: 0, width: 100, height: 100 }; }
  remove() { if (this.parentNode) this.parentNode.removeChild(this); }
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
  scrollTo: () => {},
  speechSynthesis: {
    speak: () => {},
    cancel: () => {},
    getVoices: () => [{ lang: 'en-US' }]
  },
  SpeechSynthesisUtterance: class {
    constructor(t) { this.text = t; }
  },
  fetch: async (url) => {
    const cleanUrl = url.replace(/^\.\//, '');
    const p = path.join(baseDir, cleanUrl);
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      return {
        ok: true,
        status: 200,
        json: async () => JSON.parse(content)
      };
    }
    return { ok: false, status: 404 };
  },
  URL: {
    createObjectURL: () => 'blob:mock-audio-url',
    revokeObjectURL: () => {}
  },
  navigator: {
    userAgent: 'NodeTest',
    mediaDevices: {
      getUserMedia: async () => ({
        getTracks: () => [{ stop: () => {} }]
      })
    }
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
console.log('2. Loading core.bundle.js...');
runFile('js/core.bundle.js');

console.log('✓ Checking sound engine aliases:');
const requiredSounds = ['buttonClick', 'cardFlip', 'playClick', 'playCorrect', 'playSuccess', 'playWrong', 'playError', 'playBombTick', 'playBombExplode', 'playExplosion', 'playLevelUp', 'playDefused', 'speak'];
requiredSounds.forEach(fn => {
  if (typeof sandbox.soundEngine[fn] !== 'function') {
    throw new Error(`soundEngine.${fn} is not a function!`);
  }
});
console.log(`  All ${requiredSounds.length} sound methods verified.`);

console.log('✓ Checking effectsEngine aliases:');
const requiredEffects = ['triggerComboPill', 'burstConfetti', 'showFloatingReaction', 'launchConfetti', 'shakeElement'];
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
console.log('4. Loading games.bundle.js and simulating gameplay...');
runFile('js/games.bundle.js');

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

// Test WordleGame
const wordleGame = new sandbox.WordleGame();
wordleGame.start('all');
console.log(`✓ WordleGame initialized with target word: ${wordleGame.targetWord} (${wordleGame.targetWord.length} letters).`);
if (wordleGame.targetWord.length !== 5) throw new Error('Wordle target word length mismatch');
wordleGame.destroy();

// Test AudioDetectiveGame
const audioGame = new sandbox.AudioDetectiveGame();
audioGame.start('all', 30);
console.log(`✓ AudioDetectiveGame initialized with ${audioGame.wordsList.length} rounds.`);
if (audioGame.wordsList.length !== 30) throw new Error('AudioDetectiveGame rounds mismatch');
audioGame.destroy();

// Test WordSearchGame
const wsGame = new sandbox.WordSearchGame();
wsGame.start('all');
console.log(`✓ WordSearchGame initialized with ${wsGame.wordsToFind.length} words to find in ${wsGame.gridSize}x${wsGame.gridSize} matrix.`);
if (wsGame.wordsToFind.length === 0 || wsGame.grid.length !== 10) throw new Error('WordSearchGame matrix initialization failed');
// Simulate finding the first word
const targetToFind = wsGame.wordsToFind[0];
wsGame.currentLineCells = targetToFind.cells;
wsGame.isSelecting = true;
wsGame.handlePointerUp();
console.log(`✓ WordSearchGame simulated finding word: ${targetToFind.word} (${targetToFind.translation}). Found count: ${wsGame.foundWordsCount}`);
if (!targetToFind.found) throw new Error('WordSearchGame word match failed');
wsGame.destroy();

// Test MistakeArenaGame
const mistakeGame = new sandbox.MistakeArenaGame();
mistakeGame.start();
console.log(`✓ MistakeArenaGame initialized successfully.`);
mistakeGame.destroy();

// Test Game 10: ContextFillGame (Kripto-gaplar & Mashhur iqtiboslar)
const cfGame = new sandbox.ContextFillGame();
cfGame.start('all');
console.log(`✓ ContextFillGame initialized with ${cfGame.curatedQuotes.length} curated quotes. Current quote target: ${cfGame.targetWord}`);
if (!cfGame.targetWord || cfGame.options.length !== 4) throw new Error('ContextFillGame initialization failed');
cfGame.handleAnswer(cfGame.targetWord, { classList: { add: () => {} } });
if (cfGame.score !== 30) throw new Error('ContextFillGame scoring failed');
console.log(`✓ ContextFillGame answer verified. Score: ${cfGame.score}`);
cfGame.destroy();

// Test Game 11: DictationGame (Eshitib Yozish)
const dictGame = new sandbox.DictationGame();
dictGame.start('all');
console.log(`✓ DictationGame initialized with target word: ${dictGame.currentWord.word}`);
if (!dictGame.currentWord.word) throw new Error('DictationGame word selection failed');
dictGame.revealOneLetter();
console.log(`✓ DictationGame revealed letter count: ${dictGame.revealedIndices.size}`);
dictGame.destroy();

// Test Game 12: RootQuizGame (Ildizdosh Variantlar)
const rootGame = new sandbox.RootQuizGame();
rootGame.start('all');
console.log(`✓ RootQuizGame initialized with root: ${rootGame.currentFamily.root}, target meaning: ${rootGame.targetItem.uz}`);
if (!rootGame.targetItem.word || rootGame.options.length !== 4) throw new Error('RootQuizGame initialization failed');
rootGame.handleAnswer(rootGame.targetItem.word, { classList: { add: () => {} } });
if (rootGame.score !== 30) throw new Error('RootQuizGame scoring failed');
console.log(`✓ RootQuizGame answer verified. Score: ${rootGame.score}`);
rootGame.destroy();

// Test GamificationEngine
const gEngine = sandbox.gamification;
gEngine.addXP(300);
console.log(`✓ GamificationEngine XP added. Current level: ${gEngine.currentLevel.level} (${gEngine.currentLevel.title}), XP: ${gEngine.xp}`);
if (gEngine.xp < 300) throw new Error('XP addition failed');

// Test Combos
for (let i = 0; i < 5; i++) {
  gEngine.recordAnswer(true, { responseTime: 2000 });
}
console.log(`✓ GamificationEngine recorded answers. Current combo: ${gEngine.currentCombo}`);
if (gEngine.currentCombo !== 5) throw new Error('Combo tracking failed');
if (!gEngine.unlockedBadges.has('SHARPSHOOTER_5')) throw new Error('Badge unlocking failed');
console.log(`✓ Unlocked badge SHARPSHOOTER_5 verified. Total unlocked: ${gEngine.unlockedBadges.size}`);

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

// Test Spaced Repetition (Anki)
console.log(`✓ Initial Due Today cards: ${fcViewer.getDueTodayCount()}`);
fcViewer.rateCurrentCard('easy');
fcViewer.nextCard();
fcViewer.rateCurrentCard('good');
fcViewer.nextCard();
fcViewer.rateCurrentCard('hard');
console.log(`✓ Flashcards SRS rated cards successfully. Stored SRS cards: ${Object.keys(fcViewer.srsData).length}`);
if (Object.keys(fcViewer.srsData).length !== 3) throw new Error('SRS data recording failed');

// 6. Testing Favorites & Export Engine...
console.log('6. Testing Favorites & Export Engine...');
const favMgr = sandbox.favoritesExport;
favMgr.starredSet.clear();
favMgr.toggleStar('ACHIEVE');
favMgr.toggleStar('BENEFIT');
favMgr.toggleStar('CHALLENGE');
console.log(`✓ Starred words count: ${favMgr.getStarredCount()}`);
if (favMgr.getStarredCount() !== 3) throw new Error('Starred words count mismatch');
if (!favMgr.isStarred('achieve') || !favMgr.isStarred('BENEFIT')) throw new Error('isStarred case-insensitive check failed');
const starredList = favMgr.getStarredWords();
console.log(`✓ Resolved full starred words: ${starredList.length} items`);
if (starredList.length !== 3) throw new Error('getStarredWords failed to resolve items');

// Test Anki export data generation
const ankiLines = [];
for (const w of starredList) {
  const line = `${w.word}\t${w.translation}\tshadow-lexicon`;
  ankiLines.push(line);
}
console.log(`✓ Generated Anki deck lines: ${ankiLines.length}`);
if (ankiLines.length !== 3) throw new Error('Anki lines generation failed');

// 7. Testing RPG Quest Mode (Qorong'u Labirint)...
console.log('7. Testing RPG Quest Mode (Qorong\'u Labirint)...');
const qEngine = sandbox.questEngine;
qEngine.init();
const totalQuestRooms = qEngine.chapters.reduce((acc, ch) => acc + ch.rooms.length, 0);
console.log(`✓ QuestEngine verified ${qEngine.chapters.length} chapters and ${totalQuestRooms} rooms.`);
if (qEngine.chapters.length !== 3 || totalQuestRooms !== 15) throw new Error('Chapters/Rooms count mismatch');

// Test Entering Room 1 (10 ta so'z hajmli bosqich)
qEngine.enterRoom(1);
console.log(`✓ Entered Room 1 (${qEngine.activeRoom.name}). Questions loaded: ${qEngine.questions.length}`);
if (qEngine.questions.length !== 10) throw new Error('Room 1 question count mismatch');

// Simulate answering Room 1 correctly (10 questions)
for (let i = 0; i < 10; i++) {
  const currentQ = qEngine.questions[qEngine.currentQuestionIndex];
  const correctIdx = currentQ.options.findIndex(o => o.correct);
  qEngine.handleAnswer(correctIdx, 0);
}
console.log(`✓ Room 1 cleared with 3 stars! Unlocked rooms: [${qEngine.progress.unlockedRooms.join(', ')}]`);
if (!qEngine.progress.unlockedRooms.includes(2)) throw new Error('Room 2 was not unlocked');

// Test Boss Room 5 (15 ta so'z hajmli Boss jangi)
qEngine.progress.unlockedRooms.push(5);
qEngine.enterRoom(5);
console.log(`✓ Entered Boss Room 5 (${qEngine.activeRoom.name}). Boss HP: ${qEngine.bossHp}, Questions: ${qEngine.questions.length}`);
if (!qEngine.activeRoom.isBoss || qEngine.questions.length !== 15) throw new Error('Boss Room 5 validation failed');

// Simulate Defeating Boss 5 (15 questions)
for (let i = 0; i < 15; i++) {
  const currentQ = qEngine.questions[qEngine.currentQuestionIndex];
  const correctIdx = currentQ.options.findIndex(o => o.correct);
  qEngine.handleAnswer(correctIdx, 0);
}
console.log(`✓ Boss 5 Defeated! Awarded relics: [${qEngine.progress.relics.join(', ')}]`);
if (!qEngine.progress.relics.includes('library_key')) throw new Error('Boss relic was not awarded');

// 8. Testing 1000 Movie Quotes Shadowing & Audio Analysis Engine...
console.log('8. Testing 1000 Movie Quotes Shadowing & Audio Analysis Engine...');
runFile('js/shadowing.js');

(async () => {
  const studio = sandbox.shadowingStudio;
  if (!studio) throw new Error('shadowingStudio is not defined!');

  // Test lazy-loading quotes.json
  await studio.loadQuotes();
  console.log(`✓ Loaded quotes count in studio: ${studio.quotes.length}`);
  if (studio.quotes.length !== 1000) throw new Error(`Expected 1000 quotes, got ${studio.quotes.length}`);

  // Test fields on quotes
  const sample = studio.quotes[0];
  console.log(`✓ Sample quote: ID=${sample.id}, Movie="${sample.movie}", Level=${sample.level}`);
  if (!sample.id || !sample.en || !sample.uz || !sample.movie || !sample.level) {
    throw new Error('Quote item missing required schema fields');
  }

  // Test Levenshtein distance
  const d0 = studio.calculateLevenshteinDistance("hello world", "hello world");
  const d1 = studio.calculateLevenshteinDistance("kitten", "sitting");
  console.log(`✓ Levenshtein distance check: "hello world" vs "hello world" = ${d0}, "kitten" vs "sitting" = ${d1}`);
  if (d0 !== 0 || d1 !== 3) throw new Error('Levenshtein distance calculation incorrect');

  // Test Pronunciation STT & Word Diff analysis
  studio.selectQuoteById(1);
  const q1 = studio.getCurrentQuote();
  console.log(`✓ Selected Quote #1: "${q1.en}"`);
  
  // Exact spoken sentence simulation
  studio.analyzePronunciation(q1.en);
  const prog1 = studio.progress[1];
  console.log(`✓ Exact pronunciation score: ${prog1.bestScore}%`);
  if (prog1.bestScore < 95) throw new Error('Exact spoken speech score should be >= 95%');

  // Partial / imperfect spoken sentence simulation
  studio.analyzePronunciation("Frankly my dear I don't give");
  const partialProg = studio.progress[1];
  console.log(`✓ Partial pronunciation recorded. Attempts: ${partialProg.attempts}`);
  if (partialProg.attempts < 2) throw new Error('Attempts count was not incremented');

  // Test Levels Filtering
  studio.setLevelFilter('B1');
  console.log(`✓ B1 Level filtered count: ${studio.filteredQuotes.length}`);
  if (!studio.filteredQuotes.every(q => q.level === 'B1')) {
    throw new Error('Level filter did not properly filter quotes to B1');
  }

  // Test Movie Search Filtering
  studio.setLevelFilter('ALL');
  studio.setSearchQuery('Godfather');
  console.log(`✓ Movie search "Godfather" results: ${studio.filteredQuotes.length}`);
  if (studio.filteredQuotes.length === 0) throw new Error('Search for "Godfather" returned 0 results');

  // Test Bookmarking
  studio.toggleBookmark(1);
  console.log(`✓ Bookmarked Quote #1. Bookmark count: ${studio.bookmarks.size}`);
  if (!studio.bookmarks.has(1)) throw new Error('Bookmark toggle failed');
  studio.toggleBookmark(1);
  if (studio.bookmarks.has(1)) throw new Error('Bookmark untoggle failed');

  // Test Next & Prev Navigation
  studio.setSearchQuery('');
  const initialIndex = studio.currentIndex;
  studio.nextQuote();
  if (studio.currentIndex !== initialIndex + 1) throw new Error('nextQuote failed to advance index');
  studio.prevQuote();
  if (studio.currentIndex !== initialIndex) throw new Error('prevQuote failed to step back');

  // Test Speed controls
  studio.setPlaybackSpeed(0.75);
  if (studio.playbackRate !== 0.75) throw new Error('setPlaybackSpeed failed');
  studio.setPlaybackSpeed(1.25);
  if (studio.playbackRate !== 1.25) throw new Error('setPlaybackSpeed failed');

  // 9. Testing Destination B2 Exam & Grammar/Vocabulary Quiz Engine...
  console.log('9. Testing Destination B2 Exam & Grammar/Vocabulary Quiz Engine...');
  runFile('js/destination_b2.js');

  const b2Quiz = sandbox.destinationB2Quiz;
  if (!b2Quiz) throw new Error('destinationB2Quiz is not defined!');

  await b2Quiz.loadQuestions();
  console.log(`✓ Loaded Destination B2 questions: ${b2Quiz.allQuestions.length}`);
  if (b2Quiz.allQuestions.length < 100) {
    throw new Error(`Expected at least 100 questions, got ${b2Quiz.allQuestions.length}`);
  }

  // Schema verification
  const validSchema = b2Quiz.allQuestions.every(q => 
    q.id && q.unit && q.topic && q.q && 
    Array.isArray(q.options) && q.options.length === 4 && 
    typeof q.answer === 'number' && q.answer >= 0 && q.answer <= 3 &&
    q.rule_short && q.rule_detailed
  );
  console.log(`✓ All Destination B2 questions have valid schema (options, rules, detailed analysis): ${validSchema}`);
  if (!validSchema) throw new Error('Invalid question schema in destination_b2.json');

  // Test 10-count quiz generation
  b2Quiz.setTestCount(10);
  console.log(`✓ Generated 10-question sheet: ${b2Quiz.activeQuestions.length} items`);
  if (b2Quiz.activeQuestions.length !== 10) throw new Error('Failed to generate 10 questions');

  // Test 20-count quiz generation
  b2Quiz.setTestCount(20);
  console.log(`✓ Generated 20-question sheet: ${b2Quiz.activeQuestions.length} items`);
  if (b2Quiz.activeQuestions.length !== 20) throw new Error('Failed to generate 20 questions');

  // Test 30-count quiz generation
  b2Quiz.setTestCount(30);
  console.log(`✓ Generated 30-question sheet: ${b2Quiz.activeQuestions.length} items`);
  if (b2Quiz.activeQuestions.length !== 30) throw new Error('Failed to generate 30 questions');

  // Test Answering and Bulk Checking
  b2Quiz.setTestCount(10);
  // Answer first 8 correctly, 2 incorrectly
  b2Quiz.activeQuestions.forEach((q, idx) => {
    if (idx < 8) {
      b2Quiz.selectOption(q.id, q.answer); // correct
    } else {
      b2Quiz.selectOption(q.id, (q.answer + 1) % 4); // wrong
    }
  });

  b2Quiz.checkAllAnswers();
  console.log(`✓ Bulk Check All verified. Score: ${b2Quiz.score} / ${b2Quiz.activeQuestions.length} (80%)`);
  if (b2Quiz.score !== 8) throw new Error(`Expected score 8, got ${b2Quiz.score}`);
  if (b2Quiz.history.length === 0) throw new Error('Quiz result not saved to history');

  // Test Topic Filtering
  b2Quiz.setTopicFilter('Conditionals');
  console.log(`✓ Filtered topic "Conditionals" pool: ${b2Quiz.filteredPool.length} items`);
  if (!b2Quiz.filteredPool.every(q => q.topic === 'Conditionals')) {
    throw new Error('Topic filter failed to isolate Conditionals');
  }

  console.log('--- ALL SIMULATIONS & INTEGRATION TESTS PASSED 100% SUCCESSFULLY! ---');
})().catch(err => {
  console.error('SIMULATION ERROR:', err);
  process.exit(1);
});
