/**
 * Main Application Controller (iPhone & Mobile Edition)
 * Handles Navigation, 2 Primary Structures (1: So'z O'yinlari, 2: Flashcards),
 * Atmospheric Canvas Smoke FX, Statistics, and Game Launching.
 */

class App {
  constructor() {
    this.currentTab = 'home';
    this.selectedCategory = 'all';
    this.currentGameType = 'pixel';
    this.activeGameInstance = null;
    this.stats = {
      score: parseInt(localStorage.getItem('lex_score') || '0'),
      wordsLearned: parseInt(localStorage.getItem('lex_words') || '1000'),
      streak: parseInt(localStorage.getItem('lex_streak') || '1')
    };

    this.init();
  }

  init() {
    this.initSmokeCanvas();
    this.renderCategoryChips();
    this.bindNavigation();
    this.bindMarathonSelectors();
    this.updateStatsDisplay();
    this.bindGlobalAudioToggle();
    this.initDictionarySearch();
    this.updateMistakesBadge();
    if (window.gamification) {
      window.gamification.updateUI();
    }

    // Flashcards init
    if (window.flashcards) {
      window.flashcards.init();
    }

    this.registerPWA();
    this.checkIosInstallTip();
  }

  registerPWA() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
          console.log('✓ PWA Service Worker ready, scope:', reg.scope);
        }).catch(err => {
          console.log('PWA Service Worker registration skipped:', err.message);
        });
      });
    }
  }

  checkIosInstallTip() {
    // Only show on iOS Safari if not already launched in standalone mode
    const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    const dismissed = localStorage.getItem('lex_pwa_tip_dismissed');

    if (isIos && !isStandalone && !dismissed) {
      setTimeout(() => {
        const tipEl = document.createElement('div');
        tipEl.className = 'ios-install-banner ios-glass-panel';
        tipEl.innerHTML = `
          <div class="ios-install-content">
            <span class="ios-share-icon">📲</span>
            <div class="ios-install-text">
              <strong>Ilovani o'rnatish (iPhone):</strong>
              <p>Pastdagi <strong>Ulashish (Share ⎋)</strong> tugmasini bosib, <strong>"Bosh ekranga qo'shish" (Add to Home Screen ➕)</strong> ni tanlang!</p>
            </div>
          </div>
          <button class="ios-install-close-btn" onclick="this.closest('.ios-install-banner').remove(); localStorage.setItem('lex_pwa_tip_dismissed', '1')">✕</button>
        `;
        document.body.appendChild(tipEl);
      }, 3500);
    }
  }

  bindMarathonSelectors() {
    const allButtons = document.querySelectorAll('.marathon-pill-btn');
    const currentRounds = window.wordBank ? window.wordBank.getRoundsCount() : 30;

    allButtons.forEach(btn => {
      const count = parseInt(btn.getAttribute('data-rounds'));
      if (count === currentRounds) btn.classList.add('active');
      else btn.classList.remove('active');

      btn.addEventListener('click', () => {
        allButtons.forEach(b => {
          if (parseInt(b.getAttribute('data-rounds')) === count) b.classList.add('active');
          else b.classList.remove('active');
        });
        if (window.wordBank) window.wordBank.setRoundsCount(count);
        if (window.soundEngine) window.soundEngine.buttonClick();
        if (window.effectsEngine) window.effectsEngine.triggerComboPill(`⚡ ${count} TALIK MARAFON!`);

        // If a game is currently active, restart it with new marathon count
        if (this.currentTab === 'games' && this.currentGameType) {
          this.launchGame(this.currentGameType);
        }
      });
    });
  }

  // Neon binafsha tutun va zarrachalar Canvas simulyatsiyasi
  initSmokeCanvas() {
    const canvas = document.getElementById('smoke-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const count = window.innerWidth < 768 ? 20 : 40;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 80 + 40,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.25 - 0.1,
        alpha: Math.random() * 0.2 + 0.05,
        hue: Math.random() > 0.5 ? 275 : 295
      });
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -p.radius) p.x = width + p.radius;
        if (p.x > width + p.radius) p.x = -p.radius;
        if (p.y < -p.radius) p.y = height + p.radius;
        if (p.y > height + p.radius) p.y = -p.radius;

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        grad.addColorStop(0, `hsla(${p.hue}, 85%, 55%, ${p.alpha})`);
        grad.addColorStop(0.6, `hsla(${p.hue}, 70%, 35%, ${p.alpha * 0.4})`);
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    }

    animate();
  }

  renderCategoryChips() {
    const container = document.getElementById('category-chips');
    if (!container) return;

    container.innerHTML = CATEGORIES.map(cat => `
      <button class="cat-chip ios-button ${cat.id === this.selectedCategory ? 'active' : ''}" data-cat="${cat.id}">
        <span class="cat-icon">${cat.icon}</span>
        <span class="cat-name">${cat.name}</span>
        <span class="cat-count">${cat.count}</span>
      </button>
    `).join('');

    container.querySelectorAll('.cat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        container.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.selectedCategory = chip.getAttribute('data-cat');
        if (window.soundEngine) window.soundEngine.buttonClick();
        this.updateSelectedCategoryTitle();

        // If game is active, restart with this category
        if (this.currentTab === 'games' && this.currentGameType) {
          this.launchGame(this.currentGameType);
        }
      });
    });
  }

  updateSelectedCategoryTitle() {
    const titleEl = document.getElementById('active-cat-name');
    const cat = CATEGORIES.find(c => c.id === this.selectedCategory);
    if (titleEl && cat) {
      titleEl.innerText = `${cat.icon} ${cat.name}`;
    }
  }

  bindNavigation() {
    // Mode kartalari (Landing pagedagi o'yin kartalari)
    const modeCards = document.querySelectorAll('.mode-card-interactive');
    modeCards.forEach(card => {
      card.addEventListener('click', () => {
        const gameType = card.getAttribute('data-game');
        this.switchTab('games', gameType);
      });
    });

    // Desktop menyu tugmalari
    const navButtons = document.querySelectorAll('[data-nav-target]');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-nav-target');
        this.switchTab(target);
      });
    });
  }

  switchTab(tabName, subGame = null) {
    // Shortcut mapping if passed a game name directly
    const gameKeys = ['pixel', 'cipher', 'blitz', 'bomb', 'sentence', 'wordle', 'audio', 'wordsearch', 'mistakes'];
    if (gameKeys.includes(tabName)) {
      subGame = tabName;
      tabName = 'games';
    }

    this.currentTab = tabName;

    // Desktop nav highlight
    const desktopBtns = document.querySelectorAll('[data-nav-target]');
    desktopBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-nav-target') === tabName);
    });

    // Mobile Bottom Tab Bar Highlight (0: home, 1: games, 2: quest, 3: flashcards, 4: dictionary)
    const tabMap = { 'home': 0, 'games': 1, 'quest': 2, 'flashcards': 3, 'dictionary': 4 };
    const tabItems = document.querySelectorAll('.tabbar-item');
    tabItems.forEach((item, idx) => {
      item.classList.toggle('active', idx === tabMap[tabName]);
    });

    // Barcha tab viewlarni yashirish
    document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active-view'));

    if (tabName === 'home') {
      document.getElementById('home-view')?.classList.add('active-view');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tabName === 'quest') {
      document.getElementById('quest-view')?.classList.add('active-view');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (window.questEngine) {
        window.questEngine.init();
      }
    } else if (tabName === 'flashcards') {
      document.getElementById('flashcards-view')?.classList.add('active-view');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (window.flashcards) {
        window.flashcards.updateUI();
      }
    } else if (tabName === 'dictionary') {
      document.getElementById('dictionary-view')?.classList.add('active-view');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.renderDictionary();
    } else if (tabName === 'games') {
      document.getElementById('games-view')?.classList.add('active-view');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const targetGame = subGame || this.currentGameType || 'pixel';
      this.launchGame(targetGame);
    }

    if (window.soundEngine) window.soundEngine.buttonClick();
  }

  launchGame(gameType) {
    this.currentGameType = gameType;

    // Destroy previous game instance cleanly
    if (this.activeGameInstance && this.activeGameInstance.destroy) {
      this.activeGameInstance.destroy();
    }

    // Update Subnav active button
    const subnavBtns = document.querySelectorAll('.game-subnav-btn');
    const gameSubnavMap = {
      'pixel': 0, 'cipher': 1, 'blitz': 2, 'bomb': 3, 'sentence': 4,
      'wordle': 5, 'audio': 6, 'wordsearch': 7, 'mistakes': 8
    };
    subnavBtns.forEach((btn, idx) => {
      btn.classList.toggle('active', idx === gameSubnavMap[gameType]);
    });

    // Update Game Titles
    const titleEl = document.getElementById('current-game-title');
    const badgeEl = document.getElementById('current-game-badge');
    const gameNames = {
      'pixel': { title: 'PIKSEL DETEKTIV', badge: '🔍 VIZUAL XOTIRA' },
      'cipher': { title: 'MATN SHIFRI', badge: '🧩 KONTEKST VA SINONIM' },
      'blitz': { title: 'JUFTLIK BLITZ', badge: '⚡ SPEED MATCH & VANISH' },
      'bomb': { title: 'SPELLING BOMB', badge: '💣 IMLO VA VAQT POYGASI' },
      'sentence': { title: 'GAP KONSTRUKTORI', badge: '🏗️ SENTENCE ARCHITECT' },
      'wordle': { title: 'LUG\'AT WORDLE', badge: '🟩 5 HARFLI KUNLIK SIR' },
      'audio': { title: 'AUDIO DETEKTIV', badge: '🎧 TINGLAB TOPISH' },
      'wordsearch': { title: 'WORD SEARCH MATRIX', badge: '🧩 10x10 SO\'Z QIDIRISH TO\'RI' },
      'mistakes': { title: 'XATOLAR SANDIG\'I', badge: '⚔️ ADASHILGAN SO\'ZLAR REVANCHI' }
    };

    if (titleEl && gameNames[gameType]) titleEl.innerText = gameNames[gameType].title;
    if (badgeEl && gameNames[gameType]) badgeEl.innerText = gameNames[gameType].badge;

    const containerId = 'active-game-container';
    const onScore = (addedScore, details = {}) => {
      this.stats.score += (addedScore || 20);
      this.stats.wordsLearned += 1;
      this.saveStats();
      if (window.gamification) {
        window.gamification.recordAnswer(true, details);
      }
    };

    switch (gameType) {
      case 'pixel':
        this.activeGameInstance = new window.PixelDetectiveGame(containerId, onScore);
        this.activeGameInstance.start(this.selectedCategory);
        break;
      case 'cipher':
        this.activeGameInstance = new window.TextCipherGame(containerId, onScore);
        this.activeGameInstance.start(this.selectedCategory);
        break;
      case 'blitz':
        this.activeGameInstance = new window.PairBlitzGame(containerId, onScore);
        this.activeGameInstance.start(this.selectedCategory);
        break;
      case 'bomb':
        this.activeGameInstance = new window.SpellingBombGame(containerId, onScore);
        this.activeGameInstance.start(this.selectedCategory);
        break;
      case 'sentence':
        this.activeGameInstance = new window.SentenceBuilderGame(containerId, onScore);
        this.activeGameInstance.start(this.selectedCategory);
        break;
      case 'wordle':
        this.activeGameInstance = new window.WordleGame(containerId, onScore);
        window.activeWordleGame = this.activeGameInstance;
        this.activeGameInstance.start(this.selectedCategory);
        break;
      case 'audio':
        this.activeGameInstance = new window.AudioDetectiveGame(containerId, onScore);
        window.activeAudioDetective = this.activeGameInstance;
        this.activeGameInstance.start(this.selectedCategory);
        break;
      case 'wordsearch':
        this.activeGameInstance = new window.WordSearchGame(containerId, onScore);
        window.activeWordSearch = this.activeGameInstance;
        this.activeGameInstance.start(this.selectedCategory);
        break;
      case 'mistakes':
        this.activeGameInstance = new window.MistakeArenaGame(containerId, onScore);
        window.activeMistakeGame = this.activeGameInstance;
        this.activeGameInstance.start();
        break;
      default:
        this.launchGame('pixel');
        break;
    }
  }

  // Xatolar Sandig'i Boshqaruvi
  addMistakeWord(wordObj) {
    if (!wordObj || !wordObj.word) return;
    try {
      let bank = JSON.parse(localStorage.getItem('lex_mistakes_bank') || '[]');
      if (!bank.some(item => item.word.toUpperCase() === wordObj.word.toUpperCase())) {
        bank.push({
          id: wordObj.id || Math.floor(Math.random() * 999999),
          word: wordObj.word.toUpperCase(),
          translation: wordObj.translation || wordObj.uz || wordObj.definition || '',
          definition: wordObj.definition || wordObj.translation || '',
          fullExample: wordObj.fullExample || wordObj.sentence || wordObj.example || '',
          sentence: wordObj.sentence || '',
          phonetic: wordObj.phonetic || `/${wordObj.word.toLowerCase()}/`,
          category: wordObj.category || 'daily',
          level: wordObj.level || 'B1',
          timestamp: Date.now()
        });
        localStorage.setItem('lex_mistakes_bank', JSON.stringify(bank));
        this.updateMistakesBadge();
      }
    } catch (e) {}
  }

  getMistakesCount() {
    try {
      const bank = JSON.parse(localStorage.getItem('lex_mistakes_bank') || '[]');
      return Array.isArray(bank) ? bank.length : 0;
    } catch (e) {
      return 0;
    }
  }

  updateMistakesBadge() {
    const count = this.getMistakesCount();
    const badge = document.getElementById('subnav-mistakes-badge');
    if (badge) {
      badge.innerText = count;
      badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
    const homeCount = document.getElementById('stat-mistakes-count');
    if (homeCount) {
      homeCount.innerText = count;
    }
  }

  saveStats() {
    localStorage.setItem('lex_score', this.stats.score);
    localStorage.setItem('lex_words', this.stats.wordsLearned);
    localStorage.setItem('lex_streak', this.stats.streak);
    this.updateStatsDisplay();
  }

  updateStatsDisplay() {
    const scoreEl = document.getElementById('stat-total-score');
    const wordsEl = document.getElementById('stat-words-learned');
    const streakEl = document.getElementById('stat-day-streak');

    if (scoreEl) scoreEl.innerText = this.stats.score.toLocaleString();
    if (wordsEl) wordsEl.innerText = this.stats.wordsLearned.toLocaleString();
    if (streakEl) streakEl.innerText = `${this.stats.streak} kun`;
  }

  bindGlobalAudioToggle() {
    const audioBtn = document.getElementById('audio-toggle-btn');
    if (!audioBtn) return;

    audioBtn.addEventListener('click', () => {
      const isEnabled = window.soundEngine ? window.soundEngine.toggleSound() : true;
      audioBtn.innerHTML = isEnabled ? '🔊 SFX ON' : '🔇 SFX OFF';
      audioBtn.classList.toggle('muted', !isEnabled);
    });
  }

  initDictionarySearch() {
    this.dictLimit = 60;
    this.activeLetter = 'ALL';
    this.currentSearchQuery = '';

    const searchInput = document.getElementById('dict-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.currentSearchQuery = e.target.value;
        this.dictLimit = 60;
        this.renderDictionary();
      });
    }

    this.renderAlphabetBar();
  }

  renderAlphabetBar() {
    const bar = document.getElementById('dict-alphabet-bar');
    if (!bar) return;

    const letters = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];
    bar.innerHTML = letters.map(char => `
      <button class="alpha-letter-btn ${this.activeLetter === char ? 'active' : ''}" onclick="window.app.filterByLetter('${char}')">
        ${char}
      </button>
    `).join('');
  }

  filterByLetter(letter) {
    this.activeLetter = letter;
    this.dictLimit = 60;
    this.renderAlphabetBar();
    this.renderDictionary();
    if (window.soundEngine) window.soundEngine.buttonClick();
  }

  loadMoreDictionary() {
    this.dictLimit += 60;
    this.renderDictionary();
    if (window.soundEngine) window.soundEngine.buttonClick();
  }

  renderDictionary() {
    const grid = document.getElementById('dictionary-grid');
    if (!grid || !window.wordBank) return;

    let list = window.wordBank.words;

    // Filter by category
    if (this.selectedCategory !== 'all') {
      list = list.filter(w => w.category === this.selectedCategory);
    }

    // Filter by Letter (A-Z)
    if (this.activeLetter && this.activeLetter !== 'ALL') {
      list = list.filter(w => w.word.toUpperCase().startsWith(this.activeLetter));
    }

    // Filter by search query
    if (this.currentSearchQuery) {
      const q = this.currentSearchQuery.toLowerCase().trim();
      list = list.filter(w => w.word.toLowerCase().includes(q) || w.translation.toLowerCase().includes(q));
    }

    // Filter by Starred/Favorites if enabled
    if (window.favoritesExport && window.favoritesExport.showOnlyStarredInDict) {
      list = list.filter(w => window.favoritesExport.isStarred(w.word));
    }

    // Update stats summary
    const statsEl = document.getElementById('dict-stats-summary');
    if (statsEl) {
      const modeNote = (window.favoritesExport && window.favoritesExport.showOnlyStarredInDict) ? ' (Faqat Saralanganlar ⭐)' : ` (Alifbo bo'yicha: ${this.activeLetter})`;
      statsEl.innerText = `Jami topildi: ${list.length.toLocaleString()} ta so'z${modeNote}`;
    }

    // Update Load More button visibility
    const loadMoreWrap = document.getElementById('dict-load-more-wrap');
    if (loadMoreWrap) {
      loadMoreWrap.style.display = list.length > this.dictLimit ? 'flex' : 'none';
    }

    const previewList = list.slice(0, this.dictLimit);
    grid.innerHTML = previewList.map(w => {
      const isStarred = window.favoritesExport && window.favoritesExport.isStarred(w.word);
      const safeWord = w.word.replace(/'/g, "\\'");
      return `
        <div class="dict-card">
          <div class="dict-card-top">
            <span class="dict-level">${w.level || 'B1'}</span>
            <div style="display: flex; gap: 0.4rem; align-items: center;">
              <button class="dict-star-btn ios-button ${isStarred ? 'starred' : ''}" onclick="window.favoritesExport.toggleStar('${safeWord}', event)" title="Saralash">⭐</button>
              <button class="dict-speak-btn ios-button" onclick="window.soundEngine.speak('${safeWord}')" title="Tinglash">🔊</button>
            </div>
          </div>
          <h4 class="dict-en-word">${w.word}</h4>
          <span class="dict-phonetic">${w.phonetic || ''}</span>
          <p class="dict-uz-trans">${w.translation}</p>
          <p class="dict-sentence">"${w.fullExample || w.sentence}"</p>
        </div>
      `;
    }).join('');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
