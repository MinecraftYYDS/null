/* ============================================================
   main.js – 无意义宇宙的全部灵魂
   ============================================================ */

(() => {
  'use strict';

  /* ---------- helpers ---------- */
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];
  const rand = (a, b) => Math.random() * (b - a) + a;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const isMobile = () => innerWidth <= 680 || ('ontouchstart' in window);

  const gravityFxState = {
    active: false,
    ready: false,
    cards: [],
    rafId: 0,
    drag: null,
    lastTs: 0,
    gravity: { x: 0, y: 1800 },
    gyroTilt: { x: 0, y: 0 },
    /* physics tuning */
    SUBSTEPS: 6,
    COLLISION_ITERS: 4,
    RESTITUTION: 0.45,
    FRICTION_DYNAMIC: 0.35,
    FRICTION_STATIC: 0.55,
    AIR_DRAG: 0.9985,
    ANGULAR_DAMPING: 0.9,
    MAX_ANGULAR_SPEED: 3.6,
    ANGULAR_IMPULSE_SCALE: 0.12,
    SLEEP_VEL: 4,
    SLEEP_ANG: 0.08,
    SLEEP_FRAMES: 40,
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /* ==========================================================
     1. LOADING SCREEN
     ========================================================== */
  const loader    = $('#loader');
  const loaderBar = $('.loader-bar span');
  const wrapper   = $('.wrapper');
  let progress = 0;
  const loadTick = setInterval(() => {
    progress += rand(6, 18);
    if (progress > 100) progress = 100;
    loaderBar.style.width = progress + '%';
    if (progress >= 100) {
      clearInterval(loadTick);
      setTimeout(() => {
        loader.classList.add('done');
        wrapper.classList.add('visible');
        initAll();
      }, 400);
    }
  }, 120);

  /* ==========================================================
     2. INIT — called after loader finishes
     ========================================================== */
  function initAll() {
    initClock();
    initCursor();
    initBgCanvas();
    initParticles();
    initTerminal();
    initMeter();
    initAudioBars();
    initReveal();
    initCardTilt();
    initCardGlow();
    initButtons();
    initNonsense();
    initStats();
    initMarquee();
    initKeyboard();
    initVisitorCount();
    initTouchRipple();
    initTouchParticles();
    initGyroTilt();
    initMobileFab();
    initPullRefresh();
  }

  /* ==========================================================
     3. CLOCK
     ========================================================== */
  function initClock() {
    const el = $('#clock');
    const update = () => {
      const d = new Date();
      el.textContent = d.toLocaleTimeString('zh-CN', { hour12: false });
    };
    update();
    setInterval(update, 1000);
  }

  /* ==========================================================
     4. CUSTOM CURSOR
     ========================================================== */
  function initCursor() {
    const ring = $('.cursor-ring');
    const dot  = $('.cursor-dot');
    if (!ring || !dot) return;
    let mx = innerWidth / 2, my = innerHeight / 2;
    let rx = mx, ry = my;

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top  = my + 'px';
    });

    (function animR() {
      rx += (mx - rx) * 0.14;
      ry += (my - ry) * 0.14;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      requestAnimationFrame(animR);
    })();

    $$('button, .btn, a, .tag').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('hovering'));
      el.addEventListener('mouseleave', () => ring.classList.remove('hovering'));
    });
  }

  /* ==========================================================
     5. BACKGROUND — Matrix rain + gradient nebula
     ========================================================== */
  function initBgCanvas() {
    const c = $('#bgCanvas');
    const ctx = c.getContext('2d');
    let W, H, cols, drops;
    const chars = 'ア イ ウ エ オ カ キ ク 0 1 2 3 4 5 6 7 8 9 A B C D'.split(' ');
    const SZ = 15;

    function resize() {
      W = c.width = innerWidth;
      H = c.height = innerHeight;
      cols = Math.ceil(W / SZ);
      drops = Array(cols).fill(0);
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      ctx.fillStyle = 'rgba(5,8,15,.12)';
      ctx.fillRect(0, 0, W, H);

      ctx.font = SZ + 'px monospace';
      for (let i = 0; i < cols; i++) {
        const ch = pick(chars);
        const brightness = rand(0.25, 0.85);
        ctx.fillStyle = `rgba(0,229,255,${brightness})`;
        ctx.fillText(ch, i * SZ, drops[i] * SZ);
        if (drops[i] * SZ > H && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    }
    setInterval(draw, 50);
  }

  /* ==========================================================
     6. PARTICLE SYSTEM — floating + interactive
     ========================================================== */
  function initParticles() {
    const c = $('#particleCanvas');
    const ctx = c.getContext('2d');
    let W, H;
    let mouseX = -9999, mouseY = -9999;

    function resize() { W = c.width = innerWidth; H = c.height = innerHeight; }
    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });
    /* touch support for particles */
    document.addEventListener('touchmove', e => {
      const t = e.touches[0];
      if (t) { mouseX = t.clientX; mouseY = t.clientY; }
    }, { passive: true });
    document.addEventListener('touchend', () => { mouseX = -9999; mouseY = -9999; });

    const COUNT = isMobile() ? Math.min(50, Math.floor(innerWidth / 10)) : Math.min(120, Math.floor(innerWidth / 12));
    const pts = Array.from({ length: COUNT }, () => ({
      x: rand(0, innerWidth), y: rand(0, innerHeight),
      vx: rand(-.25, .25), vy: rand(-.25, .25),
      r: rand(1, 2.6),
      hue: rand(170, 340),
    }));

    function frame() {
      ctx.clearRect(0, 0, W, H);

      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

        /* mouse repel */
        const dx = p.x - mouseX, dy = p.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          const f = (140 - dist) / 140 * 0.6;
          p.x += dx / dist * f * 3;
          p.y += dy / dist * f * 3;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},100%,75%,.7)`;
        ctx.shadowColor = `hsla(${p.hue},100%,75%,.5)`;
        ctx.shadowBlur = 10;
        ctx.fill();
      }

      /* lines between close particles */
      ctx.shadowBlur = 0;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d = dx * dx + dy * dy;
          if (d < 12000) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(0,229,255,${(1 - d / 12000) * 0.18})`;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(frame);
    }
    frame();
  }

  /* ==========================================================
     7. TERMINAL with proper queue
     ========================================================== */
  function initTerminal() {
    const el = $('#terminal');
    if (!el) return;
    const lines = [
      { text: '> boot meaningless-core --gpu=neon', cls: 'cmd' },
      { text: '[OK]  loading absurd modules...', cls: 'ok' },
      { text: '[OK]  matrix overlay: engaged', cls: 'ok' },
      { text: '[OK]  particle system: 120 nodes online', cls: 'ok' },
      { text: '[WARN] purpose_not_found — switching to vibe_mode', cls: 'warn' },
      { text: '[OK]  glitch shader: active', cls: 'ok' },
      { text: '[OK]  audio visualizer: simulated', cls: 'ok' },
      { text: '[OK]  coolness density: 94.7%', cls: 'ok' },
      { text: '[ERR] meaning.exe has stopped (not needed)', cls: 'err' },
      { text: '[DONE] welcome to beautiful chaos ✦', cls: 'ok' },
    ];

    let idx = 0;
    let busy = false;

    function typeLine() {
      if (busy) return;
      if (idx >= lines.length) { idx = 0; el.textContent = ''; }
      busy = true;
      const { text, cls } = lines[idx++];
      const span = document.createElement('span');
      span.className = cls;
      el.appendChild(span);
      let charIdx = 0;
      const iv = setInterval(() => {
        span.textContent += text[charIdx] ?? '';
        charIdx++;
        if (charIdx > text.length) {
          clearInterval(iv);
          el.appendChild(document.createTextNode('\n'));
          el.scrollTop = el.scrollHeight;
          busy = false;
        }
      }, 18);
    }
    setInterval(typeLine, 900);
    typeLine();

    /* expose for other modules */
    window._termLog = (msg, cls = 'cmd') => {
      const span = document.createElement('span');
      span.className = cls;
      span.textContent = '> ' + msg;
      el.appendChild(span);
      el.appendChild(document.createTextNode('\n'));
      el.scrollTop = el.scrollHeight;
    };
  }

  /* ==========================================================
     8. COOL METER
     ========================================================== */
  function initMeter() {
    const fill = $('#coolFill');
    const lbl  = $('#coolLabel');
    if (!fill) return;

    function set(v) {
      v = Math.max(0, Math.min(100, v));
      fill.style.width = v + '%';
      lbl.textContent = v > 92 ? '当前等级：神级炫酷'
        : v > 80 ? '当前等级：帅到违规'
        : v > 65 ? '当前等级：还在升温'
        : '当前等级：普通帅';
    }
    set(78);
    setInterval(() => set(rand(55, 99) | 0), 3200);
    window._setMeter = set;
  }

  /* ==========================================================
     9. AUDIO BARS (simulated)
     ========================================================== */
  function initAudioBars() {
    const bars = $$('.audio-bar');
    if (!bars.length) return;
    function tick() {
      bars.forEach(b => {
        b.style.height = rand(8, 55) + 'px';
      });
    }
    setInterval(tick, 120);
    tick();
  }

  /* ==========================================================
     10. SCROLL REVEAL
     ========================================================== */
  function initReveal() {
    const els = $$('.reveal');
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('visible');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
  }

  /* ==========================================================
     11. 3D CARD TILT (mouse only, gyro is separate)
     ========================================================== */
  function initCardTilt() {
    if (isMobile()) return; // gyro handles mobile
    $$('.card').forEach(card => {
      card.addEventListener('mousemove', e => {
        if (gravityFxState.active) return;
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width  - 0.5;
        const y = (e.clientY - rect.top)  / rect.height - 0.5;
        card.style.transform = `perspective(700px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.02)`;
      });
      card.addEventListener('mouseleave', () => {
        if (gravityFxState.active) return;
        card.style.transform = 'perspective(700px) rotateY(0) rotateX(0) scale(1)';
      });
    });
  }

  /* ==========================================================
     12. CARD GLOW follow cursor
     ========================================================== */
  function initCardGlow() {
    $$('.card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
        card.style.setProperty('--mouse-y', (e.clientY - rect.top ) + 'px');
      });
    });
  }

  /* ==========================================================
     13. NONSENSE
     ========================================================== */
  const nonsensePool = [
    '我们把"暂时没想法"渲染成了银河级特效。',
    '这个网站唯一的目标：让访客怀疑你是不是天才。',
    '如果内容为空，那就用光污染填满它。',
    '没有主题？那主题就是"未定义的浪漫"。',
    '欢迎来到功能和氛围 1:9 的未来页面。',
    '代码在运行，但灵魂已经放飞。',
    '用最前沿的技术做了最无聊的事，这本身就很酷。',
    '你正在注视一段不存在的意义，而它也在注视你。',
  ];
  const tagPool = ['#赛博幻想', '#故障美学', '#玻璃拟态', '#霓虹宇宙', '#像素暴风', '#抽象科技', '#闪耀代码', '#脑洞过载', '#无意义哲学'];

  function initNonsense() {
    refresh();
    setInterval(refresh, 6000);
  }

  function refresh() {
    const el = $('#nonsenseText');
    const tagsEl = $('#tags');
    if (!el) return;
    el.style.opacity = '0';
    setTimeout(() => {
      el.textContent = pick(nonsensePool);
      el.style.opacity = '1';
      el.style.transition = 'opacity .5s';
    }, 300);
    if (tagsEl) {
      tagsEl.innerHTML = '';
      const shuffled = [...tagPool].sort(() => Math.random() - .5).slice(0, 5);
      shuffled.forEach(t => {
        const s = document.createElement('span');
        s.className = 'tag';
        s.textContent = t;
        tagsEl.appendChild(s);
      });
    }
  }

  /* ==========================================================
     14. STATS COUNTER ANIMATION
     ========================================================== */
  function initStats() {
    $$('.stat-number[data-to]').forEach(el => {
      const to = +el.dataset.to;
      let cur = 0;
      const step = Math.max(1, Math.floor(to / 60));
      const iv = setInterval(() => {
        cur += step;
        if (cur >= to) { cur = to; clearInterval(iv); }
        el.textContent = cur.toLocaleString();
      }, 30);
    });
  }

  /* ==========================================================
     15. MARQUEE DUPLICATE for seamless loop
     ========================================================== */
  function initMarquee() {
    const wrap = $('.marquee-wrap');
    const m = $('.marquee');
    if (!m) return;
    const clone = m.cloneNode(true);
    wrap.appendChild(clone);
  }

  /* ==========================================================
     16. ALL BUTTONS — hero + fun panel
     ========================================================== */
  const ideaPool = [
    '做一个"今天该不该摸鱼"预测站，结果永远是：看心情。',
    '做个"社恐发消息润色器"：把"在吗"改成"尊敬的朋友您好"。',
    '做个"人生BGM随机机"，输入心情就给你配电影配乐。',
    '做个"键盘侠情绪温度计"，检测你今天打字的攻击性。',
    '做个"拖延症可视化仪表盘"，每分钟提醒你再拖一下。',
    '做个"宇宙占卜404"，每次刷新都给出不同的人生建议。',
    '做个"AI废话检测器"，输入一段话算出废话含量百分比。',
    '做个"前端样式盲盒"，每次刷新随机生成一个全新配色。',
  ];

  function initButtons() {
    /* hero buttons */
    /* curated neon palettes for boost/disco */
    const boostPalettes = [
      { n1: '#ff003c', n2: '#00fff7', n3: '#ffe600', n4: '#c800ff', label: '赛博朋克' },
      { n1: '#ff6ec7', n2: '#39ff14', n3: '#ffaa00', n4: '#00d4ff', label: '霓虹丛林' },
      { n1: '#f5f500', n2: '#ff00ff', n3: '#00ffcc', n4: '#ff4400', label: '酸性美学' },
      { n1: '#00ffff', n2: '#ff1493', n3: '#adff2f', n4: '#ffd700', label: '极光风暴' },
      { n1: '#bf00ff', n2: '#00ff88', n3: '#ff2d2d', n4: '#00b4d8', label: '暗黑科幻' },
    ];

    function applyPalette(p) {
      const root = document.documentElement.style;
      root.setProperty('--neon1', p.n1);
      root.setProperty('--neon2', p.n2);
      root.setProperty('--neon3', p.n3);
      root.setProperty('--neon4', p.n4);
    }
    function resetPalette() {
      const root = document.documentElement.style;
      root.setProperty('--neon1', '#00e5ff');
      root.setProperty('--neon2', '#ff2eaa');
      root.setProperty('--neon3', '#7dff6a');
      root.setProperty('--neon4', '#ffe03a');
    }

    $('#boostBtn')?.addEventListener('click', () => {
      const p = pick(boostPalettes);
      applyPalette(p);
      flashScreen();
      toast(`量子配色「${p.label}」已激活 ✦`);
      window._termLog?.(`palette: ${p.label} — coolness ↑↑↑`, 'ok');
      window._setMeter?.(98);
      fireworks(30);
      refresh();
    });

    $('#ideaBtn')?.addEventListener('click', () => {
      const out = $('#ideaOutput');
      if (out) {
        out.style.opacity = '0';
        setTimeout(() => {
          out.textContent = pick(ideaPool);
          out.style.opacity = '1';
          out.style.transition = 'opacity .4s';
        }, 200);
      }
      toast('创意引擎输出完成');
      window._termLog?.('idea_gen — result dispatched', 'cmd');
    });

    $('#chaosBtn')?.addEventListener('click', () => {
      $('.hero')?.classList.add('shake');
      setTimeout(() => $('.hero')?.classList.remove('shake'), 800);
      refresh();
      flashScreen();
      fireworks(50);
      toast('混沌已注入：理性正在下线…');
      window._termLog?.('chaos.inject() — stability: 12%', 'warn');
      window._setMeter?.(Math.floor(rand(70, 100)));
    });

    /* fun panel */
    $$('[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        if (mode === 'invert') {
          document.body.style.filter = document.body.style.filter === 'invert(1) hue-rotate(180deg)'
            ? 'none' : 'invert(1) hue-rotate(180deg)';
          toast('宇宙颜色已切换');
          window._termLog?.('filter: invert toggled', 'cmd');
        }
        if (mode === 'disco') {
          let count = 0;
          const iv = setInterval(() => {
            const p = pick(boostPalettes);
            applyPalette(p);
            count++;
            if (count > 18) {
              clearInterval(iv);
              resetPalette();
            }
          }, 180);
          toast('🪩 迪斯科模式：3秒后自动恢复');
          window._termLog?.('disco_mode: cycling curated palettes', 'ok');
        }
        if (mode === 'gravity') {
          toggleGravityPhysics();
        }
        if (mode === 'firework') {
          fireworks(80);
          toast('烟花已发射 🎆');
          window._termLog?.('fireworks.launch(80)', 'ok');
        }
        if (mode === 'pixel') {
          document.body.classList.toggle('pixelated');
          const on = document.body.classList.contains('pixelated');
          toast(on ? '像素化已开启 👾' : '像素化已关闭');
          window._termLog?.(on ? 'render: pixelated ON' : 'render: pixelated OFF', 'cmd');
        }
        if (mode === 'reset') {
          forceResetReality();
          toast('现实参数已恢复');
          window._termLog?.('system.reset() — normality restored', 'ok');
        }
      });
    });
  }

  function forceResetReality() {
    document.body.style.filter = 'none';
    document.body.classList.remove('pixelated', 'gravity-mode');

    if (gravityFxState.active) {
      stopGravityPhysics();
    }

    // If physics state got out of sync, force clear all possible residues.
    const resetTargets = $$([
      '.topbar',
      '.hero',
      '.stat-card',
      '.card',
      '.marquee-wrap',
      '.footer',
      '.swipe-hint',
      '.mobile-fab',
      '.physics-item',
      '.physics-card'
    ].join(','));

    resetTargets.forEach(el => {
      el.classList.remove('physics-item', 'physics-card', 'dragging', 'shake');
      el.style.transform = '';
      el.style.transition = '';
      el.style.zIndex = '';
      el.style.filter = '';
    });

    $$('.firework, .firework-shell, .firework-trail, .firework-particle, .firework-flash, .firework-ring, .collision-spark, .dust-puff').forEach(el => el.remove());
    gravityFxState.drag = null;
    gravityFxState.cards = [];
    gravityFxState.active = false;
    gravityFxState.lastTs = 0;
    gravityFxState.gyroTilt.x = 0;
    gravityFxState.gyroTilt.y = 0;

    resetPalette();
  }

  /* ==========================================================
     17. FLASH SCREEN
     ========================================================== */
  function flashScreen() {
    const ov = $('.flash-overlay');
    if (!ov) return;
    ov.classList.add('active');
    setTimeout(() => ov.classList.remove('active'), 100);
  }

  /* ==========================================================
     18. TOAST
     ========================================================== */
  function toast(msg) {
    const container = $('.toast-container');
    if (!container) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    container.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  /* ==========================================================
     19. FIREWORKS — cinematic launch + burst + glow rings
     ========================================================== */
  function fireworks(count = 40) {
    const salvos = Math.max(1, Math.round(count / 20));
    for (let s = 0; s < salvos; s++) {
      const delay = s * rand(120, 260);
      setTimeout(() => {
        const shellCount = Math.max(1, Math.round(count / salvos / 12));
        for (let i = 0; i < shellCount; i++) {
          const x = rand(innerWidth * 0.12, innerWidth * 0.88);
          const targetY = rand(innerHeight * 0.18, innerHeight * 0.55);
          const hue = rand(0, 360);
          const power = rand(0.8, 1.35);
          launchFireworkShell(x, targetY, hue, power);
        }
      }, delay);
    }
  }

  function launchFireworkShell(x, targetY, hue, power) {
    const shell = document.createElement('div');
    shell.className = 'firework-shell';
    shell.style.left = `${x}px`;
    shell.style.top = `${innerHeight + 18}px`;
    shell.style.background = `hsl(${hue}, 100%, 72%)`;
    shell.style.boxShadow = `0 0 10px hsl(${hue},100%,72%), 0 0 24px hsl(${hue},100%,58%)`;
    document.body.appendChild(shell);

    const launchDur = rand(650, 980);
    shell.animate([
      { transform: 'translate3d(0,0,0) scale(1)', opacity: 0.92 },
      { transform: `translate3d(${rand(-20, 20)}px, ${targetY - (innerHeight + 18)}px, 0) scale(0.7)`, opacity: 1 },
    ], { duration: launchDur, easing: 'cubic-bezier(.2,.8,.28,1)', fill: 'forwards' });

    const trailTick = setInterval(() => {
      const t = document.createElement('div');
      t.className = 'firework-trail';
      t.style.left = `${x + rand(-6, 6)}px`;
      t.style.top = `${rand(targetY + 24, innerHeight - 8)}px`;
      t.style.background = `hsla(${hue}, 100%, 75%, .75)`;
      t.style.boxShadow = `0 0 10px hsla(${hue},100%,68%,.7)`;
      document.body.appendChild(t);
      const dur = rand(320, 560);
      t.animate([
        { transform: 'translate3d(0,0,0) scale(1)', opacity: 0.9 },
        { transform: `translate3d(${rand(-18, 18)}px, ${rand(10, 36)}px, 0) scale(0)`, opacity: 0 },
      ], { duration: dur, easing: 'ease-out', fill: 'forwards' });
      setTimeout(() => t.remove(), dur + 20);
    }, 34);

    setTimeout(() => {
      clearInterval(trailTick);
      shell.remove();
      explodeFirework(x, targetY, hue, power);
    }, launchDur + 20);
  }

  function explodeFirework(x, y, hue, power) {
    const patterns = ['sphere', 'ring', 'willow'];
    const pattern = pick(patterns);
    const baseCount = Math.floor(rand(34, 62) * power);

    const flash = document.createElement('div');
    flash.className = 'firework-flash';
    flash.style.left = `${x}px`;
    flash.style.top = `${y}px`;
    flash.style.background = `radial-gradient(circle, hsla(${hue},100%,90%,.95), hsla(${hue},100%,60%,.12) 55%, transparent 70%)`;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 260);

    const ring = document.createElement('div');
    ring.className = 'firework-ring';
    ring.style.left = `${x}px`;
    ring.style.top = `${y}px`;
    ring.style.borderColor = `hsla(${hue},100%,76%,.75)`;
    document.body.appendChild(ring);
    setTimeout(() => ring.remove(), 720);

    for (let i = 0; i < baseCount; i++) {
      const p = document.createElement('div');
      p.className = 'firework-particle';
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;

      const angle = pattern === 'ring'
        ? (i / baseCount) * Math.PI * 2 + rand(-0.04, 0.04)
        : rand(0, Math.PI * 2);

      const radius = pattern === 'willow'
        ? rand(90, 220) * power
        : pattern === 'ring'
          ? rand(120, 210) * power
          : rand(70, 190) * power;

      const lift = pattern === 'willow' ? rand(-30, 10) : rand(-24, 24);
      const dx = Math.cos(angle) * radius;
      const dy = Math.sin(angle) * radius + lift;
      const driftY = pattern === 'willow' ? rand(45, 95) : rand(20, 60);

      const sat = pattern === 'ring' ? 95 : 88;
      const light = pattern === 'willow' ? 74 : 67;
      p.style.background = `hsl(${hue + rand(-18, 18)}, ${sat}%, ${light}%)`;
      p.style.boxShadow = `0 0 8px hsla(${hue},100%,70%,.85), 0 0 22px hsla(${hue},100%,58%,.6)`;

      document.body.appendChild(p);
      const dur = pattern === 'willow' ? rand(900, 1350) : rand(620, 980);
      p.animate([
        { transform: 'translate3d(0,0,0) scale(1)', opacity: 1 },
        { transform: `translate3d(${dx}px, ${dy + driftY}px, 0) scale(${rand(0.25, 0.6)})`, opacity: 0 },
      ], { duration: dur, easing: 'cubic-bezier(.18,.85,.3,1)', fill: 'forwards' });
      setTimeout(() => p.remove(), dur + 30);
    }
  }

  /* ==========================================================
     20. KEYBOARD SHORTCUTS
     ========================================================== */
  function initKeyboard() {
    document.addEventListener('keydown', e => {
      if (e.key === 'f' || e.key === 'F') fireworks(60);
      if (e.key === 'c' || e.key === 'C') {
        $('#chaosBtn')?.click();
      }
    });
  }

  /* ==========================================================
     21. VISITOR COUNT (fake, random localStorage)
     ========================================================== */
  function initVisitorCount() {
    const el = $('#visitors');
    if (!el) return;
    let count = +(localStorage.getItem('_vc') || 0);
    count += Math.floor(rand(1, 4));
    localStorage.setItem('_vc', count);
    el.textContent = count.toLocaleString();
  }

  /* ==========================================================
     22. TOUCH RIPPLE on buttons
     ========================================================== */
  function initTouchRipple() {
    $$('.btn, .fab-btn, button').forEach(btn => {
      btn.style.position = 'relative';
      btn.style.overflow = 'hidden';
      const handler = (e) => {
        const rect = btn.getBoundingClientRect();
        let cx, cy;
        if (e.touches) {
          cx = e.touches[0].clientX - rect.left;
          cy = e.touches[0].clientY - rect.top;
        } else {
          cx = e.clientX - rect.left;
          cy = e.clientY - rect.top;
        }
        const ripple = document.createElement('span');
        ripple.className = 'touch-ripple';
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (cx - size / 2) + 'px';
        ripple.style.top  = (cy - size / 2) + 'px';
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      };
      btn.addEventListener('touchstart', handler, { passive: true });
      btn.addEventListener('mousedown', handler);
    });
  }

  /* ==========================================================
     23. TOUCH PARTICLES — tap to spawn burst
     ========================================================== */
  function initTouchParticles() {
    if (!isMobile()) return;
    document.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      if (!t) return;
      for (let i = 0; i < 10; i++) {
        const el = document.createElement('div');
        el.className = 'firework-particle';
        const hue = rand(0, 360);
        el.style.cssText = `
          left:${t.clientX}px; top:${t.clientY}px;
          background:hsl(${hue},100%,70%);
          box-shadow:0 0 8px hsl(${hue},100%,70%);
          width:4px; height:4px;
        `;
        document.body.appendChild(el);
        const angle = rand(0, Math.PI * 2);
        const dist = rand(25, 80);
        el.animate([
          { transform: 'translate(0,0) scale(1)', opacity: 1 },
          { transform: `translate(${Math.cos(angle)*dist}px,${Math.sin(angle)*dist}px) scale(0)`, opacity: 0 },
        ], { duration: rand(400, 700), easing: 'ease-out', fill: 'forwards' });
        setTimeout(() => el.remove(), 750);
      }
    }, { passive: true });
  }

  /* ==========================================================
     24. GYROSCOPE CARD TILT (mobile)
     ========================================================== */
  function initGyroTilt() {
    if (!isMobile()) return;
    const cards = $$('.card');
    if (!cards.length) return;

    function handleOrientation(e) {
      const gamma = Math.max(-15, Math.min(15, e.gamma || 0)); // left-right
      const beta  = Math.max(-15, Math.min(15, (e.beta || 0) - 40)); // front-back (offset for hand hold)
      const rx = (gamma / 15) * 4;
      const ry = (beta  / 15) * 4;
      gravityFxState.gyroTilt.x = gamma / 15;
      gravityFxState.gyroTilt.y = beta / 15;
      if (gravityFxState.active) return;
      cards.forEach(card => {
        card.style.transform = `perspective(700px) rotateY(${rx}deg) rotateX(${-ry}deg)`;
      });
    }

    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS 13+ needs permission
      document.addEventListener('touchstart', function reqGyro() {
        DeviceOrientationEvent.requestPermission().then(state => {
          if (state === 'granted') window.addEventListener('deviceorientation', handleOrientation);
        }).catch(() => {});
        document.removeEventListener('touchstart', reqGyro);
      }, { once: true });
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }
  }

  /* ==========================================================
     25. MOBILE FAB — bottom action bar
     ========================================================== */
  function initMobileFab() {
    const fab = $('.mobile-fab');
    if (!fab) return;

    const handlers = {
      'fab-chaos':    () => $('#chaosBtn')?.click(),
      'fab-firework': () => fireworks(50),
      'fab-idea':     () => $('#ideaBtn')?.click(),
      'fab-boost':    () => $('#boostBtn')?.click(),
      'fab-disco':    () => {
        const discoBtn = document.querySelector('[data-mode="disco"]');
        discoBtn?.click();
      },
    };

    Object.entries(handlers).forEach(([id, fn]) => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', fn);
    });
  }

  /* ==========================================================
     26. PULL-DOWN REFRESH (simple)
     ========================================================== */
  function initPullRefresh() {
    if (!isMobile()) return;
    let startY = 0;
    let pulling = false;

    document.addEventListener('touchstart', e => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        pulling = true;
      }
    }, { passive: true });

    document.addEventListener('touchmove', e => {
      if (!pulling) return;
      const dy = e.touches[0].clientY - startY;
      if (dy > 120) {
        pulling = false;
        toast('刷新中…');
        window._termLog?.('pull_refresh triggered', 'cmd');
        flashScreen();
        refresh();
        window._setMeter?.(Math.floor(rand(60, 99)));
      }
    }, { passive: true });

    document.addEventListener('touchend', () => { pulling = false; });
  }

  /* ==========================================================
     27. PHYSICS GRAVITY MODE — FULL ENGINE REWRITE
         Features: sub-stepping, rotation, friction, bouncing,
         stacking, collision sparks, drag-push, throw velocity,
         sleep system, angular impulse, surface contact
     ========================================================== */
  function toggleGravityPhysics() {
    if (gravityFxState.active) { stopGravityPhysics(); return; }
    startGravityPhysics();
  }

  /* ---- Collision spark effect ---- */
  function spawnCollisionSparks(x, y, intensity) {
    const count = Math.min(12, Math.max(3, Math.floor(intensity / 60)));
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'collision-spark';
      const hue = rand(20, 55);
      const size = rand(2, 5);
      el.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:hsl(${hue},100%,70%);box-shadow:0 0 ${size*2}px hsl(${hue},100%,60%);`;
      document.body.appendChild(el);
      const angle = rand(0, Math.PI * 2);
      const dist = rand(15, 50 + intensity * 0.15);
      const dur = rand(250, 500);
      el.animate([
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${Math.cos(angle)*dist}px, ${Math.sin(angle)*dist - 20}px) scale(0)`, opacity: 0 },
      ], { duration: dur, easing: 'cubic-bezier(.15,.8,.3,1)', fill: 'forwards' });
      setTimeout(() => el.remove(), dur + 30);
    }
  }

  /* ---- Dust puff when landing hard ---- */
  function spawnDustPuff(x, y, w) {
    const count = Math.min(8, Math.max(3, Math.floor(w / 80)));
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'dust-puff';
      const spread = rand(-w * 0.3, w * 0.3);
      el.style.cssText = `left:${x + spread}px;top:${y}px;`;
      document.body.appendChild(el);
      const dx = rand(-30, 30);
      const dur = rand(400, 700);
      el.animate([
        { transform: 'translate(0,0) scale(0.3)', opacity: 0.6 },
        { transform: `translate(${dx}px, ${rand(-25, -50)}px) scale(1.5)`, opacity: 0 },
      ], { duration: dur, easing: 'ease-out', fill: 'forwards' });
      setTimeout(() => el.remove(), dur + 30);
    }
  }

  /* ---- Impact flash on card ---- */
  function flashImpact(el, intensity) {
    if (intensity < 200) return;
    const brightness = Math.min(1.4, 1 + intensity / 3000);
    el.style.filter = `brightness(${brightness})`;
    setTimeout(() => { el.style.filter = ''; }, 100);
  }

  function startGravityPhysics() {
    const bodies = collectPhysicsBodies();
    if (!bodies.length) return;

    if (!gravityFxState.ready) {
      initGravityDragHandlers(bodies);
      gravityFxState.ready = true;
    }

    gravityFxState.cards = bodies.map((el, idx) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const w = Math.max(20, rect.width);
      const h = Math.max(20, rect.height);
      el.classList.add('physics-item');
      if (el.classList.contains('card')) el.classList.add('physics-card');
      el.style.transition = 'none';
      /* moment of inertia for a rectangle: (1/12) * m * (w^2 + h^2) */
      const mass = Math.max(0.5, (w * h) / 25000);
      const inertia = (1.0 / 12.0) * mass * (w * w + h * h);
      return {
        el,
        x: cx, y: cy,
        ox: cx, oy: cy,
        vx: rand(-60, 60),
        vy: rand(-120, 0),
        w, h,
        mass,
        inertia: Math.max(1000, inertia),
        angle: 0,
        angularVel: rand(-0.25, 0.25),
        pointerId: null,
        z: idx + 10,
        sleeping: false,
        sleepCounter: 0,
        lastImpactTime: 0,
        onGround: false,
        contactNormal: { x: 0, y: 0 },
      };
    });

    gravityFxState.active = true;
    gravityFxState.lastTs = 0;
    document.body.classList.add('gravity-mode');
    toast('⚡ 重力失效：真实物理引擎已上线');
    window._termLog?.('gravity.fx: physics engine v2 — substep=' + gravityFxState.SUBSTEPS, 'warn');
    gravityFxState.rafId = requestAnimationFrame(stepGravityPhysics);
  }

  function stopGravityPhysics() {
    cancelAnimationFrame(gravityFxState.rafId);
    gravityFxState.rafId = 0;
    gravityFxState.active = false;
    gravityFxState.drag = null;
    document.body.classList.remove('gravity-mode');

    gravityFxState.cards.forEach(({ el }) => {
      el.classList.remove('physics-item', 'physics-card', 'dragging');
      el.style.transition = '';
      el.style.transform = '';
      el.style.zIndex = '';
      el.style.filter = '';
    });
    gravityFxState.cards = [];

    toast('重力场恢复稳定');
    window._termLog?.('gravity.fx: physics loop stopped', 'ok');
  }

  /* ---- Drag handlers with throw velocity tracking ---- */
  function initGravityDragHandlers(items) {
    items.forEach(itemEl => {
      itemEl.addEventListener('pointerdown', e => {
        if (!gravityFxState.active) return;

        const interactiveTarget = e.target instanceof Element
          ? e.target.closest('button, .btn, .fab-btn, a, input, select, textarea, [data-mode]')
          : null;
        if (interactiveTarget) return;

        const item = gravityFxState.cards.find(c => c.el === itemEl);
        if (!item) return;

        /* wake up the dragged item and nearby items */
        item.sleeping = false;
        item.sleepCounter = 0;

        item.pointerId = e.pointerId;
        const rect = itemEl.getBoundingClientRect();
        const grabX = e.clientX - (rect.left + rect.width / 2);
        const grabY = e.clientY - (rect.top + rect.height / 2);

        gravityFxState.drag = {
          item,
          lastX: e.clientX,
          lastY: e.clientY,
          grabX, grabY,
          velHistory: [],     /* track 6 frames of velocity for throw */
        };
        itemEl.classList.add('dragging');
        itemEl.style.zIndex = '9999';
        try { itemEl.setPointerCapture(e.pointerId); } catch (_) {}
        e.preventDefault();
      });

      itemEl.addEventListener('pointermove', e => {
        const drag = gravityFxState.drag;
        if (!gravityFxState.active || !drag || drag.item.el !== itemEl || drag.item.pointerId !== e.pointerId) return;

        const now = performance.now();
        const nextX = e.clientX - drag.grabX;
        const nextY = e.clientY - drag.grabY;

        /* compute instantaneous velocity */
        const dvx = nextX - drag.item.x;
        const dvy = nextY - drag.item.y;

        drag.velHistory.push({ vx: dvx * 60, vy: dvy * 60, t: now });
        if (drag.velHistory.length > 6) drag.velHistory.shift();

        drag.item.x = nextX;
        drag.item.y = nextY;
        drag.item.vx = dvx * 60;
        drag.item.vy = dvy * 60;

        /* compute angular velocity from lateral movement */
        drag.item.angularVel = clamp(dvx * 0.006, -gravityFxState.MAX_ANGULAR_SPEED, gravityFxState.MAX_ANGULAR_SPEED);

        drag.lastX = e.clientX;
        drag.lastY = e.clientY;

        /* wake all items — dragged body may push them */
        gravityFxState.cards.forEach(c => { c.sleeping = false; c.sleepCounter = 0; });
      });

      const release = e => {
        const drag = gravityFxState.drag;
        if (!drag || drag.item.el !== itemEl) return;
        if (drag.item.pointerId !== null && e.pointerId !== undefined && drag.item.pointerId !== e.pointerId) return;

        /* compute throw velocity from history */
        if (drag.velHistory.length >= 2) {
          const recent = drag.velHistory.slice(-3);
          let tvx = 0, tvy = 0;
          for (const v of recent) { tvx += v.vx; tvy += v.vy; }
          tvx /= recent.length;
          tvy /= recent.length;
          /* clamp throw velocity */
          const maxThrow = 3000;
          const throwMag = Math.sqrt(tvx * tvx + tvy * tvy);
          if (throwMag > maxThrow) {
            const s = maxThrow / throwMag;
            tvx *= s; tvy *= s;
          }
          drag.item.vx = tvx;
          drag.item.vy = tvy;
          drag.item.angularVel = clamp(tvx * 0.0012, -gravityFxState.MAX_ANGULAR_SPEED, gravityFxState.MAX_ANGULAR_SPEED);
        }

        drag.item.pointerId = null;
        drag.item.sleeping = false;
        drag.item.sleepCounter = 0;
        drag.item.el.classList.remove('dragging');
        drag.item.el.style.zIndex = String(drag.item.z);
        gravityFxState.drag = null;
      };

      itemEl.addEventListener('pointerup', release);
      itemEl.addEventListener('pointercancel', release);
      itemEl.addEventListener('lostpointercapture', release);
    });
  }

  function collectPhysicsBodies() {
    const selector = [
      '.topbar',
      '.hero',
      '.stat-card',
      '.card',
      '.marquee-wrap',
      '.footer',
      '.swipe-hint',
      '.mobile-fab'
    ].join(',');

    return $$(selector).filter(el => {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 24 && rect.height > 24;
    });
  }

  /* ---- Main physics loop with sub-stepping ---- */
  function stepGravityPhysics(ts) {
    if (!gravityFxState.active) return;
    if (!gravityFxState.lastTs) gravityFxState.lastTs = ts;
    const rawDt = Math.min(0.05, (ts - gravityFxState.lastTs) / 1000);
    gravityFxState.lastTs = ts;

    const gy = gravityFxState.gyroTilt;
    gravityFxState.gravity.x = gy.x * 1400;
    gravityFxState.gravity.y = 1800 + gy.y * 900;

    const W = innerWidth;
    const H = innerHeight;
    const subDt = rawDt / gravityFxState.SUBSTEPS;

    for (let step = 0; step < gravityFxState.SUBSTEPS; step++) {
      /* Apply forces */
      for (const c of gravityFxState.cards) {
        if (c.sleeping) continue;
        if (gravityFxState.drag?.item === c) continue;

        /* gravity */
        c.vx += gravityFxState.gravity.x * subDt;
        c.vy += gravityFxState.gravity.y * subDt;

        /* air drag */
        c.vx *= gravityFxState.AIR_DRAG;
        c.vy *= gravityFxState.AIR_DRAG;

        /* angular damping */
        c.angularVel *= gravityFxState.ANGULAR_DAMPING;
        c.angularVel = clamp(c.angularVel, -gravityFxState.MAX_ANGULAR_SPEED, gravityFxState.MAX_ANGULAR_SPEED);

        /* integrate position */
        c.x += c.vx * subDt;
        c.y += c.vy * subDt;

        /* integrate rotation */
        c.angle += c.angularVel * subDt;
        if (c.angle > Math.PI || c.angle < -Math.PI) {
          c.angle = ((c.angle + Math.PI) % (Math.PI * 2)) - Math.PI;
        }
      }

      /* Wall collisions with bounce + friction + rotation */
      for (const c of gravityFxState.cards) {
        if (c.sleeping) continue;
        if (gravityFxState.drag?.item === c) continue;

        const halfW = c.w / 2;
        const halfH = c.h / 2;
        const rest = gravityFxState.RESTITUTION;
        const friction = gravityFxState.FRICTION_DYNAMIC;
        const now = ts;

        c.onGround = false;
        c.contactNormal = { x: 0, y: 0 };

        /* Floor */
        if (c.y + halfH > H) {
          const penetration = c.y + halfH - H;
          c.y = H - halfH;
          const impactV = Math.abs(c.vy);

          if (impactV > 30 && now - c.lastImpactTime > 100) {
            c.lastImpactTime = now;
            spawnCollisionSparks(c.x, H, impactV);
            if (impactV > 200) spawnDustPuff(c.x, H - 3, c.w);
            flashImpact(c.el, impactV);
          }

          c.vy = -Math.abs(c.vy) * rest;
          /* stop micro-bouncing */
          if (Math.abs(c.vy) < 25) { c.vy = 0; c.onGround = true; }

          /* ground friction */
          c.vx *= (1 - friction);
          /* rolling friction -> angular velocity from ground contact */
          c.angularVel += (c.vx / c.w) * friction * 0.18;
          c.angularVel *= 0.92;

          c.contactNormal = { x: 0, y: -1 };
        }

        /* Ceiling */
        if (c.y - halfH < 0) {
          c.y = halfH;
          const impactV = Math.abs(c.vy);
          if (impactV > 60 && now - c.lastImpactTime > 100) {
            c.lastImpactTime = now;
            spawnCollisionSparks(c.x, 0, impactV);
          }
          c.vy = Math.abs(c.vy) * rest;
          c.vx *= (1 - friction * 0.5);
          c.contactNormal = { x: 0, y: 1 };
        }

        /* Left wall */
        if (c.x - halfW < 0) {
          c.x = halfW;
          const impactV = Math.abs(c.vx);
          if (impactV > 60 && now - c.lastImpactTime > 100) {
            c.lastImpactTime = now;
            spawnCollisionSparks(0, c.y, impactV);
          }
          c.vx = Math.abs(c.vx) * rest;
          c.vy *= (1 - friction * 0.5);
          c.angularVel -= (c.vy / c.h) * friction * 0.12;
          c.contactNormal = { x: 1, y: 0 };
        }

        /* Right wall */
        if (c.x + halfW > W) {
          c.x = W - halfW;
          const impactV = Math.abs(c.vx);
          if (impactV > 60 && now - c.lastImpactTime > 100) {
            c.lastImpactTime = now;
            spawnCollisionSparks(W, c.y, impactV);
          }
          c.vx = -Math.abs(c.vx) * rest;
          c.vy *= (1 - friction * 0.5);
          c.angularVel += (c.vy / c.h) * friction * 0.12;
          c.contactNormal = { x: -1, y: 0 };
        }
      }

      /* Resolve inter-body collisions (multiple iterations) */
      for (let iter = 0; iter < gravityFxState.COLLISION_ITERS; iter++) {
        resolvePhysicsCollisions(ts, subDt);
      }
    }

    /* Sleep detection */
    for (const c of gravityFxState.cards) {
      if (gravityFxState.drag?.item === c) { c.sleeping = false; c.sleepCounter = 0; continue; }
      const speed = Math.sqrt(c.vx * c.vx + c.vy * c.vy);
      const angSpeed = Math.abs(c.angularVel);
      if (speed < gravityFxState.SLEEP_VEL && angSpeed < gravityFxState.SLEEP_ANG) {
        c.sleepCounter++;
        if (c.sleepCounter > gravityFxState.SLEEP_FRAMES) {
          c.sleeping = true;
          c.vx = 0; c.vy = 0; c.angularVel = 0;
        }
      } else {
        c.sleepCounter = 0;
        c.sleeping = false;
      }
    }

    /* Render with rotation */
    for (const c of gravityFxState.cards) {
      const tx = (c.x - c.ox).toFixed(2);
      const ty = (c.y - c.oy).toFixed(2);
      const rot = (c.angle * (180 / Math.PI)).toFixed(2);
      c.el.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotate(${rot}deg)`;
      c.el.style.zIndex = String(c.z);
    }

    gravityFxState.rafId = requestAnimationFrame(stepGravityPhysics);
  }

  /* ---- Advanced collision resolution with friction & angular impulse ---- */
  function resolvePhysicsCollisions(ts, subDt) {
    const arr = gravityFxState.cards;
    const bounce = gravityFxState.RESTITUTION;
    const friction = gravityFxState.FRICTION_DYNAMIC;

    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i];
        const b = arr[j];

        /* skip if both sleeping */
        if (a.sleeping && b.sleeping) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const overlapX = (a.w + b.w) * 0.5 - Math.abs(dx);
        const overlapY = (a.h + b.h) * 0.5 - Math.abs(dy);
        if (overlapX <= 0 || overlapY <= 0) continue;

        /* wake both on collision */
        a.sleeping = false; a.sleepCounter = 0;
        b.sleeping = false; b.sleepCounter = 0;

        /* collision normal — minimum separating axis */
        let nx = 0, ny = 0, overlap = 0;
        if (overlapX < overlapY) {
          nx = dx >= 0 ? 1 : -1;
          overlap = overlapX;
        } else {
          ny = dy >= 0 ? 1 : -1;
          overlap = overlapY;
        }

        /* contact point (approximate — midpoint of overlap) */
        const cpx = (a.x + b.x) * 0.5;
        const cpy = (a.y + b.y) * 0.5;

        const aStatic = gravityFxState.drag?.item === a;
        const bStatic = gravityFxState.drag?.item === b;
        const invMassA = aStatic ? 0 : 1 / a.mass;
        const invMassB = bStatic ? 0 : 1 / b.mass;
        const invInertiaA = aStatic ? 0 : 1 / a.inertia;
        const invInertiaB = bStatic ? 0 : 1 / b.inertia;
        const totalInvMass = invMassA + invMassB;
        if (totalInvMass <= 0) continue;

        /* positional correction (Baumgarte stabilization) */
        const correctionPercent = 0.6;
        const slop = 0.5;
        const correctionMag = Math.max(overlap - slop, 0) / totalInvMass * correctionPercent;
        if (!aStatic) {
          a.x -= nx * correctionMag * invMassA;
          a.y -= ny * correctionMag * invMassA;
        }
        if (!bStatic) {
          b.x += nx * correctionMag * invMassB;
          b.y += ny * correctionMag * invMassB;
        }

        /* contact-point-relative velocity */
        const rax = cpx - a.x, ray = cpy - a.y;
        const rbx = cpx - b.x, rby = cpy - b.y;

        const vaX = a.vx + (-a.angularVel * ray);
        const vaY = a.vy + (a.angularVel * rax);
        const vbX = b.vx + (-b.angularVel * rby);
        const vbY = b.vy + (b.angularVel * rbx);

        const rvx = vbX - vaX;
        const rvy = vbY - vaY;
        const velAlongNormal = rvx * nx + rvy * ny;

        /* separating → skip */
        if (velAlongNormal > 0) continue;

        /* normal impulse */
        const raCrossN = rax * ny - ray * nx;
        const rbCrossN = rbx * ny - rby * nx;
        const denom = totalInvMass + raCrossN * raCrossN * invInertiaA + rbCrossN * rbCrossN * invInertiaB;
        if (denom <= 0) continue;

        const jn = (-(1 + bounce) * velAlongNormal) / denom;

        if (!aStatic) {
          a.vx -= jn * nx * invMassA;
          a.vy -= jn * ny * invMassA;
          a.angularVel -= raCrossN * jn * invInertiaA * gravityFxState.ANGULAR_IMPULSE_SCALE;
          a.angularVel = clamp(a.angularVel, -gravityFxState.MAX_ANGULAR_SPEED, gravityFxState.MAX_ANGULAR_SPEED);
        }
        if (!bStatic) {
          b.vx += jn * nx * invMassB;
          b.vy += jn * ny * invMassB;
          b.angularVel += rbCrossN * jn * invInertiaB * gravityFxState.ANGULAR_IMPULSE_SCALE;
          b.angularVel = clamp(b.angularVel, -gravityFxState.MAX_ANGULAR_SPEED, gravityFxState.MAX_ANGULAR_SPEED);
        }

        /* tangent (friction) impulse */
        const tx = rvx - velAlongNormal * nx;
        const ty = rvy - velAlongNormal * ny;
        const tLen = Math.sqrt(tx * tx + ty * ty);
        if (tLen > 0.001) {
          const tnx = tx / tLen;
          const tny = ty / tLen;
          const velAlongTangent = rvx * tnx + rvy * tny;

          const raCrossT = rax * tny - ray * tnx;
          const rbCrossT = rbx * tny - rby * tnx;
          const denomT = totalInvMass + raCrossT * raCrossT * invInertiaA + rbCrossT * rbCrossT * invInertiaB;
          if (denomT > 0) {
            let jt = -velAlongTangent / denomT;
            /* Coulomb's law clamp */
            const maxFriction = Math.abs(jn) * friction;
            jt = Math.max(-maxFriction, Math.min(maxFriction, jt));

            if (!aStatic) {
              a.vx -= jt * tnx * invMassA;
              a.vy -= jt * tny * invMassA;
              a.angularVel -= raCrossT * jt * invInertiaA * gravityFxState.ANGULAR_IMPULSE_SCALE;
              a.angularVel = clamp(a.angularVel, -gravityFxState.MAX_ANGULAR_SPEED, gravityFxState.MAX_ANGULAR_SPEED);
            }
            if (!bStatic) {
              b.vx += jt * tnx * invMassB;
              b.vy += jt * tny * invMassB;
              b.angularVel += rbCrossT * jt * invInertiaB * gravityFxState.ANGULAR_IMPULSE_SCALE;
              b.angularVel = clamp(b.angularVel, -gravityFxState.MAX_ANGULAR_SPEED, gravityFxState.MAX_ANGULAR_SPEED);
            }
          }
        }

        /* visual: collision sparks */
        const impactSpeed = Math.abs(velAlongNormal);
        if (impactSpeed > 120 && ts - a.lastImpactTime > 80 && ts - b.lastImpactTime > 80) {
          spawnCollisionSparks(cpx, cpy, impactSpeed);
          flashImpact(a.el, impactSpeed);
          flashImpact(b.el, impactSpeed);
          a.lastImpactTime = ts;
          b.lastImpactTime = ts;
        }
      }
    }
  }

})();
