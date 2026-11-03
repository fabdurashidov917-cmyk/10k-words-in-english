/**
 * GAMIFICATION ENGINE - XP, Levels, Badges & Dopamine Multikill Reactions
 * Features:
 * - Dynamic Level progression & XP calculation
 * - Level Up celebrations (fanfare, confetti, dialog)
 * - 10 Unlockable Achievements with iPhone Floating Capsule Notifications
 * - Multikill Combo Streaks (3x, 5x, 10x, 15x) with Screen Shake & Audio
 * - Interactive Profile & Achievements Showcase Modal
 */

class GamificationEngine {
  constructor() {
    this.xp = parseInt(localStorage.getItem('lex_user_xp') || '0');
    this.currentCombo = 0;
    this.maxCombo = parseInt(localStorage.getItem('lex_max_combo') || '0');
    this.unlockedBadges = new Set(JSON.parse(localStorage.getItem('lex_unlocked_badges') || '[]'));
    
    // Stats for tracking achievements
    this.stats = {
      correctAnswers: parseInt(localStorage.getItem('lex_stat_correct') || '0'),
      speedAnswers: parseInt(localStorage.getItem('lex_stat_speed') || '0'),
      wordleWins: parseInt(localStorage.getItem('lex_stat_wordle') || '0'),
      audioWins: parseInt(localStorage.getItem('lex_stat_audio') || '0'),
      mistakesCleared: parseInt(localStorage.getItem('lex_stat_cleared') || '0'),
      flashcardsViewed: parseInt(localStorage.getItem('lex_stat_fc') || '0'),
      marathonsCompleted: parseInt(localStorage.getItem('lex_stat_marathon') || '0')
    };

    this.badgesDefinition = [
      { id: 'FIRST_WIN', title: 'Birinchi G\'alaba', desc: 'Birinchi so\'zni to\'g\'ri topdingiz', icon: '🌱', xp: 50 },
      { id: 'SHARPSHOOTER_5', title: 'Mergant (5x)', desc: 'Ketma-ket 5 ta so\'zni xatosiz topdingiz', icon: '🎯', xp: 100 },
      { id: 'UNSTOPPABLE_10', title: 'To\'xtatib Bo\'lmas (10x)', desc: 'Ketma-ket 10 ta to\'g\'ri javob!', icon: '⚡', xp: 250 },
      { id: 'GODLIKE_15', title: 'Afsonaviy (15x)', desc: '15 ta uzluksiz g\'alaba! GODLIKE!', icon: '👑', xp: 500 },
      { id: 'SPEED_DEMON', title: 'Chaqmoq Tezlik', desc: 'Savolga 3 soniyadan tez javob berdingiz', icon: '⚡', xp: 150 },
      { id: 'WORDLE_GENIUS', title: 'Wordle Ustasi', desc: 'Wordle-ni 3 yoki undan kam urinishda topdingiz', icon: '🟩', xp: 200 },
      { id: 'LISTENING_CHAMP', title: 'Oltin Quloq', desc: 'Audio Detektivda 10 ta so\'z topdingiz', icon: '🎧', xp: 150 },
      { id: 'MISTAKE_SLAYER', title: 'Qasoskor', desc: 'Xatolar sandig\'idagi so\'zni o\'zlashtirdingiz', icon: '⚔️', xp: 150 },
      { id: 'FLASHCARD_FAN', title: 'Zukko Kitobxon', desc: '100 ta flashkardni o\'rganib chiqdingiz', icon: '📚', xp: 200 },
      { id: 'MARATHON_100', title: 'Marafon Qahramoni', desc: '100 talik marafonni muvaffaqiyatli yakunladingiz', icon: '🏆', xp: 400 }
    ];

    this.levelTiers = [
      { level: 1, minXp: 0, maxXp: 200, title: 'Boshlovchi', icon: '🌱' },
      { level: 2, minXp: 200, maxXp: 500, title: 'O\'quvchi', icon: '📖' },
      { level: 3, minXp: 500, maxXp: 1000, title: 'Izlanuvchi', icon: '🔍' },
      { level: 4, minXp: 1000, maxXp: 1800, title: 'So\'z Ovchisi', icon: '🏹' },
      { level: 5, minXp: 1800, maxXp: 3000, title: 'Kolleksioner', icon: '💎' },
      { level: 6, minXp: 3000, maxXp: 4600, title: 'Mutaxassis', icon: '🎓' },
      { level: 7, minXp: 4600, maxXp: 6800, title: 'Lug\'at Ustasi', icon: '🔮' },
      { level: 8, minXp: 6800, maxXp: 9500, title: 'Donishmand', icon: '🌟' },
      { level: 9, minXp: 9500, maxXp: 13000, title: 'Grossmeyster', icon: '⚡' },
      { level: 10, minXp: 13000, maxXp: 999999, title: 'Poliglot Qiroli', icon: '👑' }
    ];

    this.currentLevel = this.calculateLevel(this.xp);
  }

  calculateLevel(xp) {
    for (let i = this.levelTiers.length - 1; i >= 0; i--) {
      if (xp >= this.levelTiers[i].minXp) {
        return this.levelTiers[i];
      }
    }
    return this.levelTiers[0];
  }

  addXP(amount, reason = '') {
    const oldLevel = this.currentLevel.level;
    this.xp += amount;
    localStorage.setItem('lex_user_xp', this.xp);

    this.currentLevel = this.calculateLevel(this.xp);

    // Floating XP pill in top bar or button
    if (window.effectsEngine) {
      window.effectsEngine.showFloatingReaction(`+${amount} XP!`);
    }

    // Check Level Up
    if (this.currentLevel.level > oldLevel) {
      this.triggerLevelUpCelebration(this.currentLevel);
    }

    this.updateUI();
  }

  triggerLevelUpCelebration(lvl) {
    if (window.soundEngine) {
      window.soundEngine.playLevelUp();
    }
    if (window.effectsEngine) {
      window.effectsEngine.burstConfetti();
      window.effectsEngine.screenShake('medium');
    }

    const modal = document.createElement('div');
    modal.className = 'level-up-modal-overlay';
    modal.innerHTML = `
      <div class="level-up-card ios-glass-panel">
        <div class="lvl-up-icon">${lvl.icon}</div>
        <span class="lvl-up-tag">DARAXA OSHDI!</span>
        <h2 class="lvl-up-title">${lvl.level}-DARAJA</h2>
        <h3 class="lvl-up-badge">${lvl.title}</h3>
        <p class="lvl-up-text">Tabriklaymiz! So'z boyligingiz va mahoratingiz yangi bosqichga ko'tarildi!</p>
        <button class="lvl-up-close-btn ios-button" onclick="this.closest('.level-up-modal-overlay').remove()">
          Ajoyib! Davom etish 🚀
        </button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  recordAnswer(isCorrect, details = {}) {
    if (isCorrect) {
      this.currentCombo++;
      if (this.currentCombo > this.maxCombo) {
        this.maxCombo = this.currentCombo;
        localStorage.setItem('lex_max_combo', this.maxCombo);
      }

      this.stats.correctAnswers++;
      localStorage.setItem('lex_stat_correct', this.stats.correctAnswers);

      // Base XP
      const speedBonus = details.timeLeft && details.timeLeft >= 9 ? 15 : 0;
      this.addXP(25 + speedBonus);

      // Check Speed Demon
      if (details.responseTime && details.responseTime <= 3000) {
        this.stats.speedAnswers++;
        localStorage.setItem('lex_stat_speed', this.stats.speedAnswers);
        this.unlockAchievement('SPEED_DEMON');
      }

      // Check first win
      this.unlockAchievement('FIRST_WIN');

      // Multikill Combos & Screen Shake
      if (this.currentCombo === 3) {
        if (window.effectsEngine) window.effectsEngine.showFloatingReaction('🔥 3x COMBO!');
      } else if (this.currentCombo === 5) {
        this.unlockAchievement('SHARPSHOOTER_5');
        if (window.effectsEngine) {
          window.effectsEngine.showFloatingReaction('⚡ 5x UNSTOPPABLE!');
          window.effectsEngine.screenShake('light');
        }
      } else if (this.currentCombo === 10) {
        this.unlockAchievement('UNSTOPPABLE_10');
        if (window.effectsEngine) {
          window.effectsEngine.showFloatingReaction('💥 10x RAMPAGE!');
          window.effectsEngine.screenShake('medium');
        }
      } else if (this.currentCombo === 15) {
        this.unlockAchievement('GODLIKE_15');
        if (window.effectsEngine) {
          window.effectsEngine.showFloatingReaction('👑 15x GODLIKE!');
          window.effectsEngine.screenShake('hard');
          window.effectsEngine.burstConfetti();
        }
        if (window.soundEngine) {
          window.soundEngine.playGodlike();
        }
      }
    } else {
      // Combo reset
      this.currentCombo = 0;
    }

    this.updateComboDisplay();
  }

  unlockAchievement(badgeId) {
    if (this.unlockedBadges.has(badgeId)) return;

    const badge = this.badgesDefinition.find(b => b.id === badgeId);
    if (!badge) return;

    this.unlockedBadges.add(badgeId);
    localStorage.setItem('lex_unlocked_badges', JSON.stringify(Array.from(this.unlockedBadges)));

    this.addXP(badge.xp, `Yutuq: ${badge.title}`);

    if (window.effectsEngine && window.effectsEngine.showAchievementToast) {
      window.effectsEngine.showAchievementToast(badge);
    }
  }

  updateComboDisplay() {
    const comboEl = document.getElementById('stat-active-combo');
    if (comboEl) {
      if (this.currentCombo >= 2) {
        comboEl.style.display = 'inline-flex';
        comboEl.innerHTML = `🔥 ${this.currentCombo}x Kombo`;
      } else {
        comboEl.style.display = 'none';
      }
    }
  }

  updateUI() {
    // Top Bar Level Pill
    const levelPill = document.getElementById('user-level-pill');
    if (levelPill) {
      levelPill.innerHTML = `
        <span class="lvl-icon">${this.currentLevel.icon}</span>
        <span class="lvl-text">Lvl ${this.currentLevel.level} • ${this.currentLevel.title}</span>
      `;
    }

    // Progress Bar
    const xpCurrent = this.xp - this.currentLevel.minXp;
    const xpTarget = this.currentLevel.maxXp - this.currentLevel.minXp;
    const pct = Math.min(100, Math.max(0, Math.floor((xpCurrent / xpTarget) * 100)));

    const progressBar = document.getElementById('user-xp-progress');
    if (progressBar) {
      progressBar.style.width = `${pct}%`;
    }

    const xpText = document.getElementById('user-xp-text');
    if (xpText) {
      xpText.innerText = `${this.xp.toLocaleString()} XP (${pct}%)`;
    }

    // Stats bar score update
    const scoreStat = document.getElementById('stat-total-score');
    if (scoreStat) {
      scoreStat.innerText = `${this.xp.toLocaleString()} XP`;
    }
  }

  openAchievementsModal() {
    const existing = document.getElementById('achievements-modal');
    if (existing) existing.remove();

    const xpCurrent = this.xp - this.currentLevel.minXp;
    const xpTarget = this.currentLevel.maxXp - this.currentLevel.minXp;
    const pct = Math.min(100, Math.max(0, Math.floor((xpCurrent / xpTarget) * 100)));

    const modal = document.createElement('div');
    modal.id = 'achievements-modal';
    modal.className = 'achievements-modal-overlay';
    modal.innerHTML = `
      <div class="achievements-modal-card ios-glass-panel">
        
        <div class="ach-modal-header">
          <div class="ach-profile-summary">
            <div class="ach-avatar">${this.currentLevel.icon}</div>
            <div class="ach-user-details">
              <h3>${this.currentLevel.title}</h3>
              <p>Daraja: <strong>${this.currentLevel.level}</strong> // Jami: <strong>${this.xp.toLocaleString()} XP</strong></p>
              <div class="modal-xp-bar-track">
                <div class="modal-xp-bar-fill" style="width: ${pct}%"></div>
              </div>
              <span class="modal-xp-sub">${xpCurrent} / ${xpTarget} XP keyingi darajagacha</span>
            </div>
          </div>
          <button class="ach-close-btn ios-button" onclick="document.getElementById('achievements-modal').remove()">✕</button>
        </div>

        <div class="ach-vitrina-title">
          <span>🏆 YUTUQLAR VA NISHONLAR (${this.unlockedBadges.size} / ${this.badgesDefinition.length})</span>
        </div>

        <div class="ach-badges-grid">
          ${this.badgesDefinition.map(b => {
            const isUnlocked = this.unlockedBadges.has(b.id);
            return `
              <div class="ach-badge-card ${isUnlocked ? 'unlocked' : 'locked'}">
                <div class="badge-icon-box">${isUnlocked ? b.icon : '🔒'}</div>
                <div class="badge-info">
                  <h4 class="badge-name">${b.title}</h4>
                  <p class="badge-desc">${b.desc}</p>
                  <span class="badge-xp-reward">+${b.xp} XP ${isUnlocked ? '✓ Olingan' : ''}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>

      </div>
    `;

    document.body.appendChild(modal);
    if (window.soundEngine) window.soundEngine.buttonClick();
  }
}

window.gamification = new GamificationEngine();
