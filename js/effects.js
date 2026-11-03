/**
 * Emotional FX & Confetti Particle System
 * Miyani quvontiradigan, zeriktirmaydigan emotsiyalar, combo va konfetti animatsiyalari.
 */

class EmotionalEffectsEngine {
  constructor() {
    this.combo = 0;
    this.successEmojis = ['🔥', '⚡', '👑', '🎉', '🌟', '🚀', '🧠', '✨', '💎', '🎯'];
    this.successPhrases = [
      "DAHOSIZ! 🧠⚡",
      "MIYA YONYAPTI! 🔥",
      "MUKAMMAL NATIJA! 🎯",
      "UNSTOPPABLE! 🚀",
      "SO'ZLARNI YEB QO'YDINGIZ! 👑",
      "AQL BOVAR QILMAS TEZLIK! ⚡",
      "ENG YUQORI DARAJA! 🌟",
      "XOTIRA CHEMPIONI! 💎"
    ];
    this.failPhrases = [
      "Afsus! Lekin bu so'z endi esda qoladi! 💡",
      "Deyarli topgandingiz! 🤏",
      "Fikrni jamlang, keyingisida aniq chiqadi! 🎯",
      "Miya qizimoqda! Qaytadan sinab ko'ring! 🔄"
    ];

    this.createOverlayContainers();
  }

  createOverlayContainers() {
    if (typeof document === 'undefined') return;

    if (!document.getElementById('emotion-reaction-badge')) {
      const badge = document.createElement('div');
      badge.id = 'emotion-reaction-badge';
      badge.className = 'emotion-reaction-badge';
      document.body.appendChild(badge);
    }

    if (!document.getElementById('confetti-canvas')) {
      const canvas = document.createElement('canvas');
      canvas.id = 'confetti-canvas';
      canvas.className = 'confetti-canvas';
      document.body.appendChild(canvas);
    }
  }

  triggerSuccess(points = 50) {
    this.combo++;
    const phrase = this.successPhrases[Math.floor(Math.random() * this.successPhrases.length)];
    const emoji = this.successEmojis[Math.floor(Math.random() * this.successEmojis.length)];
    const comboText = this.combo > 1 ? `⚡ ${this.combo}X COMBO!` : `+${points} Ball`;

    this.showFloatingReaction(`${emoji} ${phrase}`, comboText, 'success');
    this.launchConfetti();
  }

  triggerFail() {
    this.combo = 0;
    const phrase = this.failPhrases[Math.floor(Math.random() * this.failPhrases.length)];
    this.showFloatingReaction(`⚠️ ${phrase}`, "Xato bo'ldi", 'fail');
  }

  showFloatingReaction(mainText, subText = '', type = 'success') {
    const badge = document.getElementById('emotion-reaction-badge');
    if (!badge) return;

    badge.className = `emotion-reaction-badge show ${type}`;
    badge.innerHTML = `
      <div class="reaction-main">${mainText}</div>
      ${subText ? `<div class="reaction-sub">${subText}</div>` : ''}
    `;

    setTimeout(() => {
      badge.classList.remove('show');
    }, 1800);
  }

  triggerComboPill(title, sub = '', type = 'success') {
    this.showFloatingReaction(title, sub, type);
  }

  showToast(message, type = 'info') {
    this.showFloatingReaction(message, '', type);
  }

  burstConfetti() {
    this.launchConfetti();
  }

  triggerConfetti() {
    this.launchConfetti();
  }

  launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width = window.innerWidth;
    const height = canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#d946ef', '#a855f7', '#38bdf8', '#34d399', '#fbbf24', '#f43f5e', '#fff'];

    for (let i = 0; i < 55; i++) {
      particles.push({
        x: width / 2 + (Math.random() - 0.5) * 150,
        y: height / 2 + (Math.random() - 0.5) * 50,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 1.2) * 14,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        alpha: 1,
        gravity: 0.4
      });
    }

    let frames = 0;
    function render() {
      frames++;
      ctx.clearRect(0, 0, width, height);
      let alive = false;

      particles.forEach(p => {
        p.x += p.vx;
        p.vy += p.gravity;
        p.y += p.vy;
        p.rotation += p.vRot;
        p.alpha -= 0.016;

        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      });

      if (alive && frames < 70) {
        requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    }

    requestAnimationFrame(render);
  }

  // Dynamic Screen Shake (Ekran titrashi)
  screenShake(intensity = 'medium') {
    const body = document.body;
    if (!body) return;

    body.classList.remove('shake-light', 'shake-medium', 'shake-hard');
    
    // Force reflow
    void body.offsetWidth;

    const cls = intensity === 'light' ? 'shake-light' : (intensity === 'hard' ? 'shake-hard' : 'shake-medium');
    body.classList.add(cls);

    setTimeout(() => {
      body.classList.remove(cls);
    }, 450);
  }

  // iPhone Style Dynamic Island / Floating Achievement Capsule
  showAchievementToast(badge) {
    if (!badge) return;
    let container = document.getElementById('achievement-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'achievement-toast-container';
      container.className = 'achievement-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'achievement-toast ios-glass-panel';
    toast.innerHTML = `
      <div class="ach-toast-icon">${badge.icon || '🏆'}</div>
      <div class="ach-toast-content">
        <span class="ach-toast-tag">YANGI YUTUQ OCHILDI!</span>
        <h4 class="ach-toast-title">${badge.title}</h4>
        <p class="ach-toast-desc">${badge.desc}</p>
      </div>
      <span class="ach-toast-xp">+${badge.xp || 100} XP</span>
    `;

    container.appendChild(toast);

    if (window.soundEngine) {
      window.soundEngine.playAchievement();
    }
    this.burstConfetti();

    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => {
        if (toast.remove) toast.remove();
        else if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 400);
    }, 4500);
  }
}

// Export both names to guarantee zero undefined reference errors
window.emotionEngine = new EmotionalEffectsEngine();
window.effectsEngine = window.emotionEngine;
