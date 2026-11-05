/**
 * SHADOW LEXICON // GAME 12: ROOT QUIZ (ILDIZDOSH VARIANTLAR QUIZI)
 * 4 ta variant, 1 ta to'g'ri, xato variantlar aynan bir xil o'zak/ildizdan olinadi (morfologik nozikliklar sinovi).
 */

class RootQuizGame {
  constructor(containerId, onScoreUpdate) {
    this.container = document.getElementById(containerId);
    this.onScoreUpdate = onScoreUpdate;
    this.round = 1;
    this.maxRounds = (window.app && window.app.marathonRounds) || 30;
    this.score = 0;
    this.currentFamily = null;
    this.targetItem = null;
    this.options = [];
    this.streak = 0;

    // Mashhur ildizdosh so'z oilalari banki
    this.rootFamilies = [
      {
        root: "DECID- (Qaror)",
        words: [
          { word: "DECIDE", pos: "Fe'l (Verb)", uz: "qaror qilmoq" },
          { word: "DECISION", pos: "Ot (Noun)", uz: "qaror" },
          { word: "DECISIVE", pos: "Sifat (Adj)", uz: "hal qiluvchi / qat'iy" },
          { word: "DECISIVELY", pos: "Ravish (Adv)", uz: "qat'iyat bilan" }
        ]
      },
      {
        root: "CREAT- (Yaratish)",
        words: [
          { word: "CREATE", pos: "Fe'l (Verb)", uz: "yaratmoq" },
          { word: "CREATION", pos: "Ot (Noun)", uz: "yaratilish / asar" },
          { word: "CREATIVE", pos: "Sifat (Adj)", uz: "ijodiy / kreativ" },
          { word: "CREATOR", pos: "Ot (Noun)", uz: "yaratuvchi / muallif" }
        ]
      },
      {
        root: "SUCCESS- (Muvaffaqiyat)",
        words: [
          { word: "SUCCEED", pos: "Fe'l (Verb)", uz: "muvaffaq bo'lmoq" },
          { word: "SUCCESS", pos: "Ot (Noun)", uz: "muvaffaqiyat" },
          { word: "SUCCESSFUL", pos: "Sifat (Adj)", uz: "muvaffaqiyatli" },
          { word: "SUCCESSFULLY", pos: "Ravish (Adv)", uz: "muvaffaqiyat ila" }
        ]
      },
      {
        root: "DANGER- (Xavf)",
        words: [
          { word: "DANGER", pos: "Ot (Noun)", uz: "xavf / xatar" },
          { word: "DANGEROUS", pos: "Sifat (Adj)", uz: "xavfli" },
          { word: "ENDANGER", pos: "Fe'l (Verb)", uz: "xavf ostiga qo'ymoq" },
          { word: "DANGEROUSLY", pos: "Ravish (Adv)", uz: "xavfli tarzda" }
        ]
      },
      {
        root: "COMPETE- (Raqobat)",
        words: [
          { word: "COMPETE", pos: "Fe'l (Verb)", uz: "raqobatlashmoq" },
          { word: "COMPETITION", pos: "Ot (Noun)", uz: "musobaqa / raqobat" },
          { word: "COMPETITIVE", pos: "Sifat (Adj)", uz: "raqobatbardosh" },
          { word: "COMPETITOR", pos: "Ot (Noun)", uz: "raqobatchi" }
        ]
      },
      {
        root: "ACCEPT- (Qabul)",
        words: [
          { word: "ACCEPT", pos: "Fe'l (Verb)", uz: "qabul qilmoq" },
          { word: "ACCEPTANCE", pos: "Ot (Noun)", uz: "qabul qilish / rozilik" },
          { word: "ACCEPTABLE", pos: "Sifat (Adj)", uz: "qabul qilarli / maqbul" },
          { word: "ACCEPTABLY", pos: "Ravish (Adv)", uz: "maqbul ravishda" }
        ]
      },
      {
        root: "BEAUTY- (Go'zallik)",
        words: [
          { word: "BEAUTY", pos: "Ot (Noun)", uz: "go'zallik" },
          { word: "BEAUTIFUL", pos: "Sifat (Adj)", uz: "go'zal" },
          { word: "BEAUTIFY", pos: "Fe'l (Verb)", uz: "go'zallashtirmoq" },
          { word: "BEAUTIFULLY", pos: "Ravish (Adv)", uz: "go'zal tarzda" }
        ]
      },
      {
        root: "INFORM- (Xabar)",
        words: [
          { word: "INFORM", pos: "Fe'l (Verb)", uz: "xabardor qilmoq" },
          { word: "INFORMATION", pos: "Ot (Noun)", uz: "ma'lumot / axborot" },
          { word: "INFORMATIVE", pos: "Sifat (Adj)", uz: "mazmunli / foydali" },
          { word: "INFORMER", pos: "Ot (Noun)", uz: "xabarchi / yetkazuvchi" }
        ]
      },
      {
        root: "DEFEND- (Mudofaa)",
        words: [
          { word: "DEFEND", pos: "Fe'l (Verb)", uz: "himoya qilmoq" },
          { word: "DEFENSE", pos: "Ot (Noun)", uz: "mudofaa / himoya" },
          { word: "DEFENSIVE", pos: "Sifat (Adj)", uz: "himoyaviy" },
          { word: "DEFENDER", pos: "Ot (Noun)", uz: "himoyachi" }
        ]
      },
      {
        root: "IMAGINE- (Xayol)",
        words: [
          { word: "IMAGINE", pos: "Fe'l (Verb)", uz: "tasavvur qilmoq" },
          { word: "IMAGINATION", pos: "Ot (Noun)", uz: "tasavvur / xayolot" },
          { word: "IMAGINARY", pos: "Sifat (Adj)", uz: "xayoliy / to'qima" },
          { word: "IMAGINATIVE", pos: "Sifat (Adj)", uz: "kreativ / boy xayolotli" }
        ]
      },
      {
        root: "CONNECT- (Aloqa)",
        words: [
          { word: "CONNECT", pos: "Fe'l (Verb)", uz: "ulamoq / bog'lamoq" },
          { word: "CONNECTION", pos: "Ot (Noun)", uz: "aloqa / bog'liqlik" },
          { word: "CONNECTIVITY", pos: "Ot (Noun)", uz: "ulanish imkoniyati" },
          { word: "DISCONNECT", pos: "Fe'l (Verb)", uz: "uzmoq / ajratmoq" }
        ]
      },
      {
        root: "REDUCE- (Qisqartirish)",
        words: [
          { word: "REDUCE", pos: "Fe'l (Verb)", uz: "kamaytirmoq / qisqartirmoq" },
          { word: "REDUCTION", pos: "Ot (Noun)", uz: "qisqarish / pasayish" },
          { word: "REDUCIBLE", pos: "Sifat (Adj)", uz: "kamaytiriladigan" },
          { word: "REDUCING", pos: "Sifat (Adj)", uz: "qisqartiruvchi" }
        ]
      },
      {
        root: "SOLVE- (Yechim)",
        words: [
          { word: "SOLVE", pos: "Fe'l (Verb)", uz: "yechmoq / hal qilmoq" },
          { word: "SOLUTION", pos: "Ot (Noun)", uz: "yechim" },
          { word: "SOLUBLE", pos: "Sifat (Adj)", uz: "eriydigan" },
          { word: "SOLVABLE", pos: "Sifat (Adj)", uz: "yechsa bo'ladigan" }
        ]
      },
      {
        root: "STRONG- (Kuch)",
        words: [
          { word: "STRONG", pos: "Sifat (Adj)", uz: "kuchli" },
          { word: "STRENGTH", pos: "Ot (Noun)", uz: "kuch / quvvat" },
          { word: "STRENGTHEN", pos: "Fe'l (Verb)", uz: "kuchaytirmoq" },
          { word: "STRONGLY", pos: "Ravish (Adv)", uz: "kuch bilan / qattiq" }
        ]
      },
      {
        root: "REAL- (Haqiqat)",
        words: [
          { word: "REAL", pos: "Sifat (Adj)", uz: "haqiqiy" },
          { word: "REALITY", pos: "Ot (Noun)", uz: "haqiqat / voqelik" },
          { word: "REALIZE", pos: "Fe'l (Verb)", uz: "anglamoq / tushunmoq" },
          { word: "REALISTIC", pos: "Sifat (Adj)", uz: "realistik / mantiqiy" }
        ]
      }
    ];
  }

  start(category = 'all') {
    this.round = 1;
    this.score = 0;
    this.streak = 0;
    this.maxRounds = (window.app && window.app.marathonRounds) || 30;
    this.nextRound();
  }

  nextRound() {
    if (this.round > this.maxRounds) {
      this.renderGameOver();
      return;
    }

    // Oila tanlash: ro'yxatdan yoki dynamic generator orqali
    let family;
    if (this.round <= this.rootFamilies.length) {
      family = this.rootFamilies[this.round - 1];
    } else {
      family = this.generateDynamicRootFamily();
    }

    this.currentFamily = family;

    // Ushbu oiladan bitta so'zni maqsad qilib tanlaymiz
    const targetIdx = Math.floor(Math.random() * family.words.length);
    this.targetItem = family.words[targetIdx];

    // Barcha 4 ta ildizdosh so'zni aralashtiramiz
    this.options = window.wordBank ? window.wordBank.cryptoShuffle([...family.words]) : [...family.words];

    this.renderUI();
  }

  generateDynamicRootFamily() {
    if (!window.wordBank || !window.wordBank.words || window.wordBank.words.length === 0) {
      return this.rootFamilies[0];
    }

    // 10K so'z bankidan asosiy so'zni olib, morfologik hosilalar yasaymiz
    const baseWord = window.wordBank.getRandomWord();
    const raw = baseWord.word.toUpperCase();
    const cleanStem = raw.replace(/(ING|ED|TION|LY|NESS|MENT|ABLE)$/, '');

    return {
      root: `${cleanStem}- (Ildiz)`,
      words: [
        { word: raw, pos: "Asosiy So'z", uz: baseWord.translation },
        { word: `${cleanStem}TION`, pos: "Ot (Noun)", uz: `${baseWord.translation} jarayoni` },
        { word: `${cleanStem}ABLE`, pos: "Sifat (Adj)", uz: `${baseWord.translation} imkoni bor` },
        { word: `${cleanStem}LY`, pos: "Ravish (Adv)", uz: `${baseWord.translation} tarzda` }
      ]
    };
  }

  renderUI() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="game-card root-quiz-arena ios-glass-panel" id="root-quiz-card">
        
        <!-- Header HUD -->
        <div class="game-header">
          <div class="badge-round">Bosqich ${this.round}/${this.maxRounds}</div>
          <div class="category-dynamic-badge">
            <span>🌿</span>
            <span>ILDIZDOSH QUIZ</span>
          </div>
          <div class="score-display">Ochko: <span class="highlight-score">${this.score}</span></div>
          <div class="points-badge">+30 XP</div>
        </div>

        <!-- Root Family Banner -->
        <div class="root-family-card">
          <div class="root-family-pill">
            <span class="root-icon">🧬</span>
            <span class="root-title">Umumiy Ildiz: <strong>${this.currentFamily.root}</strong></span>
          </div>

          <div class="root-question-box">
            <span class="root-prompt-tag">QUYIDAGI MA'NONI BILDIRUVCHI TO'G'RI ILDIZDOSH SO'ZNI TOPING:</span>
            <h3 class="root-target-meaning">"${this.targetItem.uz}"</h3>
            <span class="root-target-pos-hint">So'z turkumi: <em>${this.targetItem.pos}</em></span>
          </div>
        </div>

        <!-- 4 ta Ildizdosh Variant (Hammasi bir ildizdan, ammo turkumlari har xil!) -->
        <div class="root-options-grid" id="root-options-grid">
          ${this.options.map(item => `
            <button class="root-opt-btn ios-button" data-word="${item.word}">
              <span class="root-word-text">${item.word}</span>
              <span class="root-pos-badge">${item.pos}</span>
            </button>
          `).join('')}
        </div>

        <!-- Result / Feedback Banner -->
        <div class="root-feedback-banner" id="root-feedback" style="display: none;"></div>

      </div>
    `;

    // Hodisalarni ulash
    const buttons = this.container.querySelectorAll('.root-opt-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const selected = btn.getAttribute('data-word');
        this.handleAnswer(selected, btn);
      });
    });
  }

  handleAnswer(selectedWord, buttonEl) {
    const isCorrect = selectedWord.toUpperCase() === this.targetItem.word.toUpperCase();
    const card = document.getElementById('root-quiz-card');
    const feedback = document.getElementById('root-feedback');
    const allBtns = this.container.querySelectorAll('.root-opt-btn');

    allBtns.forEach(btn => btn.disabled = true);

    if (isCorrect) {
      // 1. To'g'ri javob: Konfetti + ovoz + yashil chiroq
      buttonEl.classList.add('correct-glow');
      if (window.soundEngine) window.soundEngine.correct();
      if (window.effectsEngine) {
        window.effectsEngine.launchConfetti();
        window.effectsEngine.triggerComboPill(this.streak + 1);
      }

      this.score += 30;
      this.streak++;
      if (this.onScoreUpdate) this.onScoreUpdate(30, { word: this.targetItem.word, success: true });

      if (feedback) {
        feedback.className = 'root-feedback-banner success';
        feedback.innerHTML = `
          <div class="fb-title">✨ MUKAMMAL! TO'G'RI ILDIZDOSH VARIANT</div>
          <div class="fb-details">
            <strong>${this.targetItem.word}</strong> (${this.targetItem.pos}) = "${this.targetItem.uz}"
          </div>
        `;
        feedback.style.display = 'block';
      }

      setTimeout(() => {
        this.round++;
        this.nextRound();
      }, 1200);

    } else {
      // 2. Noto'g'ri javob: Qisqa silkinish (shake) + ovoz + haptic
      buttonEl.classList.add('wrong-glow');
      if (card && window.effectsEngine && window.effectsEngine.shakeElement) {
        window.effectsEngine.shakeElement(card);
      } else if (card) {
        card.classList.add('element-shake');
        setTimeout(() => card.classList.remove('element-shake'), 450);
      }

      if (window.soundEngine) window.soundEngine.wrong();
      if (navigator.vibrate) navigator.vibrate([40, 60, 40]);

      // To'g'ri javobni ko'rsatish
      allBtns.forEach(btn => {
        if (btn.getAttribute('data-word') === this.targetItem.word) {
          btn.classList.add('correct-highlight');
        }
      });

      this.streak = 0;

      // Xatolar sandig'iga qo'shish
      if (window.app && window.app.addMistakeWord) {
        window.app.addMistakeWord({
          word: this.targetItem.word,
          translation: this.targetItem.uz,
          definition: `Ildiz: ${this.currentFamily.root} (${this.targetItem.pos})`
        });
      }

      if (feedback) {
        feedback.className = 'root-feedback-banner error';
        feedback.innerHTML = `
          <div class="fb-title">❌ ADASHINGIZ! To'g'ri ildizdosh so'z: <strong>${this.targetItem.word}</strong></div>
          <div class="fb-details">${this.targetItem.word} (${this.targetItem.pos}) = "${this.targetItem.uz}"</div>
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
        <div class="victory-icon">🌿</div>
        <h3 class="victory-title">ILDIZDOSH QUIZ YAKUNLANDI!</h3>
        <p class="victory-desc">Morfologik nozikliklar va bir xil o'zakdan olingan so'zlar sinovidan o'tdingiz.</p>
        <div class="victory-stat-box">
          <div class="v-stat">
            <span class="v-val">${this.score}</span>
            <span class="v-lbl">Jami Ball</span>
          </div>
          <div class="v-stat">
            <span class="v-val">${this.maxRounds}</span>
            <span class="v-lbl">Ildiz Tahlil Qilindi</span>
          </div>
        </div>
        <div class="victory-actions">
          <button class="cta-primary ios-button" onclick="window.app && window.app.launchGame('rootquiz')">
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
  window.RootQuizGame = RootQuizGame;
}
