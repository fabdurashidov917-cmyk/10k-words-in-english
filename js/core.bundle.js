/** SHADOW LEXICON // CORE ENGINES BUNDLE **/

/**
 * 10,000 Words Ultra-Randomized Database Engine
 * Features:
 * - 9,965+ Unique, Deduplicated English-Uzbek Words
 * - 9 Balanced Categories (Airport, Nature, Street, Store, Food, Work, Tech, Health, Daily)
 * - Anti-Repetition Cooldown Buffer: Words do NOT repeat for at least 3-4 full games
 * - Cryptographic Fisher-Yates Random Algoritm (Web Crypto API)
 */

const CATEGORIES = [
  { id: 'all', name: "Aralash (Auto-Shuffle)", icon: '🔀', count: '10,000' },
  { id: 'airport', name: 'Aeroport & Sayohat', icon: '✈️', count: '1,100' },
  { id: 'nature', name: 'Tabiat & Atrof', icon: '🌲', count: '1,115' },
  { id: 'street', name: "Ko'chada & Shahar", icon: '🏙️', count: '1,110' },
  { id: 'store', name: "Do'konda & Savdo", icon: '🛍️', count: '1,115' },
  { id: 'food', name: 'Restoran & Taomlar', icon: '🍲', count: '1,105' },
  { id: 'work', name: 'Ish & Biznes', icon: '💼', count: '1,105' },
  { id: 'tech', name: 'Texnologiya & IT', icon: '💻', count: '1,120' },
  { id: 'health', name: 'Salomatlik & Sport', icon: '🏃', count: '1,115' },
  { id: 'daily', name: "Kundalik so'zlar", icon: '☕', count: '1,075' }
];

class WordBank {
  constructor() {
    this.words = [];
    this.selectedRoundsCount = parseInt(localStorage.getItem('lex_rounds') || '30'); // 30, 50, 100
    
    // Anti-repetition cooldown history: words cannot repeat for at least 3-4 full games
    try {
      const savedHistory = JSON.parse(localStorage.getItem('lex_recent_history') || '[]');
      this.recentHistory = new Set(Array.isArray(savedHistory) ? savedHistory : []);
    } catch (e) {
      this.recentHistory = new Set();
    }

    this.initDatabase();
  }

  // Kriptografik darajadagi Fisher-Yates Random Algoritmi
  cryptoShuffle(array) {
    const copy = [...array];
    const n = copy.length;
    if (n <= 1) return copy;

    const randomBuffer = new Uint32Array(n);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(randomBuffer);
    } else {
      for (let i = 0; i < n; i++) randomBuffer[i] = Math.floor(Math.random() * 0xFFFFFFFF);
    }

    for (let i = n - 1; i > 0; i--) {
      const j = randomBuffer[i] % (i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  initDatabase() {
    const baseList = [];

    // 1) 1,000 Flashcards Data (aniq misol gaplar va o'zbekcha tarjima)
    if (window.FLASHCARDS_DATA && Array.isArray(window.FLASHCARDS_DATA)) {
      const flashcardWords = window.FLASHCARDS_DATA.map((fc, index) => {
        const escaped = fc.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const maskedSentence = fc.example.replace(new RegExp(`\\b${escaped}\\b`, 'i'), '[ ? ]');
        
        let cat = 'daily';
        if (fc.pack === '1-100') cat = 'daily';
        else if (fc.pack === '101-250') cat = 'street';
        else if (fc.pack === '251-400') cat = 'store';
        else if (fc.pack === '401-550') cat = 'nature';
        else if (fc.pack === '551-700') cat = 'work';
        else if (fc.pack === '701-850') cat = 'health';
        else cat = 'tech';

        return {
          id: fc.id,
          word: fc.word.toUpperCase(),
          translation: fc.uzb,
          phonetic: `/${fc.word.toLowerCase()}/`,
          category: cat,
          level: fc.id <= 250 ? 'A2' : (fc.id <= 600 ? 'B1' : 'B2'),
          definition: fc.uzb,
          sentence: maskedSentence !== fc.example ? maskedSentence : `${fc.example} [ ? ]`,
          fullExample: fc.example,
          image: `https://images.unsplash.com/photo-${1500000000000 + (index % 500) * 1000}?w=600&auto=format&fit=crop&q=80`
        };
      });
      baseList.push(...flashcardWords);
    }

    // 2) 10,000 ta so'zdan iborat to'liq lug'at bazasi (Deduplicated)
    if (window.GLOBAL_WORDS_DATA && Array.isArray(window.GLOBAL_WORDS_DATA)) {
      const existingWords = new Set(baseList.map(w => w.word));
      const rest = window.GLOBAL_WORDS_DATA
        .filter(item => !existingWords.has(item.en.toUpperCase()))
        .map((item, index) => ({
          id: baseList.length + index + 1,
          word: item.en.toUpperCase(),
          translation: item.uz,
          phonetic: `/${item.en.toLowerCase()}/`,
          category: item.cat || 'daily',
          level: item.lvl || 'B1',
          definition: item.def || item.uz,
          sentence: item.sent || `Please understand the meaning of [ ? ] carefully.`,
          image: `https://images.unsplash.com/photo-${1500000000000 + ((baseList.length + index) % 500) * 1000}?w=600&auto=format&fit=crop&q=80`
        }));
      baseList.push(...rest);
    }

    // Zaxira agar bo'sh bo'lsa
    if (baseList.length === 0) {
      baseList.push(
        { id: 1, word: 'ACHIEVE', translation: 'Erishmoq', category: 'daily', level: 'A2', definition: 'Maqsadga yetishish', sentence: 'She worked hard to [ ? ] her goal.' },
        { id: 2, word: 'BOARDING', translation: 'Samolyotga chiqish', category: 'airport', level: 'A2', definition: 'Samolyotga chiqish jarayoni', sentence: 'Proceed to the [ ? ] gate now.' },
        { id: 3, word: 'WATERFALL', translation: 'Sharshara', category: 'nature', level: 'A2', definition: 'Tog\'dan tushuvchi suv', sentence: 'We admired the grand [ ? ].' },
        { id: 4, word: 'CONTRACT', translation: 'Shartnoma', category: 'work', level: 'B1', definition: 'Rasmiy hujjat', sentence: 'Both signed the employment [ ? ].' }
      );
    }

    this.words = baseList;
    console.log(`✓ WordBank Initialized: ${this.words.length} unique words ready.`);
  }

  /**
   * O'ta darajada Random so'zlar tanlash (30, 50, 100 talik)
   * TALAB: Bir so'z kamida 3-4 ta o'yindan so'ng qayta takrorlanadi (Anti-Repetition Buffer).
   */
  getWords(count = 30, categoryId = 'all') {
    let pool = this.words;

    if (categoryId && categoryId !== 'all') {
      pool = this.words.filter(w => w.category === categoryId);
      if (pool.length < count) {
        const others = this.words.filter(w => w.category !== categoryId);
        pool = pool.concat(this.cryptoShuffle(others).slice(0, count - pool.length));
      }
    }

    // Kamida 3-4 ta to'liq o'yin uchun Cooldown buferi
    // 30 talik marafon bo'lsa: 30 * 4 = 120 ta (kamida 250 ta)
    // 50 talik marafon bo'lsa: 50 * 4 = 200 ta (kamida 250 ta)
    // 100 talik marafon bo'lsa: 100 * 4 = 400 ta
    const cooldownCapacity = Math.max(250, this.selectedRoundsCount * 4);

    // Oxirgi 3-4 ta o'yinda chiqqan so'zlarni chetlatamiz
    let freshCandidates = pool.filter(w => !this.recentHistory.has(w.id));

    // Agar kategoriya bo'yicha toza so'zlar yetmasa, tarixning eng eski qismini bo'shatamiz
    if (freshCandidates.length < count) {
      const histArr = Array.from(this.recentHistory);
      const keepCount = Math.max(0, histArr.length - count * 2);
      this.recentHistory = new Set(histArr.slice(histArr.length - keepCount));
      freshCandidates = pool.filter(w => !this.recentHistory.has(w.id));
    }

    // Kriptografik tasodifiy tartibda aralashtirish
    const candidatesToShuffle = freshCandidates.length >= count ? freshCandidates : pool;
    const randomized = this.cryptoShuffle(candidatesToShuffle);
    const selected = randomized.slice(0, count);

    // Tanlangan so'zlarni tarixga qo'shamiz
    selected.forEach(w => this.recentHistory.add(w.id));

    // Tarix hajmi buferdan oshsa, eng eskisini tozalaymiz
    if (this.recentHistory.size > cooldownCapacity) {
      const histArr = Array.from(this.recentHistory);
      const overflow = histArr.length - cooldownCapacity;
      this.recentHistory = new Set(histArr.slice(overflow));
    }

    // Saqlash
    try {
      localStorage.setItem('lex_recent_history', JSON.stringify(Array.from(this.recentHistory)));
    } catch (e) {}

    return selected;
  }

  // Aralash bo'limlar uchun yordamchi metod (getMixedCategoryWords)
  getMixedCategoryWords(count = 30) {
    return this.getWords(count, 'all');
  }

  // Juftlik Blitz va boshqa o'yinlar uchun bo'lim bo'yicha olish (getByCategory)
  getByCategory(categoryId = 'all', count = 12) {
    return this.getWords(count, categoryId);
  }

  // Marathon raundlar sonini sozlash (30, 50, 100)
  setRoundsCount(count) {
    if ([30, 50, 100].includes(count)) {
      this.selectedRoundsCount = count;
      localStorage.setItem('lex_rounds', count);
    }
  }

  getRoundsCount() {
    return this.selectedRoundsCount;
  }

  // Bitta tasodifiy so'z olish (cooldown hisobga olinadi)
  getRandomWord(categoryId = 'all', excludeId = null) {
    let pool = this.words;
    if (categoryId && categoryId !== 'all') {
      const catPool = this.words.filter(w => w.category === categoryId);
      if (catPool.length > 5) pool = catPool;
    }

    if (excludeId) {
      pool = pool.filter(w => w.id !== excludeId);
    }

    const fresh = pool.filter(w => !this.recentHistory.has(w.id));
    const targetPool = fresh.length > 5 ? fresh : pool;

    const idx = Math.floor(Math.random() * targetPool.length);
    const chosen = targetPool[idx] || this.words[0];

    if (chosen) {
      this.recentHistory.add(chosen.id);
      if (this.recentHistory.size > 250) {
        const arr = Array.from(this.recentHistory);
        this.recentHistory = new Set(arr.slice(arr.length - 200));
      }
    }

    return chosen;
  }

  // Variantlar uchun 3 ta tasodifiy chalg'ituvchi so'z olish
  getDistractors(correctWord, count = 3) {
    const candidates = this.words.filter(w => w.id !== correctWord.id && w.translation !== correctWord.translation);
    const shuffled = this.cryptoShuffle(candidates);
    return shuffled.slice(0, count);
  }

  // Tarixni qayta tozalash
  resetHistory() {
    this.recentHistory.clear();
    localStorage.removeItem('lex_recent_history');
    console.log('Cooldown history cleared.');
  }
}

window.wordBank = new WordBank();


/**
 * Standalone Audio Synthesizer (Web Audio API + Web Speech API)
 * Zero external audio files required. Completely standalone & reliable.
 * Supports iPhone/Safari webkitAudioContext, desktop and mobile.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.soundEnabled = true;
    this.voiceEnabled = true;
  }

  init() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {
      console.warn('AudioContext not allowed yet:', e);
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }

  // Soft tactile button tap (haptic audio)
  playClick() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(350, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {}
  }

  buttonClick() {
    this.playClick();
  }

  gameStart() {
    this.playClick();
  }

  match() {
    this.playCorrect();
  }

  correct() {
    this.playCorrect();
  }

  wrong() {
    this.playWrong();
  }

  levelUp() {
    this.playLevelUp();
  }

  speakWord(text) {
    this.speak(text);
  }

  // Card flip spatial sound (soft whoosh)
  cardFlip() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.08);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  // Correct answer chime (pleasant upward arpeggio)
  playCorrect() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.14, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.25);
      });
    } catch (e) {}
  }

  playSuccess() {
    this.playCorrect();
  }

  // Wrong answer buzz (descending tone)
  playWrong() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.22);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {}
  }

  playError() {
    this.playWrong();
  }

  // Bomb countdown heartbeat / tick
  playBombTick() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.035);
    } catch (e) {}
  }

  // Bomb explosion
  playBombExplode() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.65);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.65);
    } catch (e) {}
  }

  playExplosion() {
    this.playBombExplode();
  }

  // Defused bomb / level up fanfare
  playLevelUp() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880, 1108.73]; // A major triumphant fanfare
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.35);
      });
    } catch (e) {}
  }

  playDefused() {
    this.playLevelUp();
  }

  // Achievement unlock sound (Sparkling bells)
  playAchievement() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C major pentatonic bells
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.15, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.45);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.45);
      });
    } catch (e) {}
  }

  // Godlike / Multikill sound (Deep bass boom + triumphant synth)
  playGodlike() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.4);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.8);
    } catch (e) {}
  }

  // English Speech Synthesis
  speak(text) {
    if (!this.voiceEnabled || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  }
}

window.soundEngine = new SoundEngine();


/**
 * Emotional FX & Confetti Particle System
 * Miyani quvontiradigan, zeriktirmaydigan emotsiyalar, combo va konfetti animatsiyalari.
 */

class EmotionalEffectsEngine {
  constructor() {
    this.combo = 0;
    this.successEmojis = ['🔥', '⚡', '👑', '🎉', '🌟', '🚀', '🧠', '✨', '💎', '🎯'];
    this.successPhrases = [
      "DAHOSIZ! 🧠⚡",
      "MIYA YONYAPTI! 🔥",
      "MUKAMMAL NATIJA! 🎯",
      "UNSTOPPABLE! 🚀",
      "SO'ZLARNI YEB QO'YDINGIZ! 👑",
      "AQL BOVAR QILMAS TEZLIK! ⚡",
      "ENG YUQORI DARAJA! 🌟",
      "XOTIRA CHEMPIONI! 💎"
    ];
    this.failPhrases = [
      "Afsus! Lekin bu so'z endi esda qoladi! 💡",
      "Deyarli topgandingiz! 🤏",
      "Fikrni jamlang, keyingisida aniq chiqadi! 🎯",
      "Miya qizimoqda! Qaytadan sinab ko'ring! 🔄"
    ];

    this.createOverlayContainers();
  }

  createOverlayContainers() {
    if (typeof document === 'undefined') return;

    if (!document.getElementById('emotion-reaction-badge')) {
      const badge = document.createElement('div');
      badge.id = 'emotion-reaction-badge';
      badge.className = 'emotion-reaction-badge';
      document.body.appendChild(badge);
    }

    if (!document.getElementById('confetti-canvas')) {
      const canvas = document.createElement('canvas');
      canvas.id = 'confetti-canvas';
      canvas.className = 'confetti-canvas';
      document.body.appendChild(canvas);
    }
  }

  triggerSuccess(points = 50) {
    this.combo++;
    const phrase = this.successPhrases[Math.floor(Math.random() * this.successPhrases.length)];
    const emoji = this.successEmojis[Math.floor(Math.random() * this.successEmojis.length)];
    const comboText = this.combo > 1 ? `⚡ ${this.combo}X COMBO!` : `+${points} Ball`;

    this.showFloatingReaction(`${emoji} ${phrase}`, comboText, 'success');
    this.launchConfetti();
  }

  triggerFail() {
    this.combo = 0;
    const phrase = this.failPhrases[Math.floor(Math.random() * this.failPhrases.length)];
    this.showFloatingReaction(`⚠️ ${phrase}`, "Xato bo'ldi", 'fail');
  }

  showFloatingReaction(mainText, subText = '', type = 'success') {
    const badge = document.getElementById('emotion-reaction-badge');
    if (!badge) return;

    badge.className = `emotion-reaction-badge show ${type}`;
    badge.innerHTML = `
      <div class="reaction-main">${mainText}</div>
      ${subText ? `<div class="reaction-sub">${subText}</div>` : ''}
    `;

    setTimeout(() => {
      badge.classList.remove('show');
    }, 1800);
  }

  triggerComboPill(title, sub = '', type = 'success') {
    this.showFloatingReaction(title, sub, type);
  }

  showToast(message, type = 'info') {
    this.showFloatingReaction(message, '', type);
  }

  burstConfetti() {
    this.launchConfetti();
  }

  triggerConfetti() {
    this.launchConfetti();
  }

  launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width = window.innerWidth;
    const height = canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#d946ef', '#a855f7', '#38bdf8', '#34d399', '#fbbf24', '#f43f5e', '#fff'];

    for (let i = 0; i < 55; i++) {
      particles.push({
        x: width / 2 + (Math.random() - 0.5) * 150,
        y: height / 2 + (Math.random() - 0.5) * 50,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 1.2) * 14,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        alpha: 1,
        gravity: 0.4
      });
    }

    let frames = 0;
    function render() {
      frames++;
      ctx.clearRect(0, 0, width, height);
      let alive = false;

      particles.forEach(p => {
        p.x += p.vx;
        p.vy += p.gravity;
        p.y += p.vy;
        p.rotation += p.vRot;
        p.alpha -= 0.016;

        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      });

      if (alive && frames < 70) {
        requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    }

    requestAnimationFrame(render);
  }

  // Dynamic Screen Shake (Ekran titrashi)
  screenShake(intensity = 'medium') {
    const body = document.body;
    if (!body) return;

    body.classList.remove('shake-light', 'shake-medium', 'shake-hard');
    
    // Force reflow
    void body.offsetWidth;

    const cls = intensity === 'light' ? 'shake-light' : (intensity === 'hard' ? 'shake-hard' : 'shake-medium');
    body.classList.add(cls);

    setTimeout(() => {
      body.classList.remove(cls);
    }, 450);
  }

  // iPhone Style Dynamic Island / Floating Achievement Capsule
  showAchievementToast(badge) {
    if (!badge) return;
    let container = document.getElementById('achievement-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'achievement-toast-container';
      container.className = 'achievement-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'achievement-toast ios-glass-panel';
    toast.innerHTML = `
      <div class="ach-toast-icon">${badge.icon || '🏆'}</div>
      <div class="ach-toast-content">
        <span class="ach-toast-tag">YANGI YUTUQ OCHILDI!</span>
        <h4 class="ach-toast-title">${badge.title}</h4>
        <p class="ach-toast-desc">${badge.desc}</p>
      </div>
      <span class="ach-toast-xp">+${badge.xp || 100} XP</span>
    `;

    container.appendChild(toast);

    if (window.soundEngine) {
      window.soundEngine.playAchievement();
    }
    this.burstConfetti();

    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => {
        if (toast.remove) toast.remove();
        else if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 400);
    }, 4500);
  }
}

// Export both names to guarantee zero undefined reference errors
window.emotionEngine = new EmotionalEffectsEngine();
window.effectsEngine = window.emotionEngine;


/**
 * GAMIFICATION ENGINE - XP, Levels, Badges & Dopamine Multikill Reactions
 * Features:
 * - Dynamic Level progression & XP calculation
 * - Level Up celebrations (fanfare, confetti, dialog)
 * - 10 Unlockable Achievements with iPhone Floating Capsule Notifications
 * - Multikill Combo Streaks (3x, 5x, 10x, 15x) with Screen Shake & Audio
 * - Interactive Profile & Achievements Showcase Modal
 */

class GamificationEngine {
  constructor() {
    this.xp = parseInt(localStorage.getItem('lex_user_xp') || '0');
    this.currentCombo = 0;
    this.maxCombo = parseInt(localStorage.getItem('lex_max_combo') || '0');
    this.unlockedBadges = new Set(JSON.parse(localStorage.getItem('lex_unlocked_badges') || '[]'));
    
    // Stats for tracking achievements
    this.stats = {
      correctAnswers: parseInt(localStorage.getItem('lex_stat_correct') || '0'),
      speedAnswers: parseInt(localStorage.getItem('lex_stat_speed') || '0'),
      wordleWins: parseInt(localStorage.getItem('lex_stat_wordle') || '0'),
      audioWins: parseInt(localStorage.getItem('lex_stat_audio') || '0'),
      mistakesCleared: parseInt(localStorage.getItem('lex_stat_cleared') || '0'),
      flashcardsViewed: parseInt(localStorage.getItem('lex_stat_fc') || '0'),
      marathonsCompleted: parseInt(localStorage.getItem('lex_stat_marathon') || '0')
    };

    this.badgesDefinition = [
      { id: 'FIRST_WIN', title: 'Birinchi G\'alaba', desc: 'Birinchi so\'zni to\'g\'ri topdingiz', icon: '🌱', xp: 50 },
      { id: 'SHARPSHOOTER_5', title: 'Mergant (5x)', desc: 'Ketma-ket 5 ta so\'zni xatosiz topdingiz', icon: '🎯', xp: 100 },
      { id: 'UNSTOPPABLE_10', title: 'To\'xtatib Bo\'lmas (10x)', desc: 'Ketma-ket 10 ta to\'g\'ri javob!', icon: '⚡', xp: 250 },
      { id: 'GODLIKE_15', title: 'Afsonaviy (15x)', desc: '15 ta uzluksiz g\'alaba! GODLIKE!', icon: '👑', xp: 500 },
      { id: 'SPEED_DEMON', title: 'Chaqmoq Tezlik', desc: 'Savolga 3 soniyadan tez javob berdingiz', icon: '⚡', xp: 150 },
      { id: 'WORDLE_GENIUS', title: 'Wordle Ustasi', desc: 'Wordle-ni 3 yoki undan kam urinishda topdingiz', icon: '🟩', xp: 200 },
      { id: 'LISTENING_CHAMP', title: 'Oltin Quloq', desc: 'Audio Detektivda 10 ta so\'z topdingiz', icon: '🎧', xp: 150 },
      { id: 'MISTAKE_SLAYER', title: 'Qasoskor', desc: 'Xatolar sandig\'idagi so\'zni o\'zlashtirdingiz', icon: '⚔️', xp: 150 },
      { id: 'FLASHCARD_FAN', title: 'Zukko Kitobxon', desc: '100 ta flashkardni o\'rganib chiqdingiz', icon: '📚', xp: 200 },
      { id: 'MARATHON_100', title: 'Marafon Qahramoni', desc: '100 talik marafonni muvaffaqiyatli yakunladingiz', icon: '🏆', xp: 400 }
    ];

    this.levelTiers = [
      { level: 1, minXp: 0, maxXp: 200, title: 'Boshlovchi', icon: '🌱' },
      { level: 2, minXp: 200, maxXp: 500, title: 'O\'quvchi', icon: '📖' },
      { level: 3, minXp: 500, maxXp: 1000, title: 'Izlanuvchi', icon: '🔍' },
      { level: 4, minXp: 1000, maxXp: 1800, title: 'So\'z Ovchisi', icon: '🏹' },
      { level: 5, minXp: 1800, maxXp: 3000, title: 'Kolleksioner', icon: '💎' },
      { level: 6, minXp: 3000, maxXp: 4600, title: 'Mutaxassis', icon: '🎓' },
      { level: 7, minXp: 4600, maxXp: 6800, title: 'Lug\'at Ustasi', icon: '🔮' },
      { level: 8, minXp: 6800, maxXp: 9500, title: 'Donishmand', icon: '🌟' },
      { level: 9, minXp: 9500, maxXp: 13000, title: 'Grossmeyster', icon: '⚡' },
      { level: 10, minXp: 13000, maxXp: 999999, title: 'Poliglot Qiroli', icon: '👑' }
    ];

    this.currentLevel = this.calculateLevel(this.xp);
  }

  calculateLevel(xp) {
    for (let i = this.levelTiers.length - 1; i >= 0; i--) {
      if (xp >= this.levelTiers[i].minXp) {
        return this.levelTiers[i];
      }
    }
    return this.levelTiers[0];
  }

  addXP(amount, reason = '') {
    const oldLevel = this.currentLevel.level;
    this.xp += amount;
    localStorage.setItem('lex_user_xp', this.xp);

    this.currentLevel = this.calculateLevel(this.xp);

    // Floating XP pill in top bar or button
    if (window.effectsEngine) {
      window.effectsEngine.showFloatingReaction(`+${amount} XP!`);
    }

    // Check Level Up
    if (this.currentLevel.level > oldLevel) {
      this.triggerLevelUpCelebration(this.currentLevel);
    }

    this.updateUI();
  }

  triggerLevelUpCelebration(lvl) {
    if (window.soundEngine) {
      window.soundEngine.playLevelUp();
    }
    if (window.effectsEngine) {
      window.effectsEngine.burstConfetti();
      window.effectsEngine.screenShake('medium');
    }

    const modal = document.createElement('div');
    modal.className = 'level-up-modal-overlay';
    modal.innerHTML = `
      <div class="level-up-card ios-glass-panel">
        <div class="lvl-up-icon">${lvl.icon}</div>
        <span class="lvl-up-tag">DARAXA OSHDI!</span>
        <h2 class="lvl-up-title">${lvl.level}-DARAJA</h2>
        <h3 class="lvl-up-badge">${lvl.title}</h3>
        <p class="lvl-up-text">Tabriklaymiz! So'z boyligingiz va mahoratingiz yangi bosqichga ko'tarildi!</p>
        <button class="lvl-up-close-btn ios-button" onclick="this.closest('.level-up-modal-overlay').remove()">
          Ajoyib! Davom etish 🚀
        </button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  recordAnswer(isCorrect, details = {}) {
    if (isCorrect) {
      this.currentCombo++;
      if (this.currentCombo > this.maxCombo) {
        this.maxCombo = this.currentCombo;
        localStorage.setItem('lex_max_combo', this.maxCombo);
      }

      this.stats.correctAnswers++;
      localStorage.setItem('lex_stat_correct', this.stats.correctAnswers);

      // Base XP
      const speedBonus = details.timeLeft && details.timeLeft >= 9 ? 15 : 0;
      this.addXP(25 + speedBonus);

      // Check Speed Demon
      if (details.responseTime && details.responseTime <= 3000) {
        this.stats.speedAnswers++;
        localStorage.setItem('lex_stat_speed', this.stats.speedAnswers);
        this.unlockAchievement('SPEED_DEMON');
      }

      // Check first win
      this.unlockAchievement('FIRST_WIN');

      // Multikill Combos & Screen Shake
      if (this.currentCombo === 3) {
        if (window.effectsEngine) window.effectsEngine.showFloatingReaction('🔥 3x COMBO!');
      } else if (this.currentCombo === 5) {
        this.unlockAchievement('SHARPSHOOTER_5');
        if (window.effectsEngine) {
          window.effectsEngine.showFloatingReaction('⚡ 5x UNSTOPPABLE!');
          window.effectsEngine.screenShake('light');
        }
      } else if (this.currentCombo === 10) {
        this.unlockAchievement('UNSTOPPABLE_10');
        if (window.effectsEngine) {
          window.effectsEngine.showFloatingReaction('💥 10x RAMPAGE!');
          window.effectsEngine.screenShake('medium');
        }
      } else if (this.currentCombo === 15) {
        this.unlockAchievement('GODLIKE_15');
        if (window.effectsEngine) {
          window.effectsEngine.showFloatingReaction('👑 15x GODLIKE!');
          window.effectsEngine.screenShake('hard');
          window.effectsEngine.burstConfetti();
        }
        if (window.soundEngine) {
          window.soundEngine.playGodlike();
        }
      }
    } else {
      // Combo reset
      this.currentCombo = 0;
    }

    this.updateComboDisplay();
  }

  unlockAchievement(badgeId) {
    if (this.unlockedBadges.has(badgeId)) return;

    const badge = this.badgesDefinition.find(b => b.id === badgeId);
    if (!badge) return;

    this.unlockedBadges.add(badgeId);
    localStorage.setItem('lex_unlocked_badges', JSON.stringify(Array.from(this.unlockedBadges)));

    this.addXP(badge.xp, `Yutuq: ${badge.title}`);

    if (window.effectsEngine && window.effectsEngine.showAchievementToast) {
      window.effectsEngine.showAchievementToast(badge);
    }
  }

  updateComboDisplay() {
    const comboEl = document.getElementById('stat-active-combo');
    if (comboEl) {
      if (this.currentCombo >= 2) {
        comboEl.style.display = 'inline-flex';
        comboEl.innerHTML = `🔥 ${this.currentCombo}x Kombo`;
      } else {
        comboEl.style.display = 'none';
      }
    }
  }

  updateUI() {
    // Top Bar Level Pill
    const levelPill = document.getElementById('user-level-pill');
    if (levelPill) {
      levelPill.innerHTML = `
        <span class="lvl-icon">${this.currentLevel.icon}</span>
        <span class="lvl-text">Lvl ${this.currentLevel.level} • ${this.currentLevel.title}</span>
      `;
    }

    // Progress Bar
    const xpCurrent = this.xp - this.currentLevel.minXp;
    const xpTarget = this.currentLevel.maxXp - this.currentLevel.minXp;
    const pct = Math.min(100, Math.max(0, Math.floor((xpCurrent / xpTarget) * 100)));

    const progressBar = document.getElementById('user-xp-progress');
    if (progressBar) {
      progressBar.style.width = `${pct}%`;
    }

    const xpText = document.getElementById('user-xp-text');
    if (xpText) {
      xpText.innerText = `${this.xp.toLocaleString()} XP (${pct}%)`;
    }

    // Stats bar score update
    const scoreStat = document.getElementById('stat-total-score');
    if (scoreStat) {
      scoreStat.innerText = `${this.xp.toLocaleString()} XP`;
    }
  }

  openAchievementsModal() {
    const existing = document.getElementById('achievements-modal');
    if (existing) existing.remove();

    const xpCurrent = this.xp - this.currentLevel.minXp;
    const xpTarget = this.currentLevel.maxXp - this.currentLevel.minXp;
    const pct = Math.min(100, Math.max(0, Math.floor((xpCurrent / xpTarget) * 100)));

    const modal = document.createElement('div');
    modal.id = 'achievements-modal';
    modal.className = 'achievements-modal-overlay';
    modal.innerHTML = `
      <div class="achievements-modal-card ios-glass-panel">
        
        <div class="ach-modal-header">
          <div class="ach-profile-summary">
            <div class="ach-avatar">${this.currentLevel.icon}</div>
            <div class="ach-user-details">
              <h3>${this.currentLevel.title}</h3>
              <p>Daraja: <strong>${this.currentLevel.level}</strong> // Jami: <strong>${this.xp.toLocaleString()} XP</strong></p>
              <div class="modal-xp-bar-track">
                <div class="modal-xp-bar-fill" style="width: ${pct}%"></div>
              </div>
              <span class="modal-xp-sub">${xpCurrent} / ${xpTarget} XP keyingi darajagacha</span>
            </div>
          </div>
          <button class="ach-close-btn ios-button" onclick="document.getElementById('achievements-modal').remove()">✕</button>
        </div>

        <div class="ach-vitrina-title">
          <span>🏆 YUTUQLAR VA NISHONLAR (${this.unlockedBadges.size} / ${this.badgesDefinition.length})</span>
        </div>

        <div class="ach-badges-grid">
          ${this.badgesDefinition.map(b => {
            const isUnlocked = this.unlockedBadges.has(b.id);
            return `
              <div class="ach-badge-card ${isUnlocked ? 'unlocked' : 'locked'}">
                <div class="badge-icon-box">${isUnlocked ? b.icon : '🔒'}</div>
                <div class="badge-info">
                  <h4 class="badge-name">${b.title}</h4>
                  <p class="badge-desc">${b.desc}</p>
                  <span class="badge-xp-reward">+${b.xp} XP ${isUnlocked ? '✓ Olingan' : ''}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>

      </div>
    `;

    document.body.appendChild(modal);
    if (window.soundEngine) window.soundEngine.buttonClick();
  }
}

window.gamification = new GamificationEngine();


/**
 * Favorites & Export Engine (Mening Saralanganlarim ⭐ va PDF / Anki Eksport)
 * Foydalanuvchi so'zlarga yulduzcha qo'yib shaxsiy lug'atini shakllantiradi.
 * Bir bosish bilan PDF konspekt chop etish, Anki (.txt/.csv) yuklab olish yoki nusxa olish mumkin.
 */

class FavoritesExportManager {
  constructor() {
    this.storageKey = 'lex_starred_words';
    this.starredSet = new Set(this.loadStarred());
    this.showOnlyStarredInDict = false;
  }

  loadStarred() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  saveStarred() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(Array.from(this.starredSet)));
    } catch (_) {}
  }

  isStarred(word) {
    if (!word) return false;
    return this.starredSet.has(word.toUpperCase().trim());
  }

  toggleStar(word, e) {
    if (e) e.stopPropagation();
    if (!word) return false;
    const clean = word.toUpperCase().trim();
    let isNowStarred = false;

    if (this.starredSet.has(clean)) {
      this.starredSet.delete(clean);
      isNowStarred = false;
      if (window.effectsEngine) window.effectsEngine.showToast(`"${clean}" saralanganlardan olib tashlandi`, 'info');
    } else {
      this.starredSet.add(clean);
      isNowStarred = true;
      if (window.soundEngine && window.soundEngine.playCorrect) window.soundEngine.playCorrect();
      if (window.effectsEngine) window.effectsEngine.showToast(`⭐ "${clean}" saralanganlarga saqlandi!`, 'success');
      if (window.gamification) window.gamification.addXP(10);
    }

    this.saveStarred();
    this.updateUI();

    // Re-render views if active
    if (window.app && window.app.currentTab === 'dictionary') {
      window.app.renderDictionary();
    }
    if (window.flashcards && window.app && window.app.currentTab === 'flashcards') {
      window.flashcards.updateUI();
    }

    return isNowStarred;
  }

  getStarredWords() {
    const list = [];
    const pool = (window.wordBank && window.wordBank.words) || (typeof GLOBAL_WORDS_DATA !== 'undefined' ? GLOBAL_WORDS_DATA : []);
    const foundWords = new Set();

    for (const item of pool) {
      const upper = item.word.toUpperCase().trim();
      if (this.starredSet.has(upper) && !foundWords.has(upper)) {
        foundWords.add(upper);
        list.push(item);
      }
    }
    return list;
  }

  getStarredCount() {
    return this.starredSet.size;
  }

  updateUI() {
    // Update all star count badges in the UI
    const count = this.getStarredCount();
    document.querySelectorAll('.starred-count-badge').forEach(el => {
      el.textContent = count;
    });

    // Update star toggle button in Dictionary view
    const starToggleBtn = document.getElementById('dict-starred-toggle-btn');
    if (starToggleBtn) {
      starToggleBtn.classList.toggle('active', this.showOnlyStarredInDict);
      starToggleBtn.innerHTML = `⭐ Saralanganlar (${count})`;
    }
  }

  toggleDictStarredFilter() {
    this.showOnlyStarredInDict = !this.showOnlyStarredInDict;
    if (window.soundEngine && window.soundEngine.buttonClick) window.soundEngine.buttonClick();
    this.updateUI();
    if (window.app) {
      window.app.renderDictionary();
    }
  }

  // Opens the sleek iOS Export Modal
  openExportModal(source = 'starred') {
    if (window.soundEngine && window.soundEngine.buttonClick) window.soundEngine.buttonClick();

    let words = [];
    let titleText = '';

    if (source === 'starred') {
      words = this.getStarredWords();
      titleText = `⭐ Saralangan So'zlar (${words.length} ta)`;
    } else {
      words = (window.wordBank && window.wordBank.words) ? window.wordBank.words.slice(0, 500) : [];
      titleText = `📖 Lug'at To'plami (${words.length} ta)`;
    }

    // If no starred words, give friendly advice
    if (words.length === 0 && source === 'starred') {
      if (window.effectsEngine) {
        window.effectsEngine.showToast('Hozircha hech qanday so\'z saralanmagan. Lug\'at yoki Flashcardlarda ⭐ tugmasini bosing!', 'info');
      }
      return;
    }

    let modal = document.getElementById('lex-export-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'lex-export-modal';
      modal.className = 'export-modal-backdrop';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="export-modal-panel ios-glass-panel">
        <div class="export-modal-header">
          <div>
            <span class="export-badge">📂 EKSPORT VA CHOP ETISH</span>
            <h3 class="export-title">${titleText}</h3>
          </div>
          <button class="export-close-btn ios-button" onclick="window.favoritesExport.closeExportModal()">✕</button>
        </div>

        <p class="export-description">
          Shaxsiy to'plamingizni o'zingizga qulay formatda saqlab oling yoki chop etish uchun tayyorlang:
        </p>

        <div class="export-options-grid">
          
          <!-- Option 1: PDF Print Sheet -->
          <div class="export-card ios-glass-panel" onclick="window.favoritesExport.exportPDF()">
            <div class="export-card-icon">📄</div>
            <div class="export-card-info">
              <h4>PDF Konspekt (Chop etish)</h4>
              <p>A4 varaqqa chiroyli jadval ko'rinishida chop etish yoki PDF sifatida saqlash.</p>
            </div>
            <span class="export-arrow">➔</span>
          </div>

          <!-- Option 2: Anki Deck (.txt / .csv) -->
          <div class="export-card ios-glass-panel" onclick="window.favoritesExport.exportAnki()">
            <div class="export-card-icon">🗃️</div>
            <div class="export-card-info">
              <h4>Anki To'plami (.TXT / .CSV)</h4>
              <p>Rasmiy Anki mobil va kompyuter ilovasiga to'g'ridan-to'g'ri import qilish formati.</p>
            </div>
            <span class="export-arrow">➔</span>
          </div>

          <!-- Option 3: Copy to Clipboard -->
          <div class="export-card ios-glass-panel" onclick="window.favoritesExport.copyToClipboard()">
            <div class="export-card-icon">📋</div>
            <div class="export-card-info">
              <h4>Nusxa Olish (Clipboard)</h4>
              <p>Telegram, Word yoki matnli eslatmalarga to'liq nusxalab olish.</p>
            </div>
            <span class="export-arrow">➔</span>
          </div>

        </div>

        <div class="export-modal-footer">
          <span>Jami eksport qilinadigan so'zlar: <strong>${words.length} ta</strong></span>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  closeExportModal() {
    const modal = document.getElementById('lex-export-modal');
    if (modal) modal.classList.remove('active');
  }

  // 1. PDF Konspekt (Chop etish)
  exportPDF() {
    this.closeExportModal();
    const words = this.getStarredWords();
    if (words.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Iltimos, brauzeringizda pop-up oynalarga ruxsat bering!');
      return;
    }

    const rowsHtml = words.map((w, idx) => `
      <tr>
        <td style="text-align: center; color: #666; font-weight: bold;">${idx + 1}</td>
        <td style="font-weight: bold; color: #111;">${w.word}</td>
        <td style="color: #666; font-family: monospace;">${w.phonetic || ''}</td>
        <td style="font-weight: 600; color: #4338ca;">${w.translation}</td>
        <td style="color: #444; font-size: 0.9em;"><em>"${w.fullExample || w.sentence || ''}"</em></td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="uz">
      <head>
        <meta charset="UTF-8">
        <title>SHADOW LEXICON // Shaxsiy Lug'at Konspekti</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #111;
            padding: 20px;
            margin: 0;
            background: #fff;
          }
          .header {
            border-bottom: 2px solid #4338ca;
            padding-bottom: 12px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          h1 { margin: 0; font-size: 22px; color: #4338ca; }
          .subtitle { margin: 4px 0 0; font-size: 13px; color: #555; }
          .meta { font-size: 12px; color: #777; text-align: right; }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          th {
            background: #f3f4f6;
            color: #374151;
            font-weight: 700;
            padding: 10px 8px;
            text-align: left;
            border-bottom: 2px solid #e5e7eb;
          }
          td {
            padding: 8px;
            border-bottom: 1px solid #e5e7eb;
            vertical-align: top;
          }
          tr:nth-child(even) {
            background: #fafafa;
          }
          .footer {
            margin-top: 30px;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
            font-size: 11px;
            color: #888;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>SHADOW LEXICON // Shaxsiy Lug'at Konspekti</h1>
            <p class="subtitle">Inglizcha-O'zbekcha Saralangan So'zlar To'plami</p>
          </div>
          <div class="meta">
            <div>Sana: ${new Date().toLocaleDateString('uz-UZ')}</div>
            <div>Jami so'zlar: <strong>${words.length} ta</strong></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 35px; text-align: center;">#</th>
              <th style="width: 140px;">So'z (English)</th>
              <th style="width: 110px;">Talaffuz</th>
              <th style="width: 180px;">O'zbekcha Ma'nosi</th>
              <th>Misol Gap (Context)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          SHADOW LEXICON — 10,000 Words Vocabulary & 3D Interactive Flashcards Platform
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    if (window.effectsEngine) window.effectsEngine.showToast('📄 Chop etish oynasi ochildi (PDF sifatida saqlashingiz mumkin)', 'success');
  }

  // 2. Anki To'plami (.TXT / .CSV formatida eksport)
  exportAnki() {
    this.closeExportModal();
    const words = this.getStarredWords();
    if (words.length === 0) return;

    // Anki format: Front \t Back \t Tags
    const lines = [
      '#separator:tab',
      '#html:true',
      '#tags column:3'
    ];

    for (const w of words) {
      const front = `${w.word} <span style="color:#888;">${w.phonetic || ''}</span>`;
      const back = `<b style="color:#6366f1;font-size:1.1em;">${w.translation}</b><br><span style="color:#555;">${w.definition || ''}</span><br><br><small><i>&quot;${w.fullExample || w.sentence || ''}&quot;</i></small>`;
      const tag = `shadow-lexicon ${w.category || 'general'}`;
      lines.push(`${front}\t${back}\t${tag}`);
    }

    const content = lines.join('\n');
    const blob = new Blob(["\ufeff" + content], { type: 'text/tab-separated-values;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shadow_lexicon_anki_${words.length}_words.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (window.effectsEngine) window.effectsEngine.showToast('🗃️ Anki to\'plami yuklab olindi (.txt)', 'success');
    if (window.soundEngine && window.soundEngine.playLevelUp) window.soundEngine.playLevelUp();
  }

  // 3. Nusxa Olish (Clipboard)
  copyToClipboard() {
    this.closeExportModal();
    const words = this.getStarredWords();
    if (words.length === 0) return;

    let text = `📚 SHADOW LEXICON — SARALANGAN SO'ZLAR (${words.length} ta)\n`;
    text += `Sana: ${new Date().toLocaleDateString('uz-UZ')}\n\n`;

    words.forEach((w, idx) => {
      text += `${idx + 1}. ${w.word} ${w.phonetic || ''} — ${w.translation}\n`;
      if (w.fullExample || w.sentence) {
        text += `   Misol: "${w.fullExample || w.sentence}"\n`;
      }
    });

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (window.effectsEngine) window.effectsEngine.showToast('📋 Barcha so\'zlar nusxalandi!', 'success');
        if (window.soundEngine && window.soundEngine.playCorrect) window.soundEngine.playCorrect();
      }).catch(() => {
        this.fallbackCopy(text);
      });
    } else {
      this.fallbackCopy(text);
    }
  }

  fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    if (window.effectsEngine) window.effectsEngine.showToast('📋 Barcha so\'zlar nusxalandi!', 'success');
  }
}

// Global initialization
if (typeof window !== 'undefined') {
  window.favoritesExport = new FavoritesExportManager();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FavoritesExportManager };
}


/**
 * SHADOW QUEST // Qorong'u Labirint (RPG Sarguzasht Rejimi)
 * 3 ta Bob (Chapter), 15 ta Xona (Chambers), Boss janglari, 3 ta Yurak (HP),
 * Yulduzlar reytingi va qadimiy artefaktlar.
 */

class QuestEngine {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.storageKey = 'lex_quest_progress';
    this.progress = this.loadProgress();

    // Active Room Battle State
    this.activeRoom = null;
    this.currentQuestionIndex = 0;
    this.playerHp = 5;
    this.maxHp = 5;
    this.bossHp = 15;
    this.maxBossHp = 15;
    this.roomDamageTaken = 0;
    this.questions = [];

    this.chapters = this.getChaptersConfig();
  }

  loadProgress() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return {
      unlockedRooms: [1], // Room 1 starts unlocked
      roomStars: {}, // roomId -> 1..3
      relics: [], // ['library_key', 'cyber_chip', 'shadow_crown']
      totalStars: 0
    };
  }

  saveProgress() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.progress));
    } catch (_) {}
  }

  getChaptersConfig() {
    return [
      {
        id: 1,
        title: "I-BOB: QADIMGI KUTUBXONA",
        subtitle: "A1-A2 Boshlang'ich So'zlar Zali",
        icon: "🏛️",
        theme: "amber",
        bossName: "Sfinks Qo'riqchisi",
        relic: { id: "library_key", name: "Kutubxona Kaliti 🗝️", desc: "1-Bobni zabt etganlik nishoni" },
        rooms: [
          { id: 1, name: "Kirish Darvozasi", level: "A1", desc: "Oddiy kundalik so'zlar bilan qulfni oching" },
          { id: 2, name: "So'zlar Bog'i", level: "A1", desc: "Tabiat va his-tuyg'ular zali" },
          { id: 3, name: "Sehrli Qo'lyozmalar", level: "A2", desc: "Qadimgi bitiklardagi sifat va fe'llar" },
          { id: 4, name: "Donishmand Zali", level: "A2", desc: "Mantiqiy iboralar va bog'lovchilar" },
          { id: 5, name: "Sfinks Qo'riqchisi (BOSS)", level: "A1-A2", isBoss: true, desc: "Kutubxona xazinasining bosh himoyachisi" }
        ]
      },
      {
        id: 2,
        title: "II-BOB: KIBER SHAHAR",
        subtitle: "B1-B2 O'rta va Zamonaviy Leksika",
        icon: "🏙️",
        theme: "cyan",
        bossName: "Kiber Neyrotizim AI",
        relic: { id: "cyber_chip", name: "Kiber Chip 💾", desc: "2-Bobni zabt etganlik nishoni" },
        rooms: [
          { id: 6, name: "Neon Ko'chalari", level: "B1", desc: "Texnologiya va zamonaviy muloqot" },
          { id: 7, name: "Ma'lumotlar Markazi", level: "B1", desc: "Biznes va axborot terminlari" },
          { id: 8, name: "Terminal Labirinti", level: "B2", desc: "Murakkabroq fe'llar va sifatlar" },
          { id: 9, name: "Shifr Generator", level: "B2", desc: "Akademik va tahliliy tushunchalar" },
          { id: 10, name: "Kiber Neyrotizim AI (BOSS)", level: "B1-B2", isBoss: true, desc: "Shahar superkompyuterini buzib o'ting" }
        ]
      },
      {
        id: 3,
        title: "III-BOB: QORA QASR",
        subtitle: "C1 Ilg'or va Professional So'zlar",
        icon: "🏰",
        theme: "purple",
        bossName: "Zulmat Lordi",
        relic: { id: "shadow_crown", name: "Zulmat Toji 👑", desc: "Qora Qasrning mutlaq hukmdori" },
        rooms: [
          { id: 11, name: "Zulmat Darvozasi", level: "C1", desc: "Noyob va chuqur adabiy so'zlar" },
          { id: 12, name: "Soyalar Yo'lagi", level: "C1", desc: "Psixologiya va falsafiy tushunchalar" },
          { id: 13, name: "Taxt Zali", level: "C1", desc: "Ijtimoiy-siyosiy va ilmiy leksika" },
          { id: 14, name: "Qora Sehr Xonasi", level: "C1+", desc: "Eng yuqori qiyinlikdagi kontekstlar" },
          { id: 15, name: "Zulmat Lordi (FINAL BOSS)", level: "C1-C2", isBoss: true, desc: "Yakuniy jang: Mutlaq so'z boyligi sinovi" }
        ]
      }
    ];
  }

  init() {
    this.renderMap();
  }

  // Renders the main visual Quest Map
  renderMap() {
    if (!this.container) return;

    let chaptersHtml = '';
    let totalRooms = 15;
    let clearedCount = Object.keys(this.progress.roomStars).length;
    let totalStars = Object.values(this.progress.roomStars).reduce((a, b) => a + b, 0);

    for (const ch of this.chapters) {
      let roomsHtml = '';

      for (const room of ch.rooms) {
        const isUnlocked = this.progress.unlockedRooms.includes(room.id);
        const stars = this.progress.roomStars[room.id] || 0;
        const isCleared = stars > 0;

        let starsHtml = '';
        if (isCleared) {
          starsHtml = `<div class="quest-room-stars">${'⭐'.repeat(stars)}</div>`;
        }

        roomsHtml += `
          <div class="quest-room-node ${room.isBoss ? 'boss-node' : ''} ${isUnlocked ? 'unlocked' : 'locked'} ${isCleared ? 'cleared' : ''}" 
               data-room-id="${room.id}"
               onclick="window.questEngine && window.questEngine.enterRoom(${room.id})">
            
            <div class="room-node-avatar">
              <span class="room-node-icon">${room.isBoss ? '👑' : (isCleared ? '✓' : (isUnlocked ? '⚔️' : '🔒'))}</span>
            </div>

            <div class="room-node-details">
              <div class="room-meta-row">
                <span class="room-level-pill">${room.level}</span>
                <span class="room-capacity-pill">📦 ${room.isBoss ? '15 ta So\'z' : '10 ta So\'z'}</span>
              </div>
              <h4 class="room-title">${room.name}</h4>
              <p class="room-desc">${room.desc}</p>
              ${starsHtml}
            </div>

            <span class="room-action-arrow">${isUnlocked ? '➔' : '🔒'}</span>
          </div>
        `;
      }

      const isChapterUnlocked = ch.rooms.some(r => this.progress.unlockedRooms.includes(r.id));

      chaptersHtml += `
        <div class="quest-chapter-card ios-glass-panel theme-${ch.theme} ${isChapterUnlocked ? 'unlocked' : 'locked'}">
          <div class="chapter-card-header">
            <div class="chapter-badge">${ch.icon} ${ch.title}</div>
            <p class="chapter-sub">${ch.subtitle}</p>
          </div>
          <div class="chapter-rooms-path">
            ${roomsHtml}
          </div>
        </div>
      `;
    }

    // Relics strip
    const relicsHtml = [
      { id: 'library_key', icon: '🗝️', name: 'Kutubxona Kaliti' },
      { id: 'cyber_chip', icon: '💾', name: 'Kiber Chip' },
      { id: 'shadow_crown', icon: '👑', name: 'Zulmat Toji' }
    ].map(rel => {
      const owned = this.progress.relics.includes(rel.id);
      return `
        <div class="quest-relic-slot ${owned ? 'owned' : 'empty'}" title="${rel.name}">
          <span class="relic-icon">${owned ? rel.icon : '❓'}</span>
          <span class="relic-label">${owned ? rel.name : 'Qulflangan'}</span>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="quest-view-wrapper">
        
        <!-- Hero Header -->
        <div class="quest-hero-banner ios-glass-panel">
          <div class="quest-hero-left">
            <span class="quest-tag">⚔️ RPG SARGUZASHT REJIMI</span>
            <h2 class="quest-headline">QORONG'U LABIRINT (SHADOW QUEST)</h2>
            <p class="quest-subtext">
              15 ta sirli xona, 3 ta qudratli Boss va qadimiy yodgorliklar. Har bir xonadan o'tish uchun so'z jumboqlarini hal eting!
            </p>
          </div>

          <div class="quest-stats-cluster">
            <div class="q-stat-card">
              <span class="q-stat-val">${clearedCount} / ${totalRooms}</span>
              <span class="q-stat-lbl">Zabt Etilgan Xonalar</span>
            </div>
            <div class="q-stat-card">
              <span class="q-stat-val">⭐ ${totalStars} / 45</span>
              <span class="q-stat-lbl">Yulduzlar</span>
            </div>
          </div>
        </div>

        <!-- Relics / Artefacts Strip -->
        <div class="quest-relics-strip ios-glass-panel">
          <div class="relics-strip-title">Qadimiy Artefaktlar:</div>
          <div class="relics-items-row">${relicsHtml}</div>
        </div>

        <!-- Chapters Progression Map -->
        <div class="quest-chapters-container">
          ${chaptersHtml}
        </div>

      </div>
    `;
  }

  // Generates 10-15 questions for a given room (Kattaroq hajmli bosqichlar)
  generateQuestionsForRoom(room) {
    const pool = (window.wordBank && window.wordBank.words) || (typeof GLOBAL_WORDS_DATA !== 'undefined' ? GLOBAL_WORDS_DATA : []);
    const shuffled = window.wordBank ? window.wordBank.cryptoShuffle([...pool]) : [...pool];

    const questionCount = room.isBoss ? 15 : 10;
    const questions = [];

    for (let i = 0; i < questionCount && i < shuffled.length; i++) {
      const target = shuffled[i];
      // Generate 3 distractors
      const distractors = [];
      const distPool = window.wordBank ? window.wordBank.cryptoShuffle([...pool]) : [...pool];
      for (const d of distPool) {
        if (d.word !== target.word && !distractors.some(x => x.translation === d.translation)) {
          distractors.push(d);
          if (distractors.length >= 3) break;
        }
      }

      // Mix options
      const options = window.wordBank ? window.wordBank.cryptoShuffle([
        { text: target.translation, correct: true, word: target.word },
        ...distractors.map(d => ({ text: d.translation, correct: false, word: d.word }))
      ]) : [
        { text: target.translation, correct: true, word: target.word },
        ...distractors.map(d => ({ text: d.translation, correct: false, word: d.word }))
      ];

      questions.push({
        targetWord: target.word,
        phonetic: target.phonetic || `/${target.word.toLowerCase()}/`,
        definition: target.definition || 'So\'z ta\'rifi',
        fullExample: target.fullExample || target.sentence || '',
        correctTranslation: target.translation,
        options: options
      });
    }

    return questions;
  }

  // Enters a specific Room / Chamber
  enterRoom(roomId) {
    if (!this.progress.unlockedRooms.includes(roomId)) {
      if (window.effectsEngine) window.effectsEngine.showToast('Bu xona hali qulflangan! Oldingi xonalarni zabt eting 🔒', 'warning');
      if (window.soundEngine && window.soundEngine.playWrong) window.soundEngine.playWrong();
      return;
    }

    let foundRoom = null;
    let foundChapter = null;

    for (const ch of this.chapters) {
      const r = ch.rooms.find(rm => rm.id === roomId);
      if (r) {
        foundRoom = r;
        foundChapter = ch;
        break;
      }
    }

    if (!foundRoom) return;

    this.activeRoom = foundRoom;
    this.activeChapter = foundChapter;
    this.currentQuestionIndex = 0;
    this.playerHp = 5;
    this.maxHp = 5;
    this.roomDamageTaken = 0;
    this.bossHp = foundRoom.isBoss ? 15 : 10;
    this.maxBossHp = foundRoom.isBoss ? 15 : 10;
    this.questions = this.generateQuestionsForRoom(foundRoom);

    if (window.soundEngine && window.soundEngine.buttonClick) window.soundEngine.buttonClick();
    this.renderChamberBattle();
  }

  // Renders the battle inside the chamber
  renderChamberBattle() {
    if (!this.container || !this.activeRoom) return;

    const q = this.questions[this.currentQuestionIndex];
    if (!q) {
      this.handleRoomVictory();
      return;
    }

    const heartsHtml = '❤️'.repeat(this.playerHp) + '🖤'.repeat(this.maxHp - this.playerHp);
    const progressPercent = Math.round((this.currentQuestionIndex / this.questions.length) * 100);

    let bossBarHtml = '';
    if (this.activeRoom.isBoss) {
      const bossPercent = Math.round((this.bossHp / this.maxBossHp) * 100);
      bossBarHtml = `
        <div class="boss-health-container">
          <div class="boss-name-row">
            <span class="boss-tag">👑 BOSS: ${this.activeChapter.bossName}</span>
            <span class="boss-hp-val">${this.bossHp} / ${this.maxBossHp} HP</span>
          </div>
          <div class="boss-hp-bar-bg">
            <div class="boss-hp-bar-fill" style="width: ${bossPercent}%;"></div>
          </div>
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="chamber-arena-wrapper ios-glass-panel">
        
        <!-- Top HUD -->
        <div class="chamber-hud">
          <button class="chamber-exit-btn ios-button" onclick="window.questEngine.renderMap()">
            ✕ Xaritaga qaytish
          </button>
          
          <div class="chamber-title-box">
            <span class="chamber-level-tag">${this.activeRoom.level}</span>
            <h3 class="chamber-name">${this.activeRoom.name}</h3>
          </div>

          <div class="chamber-hearts-box">
            <span class="hearts-label">HP:</span>
            <span class="hearts-icons">${heartsHtml}</span>
          </div>
        </div>

        ${bossBarHtml}

        <!-- Progress Indicator -->
        <div class="chamber-question-prog">
          <span>Topshiriq: <strong>${this.currentQuestionIndex + 1} / ${this.questions.length}</strong></span>
          <div class="chamber-prog-track">
            <div class="chamber-prog-fill" style="width: ${progressPercent}%;"></div>
          </div>
        </div>

        <!-- Chamber Question Card -->
        <div class="chamber-card ios-glass-panel">
          <div class="chamber-question-prompt">
            Eshikdagi qadimgi runa so'zining to'g'ri o'zbekcha tarjimasini tanlang:
          </div>

          <div class="chamber-target-word-box">
            <h2 class="chamber-target-word">${q.targetWord}</h2>
            <span class="chamber-phonetic">${q.phonetic}</span>
            <button class="chamber-audio-btn ios-button" onclick="window.soundEngine && window.soundEngine.speak('${q.targetWord.replace(/'/g, "\\'")}')">
              🔊 Tinglash
            </button>
          </div>

          ${q.fullExample ? `<div class="chamber-context-hint"><em>"${q.fullExample}"</em></div>` : ''}

          <!-- Options Grid -->
          <div class="chamber-options-grid" id="chamber-options-grid">
            ${q.options.map((opt, idx) => `
              <button class="chamber-opt-btn ios-button" onclick="window.questEngine.handleAnswer(${idx})">
                <span class="opt-num">${idx + 1}</span>
                <span class="opt-text">${opt.text}</span>
              </button>
            `).join('')}
          </div>
        </div>

      </div>
    `;

    // Speak word automatically
    if (window.soundEngine && window.soundEngine.speak) {
      setTimeout(() => window.soundEngine.speak(q.targetWord), 200);
    }
  }

  handleAnswer(optIndex, delayMs = 700) {
    const q = this.questions[this.currentQuestionIndex];
    if (!q) return;

    const selectedOpt = q.options[optIndex];
    const buttons = document.querySelectorAll('.chamber-opt-btn');
    buttons.forEach(b => b.disabled = true);

    const proceed = () => {
      this.currentQuestionIndex++;
      if (this.currentQuestionIndex >= this.questions.length) {
        this.handleRoomVictory();
      } else {
        this.renderChamberBattle();
      }
    };

    if (selectedOpt.correct) {
      // SUCCESS!
      buttons[optIndex]?.classList.add('correct');
      if (window.soundEngine && window.soundEngine.playCorrect) window.soundEngine.playCorrect();
      if (window.effectsEngine) window.effectsEngine.triggerComboPill('ZARBA BERILDI! ⚔️', '+40 XP');
      if (window.gamification) window.gamification.addXP(40);

      if (this.activeRoom.isBoss) {
        this.bossHp--;
      }

      if (delayMs <= 0) proceed();
      else setTimeout(proceed, delayMs);

    } else {
      // WRONG! Damage taken
      buttons[optIndex]?.classList.add('wrong');
      const correctIdx = q.options.findIndex(o => o.correct);
      if (correctIdx !== -1) buttons[correctIdx]?.classList.add('correct');

      this.playerHp--;
      this.roomDamageTaken++;

      if (window.soundEngine && window.soundEngine.playWrong) window.soundEngine.playWrong();
      if (window.effectsEngine) {
        window.effectsEngine.triggerFail();
        window.effectsEngine.triggerComboPill('QALQON SINDIRILDI! 💔', '-1 HP', 'error');
      }

      // Add to mistakes bank for later review
      if (window.app && window.app.addMistakeWord) {
        window.app.addMistakeWord({ word: q.targetWord, translation: q.correctTranslation });
      }

      const proceedWrong = () => {
        if (this.playerHp <= 0) {
          this.handleGameOver();
        } else {
          this.currentQuestionIndex++;
          if (this.currentQuestionIndex >= this.questions.length) {
            this.handleRoomVictory();
          } else {
            this.renderChamberBattle();
          }
        }
      };

      if (delayMs <= 0) proceedWrong();
      else setTimeout(proceedWrong, delayMs);
    }
  }

  handleRoomVictory() {
    // Calculate stars: 3 if <= 1 damage, 2 if <= 3 damage, 1 if survived
    let stars = 3;
    if (this.roomDamageTaken >= 1 && this.roomDamageTaken <= 2) stars = 2;
    else if (this.roomDamageTaken >= 3) stars = 1;

    // Record star if better than previous
    const prevStars = this.progress.roomStars[this.activeRoom.id] || 0;
    if (stars > prevStars) {
      this.progress.roomStars[this.activeRoom.id] = stars;
    }

    // Unlock next room
    const nextRoomId = this.activeRoom.id + 1;
    if (nextRoomId <= 15 && !this.progress.unlockedRooms.includes(nextRoomId)) {
      this.progress.unlockedRooms.push(nextRoomId);
    }

    // Check if Boss Room defeated -> award chapter relic
    let relicAwarded = null;
    if (this.activeRoom.isBoss && this.activeChapter.relic) {
      const relId = this.activeChapter.relic.id;
      if (!this.progress.relics.includes(relId)) {
        this.progress.relics.push(relId);
        relicAwarded = this.activeChapter.relic;
      }
    }

    this.saveProgress();

    const xpEarned = this.activeRoom.isBoss ? 400 : 120;
    if (window.gamification) window.gamification.addXP(xpEarned);
    if (window.soundEngine && window.soundEngine.playLevelUp) window.soundEngine.playLevelUp();
    if (window.effectsEngine) window.effectsEngine.triggerConfetti();

    this.container.innerHTML = `
      <div class="chamber-arena-wrapper ios-glass-panel">
        <div class="quest-victory-card">
          <div class="victory-header-badge">${this.activeRoom.isBoss ? '👑 BOSS MAG\'LUB ETILDI!' : '🏆 XONA ZABT ETILDI!'}</div>
          <h2>${this.activeRoom.name}</h2>
          
          <div class="victory-stars-row">
            ${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}
          </div>

          <p class="victory-text">
            Siz ushbu xonadagi so'z sinovlaridan muvaffaqiyatli o'tib, keyingi darvoza kalitini qo'lga kiritdingiz!
          </p>

          ${relicAwarded ? `
            <div class="victory-relic-card ios-glass-panel">
              <span class="relic-drop-badge">YANGI ARTEFAKT QO'LGA KIRITILDI!</span>
              <div class="relic-drop-title">${relicAwarded.name}</div>
              <p class="relic-drop-desc">${relicAwarded.desc}</p>
            </div>
          ` : ''}

          <div class="victory-xp-tag">+${xpEarned} XP qo'shildi!</div>

          <div class="victory-actions">
            <button class="victory-btn ios-button" onclick="window.questEngine.renderMap()">
              🗺️ Xaritaga Qaytish
            </button>
            ${nextRoomId <= 15 ? `
              <button class="victory-btn primary ios-button" onclick="window.questEngine.enterRoom(${nextRoomId})">
                Keyingi Xona ➔
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  handleGameOver() {
    if (window.soundEngine && window.soundEngine.playWrong) window.soundEngine.playWrong();
    if (window.effectsEngine) window.effectsEngine.triggerFail();

    this.container.innerHTML = `
      <div class="chamber-arena-wrapper ios-glass-panel">
        <div class="quest-defeat-card">
          <div class="defeat-icon">💀</div>
          <h2>Barcha Yuraklar Tugadi!</h2>
          <p>
            Zulmat kuchlari kuchlilik qildi. Ammo taslim bo'lmang — so'zlarni qayta ko'rib chiqib, revansh oling!
          </p>
          <div class="defeat-actions">
            <button class="defeat-btn ios-button" onclick="window.questEngine.renderMap()">
              🗺️ Xaritaga Qaytish
            </button>
            <button class="defeat-btn retry ios-button" onclick="window.questEngine.enterRoom(${this.activeRoom.id})">
              🔄 Qayta Urinish
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

// Global initialization
if (typeof window !== 'undefined') {
  window.questEngine = new QuestEngine('quest-view-container');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QuestEngine };
}


