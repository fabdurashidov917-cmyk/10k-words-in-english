/**
 * SHADOW LEXICON // GAME 10: CONTEXT FILL (KRIPTO-GAPLAR & MASHHUR IQTIBOSLAR)
 * So'z alohida emas, mashhur film iqtibosi, mem yoki kutilmagan qiziqarli gap ichida bitta bo'sh joy bilan beriladi.
 */

class ContextFillGame {
  constructor(containerId, onScoreUpdate) {
    this.container = document.getElementById(containerId);
    this.onScoreUpdate = onScoreUpdate;
    this.round = 1;
    this.maxRounds = (window.app && window.app.marathonRounds) || 30;
    this.score = 0;
    this.currentQuote = null;
    this.targetWord = null;
    this.options = [];
    this.streak = 0;

    // Mashhur film iqtiboslari, memlar va qiziqarli kontekstlar banki
    this.curatedQuotes = [
      {
        quote: "May the [___] be with you.",
        word: "FORCE",
        uz: "kuch / quvvat",
        source: "🎬 Star Wars (Yulduzlar Jangi)",
        fullUz: "Kuch sen bilan bo'lsin."
      },
      {
        quote: "I'm going to make him an [___] he can't refuse.",
        word: "OFFER",
        uz: "taklif",
        source: "🎬 The Godfather (Cho'qintirgan Ota)",
        fullUz: "U rad eta olmaydigan taklifni bildiraman."
      },
      {
        quote: "With great power comes great [___].",
        word: "RESPONSIBILITY",
        uz: "mas'uliyat",
        source: "🎬 Spider-Man (O'rgimchak Odam)",
        fullUz: "Katta qudrat katta mas'uliyat keltiradi."
      },
      {
        quote: "There is no spoon. Only the [___] exists.",
        word: "TRUTH",
        uz: "haqiqat",
        source: "🎬 The Matrix (Matritsa)",
        fullUz: "Qoshiq yo'q. Faqat haqiqat mavjud."
      },
      {
        quote: "Houston, we have a [___].",
        word: "PROBLEM",
        uz: "muammo",
        source: "🎬 Apollo 13",
        fullUz: "Xyuston, bizda muammo bor."
      },
      {
        quote: "Keep your friends close, but your enemies [___].",
        word: "CLOSER",
        uz: "yaqinroq",
        source: "🎬 The Godfather II",
        fullUz: "Do'stlaringni yaqin tut, dushmanlaringni esa undan-da yaqinroq."
      },
      {
        quote: "To infinity and [___]!",
        word: "BEYOND",
        uz: "cheksizlik / narisi",
        source: "🎬 Toy Story (O'yinchoqlar Tarixi)",
        fullUz: "Cheksizlik va undan ham nariga!"
      },
      {
        quote: "You can't handle the [___]!",
        word: "TRUTH",
        uz: "haqiqat",
        source: "🎬 A Few Good Men",
        fullUz: "Sen haqiqatni ko'tara olmaysan!"
      },
      {
        quote: "I'll be [___].",
        word: "BACK",
        uz: "qaytaman / ortga",
        source: "🎬 Terminator",
        fullUz: "Men qaytib kelaman."
      },
      {
        quote: "Winter is [___].",
        word: "COMING",
        uz: "kelmoqda / yaqinlashmoqda",
        source: "🎬 Game of Thrones (Taxtlar O'yini)",
        fullUz: "Qish yaqinlashmoqda."
      },
      {
        quote: "One does not simply walk into [___].",
        word: "MORDOR",
        uz: "Mordor (qorong'u qal'a)",
        source: "🌐 Mashhur Internet Mem // LOTR",
        fullUz: "Shunchaki Mordorga kirib borib bo'lmaydi."
      },
      {
        quote: "Say hello to my little [___]!",
        word: "FRIEND",
        uz: "do'st",
        source: "🎬 Scarface (Chandiqli Yuz)",
        fullUz: "Mening kichik do'stim bilan salomlash!"
      },
      {
        quote: "Why so [___]?",
        word: "SERIOUS",
        uz: "jiddiy",
        source: "🎬 The Dark Knight (Joker)",
        fullUz: "Nega buncha jiddiysan?"
      },
      {
        quote: "Life is like a box of [___]. You never know what you're gonna get.",
        word: "CHOCOLATES",
        uz: "shokoladlar",
        source: "🎬 Forrest Gump",
        fullUz: "Hayot shokolad qutisiga o'xshaydi. Qaysi biri chiqishini bilmaysan."
      },
      {
        quote: "I feel the need... the need for [___]!",
        word: "SPEED",
        uz: "tezlik",
        source: "🎬 Top Gun",
        fullUz: "Men tezlikka bo'lgan ehtiyojni his qilyapman!"
      },
      {
        quote: "Just keep [___].",
        word: "SWIMMING",
        uz: "suzish",
        source: "🎬 Finding Nemo",
        fullUz: "Faqat suzishda davom et."
      },
      {
        quote: "Show me the [___]!",
        word: "MONEY",
        uz: "pul",
        source: "🎬 Jerry Maguire",
        fullUz: "Menga pullarni ko'rsat!"
      },
      {
        quote: "There's no place like [___].",
        word: "HOME",
        uz: "uy",
        source: "🎬 The Wizard of Oz",
        fullUz: "O'z uyingdek joy yo'q."
      },
      {
        quote: "I am Iron [___].",
        word: "MAN",
        uz: "odam / inson",
        source: "🎬 Avengers: Endgame",
        fullUz: "Men Temir Odamman."
      },
      {
        quote: "My precious [___].",
        word: "RING",
        uz: "uzuk",
        source: "🎬 The Lord of the Rings",
        fullUz: "Mening qadrdon uzugim."
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

    // 1-bosqich: Curated mashhur iqtiboslardan, keyin esa dynamic generator
    let item;
    if (this.round <= this.curatedQuotes.length) {
      item = this.curatedQuotes[this.round - 1];
    } else {
      // Dynamic generator from 10k word bank
      item = this.generateDynamicQuote();
    }

    this.currentQuote = item;
    this.targetWord = item.word.toUpperCase();

    // 4 ta variant tayyorlash (1 ta to'g'ri, 3 ta adashtiruvchi)
    const distractors = window.wordBank ? window.wordBank.getDistractors({ word: this.targetWord }, 3) : ['ACTION', 'SHADOW', 'POWER'];
    const distractorWords = distractors.map(d => (typeof d === 'string' ? d : d.word || '').toUpperCase());
    this.options = window.wordBank ? window.wordBank.cryptoShuffle([this.targetWord, ...distractorWords]) : [this.targetWord, 'ACTION', 'SHADOW', 'POWER'];

    this.renderUI();
  }

  generateDynamicQuote() {
    if (!window.wordBank || !window.wordBank.words || window.wordBank.words.length === 0) {
      return {
        quote: "Knowledge is [___].",
        word: "POWER",
        uz: "kuch / quvvat",
        source: "💡 Donishmandlik",
        fullUz: "Bilim - bu kuchdir."
      };
    }

    const randomWord = window.wordBank.getRandomWord();
    const sentence = randomWord.fullExample || randomWord.sentence || `Always remember to use your ${randomWord.word} wisely.`;
    
    // Replace word in sentence with blank
    const regex = new RegExp(`\\b${randomWord.word}\\b`, 'i');
    const quoteWithBlank = sentence.replace(regex, '[___]');

    return {
      quote: quoteWithBlank,
      word: randomWord.word.toUpperCase(),
      uz: randomWord.translation,
      source: "⚡ Zamonaviy Kontekst & Maqol",
      fullUz: sentence
    };
  }

  renderUI() {
    if (!this.container) return;

    // Display quote with glowing blank
    const formattedQuote = this.currentQuote.quote.replace(
      '[___]',
      `<span class="context-blank-token" id="context-blank-slot">? ? ?</span>`
    );

    this.container.innerHTML = `
      <div class="game-card context-game-arena ios-glass-panel" id="context-arena-card">
        
        <!-- Header HUD -->
        <div class="game-header">
          <div class="badge-round">Bosqich ${this.round}/${this.maxRounds}</div>
          <div class="category-dynamic-badge">
            <span>🎬</span>
            <span>KRIPTO-GAPLAR</span>
          </div>
          <div class="score-display">Ochko: <span class="highlight-score">${this.score}</span></div>
          <div class="points-badge">+30 XP</div>
        </div>

        <!-- Cinema Quote Billboard Card -->
        <div class="context-billboard-card">
          <div class="context-source-badge">
            <span class="source-icon">🎞️</span>
            <span class="source-text">${this.currentQuote.source}</span>
          </div>

          <blockquote class="context-quote-text">
            “${formattedQuote}”
          </blockquote>

          <div class="context-uz-hint">
            <span class="hint-icon">💡</span>
            <span class="hint-label">O'zbekcha ma'nosi:</span>
            <span class="hint-value">${this.currentQuote.uz}</span>
          </div>
        </div>

        <!-- 4 ta Tanlov Varianti -->
        <div class="context-options-grid" id="context-options-grid">
          ${this.options.map(opt => `
            <button class="context-opt-btn ios-button" data-word="${opt}">
              <span class="opt-label">${opt}</span>
            </button>
          `).join('')}
        </div>

        <!-- Result / Feedback Banner -->
        <div class="context-feedback-banner" id="context-feedback" style="display: none;"></div>

      </div>
    `;

    // Tugmalarga hodisalarni ulash
    const buttons = this.container.querySelectorAll('.context-opt-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const selected = btn.getAttribute('data-word');
        this.handleAnswer(selected, btn);
      });
    });
  }

  handleAnswer(selectedWord, buttonEl) {
    const isCorrect = selectedWord.toUpperCase() === this.targetWord;
    const card = document.getElementById('context-arena-card');
    const blankSlot = document.getElementById('context-blank-slot');
    const feedback = document.getElementById('context-feedback');
    const allBtns = this.container.querySelectorAll('.context-opt-btn');

    // Tugmalarni faolsizlantirish
    allBtns.forEach(btn => btn.disabled = true);

    if (isCorrect) {
      // 1. To'g'ri javob: Konfetti + ovoz + yashil animatsiya
      buttonEl.classList.add('correct-glow');
      if (blankSlot) {
        blankSlot.innerText = this.targetWord;
        blankSlot.classList.add('revealed-correct');
      }

      if (window.soundEngine) window.soundEngine.correct();
      if (window.effectsEngine) {
        window.effectsEngine.launchConfetti();
        window.effectsEngine.triggerComboPill(this.streak + 1);
      }

      this.score += 30;
      this.streak++;
      if (this.onScoreUpdate) this.onScoreUpdate(30, { word: this.targetWord, success: true });

      if (feedback) {
        feedback.className = 'context-feedback-banner success';
        feedback.innerHTML = `
          <div class="fb-title">✨ QOYILMAQOM! TOPILDI</div>
          <div class="fb-sub">${this.currentQuote.fullUz}</div>
        `;
        feedback.style.display = 'block';
      }

      setTimeout(() => {
        this.round++;
        this.nextRound();
      }, 1200);

    } else {
      // 2. Noto'g'ri javob: Qisqa silkinish (shake) + xato ovoz + qizil chiroq
      buttonEl.classList.add('wrong-glow');
      
      // Xato variant silkinishi
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
        if (btn.getAttribute('data-word') === this.targetWord) {
          btn.classList.add('correct-highlight');
        }
      });

      if (blankSlot) {
        blankSlot.innerText = this.targetWord;
        blankSlot.classList.add('revealed-wrong');
      }

      // Xatolar sandig'iga qo'shish
      if (window.app && window.app.addMistakeWord) {
        window.app.addMistakeWord({
          word: this.targetWord,
          translation: this.currentQuote.uz,
          sentence: this.currentQuote.quote
        });
      }

      this.streak = 0;

      if (feedback) {
        feedback.className = 'context-feedback-banner error';
        feedback.innerHTML = `
          <div class="fb-title">❌ ADASHINGIZ! To'g'ri javob: <strong>${this.targetWord}</strong></div>
          <div class="fb-sub">${this.currentQuote.fullUz}</div>
        `;
        feedback.style.display = 'block';
      }

      setTimeout(() => {
        this.round++;
        this.nextRound();
      }, 1700);
    }
  }

  renderGameOver() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="game-card victory-card ios-glass-panel">
        <div class="victory-icon">🎬</div>
        <h3 class="victory-title">KRIPTO-GAPLAR YAKUNLANDI!</h3>
        <p class="victory-desc">Barcha mashhur iqtiboslar va kutilmagan gaplar sinovidan muvaffaqiyatli o'tdingiz.</p>
        <div class="victory-stat-box">
          <div class="v-stat">
            <span class="v-val">${this.score}</span>
            <span class="v-lbl">Jami Ball</span>
          </div>
          <div class="v-stat">
            <span class="v-val">${this.maxRounds}</span>
            <span class="v-lbl">Yechilgan Gap</span>
          </div>
        </div>
        <div class="victory-actions">
          <button class="cta-primary ios-button" onclick="window.app && window.app.launchGame('contextfill')">
            🔄 Qaytadan O'ynash
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
  window.ContextFillGame = ContextFillGame;
}
