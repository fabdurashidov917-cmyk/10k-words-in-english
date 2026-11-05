/**
 * SHADOW LEXICON // GAME 11: DICTATION STUDIO (ESHITIB YOZISH)
 * Ovoz eshitiladi, foydalanuvchi so'zni eshitib to'g'ri imlosini yozishi kerak.
 */

class DictationGame {
  constructor(containerId, onScoreUpdate) {
    this.container = document.getElementById(containerId);
    this.onScoreUpdate = onScoreUpdate;
    this.round = 1;
    this.maxRounds = (window.app && window.app.marathonRounds) || 30;
    this.score = 0;
    this.currentWord = null;
    this.revealedIndices = new Set();
    this.showTranslation = false;
    this.streak = 0;
  }

  start(category = 'all') {
    this.round = 1;
    this.score = 0;
    this.streak = 0;
    this.maxRounds = (window.app && window.app.marathonRounds) || 30;
    this.selectedCategory = category;
    this.nextRound();
  }

  nextRound() {
    if (this.round > this.maxRounds) {
      this.renderGameOver();
      return;
    }

    this.revealedIndices.clear();
    this.showTranslation = false;

    // WordBank dan yangi so'zni olish
    if (window.wordBank) {
      const words = window.wordBank.getByCategory(this.selectedCategory, 1);
      this.currentWord = words[0] || window.wordBank.getRandomWord();
    } else {
      this.currentWord = { word: 'DISCOVER', translation: 'kashf qilmoq', phonetic: '/dɪˈskʌv.ər/' };
    }

    this.renderUI();
    // Bosqich boshlanishida so'zni avtomatik talaffuz qilish
    setTimeout(() => {
      this.playAudio(1.0);
    }, 400);
  }

  playAudio(rate = 1.0) {
    if (!this.currentWord) return;
    const speakerBtn = document.getElementById('dict-speaker-main');
    if (speakerBtn) {
      speakerBtn.classList.add('playing-wave');
      setTimeout(() => speakerBtn.classList.remove('playing-wave'), 1200);
    }

    if (window.soundEngine && window.soundEngine.speak) {
      window.soundEngine.speak(this.currentWord.word, rate);
    } else if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(this.currentWord.word);
      u.lang = 'en-US';
      u.rate = rate;
      window.speechSynthesis.speak(u);
    }
  }

  renderUI() {
    if (!this.container) return;

    const word = this.currentWord.word.toUpperCase();
    const lettersCount = word.length;

    // Harf slotlari ko'rinishi
    const slotsHtml = word.split('').map((char, idx) => {
      const isRevealed = this.revealedIndices.has(idx);
      return `
        <div class="dict-letter-slot ${isRevealed ? 'revealed' : ''}" data-idx="${idx}">
          ${isRevealed ? char : '_'}
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="game-card dictation-game-arena ios-glass-panel" id="dictation-card">
        
        <!-- Header HUD -->
        <div class="game-header">
          <div class="badge-round">Bosqich ${this.round}/${this.maxRounds}</div>
          <div class="category-dynamic-badge">
            <span>🎧</span>
            <span>ESHITIB YOZISH</span>
          </div>
          <div class="score-display">Ochko: <span class="highlight-score">${this.score}</span></div>
          <div class="points-badge">+35 XP</div>
        </div>

        <!-- Audio Player Hero Hub -->
        <div class="dict-audio-hub">
          <button class="dict-main-speaker-btn ios-button" id="dict-speaker-main" title="Ovozni tinglash">
            <span class="speaker-sound-icon">🔊</span>
            <div class="audio-pulse-ring ring-1"></div>
            <div class="audio-pulse-ring ring-2"></div>
          </button>
          
          <div class="dict-speed-controls">
            <button class="dict-speed-pill ios-button active" id="btn-speed-normal">
              ⚡ 1.0x Normal
            </button>
            <button class="dict-speed-pill ios-button" id="btn-speed-slow">
              🐢 0.75x Sekin
            </button>
          </div>
        </div>

        <!-- Letter Slots indicator -->
        <div class="dict-slots-container">
          <div class="dict-slots-row" id="dict-slots-row">
            ${slotsHtml}
          </div>
          <div class="dict-length-label">${lettersCount} ta harfli so'z</div>
        </div>

        <!-- O'zbekcha Maslahat (Yashirin yoki Ochiq) -->
        <div class="dict-hint-box" id="dict-hint-box">
          <button class="dict-toggle-hint-btn ios-button" id="dict-toggle-hint">
            ${this.showTranslation ? '👁️ Tarjimani yashirish' : '💡 Tarjimani ko\'rish (Maslahat)'}
          </button>
          <div class="dict-trans-text" id="dict-trans-text" style="display: ${this.showTranslation ? 'block' : 'none'};">
            ${this.currentWord.translation}
          </div>
        </div>

        <!-- Typing Input Box -->
        <form class="dict-input-form" id="dict-input-form" onsubmit="event.preventDefault();">
          <div class="dict-input-wrap">
            <input 
              type="text" 
              id="dict-user-input" 
              class="dict-text-input" 
              placeholder="Eshitgan so'zingizni yozing..." 
              autocomplete="off" 
              autocorrect="off" 
              autocapitalize="characters"
              spellcheck="false"
            />
            <button type="submit" class="dict-submit-btn ios-button" id="dict-submit-btn">
              Tekshirish ↵
            </button>
          </div>
        </form>

        <!-- Quick Action Bar -->
        <div class="dict-quick-bar">
          <button class="dict-hint-letter-btn ios-button" id="btn-reveal-letter">
            🔑 1 ta harf ochish
          </button>
        </div>

        <!-- Feedback Result Banner -->
        <div class="dict-feedback-banner" id="dict-feedback" style="display: none;"></div>

      </div>
    `;

    // Bind audio triggers
    const mainSpeaker = document.getElementById('dict-speaker-main');
    if (mainSpeaker) {
      mainSpeaker.addEventListener('click', () => this.playAudio(1.0));
    }

    const btnNormal = document.getElementById('btn-speed-normal');
    if (btnNormal) {
      btnNormal.addEventListener('click', () => {
        btnNormal.classList.add('active');
        document.getElementById('btn-speed-slow')?.classList.remove('active');
        this.playAudio(1.0);
      });
    }

    const btnSlow = document.getElementById('btn-speed-slow');
    if (btnSlow) {
      btnSlow.addEventListener('click', () => {
        btnSlow.classList.add('active');
        document.getElementById('btn-speed-normal')?.classList.remove('active');
        this.playAudio(0.75);
      });
    }

    // Toggle hint
    const hintBtn = document.getElementById('dict-toggle-hint');
    if (hintBtn) {
      hintBtn.addEventListener('click', () => {
        this.showTranslation = !this.showTranslation;
        const transText = document.getElementById('dict-trans-text');
        if (transText) {
          transText.style.display = this.showTranslation ? 'block' : 'none';
        }
        hintBtn.innerText = this.showTranslation ? '👁️ Tarjimani yashirish' : '💡 Tarjimani ko\'rish (Maslahat)';
      });
    }

    // Reveal one letter hint
    const revealBtn = document.getElementById('btn-reveal-letter');
    if (revealBtn) {
      revealBtn.addEventListener('click', () => this.revealOneLetter());
    }

    // Form submit
    const form = document.getElementById('dict-input-form');
    if (form) {
      form.addEventListener('submit', () => this.checkSubmission());
    }

    // Focus input on non-mobile or when ready
    const inputEl = document.getElementById('dict-user-input');
    if (inputEl) {
      inputEl.focus();
      inputEl.addEventListener('input', (e) => {
        inputEl.value = inputEl.value.toUpperCase();
      });
    }
  }

  revealOneLetter() {
    const word = this.currentWord.word.toUpperCase();
    const unrevealed = [];
    for (let i = 0; i < word.length; i++) {
      if (!this.revealedIndices.has(i)) unrevealed.push(i);
    }

    if (unrevealed.length > 0) {
      const pick = unrevealed[Math.floor(Math.random() * unrevealed.length)];
      this.revealedIndices.add(pick);
      
      const slot = document.querySelector(`.dict-letter-slot[data-idx="${pick}"]`);
      if (slot) {
        slot.innerText = word[pick];
        slot.classList.add('revealed');
      }

      if (window.soundEngine) window.soundEngine.buttonClick();
    }
  }

  checkSubmission() {
    const inputEl = document.getElementById('dict-user-input');
    if (!inputEl) return;

    const userVal = inputEl.value.trim().toUpperCase();
    const target = this.currentWord.word.toUpperCase();
    const card = document.getElementById('dictation-card');
    const feedback = document.getElementById('dict-feedback');

    if (!userVal) {
      inputEl.focus();
      return;
    }

    if (userVal === target) {
      // 1. To'g'ri javob: Konfetti + Ovoz + G'alaba
      inputEl.classList.add('correct-border');
      if (window.soundEngine) {
        window.soundEngine.correct();
        setTimeout(() => this.playAudio(1.0), 300);
      }
      if (window.effectsEngine) {
        window.effectsEngine.launchConfetti();
        window.effectsEngine.triggerComboPill(this.streak + 1);
      }

      this.score += 35;
      this.streak++;
      if (this.onScoreUpdate) this.onScoreUpdate(35, { word: target, success: true });

      if (feedback) {
        feedback.className = 'dict-feedback-banner success';
        feedback.innerHTML = `
          <div class="fb-title">✨ A'LO! TO'G'RI YOZILDI</div>
          <div class="fb-word">${target} ${this.currentWord.phonetic || ''}</div>
          <div class="fb-sub">${this.currentWord.translation}</div>
        `;
        feedback.style.display = 'block';
      }

      setTimeout(() => {
        this.round++;
        this.nextRound();
      }, 1300);

    } else {
      // 2. Noto'g'ri javob: Qisqa silkinish (shake) + ovoz + haptic
      inputEl.classList.add('wrong-border');
      if (card && window.effectsEngine && window.effectsEngine.shakeElement) {
        window.effectsEngine.shakeElement(card);
      } else if (card) {
        card.classList.add('element-shake');
        setTimeout(() => card.classList.remove('element-shake'), 450);
      }

      if (window.soundEngine) window.soundEngine.wrong();
      if (navigator.vibrate) navigator.vibrate([40, 60, 40]);

      this.streak = 0;

      // Xatolar sandig'iga qo'shish
      if (window.app && window.app.addMistakeWord) {
        window.app.addMistakeWord(this.currentWord);
      }

      if (feedback) {
        feedback.className = 'dict-feedback-banner error';
        feedback.innerHTML = `
          <div class="fb-title">❌ XATOLIK! To'g'ri imlosi: <strong>${target}</strong></div>
          <div class="fb-sub">${this.currentWord.translation}</div>
        `;
        feedback.style.display = 'block';
      }

      setTimeout(() => {
        this.round++;
        this.nextRound();
      }, 1800);
    }
  }

  renderGameOver() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="game-card victory-card ios-glass-panel">
        <div class="victory-icon">🎧</div>
        <h3 class="victory-title">ESHITIB YOZISH YAKUNLANDI!</h3>
        <p class="victory-desc">Eshitish va to'g'ri imlo bo'yicha kuchli mashg'ulotni yakunladingiz.</p>
        <div class="victory-stat-box">
          <div class="v-stat">
            <span class="v-val">${this.score}</span>
            <span class="v-lbl">Jami Ball</span>
          </div>
          <div class="v-stat">
            <span class="v-val">${this.maxRounds}</span>
            <span class="v-lbl">So'z Eshitildi</span>
          </div>
        </div>
        <div class="victory-actions">
          <button class="cta-primary ios-button" onclick="window.app && window.app.launchGame('dictation')">
            🔄 Qaytadan Boshlash
          </button>
          <button class="cta-secondary ios-button" onclick="window.app && window.app.showDailySummaryCard && window.app.showDailySummaryCard()">
            📊 Bugungi Natijani Ko'rish
          </button>
        </div>
      </div>
    `;

    if (window.effectsEngine) window.effectsEngine.launchConfetti();
    if (window.soundEngine) window.soundEngine.levelUp();
  }

  destroy() {
    this.round = 1;
    this.score = 0;
  }
}

if (typeof window !== 'undefined') {
  window.DictationGame = DictationGame;
}
