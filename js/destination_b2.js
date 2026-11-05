/**
 * DESTINATION B2 EXAM & GRAMMAR/VOCABULARY QUIZ ENGINE
 * 10 - 20 - 30 question single-page test sheet with bulk verification.
 * Displays concise analysis on correct answers and in-depth rules on incorrect answers.
 */

class DestinationB2Quiz {
  constructor() {
    this.allQuestions = [];
    this.filteredPool = [];
    this.activeQuestions = [];
    this.userAnswers = {}; // { [questionId]: optionIndex }
    this.testCount = 10;
    this.selectedTopic = 'ALL';
    this.isSubmitted = false;
    this.isLoading = false;
    this.score = 0;

    // Local storage history
    this.history = JSON.parse(localStorage.getItem('lex_dest_b2_history') || '[]');
  }

  async loadQuestions() {
    if (this.allQuestions.length > 0) return this.allQuestions;

    this.isLoading = true;
    this.showLoading(true);

    try {
      const res = await fetch('./destination_b2.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.allQuestions = Array.isArray(data) ? data : [];
      console.log(`✓ Destination B2: Loaded ${this.allQuestions.length} exam questions.`);
    } catch (err) {
      console.warn('Could not load destination_b2.json, using fallback pool:', err);
      this.allQuestions = this.getFallbackQuestions();
    } finally {
      this.isLoading = false;
      this.showLoading(false);
      this.populateTopicFilter();
      this.applyTopicFilter(false);
      this.startNewQuiz();
      this.updateHistoryStats();
    }

    return this.allQuestions;
  }

  populateTopicFilter() {
    const select = document.getElementById('dest-topic-select');
    if (!select) return;

    const topics = Array.from(new Set(this.allQuestions.map(q => q.topic))).filter(Boolean).sort();
    let html = '<option value="ALL">📚 Barcha Mavzular (Aralash B2 Imtihon)</option>';
    topics.forEach(t => {
      html += `<option value="${this.escapeHtml(t)}">${this.escapeHtml(t)}</option>`;
    });
    select.innerHTML = html;
  }

  setTopicFilter(topic) {
    this.selectedTopic = topic;
    this.applyTopicFilter(true);
  }

  applyTopicFilter(regenerate = true) {
    if (this.selectedTopic === 'ALL') {
      this.filteredPool = [...this.allQuestions];
    } else {
      this.filteredPool = this.allQuestions.filter(q => q.topic === this.selectedTopic);
    }

    if (this.filteredPool.length === 0) {
      this.filteredPool = [...this.allQuestions];
    }

    if (regenerate) {
      this.startNewQuiz();
    }
  }

  setTestCount(count) {
    this.testCount = parseInt(count, 10) || 10;
    document.querySelectorAll('.dest-count-pill').forEach(btn => {
      const c = parseInt(btn.getAttribute('data-count'), 10);
      btn.classList.toggle('active', c === this.testCount);
    });

    this.startNewQuiz();
  }

  startNewQuiz() {
    this.isSubmitted = false;
    this.userAnswers = {};
    this.score = 0;

    // Shuffle and pick testCount questions
    const shuffled = [...this.filteredPool].sort(() => 0.5 - Math.random());
    this.activeQuestions = shuffled.slice(0, Math.min(this.testCount, shuffled.length));

    // Render questions to page
    this.renderQuizSheet();
    this.updateBottomActionBar();

    // Scroll top of test area smoothly
    const container = document.getElementById('dest-quiz-container');
    if (container && typeof container.getBoundingClientRect === 'function' && typeof window.scrollTo === 'function') {
      const top = container.getBoundingClientRect().top + (window.scrollY || 0) - 80;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
  }

  retakeCurrentQuiz() {
    this.isSubmitted = false;
    this.userAnswers = {};
    this.score = 0;
    this.renderQuizSheet();
    this.updateBottomActionBar();

    const summaryEl = document.getElementById('dest-summary-card');
    if (summaryEl) summaryEl.style.display = 'none';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  selectOption(qId, optIdx) {
    if (this.isSubmitted) return; // Prevent changing after submit

    this.userAnswers[qId] = optIdx;

    // Update active highlight on options of this card
    const cardEl = document.getElementById(`dest-q-card-${qId}`);
    if (cardEl) {
      cardEl.querySelectorAll('.dest-option-pill').forEach((btn, idx) => {
        btn.classList.toggle('selected', idx === optIdx);
      });
      cardEl.classList.add('answered');
    }

    if (window.soundEngine && window.soundEngine.buttonClick) {
      window.soundEngine.buttonClick();
    }

    this.updateBottomActionBar();
  }

  updateBottomActionBar() {
    const answeredCount = Object.keys(this.userAnswers).length;
    const totalCount = this.activeQuestions.length;
    const progressText = document.getElementById('dest-progress-text');
    const progressBar = document.getElementById('dest-progress-fill');
    const submitBtn = document.getElementById('dest-check-all-btn');
    const bottomSubmitBtn = document.querySelector('.dest-bottom-submit-btn');

    if (progressText) {
      progressText.innerHTML = `Belgilandi: <strong>${answeredCount}</strong> / ${totalCount} ta`;
    }
    if (progressBar && totalCount > 0) {
      const pct = Math.round((answeredCount / totalCount) * 100);
      progressBar.style.width = `${pct}%`;
    }
    if (submitBtn) {
      submitBtn.disabled = this.isSubmitted || answeredCount === 0;
      if (!this.isSubmitted) submitBtn.innerHTML = 'BARCHASINI TEKSHIRISH (CHECK ALL) 🔍';
    }
    if (bottomSubmitBtn) {
      bottomSubmitBtn.disabled = this.isSubmitted || answeredCount === 0;
      if (!this.isSubmitted) bottomSubmitBtn.innerHTML = '📝 BARCHASINI TEKSHIRISH (CHECK ALL)';
    }
  }

  /**
   * Main Check All Logic: Evaluates all questions simultaneously
   */
  checkAllAnswers() {
    if (this.isSubmitted) return;

    const answeredCount = Object.keys(this.userAnswers).length;
    const totalCount = this.activeQuestions.length;

    if (answeredCount < totalCount) {
      const remaining = totalCount - answeredCount;
      const confirmSubmit = window.confirm(`Siz hali ${remaining} ta savolga javob bermadingiz. Baribir barchasini tekshirasizmi?`);
      if (!confirmSubmit) return;
    }

    this.isSubmitted = true;
    let correctCount = 0;

    // Evaluate each question card
    this.activeQuestions.forEach((q, qIndex) => {
      const cardEl = document.getElementById(`dest-q-card-${q.id}`);
      if (!cardEl) return;

      const userChoice = this.userAnswers[q.id];
      const isCorrect = userChoice === q.answer;

      if (isCorrect) correctCount++;

      // Style options
      cardEl.querySelectorAll('.dest-option-pill').forEach((optBtn, optIdx) => {
        optBtn.classList.remove('selected', 'correct-ans', 'wrong-ans');
        if (optIdx === q.answer) {
          optBtn.classList.add('correct-ans');
        } else if (optIdx === userChoice && !isCorrect) {
          optBtn.classList.add('wrong-ans');
        }
      });

      // Update card border & status
      cardEl.classList.remove('card-correct', 'card-wrong');
      cardEl.classList.add(isCorrect ? 'card-correct' : 'card-wrong');

      // Append Explanation Block
      const analysisBox = cardEl.querySelector('.dest-analysis-box');
      if (analysisBox) {
        if (isCorrect) {
          analysisBox.innerHTML = `
            <div class="analysis-status status-correct">
              <span class="status-icon">✅</span>
              <strong>To'g'ri topdingiz!</strong>
            </div>
            <div class="analysis-body">
              <span class="analysis-tag">Tahlil & Qo'llanilish Qoidasi:</span>
              <p>${this.escapeHtml(q.rule_short || 'Javob to‘g‘ri tanlandi.')}</p>
            </div>
          `;
        } else {
          const correctLetter = ['A', 'B', 'C', 'D'][q.answer];
          const correctText = q.options[q.answer];
          analysisBox.innerHTML = `
            <div class="analysis-status status-wrong">
              <span class="status-icon">❌</span>
              <strong>Noto'g'ri! To'g'ri javob: ${correctLetter}) ${this.escapeHtml(correctText)}</strong>
            </div>
            <div class="analysis-body detailed">
              <span class="analysis-tag detailed">Batafsil Tahlil va Qoida:</span>
              <p>${this.escapeHtml(q.rule_detailed || q.rule_short || 'Grammatik qoidani qayta ko‘rib chiqing.')}</p>
            </div>
          `;
        }
        analysisBox.style.display = 'block';
      }
    });

    this.score = correctCount;
    const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    // Record to history
    this.saveResult(correctCount, totalCount, percentage);

    // Audio & Effects
    if (percentage >= 80) {
      if (window.effectsEngine) {
        if (window.effectsEngine.burstConfetti) window.effectsEngine.burstConfetti();
        else if (window.effectsEngine.triggerConfetti) window.effectsEngine.triggerConfetti();
      }
      if (window.soundEngine && window.soundEngine.success) window.soundEngine.success();
    } else if (percentage >= 50) {
      if (window.soundEngine && window.soundEngine.correct) window.soundEngine.correct();
    } else {
      if (window.soundEngine && window.soundEngine.wrong) window.soundEngine.wrong();
    }

    // Render Summary Card
    this.renderSummaryCard(correctCount, totalCount, percentage);

    // Update check all action buttons
    const submitBtn = document.getElementById('dest-check-all-btn');
    const bottomSubmitBtn = document.querySelector('.dest-bottom-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `✓ Tekshirildi: ${correctCount}/${totalCount} (${percentage}%)`;
    }
    if (bottomSubmitBtn) {
      bottomSubmitBtn.disabled = true;
      bottomSubmitBtn.innerHTML = `✓ Tekshirildi: ${correctCount}/${totalCount} (${percentage}%)`;
    }
  }

  saveResult(correct, total, pct) {
    const entry = {
      date: new Date().toLocaleDateString('uz-UZ'),
      time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
      correct,
      total,
      pct,
      topic: this.selectedTopic
    };
    this.history.unshift(entry);
    if (this.history.length > 20) this.history.pop();
    localStorage.setItem('lex_dest_b2_history', JSON.stringify(this.history));

    // Also reward gamification XP
    if (window.gamification && window.gamification.addXP) {
      const earnedXP = correct * 10;
      window.gamification.addXP(earnedXP);
    }

    this.updateHistoryStats();
  }

  renderSummaryCard(correct, total, pct) {
    const container = document.getElementById('dest-summary-card');
    if (!container) return;

    let gradeTitle = "A'lo daraja! (C1 Level Readiness)";
    let gradeDesc = "B2 Destination kursidagi grammatika va so‘zlarni mukammal o‘zlashtirgansiz!";
    let gradeClass = "summary-high";

    if (pct < 50) {
      gradeTitle = "Ko'proq takrorlash kerak (Below B2)";
      gradeDesc = "Xato qilingan testlarning 'Batafsil Tahlil' qismini diqqat bilan o'qib chiqing.";
      gradeClass = "summary-low";
    } else if (pct < 75) {
      gradeTitle = "Yaxshi natija (Solid B2 Level)";
      gradeDesc = "Asosiy qoidalar yaxshi, ammo ba'zi phrasal verbs va inversiya qoidalarini mustahkamlash lozim.";
      gradeClass = "summary-mid";
    }

    container.innerHTML = `
      <div class="dest-summary-inner ios-glass-panel ${gradeClass}">
        <div class="summary-top-row">
          <div class="summary-score-big">
            <span class="score-num">${correct} / ${total}</span>
            <span class="score-pct">${pct}%</span>
          </div>
          <div class="summary-grade-wrap">
            <h3 class="summary-grade-title">${gradeTitle}</h3>
            <p class="summary-grade-desc">${gradeDesc}</p>
          </div>
        </div>

        <div class="summary-actions-row">
          <button class="ios-action-button retake-btn" onclick="window.destinationB2Quiz.retakeCurrentQuiz()">
            🔁 Xatolarni tuzatib qayta yechish
          </button>
          <button class="ios-action-button new-test-btn" onclick="window.destinationB2Quiz.startNewQuiz()">
            🎲 Yangi ${this.testCount} talik test olish
          </button>
        </div>
      </div>
    `;

    container.style.display = 'block';

    // Scroll to summary smoothly
    setTimeout(() => {
      container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  }

  updateHistoryStats() {
    const historyWrap = document.getElementById('dest-history-list');
    if (!historyWrap) return;

    if (this.history.length === 0) {
      historyWrap.innerHTML = '<div class="dest-history-empty">Hozircha testlar tarixi mavjud emas. Birinchi testingizni yeching!</div>';
      return;
    }

    historyWrap.innerHTML = this.history.slice(0, 5).map(h => {
      const color = h.pct >= 80 ? 'green' : h.pct >= 50 ? 'orange' : 'red';
      return `
        <div class="dest-history-item ios-glass-panel">
          <span class="hist-date">${h.date} ${h.time}</span>
          <span class="hist-topic">${this.escapeHtml(h.topic)}</span>
          <span class="hist-score ${color}">${h.correct}/${h.total} (${h.pct}%)</span>
        </div>
      `;
    }).join('');
  }

  renderQuizSheet() {
    const container = document.getElementById('dest-questions-sheet');
    const summaryCard = document.getElementById('dest-summary-card');
    if (!container) return;

    if (summaryCard) summaryCard.style.display = 'none';

    if (this.activeQuestions.length === 0) {
      container.innerHTML = `
        <div class="dest-empty-state ios-glass-panel">
          <h3>Testlar topilmadi</h3>
          <p>Mavzu filtrini 'Barchasi' ga o'zgartirib ko'ring.</p>
        </div>
      `;
      return;
    }

    const letters = ['A', 'B', 'C', 'D'];

    container.innerHTML = this.activeQuestions.map((q, idx) => {
      const qNum = idx + 1;
      const optionsHtml = q.options.map((opt, optIdx) => {
        const letter = letters[optIdx];
        const isSelected = this.userAnswers[q.id] === optIdx;
        return `
          <button type="button" 
                  class="dest-option-pill ${isSelected ? 'selected' : ''}" 
                  onclick="window.destinationB2Quiz.selectOption(${q.id}, ${optIdx})">
            <span class="opt-letter">${letter}</span>
            <span class="opt-text">${this.escapeHtml(opt)}</span>
          </button>
        `;
      }).join('');

      return `
        <div class="dest-question-card ios-glass-panel" id="dest-q-card-${q.id}">
          <div class="q-card-header">
            <span class="q-badge-num">SAVOL #${qNum}</span>
            <span class="q-badge-unit">${this.escapeHtml(q.unit || 'Destination B2')}</span>
            <span class="q-badge-topic">${this.escapeHtml(q.topic || 'Grammar')}</span>
          </div>

          <div class="q-card-text">
            ${this.formatQuestionText(q.q)}
          </div>

          <div class="dest-options-grid">
            ${optionsHtml}
          </div>

          <!-- Analysis box (Hidden initially, revealed after Check All) -->
          <div class="dest-analysis-box" style="display: none;"></div>
        </div>
      `;
    }).join('');
  }

  formatQuestionText(text) {
    // Replace _____ with underlined blank badge
    return this.escapeHtml(text).replace(/_____/g, '<span class="dest-gap-blank">_______</span>');
  }

  showLoading(show) {
    const el = document.getElementById('dest-loading-indicator');
    if (el) el.style.display = show ? 'block' : 'none';
  }

  escapeHtml(str) {
    return (str || '')
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  getFallbackQuestions() {
    return [
      {
        id: 1,
        unit: "Unit 1: Present Time",
        topic: "Present Tenses",
        q: "I can't talk right now because I _____ dinner with my family.",
        options: ["have", "am having", "have had", "had"],
        answer: 1,
        rule_short: "'have dinner' bu yerda jarayon ma'nosida kelgani sababli ayni paytda Present Continuous (am having) ishlatiladi.",
        rule_detailed: "'have' ovqatlanish yoki vaqt o'tkazish ma'nosida dinamik harakat bo'lib, Continuousda kelishi mumkin ('am having dinner'). 'can't talk right now' ayni damdagi jarayonni ko'rsatmoqda."
      },
      {
        id: 2,
        unit: "Unit 2: Past Time",
        topic: "Past Tenses",
        q: "When we arrived at the cinema, the movie _____ already started.",
        options: ["has", "had", "was", "would"],
        answer: 1,
        rule_short: "O'tmishdagi ikkita harakatdan avvalroq sodir bo'lgani uchun Past Perfect (had started) qo'llanadi.",
        rule_detailed: "Kinoteatrga yetib borishdan (arrived) oldin film boshlangan. O'tmishdagi ma'lum vaqtdan oldin tugagan harakat Past Perfect (had + V3) bo'ladi."
      },
      {
        id: 3,
        unit: "Unit 17: Conditionals",
        topic: "Conditionals",
        q: "If I _____ you, I would consult a doctor immediately.",
        options: ["am", "was", "were", "had been"],
        answer: 2,
        rule_short: "Second conditionalda maslahat berishda 'If I were you' qat'iy qoidadir.",
        rule_detailed: "Second Conditionalda barcha shaxslar uchun 'were' ishlatish grammatik norma hisoblanadi (maslahat: 'If I were you, I would...')."
      }
    ];
  }
}

// Global instance
window.destinationB2Quiz = new DestinationB2Quiz();
