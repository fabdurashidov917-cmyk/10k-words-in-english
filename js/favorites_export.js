/**
 * Favorites & Export Engine (Mening Saralanganlarim ⭐ va PDF / Anki Eksport)
 * Foydalanuvchi so'zlarga yulduzcha qo'yib shaxsiy lug'atini shakllantiradi.
 * Bir bosish bilan PDF konspekt chop etish, Anki (.txt/.csv) yuklab olish yoki nusxa olish mumkin.
 */

class FavoritesExportManager {
  constructor() {
    this.storageKey = 'lex_starred_words';
    this.starredSet = new Set(this.loadStarred());
    this.showOnlyStarredInDict = false;
  }

  loadStarred() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  saveStarred() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(Array.from(this.starredSet)));
    } catch (_) {}
  }

  isStarred(word) {
    if (!word) return false;
    return this.starredSet.has(word.toUpperCase().trim());
  }

  toggleStar(word, e) {
    if (e) e.stopPropagation();
    if (!word) return false;
    const clean = word.toUpperCase().trim();
    let isNowStarred = false;

    if (this.starredSet.has(clean)) {
      this.starredSet.delete(clean);
      isNowStarred = false;
      if (window.effectsEngine) window.effectsEngine.showToast(`"${clean}" saralanganlardan olib tashlandi`, 'info');
    } else {
      this.starredSet.add(clean);
      isNowStarred = true;
      if (window.soundEngine && window.soundEngine.playCorrect) window.soundEngine.playCorrect();
      if (window.effectsEngine) window.effectsEngine.showToast(`⭐ "${clean}" saralanganlarga saqlandi!`, 'success');
      if (window.gamification) window.gamification.addXP(10);
    }

    this.saveStarred();
    this.updateUI();

    // Re-render views if active
    if (window.app && window.app.currentTab === 'dictionary') {
      window.app.renderDictionary();
    }
    if (window.flashcards && window.app && window.app.currentTab === 'flashcards') {
      window.flashcards.updateUI();
    }

    return isNowStarred;
  }

  getStarredWords() {
    const list = [];
    const pool = (window.wordBank && window.wordBank.words) || (typeof GLOBAL_WORDS_DATA !== 'undefined' ? GLOBAL_WORDS_DATA : []);
    const foundWords = new Set();

    for (const item of pool) {
      const upper = item.word.toUpperCase().trim();
      if (this.starredSet.has(upper) && !foundWords.has(upper)) {
        foundWords.add(upper);
        list.push(item);
      }
    }
    return list;
  }

  getStarredCount() {
    return this.starredSet.size;
  }

  updateUI() {
    // Update all star count badges in the UI
    const count = this.getStarredCount();
    document.querySelectorAll('.starred-count-badge').forEach(el => {
      el.textContent = count;
    });

    // Update star toggle button in Dictionary view
    const starToggleBtn = document.getElementById('dict-starred-toggle-btn');
    if (starToggleBtn) {
      starToggleBtn.classList.toggle('active', this.showOnlyStarredInDict);
      starToggleBtn.innerHTML = `⭐ Saralanganlar (${count})`;
    }
  }

  toggleDictStarredFilter() {
    this.showOnlyStarredInDict = !this.showOnlyStarredInDict;
    if (window.soundEngine && window.soundEngine.buttonClick) window.soundEngine.buttonClick();
    this.updateUI();
    if (window.app) {
      window.app.renderDictionary();
    }
  }

  openModal(source = 'starred') {
    return this.openExportModal(source);
  }

  closeModal() {
    return this.closeExportModal();
  }

  // Opens the sleek iOS Export Modal
  openExportModal(source = 'starred') {
    if (window.soundEngine && window.soundEngine.buttonClick) window.soundEngine.buttonClick();

    let words = [];
    let titleText = '';

    if (source === 'starred') {
      words = this.getStarredWords();
      titleText = `⭐ Saralangan So'zlar (${words.length} ta)`;
    } else {
      words = (window.wordBank && window.wordBank.words) ? window.wordBank.words.slice(0, 500) : [];
      titleText = `📖 Lug'at To'plami (${words.length} ta)`;
    }

    // If no starred words, give friendly advice
    if (words.length === 0 && source === 'starred') {
      if (window.effectsEngine) {
        window.effectsEngine.showToast('Hozircha hech qanday so\'z saralanmagan. Lug\'at yoki Flashcardlarda ⭐ tugmasini bosing!', 'info');
      }
      return;
    }

    let modal = document.getElementById('lex-export-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'lex-export-modal';
      modal.className = 'export-modal-backdrop';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="export-modal-panel ios-glass-panel">
        <div class="export-modal-header">
          <div>
            <span class="export-badge">📂 EKSPORT VA CHOP ETISH</span>
            <h3 class="export-title">${titleText}</h3>
          </div>
          <button class="export-close-btn ios-button" onclick="window.favoritesExport.closeExportModal()">✕</button>
        </div>

        <p class="export-description">
          Shaxsiy to'plamingizni o'zingizga qulay formatda saqlab oling yoki chop etish uchun tayyorlang:
        </p>

        <div class="export-options-grid">
          
          <!-- Option 1: PDF Print Sheet -->
          <div class="export-card ios-glass-panel" onclick="window.favoritesExport.exportPDF()">
            <div class="export-card-icon">📄</div>
            <div class="export-card-info">
              <h4>PDF Konspekt (Chop etish)</h4>
              <p>A4 varaqqa chiroyli jadval ko'rinishida chop etish yoki PDF sifatida saqlash.</p>
            </div>
            <span class="export-arrow">➔</span>
          </div>

          <!-- Option 2: Anki Deck (.txt / .csv) -->
          <div class="export-card ios-glass-panel" onclick="window.favoritesExport.exportAnki()">
            <div class="export-card-icon">🗃️</div>
            <div class="export-card-info">
              <h4>Anki To'plami (.TXT / .CSV)</h4>
              <p>Rasmiy Anki mobil va kompyuter ilovasiga to'g'ridan-to'g'ri import qilish formati.</p>
            </div>
            <span class="export-arrow">➔</span>
          </div>

          <!-- Option 3: Copy to Clipboard -->
          <div class="export-card ios-glass-panel" onclick="window.favoritesExport.copyToClipboard()">
            <div class="export-card-icon">📋</div>
            <div class="export-card-info">
              <h4>Nusxa Olish (Clipboard)</h4>
              <p>Telegram, Word yoki matnli eslatmalarga to'liq nusxalab olish.</p>
            </div>
            <span class="export-arrow">➔</span>
          </div>

        </div>

        <div class="export-modal-footer">
          <span>Jami eksport qilinadigan so'zlar: <strong>${words.length} ta</strong></span>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  closeExportModal() {
    const modal = document.getElementById('lex-export-modal');
    if (modal) modal.classList.remove('active');
  }

  // 1. PDF Konspekt (Chop etish)
  exportPDF() {
    this.closeExportModal();
    const words = this.getStarredWords();
    if (words.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Iltimos, brauzeringizda pop-up oynalarga ruxsat bering!');
      return;
    }

    const rowsHtml = words.map((w, idx) => `
      <tr>
        <td style="text-align: center; color: #666; font-weight: bold;">${idx + 1}</td>
        <td style="font-weight: bold; color: #111;">${w.word}</td>
        <td style="color: #666; font-family: monospace;">${w.phonetic || ''}</td>
        <td style="font-weight: 600; color: #4338ca;">${w.translation}</td>
        <td style="color: #444; font-size: 0.9em;"><em>"${w.fullExample || w.sentence || ''}"</em></td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="uz">
      <head>
        <meta charset="UTF-8">
        <title>SHADOW LEXICON // Shaxsiy Lug'at Konspekti</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #111;
            padding: 20px;
            margin: 0;
            background: #fff;
          }
          .header {
            border-bottom: 2px solid #4338ca;
            padding-bottom: 12px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          h1 { margin: 0; font-size: 22px; color: #4338ca; }
          .subtitle { margin: 4px 0 0; font-size: 13px; color: #555; }
          .meta { font-size: 12px; color: #777; text-align: right; }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          th {
            background: #f3f4f6;
            color: #374151;
            font-weight: 700;
            padding: 10px 8px;
            text-align: left;
            border-bottom: 2px solid #e5e7eb;
          }
          td {
            padding: 8px;
            border-bottom: 1px solid #e5e7eb;
            vertical-align: top;
          }
          tr:nth-child(even) {
            background: #fafafa;
          }
          .footer {
            margin-top: 30px;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
            font-size: 11px;
            color: #888;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>SHADOW LEXICON // Shaxsiy Lug'at Konspekti</h1>
            <p class="subtitle">Inglizcha-O'zbekcha Saralangan So'zlar To'plami</p>
          </div>
          <div class="meta">
            <div>Sana: ${new Date().toLocaleDateString('uz-UZ')}</div>
            <div>Jami so'zlar: <strong>${words.length} ta</strong></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 35px; text-align: center;">#</th>
              <th style="width: 140px;">So'z (English)</th>
              <th style="width: 110px;">Talaffuz</th>
              <th style="width: 180px;">O'zbekcha Ma'nosi</th>
              <th>Misol Gap (Context)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          SHADOW LEXICON — 10,000 Words Vocabulary & 3D Interactive Flashcards Platform
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    if (window.effectsEngine) window.effectsEngine.showToast('📄 Chop etish oynasi ochildi (PDF sifatida saqlashingiz mumkin)', 'success');
  }

  // 2. Anki To'plami (.TXT / .CSV formatida eksport)
  exportAnki() {
    this.closeExportModal();
    const words = this.getStarredWords();
    if (words.length === 0) return;

    // Anki format: Front \t Back \t Tags
    const lines = [
      '#separator:tab',
      '#html:true',
      '#tags column:3'
    ];

    for (const w of words) {
      const front = `${w.word} <span style="color:#888;">${w.phonetic || ''}</span>`;
      const back = `<b style="color:#6366f1;font-size:1.1em;">${w.translation}</b><br><span style="color:#555;">${w.definition || ''}</span><br><br><small><i>&quot;${w.fullExample || w.sentence || ''}&quot;</i></small>`;
      const tag = `shadow-lexicon ${w.category || 'general'}`;
      lines.push(`${front}\t${back}\t${tag}`);
    }

    const content = lines.join('\n');
    const blob = new Blob(["\ufeff" + content], { type: 'text/tab-separated-values;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shadow_lexicon_anki_${words.length}_words.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (window.effectsEngine) window.effectsEngine.showToast('🗃️ Anki to\'plami yuklab olindi (.txt)', 'success');
    if (window.soundEngine && window.soundEngine.playLevelUp) window.soundEngine.playLevelUp();
  }

  // 3. Nusxa Olish (Clipboard)
  copyToClipboard() {
    this.closeExportModal();
    const words = this.getStarredWords();
    if (words.length === 0) return;

    let text = `📚 SHADOW LEXICON — SARALANGAN SO'ZLAR (${words.length} ta)\n`;
    text += `Sana: ${new Date().toLocaleDateString('uz-UZ')}\n\n`;

    words.forEach((w, idx) => {
      text += `${idx + 1}. ${w.word} ${w.phonetic || ''} — ${w.translation}\n`;
      if (w.fullExample || w.sentence) {
        text += `   Misol: "${w.fullExample || w.sentence}"\n`;
      }
    });

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (window.effectsEngine) window.effectsEngine.showToast('📋 Barcha so\'zlar nusxalandi!', 'success');
        if (window.soundEngine && window.soundEngine.playCorrect) window.soundEngine.playCorrect();
      }).catch(() => {
        this.fallbackCopy(text);
      });
    } else {
      this.fallbackCopy(text);
    }
  }

  fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    if (window.effectsEngine) window.effectsEngine.showToast('📋 Barcha so\'zlar nusxalandi!', 'success');
  }
}

// Global initialization
if (typeof window !== 'undefined') {
  window.favoritesExport = new FavoritesExportManager();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FavoritesExportManager };
}
