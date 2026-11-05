/**
 * SHADOWING STUDIO - Movie Quotes Pronunciation & Audio Shadowing Platform
 * 1,000 famous movie quotes database with STT voice recognition,
 * Levenshtein distance scoring, word-level diff visualization,
 * MediaRecorder playback comparison, and progress tracking.
 */

class ShadowingStudio {
  constructor() {
    this.quotes = [];
    this.filteredQuotes = [];
    this.currentIndex = 0;
    this.isLoading = false;

    // Audio & Speech state
    this.playbackRate = 1.0;
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.userAudioBlob = null;
    this.userAudioUrl = null;
    this.recognition = null;
    this.currentTranscript = '';
    this.synth = window.speechSynthesis || null;
    this.currentUtterance = null;
    this.isPlayingOriginal = false;
    this.isPlayingUser = false;
    this.userAudioEl = null;

    // Filters & Search
    this.activeLevel = 'ALL';
    this.activeMovie = 'ALL';
    this.searchQuery = '';
    this.onlyBookmarks = false;
    this.page = 1;
    this.pageSize = 25;

    // Persistent Storage
    this.bookmarks = new Set(JSON.parse(localStorage.getItem('lex_shadowing_bookmarks') || '[]'));
    this.progress = JSON.parse(localStorage.getItem('lex_shadowing_progress') || '{}');

    this.initSpeechRecognition();
  }

  /**
   * Asynchronously load quotes.json with lazy-loading architecture
   */
  async loadQuotes() {
    if (this.quotes.length > 0) return this.quotes;

    this.isLoading = true;
    this.showLoadingIndicator(true);

    try {
      const response = await fetch('./quotes.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.quotes = Array.isArray(data) ? data : [];
      console.log(`✓ Shadowing Studio: Loaded ${this.quotes.length} movie quotes.`);
    } catch (err) {
      console.warn('Could not fetch quotes.json, falling back to embedded quote vault:', err);
      // Resilient emergency fallback so user never sees a blank screen
      this.quotes = this.getFallbackQuotes();
    } finally {
      this.isLoading = false;
      this.showLoadingIndicator(false);
      this.populateMovieFilterDropdown();
      this.applyFilters();
      this.renderCurrentQuote();
      this.updateProgressTracker();
      this.renderQuotesList();
    }

    return this.quotes;
  }

  /**
   * SpeechRecognition initialization with cross-browser support
   */
  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API is not supported in this browser environment.');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isRecording = true;
        this.updateRecordingUI(true);
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.currentTranscript = transcript;
        console.log('🎤 Speech recognized:', transcript);
        this.analyzePronunciation(transcript);
      };

      this.recognition.onerror = (event) => {
        console.warn('SpeechRecognition error:', event.error);
        this.handleRecognitionError(event.error);
      };

      this.recognition.onend = () => {
        this.isRecording = false;
        this.updateRecordingUI(false);
      };
    } catch (err) {
      console.error('Error initializing SpeechRecognition:', err);
    }
  }

  /**
   * Handle micro & permission errors gracefully with clear Uzbek toasts
   */
  handleRecognitionError(error) {
    let msg = "Ovozni aniqlashda xatolik yuz berdi.";
    if (error === 'not-allowed') {
      msg = "Mikrofon ruxsati berilmadi. Iltimos, brauzer manzil qatoridagi qulf belgisini bosib, mikrofonga ruxsat bering!";
    } else if (error === 'no-speech') {
      msg = "Hech qanday ovoz eshitilmadi. Qayta urinib ko'ring va balandroq gapiring.";
    } else if (error === 'audio-capture') {
      msg = "Mikrofon topilmadi yoki u boshqa dastur tomonidan band qilingan.";
    } else if (error === 'network') {
      msg = "Ovozni matnga o'girish uchun internet aloqasi talab qilinadi.";
    }
    this.showToast(msg, 'warning');
  }

  /**
   * Start / Stop Recording & STT Engine
   */
  async toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  async startRecording() {
    // 1. Check protocol security
    const isSecure = window.location.protocol === 'https:' || 
                     window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
    if (!isSecure) {
      this.showToast("⚠️ Mikrofon xavfsiz (HTTPS yoki Localhost) ulanishda ishlaydi.", "warning");
    }

    // 2. Request user media stream
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];

      // Determine supported mime type
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
      let selectedMime = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      this.mediaRecorder = selectedMime ? new MediaRecorder(stream, { mimeType: selectedMime }) : new MediaRecorder(stream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const mime = selectedMime || 'audio/webm';
        this.userAudioBlob = new Blob(this.audioChunks, { type: mime });
        if (this.userAudioUrl) {
          URL.revokeObjectURL(this.userAudioUrl);
        }
        this.userAudioUrl = URL.createObjectURL(this.userAudioBlob);
        this.updateUserAudioPlayer();
        
        // Stop stream tracks to free microphone
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.updateRecordingUI(true);

      // Start STT if available
      if (this.recognition) {
        try {
          this.recognition.start();
        } catch (e) {
          console.warn('Recognition already started or busy:', e);
        }
      } else {
        this.showToast("🎙️ Ovoz yozilmoqda... (Brauzeringizda jonli STT bo'lmasa, audio yozuv saqlanadi)", "info");
      }

    } catch (err) {
      console.error('Microphone access denied or failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.showToast("🚫 Mikrofonga ruxsat berilmadi! Brauzeringiz sozlamalarida mikrofonga ruxsat bering.", "danger");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        this.showToast("🔌 Mikrofon qurilmasi topilmadi. Mikrofon ulanganligini tekshiring.", "danger");
      } else {
        this.showToast(`Xatolik: ${err.message || 'Mikrofonga ulanib bo‘lmadi'}`, "danger");
      }
      this.isRecording = false;
      this.updateRecordingUI(false);
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        console.warn('Error stopping mediaRecorder:', e);
      }
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('Error stopping recognition:', e);
      }
    }

    this.isRecording = false;
    this.updateRecordingUI(false);
  }

  /**
   * Levenshtein Distance & Word-level Matching Algorithm
   * Computes accurate 0% - 100% pronunciation score.
   */
  calculateLevenshteinDistance(a, b) {
    const s1 = a.toLowerCase();
    const s2 = b.toLowerCase();
    const m = s1.length;
    const n = s2.length;
    
    if (m === 0) return n;
    if (n === 0) return m;

    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,       // deletion
          dp[i][j - 1] + 1,       // insertion
          dp[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return dp[m][n];
  }

  cleanWord(w) {
    return (w || '').toLowerCase().replace(/[^a-z0-9']/g, '').trim();
  }

  analyzePronunciation(transcript) {
    const currentQuote = this.getCurrentQuote();
    if (!currentQuote) return;

    const targetWords = currentQuote.en.split(/\s+/).filter(Boolean);
    const spokenWords = transcript.split(/\s+/).filter(Boolean);

    const cleanTargetWords = targetWords.map(w => this.cleanWord(w));
    const cleanSpokenWords = spokenWords.map(w => this.cleanWord(w));

    // 1. Word-level alignment & diff calculation
    const matchedSpokenIndices = new Set();
    const diffTokens = [];
    let correctCount = 0;

    cleanTargetWords.forEach((targetClean, idx) => {
      const origWord = targetWords[idx];
      let foundMatch = false;

      // Check within a reasonable window for spoken match
      for (let sIdx = 0; sIdx < cleanSpokenWords.length; sIdx++) {
        if (matchedSpokenIndices.has(sIdx)) continue;

        const spokenClean = cleanSpokenWords[sIdx];
        if (targetClean === spokenClean) {
          foundMatch = true;
          matchedSpokenIndices.add(sIdx);
          break;
        } else if (targetClean.length > 3 && this.calculateLevenshteinDistance(targetClean, spokenClean) <= 1) {
          // Allow minor 1-char acoustic variance in speech recognition
          foundMatch = true;
          matchedSpokenIndices.add(sIdx);
          break;
        }
      }

      if (foundMatch) {
        correctCount++;
        diffTokens.push({ word: origWord, status: 'correct' });
      } else {
        diffTokens.push({ word: origWord, status: 'wrong' });
      }
    });

    // 2. Compute Levenshtein distance on full string
    const fullTargetClean = cleanTargetWords.join(' ');
    const fullSpokenClean = cleanSpokenWords.join(' ');
    const maxLen = Math.max(fullTargetClean.length, fullSpokenClean.length) || 1;
    const levDist = this.calculateLevenshteinDistance(fullTargetClean, fullSpokenClean);
    const stringSimRatio = Math.max(0, 1 - (levDist / maxLen));

    // 3. Word-level ratio
    const wordRatio = cleanTargetWords.length > 0 ? (correctCount / cleanTargetWords.length) : 0;

    // 4. Blended final percentage score
    let finalScore = Math.round((wordRatio * 0.7 + stringSimRatio * 0.3) * 100);
    finalScore = Math.min(100, Math.max(0, finalScore));

    // Save progress to LocalStorage
    this.saveProgress(currentQuote.id, finalScore);

    // Render results in UI
    this.renderDiffResult(diffTokens, transcript, finalScore);

    // Audio & Visual celebratory effects
    if (finalScore >= 80) {
      if (window.effectsEngine) {
        if (window.effectsEngine.burstConfetti) window.effectsEngine.burstConfetti();
        else if (window.effectsEngine.triggerConfetti) window.effectsEngine.triggerConfetti();
      }
      if (window.soundEngine && window.soundEngine.success) window.soundEngine.success();
      this.showToast(`🎉 A'lo natija: ${finalScore}% moslik!`, 'success');
    } else if (finalScore >= 50) {
      if (window.soundEngine && window.soundEngine.correct) window.soundEngine.correct();
      this.showToast(`👍 Yaxshi: ${finalScore}%. Yana bir bor mashq qiling!`, 'info');
    } else {
      if (window.effectsEngine) {
        const resultCard = document.getElementById('shadowing-diff-card');
        if (resultCard && window.effectsEngine.shakeElement) {
          window.effectsEngine.shakeElement(resultCard);
        }
      }
      if (window.soundEngine && window.soundEngine.wrong) window.soundEngine.wrong();
      this.showToast(`⚡ ${finalScore}% moslik. So'zlarni aniqroq talaffuz qiling.`, 'warning');
    }

    this.updateProgressTracker();
  }

  saveProgress(quoteId, score) {
    if (!this.progress[quoteId]) {
      this.progress[quoteId] = { bestScore: score, attempts: 1, lastTrained: new Date().toISOString() };
    } else {
      this.progress[quoteId].bestScore = Math.max(this.progress[quoteId].bestScore, score);
      this.progress[quoteId].attempts += 1;
      this.progress[quoteId].lastTrained = new Date().toISOString();
    }
    localStorage.setItem('lex_shadowing_progress', JSON.stringify(this.progress));

    // Record activity in daily tracker if available
    if (window.app && window.app.recordDailyActivity) {
      window.app.recordDailyActivity(1);
    }
  }

  /**
   * Render word-by-word visual diff highlighting
   */
  renderDiffResult(diffTokens, spokenTranscript, score) {
    const container = document.getElementById('shadowing-diff-card');
    if (!container) return;

    let badgeClass = 'score-high';
    let feedbackText = "Mukammal talaffuz!";
    if (score < 50) {
      badgeClass = 'score-low';
      feedbackText = "Talaffuzni qayta tinglab, mashq qiling.";
    } else if (score < 80) {
      badgeClass = 'score-mid';
      feedbackText = "Yaxshi harakat! Kamchiliklarni to'g'irlang.";
    }

    const wordsHtml = diffTokens.map(t => {
      if (t.status === 'correct') {
        return `<span class="diff-word diff-correct" title="To'g'ri talaffuz">${this.escapeHtml(t.word)}</span>`;
      } else {
        return `<span class="diff-word diff-wrong" title="Xato yoki aytilmadi">${this.escapeHtml(t.word)}</span>`;
      }
    }).join(' ');

    container.innerHTML = `
      <div class="diff-header-row">
        <div class="diff-score-badge ${badgeClass}">
          <span class="score-number">${score}%</span>
          <span class="score-label">${feedbackText}</span>
        </div>
        <div class="diff-legend">
          <span class="legend-item"><span class="legend-dot green"></span> To'g'ri</span>
          <span class="legend-item"><span class="legend-dot red"></span> Tushib qolgan/Xato</span>
        </div>
      </div>

      <div class="diff-words-container ios-glass-panel">
        <div class="diff-label">Tahlil qilingan so'zlar:</div>
        <div class="diff-rendered-phrase">${wordsHtml}</div>
      </div>

      <div class="diff-transcript-box">
        <span class="transcript-icon">🎙️</span>
        <div class="transcript-content">
          <strong>Siz aytgan matn (STT):</strong>
          <p class="spoken-text">"${this.escapeHtml(spokenTranscript)}"</p>
        </div>
      </div>
    `;

    container.style.display = 'block';
  }

  /**
   * Play original speech via Web SpeechSynthesis API
   */
  playOriginalSpeech() {
    if (!this.synth) {
      this.showToast("Brauzeringiz ovoz sintezini (TTS) qo'llab-quvvatlamaydi.", "warning");
      return;
    }

    const currentQuote = this.getCurrentQuote();
    if (!currentQuote) return;

    this.synth.cancel(); // Stop any pending speech

    const utterance = new SpeechSynthesisUtterance(currentQuote.en);
    utterance.lang = 'en-US';
    utterance.rate = this.playbackRate;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isPlayingOriginal = true;
      this.updatePlayBtnUI(true);
    };

    utterance.onend = () => {
      this.isPlayingOriginal = false;
      this.updatePlayBtnUI(false);
    };

    utterance.onerror = () => {
      this.isPlayingOriginal = false;
      this.updatePlayBtnUI(false);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  stopOriginalSpeech() {
    if (this.synth) {
      this.synth.cancel();
      this.isPlayingOriginal = false;
      this.updatePlayBtnUI(false);
    }
  }

  setPlaybackSpeed(speed) {
    this.playbackRate = parseFloat(speed);
    const speedSlider = document.getElementById('shadow-speed-slider');
    const speedLabel = document.getElementById('shadow-speed-val');
    if (speedSlider) speedSlider.value = this.playbackRate;
    if (speedLabel) speedLabel.innerText = `${this.playbackRate.toFixed(2)}x`;

    // Highlight matching pill
    document.querySelectorAll('.speed-pill-btn').forEach(btn => {
      const btnSpeed = parseFloat(btn.getAttribute('data-speed'));
      btn.classList.toggle('active', Math.abs(btnSpeed - this.playbackRate) < 0.05);
    });

    if (this.isPlayingOriginal) {
      this.playOriginalSpeech();
    }
  }

  /**
   * Compare user's recording with original quote audio
   */
  updateUserAudioPlayer() {
    const container = document.getElementById('user-audio-player-wrap');
    if (!container || !this.userAudioUrl) return;

    container.innerHTML = `
      <div class="user-audio-player ios-glass-panel">
        <div class="player-label-wrap">
          <span class="user-mic-icon">🎧</span>
          <span class="user-mic-title">Sizning yozib olingan ovozingiz</span>
        </div>
        <div class="player-controls-row">
          <button class="ios-action-button small play-user-btn" id="play-user-audio-btn" onclick="window.shadowingStudio.playUserAudio()">
            ▶️ Tinglash
          </button>
          <button class="ios-action-button small compare-both-btn" onclick="window.shadowingStudio.playComparisonDual()">
            🔄 Original va Ovozni ketma-ket eshitish
          </button>
        </div>
      </div>
    `;
    container.style.display = 'block';
  }

  playUserAudio() {
    if (!this.userAudioUrl) return;
    if (this.userAudioEl) {
      this.userAudioEl.pause();
    }
    this.userAudioEl = new Audio(this.userAudioUrl);
    const btn = document.getElementById('play-user-audio-btn');
    if (btn) btn.innerText = "⏸️ To'xtatish";

    this.userAudioEl.onended = () => {
      if (btn) btn.innerText = "▶️ Tinglash";
    };

    this.userAudioEl.play().catch(e => console.warn('Could not play user audio:', e));
  }

  playComparisonDual() {
    // 1. Play original speech
    this.playOriginalSpeech();

    // 2. Once finished, play user's recording
    if (this.currentUtterance) {
      this.currentUtterance.onend = () => {
        this.isPlayingOriginal = false;
        this.updatePlayBtnUI(false);
        setTimeout(() => {
          this.playUserAudio();
        }, 500);
      };
    }
  }

  /**
   * Navigation and Filter Logic
   */
  getCurrentQuote() {
    if (this.filteredQuotes.length === 0) return null;
    return this.filteredQuotes[this.currentIndex] || null;
  }

  nextQuote() {
    if (this.filteredQuotes.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.filteredQuotes.length;
    this.resetPerQuoteState();
    this.renderCurrentQuote();
    this.scrollQuoteIntoViewInList();
  }

  prevQuote() {
    if (this.filteredQuotes.length === 0) return;
    this.currentIndex = (this.currentIndex - 1 + this.filteredQuotes.length) % this.filteredQuotes.length;
    this.resetPerQuoteState();
    this.renderCurrentQuote();
    this.scrollQuoteIntoViewInList();
  }

  randomQuote() {
    if (this.filteredQuotes.length <= 1) return;
    let newIdx = Math.floor(Math.random() * this.filteredQuotes.length);
    if (newIdx === this.currentIndex) {
      newIdx = (newIdx + 1) % this.filteredQuotes.length;
    }
    this.currentIndex = newIdx;
    this.resetPerQuoteState();
    this.renderCurrentQuote();
    this.scrollQuoteIntoViewInList();
  }

  selectQuoteById(id) {
    const idx = this.filteredQuotes.findIndex(q => q.id === id);
    if (idx !== -1) {
      this.currentIndex = idx;
      this.resetPerQuoteState();
      this.renderCurrentQuote();
      if (typeof window.scrollTo === 'function') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  toggleBookmark(id) {
    if (this.bookmarks.has(id)) {
      this.bookmarks.delete(id);
      this.showToast("Bookmarkdan olib tashlandi", "info");
    } else {
      this.bookmarks.add(id);
      this.showToast("⭐ Saqlanganlarga qo'shildi!", "success");
    }
    localStorage.setItem('lex_shadowing_bookmarks', JSON.stringify(Array.from(this.bookmarks)));
    this.renderCurrentQuote();
    this.renderQuotesList();
  }

  applyFilters() {
    let result = [...this.quotes];

    // Filter by Level
    if (this.activeLevel !== 'ALL') {
      result = result.filter(q => q.level === this.activeLevel);
    }

    // Filter by Movie
    if (this.activeMovie !== 'ALL') {
      result = result.filter(q => q.movie === this.activeMovie);
    }

    // Filter by Bookmarks only
    if (this.onlyBookmarks) {
      result = result.filter(q => this.bookmarks.has(q.id));
    }

    // Filter by Search Query (English or Uzbek)
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(item => 
        (item.en && item.en.toLowerCase().includes(q)) ||
        (item.uz && item.uz.toLowerCase().includes(q)) ||
        (item.movie && item.movie.toLowerCase().includes(q))
      );
    }

    this.filteredQuotes = result;
    this.currentIndex = 0;
    this.page = 1;
  }

  setLevelFilter(level) {
    this.activeLevel = level;
    document.querySelectorAll('.shadow-level-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-level') === level);
    });
    this.applyFilters();
    this.resetPerQuoteState();
    this.renderCurrentQuote();
    this.renderQuotesList();
  }

  setMovieFilter(movie) {
    this.activeMovie = movie;
    this.applyFilters();
    this.resetPerQuoteState();
    this.renderCurrentQuote();
    this.renderQuotesList();
  }

  setSearchQuery(query) {
    this.searchQuery = (query || '').trim();
    this.applyFilters();
    this.resetPerQuoteState();
    this.renderCurrentQuote();
    this.renderQuotesList();
  }

  toggleBookmarksOnly() {
    this.onlyBookmarks = !this.onlyBookmarks;
    const btn = document.getElementById('shadow-only-bookmarks-btn');
    if (btn) btn.classList.toggle('active', this.onlyBookmarks);
    this.applyFilters();
    this.resetPerQuoteState();
    this.renderCurrentQuote();
    this.renderQuotesList();
  }

  resetPerQuoteState() {
    this.stopOriginalSpeech();
    this.stopRecording();
    this.currentTranscript = '';
    this.userAudioBlob = null;
    if (this.userAudioUrl) {
      URL.revokeObjectURL(this.userAudioUrl);
      this.userAudioUrl = null;
    }
    const diffContainer = document.getElementById('shadowing-diff-card');
    if (diffContainer) {
      diffContainer.style.display = 'none';
      diffContainer.innerHTML = '';
    }
    const userAudioWrap = document.getElementById('user-audio-player-wrap');
    if (userAudioWrap) {
      userAudioWrap.style.display = 'none';
      userAudioWrap.innerHTML = '';
    }
  }

  /**
   * UI Rendering
   */
  renderCurrentQuote() {
    const quote = this.getCurrentQuote();
    const container = document.getElementById('shadowing-quote-stage');
    if (!container) return;

    if (!quote) {
      container.innerHTML = `
        <div class="empty-shadow-state ios-glass-panel">
          <span class="empty-icon">🎬</span>
          <h3>Hech qanday iqtibos topilmadi</h3>
          <p>Filtr parametrlarini o'zgartiring yoki qidiruvni tozalang.</p>
          <button class="ios-action-button" onclick="window.shadowingStudio.resetFilters()">Filtrlarni tozalash</button>
        </div>
      `;
      return;
    }

    const isBookmarked = this.bookmarks.has(quote.id);
    const record = this.progress[quote.id] || null;
    const bestScore = record ? `${record.bestScore}%` : '—';

    container.innerHTML = `
      <div class="shadow-quote-card ios-glass-panel">
        <div class="quote-top-badges">
          <div class="left-badges">
            <span class="shadow-badge movie-pill">🎬 ${this.escapeHtml(quote.movie)}</span>
            <span class="shadow-badge level-pill level-${quote.level.toLowerCase()}">${quote.level}</span>
            <span class="shadow-badge id-pill">#${quote.id} / ${this.quotes.length}</span>
          </div>
          <button class="quote-bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" 
                  onclick="window.shadowingStudio.toggleBookmark(${quote.id})" 
                  title="${isBookmarked ? 'Saqlanganlardan o‘chirish' : 'Saqlab qo‘yish'}">
            ${isBookmarked ? '⭐' : '☆'}
          </button>
        </div>

        <div class="quote-main-content">
          <div class="quote-english-text" id="target-quote-en">
            "${this.escapeHtml(quote.en)}"
          </div>
          <div class="quote-uzbek-translation">
            🇺🇿 ${this.escapeHtml(quote.uz)}
          </div>
        </div>

        <div class="quote-footer-meta">
          <span class="meta-item">🎯 Eng yaxshi natija: <strong>${bestScore}</strong></span>
          <span class="meta-item">🔄 Urinishlar: <strong>${record ? record.attempts : 0}</strong></span>
        </div>
      </div>
    `;

    // Update active highlight in list
    document.querySelectorAll('.quote-list-item').forEach(el => {
      const qId = parseInt(el.getAttribute('data-id'));
      el.classList.toggle('active-quote', qId === quote.id);
    });
  }

  renderQuotesList() {
    const listContainer = document.getElementById('shadowing-quotes-list');
    const counterEl = document.getElementById('shadow-results-count');
    if (!listContainer) return;

    if (counterEl) {
      counterEl.innerText = `${this.filteredQuotes.length} ta ibora`;
    }

    const visibleItems = this.filteredQuotes.slice(0, this.page * this.pageSize);
    const currentQ = this.getCurrentQuote();

    listContainer.innerHTML = visibleItems.map((q, idx) => {
      const isBookmarked = this.bookmarks.has(q.id);
      const prog = this.progress[q.id];
      const isCurrent = currentQ && currentQ.id === q.id;

      let scoreTag = '';
      if (prog) {
        const color = prog.bestScore >= 80 ? 'green' : prog.bestScore >= 50 ? 'orange' : 'gray';
        scoreTag = `<span class="score-tag ${color}">${prog.bestScore}%</span>`;
      }

      return `
        <div class="quote-list-item ios-glass-panel ${isCurrent ? 'active-quote' : ''}" 
             data-id="${q.id}" 
             onclick="window.shadowingStudio.selectQuoteById(${q.id})">
          <div class="quote-list-item-top">
            <span class="item-id">#${q.id}</span>
            <span class="item-movie">${this.escapeHtml(q.movie)}</span>
            <span class="item-level">${q.level}</span>
            ${scoreTag}
            ${isBookmarked ? '<span class="item-star">⭐</span>' : ''}
          </div>
          <div class="item-en">"${this.escapeHtml(q.en)}"</div>
          <div class="item-uz">${this.escapeHtml(q.uz)}</div>
        </div>
      `;
    }).join('');

    const loadMoreBtn = document.getElementById('shadow-load-more-btn');
    if (loadMoreBtn) {
      loadMoreBtn.style.display = (this.page * this.pageSize < this.filteredQuotes.length) ? 'block' : 'none';
    }
  }

  loadMoreQuotes() {
    this.page++;
    this.renderQuotesList();
  }

  scrollQuoteIntoViewInList() {
    const currentQ = this.getCurrentQuote();
    if (!currentQ) return;
    const itemEl = document.querySelector(`.quote-list-item[data-id="${currentQ.id}"]`);
    if (itemEl) {
      itemEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  populateMovieFilterDropdown() {
    const select = document.getElementById('shadow-movie-select');
    if (!select) return;

    const movies = Array.from(new Set(this.quotes.map(q => q.movie))).sort();
    select.innerHTML = '<option value="ALL">🎬 Barcha Filmlar (1000)</option>' + 
      movies.map(m => `<option value="${this.escapeHtml(m)}">${this.escapeHtml(m)}</option>`).join('');
  }

  updateProgressTracker() {
    const countEl = document.getElementById('shadow-learned-count');
    const barEl = document.getElementById('shadow-progress-bar-fill');
    if (!countEl) return;

    const practicedIds = Object.keys(this.progress).map(id => parseInt(id));
    const totalPracticed = practicedIds.length;
    const totalMastered = practicedIds.filter(id => this.progress[id].bestScore >= 80).length;
    const totalCount = this.quotes.length || 1000;

    const percent = Math.min(100, Math.round((totalPracticed / totalCount) * 100));

    countEl.innerHTML = `<strong>${totalPracticed}</strong> / ${totalCount} mashq qilindi (${totalMastered} ta a'lo 🎯)`;
    if (barEl) {
      barEl.style.width = `${percent}%`;
    }
  }

  updateRecordingUI(isRec) {
    const btn = document.getElementById('shadow-record-btn');
    const waveEl = document.getElementById('shadow-mic-pulse');
    if (btn) {
      if (isRec) {
        btn.classList.add('recording-active');
        btn.innerHTML = `<span class="mic-wave-pulse"></span> ⏹️ TO'XTATISH`;
      } else {
        btn.classList.remove('recording-active');
        btn.innerHTML = `🎙️ OVOZNI YOZISH / GAPIRISH`;
      }
    }
    if (waveEl) {
      waveEl.style.display = isRec ? 'flex' : 'none';
    }
  }

  updatePlayBtnUI(isPlaying) {
    const btn = document.getElementById('shadow-play-btn');
    if (btn) {
      btn.innerHTML = isPlaying ? `⏹️ TO'XTATISH` : `🔊 ORIGINALNI TINGLASH`;
      btn.classList.toggle('playing-active', isPlaying);
    }
  }

  resetFilters() {
    this.activeLevel = 'ALL';
    this.activeMovie = 'ALL';
    this.searchQuery = '';
    this.onlyBookmarks = false;

    const searchInput = document.getElementById('shadow-search-input');
    if (searchInput) searchInput.value = '';

    const movieSelect = document.getElementById('shadow-movie-select');
    if (movieSelect) movieSelect.value = 'ALL';

    const bookmarksBtn = document.getElementById('shadow-only-bookmarks-btn');
    if (bookmarksBtn) bookmarksBtn.classList.remove('active');

    document.querySelectorAll('.shadow-level-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-level') === 'ALL');
    });

    this.applyFilters();
    this.resetPerQuoteState();
    this.renderCurrentQuote();
    this.renderQuotesList();
  }

  showLoadingIndicator(show) {
    const el = document.getElementById('shadow-loading-indicator');
    if (el) el.style.display = show ? 'block' : 'none';
  }

  showToast(message, type = 'info') {
    if (window.effectsEngine && window.effectsEngine.triggerComboPill) {
      window.effectsEngine.triggerComboPill(message);
      return;
    }

    const toast = document.createElement('div');
    toast.className = `shadow-toast shadow-toast-${type} ios-glass-panel`;
    toast.innerHTML = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  escapeHtml(str) {
    return (str || '')
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  getFallbackQuotes() {
    return [
      { id: 1, en: "May the Force be with you.", uz: "Kuch doimo sen bilan bo'lsin.", movie: "Star Wars (1977)", level: "A1" },
      { id: 2, en: "There's no place like home.", uz: "O'z uyingdek tinch va go'zal joy yo'q.", movie: "The Wizard of Oz (1939)", level: "A1" },
      { id: 3, en: "I'll be back.", uz: "Men yana qaytaman.", movie: "The Terminator (1984)", level: "A1" },
      { id: 4, en: "I'm going to make him an offer he can't refuse.", uz: "Men unga rad eta olmaydigan taklifni beraman.", movie: "The Godfather (1972)", level: "B1" },
      { id: 5, en: "Life is like a box of chocolates. You never know what you're gonna get.", uz: "Hayot shokolad qutisiga o'xshaydi. Ichidan nima chiqishini hech qachon bilmaysan.", movie: "Forrest Gump (1994)", level: "A2" },
      { id: 6, en: "To infinity and beyond!", uz: "Cheksizlik sari va undan ham olisga!", movie: "Toy Story (1995)", level: "A1" }
    ];
  }
}

// Global instance
window.shadowingStudio = new ShadowingStudio();
