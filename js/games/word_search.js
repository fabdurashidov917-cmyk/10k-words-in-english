/**
 * Game 9: Word Search Matrix (Krossvord & So'z Qidirish To'ri)
 * 10x10 harflar matritsasi. Ekranda inglizcha so'zlarning o'zbekcha tarjimalari beriladi.
 * Foydalanuvchi barmoq yoki sichqoncha bilan harflarni chizib (gorizontal, vertikal, diagonal)
 * yashiringan so'zlarni topadi. Neon binafsha va zumrad rangli iOS glassmorphism effektlari.
 */

class WordSearchGame {
  constructor(containerId, onScoreUpdate) {
    this.container = document.getElementById(containerId);
    this.onScoreUpdate = onScoreUpdate;
    this.gridSize = 10;
    this.grid = []; // 2D array [row][col] of chars
    this.wordsToFind = []; // array of { word, translation, found, cells: [{r, c}] }
    this.isSelecting = false;
    this.startCell = null; // { r, c }
    this.currentLineCells = []; // array of { r, c }
    this.foundWordsCount = 0;
    this.boundPointerUp = this.handlePointerUp.bind(this);
  }

  start(categoryId = 'all') {
    this.foundWordsCount = 0;
    this.isSelecting = false;
    this.startCell = null;
    this.currentLineCells = [];

    // Pick 5-6 appropriate words (length 4 to 8 letters, alphabetic only)
    this.wordsToFind = this.selectPuzzleWords(categoryId, 6);
    this.generateMatrix();
    this.render();
    this.bindEvents();

    if (window.soundEngine) {
      if (typeof window.soundEngine.gameStart === 'function') window.soundEngine.gameStart();
      else if (typeof window.soundEngine.buttonClick === 'function') window.soundEngine.buttonClick();
    }
  }

  selectPuzzleWords(categoryId, count = 6) {
    let pool = window.wordBank ? window.wordBank.words : [];
    if (categoryId && categoryId !== 'all') {
      const filtered = pool.filter(w => w.category === categoryId);
      if (filtered.length >= 10) pool = filtered;
    }

    // Filter words suitable for a 10x10 grid (length 4 to 8, only letters A-Z)
    const validWords = pool.filter(w => {
      const clean = (w.word || '').trim().toUpperCase();
      return clean.length >= 4 && clean.length <= 8 && /^[A-Z]+$/.test(clean);
    });

    const shuffled = window.wordBank ? window.wordBank.cryptoShuffle(validWords) : validWords;
    const selected = [];
    const usedWords = new Set();

    for (const item of shuffled) {
      const upper = item.word.trim().toUpperCase();
      if (!usedWords.has(upper)) {
        usedWords.add(upper);
        selected.push({
          word: upper,
          translation: item.translation || item.definition || 'Tarjima',
          found: false,
          cells: []
        });
        if (selected.length >= count) break;
      }
    }

    // Fallbacks if pool was too small
    if (selected.length < count) {
      const defaults = [
        { word: 'ACHIEVE', translation: 'erishmoq' },
        { word: 'BENEFIT', translation: 'foyda' },
        { word: 'DECIDE', translation: 'qaror qilmoq' },
        { word: 'FUTURE', translation: 'kelajak' },
        { word: 'NATURE', translation: 'tabiat' },
        { word: 'SHADOW', translation: 'soya' }
      ];
      for (const d of defaults) {
        if (!usedWords.has(d.word)) {
          selected.push({ ...d, found: false, cells: [] });
          if (selected.length >= count) break;
        }
      }
    }

    return selected;
  }

  generateMatrix() {
    const size = this.gridSize;
    this.grid = Array.from({ length: size }, () => Array(size).fill(''));

    // Placement directions: [dr, dc]
    const directions = [
      [0, 1],   // Horiz Left-to-Right
      [1, 0],   // Vert Top-to-Bottom
      [1, 1],   // Diag Down-Right
      [-1, 1],  // Diag Up-Right
      [0, -1],  // Horiz Right-to-Left (rare)
      [-1, 0]   // Vert Bottom-to-Top (rare)
    ];

    const successfullyPlaced = [];

    // Sort longest words first for higher placement success rate
    const sortedWords = [...this.wordsToFind].sort((a, b) => b.word.length - a.word.length);

    for (const item of sortedWords) {
      const word = item.word;
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 250) {
        attempts++;
        // Choose direction (bias toward horiz & vert for cleaner puzzle experience)
        const dirIndex = Math.random() < 0.75 ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * directions.length);
        const [dr, dc] = directions[dirIndex];

        // Pick starting coordinates
        const minR = dr < 0 ? (word.length - 1) : 0;
        const maxR = dr > 0 ? (size - word.length) : (size - 1);
        const minC = dc < 0 ? (word.length - 1) : 0;
        const maxC = dc > 0 ? (size - word.length) : (size - 1);

        if (minR > maxR || minC > maxC) continue;

        const startR = Math.floor(Math.random() * (maxR - minR + 1)) + minR;
        const startC = Math.floor(Math.random() * (maxC - minC + 1)) + minC;

        // Check if word fits without conflicting with existing letters
        let canPlace = true;
        const candidateCells = [];

        for (let i = 0; i < word.length; i++) {
          const r = startR + dr * i;
          const c = startC + dc * i;
          const currentCell = this.grid[r][c];

          if (currentCell !== '' && currentCell !== word[i]) {
            canPlace = false;
            break;
          }
          candidateCells.push({ r, c });
        }

        if (canPlace) {
          for (let i = 0; i < word.length; i++) {
            const { r, c } = candidateCells[i];
            this.grid[r][c] = word[i];
          }
          item.cells = candidateCells;
          successfullyPlaced.push(item);
          placed = true;
        }
      }
    }

    // Keep only placed words in active list
    this.wordsToFind = successfullyPlaced;

    // Fill remaining empty cells with random letters
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    // Frequency biased alphabet for natural appearance
    const weightedAlphabet = 'EEEEAAAAIIIOOONNNRRRTTTSSSLLLDDDGGGBCFHJKMPQUVWXYZ';

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (this.grid[r][c] === '') {
          const randChar = weightedAlphabet[Math.floor(Math.random() * weightedAlphabet.length)] || alphabet[Math.floor(Math.random() * alphabet.length)];
          this.grid[r][c] = randChar;
        }
      }
    }
  }

  render() {
    if (!this.container) return;

    const size = this.gridSize;
    let gridHtml = '';

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const letter = this.grid[r][c];
        gridHtml += `
          <div class="ws-cell" data-row="${r}" data-col="${c}">
            <span class="ws-letter">${letter}</span>
          </div>
        `;
      }
    }

    const cluesHtml = this.wordsToFind.map((item, idx) => `
      <div class="ws-clue-item ${item.found ? 'found' : ''}" data-word-idx="${idx}" onclick="window.soundEngine && window.soundEngine.speakWord('${item.word}')">
        <span class="ws-clue-status">${item.found ? '✓' : '○'}</span>
        <div class="ws-clue-info">
          <span class="ws-clue-uzbek">${item.translation}</span>
          <span class="ws-clue-eng">${item.found ? item.word : `${item.word.length} ta harf`}</span>
        </div>
        <span class="ws-clue-speaker" title="Talaffuzni eshitish">🔊</span>
      </div>
    `).join('');

    this.container.innerHTML = `
      <div class="ws-arena-wrapper ios-glass-panel">
        
        <!-- Header HUD -->
        <div class="ws-header-hud">
          <div class="ws-progress-box">
            <span class="ws-hud-label">Topilgan so'zlar:</span>
            <span class="ws-hud-val" id="ws-found-count">${this.foundWordsCount} / ${this.wordsToFind.length}</span>
          </div>
          
          <div class="ws-live-selection-pill" id="ws-live-selection">
            <span class="ws-sel-placeholder">Harflarni ustidan barmog'ingiz bilan chizing</span>
          </div>

          <button class="ws-restart-btn ios-button" id="ws-restart-btn">
            🔄 Yangi To'r
          </button>
        </div>

        <!-- Main Play Area: Matrix Grid & Clues Panel -->
        <div class="ws-play-area">
          
          <!-- 10x10 Matrix Board -->
          <div class="ws-grid-board-container">
            <div class="ws-grid-board" id="ws-grid-board" style="--grid-size: ${size};">
              ${gridHtml}
            </div>
            <div class="ws-swipe-hint">💡 Gorizontal, vertikal yoki diagonal yo'nalishda chizing</div>
          </div>

          <!-- Target Words & Uzbek Clues -->
          <div class="ws-clues-panel">
            <div class="ws-clues-header">
              <span class="ws-clues-title">🎯 Yashiringan So'zlar:</span>
              <span class="ws-clues-sub">O'zbekcha ma'nosi bo'yicha toping</span>
            </div>
            <div class="ws-clues-list" id="ws-clues-list">
              ${cluesHtml}
            </div>
          </div>

        </div>

      </div>
    `;

    document.getElementById('ws-restart-btn')?.addEventListener('click', () => {
      this.start(window.app ? window.app.selectedCategory : 'all');
    });
  }

  bindEvents() {
    const board = document.getElementById('ws-grid-board');
    if (!board) return;

    // Pointer events (unifies mouse and touch dragging across iOS and Android)
    board.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
    board.addEventListener('pointermove', (e) => this.handlePointerMove(e));
    window.addEventListener('pointerup', this.boundPointerUp);
    window.addEventListener('pointercancel', this.boundPointerUp);
  }

  getCellFromPoint(clientX, clientY) {
    const target = document.elementFromPoint(clientX, clientY);
    if (!target) return null;
    const cellEl = target.closest('.ws-cell');
    if (!cellEl) return null;
    const r = parseInt(cellEl.getAttribute('data-row'), 10);
    const c = parseInt(cellEl.getAttribute('data-col'), 10);
    if (isNaN(r) || isNaN(c)) return null;
    return { r, c, el: cellEl };
  }

  handlePointerDown(e) {
    e.preventDefault();
    const cell = this.getCellFromPoint(e.clientX, e.clientY);
    if (!cell) return;

    this.isSelecting = true;
    this.startCell = { r: cell.r, c: cell.c };
    this.currentLineCells = [this.startCell];
    this.updateSelectionDisplay();

    if (window.soundEngine) window.soundEngine.cardHover();
  }

  handlePointerMove(e) {
    if (!this.isSelecting || !this.startCell) return;
    e.preventDefault();

    const currentCell = this.getCellFromPoint(e.clientX, e.clientY);
    if (!currentCell) return;

    // Calculate line from startCell to currentCell
    const line = this.getStraightLine(this.startCell, currentCell);
    if (line) {
      this.currentLineCells = line;
      this.updateSelectionDisplay();
    }
  }

  getStraightLine(start, end) {
    const dr = end.r - start.r;
    const dc = end.c - start.c;

    // Check if movement is along a straight line:
    // Horizontal (dr === 0), Vertical (dc === 0), or Diagonal (abs(dr) === abs(dc))
    const isHoriz = dr === 0;
    const isVert = dc === 0;
    const isDiag = Math.abs(dr) === Math.abs(dc);

    if (!isHoriz && !isVert && !isDiag) {
      return null; // Not a straight line
    }

    const steps = Math.max(Math.abs(dr), Math.abs(dc));
    if (steps === 0) return [start];

    const stepR = dr === 0 ? 0 : dr / steps;
    const stepC = dc === 0 ? 0 : dc / steps;

    const line = [];
    for (let i = 0; i <= steps; i++) {
      line.push({
        r: start.r + stepR * i,
        c: start.c + stepC * i
      });
    }

    return line;
  }

  updateSelectionDisplay() {
    // Clear previous selecting highlight (without affecting permanently found cells)
    const board = document.getElementById('ws-grid-board');
    if (!board) return;

    board.querySelectorAll('.ws-cell.selecting').forEach(el => el.classList.remove('selecting'));

    let selectedChars = '';
    for (const pos of this.currentLineCells) {
      const cellEl = board.querySelector(`.ws-cell[data-row="${pos.r}"][data-col="${pos.c}"]`);
      if (cellEl) cellEl.classList.add('selecting');
      selectedChars += (this.grid[pos.r] && this.grid[pos.r][pos.c]) || '';
    }

    // Update live HUD selection pill
    const hudPill = document.getElementById('ws-live-selection');
    if (hudPill) {
      if (selectedChars.length > 0) {
        hudPill.innerHTML = `<span class="ws-sel-active">${selectedChars}</span>`;
      } else {
        hudPill.innerHTML = `<span class="ws-sel-placeholder">Harflarni chizing</span>`;
      }
    }
  }

  handlePointerUp(e) {
    if (!this.isSelecting) return;
    this.isSelecting = false;

    // Extract selected word string
    let formedWord = '';
    for (const pos of this.currentLineCells) {
      formedWord += (this.grid[pos.r] && this.grid[pos.r][pos.c]) || '';
    }
    const reversedWord = formedWord.split('').reverse().join('');

    // Check if formedWord or reversedWord matches any unfound target word
    const matchItem = this.wordsToFind.find(item => !item.found && (item.word === formedWord || item.word === reversedWord));

    if (matchItem) {
      // SUCCESS: Word found!
      matchItem.found = true;
      this.foundWordsCount++;

      // Play success audio & score
      if (window.soundEngine) {
        if (typeof window.soundEngine.playCorrect === 'function') window.soundEngine.playCorrect();
        else if (typeof window.soundEngine.match === 'function') window.soundEngine.match();
      }
      if (this.onScoreUpdate) {
        this.onScoreUpdate(40, { word: matchItem.word, reason: 'wordsearch_found' });
      }

      // Mark permanently found cells on board
      const board = document.getElementById('ws-grid-board');
      if (board) {
        for (const pos of this.currentLineCells) {
          const cellEl = board.querySelector(`.ws-cell[data-row="${pos.r}"][data-col="${pos.c}"]`);
          if (cellEl) {
            cellEl.classList.remove('selecting');
            cellEl.classList.add('found');
          }
        }
      }

      // Update HUD count
      const countEl = document.getElementById('ws-found-count');
      if (countEl) countEl.innerText = `${this.foundWordsCount} / ${this.wordsToFind.length}`;

      // Update clue item
      const clueIdx = this.wordsToFind.indexOf(matchItem);
      const clueEl = document.querySelector(`.ws-clue-item[data-word-idx="${clueIdx}"]`);
      if (clueEl) {
        clueEl.classList.add('found');
        clueEl.querySelector('.ws-clue-status').innerText = '✓';
        clueEl.querySelector('.ws-clue-eng').innerText = matchItem.word;
      }

      // Speak word pronunciation
      if (window.soundEngine) {
        const speaker = window.soundEngine.speak || window.soundEngine.speakWord;
        if (typeof speaker === 'function') {
          setTimeout(() => speaker.call(window.soundEngine, matchItem.word), 250);
        }
      }

      // Check if board complete
      if (this.foundWordsCount >= this.wordsToFind.length) {
        this.handlePuzzleComplete();
      }

    } else {
      // MISSED: Clear selection
      const board = document.getElementById('ws-grid-board');
      if (board) {
        board.querySelectorAll('.ws-cell.selecting').forEach(el => el.classList.remove('selecting'));
      }
    }

    // Reset selection state
    this.startCell = null;
    this.currentLineCells = [];
    const hudPill = document.getElementById('ws-live-selection');
    if (hudPill && this.foundWordsCount < this.wordsToFind.length) {
      hudPill.innerHTML = `<span class="ws-sel-placeholder">Harflarni ustidan barmog'ingiz bilan chizing</span>`;
    }
  }

  handlePuzzleComplete() {
    if (window.soundEngine) {
      if (typeof window.soundEngine.playLevelUp === 'function') window.soundEngine.playLevelUp();
      else if (typeof window.soundEngine.levelUp === 'function') window.soundEngine.levelUp();
    }
    if (window.effectsEngine) window.effectsEngine.triggerConfetti();

    if (this.onScoreUpdate) {
      this.onScoreUpdate(150, { reason: 'wordsearch_board_cleared' });
    }

    const hudPill = document.getElementById('ws-live-selection');
    if (hudPill) {
      hudPill.innerHTML = `<span class="ws-sel-win">🎉 TABRIKLAYMIZ! BARCHA SO'ZLAR TOPILDI (+150 XP)</span>`;
    }

    // Show completion modal or banner
    setTimeout(() => {
      const board = document.getElementById('ws-grid-board');
      if (board) {
        const winBanner = document.createElement('div');
        winBanner.className = 'ws-victory-overlay ios-glass-panel';
        winBanner.innerHTML = `
          <div class="ws-victory-badge">👑 MATRITSA ZABT ETILDI!</div>
          <h3>Ajoyib Natija!</h3>
          <p>Siz barcha ${this.wordsToFind.length} ta yashiringan so'zni muvaffaqiyatli topdingiz.</p>
          <div class="ws-victory-reward">+190 XP qo'lga kiritildi</div>
          <button class="ws-play-again-btn ios-button" onclick="window.app && window.app.launchGame('wordsearch')">
            Keyingi To'rni Boshlash ➔
          </button>
        `;
        board.appendChild(winBanner);
      }
    }, 600);
  }

  destroy() {
    window.removeEventListener('pointerup', this.boundPointerUp);
    window.removeEventListener('pointercancel', this.boundPointerUp);
    if (this.container) this.container.innerHTML = '';
  }
}

// Global attachment
if (typeof window !== 'undefined') {
  window.WordSearchGame = WordSearchGame;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WordSearchGame };
}
