/**
 * SHADOW QUEST // Qorong'u Labirint (RPG Sarguzasht Rejimi)
 * 3 ta Bob (Chapter), 15 ta Xona (Chambers), Boss janglari, 3 ta Yurak (HP),
 * Yulduzlar reytingi va qadimiy artefaktlar.
 */

class QuestEngine {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.storageKey = 'lex_quest_progress';
    this.progress = this.loadProgress();

    // Active Room Battle State
    this.activeRoom = null;
    this.currentQuestionIndex = 0;
    this.playerHp = 5;
    this.maxHp = 5;
    this.bossHp = 15;
    this.maxBossHp = 15;
    this.roomDamageTaken = 0;
    this.questions = [];

    this.chapters = this.getChaptersConfig();
  }

  loadProgress() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return {
      unlockedRooms: [1], // Room 1 starts unlocked
      roomStars: {}, // roomId -> 1..3
      relics: [], // ['library_key', 'cyber_chip', 'shadow_crown']
      totalStars: 0
    };
  }

  saveProgress() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.progress));
    } catch (_) {}
  }

  getChaptersConfig() {
    return [
      {
        id: 1,
        title: "I-BOB: QADIMGI KUTUBXONA",
        subtitle: "A1-A2 Boshlang'ich So'zlar Zali",
        icon: "🏛️",
        theme: "amber",
        bossName: "Sfinks Qo'riqchisi",
        relic: { id: "library_key", name: "Kutubxona Kaliti 🗝️", desc: "1-Bobni zabt etganlik nishoni" },
        rooms: [
          { id: 1, name: "Kirish Darvozasi", level: "A1", desc: "Oddiy kundalik so'zlar bilan qulfni oching" },
          { id: 2, name: "So'zlar Bog'i", level: "A1", desc: "Tabiat va his-tuyg'ular zali" },
          { id: 3, name: "Sehrli Qo'lyozmalar", level: "A2", desc: "Qadimgi bitiklardagi sifat va fe'llar" },
          { id: 4, name: "Donishmand Zali", level: "A2", desc: "Mantiqiy iboralar va bog'lovchilar" },
          { id: 5, name: "Sfinks Qo'riqchisi (BOSS)", level: "A1-A2", isBoss: true, desc: "Kutubxona xazinasining bosh himoyachisi" }
        ]
      },
      {
        id: 2,
        title: "II-BOB: KIBER SHAHAR",
        subtitle: "B1-B2 O'rta va Zamonaviy Leksika",
        icon: "🏙️",
        theme: "cyan",
        bossName: "Kiber Neyrotizim AI",
        relic: { id: "cyber_chip", name: "Kiber Chip 💾", desc: "2-Bobni zabt etganlik nishoni" },
        rooms: [
          { id: 6, name: "Neon Ko'chalari", level: "B1", desc: "Texnologiya va zamonaviy muloqot" },
          { id: 7, name: "Ma'lumotlar Markazi", level: "B1", desc: "Biznes va axborot terminlari" },
          { id: 8, name: "Terminal Labirinti", level: "B2", desc: "Murakkabroq fe'llar va sifatlar" },
          { id: 9, name: "Shifr Generator", level: "B2", desc: "Akademik va tahliliy tushunchalar" },
          { id: 10, name: "Kiber Neyrotizim AI (BOSS)", level: "B1-B2", isBoss: true, desc: "Shahar superkompyuterini buzib o'ting" }
        ]
      },
      {
        id: 3,
        title: "III-BOB: QORA QASR",
        subtitle: "C1 Ilg'or va Professional So'zlar",
        icon: "🏰",
        theme: "purple",
        bossName: "Zulmat Lordi",
        relic: { id: "shadow_crown", name: "Zulmat Toji 👑", desc: "Qora Qasrning mutlaq hukmdori" },
        rooms: [
          { id: 11, name: "Zulmat Darvozasi", level: "C1", desc: "Noyob va chuqur adabiy so'zlar" },
          { id: 12, name: "Soyalar Yo'lagi", level: "C1", desc: "Psixologiya va falsafiy tushunchalar" },
          { id: 13, name: "Taxt Zali", level: "C1", desc: "Ijtimoiy-siyosiy va ilmiy leksika" },
          { id: 14, name: "Qora Sehr Xonasi", level: "C1+", desc: "Eng yuqori qiyinlikdagi kontekstlar" },
          { id: 15, name: "Zulmat Lordi (FINAL BOSS)", level: "C1-C2", isBoss: true, desc: "Yakuniy jang: Mutlaq so'z boyligi sinovi" }
        ]
      }
    ];
  }

  init() {
    this.renderMap();
  }

  // Renders the main visual Quest Map
  renderMap() {
    if (!this.container) return;

    let chaptersHtml = '';
    let totalRooms = 15;
    let clearedCount = Object.keys(this.progress.roomStars).length;
    let totalStars = Object.values(this.progress.roomStars).reduce((a, b) => a + b, 0);

    for (const ch of this.chapters) {
      let roomsHtml = '';

      for (const room of ch.rooms) {
        const isUnlocked = this.progress.unlockedRooms.includes(room.id);
        const stars = this.progress.roomStars[room.id] || 0;
        const isCleared = stars > 0;

        let starsHtml = '';
        if (isCleared) {
          starsHtml = `<div class="quest-room-stars">${'⭐'.repeat(stars)}</div>`;
        }

        roomsHtml += `
          <div class="quest-room-node ${room.isBoss ? 'boss-node' : ''} ${isUnlocked ? 'unlocked' : 'locked'} ${isCleared ? 'cleared' : ''}" 
               data-room-id="${room.id}"
               onclick="window.questEngine && window.questEngine.enterRoom(${room.id})">
            
            <div class="room-node-avatar">
              <span class="room-node-icon">${room.isBoss ? '👑' : (isCleared ? '✓' : (isUnlocked ? '⚔️' : '🔒'))}</span>
            </div>

            <div class="room-node-details">
              <div class="room-meta-row">
                <span class="room-level-pill">${room.level}</span>
                <span class="room-capacity-pill">📦 ${room.isBoss ? '15 ta So\'z' : '10 ta So\'z'}</span>
              </div>
              <h4 class="room-title">${room.name}</h4>
              <p class="room-desc">${room.desc}</p>
              ${starsHtml}
            </div>

            <span class="room-action-arrow">${isUnlocked ? '➔' : '🔒'}</span>
          </div>
        `;
      }

      const isChapterUnlocked = ch.rooms.some(r => this.progress.unlockedRooms.includes(r.id));

      chaptersHtml += `
        <div class="quest-chapter-card ios-glass-panel theme-${ch.theme} ${isChapterUnlocked ? 'unlocked' : 'locked'}">
          <div class="chapter-card-header">
            <div class="chapter-badge">${ch.icon} ${ch.title}</div>
            <p class="chapter-sub">${ch.subtitle}</p>
          </div>
          <div class="chapter-rooms-path">
            ${roomsHtml}
          </div>
        </div>
      `;
    }

    // Relics strip
    const relicsHtml = [
      { id: 'library_key', icon: '🗝️', name: 'Kutubxona Kaliti' },
      { id: 'cyber_chip', icon: '💾', name: 'Kiber Chip' },
      { id: 'shadow_crown', icon: '👑', name: 'Zulmat Toji' }
    ].map(rel => {
      const owned = this.progress.relics.includes(rel.id);
      return `
        <div class="quest-relic-slot ${owned ? 'owned' : 'empty'}" title="${rel.name}">
          <span class="relic-icon">${owned ? rel.icon : '❓'}</span>
          <span class="relic-label">${owned ? rel.name : 'Qulflangan'}</span>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="quest-view-wrapper">
        
        <!-- Hero Header -->
        <div class="quest-hero-banner ios-glass-panel">
          <div class="quest-hero-left">
            <span class="quest-tag">⚔️ RPG SARGUZASHT REJIMI</span>
            <h2 class="quest-headline">QORONG'U LABIRINT (SHADOW QUEST)</h2>
            <p class="quest-subtext">
              15 ta sirli xona, 3 ta qudratli Boss va qadimiy yodgorliklar. Har bir xonadan o'tish uchun so'z jumboqlarini hal eting!
            </p>
          </div>

          <div class="quest-stats-cluster">
            <div class="q-stat-card">
              <span class="q-stat-val">${clearedCount} / ${totalRooms}</span>
              <span class="q-stat-lbl">Zabt Etilgan Xonalar</span>
            </div>
            <div class="q-stat-card">
              <span class="q-stat-val">⭐ ${totalStars} / 45</span>
              <span class="q-stat-lbl">Yulduzlar</span>
            </div>
          </div>
        </div>

        <!-- Relics / Artefacts Strip -->
        <div class="quest-relics-strip ios-glass-panel">
          <div class="relics-strip-title">Qadimiy Artefaktlar:</div>
          <div class="relics-items-row">${relicsHtml}</div>
        </div>

        <!-- Chapters Progression Map -->
        <div class="quest-chapters-container">
          ${chaptersHtml}
        </div>

      </div>
    `;
  }

  // Generates 10-15 questions for a given room (Kattaroq hajmli bosqichlar)
  generateQuestionsForRoom(room) {
    const pool = (window.wordBank && window.wordBank.words) || (typeof GLOBAL_WORDS_DATA !== 'undefined' ? GLOBAL_WORDS_DATA : []);
    const shuffled = window.wordBank ? window.wordBank.cryptoShuffle([...pool]) : [...pool];

    const questionCount = room.isBoss ? 15 : 10;
    const questions = [];

    for (let i = 0; i < questionCount && i < shuffled.length; i++) {
      const target = shuffled[i];
      // Generate 3 distractors
      const distractors = [];
      const distPool = window.wordBank ? window.wordBank.cryptoShuffle([...pool]) : [...pool];
      for (const d of distPool) {
        if (d.word !== target.word && !distractors.some(x => x.translation === d.translation)) {
          distractors.push(d);
          if (distractors.length >= 3) break;
        }
      }

      // Mix options
      const options = window.wordBank ? window.wordBank.cryptoShuffle([
        { text: target.translation, correct: true, word: target.word },
        ...distractors.map(d => ({ text: d.translation, correct: false, word: d.word }))
      ]) : [
        { text: target.translation, correct: true, word: target.word },
        ...distractors.map(d => ({ text: d.translation, correct: false, word: d.word }))
      ];

      questions.push({
        targetWord: target.word,
        phonetic: target.phonetic || `/${target.word.toLowerCase()}/`,
        definition: target.definition || 'So\'z ta\'rifi',
        fullExample: target.fullExample || target.sentence || '',
        correctTranslation: target.translation,
        options: options
      });
    }

    return questions;
  }

  // Enters a specific Room / Chamber
  enterRoom(roomId) {
    if (!this.progress.unlockedRooms.includes(roomId)) {
      if (window.effectsEngine) window.effectsEngine.showToast('Bu xona hali qulflangan! Oldingi xonalarni zabt eting 🔒', 'warning');
      if (window.soundEngine && window.soundEngine.playWrong) window.soundEngine.playWrong();
      return;
    }

    let foundRoom = null;
    let foundChapter = null;

    for (const ch of this.chapters) {
      const r = ch.rooms.find(rm => rm.id === roomId);
      if (r) {
        foundRoom = r;
        foundChapter = ch;
        break;
      }
    }

    if (!foundRoom) return;

    this.activeRoom = foundRoom;
    this.activeChapter = foundChapter;
    this.currentQuestionIndex = 0;
    this.playerHp = 5;
    this.maxHp = 5;
    this.roomDamageTaken = 0;
    this.bossHp = foundRoom.isBoss ? 15 : 10;
    this.maxBossHp = foundRoom.isBoss ? 15 : 10;
    this.questions = this.generateQuestionsForRoom(foundRoom);

    if (window.soundEngine && window.soundEngine.buttonClick) window.soundEngine.buttonClick();
    this.renderChamberBattle();
  }

  // Renders the battle inside the chamber
  renderChamberBattle() {
    if (!this.container || !this.activeRoom) return;

    const q = this.questions[this.currentQuestionIndex];
    if (!q) {
      this.handleRoomVictory();
      return;
    }

    const heartsHtml = '❤️'.repeat(this.playerHp) + '🖤'.repeat(this.maxHp - this.playerHp);
    const progressPercent = Math.round((this.currentQuestionIndex / this.questions.length) * 100);

    let bossBarHtml = '';
    if (this.activeRoom.isBoss) {
      const bossPercent = Math.round((this.bossHp / this.maxBossHp) * 100);
      bossBarHtml = `
        <div class="boss-health-container">
          <div class="boss-name-row">
            <span class="boss-tag">👑 BOSS: ${this.activeChapter.bossName}</span>
            <span class="boss-hp-val">${this.bossHp} / ${this.maxBossHp} HP</span>
          </div>
          <div class="boss-hp-bar-bg">
            <div class="boss-hp-bar-fill" style="width: ${bossPercent}%;"></div>
          </div>
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="chamber-arena-wrapper ios-glass-panel">
        
        <!-- Top HUD -->
        <div class="chamber-hud">
          <button class="chamber-exit-btn ios-button" onclick="window.questEngine.renderMap()">
            ✕ Xaritaga qaytish
          </button>
          
          <div class="chamber-title-box">
            <span class="chamber-level-tag">${this.activeRoom.level}</span>
            <h3 class="chamber-name">${this.activeRoom.name}</h3>
          </div>

          <div class="chamber-hearts-box">
            <span class="hearts-label">HP:</span>
            <span class="hearts-icons">${heartsHtml}</span>
          </div>
        </div>

        ${bossBarHtml}

        <!-- Progress Indicator -->
        <div class="chamber-question-prog">
          <span>Topshiriq: <strong>${this.currentQuestionIndex + 1} / ${this.questions.length}</strong></span>
          <div class="chamber-prog-track">
            <div class="chamber-prog-fill" style="width: ${progressPercent}%;"></div>
          </div>
        </div>

        <!-- Chamber Question Card -->
        <div class="chamber-card ios-glass-panel">
          <div class="chamber-question-prompt">
            Eshikdagi qadimgi runa so'zining to'g'ri o'zbekcha tarjimasini tanlang:
          </div>

          <div class="chamber-target-word-box">
            <h2 class="chamber-target-word">${q.targetWord}</h2>
            <span class="chamber-phonetic">${q.phonetic}</span>
            <button class="chamber-audio-btn ios-button" onclick="window.soundEngine && window.soundEngine.speak('${q.targetWord.replace(/'/g, "\\'")}')">
              🔊 Tinglash
            </button>
          </div>

          ${q.fullExample ? `<div class="chamber-context-hint"><em>"${q.fullExample}"</em></div>` : ''}

          <!-- Options Grid -->
          <div class="chamber-options-grid" id="chamber-options-grid">
            ${q.options.map((opt, idx) => `
              <button class="chamber-opt-btn ios-button" onclick="window.questEngine.handleAnswer(${idx})">
                <span class="opt-num">${idx + 1}</span>
                <span class="opt-text">${opt.text}</span>
              </button>
            `).join('')}
          </div>
        </div>

      </div>
    `;

    // Speak word automatically
    if (window.soundEngine && window.soundEngine.speak) {
      setTimeout(() => window.soundEngine.speak(q.targetWord), 200);
    }
  }

  handleAnswer(optIndex, delayMs = 700) {
    const q = this.questions[this.currentQuestionIndex];
    if (!q) return;

    const selectedOpt = q.options[optIndex];
    const buttons = document.querySelectorAll('.chamber-opt-btn');
    buttons.forEach(b => b.disabled = true);

    const proceed = () => {
      this.currentQuestionIndex++;
      if (this.currentQuestionIndex >= this.questions.length) {
        this.handleRoomVictory();
      } else {
        this.renderChamberBattle();
      }
    };

    if (selectedOpt.correct) {
      // SUCCESS!
      buttons[optIndex]?.classList.add('correct');
      if (window.soundEngine && window.soundEngine.playCorrect) window.soundEngine.playCorrect();
      if (window.effectsEngine) window.effectsEngine.triggerComboPill('ZARBA BERILDI! ⚔️', '+40 XP');
      if (window.gamification) window.gamification.addXP(40);

      if (this.activeRoom.isBoss) {
        this.bossHp--;
      }

      if (delayMs <= 0) proceed();
      else setTimeout(proceed, delayMs);

    } else {
      // WRONG! Damage taken
      buttons[optIndex]?.classList.add('wrong');
      const correctIdx = q.options.findIndex(o => o.correct);
      if (correctIdx !== -1) buttons[correctIdx]?.classList.add('correct');

      this.playerHp--;
      this.roomDamageTaken++;

      if (window.soundEngine && window.soundEngine.playWrong) window.soundEngine.playWrong();
      if (window.effectsEngine) {
        window.effectsEngine.triggerFail();
        window.effectsEngine.triggerComboPill('QALQON SINDIRILDI! 💔', '-1 HP', 'error');
      }

      // Add to mistakes bank for later review
      if (window.app && window.app.addMistakeWord) {
        window.app.addMistakeWord({ word: q.targetWord, translation: q.correctTranslation });
      }

      const proceedWrong = () => {
        if (this.playerHp <= 0) {
          this.handleGameOver();
        } else {
          this.currentQuestionIndex++;
          if (this.currentQuestionIndex >= this.questions.length) {
            this.handleRoomVictory();
          } else {
            this.renderChamberBattle();
          }
        }
      };

      if (delayMs <= 0) proceedWrong();
      else setTimeout(proceedWrong, delayMs);
    }
  }

  handleRoomVictory() {
    // Calculate stars: 3 if <= 1 damage, 2 if <= 3 damage, 1 if survived
    let stars = 3;
    if (this.roomDamageTaken >= 1 && this.roomDamageTaken <= 2) stars = 2;
    else if (this.roomDamageTaken >= 3) stars = 1;

    // Record star if better than previous
    const prevStars = this.progress.roomStars[this.activeRoom.id] || 0;
    if (stars > prevStars) {
      this.progress.roomStars[this.activeRoom.id] = stars;
    }

    // Unlock next room
    const nextRoomId = this.activeRoom.id + 1;
    if (nextRoomId <= 15 && !this.progress.unlockedRooms.includes(nextRoomId)) {
      this.progress.unlockedRooms.push(nextRoomId);
    }

    // Check if Boss Room defeated -> award chapter relic
    let relicAwarded = null;
    if (this.activeRoom.isBoss && this.activeChapter.relic) {
      const relId = this.activeChapter.relic.id;
      if (!this.progress.relics.includes(relId)) {
        this.progress.relics.push(relId);
        relicAwarded = this.activeChapter.relic;
      }
    }

    this.saveProgress();

    const xpEarned = this.activeRoom.isBoss ? 400 : 120;
    if (window.gamification) window.gamification.addXP(xpEarned);
    if (window.soundEngine && window.soundEngine.playLevelUp) window.soundEngine.playLevelUp();
    if (window.effectsEngine) window.effectsEngine.triggerConfetti();

    this.container.innerHTML = `
      <div class="chamber-arena-wrapper ios-glass-panel">
        <div class="quest-victory-card">
          <div class="victory-header-badge">${this.activeRoom.isBoss ? '👑 BOSS MAG\'LUB ETILDI!' : '🏆 XONA ZABT ETILDI!'}</div>
          <h2>${this.activeRoom.name}</h2>
          
          <div class="victory-stars-row">
            ${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}
          </div>

          <p class="victory-text">
            Siz ushbu xonadagi so'z sinovlaridan muvaffaqiyatli o'tib, keyingi darvoza kalitini qo'lga kiritdingiz!
          </p>

          ${relicAwarded ? `
            <div class="victory-relic-card ios-glass-panel">
              <span class="relic-drop-badge">YANGI ARTEFAKT QO'LGA KIRITILDI!</span>
              <div class="relic-drop-title">${relicAwarded.name}</div>
              <p class="relic-drop-desc">${relicAwarded.desc}</p>
            </div>
          ` : ''}

          <div class="victory-xp-tag">+${xpEarned} XP qo'shildi!</div>

          <div class="victory-actions">
            <button class="victory-btn ios-button" onclick="window.questEngine.renderMap()">
              🗺️ Xaritaga Qaytish
            </button>
            ${nextRoomId <= 15 ? `
              <button class="victory-btn primary ios-button" onclick="window.questEngine.enterRoom(${nextRoomId})">
                Keyingi Xona ➔
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  handleGameOver() {
    if (window.soundEngine && window.soundEngine.playWrong) window.soundEngine.playWrong();
    if (window.effectsEngine) window.effectsEngine.triggerFail();

    this.container.innerHTML = `
      <div class="chamber-arena-wrapper ios-glass-panel">
        <div class="quest-defeat-card">
          <div class="defeat-icon">💀</div>
          <h2>Barcha Yuraklar Tugadi!</h2>
          <p>
            Zulmat kuchlari kuchlilik qildi. Ammo taslim bo'lmang — so'zlarni qayta ko'rib chiqib, revansh oling!
          </p>
          <div class="defeat-actions">
            <button class="defeat-btn ios-button" onclick="window.questEngine.renderMap()">
              🗺️ Xaritaga Qaytish
            </button>
            <button class="defeat-btn retry ios-button" onclick="window.questEngine.enterRoom(${this.activeRoom.id})">
              🔄 Qayta Urinish
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

// Global initialization
if (typeof window !== 'undefined') {
  window.questEngine = new QuestEngine('quest-view-container');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QuestEngine };
}
