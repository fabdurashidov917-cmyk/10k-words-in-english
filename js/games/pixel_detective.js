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
