/**
 * FLASHCARDS ENGINE - 1,000 Interactive 3D Apple-Style Study Cards
 * Feature: Front (English + Example) -> Back (Tarjimasi + Izoh)
 * Real-time Speech Synthesis, Pack Filtering, Mastery Tracker & Search
 */

class FlashcardsEngine {
  constructor() {
    this.allCards = [];
    this.filteredCards = [];
    this.currentIndex = 0;
    this.isFlipped = false;
    this.activePack = 'all';
    this.searchQuery = '';
    this.viewMode = 'studio'; // 'studio' | 'grid'
    
    try {
      this.masteredIds = new Set(JSON.parse(localStorage.getItem('lex_mastered_cards') || '[]'));
    } catch (e) {
      this.masteredIds = new Set();
    }

    try {
      this.srsData = JSON.parse(localStorage.getItem('lex_srs_data') || '{}');
    } catch (e) {
      this.srsData = {};
    }

    this.container = null;
  }

  getDueTodayCount() {
    const now = Date.now();
    return this.allCards.filter(c => {
      const srs = this.srsData[c.id];
      return !srs || srs.nextReviewDate <= now;
    }).length;
  }

  init() {
    this.allCards = window.FLASHCARDS_DATA || [];
    this.applyFilters();

    this.container = document.getElementById('flashcards-view');
    if (!this.container) return;

    this.render();
    this.bindGlobalKeys();
    console.log(`✓ Flashcards Engine Ready: ${this.allCards.length} cards loaded.`);
  }

  applyFilters() {
    let list = [...this.allCards];

    // Filter by Pack or SRS Due Today
    if (this.activePack === 'due_today') {
      const now = Date.now();
      list = list.filter(c => {
        const srs = this.srsData[c.id];
        return !srs || srs.nextReviewDate <= now;
      });
    } else if (this.activePack === 'mastered') {
      list = list.filter(c => this.masteredIds.has(c.id));
    } else if (this.activePack !== 'all') {
      list = list.filter(c => c.pack === this.activePack);
    }

    // Filter by Search Query
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(c => 
        (c.word && c.word.toLowerCase().includes(q)) || 
        (c.uzb && c.uzb.toLowerCase().includes(q)) || 
        (c.example && c.example.toLowerCase().includes(q))
      );
    }

    this.filteredCards = list;
    if (this.currentIndex >= this.filteredCards.length) {
      this.currentIndex = Math.max(0, this.filteredCards.length - 1);
    }
    this.isFlipped = false;
  }

  setPack(packName) {
    this.activePack = packName;
    this.currentIndex = 0;
    this.applyFilters();
    this.updateUI();
    if (window.soundEngine) window.soundEngine.buttonClick();
  }

  search(query) {
    this.searchQuery = query;
    this.currentIndex = 0;
    this.applyFilters();
    this.updateUI();
  }

  setViewMode(mode) {
    this.viewMode = mode;
    this.updateUI();
    if (window.soundEngine) window.soundEngine.buttonClick();
  }

  toggleFlip() {
    this.isFlipped = !this.isFlipped;
    const cardElement = document.getElementById('studio-flashcard');
    if (cardElement) {
      if (this.isFlipped) {
        cardElement.classList.add('is-flipped');
      } else {
        cardElement.classList.remove('is-flipped');
      }
    }
    if (window.soundEngine) window.soundEngine.cardFlip();
  }

  nextCard() {
    if (this.filteredCards.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.filteredCards.length;
    this.isFlipped = false;
    this.updateStudioCard();
    if (window.soundEngine) window.soundEngine.buttonClick();
  }

  prevCard() {
    if (this.filteredCards.length === 0) return;
    this.currentIndex = (this.currentIndex - 1 + this.filteredCards.length) % this.filteredCards.length;
    this.isFlipped = false;
    this.updateStudioCard();
    if (window.soundEngine) window.soundEngine.buttonClick();
  }

  shuffle() {
    if (this.filteredCards.length <= 1) return;
    const copy = [...this.filteredCards];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    this.filteredCards = copy;
    this.currentIndex = 0;
    this.isFlipped = false;
    this.updateStudioCard();
    if (window.effectsEngine) window.effectsEngine.triggerComboPill('TASODIFIY ARALASH! 🔀');
    if (window.soundEngine) window.soundEngine.playLevelUp();
  }

  toggleMastered(id) {
    const card = this.cards.find(c => c.id === id);
    if (this.masteredIds.has(id)) {
      this.masteredIds.delete(id);
      if (card && window.favoritesExport) {
        window.favoritesExport.starredSet.delete(card.word.toUpperCase().trim());
        window.favoritesExport.saveStarred();
        window.favoritesExport.updateUI();
      }
      if (window.effectsEngine) window.effectsEngine.triggerComboPill('YODLANMADI ↩');
    } else {
      this.masteredIds.add(id);
      if (card && window.favoritesExport) {
        window.favoritesExport.starredSet.add(card.word.toUpperCase().trim());
        window.favoritesExport.saveStarred();
        window.favoritesExport.updateUI();
      }
      if (window.effectsEngine) {
        window.effectsEngine.triggerComboPill('AJOYIB! YODLANDI ⭐');
        window.effectsEngine.burstConfetti();
      }
      if (window.soundEngine) window.soundEngine.playSuccess();
    }
    try {
      localStorage.setItem('lex_mastered_cards', JSON.stringify([...this.masteredIds]));
    } catch(e) {}
    this.updateUI();
  }

  speak(word) {
    if (window.soundEngine && window.soundEngine.speak) {
      window.soundEngine.speak(word);
    }
  }

  bindGlobalKeys() {
    window.addEventListener('keydown', (e) => {
      const view = document.getElementById('flashcards-view');
      if (!view || !view.classList.contains('active-view')) return;
      if (document.activeElement && document.activeElement.tagName === 'INPUT') return;

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        this.toggleFlip();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        this.nextCard();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        this.prevCard();
      } else if (e.key === 'm' || e.key === 'M') {
        const card = this.filteredCards[this.currentIndex];
        if (card) this.toggleMastered(card.id);
      }
    });
  }

  render() {
    this.container.innerHTML = `
      <div class="flashcards-wrapper">
        
        <!-- Header & Statistics Bar -->
        <div class="fc-hero-bar ios-glass-panel">
          <div class="fc-hero-info">
            <span class="game-badge">🎴 FLASHKARDLAR VA LUG'AT</span>
            <h2 class="fc-headline">1,000 TA KARTA + O'ZBEKCHA TARJIMASI</h2>
            <p class="fc-subtext">Har bir flashcardda inglizcha so'z, jonli misol gap, audio talaffuz va kartani aylantirganda uning to'liq o'zbekcha tarjimasi chiqadi.</p>
          </div>
          
          <div class="fc-stats-counter">
            <div class="fc-stat-box">
              <span class="fc-stat-num" id="fc-total-count">1000</span>
              <span class="fc-stat-lbl">Jami Karta</span>
            </div>
            <div class="fc-stat-box highlight">
              <span class="fc-stat-num" id="fc-mastered-count">${this.masteredIds.size}</span>
              <span class="fc-stat-lbl">Yod Olindi ⭐</span>
            </div>
            <button class="dict-action-pill dict-export-btn ios-button" style="margin-left: 0.5rem;" onclick="window.favoritesExport && window.favoritesExport.openExportModal('starred')">
              📂 Eksport (PDF/Anki)
            </button>
          </div>
        </div>

        <!-- Controls Bar: View mode, Search, Packs -->
        <div class="fc-controls-bar">
          
          <!-- Mode switcher -->
          <div class="fc-mode-tabs ios-segmented-control">
            <button class="fc-mode-btn ${this.viewMode === 'studio' ? 'active' : ''} ios-button" onclick="window.flashcards.setViewMode('studio')">
              🃏 Karta Rejimi (Flip Studio)
            </button>
            <button class="fc-mode-btn ${this.viewMode === 'grid' ? 'active' : ''} ios-button" onclick="window.flashcards.setViewMode('grid')">
              🗂️ Barcha Kartalar Ro'yxati (1000)
            </button>
          </div>

          <!-- Live Search Bar -->
          <div class="fc-search-wrapper">
            <span class="fc-search-icon">🔍</span>
            <input 
              type="text" 
              id="fc-search-input" 
              class="ios-input-field fc-search-input" 
              placeholder="So'z, tarjima yoki gap qidirish..." 
              value="${this.searchQuery}"
              oninput="window.flashcards.search(this.value)"
            />
            ${this.searchQuery ? `<button class="fc-search-clear" onclick="window.flashcards.search(''); document.getElementById('fc-search-input').value='';">✕</button>` : ''}
          </div>

        </div>

        <!-- Pack Selection Carousel -->
        <div class="fc-packs-carousel" id="fc-packs-bar">
          <!-- Injected via JS -->
        </div>

        <!-- Studio Mode View (Single 3D Flip Card) -->
        <div id="fc-studio-container" class="fc-studio-view ${this.viewMode === 'studio' ? 'active' : 'hidden'}">
          <div class="fc-card-scene">
            <div class="fc-3d-card ${this.isFlipped ? 'is-flipped' : ''}" id="studio-flashcard" onclick="window.flashcards.toggleFlip()">
              
              <!-- CARD FRONT: ENGLISH + EXAMPLE -->
              <div class="fc-card-face fc-card-front ios-glass-panel">
                <div class="fc-face-header">
                  <span class="fc-badge-id" id="fc-card-id">#1</span>
                  <span class="fc-pack-tag" id="fc-card-pack">1-100</span>
                  <button class="fc-star-btn ios-button" id="fc-card-star" title="Yodlandi deb belgilash" onclick="event.stopPropagation(); window.flashcards.toggleMasteredCurrent()">
                    ⭐ Yodlash
                  </button>
                </div>

                <div class="fc-card-body">
                  <h3 class="fc-card-word" id="fc-card-word">achieve</h3>
                  <div class="fc-card-phonetic" id="fc-card-phonetic">/əˈtʃiːv/</div>
                  
                  <div class="fc-example-box">
                    <span class="fc-example-label">MISOL GAP:</span>
                    <p class="fc-example-text" id="fc-card-example">"She worked hard to achieve her goal."</p>
                  </div>
                </div>

                <div class="fc-face-footer">
                  <button class="fc-audio-action-btn ios-button" onclick="event.stopPropagation(); window.flashcards.speakCurrent()">
                    🔊 Talaffuzni tinglash
                  </button>
                  <div class="fc-flip-hint">
                    <span class="fc-flip-icon">🔄</span>
                    <span>Tarjimani ko'rish uchun bosing (Bo'sh joy)</span>
                  </div>
                </div>
              </div>

              <!-- CARD BACK: UZBEK TRANSLATION + CONTEXT -->
              <div class="fc-card-face fc-card-back ios-glass-panel">
                <div class="fc-face-header">
                  <span class="fc-badge-id-back">O'ZBEKCHA TARJIMASI</span>
                  <button class="fc-star-btn ios-button" id="fc-card-star-back" onclick="event.stopPropagation(); window.flashcards.toggleMasteredCurrent()">
                    ⭐ Yodlash
                  </button>
                </div>

                <div class="fc-card-body">
                  <div class="fc-uzb-box">
                    <span class="fc-uzb-tag">TARJIMASI</span>
                    <h3 class="fc-card-uzb" id="fc-card-uzb">erishmoq</h3>
                  </div>

                  <div class="fc-context-card">
                    <div class="fc-ctx-row">
                      <span class="fc-ctx-lbl">Inglizcha:</span>
                      <strong class="fc-ctx-val" id="fc-card-word-back">achieve</strong>
                    </div>
                    <div class="fc-ctx-row">
                      <span class="fc-ctx-lbl">Misol gap:</span>
                      <span class="fc-ctx-val italic" id="fc-card-example-back">"She worked hard to achieve her goal."</span>
                    </div>
                    <div class="fc-ctx-row">
                      <span class="fc-ctx-lbl">Rukn:</span>
                      <span class="fc-ctx-tag" id="fc-card-cat-back">Kundalik</span>
                    </div>
                  </div>

                  <!-- Anki / Spaced Repetition Interval Baholash Bar -->
                  <div class="fc-srs-rating-box">
                    <span class="fc-srs-label">🧠 Interval Takrorlash (Xotirangizni baholang):</span>
                    <div class="fc-srs-buttons-row">
                      <button class="fc-srs-btn hard ios-button" onclick="event.stopPropagation(); window.flashcards.rateCurrentCard('hard')">
                        <span class="srs-emoji">🔴</span>
                        <div class="srs-info">
                          <strong class="srs-title">Qiyin</strong>
                          <span class="srs-time">+1 kun</span>
                        </div>
                      </button>
                      <button class="fc-srs-btn good ios-button" onclick="event.stopPropagation(); window.flashcards.rateCurrentCard('good')">
                        <span class="srs-emoji">🟡</span>
                        <div class="srs-info">
                          <strong class="srs-title">Yaxshi</strong>
                          <span class="srs-time">+3 kun</span>
                        </div>
                      </button>
                      <button class="fc-srs-btn easy ios-button" onclick="event.stopPropagation(); window.flashcards.rateCurrentCard('easy')">
                        <span class="srs-emoji">🟢</span>
                        <div class="srs-info">
                          <strong class="srs-title">Oson</strong>
                          <span class="srs-time">+7 kun</span>
                        </div>
                      </button>
                    </div>
                  </div>

                </div>

                <div class="fc-face-footer">
                  <button class="fc-audio-action-btn ios-button" onclick="event.stopPropagation(); window.flashcards.speakCurrent()">
                    🔊 Qayta tinglash
                  </button>
                  <div class="fc-flip-hint">
                    <span class="fc-flip-icon">↩</span>
                    <span>Oldinga qaytish</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- Studio Bottom Navigation Controls -->
          <div class="fc-studio-controls">
            <button class="fc-nav-btn ios-button" onclick="window.flashcards.prevCard()">
              ⬅️ Oldingi
            </button>
            <button class="fc-shuffle-btn ios-button" onclick="window.flashcards.shuffle()">
              🔀 Tasodifiy
            </button>
            <button class="fc-flip-cta-btn ios-button" onclick="window.flashcards.toggleFlip()">
              🔄 Aylantirish (Tarjimasi)
            </button>
            <button class="fc-nav-btn ios-button" onclick="window.flashcards.nextCard()">
              Keyingi ➡️
            </button>
          </div>

          <!-- Card Progress Indicator -->
          <div class="fc-progress-container">
            <div class="fc-progress-text">
              <span id="fc-progress-label">Karta 1 / 1000</span>
              <span id="fc-progress-percentage">0.1%</span>
            </div>
            <div class="fc-progress-bar-bg">
              <div class="fc-progress-fill" id="fc-progress-fill" style="width: 0.1%;"></div>
            </div>
          </div>

        </div>

        <!-- Grid Gallery Mode View (All 1000 Cards) -->
        <div id="fc-grid-container" class="fc-grid-view ${this.viewMode === 'grid' ? 'active' : 'hidden'}">
          <div class="fc-grid-meta">
            <span id="fc-grid-count-label">Jami: ${this.filteredCards.length} ta karta</span>
            <span class="fc-grid-tip">💡 Har bir kartaning "Tarjimasi" tugmasini bosib, o'zbekchasini ochishingiz mumkin.</span>
          </div>
          <div class="fc-cards-grid" id="fc-cards-grid">
            <!-- Grid cards injected here -->
          </div>
        </div>

      </div>
    `;

    this.renderPacksBar();
    this.updateStudioCard();
    if (this.viewMode === 'grid') {
      this.renderGrid();
    }
  }

  renderPacksBar() {
    const packsBar = document.getElementById('fc-packs-bar');
    if (!packsBar) return;

    const dueCount = this.getDueTodayCount();
    const packs = [
      { id: 'all', label: 'Barcha kartalar (1,000)', count: this.allCards.length },
      { id: 'due_today', label: `🧠 Bugun Takrorlash (${dueCount})`, count: dueCount },
      { id: '1-100', label: '1–100 (Kundalik)', count: 100 },
      { id: '101-250', label: '101–250 (Muloqot)', count: 150 },
      { id: '251-400', label: '251–400 (Shahar & Hayot)', count: 150 },
      { id: '401-550', label: '401–550 (Hissiyot & Fikr)', count: 150 },
      { id: '551-700', label: '551–700 (Ish & O\'qish)', count: 150 },
      { id: '701-850', label: '701–850 (Harakat)', count: 150 },
      { id: '851-1000', label: '851–1000 (Mukammal)', count: 150 },
      { id: 'mastered', label: `⭐ Yodlanganlar (${this.masteredIds.size})`, count: this.masteredIds.size }
    ];

    packsBar.innerHTML = packs.map(p => `
      <button 
        class="fc-pack-chip ${this.activePack === p.id ? 'active' : ''} ios-button" 
        onclick="window.flashcards.setPack('${p.id}')">
        <span>${p.label}</span>
      </button>
    `).join('');
  }

  updateUI() {
    const totalEl = document.getElementById('fc-total-count');
    const masteredEl = document.getElementById('fc-mastered-count');
    if (totalEl) totalEl.textContent = this.filteredCards.length;
    if (masteredEl) masteredEl.textContent = this.masteredIds.size;

    this.renderPacksBar();

    const studioEl = document.getElementById('fc-studio-container');
    const gridEl = document.getElementById('fc-grid-container');

    if (studioEl && gridEl) {
      if (this.viewMode === 'studio') {
        studioEl.classList.remove('hidden');
        studioEl.classList.add('active');
        gridEl.classList.add('hidden');
        gridEl.classList.remove('active');
        this.updateStudioCard();
      } else {
        studioEl.classList.add('hidden');
        studioEl.classList.remove('active');
        gridEl.classList.remove('hidden');
        gridEl.classList.add('active');
        this.renderGrid();
      }
    }
  }

  updateStudioCard() {
    if (this.filteredCards.length === 0) {
      const cardWord = document.getElementById('fc-card-word');
      if (cardWord) cardWord.textContent = "Hech narsa topilmadi";
      const cardEx = document.getElementById('fc-card-example');
      if (cardEx) cardEx.textContent = "Boshqa so'z qidirib ko'ring yoki boshqa to'plamni tanlang.";
      return;
    }

    const card = this.filteredCards[this.currentIndex];
    const isMastered = this.masteredIds.has(card.id);

    // Front
    const idEl = document.getElementById('fc-card-id');
    const packEl = document.getElementById('fc-card-pack');
    const starEl = document.getElementById('fc-card-star');
    const wordEl = document.getElementById('fc-card-word');
    const phonEl = document.getElementById('fc-card-phonetic');
    const exEl = document.getElementById('fc-card-example');

    if (idEl) idEl.textContent = `#${card.id}`;
    if (packEl) packEl.textContent = `${card.pack} • ${card.category || ''}`;
    if (starEl) {
      starEl.classList.toggle('active', isMastered);
      starEl.textContent = isMastered ? '⭐ Yodlandi' : '☆ Yodlash';
    }
    if (wordEl) wordEl.textContent = card.word;
    if (phonEl) phonEl.textContent = `/${card.word.toLowerCase()}/`;
    if (exEl) exEl.textContent = `"${card.example}"`;

    // Back
    const uzbEl = document.getElementById('fc-card-uzb');
    const wordBackEl = document.getElementById('fc-card-word-back');
    const exBackEl = document.getElementById('fc-card-example-back');
    const catBackEl = document.getElementById('fc-card-cat-back');
    const starBackEl = document.getElementById('fc-card-star-back');

    if (uzbEl) uzbEl.textContent = card.uzb;
    if (wordBackEl) wordBackEl.textContent = card.word;
    if (exBackEl) exBackEl.textContent = `"${card.example}"`;
    if (catBackEl) catBackEl.textContent = card.category || card.pack;
    if (starBackEl) {
      starBackEl.classList.toggle('active', isMastered);
      starBackEl.textContent = isMastered ? '⭐ Yodlandi' : '☆ Yodlash';
    }

    // Reset 3D flip transform
    const cardElement = document.getElementById('studio-flashcard');
    if (cardElement) {
      if (this.isFlipped) cardElement.classList.add('is-flipped');
      else cardElement.classList.remove('is-flipped');
    }

    // Progress
    const total = this.filteredCards.length;
    const progressPercent = ((this.currentIndex + 1) / total * 100).toFixed(1);
    const progressLabel = document.getElementById('fc-progress-label');
    const progressPercentage = document.getElementById('fc-progress-percentage');
    const progressFill = document.getElementById('fc-progress-fill');

    if (progressLabel) progressLabel.textContent = `Karta ${this.currentIndex + 1} / ${total}`;
    if (progressPercentage) progressPercentage.textContent = `${progressPercent}%`;
    if (progressFill) progressFill.style.width = `${progressPercent}%`;
  }

  // Anki / Spaced Repetition (Interval Takrorlash)
  rateCurrentCard(rating) {
    if (this.filteredCards.length === 0) return;
    const card = this.filteredCards[this.currentIndex];
    const now = Date.now();
    const prevSrs = this.srsData[card.id] || { intervalDays: 1, repetitionCount: 0 };
    
    let intervalDays = 1;
    let label = 'Qiyin (Ertaga)';

    if (rating === 'hard') {
      intervalDays = 1;
      label = 'Qiyin (+1 kun)';
      // Xatolar Sandig'iga qo'shish
      if (window.app && window.app.addMistakeWord) {
        window.app.addMistakeWord({
          id: card.id,
          word: card.word,
          translation: card.uzb,
          definition: card.uzb,
          sentence: card.example,
          fullExample: card.example,
          category: card.category || 'daily',
          level: 'A2'
        });
      }
    } else if (rating === 'good') {
      intervalDays = Math.max(3, Math.round((prevSrs.intervalDays || 1) * 2));
      label = `Yaxshi (+${intervalDays} kun)`;
    } else if (rating === 'easy') {
      intervalDays = Math.max(7, Math.round((prevSrs.intervalDays || 1) * 2.5));
      label = `Oson (+${intervalDays} kun)`;
      this.masteredIds.add(card.id);
      localStorage.setItem('lex_mastered_cards', JSON.stringify(Array.from(this.masteredIds)));
    }

    this.srsData[card.id] = {
      cardId: card.id,
      rating: rating,
      intervalDays: intervalDays,
      repetitionCount: (prevSrs.repetitionCount || 0) + 1,
      lastReviewed: now,
      nextReviewDate: now + intervalDays * 24 * 3600 * 1000
    };

    localStorage.setItem('lex_srs_data', JSON.stringify(this.srsData));

    // XP berish
    const xpReward = rating === 'easy' ? 25 : (rating === 'good' ? 18 : 10);
    if (window.gamification) {
      window.gamification.addXP(xpReward, `Flashcard SRS: ${card.word}`);
      window.gamification.stats.flashcardsViewed = (window.gamification.stats.flashcardsViewed || 0) + 1;
      localStorage.setItem('lex_stat_fc', window.gamification.stats.flashcardsViewed);
      if (window.gamification.stats.flashcardsViewed >= 100) {
        window.gamification.unlockAchievement('FLASHCARD_FAN');
      }
    }

    if (window.effectsEngine) {
      window.effectsEngine.showFloatingReaction(`🧠 ${label}`);
      if (rating === 'easy') window.effectsEngine.triggerComboPill();
    }

    if (window.soundEngine) {
      if (rating === 'easy') window.soundEngine.playSuccess();
      else window.soundEngine.cardFlip();
    }

    // Kartani old yuziga qaytarish va keyingisiga o'tish
    this.isFlipped = false;
    const cardEl = document.getElementById('studio-flashcard');
    if (cardEl) cardEl.classList.remove('is-flipped');

    setTimeout(() => {
      this.nextCard();
    }, 280);
  }

  toggleMasteredCurrent() {
    const card = this.filteredCards[this.currentIndex];
    if (card) {
      this.toggleMastered(card.id);
      this.updateStudioCard();
    }
  }

  speakCurrent() {
    const card = this.filteredCards[this.currentIndex];
    if (card) this.speak(card.word);
  }

  renderGrid() {
    const grid = document.getElementById('fc-cards-grid');
    const metaLabel = document.getElementById('fc-grid-count-label');
    if (!grid) return;

    if (metaLabel) metaLabel.textContent = `Ko'rsatilmoqda: ${this.filteredCards.length} ta karta`;

    if (this.filteredCards.length === 0) {
      grid.innerHTML = `
        <div class="fc-empty-state">
          <p>🔍 Qidiruv bo'yicha kartalar topilmadi.</p>
        </div>
      `;
      return;
    }

    const renderLimit = 150;
    const displayList = this.filteredCards.slice(0, renderLimit);

    grid.innerHTML = displayList.map(card => {
      const isMastered = this.masteredIds.has(card.id);
      const safeWord = card.word.replace(/'/g, "\\'");
      const srs = this.srsData[card.id];
      let srsChip = `<span class="fc-grid-srs-chip new">⚪ Yangi</span>`;
      if (srs) {
        if (srs.rating === 'easy') srsChip = `<span class="fc-grid-srs-chip easy">🟢 Oson (+${srs.intervalDays}k)</span>`;
        else if (srs.rating === 'good') srsChip = `<span class="fc-grid-srs-chip good">🟡 Yaxshi (+${srs.intervalDays}k)</span>`;
        else srsChip = `<span class="fc-grid-srs-chip hard">🔴 Qiyin (+1k)</span>`;
      }
      return `
        <div class="fc-grid-card ios-glass-panel ${isMastered ? 'is-mastered' : ''}" id="grid-card-${card.id}">
          <div class="fc-grid-card-head">
            <span class="fc-grid-num">#${card.id}</span>
            <span class="fc-grid-pack">${card.pack}</span>
            ${srsChip}
            <button class="fc-grid-star-btn ${isMastered ? 'active' : ''}" onclick="window.flashcards.toggleMastered(${card.id})">
              ⭐
            </button>
          </div>

          <div class="fc-grid-card-main">
            <div class="fc-grid-word-row">
              <h4 class="fc-grid-word">${card.word}</h4>
              <button class="fc-grid-speak-btn ios-button" onclick="window.flashcards.speak('${safeWord}')" title="Tinglash">
                🔊
              </button>
            </div>
            
            <p class="fc-grid-example">"${card.example}"</p>

            <!-- Translation reveal toggle -->
            <div class="fc-grid-translation-box" id="grid-trans-${card.id}">
              <button class="fc-reveal-btn ios-button" onclick="window.flashcards.revealGridTranslation(${card.id})">
                Tarjimasini ko'rish 👁️
              </button>
              <div class="fc-revealed-text hidden" id="grid-revealed-${card.id}">
                <span class="fc-trans-badge">O'zbekcha:</span>
                <strong class="fc-trans-val">${card.uzb}</strong>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (this.filteredCards.length > renderLimit) {
      const moreBtn = document.createElement('div');
      moreBtn.className = 'fc-grid-more-row';
      moreBtn.innerHTML = `
        <button class="ios-button fc-load-more-btn" onclick="window.flashcards.loadAllGrid()">
          Qolgan barcha ${this.filteredCards.length - renderLimit} ta kartani yuklash ⬇️
        </button>
      `;
      grid.appendChild(moreBtn);
    }
  }

  revealGridTranslation(id) {
    const transBox = document.getElementById(`grid-revealed-${id}`);
    const revealBtn = document.querySelector(`#grid-trans-${id} .fc-reveal-btn`);
    if (transBox) {
      transBox.classList.remove('hidden');
      if (revealBtn) revealBtn.classList.add('hidden');
    }
    if (window.soundEngine) window.soundEngine.cardFlip();
  }

  loadAllGrid() {
    const grid = document.getElementById('fc-cards-grid');
    if (!grid) return;

    grid.innerHTML = this.filteredCards.map(card => {
      const isMastered = this.masteredIds.has(card.id);
      const safeWord = card.word.replace(/'/g, "\\'");
      return `
        <div class="fc-grid-card ios-glass-panel ${isMastered ? 'is-mastered' : ''}" id="grid-card-${card.id}">
          <div class="fc-grid-card-head">
            <span class="fc-grid-num">#${card.id}</span>
            <span class="fc-grid-pack">${card.pack}</span>
            <button class="fc-grid-star-btn ${isMastered ? 'active' : ''}" onclick="window.flashcards.toggleMastered(${card.id})">
              ⭐
            </button>
          </div>

          <div class="fc-grid-card-main">
            <div class="fc-grid-word-row">
              <h4 class="fc-grid-word">${card.word}</h4>
              <button class="fc-grid-speak-btn ios-button" onclick="window.flashcards.speak('${safeWord}')" title="Tinglash">
                🔊
              </button>
            </div>
            
            <p class="fc-grid-example">"${card.example}"</p>

            <div class="fc-grid-translation-box" id="grid-trans-${card.id}">
              <button class="fc-reveal-btn ios-button" onclick="window.flashcards.revealGridTranslation(${card.id})">
                Tarjimasini ko'rish 👁️
              </button>
              <div class="fc-revealed-text hidden" id="grid-revealed-${card.id}">
                <span class="fc-trans-badge">O'zbekcha:</span>
                <strong class="fc-trans-val">${card.uzb}</strong>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}

window.flashcards = new FlashcardsEngine();
