/** SHADOW LEXICON // GAMES BUNDLE (9 GAMES) **/

/**
 * Game 1: Piksel Detektiv (Pixel Detective)
 * 30, 50, 100 talik Marafon rejimi.
 * O'ta darajada Random + Dinamik Bo'limlar Almashinuvi + Offline Image Fallback.
 */

class PixelDetectiveGame {
  constructor(containerId, onScoreUpdate) {
    this.container = document.getElementById(containerId);
    this.onScoreUpdate = onScoreUpdate;
    this.currentWord = null;
    this.timer = null;
    this.blurLevel = 26;
    this.points = 100;
    this.score = 0;
    this.round = 1;
    this.maxRounds = window.wordBank ? window.wordBank.selectedRoundsCount : 30; // 30, 50, 100
    this.wordsList = [];
    this.isRevealed = false;
  }

  start(categoryId = 'all', customRounds = null) {
    this.maxRounds = customRounds || (window.wordBank ? window.wordBank.selectedRoundsCount : 30);
    this.score = 0;
    this.round = 1;

    if (categoryId === 'all') {
      this.wordsList = window.wordBank.getMixedCategoryWords(this.maxRounds);
    } else {
      this.wordsList = window.wordBank.getWords(this.maxRounds, categoryId);
    }

    this.loadRound();
  }

  loadRound() {
    if (this.round > this.maxRounds || this.round > this.wordsList.length) {
      this.renderGameOver();
      return;
    }

    this.currentWord = this.wordsList[this.round - 1];
    this.blurLevel = 26;
    this.points = 100;
    this.isRevealed = false;

    // 4 ta variant (1 to'g'ri, 3 tasodifiy)
    const pool = window.wordBank.words.filter(w => w.word !== this.currentWord.word);
    const shuffledPool = window.wordBank.cryptoShuffle(pool);
    const options = window.wordBank.cryptoShuffle([
      this.currentWord,
      shuffledPool[0],
      shuffledPool[1],
      shuffledPool[2]
    ]);

    this.renderUI(options);
    this.startClarifying();
  }

  renderUI(options) {
    const categoryInfo = CATEGORIES.find(c => c.id === this.currentWord.category) || { name: this.currentWord.category, icon: '🔍' };

    // SVG abstract image fallback in case Unsplash fails
    const fallbackSvg = encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2e1065"/>
            <stop offset="50%" stop-color="#581c87"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
        </defs>
        <rect width="600" height="400" fill="url(#g)"/>
        <circle cx="300" cy="200" r="100" fill="#a855f7" opacity="0.3"/>
        <text x="50%" y="45%" font-size="70" text-anchor="middle" fill="#f43f5e" font-family="sans-serif">${categoryInfo.icon}</text>
        <text x="50%" y="65%" font-size="24" text-anchor="middle" fill="#e9d5ff" font-family="sans-serif" letter-spacing="4">${this.currentWord.category.toUpperCase()}</text>
      </svg>
    `);

    this.container.innerHTML = `
      <div class="game-card pixel-game-arena">
        <div class="game-header">
          <div class="badge-round">Bosqich ${this.round}/${this.maxRounds}</div>
          <div class="category-dynamic-badge">
            <span>${categoryInfo.icon}</span>
            <span>${categoryInfo.name}</span>
          </div>
          <div class="score-display">Ochko: <span class="highlight-score" id="pixel-score">${this.score}</span></div>
          <div class="points-badge">+<span id="current-possible-pts">${this.points}</span> ball</div>
        </div>

        <div class="pixel-viewport">
          <div class="pixel-img-wrapper" id="pixel-img-box">
            <img 
              id="pixel-target-img" 
              src="${this.currentWord.image}" 
              alt="Detective Clue" 
              onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,${fallbackSvg}';"
              style="filter: blur(${this.blurLevel}px) contrast(140%) brightness(0.9); transform: scale(1.08);"
            />
            <div class="scanline-overlay"></div>
            <div class="clarity-bar-container">
              <div class="clarity-bar" id="clarity-progress" style="width: 10%;"></div>
            </div>
          </div>
          <div class="clue-hint-box">
            <span class="clue-icon">💡</span>
            <span class="clue-text">${this.currentWord.definition || this.currentWord.translation}</span>
          </div>
        </div>

        <!-- Faqat sof inglizcha so'z, tarjimasiz! -->
        <div class="options-grid" id="pixel-options-grid">
          ${options.map(opt => `
            <button class="pixel-opt-btn ios-button" data-word="${opt.word}">
              <span class="opt-word">${opt.word}</span>
            </button>
          `).join('')}
        </div>

        <div class="feedback-banner" id="pixel-feedback" style="display:none;"></div>
      </div>
    `;

    const buttons = this.container.querySelectorAll('.pixel-opt-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const selected = btn.getAttribute('data-word');
        this.handleAnswer(selected, btn);
      });
    });
  }

  startClarifying() {
    clearInterval(this.timer);
    const img = document.getElementById('pixel-target-img');
    const ptsEl = document.getElementById('current-possible-pts');
    const progressEl = document.getElementById('clarity-progress');

    let step = 0;
    this.timer = setInterval(() => {
      step++;
      this.blurLevel = Math.max(0, this.blurLevel - 4.5);
      this.points = Math.max(20, this.points - 12);

      if (img) {
        img.style.filter = `blur(${this.blurLevel}px) contrast(120%) brightness(1)`;
      }
      if (ptsEl) {
        ptsEl.innerText = this.points;
      }
      if (progressEl) {
        progressEl.style.width = `${Math.min(100, 15 + step * 16)}%`;
      }

      if (this.blurLevel <= 0) {
        clearInterval(this.timer);
      }
    }, 1800);
  }

  handleAnswer(selectedWord, clickedBtn) {
    if (this.isRevealed) return;
    this.isRevealed = true;
    clearInterval(this.timer);

    const img = document.getElementById('pixel-target-img');
    if (img) img.style.filter = 'blur(0px) contrast(100%) brightness(1)';

    const feedback = document.getElementById('pixel-feedback');
    const isCorrect = selectedWord === this.currentWord.word;

    const allButtons = this.container.querySelectorAll('.pixel-opt-btn');
    allButtons.forEach(btn => {
      if (btn.getAttribute('data-word') === this.currentWord.word) {
        btn.classList.add('correct');
      }
    });

    if (isCorrect) {
      clickedBtn.classList.add('correct');
      if (window.soundEngine) window.soundEngine.playCorrect();
      this.score += this.points;
      if (this.onScoreUpdate) this.onScoreUpdate(this.score);
      if (window.effectsEngine) window.effectsEngine.triggerSuccess(this.points);

      feedback.innerHTML = `
        <div class="feedback-success">
          <span class="icon">✓</span>
          <div>
            <strong>Ajoyib topdingiz! +${this.points} ball</strong>
            <p>${this.currentWord.word} [${this.currentWord.phonetic || ''}] - ${this.currentWord.translation}</p>
          </div>
          <button class="speaker-btn ios-speaker" onclick="window.soundEngine.speak('${this.currentWord.word.replace(/'/g, "\\'")}')">🔊 Eshitish</button>
        </div>
      `;
    } else {
      clickedBtn.classList.add('wrong');
      if (window.soundEngine) window.soundEngine.playWrong();
      if (window.effectsEngine) window.effectsEngine.triggerFail();

      feedback.innerHTML = `
        <div class="feedback-error">
          <span class="icon">✕</span>
          <div>
            <strong>Noto'g'ri!</strong>
            <p>To'g'ri so'z: <strong>${this.currentWord.word}</strong> (${this.currentWord.translation})</p>
          </div>
          <button class="speaker-btn ios-speaker" onclick="window.soundEngine.speak('${this.currentWord.word.replace(/'/g, "\\'")}')">🔊 Eshitish</button>
        </div>
      `;
    }

    if (window.soundEngine) window.soundEngine.speak(this.currentWord.word);
    feedback.style.display = 'block';

    setTimeout(() => {
      this.round++;
      this.loadRound();
    }, 2200);
  }

  renderGameOver() {
    this.container.innerHTML = `
      <div class="game-over-card">
        <div class="trophy-icon">🏆</div>
        <h2>${this.maxRounds} Talik Marafon Yakunlandi!</h2>
        <p class="final-score-text">Jami to'plangan ball: <span class="highlight-score">${this.score}</span></p>
        <p class="score-subtext">Siz ${this.maxRounds} ta so'zdan iborat ulkan sinovni muvaffaqiyatli bosib o'tdingiz!</p>
        <div class="game-over-actions">
          <button class="action-btn primary ios-button" id="pixel-restart-btn">Qaytadan boshlash (${this.maxRounds})</button>
          <button class="action-btn secondary ios-button" onclick="window.app.switchTab('home')">Bosh sahifa</button>
        </div>
      </div>
    `;

    document.getElementById('pixel-restart-btn')?.addEventListener('click', () => {
      this.start();
    });
  }

  destroy() {
    clearInterval(this.timer);
  }
}

window.PixelDetectiveGame = PixelDetectiveGame;


/**
 * Game 2: Matn Shifri (Context Cipher)
 * 30, 50, 100 talik Marafon rejimi.
 * O'ta darajada Random + Dinamik Bo'limlar Almashinuvi.
 */

class TextCipherGame {
  constructor(containerId, onScoreUpdate) {
    this.container = document.getElementById(containerId);
    this.onScoreUpdate = onScoreUpdate;
    this.currentWord = null;
    this.score = 0;
    this.round = 1;
    this.maxRounds = window.wordBank ? window.wordBank.selectedRoundsCount : 30; // 30, 50, 100
    this.wordsList = [];
    this.selectedLetters = [];
    this.availableTiles = [];
  }

  start(categoryId = 'all', customRounds = null) {
    this.maxRounds = customRounds || (window.wordBank ? window.wordBank.selectedRoundsCount : 30);
    this.score = 0;
    this.round = 1;

    let pool = [];
    if (categoryId === 'all') {
      pool = window.wordBank.getMixedCategoryWords(this.maxRounds * 3);
    } else {
      pool = window.wordBank.getWords(this.maxRounds * 3, categoryId);
    }

    // Kataklarga to'liq sig'adigan so'zlar
    this.wordsList = pool.filter(w => w.word.length >= 3 && w.word.length <= 10 && !w.word.includes(' ')).slice(0, this.maxRounds);
    if (this.wordsList.length < this.maxRounds) {
      this.wordsList = pool.slice(0, this.maxRounds);
    }

    this.loadRound();
  }

  loadRound() {
    if (this.round > this.maxRounds || this.round > this.wordsList.length) {
      this.renderGameOver();
      return;
    }

    this.currentWord = this.wordsList[this.round - 1];
    const targetWord = this.currentWord.word.toUpperCase();
    
    // Harflar va qo'shimcha chalg'ituvchi harflar
    const letters = targetWord.split('');
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const extraCount = Math.min(3, 10 - letters.length);
    for (let i = 0; i < extraCount; i++) {
      letters.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
    }

    // Kriptografik aralashtirish
    const rawTiles = letters.map((char, index) => ({
      id: `${char}_${index}_${Math.random().toString(36).substring(4)}`,
      char: char,
      used: false
    }));

    this.availableTiles = window.wordBank ? window.wordBank.cryptoShuffle(rawTiles) : rawTiles.sort(() => 0.5 - Math.random());
    this.selectedLetters = [];

    this.renderUI();
  }

  renderUI() {
    const targetLength = this.currentWord.word.length;
    const sentenceWithBlank = (this.currentWord.sentence || 'Learn [ ? ] in context.').replace('[ ? ]', '<span class="cipher-slot">[ ? ]</span>');
    const categoryInfo = CATEGORIES.find(c => c.id === this.currentWord.category) || { name: this.currentWord.category, icon: '🧩' };

    this.container.innerHTML = `
      <div class="game-card cipher-game-arena">
        <div class="game-header">
          <div class="badge-round">Bosqich ${this.round}/${this.maxRounds}</div>
          <div class="category-dynamic-badge">
            <span>${categoryInfo.icon}</span>
            <span>${categoryInfo.name}</span>
          </div>
          <div class="score-display">Ochko: <span class="highlight-score">${this.score}</span></div>
          <div class="points-badge">Daraja: ${this.currentWord.level || 'B1'}</div>
        </div>

        <div class="cipher-context-box">
          <div class="cipher-category-tag">${(this.currentWord.category || '').toUpperCase()}</div>
          <p class="cipher-sentence">${sentenceWithBlank}</p>
          <div class="cipher-meaning">
            <span class="cipher-icon">💡</span>
            <span>Ma'nosi: <strong>${this.currentWord.translation}</strong> ${this.currentWord.definition ? `- ${this.currentWord.definition}` : ''}</span>
          </div>
        </div>

        <div class="word-slots-container" id="cipher-slots">
          ${Array.from({ length: targetLength }).map((_, i) => {
            const letter = this.selectedLetters[i];
            return `
              <div class="cipher-letter-box ${letter ? 'filled' : 'empty'}" data-index="${i}">
                ${letter ? letter.char : ''}
              </div>
            `;
          }).join('')}
        </div>

        <div class="scrambled-tiles-container" id="cipher-tiles">
          ${this.availableTiles.map((tile) => `
            <button class="tile-btn ios-button ${tile.used ? 'used' : ''}" data-tile-id="${tile.id}" ${tile.used ? 'disabled' : ''}>
              ${tile.char}
            </button>
          `).join('')}
        </div>

        <div class="cipher-controls">
          <button class="action-btn-sm secondary ios-button" id="cipher-clear-btn">Tozalash 🔄</button>
          <button class="action-btn-sm secondary ios-button" id="cipher-hint-btn">Harf maslahati 💡</button>
        </div>

        <div class="feedback-banner" id="cipher-feedback" style="display:none;"></div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const tileBtns = this.container.querySelectorAll('.tile-btn');
    tileBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tileId = btn.getAttribute('data-tile-id');
        this.selectTile(tileId);
      });
    });

    const slots = this.container.querySelectorAll('.cipher-letter-box.filled');
    slots.forEach(slot => {
      slot.addEventListener('click', () => {
        const idx = parseInt(slot.getAttribute('data-index'));
        this.removeLetterAt(idx);
      });
    });

    document.getElementById('cipher-clear-btn')?.addEventListener('click', () => {
      if (window.soundEngine) window.soundEngine.buttonClick();
      this.selectedLetters = [];
      this.availableTiles.forEach(t => t.used = false);
      this.renderUI();
    });

    document.getElementById('cipher-hint-btn')?.addEventListener('click', () => {
      this.applyHint();
    });
  }

  selectTile(tileId) {
    if (this.selectedLetters.length >= this.currentWord.word.length) return;

    const tile = this.availableTiles.find(t => t.id === tileId);
    if (!tile || tile.used) return;

    tile.used = true;
    this.selectedLetters.push(tile);
    if (window.soundEngine) window.soundEngine.buttonClick();
    this.renderUI();

    if (this.selectedLetters.length === this.currentWord.word.length) {
      this.checkWord();
    }
  }

  removeLetterAt(index) {
    if (index < 0 || index >= this.selectedLetters.length) return;
    const removedTile = this.selectedLetters.splice(index, 1)[0];
    if (removedTile) {
      removedTile.used = false;
      if (window.soundEngine) window.soundEngine.buttonClick();
      this.renderUI();
    }
  }

  applyHint() {
    const nextIdx = this.selectedLetters.length;
    if (nextIdx >= this.currentWord.word.length) return;
    const requiredChar = this.currentWord.word[nextIdx].toUpperCase();

    const freeTile = this.availableTiles.find(t => !t.used && t.char === requiredChar);
    if (freeTile) {
      this.selectTile(freeTile.id);
    }
  }

  checkWord() {
    const entered = this.selectedLetters.map(t => t.char).join('');
    const target = this.currentWord.word.toUpperCase();
    const feedback = document.getElementById('cipher-feedback');

    if (entered === target) {
      if (window.soundEngine) window.soundEngine.playCorrect();
      this.score += 80;
      if (this.onScoreUpdate) this.onScoreUpdate(this.score);
      if (window.effectsEngine) window.effectsEngine.triggerSuccess(80);

      const sentenceFull = (this.currentWord.sentence || '').replace('[ ? ]', `<strong>${target}</strong>`);

      if (feedback) {
        feedback.innerHTML = `
          <div class="feedback-success">
            <span class="icon">✓</span>
            <div>
              <strong>Shifr yechildi! +80 ball</strong>
              <p>${sentenceFull}</p>
            </div>
            <button class="speaker-btn ios-speaker" onclick="window.soundEngine.speak('${target.replace(/'/g, "\\'")}')">🔊 Tinglash</button>
          </div>
        `;
        feedback.style.display = 'block';
      }

      if (window.soundEngine) window.soundEngine.speak(target);

      setTimeout(() => {
        this.round++;
        this.loadRound();
      }, 2200);

    } else {
      if (window.soundEngine) window.soundEngine.playWrong();
      if (window.effectsEngine) window.effectsEngine.triggerFail();

      const slots = document.getElementById('cipher-slots');
      slots?.classList.add('shake-wrong');

      if (feedback) {
        feedback.innerHTML = `
          <div class="feedback-error">
            <span class="icon">✕</span>
            <div>
              <strong>Xato ketma-ketlik!</strong>
              <p>Harflarni tozalab, qaytadan urinib ko'ring yoki maslahat oling.</p>
            </div>
          </div>
        `;
        feedback.style.display = 'block';
      }

      setTimeout(() => {
        slots?.classList.remove('shake-wrong');
      }, 600);
    }
  }

  renderGameOver() {
    this.container.innerHTML = `
      <div class="game-over-card">
        <div class="trophy-icon">🏆</div>
        <h2>${this.maxRounds} Talik Matn Shifri Yakunlandi!</h2>
        <p class="final-score-text">To'plangan ball: <span class="highlight-score">${this.score}</span></p>
        <p class="score-subtext">Siz so'zlarni kontekst orqali tushunish bo'yicha yuqori natijaga erishdingiz!</p>
        <div class="game-over-actions">
          <button class="action-btn primary ios-button" id="cipher-restart-btn">Qaytadan boshlash (${this.maxRounds})</button>
          <button class="action-btn secondary ios-button" onclick="window.app.switchTab('home')">Bosh sahifa</button>
        </div>
      </div>
    `;

    document.getElementById('cipher-restart-btn')?.addEventListener('click', () => {
      this.start();
    });
  }

  destroy() {}
}

window.TextCipherGame = TextCipherGame;


/**
 * Game 3: Juftlik Blitz (Speed Match & Vanish)
 * 10-12 ta suzuvchi neon kartalar (English + Uzbek tarjima).
 * Bir-biriga mos juftlik bosilganda yo'qoladi, xato bo'lsa titraydi.
 */

class PairBlitzGame {
  constructor(containerId, onScoreUpdate) {
    this.container = document.getElementById(containerId);
    this.onScoreUpdate = onScoreUpdate;
    this.timer = null;
    this.timeLeft = 45;
    this.score = 0;
    this.firstSelected = null;
    this.secondSelected = null;
    this.isLocked = false;
    this.matchedCount = 0;
    this.totalPairs = 6; // 12 ta karta
    this.cards = [];
  }

  start(categoryId = 'all') {
    this.score = 0;
    this.timeLeft = 45;
    this.matchedCount = 0;
    this.firstSelected = null;
    this.secondSelected = null;
    this.isLocked = false;

    const words = window.wordBank ? window.wordBank.getByCategory(categoryId, this.totalPairs) : [];
    
    // 6 ta inglizcha va 6 ta o'zbekcha kartochkalar yaratish
    const generatedCards = [];
    words.forEach((item, index) => {
      // English card
      generatedCards.push({
        id: `card_en_${index}`,
        pairId: index,
        type: 'en',
        text: item.word,
        subtext: item.phonetic || '',
        originalWord: item.word
      });
      // Uzbek card
      generatedCards.push({
        id: `card_uz_${index}`,
        pairId: index,
        type: 'uz',
        text: item.translation,
        subtext: (item.category || '').toUpperCase(),
        originalWord: item.word
      });
    });

    // Kriptografik aralashtirish
    this.cards = window.wordBank ? window.wordBank.cryptoShuffle(generatedCards) : generatedCards.sort(() => 0.5 - Math.random());

    this.renderUI();
    this.startTimer();
  }

  renderUI() {
    this.container.innerHTML = `
      <div class="game-card blitz-game-arena">
        <div class="game-header">
          <div class="blitz-timer-pill" id="blitz-timer-wrap">
            <span class="timer-icon">⏱️</span>
            <span id="blitz-time">${this.timeLeft}s</span>
          </div>
          <div class="score-display">Ochko: <span class="highlight-score">${this.score}</span></div>
          <div class="pairs-left-badge">Qoldi: <span id="blitz-left">${this.totalPairs - this.matchedCount}</span> juft</div>
        </div>

        <div class="blitz-grid" id="blitz-grid">
          ${this.cards.map(card => `
            <div class="blitz-card ios-button" data-card-id="${card.id}" data-pair-id="${card.pairId}" data-word="${card.originalWord}">
              <div class="card-glow"></div>
              <div class="card-inner">
                <span class="card-label ${card.type}">${card.type === 'en' ? 'EN' : 'UZ'}</span>
                <span class="card-text">${card.text}</span>
                <span class="card-sub">${card.subtext}</span>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="blitz-bottom-bar">
          <span>⚡ Tezkorlik bilan mos juftliklarni tanlang! Har bir to'g'ri juftlik +50 ball</span>
        </div>
      </div>
    `;

    this.attachCardEvents();
  }

  attachCardEvents() {
    const cardEls = this.container.querySelectorAll('.blitz-card');
    cardEls.forEach(el => {
      el.addEventListener('click', () => {
        this.handleCardClick(el);
      });
    });
  }

  startTimer() {
    clearInterval(this.timer);
    const timeEl = document.getElementById('blitz-time');
    const timerWrap = document.getElementById('blitz-timer-wrap');

    this.timer = setInterval(() => {
      this.timeLeft--;
      if (timeEl) timeEl.innerText = `${this.timeLeft}s`;

      if (this.timeLeft <= 10) {
        timerWrap?.classList.add('urgent-warning');
        if (window.soundEngine) window.soundEngine.playBombTick();
      }

      if (this.timeLeft <= 0) {
        clearInterval(this.timer);
        this.renderGameOver(false);
      }
    }, 1000);
  }

  handleCardClick(cardEl) {
    if (this.isLocked) return;
    if (cardEl.classList.contains('matched') || cardEl.classList.contains('selected')) return;

    if (window.soundEngine) window.soundEngine.buttonClick();
    cardEl.classList.add('selected');

    if (!this.firstSelected) {
      this.firstSelected = cardEl;
      return;
    }

    this.secondSelected = cardEl;
    this.isLocked = true;

    const pair1 = this.firstSelected.getAttribute('data-pair-id');
    const pair2 = this.secondSelected.getAttribute('data-pair-id');
    const origWord = this.firstSelected.getAttribute('data-word');

    if (pair1 === pair2) {
      // To'g'ri juftlik!
      if (window.soundEngine) {
        window.soundEngine.playCorrect();
        if (origWord) window.soundEngine.speak(origWord);
      }
      this.score += 50;
      this.matchedCount++;
      if (this.onScoreUpdate) this.onScoreUpdate(this.score);
      if (window.effectsEngine) window.effectsEngine.triggerSuccess(50);

      const leftEl = document.getElementById('blitz-left');
      if (leftEl) leftEl.innerText = `${this.totalPairs - this.matchedCount}`;

      this.firstSelected.classList.add('vanish-success');
      this.secondSelected.classList.add('vanish-success');

      setTimeout(() => {
        this.firstSelected?.classList.add('matched');
        this.secondSelected?.classList.add('matched');
        this.resetSelection();

        if (this.matchedCount >= this.totalPairs) {
          clearInterval(this.timer);
          const timeBonus = this.timeLeft * 5;
          this.score += timeBonus;
          this.renderGameOver(true, timeBonus);
        }
      }, 500);

    } else {
      // Xato juftlik
      if (window.soundEngine) window.soundEngine.playWrong();
      if (window.effectsEngine) window.effectsEngine.triggerFail();

      this.firstSelected.classList.add('shake-wrong');
      this.secondSelected.classList.add('shake-wrong');

      setTimeout(() => {
        this.firstSelected?.classList.remove('selected', 'shake-wrong');
        this.secondSelected?.classList.remove('selected', 'shake-wrong');
        this.resetSelection();
      }, 700);
    }
  }

  resetSelection() {
    this.firstSelected = null;
    this.secondSelected = null;
    this.isLocked = false;
  }

  renderGameOver(won = true, bonus = 0) {
    this.container.innerHTML = `
      <div class="game-over-card ${won ? 'win' : 'lose'}">
        <div class="trophy-icon">${won ? '🏆' : '⏰'}</div>
        <h2>${won ? 'Aqlbovar qilmas tezlik!' : 'Vaqt tugadi!'}</h2>
        <p class="final-score-text">Umumiy ball: <span class="highlight-score">${this.score}</span></p>
        ${bonus > 0 ? `<p class="bonus-tag">+${bonus} tezkorlik bonusi qo'shildi!</p>` : ''}
        <p class="score-subtext">Qisqa seansli reaksiya orqali so'zlar mustahkamlandi.</p>
        <div class="game-over-actions">
          <button class="action-btn primary ios-button" id="blitz-restart-btn">Qaytadan boshlash</button>
          <button class="action-btn secondary ios-button" onclick="window.app.switchTab('home')">Bosh sahifa</button>
        </div>
      </div>
    `;

    document.getElementById('blitz-restart-btn')?.addEventListener('click', () => {
      this.start();
    });
  }

  destroy() {
    clearInterval(this.timer);
  }
}

window.PairBlitzGame = PairBlitzGame;


/**
 * Game 4: Spelling Bomb (Harfiy Poyga)
 * 30, 50, 100 talik Marafon rejimi.
 * O'ta darajada Random + Dinamik Bo'limlar Almashinuvi.
 * Desktop klaviatura + iPhone & Mobile On-Screen Virtual Keypad to'liq qo'llab-quvvatlanadi.
 */

class SpellingBombGame {
  constructor(containerId, onScoreUpdate) {
    this.container = document.getElementById(containerId);
    this.onScoreUpdate = onScoreUpdate;
    this.timer = null;
    this.timeLeft = 14;
    this.initialTime = 14;
    this.score = 0;
    this.round = 1;
    this.maxRounds = window.wordBank ? window.wordBank.selectedRoundsCount : 30; // 30, 50, 100
    this.wordsList = [];
    this.currentWord = null;
    this.typedIndex = 0;
    this.isDefused = false;
    this.boundKeyHandler = this.handleKeyDown.bind(this);
  }

  start(categoryId = 'all', customRounds = null) {
    this.maxRounds = customRounds || (window.wordBank ? window.wordBank.selectedRoundsCount : 30);
    this.score = 0;
    this.round = 1;

    if (categoryId === 'all') {
      this.wordsList = window.wordBank.getMixedCategoryWords(this.maxRounds);
    } else {
      this.wordsList = window.wordBank.getWords(this.maxRounds, categoryId);
    }

    window.removeEventListener('keydown', this.boundKeyHandler);
    window.addEventListener('keydown', this.boundKeyHandler);
    this.loadRound();
  }

  loadRound() {
    if (this.round > this.maxRounds || this.round > this.wordsList.length) {
      this.renderGameOver(true);
      return;
    }

    this.currentWord = this.wordsList[this.round - 1];
    this.timeLeft = 12 + Math.min(6, this.currentWord.word.length);
    this.initialTime = this.timeLeft;
    this.typedIndex = 0;
    this.isDefused = false;

    this.advanceNonLetters();
    this.renderUI();
    this.startBombTimer();
  }

  advanceNonLetters() {
    const targetWord = this.currentWord.word.toUpperCase();
    while (this.typedIndex < targetWord.length && !/^[A-Z]$/.test(targetWord[this.typedIndex])) {
      this.typedIndex++;
    }
  }

  renderUI() {
    const letters = this.currentWord.word.toUpperCase().split('');
    const categoryInfo = CATEGORIES.find(c => c.id === this.currentWord.category) || { name: this.currentWord.category, icon: '💣' };

    // QWERTY keyboard rows
    const keyboardRows = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
    ];

    this.container.innerHTML = `
      <div class="game-card bomb-game-arena" id="bomb-arena-box">
        <div class="game-header">
          <div class="badge-round">Bomba ${this.round}/${this.maxRounds}</div>
          <div class="category-dynamic-badge">
            <span>${categoryInfo.icon}</span>
            <span>${categoryInfo.name}</span>
          </div>
          <div class="score-display">Ochko: <span class="highlight-score">${this.score}</span></div>
          <div class="defuse-status-pill" id="bomb-status">XAVF: FAOL 🔥</div>
        </div>

        <div class="bomb-visual-center">
          <div class="bomb-svg-wrapper" id="bomb-glow-fx">
            <svg class="bomb-timer-svg" viewBox="0 0 100 100">
              <circle class="timer-bg" cx="50" cy="50" r="42"></circle>
              <circle class="timer-stroke" id="bomb-timer-circle" cx="50" cy="50" r="42" stroke-dasharray="264" stroke-dashoffset="0"></circle>
            </svg>
            <div class="bomb-inner-content">
              <span class="bomb-big-icon">💣</span>
              <span class="bomb-digital-time" id="bomb-time-num">${this.timeLeft.toFixed(1)}s</span>
            </div>
          </div>
          <div class="penalty-tag" id="bomb-penalty-popup">-2s! XATO HARF</div>
        </div>

        <div class="bomb-clue-box">
          <div class="clue-tag">${(this.currentWord.category || '').toUpperCase()}</div>
          <h3 class="clue-translation">${this.currentWord.translation}</h3>
          <p class="clue-def">${this.currentWord.definition || ''}</p>
        </div>

        <div class="bomb-letters-row" id="bomb-letters">
          ${letters.map((char, i) => `
            <div class="bomb-char-box ${i === this.typedIndex ? 'active' : ''} ${i < this.typedIndex ? 'filled' : ''}" data-idx="${i}">
              <span class="char-display">${i < this.typedIndex ? char : (i === this.typedIndex ? '?' : '_')}</span>
            </div>
          `).join('')}
        </div>

        <!-- On-Screen Virtual Keyboard for Mobile & Touch Devices -->
        <div class="bomb-onscreen-keyboard" id="bomb-onscreen-keyboard">
          ${keyboardRows.map(row => `
            <div class="keyboard-row">
              ${row.map(k => `
                <button class="key-btn ios-button" data-key="${k}">${k}</button>
              `).join('')}
            </div>
          `).join('')}
        </div>

        <div class="bomb-instruction">
          <span class="keyboard-icon">⌨️</span>
          <span>Klaviaturadan yoki ekrandagi harflardan tering. Xato harf -2s jarima beradi!</span>
        </div>
      </div>
    `;

    // Attach virtual keypad events
    const keyBtns = this.container.querySelectorAll('.key-btn');
    keyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const char = btn.getAttribute('data-key');
        this.processInput(char);
      });
    });
  }

  startBombTimer() {
    clearInterval(this.timer);
    const circle = document.getElementById('bomb-timer-circle');
    const timeNum = document.getElementById('bomb-time-num');
    const arena = document.getElementById('bomb-arena-box');

    const totalCircumference = 264;

    this.timer = setInterval(() => {
      if (this.isDefused) {
        clearInterval(this.timer);
        return;
      }

      this.timeLeft -= 0.1;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        clearInterval(this.timer);
        this.explodeBomb();
        return;
      }

      if (timeNum) timeNum.innerText = `${this.timeLeft.toFixed(1)}s`;

      if (circle) {
        const progress = (this.timeLeft / this.initialTime);
        const offset = totalCircumference * (1 - progress);
        circle.style.strokeDashoffset = offset;
      }

      if (this.timeLeft <= 4.0) {
        arena?.classList.add('urgent-danger');
        if (Math.floor(this.timeLeft * 10) % 5 === 0) {
          if (window.soundEngine) window.soundEngine.playBombTick();
        }
      }
    }, 100);
  }

  handleKeyDown(e) {
    if (this.isDefused) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const char = e.key.toUpperCase();
    if (/^[A-Z]$/.test(char)) {
      this.processInput(char);
    }
  }

  processInput(char) {
    if (this.isDefused) return;

    const targetWord = this.currentWord.word.toUpperCase();
    const expectedChar = targetWord[this.typedIndex];

    if (char === expectedChar) {
      // To'g'ri harf
      if (window.soundEngine) window.soundEngine.buttonClick();
      this.typedIndex++;
      this.advanceNonLetters();
      this.updateLetterDisplay();

      // Agar butun so'z terib bo'lingan bo'lsa
      if (this.typedIndex >= targetWord.length) {
        this.defuseBomb();
      }
    } else {
      // Xato harf -> -2s jarima!
      if (window.soundEngine) window.soundEngine.playWrong();
      this.timeLeft = Math.max(0.5, this.timeLeft - 2.0);
      this.showPenaltyPopup();
    }
  }

  updateLetterDisplay() {
    const boxes = this.container.querySelectorAll('.bomb-char-box');
    const targetWord = this.currentWord.word.toUpperCase();

    boxes.forEach((box, i) => {
      const charSpan = box.querySelector('.char-display');
      box.classList.remove('active', 'filled');

      if (i < this.typedIndex) {
        box.classList.add('filled');
        if (charSpan) charSpan.innerText = targetWord[i];
      } else if (i === this.typedIndex) {
        box.classList.add('active');
        if (charSpan) charSpan.innerText = '?';
      } else {
        if (charSpan) charSpan.innerText = '_';
      }
    });
  }

  showPenaltyPopup() {
    const pop = document.getElementById('bomb-penalty-popup');
    if (!pop) return;
    pop.classList.add('show');
    setTimeout(() => {
      pop.classList.remove('show');
    }, 800);
  }

  defuseBomb() {
    this.isDefused = true;
    clearInterval(this.timer);

    const bonus = Math.round(this.timeLeft * 8);
    const roundPts = 80 + bonus;
    this.score += roundPts;
    if (this.onScoreUpdate) this.onScoreUpdate(this.score);

    if (window.soundEngine) {
      window.soundEngine.playLevelUp();
      window.soundEngine.speak(this.currentWord.word);
    }
    if (window.effectsEngine) window.effectsEngine.triggerSuccess(roundPts);

    const statusPill = document.getElementById('bomb-status');
    if (statusPill) {
      statusPill.innerText = "ZARARSIZLANTIRILDI! ✓";
      statusPill.classList.add('defused');
    }

    setTimeout(() => {
      this.round++;
      this.loadRound();
    }, 1800);
  }

  explodeBomb() {
    this.isDefused = true;
    clearInterval(this.timer);
    if (window.soundEngine) window.soundEngine.playBombExplode();
    if (window.effectsEngine) window.effectsEngine.triggerFail();

    const arena = document.getElementById('bomb-arena-box');
    arena?.classList.add('bomb-exploded-shake');

    setTimeout(() => {
      this.renderGameOver(false);
    }, 1400);
  }

  renderGameOver(completedAll = false) {
    window.removeEventListener('keydown', this.boundKeyHandler);

    this.container.innerHTML = `
      <div class="game-over-card ${completedAll ? 'win' : 'lose'}">
        <div class="trophy-icon">${completedAll ? '🏆' : '💥'}</div>
        <h2>${completedAll ? `Barcha ${this.maxRounds} ta bomba zararsizlantirildi!` : 'Bomba portladi!'}</h2>
        <p class="final-score-text">To'plangan ball: <span class="highlight-score">${this.score}</span></p>
        <p class="score-subtext">Imlo va tezlik bo'yicha reflekslaringiz sinovdan o'tdi.</p>
        <div class="game-over-actions">
          <button class="action-btn primary ios-button" id="bomb-restart-btn">Qaytadan sinash (${this.maxRounds})</button>
          <button class="action-btn secondary ios-button" onclick="window.app.switchTab('home')">Bosh sahifa</button>
        </div>
      </div>
    `;

    document.getElementById('bomb-restart-btn')?.addEventListener('click', () => {
      this.start();
    });
  }

  destroy() {
    clearInterval(this.timer);
    window.removeEventListener('keydown', this.boundKeyHandler);
  }
}

window.SpellingBombGame = SpellingBombGame;


/**
 * Game 5: Gap Konstruktori (Sentence Architect)
 * 1000 ta Flashcard va Oxford jumlalari asosidagi dinamik gaplar.
 * 30, 50, 100 talik Marafon va to'liq Random.
 */

const BASE_SENTENCE_CHALLENGES = [
  {
    uz: "Mening fikrimcha, biz yangi loyihani birgalikda muhokama qilishimiz kerak.",
    enChunks: ["In my opinion,", "we must discuss", "the new project", "together."],
    category: "work",
    level: "B1"
  },
  {
    uz: "Bilishimcha, xalqaro reys ob-havo tufayli kechiktirildi.",
    enChunks: ["As far as I know,", "the international flight", "was delayed", "due to bad weather."],
    category: "airport",
    level: "B1"
  },
  {
    uz: "Biz kecha aeroportda do'stimiz bilan uchrashdik va suvenir sotib oldik.",
    enChunks: ["We met up", "with our close friend", "at the airport", "and bought souvenirs."],
    category: "airport",
    level: "A2"
  },
  {
    uz: "U har kuni ertalab soat yettida uyg'onadi va toza havoda sayr qiladi.",
    enChunks: ["He wakes up", "at seven o'clock", "every morning", "and goes for a walk."],
    category: "daily",
    level: "A1"
  },
  {
    uz: "Muntazam ravishda sport bilan shug'ullanish jismoniy salomatlikni mustahkamlaydi.",
    enChunks: ["Working out", "on a regular basis", "significantly improves", "physical health."],
    category: "health",
    level: "B1"
  },
  {
    uz: "Boshqa tomondan, yangi texnologiyalar ekranda o'tkaziladigan vaqtni oshiradi.",
    enChunks: ["On the other hand,", "modern technologies", "increase our daily", "screen time."],
    category: "tech",
    level: "B2"
  },
  {
    uz: "Do'konda xarid qilgandan so'ng har doim chekni saqlab qo'yish kerak.",
    enChunks: ["You should always", "keep the receipt", "after purchasing", "goods at the store."],
    category: "store",
    level: "A2"
  },
  {
    uz: "Restorandagi ofitsiant biz uchun ajoyib va mazali taom olib keldi.",
    enChunks: ["The polite waiter", "served us", "a remarkably delicious", "dinner."],
    category: "food",
    level: "A2"
  },
  {
    uz: "Shoshilinch vaziyatda darhol tez yordam xizmatiga qo'ng'iroq qiling.",
    enChunks: ["In an emergency,", "call an ambulance", "immediately", "without hesitation."],
    category: "health",
    level: "B1"
  },
  {
    uz: "Kompaniya rahbari barcha xodimlar bilan muhim yig'ilish o'tkazdi.",
    enChunks: ["The employer", "arranged an urgent meeting", "with all employees", "this morning."],
    category: "work",
    level: "B1"
  },
  {
    uz: "Shahar markazidagi tirbandlik tufayli biz tayinlagan uchrashuvga kech qoldik.",
    enChunks: ["Due to heavy traffic,", "we were late", "for our scheduled appointment", "downtown."],
    category: "street",
    level: "B1"
  },
  {
    uz: "Iqlim o'zgarishi butun dunyo bo'ylab yovvoyi tabiatga kuchli ta'sir qilmoqda.",
    enChunks: ["Global climate change", "is severely affecting", "wildlife and ecosystems", "around the world."],
    category: "nature",
    level: "B2"
  },
  {
    uz: "Rostini aytsam, men bu masalada sizning fikringizga butunlay qo'shilaman.",
    enChunks: ["To be honest,", "I couldn't agree more", "with your thoughtful opinion", "on this matter."],
    category: "daily",
    level: "B2"
  },
  {
    uz: "Ular yangi bo'sh ish o'rniga o'zlarining rezyumelarini topshirdilar.",
    enChunks: ["They submitted", "their updated CVs", "for the exciting vacancy", "yesterday."],
    category: "work",
    level: "A2"
  },
  {
    uz: "Biz kelajakda yangi maqsadlarga erishish uchun tinimsiz mehnat qilyapmiz.",
    enChunks: ["We are working hard", "every single day", "to achieve our long-term goals", "successfully."],
    category: "daily",
    level: "B1"
  }
];

class SentenceBuilderGame {
  constructor(containerId, onScoreUpdate) {
    this.container = document.getElementById(containerId);
    this.onScoreUpdate = onScoreUpdate;
    this.challenges = [];
    this.currentChallenge = null;
    this.selectedChunks = [];
    this.availableChunks = [];
    this.score = 0;
    this.round = 1;
    this.maxRounds = window.wordBank ? window.wordBank.selectedRoundsCount : 30; // 30, 50, 100
  }

  // 1,000 ta flashcard misol gaplaridan dinamik bloklar yasash
  buildDynamicChallenges() {
    const list = [...BASE_SENTENCE_CHALLENGES];

    if (window.FLASHCARDS_DATA && Array.isArray(window.FLASHCARDS_DATA)) {
      window.FLASHCARDS_DATA.forEach(fc => {
        if (!fc.example) return;
        const words = fc.example.trim().split(/\s+/);
        if (words.length >= 4 && words.length <= 12) {
          // 3 yoki 4 qismga bo'lish
          const chunkSize = Math.max(2, Math.floor(words.length / 3));
          const chunks = [];
          for (let i = 0; i < words.length; i += chunkSize) {
            chunks.push(words.slice(i, i + chunkSize).join(' '));
          }
          if (chunks.length >= 2) {
            list.push({
              uz: `So'z: ${fc.word.toUpperCase()} (${fc.uzb}) - gapni to'g'ri tartibda tering.`,
              enChunks: chunks,
              category: fc.category || 'daily',
              level: 'B1'
            });
          }
        }
      });
    }

    return list;
  }

  start(categoryId = 'all', customRounds = null) {
    this.maxRounds = customRounds || (window.wordBank ? window.wordBank.selectedRoundsCount : 30);
    this.score = 0;
    this.round = 1;

    let pool = this.buildDynamicChallenges();
    if (categoryId && categoryId !== 'all') {
      const filtered = pool.filter(c => c.category === categoryId);
      if (filtered.length >= 10) pool = filtered;
    }

    const shuffled = window.wordBank ? window.wordBank.cryptoShuffle(pool) : [...pool].sort(() => 0.5 - Math.random());
    this.challenges = shuffled.slice(0, this.maxRounds);
    this.loadRound();
  }

  loadRound() {
    if (this.round > this.maxRounds) {
      this.renderGameOver();
      return;
    }

    this.currentChallenge = this.challenges[(this.round - 1) % this.challenges.length];
    this.selectedChunks = [];

    // Chunks tayyorlash
    const rawChunks = this.currentChallenge.enChunks.map((text, idx) => ({
      id: `chunk_${idx}_${Math.random().toString(36).substring(4)}`,
      text: text,
      originalOrder: idx,
      used: false
    }));

    this.availableChunks = window.wordBank ? window.wordBank.cryptoShuffle(rawChunks) : rawChunks.sort(() => 0.5 - Math.random());

    this.renderUI();
  }

  renderUI() {
    const categoryInfo = CATEGORIES.find(c => c.id === this.currentChallenge.category) || { name: 'Muloqot', icon: '💬' };

    this.container.innerHTML = `
      <div class="game-card sentence-game-arena">
        <div class="game-header">
          <div class="badge-round">Gap ${this.round}/${this.maxRounds}</div>
          <div class="category-dynamic-badge">
            <span>${categoryInfo.icon}</span>
            <span>${categoryInfo.name}</span>
          </div>
          <div class="score-display">Ochko: <span class="highlight-score">${this.score}</span></div>
          <div class="points-badge">+100 ball</div>
        </div>

        <div class="sentence-instruction-card">
          <span class="arch-tag">O'ZBEKCHA MAZMUNI:</span>
          <h3 class="target-uz-sentence">"${this.currentChallenge.uz}"</h3>
        </div>

        <!-- Yig'ilayotgan gap maydoni -->
        <div class="assembled-sentence-strip" id="assembled-strip">
          ${this.selectedChunks.length === 0 ? `
            <div class="assembled-placeholder">Pastdagi bloklarni tartib bilan bosing...</div>
          ` : `
            ${this.selectedChunks.map(chunk => `
              <button class="chunk-tile assembled ios-button" data-chunk-id="${chunk.id}">
                <span>${chunk.text}</span>
                <span class="remove-x">✕</span>
              </button>
            `).join('')}
          `}
        </div>

        <!-- Mavjud bloklar -->
        <div class="available-chunks-grid" id="available-chunks">
          ${this.availableChunks.map(chunk => `
            <button class="chunk-tile available ios-button ${chunk.used ? 'used' : ''}" data-chunk-id="${chunk.id}" ${chunk.used ? 'disabled' : ''}>
              <span>${chunk.text}</span>
            </button>
          `).join('')}
        </div>

        <div class="sentence-actions-row">
          <button class="action-btn secondary ios-button" id="sentence-clear-btn">Tozalash 🔄</button>
          <button class="action-btn primary ios-button" id="sentence-check-btn">Tekshirish ✨</button>
        </div>

        <div class="feedback-banner" id="sentence-feedback" style="display:none;"></div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const availableBtns = this.container.querySelectorAll('.chunk-tile.available:not(.used)');
    availableBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const chunkId = btn.getAttribute('data-chunk-id');
        this.addChunk(chunkId);
      });
    });

    const assembledBtns = this.container.querySelectorAll('.chunk-tile.assembled');
    assembledBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const chunkId = btn.getAttribute('data-chunk-id');
        this.removeChunk(chunkId);
      });
    });

    document.getElementById('sentence-clear-btn')?.addEventListener('click', () => {
      if (window.soundEngine) window.soundEngine.buttonClick();
      this.selectedChunks = [];
      this.availableChunks.forEach(c => c.used = false);
      this.renderUI();
    });

    document.getElementById('sentence-check-btn')?.addEventListener('click', () => {
      this.checkSentence();
    });
  }

  addChunk(chunkId) {
    const chunk = this.availableChunks.find(c => c.id === chunkId);
    if (!chunk || chunk.used) return;

    chunk.used = true;
    this.selectedChunks.push(chunk);
    if (window.soundEngine) window.soundEngine.buttonClick();
    this.renderUI();

    if (this.selectedChunks.length === this.currentChallenge.enChunks.length) {
      setTimeout(() => this.checkSentence(), 300);
    }
  }

  removeChunk(chunkId) {
    const idx = this.selectedChunks.findIndex(c => c.id === chunkId);
    if (idx === -1) return;

    const removed = this.selectedChunks.splice(idx, 1)[0];
    removed.used = false;
    if (window.soundEngine) window.soundEngine.buttonClick();
    this.renderUI();
  }

  checkSentence() {
    if (this.selectedChunks.length !== this.currentChallenge.enChunks.length) {
      if (window.effectsEngine) window.effectsEngine.showFloatingReaction("Barcha bloklarni joylang! ⚠️", "Gap to'liq emas", "fail");
      return;
    }

    const isCorrect = this.selectedChunks.every((chunk, i) => chunk.originalOrder === i);
    const feedback = document.getElementById('sentence-feedback');
    const fullEnglishSentence = this.currentChallenge.enChunks.join(' ');

    if (isCorrect) {
      if (window.soundEngine) window.soundEngine.playCorrect();
      this.score += 100;
      if (this.onScoreUpdate) this.onScoreUpdate(this.score);

      if (window.effectsEngine) {
        window.effectsEngine.triggerSuccess(100);
      }

      if (feedback) {
        feedback.innerHTML = `
          <div class="feedback-success">
            <span class="icon">✓</span>
            <div>
              <strong>To'liq to'g'ri gap! +100 ball</strong>
              <p>${fullEnglishSentence}</p>
            </div>
            <button class="speaker-btn ios-speaker" onclick="window.soundEngine.speak('${fullEnglishSentence.replace(/'/g, "\\'")}')">🔊 Gapni Eshitish</button>
          </div>
        `;
        feedback.style.display = 'block';
      }

      if (window.soundEngine) window.soundEngine.speak(fullEnglishSentence);

      setTimeout(() => {
        this.round++;
        this.loadRound();
      }, 2300);

    } else {
      if (window.soundEngine) window.soundEngine.playWrong();
      if (window.effectsEngine) window.effectsEngine.triggerFail();

      const strip = document.getElementById('assembled-strip');
      strip?.classList.add('shake-wrong');

      if (feedback) {
        feedback.innerHTML = `
          <div class="feedback-error">
            <span class="icon">✕</span>
            <div>
              <strong>Grammatik tartibda xato bor!</strong>
              <p>Ingliz tilida tartib: Ega + Kesim + To'ldiruvchi + Holat. Qaytadan urinib ko'ring!</p>
            </div>
          </div>
        `;
        feedback.style.display = 'block';
      }

      setTimeout(() => {
        strip?.classList.remove('shake-wrong');
      }, 600);
    }
  }

  renderGameOver() {
    this.container.innerHTML = `
      <div class="game-over-card">
        <div class="trophy-icon">🏆</div>
        <h2>${this.maxRounds} Talik Gap Konstruktori Yakunlandi!</h2>
        <p class="final-score-text">To'plangan ball: <span class="highlight-score">${this.score}</span></p>
        <p class="score-subtext">Siz so'zlarni nafaqat alohida, balki butun jonli jumlalar ichida erkin qura olasiz!</p>
        <div class="game-over-actions">
          <button class="action-btn primary ios-button" id="sentence-restart-btn">Qaytadan o'ynash (${this.maxRounds})</button>
          <button class="action-btn secondary ios-button" onclick="window.app.switchTab('home')">Bosh sahifa</button>
        </div>
      </div>
    `;

    document.getElementById('sentence-restart-btn')?.addEventListener('click', () => {
      this.start();
    });
  }

  destroy() {}
}

window.SentenceBuilderGame = SentenceBuilderGame;


/**
 * Game 6: Lug'at Wordle (English-Uzbek Wordle)
 * 5-harfli inglizcha sirli so'z, 6 ta urinish, haqiqiy Wordle mexanikasi.
 * Har bir urinishdan so'ng harflar yashil/sariq/kulrang bo'ladi.
 * Topilgach o'zbekcha tarjima, audio talaffuz va misol gap ochiladi!
 */

class WordleGame {
  constructor(containerId, onScoreUpdate) {
    this.container = document.getElementById(containerId);
    this.onScoreUpdate = onScoreUpdate;
    this.wordLength = 5;
    this.maxGuesses = 6;
    this.currentGuess = '';
    this.guesses = []; // array of strings
    this.evaluations = []; // array of array of status: 'correct'|'present'|'absent'
    this.targetWordObj = null;
    this.targetWord = '';
    this.isGameOver = false;
    this.keyStatuses = {}; // letter -> status
    this.boundKeyHandler = this.handleKeyDown.bind(this);
  }

  start(categoryId = 'all') {
    this.isGameOver = false;
    this.currentGuess = '';
    this.guesses = [];
    this.evaluations = [];
    this.keyStatuses = {};

    // Select candidate 5-letter words without spaces or special characters
    let candidates = window.wordBank ? window.wordBank.words : [];
    if (categoryId && categoryId !== 'all') {
      const catWords = candidates.filter(w => w.category === categoryId);
      if (catWords.length >= 10) candidates = catWords;
    }

    const fiveLetterPool = candidates.filter(w => {
      const clean = w.word.trim().toUpperCase();
      return clean.length === 5 && /^[A-Z]{5}$/.test(clean);
    });

    if (fiveLetterPool.length > 0) {
      const shuffled = window.wordBank ? window.wordBank.cryptoShuffle(fiveLetterPool) : fiveLetterPool;
      this.targetWordObj = shuffled[0];
    } else {
      // Fallback 5-letter words
      const defaults = [
        { word: 'HEART', translation: 'Yurak', definition: 'Qon haydovchi tana a\'zosi', fullExample: 'Listen to your heart.', phonetic: '/hɑːrt/' },
        { word: 'SMART', translation: 'Aqlli', definition: 'Ziyrak, dono', fullExample: 'She is very smart.', phonetic: '/smɑːrt/' },
        { word: 'EARTH', translation: 'Yer', definition: 'Biz yashaydigan sayyora', fullExample: 'The earth orbits the sun.', phonetic: '/ɜːrθ/' },
        { word: 'PLANT', translation: 'O\'simlik', definition: 'Yashil tabiat ko\'rki', fullExample: 'Water the green plant.', phonetic: '/plænt/' },
        { word: 'DREAM', translation: 'Orzu / Tush', definition: 'Kutilgan maqsad', fullExample: 'Follow your dream.', phonetic: '/driːm/' }
      ];
      this.targetWordObj = defaults[Math.floor(Math.random() * defaults.length)];
    }

    this.targetWord = this.targetWordObj.word.toUpperCase();
    console.log(`[Wordle] Target Word selected: ${this.targetWord}`);

    window.removeEventListener('keydown', this.boundKeyHandler);
    window.addEventListener('keydown', this.boundKeyHandler);

    this.render();
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="wordle-arena ios-glass-panel">
        
        <!-- Yuqori qism: Yo'riqnoma va Maslahat -->
        <div class="wordle-header">
          <div class="wordle-badge">🟩 LUG'AT WORDLE // 5 HARF</div>
          <p class="wordle-hint">
            Sirli 5 harfli inglizcha so'zni 6 urinishda toping. Har bir harakatdan so'ng ranglar yo'l ko'rsatadi:
          </p>
          <div class="wordle-legend">
            <span class="legend-chip green">Yashil: To'g'ri o'rinda</span>
            <span class="legend-chip yellow">Sariq: Boshqa o'rinda</span>
            <span class="legend-chip gray">Kulrang: So'zda yo'q</span>
          </div>
        </div>

        <!-- 6x5 Wordle Kataklari To'ri -->
        <div class="wordle-grid" id="wordle-grid">
          ${this.renderGridRows()}
        </div>

        <!-- Bildirishnoma / Tarjima kartochkasi -->
        <div id="wordle-result-container"></div>

        <!-- Virtual QWERTY Keyboard (Smartfonlar va Touch uchun) -->
        <div class="wordle-keyboard" id="wordle-keyboard">
          ${this.renderVirtualKeyboard()}
        </div>

      </div>
    `;
  }

  renderGridRows() {
    let rowsHtml = '';

    for (let r = 0; r < this.maxGuesses; r++) {
      const isCurrentRow = r === this.guesses.length && !this.isGameOver;
      const isSubmittedRow = r < this.guesses.length;
      const submittedGuess = this.guesses[r] || '';
      const rowEvals = this.evaluations[r] || [];

      rowsHtml += `<div class="wordle-row ${isCurrentRow ? 'current-row' : ''}">`;

      for (let c = 0; c < this.wordLength; c++) {
        let letter = '';
        let tileClass = 'wordle-tile';

        if (isSubmittedRow) {
          letter = submittedGuess[c] || '';
          tileClass += ` submitted ${rowEvals[c] || 'absent'}`;
        } else if (isCurrentRow) {
          letter = this.currentGuess[c] || '';
          if (letter) tileClass += ' filled';
        }

        rowsHtml += `
          <div class="${tileClass}" style="animation-delay: ${c * 100}ms">
            ${letter}
          </div>
        `;
      }

      rowsHtml += `</div>`;
    }

    return rowsHtml;
  }

  renderVirtualKeyboard() {
    const rows = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
    ];

    return rows.map(row => `
      <div class="wordle-kb-row">
        ${row.map(k => {
          const status = this.keyStatuses[k] || '';
          const isSpecial = k === 'ENTER' || k === '⌫';
          return `
            <button class="wordle-key ${status} ${isSpecial ? 'special-key' : ''} ios-button"
                    onclick="window.activeWordleGame && window.activeWordleGame.handleKeyInput('${k}')">
              ${k}
            </button>
          `;
        }).join('')}
      </div>
    `).join('');
  }

  updateGrid() {
    const gridEl = document.getElementById('wordle-grid');
    if (gridEl) {
      gridEl.innerHTML = this.renderGridRows();
    }
    const kbEl = document.getElementById('wordle-keyboard');
    if (kbEl) {
      kbEl.innerHTML = this.renderVirtualKeyboard();
    }
  }

  handleKeyDown(e) {
    if (this.isGameOver) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      this.submitGuess();
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      this.deleteLetter();
    } else if (/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
      this.inputLetter(e.key.toUpperCase());
    }
  }

  handleKeyInput(key) {
    if (this.isGameOver) return;

    if (key === 'ENTER') {
      this.submitGuess();
    } else if (key === '⌫') {
      this.deleteLetter();
    } else {
      this.inputLetter(key);
    }
  }

  inputLetter(letter) {
    if (this.currentGuess.length < this.wordLength) {
      this.currentGuess += letter;
      this.updateGrid();
      if (window.soundEngine) window.soundEngine.buttonClick();
    }
  }

  deleteLetter() {
    if (this.currentGuess.length > 0) {
      this.currentGuess = this.currentGuess.slice(0, -1);
      this.updateGrid();
      if (window.soundEngine) window.soundEngine.buttonClick();
    }
  }

  submitGuess() {
    if (this.currentGuess.length !== this.wordLength) {
      this.showToast('5 ta harf kiriting!');
      if (window.soundEngine) window.soundEngine.playWrong();
      return;
    }

    const guess = this.currentGuess;
    const target = this.targetWord;

    // Evaluation with proper duplicate letters tracking
    const evals = new Array(this.wordLength).fill('absent');
    const targetLetterCounts = {};

    for (let i = 0; i < this.wordLength; i++) {
      const char = target[i];
      targetLetterCounts[char] = (targetLetterCounts[char] || 0) + 1;
    }

    // Step 1: Green matches
    for (let i = 0; i < this.wordLength; i++) {
      if (guess[i] === target[i]) {
        evals[i] = 'correct';
        targetLetterCounts[guess[i]]--;
      }
    }

    // Step 2: Yellow matches
    for (let i = 0; i < this.wordLength; i++) {
      if (evals[i] !== 'correct') {
        const char = guess[i];
        if (targetLetterCounts[char] > 0) {
          evals[i] = 'present';
          targetLetterCounts[char]--;
        }
      }
    }

    // Update keyboard statuses
    for (let i = 0; i < this.wordLength; i++) {
      const char = guess[i];
      const status = evals[i];
      const current = this.keyStatuses[char];
      if (status === 'correct') {
        this.keyStatuses[char] = 'correct';
      } else if (status === 'present' && current !== 'correct') {
        this.keyStatuses[char] = 'present';
      } else if (!current) {
        this.keyStatuses[char] = 'absent';
      }
    }

    this.guesses.push(guess);
    this.evaluations.push(evals);
    this.currentGuess = '';

    this.updateGrid();

    // Check Win
    if (guess === target) {
      this.isGameOver = true;
      if (window.soundEngine) {
        window.soundEngine.playSuccess();
        window.soundEngine.playLevelUp();
      }
      if (window.effectsEngine) {
        window.effectsEngine.burstConfetti();
        window.effectsEngine.triggerComboPill();
      }
      if (this.onScoreUpdate) this.onScoreUpdate(100 - (this.guesses.length - 1) * 15);
      this.renderGameOver(true);
      return;
    }

    // Check Loss
    if (this.guesses.length >= this.maxGuesses) {
      this.isGameOver = true;
      if (window.soundEngine) window.soundEngine.playWrong();
      
      // Xatolar sandig'iga qo'shish
      if (window.app && window.app.addMistakeWord) {
        window.app.addMistakeWord(this.targetWordObj);
      }

      this.renderGameOver(false);
      return;
    }

    if (window.soundEngine) window.soundEngine.playClick();
  }

  showToast(msg) {
    const resBox = document.getElementById('wordle-result-container');
    if (!resBox) return;
    resBox.innerHTML = `<div class="wordle-toast">${msg}</div>`;
    setTimeout(() => {
      if (resBox.innerHTML.includes(msg)) resBox.innerHTML = '';
    }, 2000);
  }

  renderGameOver(isWon) {
    const resBox = document.getElementById('wordle-result-container');
    if (!resBox) return;

    const safeWord = this.targetWordObj.word.replace(/'/g, "\\'");
    resBox.innerHTML = `
      <div class="wordle-reveal-card ${isWon ? 'won' : 'lost'} ios-glass-panel">
        <div class="wordle-reveal-header">
          <span class="reveal-badge">${isWon ? '🎉 TABRIKLAYMIZ! TOPDINGIZ!' : '⌛ KEYINGI SAFAR TOPASIZ!'}</span>
          <button class="wordle-speak-btn ios-button" onclick="window.soundEngine.speak('${safeWord}')">
            🔊 Tinglash
          </button>
        </div>

        <h3 class="wordle-reveal-en">${this.targetWordObj.word}</h3>
        <p class="wordle-reveal-phonetic">${this.targetWordObj.phonetic || ''}</p>
        
        <div class="wordle-trans-box">
          <span class="label">O'zbekcha tarjimasi:</span>
          <strong class="val">${this.targetWordObj.translation || this.targetWordObj.definition}</strong>
        </div>

        ${this.targetWordObj.fullExample ? `
          <div class="wordle-example-box">
            <span class="label">Misol gap:</span>
            <p class="example-text">"${this.targetWordObj.fullExample}"</p>
          </div>
        ` : ''}

        <div class="wordle-action-row">
          <button class="wordle-next-btn ios-button" onclick="window.activeWordleGame && window.activeWordleGame.start()">
            Keyingi So'z ➔
          </button>
        </div>
      </div>
    `;

    // Speak word
    if (window.soundEngine) {
      setTimeout(() => window.soundEngine.speak(this.targetWordObj.word), 400);
    }
  }

  destroy() {
    window.removeEventListener('keydown', this.boundKeyHandler);
    window.activeWordleGame = null;
    if (this.container) this.container.innerHTML = '';
  }
}

window.WordleGame = WordleGame;


/**
 * Game 7: Audio Detektiv (Listening Quiz / Tinglab Top)
 * 30, 50, 100 talik Marafon rejimi.
 * So'z ekranda ko'rinmaydi, faqat audio eshittiriladi.
 * Foydalanuvchi eshitib, 4 ta o'zbekcha variantdan to'g'risini topishi kerak.
 * Listening va so'z talaffuzini eslab qolishni 3 barobar tezlashtiradi!
 */

class AudioDetectiveGame {
  constructor(containerId, onScoreUpdate) {
    this.container = document.getElementById(containerId);
    this.onScoreUpdate = onScoreUpdate;
    this.wordsList = [];
    this.currentWord = null;
    this.round = 1;
    this.maxRounds = window.wordBank ? window.wordBank.selectedRoundsCount : 30;
    this.score = 0;
    this.isAnswered = false;
    this.timer = null;
    this.timeLeft = 12;
  }

  start(categoryId = 'all', customRounds = null) {
    this.maxRounds = customRounds || (window.wordBank ? window.wordBank.selectedRoundsCount : 30);
    this.round = 1;
    this.score = 0;

    if (categoryId === 'all') {
      this.wordsList = window.wordBank.getMixedCategoryWords(this.maxRounds);
    } else {
      this.wordsList = window.wordBank.getWords(this.maxRounds, categoryId);
    }

    this.loadRound();
  }

  loadRound() {
    if (this.round > this.maxRounds || this.round > this.wordsList.length) {
      this.renderGameOver();
      return;
    }

    this.currentWord = this.wordsList[this.round - 1];
    this.isAnswered = false;
    this.timeLeft = 12;

    // 4 ta variant (1 to'g'ri, 3 distractor)
    const distractors = window.wordBank.getDistractors(this.currentWord, 3);
    const options = window.wordBank.cryptoShuffle([this.currentWord, ...distractors]);

    this.render(options);

    // So'zni avtomatik talaffuz qilish
    setTimeout(() => {
      this.playAudio();
    }, 300);

    this.startTimer();
  }

  startTimer() {
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.timeLeft--;
      const timerEl = document.getElementById('audio-timer-val');
      const timerBar = document.getElementById('audio-timer-progress');
      if (timerEl) timerEl.innerText = `${this.timeLeft}s`;
      if (timerBar) timerBar.style.width = `${(this.timeLeft / 12) * 100}%`;

      if (this.timeLeft <= 0) {
        clearInterval(this.timer);
        this.handleTimeout();
      }
    }, 1000);
  }

  playAudio() {
    if (!this.currentWord) return;
    if (window.soundEngine) {
      window.soundEngine.speak(this.currentWord.word);
    }
    
    // Wave animation
    const waveEl = document.getElementById('audio-wave-anim');
    if (waveEl) {
      waveEl.classList.add('playing');
      setTimeout(() => waveEl.classList.remove('playing'), 1500);
    }
  }

  render(options) {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="audio-detective-arena ios-glass-panel">
        
        <!-- Yuqori panel: Raund va Taymer -->
        <div class="audio-top-bar">
          <div class="audio-round-pill">
            🎧 Raund: <strong>${this.round} / ${this.maxRounds}</strong>
          </div>
          <div class="audio-timer-pill">
            ⏱️ <span id="audio-timer-val">12s</span>
          </div>
        </div>

        <div class="audio-timer-track">
          <div class="audio-timer-progress" id="audio-timer-progress" style="width: 100%"></div>
        </div>

        <!-- O'rta qism: Dinamik Audio Soundwave Tugmasi -->
        <div class="audio-sound-center">
          <div class="audio-wave-box" id="audio-wave-anim">
            <span class="wave-bar"></span>
            <span class="wave-bar"></span>
            <span class="wave-bar"></span>
            <span class="wave-bar"></span>
            <span class="wave-bar"></span>
          </div>

          <button class="audio-big-speak-btn ios-button" onclick="window.activeAudioDetective && window.activeAudioDetective.playAudio()">
            <span class="speaker-icon">🔊</span>
            <span class="btn-text">Qayta Tinglash</span>
          </button>
          
          <p class="audio-sub-hint">Talaffuzni diqqat bilan eshiting va to'g'ri tarjimani tanlang!</p>
        </div>

        <!-- 4 ta variantlar to'ri -->
        <div class="audio-options-grid">
          ${options.map((opt, idx) => `
            <button class="audio-opt-btn ios-button" id="opt-btn-${opt.id}"
                    onclick="window.activeAudioDetective && window.activeAudioDetective.checkAnswer(${opt.id})">
              <span class="opt-num">${['A', 'B', 'C', 'D'][idx]}</span>
              <span class="opt-trans">${opt.translation || opt.definition}</span>
            </button>
          `).join('')}
        </div>

        <!-- Natija va So'z ochilishi -->
        <div id="audio-feedback-zone"></div>

      </div>
    `;
  }

  checkAnswer(chosenId) {
    if (this.isAnswered) return;
    this.isAnswered = true;
    clearInterval(this.timer);

    const isCorrect = chosenId === this.currentWord.id;
    const chosenBtn = document.getElementById(`opt-btn-${chosenId}`);
    const correctBtn = document.getElementById(`opt-btn-${this.currentWord.id}`);

    if (isCorrect) {
      if (chosenBtn) chosenBtn.classList.add('correct');
      const pts = 50 + this.timeLeft * 5;
      this.score += pts;
      if (this.onScoreUpdate) this.onScoreUpdate(pts);

      if (window.soundEngine) window.soundEngine.playSuccess();
      if (window.effectsEngine) {
        window.effectsEngine.triggerComboPill();
      }
    } else {
      if (chosenBtn) chosenBtn.classList.add('wrong');
      if (correctBtn) correctBtn.classList.add('correct');
      if (window.soundEngine) window.soundEngine.playWrong();

      // Xatolar sandig'iga qo'shish
      if (window.app && window.app.addMistakeWord) {
        window.app.addMistakeWord(this.currentWord);
      }
    }

    this.showFeedback(isCorrect);
  }

  handleTimeout() {
    if (this.isAnswered) return;
    this.isAnswered = true;

    const correctBtn = document.getElementById(`opt-btn-${this.currentWord.id}`);
    if (correctBtn) correctBtn.classList.add('correct');
    if (window.soundEngine) window.soundEngine.playWrong();

    // Xatolar sandig'iga qo'shish
    if (window.app && window.app.addMistakeWord) {
      window.app.addMistakeWord(this.currentWord);
    }

    this.showFeedback(false, true);
  }

  showFeedback(isCorrect, isTimeout = false) {
    const zone = document.getElementById('audio-feedback-zone');
    if (!zone) return;

    zone.innerHTML = `
      <div class="audio-feedback-card ${isCorrect ? 'won' : 'lost'} ios-glass-panel">
        <div class="feedback-text-row">
          <span class="badge">${isCorrect ? '✓ TO\'G\'RI TOPDINGIZ!' : (isTimeout ? '⏰ VAQT TUGADI!' : '✕ XATO BO\'LDI!')}</span>
          <span class="word-reveal">Sirli so'z: <strong>${this.currentWord.word}</strong></span>
        </div>
        <p class="feedback-example">"${this.currentWord.fullExample || this.currentWord.sentence}"</p>
        <button class="audio-next-round-btn ios-button" onclick="window.activeAudioDetective && window.activeAudioDetective.nextRound()">
          Keyingi Raund ➔
        </button>
      </div>
    `;
  }

  nextRound() {
    this.round++;
    this.loadRound();
  }

  renderGameOver() {
    clearInterval(this.timer);
    if (!this.container) return;

    if (window.soundEngine) window.soundEngine.playLevelUp();
    if (window.effectsEngine) window.effectsEngine.burstConfetti();

    this.container.innerHTML = `
      <div class="audio-game-over ios-glass-panel">
        <div class="game-over-icon">🏆</div>
        <h3>MARAFON YAKUNLANDI!</h3>
        <p class="final-score-text">To'plangan ball: <strong>${this.score} XP</strong></p>
        <p class="final-desc">Siz ${this.maxRounds} ta so'zning audio talaffuzini tinglab, ularning tarjimasini mashq qildingiz!</p>
        <div class="game-over-actions">
          <button class="ios-action-button" onclick="window.activeAudioDetective && window.activeAudioDetective.start()">
            Qayta O'ynash 🔄
          </button>
          <button class="ios-action-button secondary" onclick="window.app.switchTab('home')">
            Bosh Sahifa 🏠
          </button>
        </div>
      </div>
    `;
  }

  destroy() {
    clearInterval(this.timer);
    window.activeAudioDetective = null;
    if (this.container) this.container.innerHTML = '';
  }
}

window.AudioDetectiveGame = AudioDetectiveGame;


/**
 * Game 9: Word Search Matrix (Krossvord & So'z Qidirish To'ri)
 * 10x10 harflar matritsasi. Ekranda inglizcha so'zlarning o'zbekcha tarjimalari beriladi.
 * Foydalanuvchi barmoq yoki sichqoncha bilan harflarni chizib (gorizontal, vertikal, diagonal)
 * yashiringan so'zlarni topadi. Neon binafsha va zumrad rangli iOS glassmorphism effektlari.
 */

class WordSearchGame {
  constructor(containerId, onScoreUpdate) {
    this.container = document.getElementById(containerId);
    this.onScoreUpdate = onScoreUpdate;
    this.gridSize = 10;
    this.grid = []; // 2D array [row][col] of chars
    this.wordsToFind = []; // array of { word, translation, found, cells: [{r, c}] }
    this.isSelecting = false;
    this.startCell = null; // { r, c }
    this.currentLineCells = []; // array of { r, c }
    this.foundWordsCount = 0;
    this.boundPointerUp = this.handlePointerUp.bind(this);
  }

  start(categoryId = 'all') {
    this.foundWordsCount = 0;
    this.isSelecting = false;
    this.startCell = null;
    this.currentLineCells = [];

    // Pick 5-6 appropriate words (length 4 to 8 letters, alphabetic only)
    this.wordsToFind = this.selectPuzzleWords(categoryId, 6);
    this.generateMatrix();
    this.render();
    this.bindEvents();

    if (window.soundEngine) {
      if (typeof window.soundEngine.gameStart === 'function') window.soundEngine.gameStart();
      else if (typeof window.soundEngine.buttonClick === 'function') window.soundEngine.buttonClick();
    }
  }

  selectPuzzleWords(categoryId, count = 6) {
    let pool = window.wordBank ? window.wordBank.words : [];
    if (categoryId && categoryId !== 'all') {
      const filtered = pool.filter(w => w.category === categoryId);
      if (filtered.length >= 10) pool = filtered;
    }

    // Filter words suitable for a 10x10 grid (length 4 to 8, only letters A-Z)
    const validWords = pool.filter(w => {
      const clean = (w.word || '').trim().toUpperCase();
      return clean.length >= 4 && clean.length <= 8 && /^[A-Z]+$/.test(clean);
    });

    const shuffled = window.wordBank ? window.wordBank.cryptoShuffle(validWords) : validWords;
    const selected = [];
    const usedWords = new Set();

    for (const item of shuffled) {
      const upper = item.word.trim().toUpperCase();
      if (!usedWords.has(upper)) {
        usedWords.add(upper);
        selected.push({
          word: upper,
          translation: item.translation || item.definition || 'Tarjima',
          found: false,
          cells: []
        });
        if (selected.length >= count) break;
      }
    }

    // Fallbacks if pool was too small
    if (selected.length < count) {
      const defaults = [
        { word: 'ACHIEVE', translation: 'erishmoq' },
        { word: 'BENEFIT', translation: 'foyda' },
        { word: 'DECIDE', translation: 'qaror qilmoq' },
        { word: 'FUTURE', translation: 'kelajak' },
        { word: 'NATURE', translation: 'tabiat' },
        { word: 'SHADOW', translation: 'soya' }
      ];
      for (const d of defaults) {
        if (!usedWords.has(d.word)) {
          selected.push({ ...d, found: false, cells: [] });
          if (selected.length >= count) break;
        }
      }
    }

    return selected;
  }

  generateMatrix() {
    const size = this.gridSize;
    this.grid = Array.from({ length: size }, () => Array(size).fill(''));

    // Placement directions: [dr, dc]
    const directions = [
      [0, 1],   // Horiz Left-to-Right
      [1, 0],   // Vert Top-to-Bottom
      [1, 1],   // Diag Down-Right
      [-1, 1],  // Diag Up-Right
      [0, -1],  // Horiz Right-to-Left (rare)
      [-1, 0]   // Vert Bottom-to-Top (rare)
    ];

    const successfullyPlaced = [];

    // Sort longest words first for higher placement success rate
    const sortedWords = [...this.wordsToFind].sort((a, b) => b.word.length - a.word.length);

    for (const item of sortedWords) {
      const word = item.word;
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 250) {
        attempts++;
        // Choose direction (bias toward horiz & vert for cleaner puzzle experience)
        const dirIndex = Math.random() < 0.75 ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * directions.length);
        const [dr, dc] = directions[dirIndex];

        // Pick starting coordinates
        const minR = dr < 0 ? (word.length - 1) : 0;
        const maxR = dr > 0 ? (size - word.length) : (size - 1);
        const minC = dc < 0 ? (word.length - 1) : 0;
        const maxC = dc > 0 ? (size - word.length) : (size - 1);

        if (minR > maxR || minC > maxC) continue;

        const startR = Math.floor(Math.random() * (maxR - minR + 1)) + minR;
        const startC = Math.floor(Math.random() * (maxC - minC + 1)) + minC;

        // Check if word fits without conflicting with existing letters
        let canPlace = true;
        const candidateCells = [];

        for (let i = 0; i < word.length; i++) {
          const r = startR + dr * i;
          const c = startC + dc * i;
          const currentCell = this.grid[r][c];

          if (currentCell !== '' && currentCell !== word[i]) {
            canPlace = false;
            break;
          }
          candidateCells.push({ r, c });
        }

        if (canPlace) {
          for (let i = 0; i < word.length; i++) {
            const { r, c } = candidateCells[i];
            this.grid[r][c] = word[i];
          }
          item.cells = candidateCells;
          successfullyPlaced.push(item);
          placed = true;
        }
      }
    }

    // Keep only placed words in active list
    this.wordsToFind = successfullyPlaced;

    // Fill remaining empty cells with random letters
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    // Frequency biased alphabet for natural appearance
    const weightedAlphabet = 'EEEEAAAAIIIOOONNNRRRTTTSSSLLLDDDGGGBCFHJKMPQUVWXYZ';

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (this.grid[r][c] === '') {
          const randChar = weightedAlphabet[Math.floor(Math.random() * weightedAlphabet.length)] || alphabet[Math.floor(Math.random() * alphabet.length)];
          this.grid[r][c] = randChar;
        }
      }
    }
  }

  render() {
    if (!this.container) return;

    const size = this.gridSize;
    let gridHtml = '';

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const letter = this.grid[r][c];
        gridHtml += `
          <div class="ws-cell" data-row="${r}" data-col="${c}">
            <span class="ws-letter">${letter}</span>
          </div>
        `;
      }
    }

    const cluesHtml = this.wordsToFind.map((item, idx) => `
      <div class="ws-clue-item ${item.found ? 'found' : ''}" data-word-idx="${idx}" onclick="window.soundEngine && window.soundEngine.speakWord('${item.word}')">
        <span class="ws-clue-status">${item.found ? '✓' : '○'}</span>
        <div class="ws-clue-info">
          <span class="ws-clue-uzbek">${item.translation}</span>
          <span class="ws-clue-eng">${item.found ? item.word : `${item.word.length} ta harf`}</span>
        </div>
        <span class="ws-clue-speaker" title="Talaffuzni eshitish">🔊</span>
      </div>
    `).join('');

    this.container.innerHTML = `
      <div class="ws-arena-wrapper ios-glass-panel">
        
        <!-- Header HUD -->
        <div class="ws-header-hud">
          <div class="ws-progress-box">
            <span class="ws-hud-label">Topilgan so'zlar:</span>
            <span class="ws-hud-val" id="ws-found-count">${this.foundWordsCount} / ${this.wordsToFind.length}</span>
          </div>
          
          <div class="ws-live-selection-pill" id="ws-live-selection">
            <span class="ws-sel-placeholder">Harflarni ustidan barmog'ingiz bilan chizing</span>
          </div>

          <button class="ws-restart-btn ios-button" id="ws-restart-btn">
            🔄 Yangi To'r
          </button>
        </div>

        <!-- Main Play Area: Matrix Grid & Clues Panel -->
        <div class="ws-play-area">
          
          <!-- 10x10 Matrix Board -->
          <div class="ws-grid-board-container">
            <div class="ws-grid-board" id="ws-grid-board" style="--grid-size: ${size};">
              ${gridHtml}
            </div>
            <div class="ws-swipe-hint">💡 Gorizontal, vertikal yoki diagonal yo'nalishda chizing</div>
          </div>

          <!-- Target Words & Uzbek Clues -->
          <div class="ws-clues-panel">
            <div class="ws-clues-header">
              <span class="ws-clues-title">🎯 Yashiringan So'zlar:</span>
              <span class="ws-clues-sub">O'zbekcha ma'nosi bo'yicha toping</span>
            </div>
            <div class="ws-clues-list" id="ws-clues-list">
              ${cluesHtml}
            </div>
          </div>

        </div>

      </div>
    `;

    document.getElementById('ws-restart-btn')?.addEventListener('click', () => {
      this.start(window.app ? window.app.selectedCategory : 'all');
    });
  }

  bindEvents() {
    const board = document.getElementById('ws-grid-board');
    if (!board) return;

    // Pointer events (unifies mouse and touch dragging across iOS and Android)
    board.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
    board.addEventListener('pointermove', (e) => this.handlePointerMove(e));
    window.addEventListener('pointerup', this.boundPointerUp);
    window.addEventListener('pointercancel', this.boundPointerUp);
  }

  getCellFromPoint(clientX, clientY) {
    const target = document.elementFromPoint(clientX, clientY);
    if (!target) return null;
    const cellEl = target.closest('.ws-cell');
    if (!cellEl) return null;
    const r = parseInt(cellEl.getAttribute('data-row'), 10);
    const c = parseInt(cellEl.getAttribute('data-col'), 10);
    if (isNaN(r) || isNaN(c)) return null;
    return { r, c, el: cellEl };
  }

  handlePointerDown(e) {
    e.preventDefault();
    const cell = this.getCellFromPoint(e.clientX, e.clientY);
    if (!cell) return;

    this.isSelecting = true;
    this.startCell = { r: cell.r, c: cell.c };
    this.currentLineCells = [this.startCell];
    this.updateSelectionDisplay();

    if (window.soundEngine) window.soundEngine.cardHover();
  }

  handlePointerMove(e) {
    if (!this.isSelecting || !this.startCell) return;
    e.preventDefault();

    const currentCell = this.getCellFromPoint(e.clientX, e.clientY);
    if (!currentCell) return;

    // Calculate line from startCell to currentCell
    const line = this.getStraightLine(this.startCell, currentCell);
    if (line) {
      this.currentLineCells = line;
      this.updateSelectionDisplay();
    }
  }

  getStraightLine(start, end) {
    const dr = end.r - start.r;
    const dc = end.c - start.c;

    // Check if movement is along a straight line:
    // Horizontal (dr === 0), Vertical (dc === 0), or Diagonal (abs(dr) === abs(dc))
    const isHoriz = dr === 0;
    const isVert = dc === 0;
    const isDiag = Math.abs(dr) === Math.abs(dc);

    if (!isHoriz && !isVert && !isDiag) {
      return null; // Not a straight line
    }

    const steps = Math.max(Math.abs(dr), Math.abs(dc));
    if (steps === 0) return [start];

    const stepR = dr === 0 ? 0 : dr / steps;
    const stepC = dc === 0 ? 0 : dc / steps;

    const line = [];
    for (let i = 0; i <= steps; i++) {
      line.push({
        r: start.r + stepR * i,
        c: start.c + stepC * i
      });
    }

    return line;
  }

  updateSelectionDisplay() {
    // Clear previous selecting highlight (without affecting permanently found cells)
    const board = document.getElementById('ws-grid-board');
    if (!board) return;

    board.querySelectorAll('.ws-cell.selecting').forEach(el => el.classList.remove('selecting'));

    let selectedChars = '';
    for (const pos of this.currentLineCells) {
      const cellEl = board.querySelector(`.ws-cell[data-row="${pos.r}"][data-col="${pos.c}"]`);
      if (cellEl) cellEl.classList.add('selecting');
      selectedChars += (this.grid[pos.r] && this.grid[pos.r][pos.c]) || '';
    }

    // Update live HUD selection pill
    const hudPill = document.getElementById('ws-live-selection');
    if (hudPill) {
      if (selectedChars.length > 0) {
        hudPill.innerHTML = `<span class="ws-sel-active">${selectedChars}</span>`;
      } else {
        hudPill.innerHTML = `<span class="ws-sel-placeholder">Harflarni chizing</span>`;
      }
    }
  }

  handlePointerUp(e) {
    if (!this.isSelecting) return;
    this.isSelecting = false;

    // Extract selected word string
    let formedWord = '';
    for (const pos of this.currentLineCells) {
      formedWord += (this.grid[pos.r] && this.grid[pos.r][pos.c]) || '';
    }
    const reversedWord = formedWord.split('').reverse().join('');

    // Check if formedWord or reversedWord matches any unfound target word
    const matchItem = this.wordsToFind.find(item => !item.found && (item.word === formedWord || item.word === reversedWord));

    if (matchItem) {
      // SUCCESS: Word found!
      matchItem.found = true;
      this.foundWordsCount++;

      // Play success audio & score
      if (window.soundEngine) {
        if (typeof window.soundEngine.playCorrect === 'function') window.soundEngine.playCorrect();
        else if (typeof window.soundEngine.match === 'function') window.soundEngine.match();
      }
      if (this.onScoreUpdate) {
        this.onScoreUpdate(40, { word: matchItem.word, reason: 'wordsearch_found' });
      }

      // Mark permanently found cells on board
      const board = document.getElementById('ws-grid-board');
      if (board) {
        for (const pos of this.currentLineCells) {
          const cellEl = board.querySelector(`.ws-cell[data-row="${pos.r}"][data-col="${pos.c}"]`);
          if (cellEl) {
            cellEl.classList.remove('selecting');
            cellEl.classList.add('found');
          }
        }
      }

      // Update HUD count
      const countEl = document.getElementById('ws-found-count');
      if (countEl) countEl.innerText = `${this.foundWordsCount} / ${this.wordsToFind.length}`;

      // Update clue item
      const clueIdx = this.wordsToFind.indexOf(matchItem);
      const clueEl = document.querySelector(`.ws-clue-item[data-word-idx="${clueIdx}"]`);
      if (clueEl) {
        clueEl.classList.add('found');
        clueEl.querySelector('.ws-clue-status').innerText = '✓';
        clueEl.querySelector('.ws-clue-eng').innerText = matchItem.word;
      }

      // Speak word pronunciation
      if (window.soundEngine) {
        const speaker = window.soundEngine.speak || window.soundEngine.speakWord;
        if (typeof speaker === 'function') {
          setTimeout(() => speaker.call(window.soundEngine, matchItem.word), 250);
        }
      }

      // Check if board complete
      if (this.foundWordsCount >= this.wordsToFind.length) {
        this.handlePuzzleComplete();
      }

    } else {
      // MISSED: Clear selection
      const board = document.getElementById('ws-grid-board');
      if (board) {
        board.querySelectorAll('.ws-cell.selecting').forEach(el => el.classList.remove('selecting'));
      }
    }

    // Reset selection state
    this.startCell = null;
    this.currentLineCells = [];
    const hudPill = document.getElementById('ws-live-selection');
    if (hudPill && this.foundWordsCount < this.wordsToFind.length) {
      hudPill.innerHTML = `<span class="ws-sel-placeholder">Harflarni ustidan barmog'ingiz bilan chizing</span>`;
    }
  }

  handlePuzzleComplete() {
    if (window.soundEngine) {
      if (typeof window.soundEngine.playLevelUp === 'function') window.soundEngine.playLevelUp();
      else if (typeof window.soundEngine.levelUp === 'function') window.soundEngine.levelUp();
    }
    if (window.effectsEngine) window.effectsEngine.triggerConfetti();

    if (this.onScoreUpdate) {
      this.onScoreUpdate(150, { reason: 'wordsearch_board_cleared' });
    }

    const hudPill = document.getElementById('ws-live-selection');
    if (hudPill) {
      hudPill.innerHTML = `<span class="ws-sel-win">🎉 TABRIKLAYMIZ! BARCHA SO'ZLAR TOPILDI (+150 XP)</span>`;
    }

    // Show completion modal or banner
    setTimeout(() => {
      const board = document.getElementById('ws-grid-board');
      if (board) {
        const winBanner = document.createElement('div');
        winBanner.className = 'ws-victory-overlay ios-glass-panel';
        winBanner.innerHTML = `
          <div class="ws-victory-badge">👑 MATRITSA ZABT ETILDI!</div>
          <h3>Ajoyib Natija!</h3>
          <p>Siz barcha ${this.wordsToFind.length} ta yashiringan so'zni muvaffaqiyatli topdingiz.</p>
          <div class="ws-victory-reward">+190 XP qo'lga kiritildi</div>
          <button class="ws-play-again-btn ios-button" onclick="window.app && window.app.launchGame('wordsearch')">
            Keyingi To'rni Boshlash ➔
          </button>
        `;
        board.appendChild(winBanner);
      }
    }, 600);
  }

  destroy() {
    window.removeEventListener('pointerup', this.boundPointerUp);
    window.removeEventListener('pointercancel', this.boundPointerUp);
    if (this.container) this.container.innerHTML = '';
  }
}

// Global attachment
if (typeof window !== 'undefined') {
  window.WordSearchGame = WordSearchGame;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WordSearchGame };
}


/**
 * Game 8: Xatolar Sandig'i (Mistake Revenge Arena)
 * Barcha so'z o'yinlarida adashilgan so'zlarni avtomatik yig'ib boradi.
 * Foydalanuvchi faqat o'zi qiynalgan so'zlar bo'yicha revansh o'ynaydi.
 * To'g'ri topilgan so'zlar sandiqdan muvaffaqiyatli chiqarib yuboriladi!
 */

class MistakeArenaGame {
  constructor(containerId, onScoreUpdate) {
    this.container = document.getElementById(containerId);
    this.onScoreUpdate = onScoreUpdate;
    this.mistakes = [];
    this.currentIndex = 0;
    this.currentWord = null;
    this.score = 0;
    this.isAnswered = false;
  }

  loadMistakes() {
    try {
      const data = JSON.parse(localStorage.getItem('lex_mistakes_bank') || '[]');
      this.mistakes = Array.isArray(data) ? data : [];
    } catch (e) {
      this.mistakes = [];
    }
  }

  saveMistakes() {
    try {
      localStorage.setItem('lex_mistakes_bank', JSON.stringify(this.mistakes));
      if (window.app && window.app.updateMistakesBadge) {
        window.app.updateMistakesBadge();
      }
    } catch (e) {}
  }

  start() {
    this.loadMistakes();
    this.currentIndex = 0;
    this.score = 0;

    if (this.mistakes.length === 0) {
      this.renderEmptyState();
      return;
    }

    // Shuffle mistakes
    this.mistakes = window.wordBank ? window.wordBank.cryptoShuffle(this.mistakes) : this.mistakes;
    this.loadRound();
  }

  renderEmptyState() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="mistake-empty-card ios-glass-panel">
        <div class="empty-icon">🛡️</div>
        <h3>XATOLAR SANDIG'I BO'SH!</h3>
        <p class="empty-desc">
          Ajoyib natija! Siz barcha o'yinlarda so'zlarni xatosiz yechyapsiz yoki barcha xatolaringizni to'liq to'g'irlab bo'ldingiz.
        </p>
        <p class="empty-sub">
          O'yinlar o'ynaganda xato qilsangiz, ular avtomatik shu yerda to'planadi va qayta mashq qilish imkonini beradi.
        </p>
        <div class="empty-actions">
          <button class="ios-action-button" onclick="window.app.launchGame('wordle')">
            🟩 Lug'at Wordle O'ynash
          </button>
          <button class="ios-action-button secondary" onclick="window.app.launchGame('pixel')">
            🔍 Piksel Detektiv
          </button>
        </div>
      </div>
    `;
  }

  loadRound() {
    if (this.currentIndex >= this.mistakes.length) {
      this.renderFinished();
      return;
    }

    this.currentWord = this.mistakes[this.currentIndex];
    this.isAnswered = false;

    // Distractors
    const distractors = window.wordBank ? window.wordBank.getDistractors(this.currentWord, 3) : [];
    const options = window.wordBank ? window.wordBank.cryptoShuffle([this.currentWord, ...distractors]) : [this.currentWord, ...distractors];

    this.render(options);

    // Audio
    if (window.soundEngine) {
      setTimeout(() => window.soundEngine.speak(this.currentWord.word), 300);
    }
  }

  render(options) {
    if (!this.container) return;

    const safeWord = this.currentWord.word.replace(/'/g, "\\'");
    this.container.innerHTML = `
      <div class="mistake-arena-panel ios-glass-panel">
        
        <div class="mistake-header-bar">
          <span class="mistake-badge">⚔️ XATOLAR REVANCHI</span>
          <span class="mistake-counter">Qolgan xatolar: <strong>${this.mistakes.length - this.currentIndex}</strong> ta</span>
        </div>

        <div class="mistake-word-card">
          <div class="word-speak-row">
            <h2 class="mistake-en-word">${this.currentWord.word}</h2>
            <button class="mistake-speak-btn ios-button" onclick="window.soundEngine.speak('${safeWord}')">🔊</button>
          </div>
          <span class="mistake-phonetic">${this.currentWord.phonetic || ''}</span>
          <p class="mistake-example">"${this.currentWord.fullExample || this.currentWord.sentence}"</p>
        </div>

        <div class="mistake-options-grid">
          ${options.map((opt, idx) => `
            <button class="mistake-opt-btn ios-button" id="mistake-opt-${opt.id}"
                    onclick="window.activeMistakeGame && window.activeMistakeGame.checkAnswer(${opt.id})">
              <span class="opt-label">${['A', 'B', 'C', 'D'][idx]}</span>
              <span class="opt-text">${opt.translation || opt.definition}</span>
            </button>
          `).join('')}
        </div>

        <div id="mistake-feedback-zone"></div>

      </div>
    `;
  }

  checkAnswer(chosenId) {
    if (this.isAnswered) return;
    this.isAnswered = true;

    const isCorrect = chosenId === this.currentWord.id;
    const chosenBtn = document.getElementById(`mistake-opt-${chosenId}`);
    const correctBtn = document.getElementById(`mistake-opt-${this.currentWord.id}`);

    if (isCorrect) {
      if (chosenBtn) chosenBtn.classList.add('correct');
      if (window.soundEngine) window.soundEngine.playSuccess();
      if (window.effectsEngine) window.effectsEngine.triggerComboPill();

      // Sandiqdan ushbu so'zni olib tashlash!
      this.mistakes = this.mistakes.filter(w => w.id !== this.currentWord.id && w.word !== this.currentWord.word);
      this.saveMistakes();

      this.score += 40;
      if (this.onScoreUpdate) this.onScoreUpdate(40);

      this.showFeedback(true);
    } else {
      if (chosenBtn) chosenBtn.classList.add('wrong');
      if (correctBtn) correctBtn.classList.add('correct');
      if (window.soundEngine) window.soundEngine.playWrong();

      // Keyingi so'zga o'tish (so'z sandiqda qoladi)
      this.currentIndex++;
      this.showFeedback(false);
    }
  }

  showFeedback(isCorrect) {
    const zone = document.getElementById('mistake-feedback-zone');
    if (!zone) return;

    zone.innerHTML = `
      <div class="mistake-feedback-card ${isCorrect ? 'cleared' : 'retained'} ios-glass-panel">
        <div class="fb-title">
          ${isCorrect ? '🌟 Ajoyib! Bu so\'z o\'zlashtirildi va sandiqdan o\'chirildi!' : '⚠️ Eslab qoling, bu so\'z hali sandiqda saqlanadi.'}
        </div>
        <div class="fb-meaning">
          To'g'ri ma'nosi: <strong>${this.currentWord.translation || this.currentWord.definition}</strong>
        </div>
        <button class="mistake-next-btn ios-button" onclick="window.activeMistakeGame && window.activeMistakeGame.loadRound()">
          Keyingi So'z ➔
        </button>
      </div>
    `;
  }

  renderFinished() {
    if (!this.container) return;

    if (window.soundEngine) window.soundEngine.playLevelUp();
    if (window.effectsEngine) window.effectsEngine.burstConfetti();

    this.container.innerHTML = `
      <div class="mistake-finished-card ios-glass-panel">
        <div class="finish-icon">🎉</div>
        <h3>REVANCH MUVAFFAQIYATLI YAKUNLANDI!</h3>
        <p class="finish-desc">
          Siz xatolar ustida ishlab, ularning ma'nolarini mustahkamlab oldingiz!
        </p>
        <p class="remaining-count">
          Sandiqda qolgan qiyin so'zlar: <strong>${this.mistakes.length} ta</strong>
        </p>
        <div class="finish-actions">
          ${this.mistakes.length > 0 ? `
            <button class="ios-action-button" onclick="window.activeMistakeGame && window.activeMistakeGame.start()">
              Qolgan Xatolarni Tozalash 🔄
            </button>
          ` : `
            <button class="ios-action-button" onclick="window.app.launchGame('wordle')">
              🟩 Wordle O'ynash
            </button>
          `}
          <button class="ios-action-button secondary" onclick="window.app.switchTab('home')">
            Bosh Sahifa 🏠
          </button>
        </div>
      </div>
    `;
  }

  destroy() {
    window.activeMistakeGame = null;
    if (this.container) this.container.innerHTML = '';
  }
}

window.MistakeArenaGame = MistakeArenaGame;


