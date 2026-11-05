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
