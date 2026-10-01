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

// ===== Fumo dello spiedo (home) =====
// Poche volute di fumo morbide che salgono lente: ogni volute è un'immagine pre-disegnata una sola
// volta, massimo 30 fotogrammi al secondo, e l'animazione si ferma appena l'hero esce dallo schermo.
(function () {
  var canvas = document.querySelector('.embers');
  if (!canvas || !canvas.getContext) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  var W = 0, H = 0, puffs = [], specks = [], running = false, raf = null, last = 0;
  var FRAME = 1000 / 30;

  function makeSprite(px, stops) {
    var c = document.createElement('canvas');
    c.width = c.height = px;
    var x = c.getContext('2d');
    var g = x.createRadialGradient(px / 2, px / 2, 0, px / 2, px / 2, px / 2);
    stops.forEach(function (st) { g.addColorStop(st[0], st[1]); });
    x.fillStyle = g;
    x.fillRect(0, 0, px, px);
    return c;
  }

  // Volute di fumo chiaro e qualche granello dorato di spezie che sale con il calore
  var smoke = makeSprite(128, [[0, 'rgba(242, 238, 223, 0.55)'], [0.45, 'rgba(242, 238, 223, 0.18)'], [1, 'rgba(242, 238, 223, 0)']]);
  var speck = makeSprite(16, [[0, 'rgba(255, 226, 150, 1)'], [0.4, 'rgba(232, 184, 78, 0.7)'], [1, 'rgba(232, 184, 78, 0)']]);

  function size() {
    var r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function newPuff(initial) {
    return {
      x: W * (0.45 + Math.random() * 0.55),
      y: initial ? Math.random() * H : H + 80,
      s: 90 + Math.random() * 110,
      grow: 0.35 + Math.random() * 0.4,
      vy: 0.35 + Math.random() * 0.45,
      vx: -0.15 + Math.random() * 0.3,
      life: initial ? Math.random() * 300 : 0,
      max: 380 + Math.random() * 220,
      peak: 0.08 + Math.random() * 0.07
    };
  }

  function newSpeck(initial) {
    return {
      x: Math.random() * W,
      y: initial ? Math.random() * H : H + 6,
      s: 3 + Math.random() * 4,
      vy: 0.5 + Math.random() * 0.9,
      vx: (Math.random() - 0.5) * 0.3,
      life: 0,
      max: 160 + Math.random() * 160
    };
  }

  function init() {
    size();
    var small = W < 700;
    puffs = []; specks = [];
    for (var i = 0; i < (small ? 6 : 11); i++) puffs.push(newPuff(true));
    for (var j = 0; j < (small ? 6 : 12); j++) specks.push(newSpeck(true));
  }

  function fade(k) { return k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8; }

  function frame(t) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    if (t - last < FRAME) return;
    last = t;

    ctx.clearRect(0, 0, W, H);

    for (var i = 0; i < puffs.length; i++) {
      var p = puffs[i];
      p.life++;
      p.y -= p.vy;
      p.x += p.vx + Math.sin((p.life + i * 40) / 60) * 0.25;
      p.s += p.grow;
      if (p.life > p.max || p.y < -p.s) { puffs[i] = newPuff(false); continue; }
      ctx.globalAlpha = fade(p.life / p.max) * p.peak;
      ctx.drawImage(smoke, p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
    }

    for (var j = 0; j < specks.length; j++) {
      var s = specks[j];
      s.life++;
      s.y -= s.vy;
      s.x += s.vx + Math.sin((s.life + j * 25) / 25) * 0.3;
      if (s.life > s.max || s.y < -10) { specks[j] = newSpeck(false); continue; }
      ctx.globalAlpha = fade(s.life / s.max) * 0.8;
      ctx.drawImage(speck, s.x - s.s / 2, s.y - s.s / 2, s.s, s.s);
    }
    ctx.globalAlpha = 1;
  }

  function start() { if (!running) { running = true; last = 0; raf = requestAnimationFrame(frame); } }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); }

  init();
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(init, 200);
  });

  var visible = true;
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].intersectionRatio > 0.6;
      visible && !document.hidden ? start() : stop();
    }, { threshold: [0, 0.6, 1] }).observe(canvas);
  } else {
    start();
  }
  document.addEventListener('visibilitychange', function () {
    document.hidden || !visible ? stop() : start();
  });
})();

// ===== Colori della nuova palette applicati anche a ciò che sta nell'HTML =====
// (barra del browser su telefono e sfumatura del quadrante), così non serve ricaricare le pagine HTML
(function () {
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', '#121710');
  var stops = document.querySelectorAll('#dialGrad stop');
  if (stops.length === 2) {
    stops[0].setAttribute('stop-color', '#9CC07A');
    stops[1].setAttribute('stop-color', '#E8B84E');
  }
})();
