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
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width  - 0.5;
        const y = (e.clientY - rect.top)  / rect.height - 0.5;
        card.style.transform = `perspective(700px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.02)`;
      });
      card.addEventListener('mouseleave', () => {
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
          $$('.card').forEach((c, i) => {
            c.animate([
              { transform: 'translateY(0)' },
              { transform: `translateY(${i % 2 ? -20 : 20}px) rotate(${i % 2 ? 1 : -1}deg)` },
              { transform: 'translateY(0)' },
            ], { duration: 2400, iterations: 2, easing: 'ease-in-out' });
          });
          toast('重力场临时关闭');
          window._termLog?.('gravity: disabled for 5s', 'warn');
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
          document.body.style.filter = 'none';
          document.body.classList.remove('pixelated');
          resetPalette();
          toast('现实参数已恢复');
          window._termLog?.('system.reset() — normality restored', 'ok');
        }
      });
    });
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
     19. FIREWORKS — canvas‐free DOM sparks
     ========================================================== */
  function fireworks(count = 40) {
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'firework';
      const x = rand(0, innerWidth);
      const y = rand(0, innerHeight * 0.6);
      const hue = rand(0, 360);
      el.style.cssText = `
        left:${x}px; top:${y}px;
        background: hsl(${hue},100%,70%);
        box-shadow: 0 0 6px hsl(${hue},100%,70%), 0 0 14px hsl(${hue},100%,55%);
      `;
      document.body.appendChild(el);

      const angle = rand(0, Math.PI * 2);
      const dist  = rand(40, 160);
      const dur   = rand(600, 1200);
      el.animate([
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${Math.cos(angle)*dist}px, ${Math.sin(angle)*dist}px) scale(0)`, opacity: 0 },
      ], { duration: dur, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' });

      setTimeout(() => el.remove(), dur + 50);
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
      for (let i = 0; i < 8; i++) {
        const el = document.createElement('div');
        el.className = 'firework';
        const hue = rand(0, 360);
        el.style.cssText = `
          left:${t.clientX}px; top:${t.clientY}px;
          background:hsl(${hue},100%,70%);
          box-shadow:0 0 6px hsl(${hue},100%,70%);
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
      const rx = (gamma / 15) * 4; // degrees
      const ry = (beta  / 15) * 4;
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

})();
