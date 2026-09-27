// ===== Orari: aperto tutti i giorni 10–19, chiuso il martedì =====
var PolleriaHours = (function () {
  var DAYS = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];

  function minutesOf(d) { return d.getHours() * 60 + d.getMinutes(); }

  function isOpenDay(day) { return day !== POLLERIA.closedDay; }

  function status(now) {
    now = now || new Date();
    var day = now.getDay();
    var m = minutesOf(now);
    var open = isOpenDay(day) && m >= POLLERIA.openMin && m < POLLERIA.closeMin;

    if (open) {
      return { open: true, short: 'Aperto ora', text: 'Aperto ora, chiude alle 19:00', minutesLeft: POLLERIA.closeMin - m };
    }

    // Prossima apertura
    var when;
    var next = new Date(now);
    if (isOpenDay(day) && m < POLLERIA.openMin) {
      when = 'oggi';
    } else {
      var offset = 1;
      while (!isOpenDay((day + offset) % 7)) offset++;
      next.setDate(now.getDate() + offset);
      when = offset === 1 ? 'domani' : DAYS[(day + offset) % 7];
    }
    next.setHours(10, 0, 0, 0);
    var minutesUntil = Math.round((next - now) / 60000);
    var prefix = day === POLLERIA.closedDay ? 'Oggi chiuso' : 'Chiuso';
    var verb = when === 'oggi' ? 'apre' : 'riapre';
    return { open: false, short: 'Chiuso', text: prefix + ', ' + verb + ' ' + when + ' alle 10:00', minutesUntil: minutesUntil };
  }

  function duration(min) {
    var h = Math.floor(min / 60), m = min % 60;
    if (h === 0) return m + ' min';
    if (m === 0) return h + ' h';
    return h + ' h ' + m + ' min';
  }

  return { status: status, duration: duration, DAYS: DAYS };
})();

// ===== Avvisi (toast) =====
function polleriaToast(message) {
  var box = document.getElementById('toast');
  if (!box) return;
  box.textContent = message;
  box.classList.add('is-on');
  clearTimeout(box._t);
  box._t = setTimeout(function () { box.classList.remove('is-on'); }, 2200);
}

(function () {
  // Stato aperto/chiuso in testata
  function renderStatus() {
    var s = PolleriaHours.status();
    document.querySelectorAll('[data-status]').forEach(function (el) {
      el.textContent = s.text;
      el.classList.toggle('is-open', s.open);
      el.classList.toggle('is-closed', !s.open);
    });
  }
  renderStatus();
  setInterval(renderStatus, 60000);

  // Contatore carrello
  function renderCount() {
    var n = PolleriaCart.count();
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = n;
      el.hidden = n === 0;
    });
  }
  renderCount();
  document.addEventListener('cart:change', renderCount);
  window.addEventListener('storage', renderCount);

  // Pulsanti "aggiungi" sparsi nelle pagine (es. home)
  document.querySelectorAll('[data-add]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var dish = findDish(btn.getAttribute('data-add'));
      if (!dish) return;
      PolleriaCart.add(dish.id, 1);
      polleriaToast(dish.name + ' aggiunto all\'ordine');
    });
  });

  // Menu mobile
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('mainnav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      document.body.classList.toggle('nav-open', !open);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
      }
    });
  }

  // Banner cookie (solo informativo: il sito usa esclusivamente strumenti tecnici)
  var cookie = document.getElementById('cookie');
  var COOKIE_KEY = 'polleria-cookie-ok';
  function seen() { try { return localStorage.getItem(COOKIE_KEY) === '1'; } catch (e) { return false; } }
  if (cookie) {
    if (!seen()) cookie.hidden = false;
    cookie.querySelector('[data-cookie-ok]').addEventListener('click', function () {
      try { localStorage.setItem(COOKIE_KEY, '1'); } catch (e) {}
      cookie.hidden = true;
    });
    document.querySelectorAll('[data-cookie-open]').forEach(function (b) {
      b.addEventListener('click', function () { cookie.hidden = false; });
    });
  }

  // Anno nel footer
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();

// ===== Quadrante degli orari (home) =====
(function () {
  var svg = document.querySelector('.dial');
  if (!svg) return;

  var CX = 110, CY = 110, R = 86;
  var START = -135, END = 135; // gradi, 0 = ore 12 del quadrante

  function point(angle, r) {
    var a = angle * Math.PI / 180;
    return [CX + r * Math.sin(a), CY - r * Math.cos(a)];
  }
  function arc(a1, a2, r) {
    var p1 = point(a1, r), p2 = point(a2, r);
    var large = (a2 - a1) > 180 ? 1 : 0;
    return 'M' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2) + ' A' + r + ' ' + r + ' 0 ' + large + ' 1 ' + p2[0].toFixed(2) + ' ' + p2[1].toFixed(2);
  }
  function angleForMinutes(m) {
    var t = (m - POLLERIA.openMin) / (POLLERIA.closeMin - POLLERIA.openMin);
    t = Math.max(0, Math.min(1, t));
    return START + t * (END - START);
  }

  svg.querySelector('.dial-track').setAttribute('d', arc(START, END, R));

  // Tacche orarie 10 → 19
  var ticks = svg.querySelector('.dial-ticks');
  for (var h = 10; h <= 19; h++) {
    var a = angleForMinutes(h * 60);
    var p1 = point(a, R - 14), p2 = point(a, R - 6);
    var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', p1[0]); line.setAttribute('y1', p1[1]);
    line.setAttribute('x2', p2[0]); line.setAttribute('y2', p2[1]);
    ticks.appendChild(line);
    if (h === 10 || h === 13 || h === 16 || h === 19) {
      var pt = point(a, R - 28);
      var label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', pt[0]); label.setAttribute('y', pt[1] + 4);
      label.textContent = h;
      ticks.appendChild(label);
    }
  }

  var progress = svg.querySelector('.dial-progress');
  var needle = svg.querySelector('.dial-needle');
  var stateEl = document.querySelector('[data-dial-state]');
  var detailEl = document.querySelector('[data-dial-detail]');
  var card = document.querySelector('.dial-card');

  function render() {
    var now = new Date();
    var s = PolleriaHours.status(now);
    var m = now.getHours() * 60 + now.getMinutes();
    var angle = s.open ? angleForMinutes(m) : (m >= POLLERIA.closeMin ? END : START);
    if (now.getDay() === POLLERIA.closedDay) angle = START;

    progress.setAttribute('d', s.open ? arc(START, Math.max(START + 0.5, angle), R) : '');
    needle.setAttribute('transform', 'rotate(' + angle + ' ' + CX + ' ' + CY + ')');
    card.classList.toggle('is-open', s.open);

    if (s.open) {
      stateEl.textContent = 'Siamo aperti';
      detailEl.textContent = 'Ancora ' + PolleriaHours.duration(s.minutesLeft) + ' per passare o ordinare';
    } else {
      stateEl.textContent = 'Siamo chiusi';
      detailEl.textContent = s.text.replace(/^(Oggi chiuso|Chiuso), /, '').replace(/^./, function (c) { return c.toUpperCase(); });
    }
  }
  render();
  setInterval(render, 30000);
})();

// ===== Brace che sale dal fuoco (home) =====
(function () {
  var canvas = document.querySelector('.embers');
  if (!canvas || !canvas.getContext) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, sparks = [], running = false, raf = null;

  function size() {
    var r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn(initial) {
    return {
      x: Math.random() * W,
      y: initial ? Math.random() * H : H + 10,
      r: 0.6 + Math.random() * 1.8,
      vy: 0.35 + Math.random() * 0.9,
      vx: (Math.random() - 0.5) * 0.3,
      life: 0,
      max: 220 + Math.random() * 260,
      hue: 18 + Math.random() * 26
    };
  }

  function init() {
    size();
    var n = W < 700 ? 16 : 40;
    sparks = [];
    for (var i = 0; i < n; i++) sparks.push(spawn(true));
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < sparks.length; i++) {
      var s = sparks[i];
      s.life++;
      s.y -= s.vy;
      s.x += s.vx + Math.sin((s.life + i * 20) / 40) * 0.25;
      var t = s.life / s.max;
      var alpha = t < 0.15 ? t / 0.15 : 1 - t;
      if (s.life > s.max || s.y < -10) { sparks[i] = spawn(false); continue; }
      ctx.beginPath();
      ctx.fillStyle = 'hsla(' + s.hue + ', 100%, 60%, ' + (alpha * 0.85).toFixed(3) + ')';
      ctx.shadowColor = 'hsla(' + s.hue + ', 100%, 55%, 1)';
      ctx.shadowBlur = 8;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    if (running) raf = requestAnimationFrame(frame);
  }

  function start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); }

  init();
  window.addEventListener('resize', function () { init(); });

  // Si ferma quando l'hero non è visibile o la scheda è in background: niente consumi inutili
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (entries) {
      entries[0].isIntersecting ? start() : stop();
    }).observe(canvas);
  } else {
    start();
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { stop(); return; }
    var r = canvas.getBoundingClientRect();
    if (r.bottom > 0 && r.top < window.innerHeight) start();
  });
})();
