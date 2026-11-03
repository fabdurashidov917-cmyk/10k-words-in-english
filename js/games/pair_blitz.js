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
