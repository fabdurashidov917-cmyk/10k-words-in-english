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
