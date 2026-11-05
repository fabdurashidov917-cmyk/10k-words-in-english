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
