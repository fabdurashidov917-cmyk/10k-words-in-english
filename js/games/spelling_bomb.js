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
