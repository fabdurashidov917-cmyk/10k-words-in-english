/**
 * Game 6: Lug'at Wordle (English-Uzbek Wordle)
 * 5-harfli inglizcha sirli so'z, 6 ta urinish, haqiqiy Wordle mexanikasi.
 * Har bir urinishdan so'ng harflar yashil/sariq/kulrang bo'ladi.
 * Topilgach o'zbekcha tarjima, audio talaffuz va misol gap ochiladi!
 */

class WordleGame {
  constructor(containerId, onScoreUpdate) {
    this.container = document.getElementById(containerId);
    this.onScoreUpdate = onScoreUpdate;
    this.wordLength = 5;
    this.maxGuesses = 6;
    this.currentGuess = '';
    this.guesses = []; // array of strings
    this.evaluations = []; // array of array of status: 'correct'|'present'|'absent'
    this.targetWordObj = null;
    this.targetWord = '';
    this.isGameOver = false;
    this.keyStatuses = {}; // letter -> status
    this.boundKeyHandler = this.handleKeyDown.bind(this);
  }

  start(categoryId = 'all') {
    this.isGameOver = false;
    this.currentGuess = '';
    this.guesses = [];
    this.evaluations = [];
    this.keyStatuses = {};

    // Select candidate 5-letter words without spaces or special characters
    let candidates = window.wordBank ? window.wordBank.words : [];
    if (categoryId && categoryId !== 'all') {
      const catWords = candidates.filter(w => w.category === categoryId);
      if (catWords.length >= 10) candidates = catWords;
    }

    const fiveLetterPool = candidates.filter(w => {
      const clean = w.word.trim().toUpperCase();
      return clean.length === 5 && /^[A-Z]{5}$/.test(clean);
    });

    if (fiveLetterPool.length > 0) {
      const shuffled = window.wordBank ? window.wordBank.cryptoShuffle(fiveLetterPool) : fiveLetterPool;
      this.targetWordObj = shuffled[0];
    } else {
      // Fallback 5-letter words
      const defaults = [
        { word: 'HEART', translation: 'Yurak', definition: 'Qon haydovchi tana a\'zosi', fullExample: 'Listen to your heart.', phonetic: '/hɑːrt/' },
        { word: 'SMART', translation: 'Aqlli', definition: 'Ziyrak, dono', fullExample: 'She is very smart.', phonetic: '/smɑːrt/' },
        { word: 'EARTH', translation: 'Yer', definition: 'Biz yashaydigan sayyora', fullExample: 'The earth orbits the sun.', phonetic: '/ɜːrθ/' },
        { word: 'PLANT', translation: 'O\'simlik', definition: 'Yashil tabiat ko\'rki', fullExample: 'Water the green plant.', phonetic: '/plænt/' },
        { word: 'DREAM', translation: 'Orzu / Tush', definition: 'Kutilgan maqsad', fullExample: 'Follow your dream.', phonetic: '/driːm/' }
      ];
      this.targetWordObj = defaults[Math.floor(Math.random() * defaults.length)];
    }

    this.targetWord = this.targetWordObj.word.toUpperCase();
    console.log(`[Wordle] Target Word selected: ${this.targetWord}`);

    window.removeEventListener('keydown', this.boundKeyHandler);
    window.addEventListener('keydown', this.boundKeyHandler);

    this.render();
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="wordle-arena ios-glass-panel">
        
        <!-- Yuqori qism: Yo'riqnoma va Maslahat -->
        <div class="wordle-header">
          <div class="wordle-badge">🟩 LUG'AT WORDLE // 5 HARF</div>
          <p class="wordle-hint">
            Sirli 5 harfli inglizcha so'zni 6 urinishda toping. Har bir harakatdan so'ng ranglar yo'l ko'rsatadi:
          </p>
          <div class="wordle-legend">
            <span class="legend-chip green">Yashil: To'g'ri o'rinda</span>
            <span class="legend-chip yellow">Sariq: Boshqa o'rinda</span>
            <span class="legend-chip gray">Kulrang: So'zda yo'q</span>
          </div>
        </div>

        <!-- 6x5 Wordle Kataklari To'ri -->
        <div class="wordle-grid" id="wordle-grid">
          ${this.renderGridRows()}
        </div>

        <!-- Bildirishnoma / Tarjima kartochkasi -->
        <div id="wordle-result-container"></div>

        <!-- Virtual QWERTY Keyboard (Smartfonlar va Touch uchun) -->
        <div class="wordle-keyboard" id="wordle-keyboard">
          ${this.renderVirtualKeyboard()}
        </div>

      </div>
    `;
  }

  renderGridRows() {
    let rowsHtml = '';

    for (let r = 0; r < this.maxGuesses; r++) {
      const isCurrentRow = r === this.guesses.length && !this.isGameOver;
      const isSubmittedRow = r < this.guesses.length;
      const submittedGuess = this.guesses[r] || '';
      const rowEvals = this.evaluations[r] || [];

      rowsHtml += `<div class="wordle-row ${isCurrentRow ? 'current-row' : ''}">`;

      for (let c = 0; c < this.wordLength; c++) {
        let letter = '';
        let tileClass = 'wordle-tile';

        if (isSubmittedRow) {
          letter = submittedGuess[c] || '';
          tileClass += ` submitted ${rowEvals[c] || 'absent'}`;
        } else if (isCurrentRow) {
          letter = this.currentGuess[c] || '';
          if (letter) tileClass += ' filled';
        }

        rowsHtml += `
          <div class="${tileClass}" style="animation-delay: ${c * 100}ms">
            ${letter}
          </div>
        `;
      }

      rowsHtml += `</div>`;
    }

    return rowsHtml;
  }

  renderVirtualKeyboard() {
    const rows = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
    ];

    return rows.map(row => `
      <div class="wordle-kb-row">
        ${row.map(k => {
          const status = this.keyStatuses[k] || '';
          const isSpecial = k === 'ENTER' || k === '⌫';
          return `
            <button class="wordle-key ${status} ${isSpecial ? 'special-key' : ''} ios-button"
                    onclick="window.activeWordleGame && window.activeWordleGame.handleKeyInput('${k}')">
              ${k}
            </button>
          `;
        }).join('')}
      </div>
    `).join('');
  }

  updateGrid() {
    const gridEl = document.getElementById('wordle-grid');
    if (gridEl) {
      gridEl.innerHTML = this.renderGridRows();
    }
    const kbEl = document.getElementById('wordle-keyboard');
    if (kbEl) {
      kbEl.innerHTML = this.renderVirtualKeyboard();
    }
  }

  handleKeyDown(e) {
    if (this.isGameOver) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      this.submitGuess();
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      this.deleteLetter();
    } else if (/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
      this.inputLetter(e.key.toUpperCase());
    }
  }

  handleKeyInput(key) {
    if (this.isGameOver) return;

    if (key === 'ENTER') {
      this.submitGuess();
    } else if (key === '⌫') {
      this.deleteLetter();
    } else {
      this.inputLetter(key);
    }
  }

  inputLetter(letter) {
    if (this.currentGuess.length < this.wordLength) {
      this.currentGuess += letter;
      this.updateGrid();
      if (window.soundEngine) window.soundEngine.buttonClick();
    }
  }

  deleteLetter() {
    if (this.currentGuess.length > 0) {
      this.currentGuess = this.currentGuess.slice(0, -1);
      this.updateGrid();
      if (window.soundEngine) window.soundEngine.buttonClick();
    }
  }

  submitGuess() {
    if (this.currentGuess.length !== this.wordLength) {
      this.showToast('5 ta harf kiriting!');
      if (window.soundEngine) window.soundEngine.playWrong();
      return;
    }

    const guess = this.currentGuess;
    const target = this.targetWord;

    // Evaluation with proper duplicate letters tracking
    const evals = new Array(this.wordLength).fill('absent');
    const targetLetterCounts = {};

    for (let i = 0; i < this.wordLength; i++) {
      const char = target[i];
      targetLetterCounts[char] = (targetLetterCounts[char] || 0) + 1;
    }

    // Step 1: Green matches
    for (let i = 0; i < this.wordLength; i++) {
      if (guess[i] === target[i]) {
        evals[i] = 'correct';
        targetLetterCounts[guess[i]]--;
      }
    }

    // Step 2: Yellow matches
    for (let i = 0; i < this.wordLength; i++) {
      if (evals[i] !== 'correct') {
        const char = guess[i];
        if (targetLetterCounts[char] > 0) {
          evals[i] = 'present';
          targetLetterCounts[char]--;
        }
      }
    }

    // Update keyboard statuses
    for (let i = 0; i < this.wordLength; i++) {
      const char = guess[i];
      const status = evals[i];
      const current = this.keyStatuses[char];
      if (status === 'correct') {
        this.keyStatuses[char] = 'correct';
      } else if (status === 'present' && current !== 'correct') {
        this.keyStatuses[char] = 'present';
      } else if (!current) {
        this.keyStatuses[char] = 'absent';
      }
    }

    this.guesses.push(guess);
    this.evaluations.push(evals);
    this.currentGuess = '';

    this.updateGrid();

    // Check Win
    if (guess === target) {
      this.isGameOver = true;
      if (window.soundEngine) {
        window.soundEngine.playSuccess();
        window.soundEngine.playLevelUp();
      }
      if (window.effectsEngine) {
        window.effectsEngine.burstConfetti();
        window.effectsEngine.triggerComboPill();
      }
      if (this.onScoreUpdate) this.onScoreUpdate(100 - (this.guesses.length - 1) * 15);
      this.renderGameOver(true);
      return;
    }

    // Check Loss
    if (this.guesses.length >= this.maxGuesses) {
      this.isGameOver = true;
      if (window.soundEngine) window.soundEngine.playWrong();
      
      // Xatolar sandig'iga qo'shish
      if (window.app && window.app.addMistakeWord) {
        window.app.addMistakeWord(this.targetWordObj);
      }

      this.renderGameOver(false);
      return;
    }

    if (window.soundEngine) window.soundEngine.playClick();
  }

  showToast(msg) {
    const resBox = document.getElementById('wordle-result-container');
    if (!resBox) return;
    resBox.innerHTML = `<div class="wordle-toast">${msg}</div>`;
    setTimeout(() => {
      if (resBox.innerHTML.includes(msg)) resBox.innerHTML = '';
    }, 2000);
  }

  renderGameOver(isWon) {
    const resBox = document.getElementById('wordle-result-container');
    if (!resBox) return;

    const safeWord = this.targetWordObj.word.replace(/'/g, "\\'");
    resBox.innerHTML = `
      <div class="wordle-reveal-card ${isWon ? 'won' : 'lost'} ios-glass-panel">
        <div class="wordle-reveal-header">
          <span class="reveal-badge">${isWon ? '🎉 TABRIKLAYMIZ! TOPDINGIZ!' : '⌛ KEYINGI SAFAR TOPASIZ!'}</span>
          <button class="wordle-speak-btn ios-button" onclick="window.soundEngine.speak('${safeWord}')">
            🔊 Tinglash
          </button>
        </div>

        <h3 class="wordle-reveal-en">${this.targetWordObj.word}</h3>
        <p class="wordle-reveal-phonetic">${this.targetWordObj.phonetic || ''}</p>
        
        <div class="wordle-trans-box">
          <span class="label">O'zbekcha tarjimasi:</span>
          <strong class="val">${this.targetWordObj.translation || this.targetWordObj.definition}</strong>
        </div>

        ${this.targetWordObj.fullExample ? `
          <div class="wordle-example-box">
            <span class="label">Misol gap:</span>
            <p class="example-text">"${this.targetWordObj.fullExample}"</p>
          </div>
        ` : ''}

        <div class="wordle-action-row">
          <button class="wordle-next-btn ios-button" onclick="window.activeWordleGame && window.activeWordleGame.start()">
            Keyingi So'z ➔
          </button>
        </div>
      </div>
    `;

    // Speak word
    if (window.soundEngine) {
      setTimeout(() => window.soundEngine.speak(this.targetWordObj.word), 400);
    }
  }

  destroy() {
    window.removeEventListener('keydown', this.boundKeyHandler);
    window.activeWordleGame = null;
    if (this.container) this.container.innerHTML = '';
  }
}

window.WordleGame = WordleGame;
