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
    this.sessionStartTime = Date.now();
    this.sessionWordsLearned = 0;
    this.sessionCorrect = 0;
    this.sessionTotal = 0;
    this.sessionXp = 0;
    this.stats = {
      score: parseInt(localStorage.getItem('lex_score') || '0'),
      wordsLearned: parseInt(localStorage.getItem('lex_words') || '1000'),
      streak: parseInt(localStorage.getItem('lex_streak') || '1')
    };

    this.init();
  }

  init() {
    this.initThemes();
    this.initSmokeCanvas();
    this.renderCategoryChips();
    this.bindNavigation();
    this.bindMarathonSelectors();
    this.updateStatsDisplay();
    this.bindGlobalAudioToggle();
    this.initDictionarySearch();
    this.updateMistakesBadge();
    this.initDailyActivityTracker();
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

    // Mobile Bottom Tab Bar Highlight (0: home, 1: games, 2: destination, 3: shadowing, 4: quest, 5: flashcards, 6: dictionary)
    const tabMap = { 'home': 0, 'games': 1, 'destination': 2, 'shadowing': 3, 'quest': 4, 'flashcards': 5, 'dictionary': 6 };
    const tabItems = document.querySelectorAll('.tabbar-item');
    tabItems.forEach((item, idx) => {
      item.classList.toggle('active', idx === tabMap[tabName]);
    });

    // Barcha tab viewlarni yashirish
    document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active-view'));

    if (tabName === 'home') {
      document.getElementById('home-view')?.classList.add('active-view');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tabName === 'destination') {
      document.getElementById('destination-view')?.classList.add('active-view');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (window.destinationB2Quiz) {
        window.destinationB2Quiz.loadQuestions();
      }
    } else if (tabName === 'shadowing') {
      document.getElementById('shadowing-view')?.classList.add('active-view');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (window.shadowingStudio) {
        window.shadowingStudio.loadQuotes();
      }
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
      'wordle': 5, 'audio': 6, 'wordsearch': 7, 'mistakes': 8,
      'contextfill': 9, 'dictation': 10, 'rootquiz': 11
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
      'mistakes': { title: 'XATOLAR SANDIG\'I', badge: '⚔️ ADASHILGAN SO\'ZLAR REVANCHI' },
      'contextfill': { title: 'CONTEXT FILL', badge: '🎬 KRIPTO-GAPLAR & IQTIBOSLAR' },
      'dictation': { title: 'DICTATION STUDIO', badge: '🎧 ESHITIB YOZISH' },
      'rootquiz': { title: 'ROOT QUIZ', badge: '🌿 ILDIZDOSH VARIANTLAR' }
    };

    if (titleEl && gameNames[gameType]) titleEl.innerText = gameNames[gameType].title;
    if (badgeEl && gameNames[gameType]) badgeEl.innerText = gameNames[gameType].badge;

    const containerId = 'active-game-container';
    const onScore = (addedScore, details = {}) => {
      this.stats.score += (addedScore || 20);
      this.stats.wordsLearned += 1;
      this.sessionWordsLearned += 1;
      this.sessionCorrect += 1;
      this.sessionTotal += 1;
      this.sessionXp += (addedScore || 20);
      this.recordDailyWord(1);
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
      case 'contextfill':
        this.activeGameInstance = new window.ContextFillGame(containerId, onScore);
        window.activeContextGame = this.activeGameInstance;
        this.activeGameInstance.start(this.selectedCategory);
        break;
      case 'dictation':
        this.activeGameInstance = new window.DictationGame(containerId, onScore);
        window.activeDictationGame = this.activeGameInstance;
        this.activeGameInstance.start(this.selectedCategory);
        break;
      case 'rootquiz':
        this.activeGameInstance = new window.RootQuizGame(containerId, onScore);
        window.activeRootGame = this.activeGameInstance;
        this.activeGameInstance.start(this.selectedCategory);
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
    const desktopBtn = document.getElementById('audio-toggle-btn');
    const mobileBtn = document.getElementById('mobile-audio-btn');

    if (desktopBtn) {
      desktopBtn.addEventListener('click', () => this.toggleGlobalAudio());
    }
    if (mobileBtn) {
      mobileBtn.addEventListener('click', () => this.toggleGlobalAudio());
    }
  }

  toggleGlobalAudio() {
    const isEnabled = window.soundEngine ? window.soundEngine.toggleSound() : true;
    const desktopBtn = document.getElementById('audio-toggle-btn');
    const mobileBtn = document.getElementById('mobile-audio-btn');

    if (desktopBtn) {
      desktopBtn.innerHTML = isEnabled ? '🔊 SFX ON' : '🔇 SFX OFF';
      desktopBtn.classList.toggle('muted', !isEnabled);
    }
    if (mobileBtn) {
      mobileBtn.innerHTML = isEnabled ? '🔊' : '🔇';
      mobileBtn.classList.toggle('muted', !isEnabled);
    }
    return isEnabled;
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

  // ==========================================
  // THEME ENGINE (Dark / Light + Color Themes)
  // ==========================================
  initThemes() {
    this.currentTheme = localStorage.getItem('lex_theme') || 'dark';
    this.colorPalette = localStorage.getItem('lex_color_palette') || 'purple';
    this.applyTheme();
    // Handled via onclick or fallback listeners if onclick removed
  }

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    document.documentElement.setAttribute('data-palette', this.colorPalette);

    const desktopToggle = document.getElementById('theme-toggle-btn-desktop');
    const mobileToggle = document.getElementById('theme-toggle-btn-mobile');
    const icon = this.currentTheme === 'dark' ? '🌙' : '☀️';
    if (desktopToggle) desktopToggle.innerHTML = `${icon} ${this.currentTheme === 'dark' ? 'Qorong\'u' : 'Yorug\''} rejim`;
    if (mobileToggle) mobileToggle.innerHTML = icon;
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('lex_theme', this.currentTheme);
    this.applyTheme();
    if (window.soundEngine) window.soundEngine.buttonClick();
  }

  setColorPalette(paletteName) {
    this.colorPalette = paletteName;
    localStorage.setItem('lex_color_palette', paletteName);
    this.applyTheme();
    if (window.soundEngine) window.soundEngine.buttonClick();
  }

  // ========================================================
  // DAILY ACTIVITY TRACKER & GITHUB-STYLE HEATMAP
  // ========================================================
  initDailyActivityTracker() {
    this.getDailyActivityMap();
  }

  getTodayKey() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  getDailyActivityMap() {
    try {
      return JSON.parse(localStorage.getItem('lex_daily_activity') || '{}');
    } catch {
      return {};
    }
  }

  recordDailyWord(count = 1) {
    const map = this.getDailyActivityMap();
    const key = this.getTodayKey();
    map[key] = (map[key] || 0) + count;
    localStorage.setItem('lex_daily_activity', JSON.stringify(map));
  }

  getTodayWordCount() {
    const map = this.getDailyActivityMap();
    return map[this.getTodayKey()] || 0;
  }

  // ========================================================
  // "BUGUNGI NATIJA" SESSION SUMMARY CARD
  // ========================================================
  showDailySummaryCard() {
    let modal = document.getElementById('daily-summary-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'daily-summary-modal';
      modal.className = 'daily-summary-modal-backdrop';
      document.body.appendChild(modal);
    }

    const todayCount = this.getTodayWordCount();
    const targetCount = 30;
    const ringPercent = Math.min(100, Math.round((todayCount / targetCount) * 100));
    const accuracy = this.sessionTotal > 0 ? Math.round((this.sessionCorrect / this.sessionTotal) * 100) : 100;
    const sessionDurationMin = Math.max(1, Math.round((Date.now() - this.sessionStartTime) / 60000));

    modal.innerHTML = `
      <div class="daily-summary-sheet ios-glass-panel">
        <div class="modal-sheet-handle"></div>
        
        <div class="summary-header">
          <div class="summary-badge">🌟 BUGUNGI MASHG'ULOT NATIJASI</div>
          <button class="modal-close-icon-btn ios-button" onclick="window.app.closeDailySummaryCard()">✕</button>
        </div>

        <!-- Apple Fitness Style Activity Ring -->
        <div class="activity-ring-hero">
          <div class="ring-svg-wrapper">
            <svg class="activity-circle-svg" viewBox="0 0 100 100">
              <circle class="ring-bg" cx="50" cy="50" r="42" />
              <circle 
                class="ring-progress" 
                cx="50" 
                cy="50" 
                r="42" 
                style="stroke-dashoffset: ${264 - (264 * ringPercent) / 100};" 
              />
            </svg>
            <div class="ring-inner-stat">
              <span class="ring-number">${todayCount}</span>
              <span class="ring-sub">/ ${targetCount} so'z</span>
            </div>
          </div>
          <div class="ring-legend">
            <h4 class="ring-goal-title">Kunlik Maqsad: ${ringPercent}%</h4>
            <p class="ring-goal-sub">${todayCount >= targetCount ? '🎉 Kunlik marra zabt etildi!' : `Yana ${targetCount - todayCount} ta so'z qoldi`}</p>
          </div>
        </div>

        <!-- Key Metrics Cluster -->
        <div class="summary-metrics-grid">
          <div class="s-metric-card">
            <span class="s-m-icon">🎯</span>
            <div class="s-m-val">${accuracy}%</div>
            <div class="s-m-lbl">Aniqlik (${this.sessionCorrect}/${this.sessionTotal || this.sessionCorrect})</div>
          </div>
          <div class="s-metric-card">
            <span class="s-m-icon">⚡</span>
            <div class="s-m-val">+${this.sessionXp || 120}</div>
            <div class="s-m-lbl">Yig'ilgan XP</div>
          </div>
          <div class="s-metric-card">
            <span class="s-m-icon">🔥</span>
            <div class="s-m-val">${this.stats.streak} kun</div>
            <div class="s-m-lbl">Ketma-ketlik</div>
          </div>
          <div class="s-metric-card">
            <span class="s-m-icon">⏱️</span>
            <div class="s-m-val">${sessionDurationMin} daqiqa</div>
            <div class="s-m-lbl">Mashg'ulot Vaqti</div>
          </div>
        </div>

        <!-- GitHub Style 35-Day Activity Heatmap -->
        <div class="activity-heatmap-box">
          <div class="heatmap-title-row">
            <span class="heatmap-title">📅 SO'NGGI 35 KUNLIK KUNLIK FAOLLIK XARITASI</span>
            <span class="heatmap-legend-scale">
              <span>0</span>
              <span class="h-dot lvl-0"></span>
              <span class="h-dot lvl-1"></span>
              <span class="h-dot lvl-2"></span>
              <span class="h-dot lvl-3"></span>
              <span class="h-dot lvl-4"></span>
              <span>30+</span>
            </span>
          </div>
          <div class="activity-heatmap-grid" id="heatmap-cells-grid">
            ${this.renderActivityHeatmapHtml()}
          </div>
        </div>

        <!-- Theme & Color Palette Selector Bar -->
        <div class="theme-palette-bar">
          <div class="theme-palette-label">🎨 Rang Mavzusi:</div>
          <div class="palette-chips-group">
            <button class="palette-chip-btn ${this.colorPalette === 'purple' ? 'active' : ''} ios-button" onclick="window.app.setColorPalette('purple')" title="Neon Violet">🟣 Binafsha</button>
            <button class="palette-chip-btn ${this.colorPalette === 'emerald' ? 'active' : ''} ios-button" onclick="window.app.setColorPalette('emerald')" title="Matrix Emerald">🟢 Zumrad</button>
            <button class="palette-chip-btn ${this.colorPalette === 'crimson' ? 'active' : ''} ios-button" onclick="window.app.setColorPalette('crimson')" title="Sunset Crimson">🔴 Yoqut</button>
            <button class="palette-chip-btn ${this.colorPalette === 'ocean' ? 'active' : ''} ios-button" onclick="window.app.setColorPalette('ocean')" title="Electric Ocean">🔵 Okean</button>
          </div>
        </div>

        <!-- Encouragement Quote -->
        <div class="summary-quote-pill">
          💡 “Kuniga atigi 15 daqiqa ingliz tilini o'rganish bir yilda 3,000 dan ortiq so'zni mustahkam xotiraga mixlaydi.”
        </div>

        <!-- Actions Bar -->
        <div class="summary-actions-bar">
          <button class="cta-primary ios-button" onclick="window.app.shareDailyResult()">
            📤 Natijani Ulashish (Share)
          </button>
          <button class="cta-secondary ios-button" onclick="window.app.closeDailySummaryCard()">
            Davom Etish ➔
          </button>
        </div>

      </div>
    `;

    modal.classList.add('active');
    if (window.effectsEngine) window.effectsEngine.launchConfetti();
    if (window.soundEngine) window.soundEngine.levelUp();
  }

  closeDailySummaryCard() {
    const modal = document.getElementById('daily-summary-modal');
    if (modal) modal.classList.remove('active');
    if (window.soundEngine) window.soundEngine.buttonClick();
  }

  renderActivityHeatmapHtml() {
    const map = this.getDailyActivityMap();
    const cells = [];
    const now = new Date();

    // Oxirgi 35 kunni hisoblash (5 hafta)
    for (let i = 34; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${day}`;
      const count = map[key] || 0;

      let level = 0;
      if (count > 0 && count <= 5) level = 1;
      else if (count > 5 && count <= 15) level = 2;
      else if (count > 15 && count <= 25) level = 3;
      else if (count > 25) level = 4;

      const dateLabel = `${day}.${m}`;
      cells.push(`
        <div class="heatmap-cell lvl-${level}" title="${dateLabel}: ${count} ta so'z o'rganildi">
          <span class="cell-tooltip">${dateLabel}: ${count} ta</span>
        </div>
      `);
    }

    return cells.join('');
  }

  shareDailyResult() {
    const todayCount = this.getTodayWordCount();
    const text = `🎮 Men bugun Shadow Lexicon'da ${todayCount} ta inglizcha so'z o'rgandim! Streak: ${this.stats.streak} kun 🔥 Bepul so'z o'yinlari va 1,000 ta Flashcard.`;

    if (navigator.share) {
      navigator.share({
        title: 'Shadow Lexicon Natijam',
        text: text,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        if (window.effectsEngine && window.effectsEngine.showToast) {
          window.effectsEngine.showToast('Natija nusxalandi! Do\'stlarga yuborishingiz mumkin.', 'success');
        } else {
          alert('Natija nusxalandi! Do\'stlaringiz bilan ulashing: \n\n' + text);
        }
      });
    }
    if (window.soundEngine) window.soundEngine.buttonClick();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
