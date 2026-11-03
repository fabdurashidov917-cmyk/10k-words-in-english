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
