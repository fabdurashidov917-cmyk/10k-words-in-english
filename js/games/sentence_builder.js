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
