(function () {
  var grid = document.getElementById('menu-grid');
  if (!grid) return;

  var search = document.getElementById('menu-search');
  var chips = document.getElementById('menu-chips');
  var empty = document.getElementById('menu-empty');
  var active = 'tutto';

  var LENS = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></svg>';

  function norm(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function qtyHtml(id) {
    var n = PolleriaCart.qtyOf(id);
    var dish = findDish(id);
    if (n === 0) {
      return '<button type="button" class="qty-add" data-inc="' + id + '" aria-label="Aggiungi ' + escapeHtml(dish.name) + ' all\'ordine">Aggiungi</button>';
    }
    return '<button type="button" class="qty-btn" data-dec="' + id + '" aria-label="Togli un ' + escapeHtml(dish.name) + '">&minus;</button>' +
      '<output aria-live="polite">' + n + '</output>' +
      '<button type="button" class="qty-btn" data-inc="' + id + '" aria-label="Aggiungi un altro ' + escapeHtml(dish.name) + '">+</button>';
  }

  function cardHtml(d) {
    var note = d.short || d.note || '';
    return '' +
      '<article class="dish' + (d.featured ? ' dish--featured' : '') + '" data-id="' + d.id + '">' +
        '<button type="button" class="dish-photo' + (d.fit === 'contain' ? ' is-contain' : '') + '" data-open="' + d.id + '" aria-label="Dettagli: ' + escapeHtml(d.name) + '">' +
          '<img src="images/' + d.img + '" alt="' + escapeHtml(d.name) + '" loading="lazy" width="400" height="300">' +
          '<span class="dish-zoom">' + LENS + '<span>Dettagli</span></span>' +
        '</button>' +
        (d.featured ? '<span class="dish-flag">Il più ordinato</span>' : '') +
        '<div class="dish-body">' +
          '<h3 class="dish-name">' + escapeHtml(d.name) + (d.spicy ? ' <span class="chili" title="Piccante">Piccante</span>' : '') + '</h3>' +
          (note ? '<p class="dish-note">' + escapeHtml(note) + '</p>' : '') +
          '<div class="dish-foot">' +
            '<span class="dish-price">' + euro(d.price) + '</span>' +
            '<div class="qty" data-qty="' + d.id + '">' + qtyHtml(d.id) + '</div>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function matches(d, q) {
    if (!q) return true;
    return norm(d.name + ' ' + d.note + ' ' + (d.short || '') + ' ' + d.detail).indexOf(q) !== -1;
  }

  function render() {
    var q = norm(search.value.trim());
    var html = '';
    var total = 0;

    if (q) {
      var found = MENU.filter(function (d) {
        return matches(d, q) && (active === 'tutto' || d.cats.indexOf(active) !== -1);
      });
      total = found.length;
      if (total) {
        html += '<section class="menu-group"><h2 class="menu-group-title">Risultati per “' + escapeHtml(search.value.trim()) + '”</h2><div class="dish-grid">';
        found.forEach(function (d) { html += cardHtml(d); });
        html += '</div></section>';
      }
    } else {
      CATEGORIES.forEach(function (c) {
        if (active !== 'tutto' && active !== c.id) return;
        var list = MENU.filter(function (d) { return d.cats.indexOf(c.id) !== -1; });
        total += list.length;
        html += '<section class="menu-group" id="cat-' + c.id + '"><h2 class="menu-group-title">' + c.label + '<span>' + list.length + ' piatti</span></h2><div class="dish-grid">';
        list.forEach(function (d) { html += cardHtml(d); });
        html += '</div></section>';
      });
    }

    grid.innerHTML = html;
    empty.hidden = total > 0;
    if (!total) {
      empty.querySelector('[data-empty-q]').textContent = search.value.trim();
    }
  }

  function refreshQty() {
    document.querySelectorAll('[data-qty]').forEach(function (el) {
      el.innerHTML = qtyHtml(el.getAttribute('data-qty'));
    });
    var modalQty = document.querySelector('[data-modal-count]');
    if (modalQty && openId) modalQty.textContent = PolleriaCart.qtyOf(openId);
  }

  // Filtri per categoria
  var chipHtml = '<button type="button" class="chip is-active" data-cat="tutto" aria-pressed="true">Tutto</button>';
  CATEGORIES.forEach(function (c) {
    chipHtml += '<button type="button" class="chip" data-cat="' + c.id + '" aria-pressed="false">' + c.label + '</button>';
  });
  chips.innerHTML = chipHtml;
  chips.addEventListener('click', function (e) {
    var b = e.target.closest('[data-cat]');
    if (!b) return;
    active = b.getAttribute('data-cat');
    chips.querySelectorAll('.chip').forEach(function (c) {
      var on = c === b;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-pressed', String(on));
    });
    render();
  });

  search.addEventListener('input', render);
  document.getElementById('menu-clear-search').addEventListener('click', function () {
    search.value = '';
    render();
    search.focus();
  });

  // Aggiungi / togli direttamente dalla card
  grid.addEventListener('click', function (e) {
    var inc = e.target.closest('[data-inc]');
    var dec = e.target.closest('[data-dec]');
    var open = e.target.closest('[data-open]');
    if (inc) {
      var dish = findDish(inc.getAttribute('data-inc'));
      var first = PolleriaCart.qtyOf(dish.id) === 0;
      PolleriaCart.add(dish.id, 1);
      if (first) {
        polleriaToast(dish.choice
          ? dish.name + ' aggiunto (' + dish.choice.label.toLowerCase() + ': ' + dish.choice.options[0].toLowerCase() + ', lo cambi nel riepilogo)'
          : dish.name + ' aggiunto all\'ordine');
      }
    } else if (dec) {
      PolleriaCart.decrement(dec.getAttribute('data-dec'));
    } else if (open) {
      openModal(open.getAttribute('data-open'), open);
    }
  });

  document.addEventListener('cart:change', refreshQty);

  // ===== Scheda dettaglio =====
  var modal = document.getElementById('dish-modal');
  var openId = null, lastFocus = null;

  function openModal(id, trigger) {
    var d = findDish(id);
    if (!d) return;
    openId = id;
    lastFocus = trigger;
    var img = modal.querySelector('[data-modal-img]');
    img.src = 'images/' + d.img;
    img.alt = d.name;
    img.classList.toggle('is-contain', d.fit === 'contain');
    modal.querySelector('[data-modal-title]').textContent = d.name;
    modal.querySelector('[data-modal-note]').textContent = d.note || '';
    modal.querySelector('[data-modal-price]').textContent = euro(d.price);
    modal.querySelector('[data-modal-desc]').textContent = d.detail;
    modal.querySelector('[data-modal-count]').textContent = PolleriaCart.qtyOf(id);

    var choiceWrap = modal.querySelector('[data-modal-choice]');
    if (d.choice) {
      var opts = d.choice.options.map(function (o) { return '<option>' + escapeHtml(o) + '</option>'; }).join('');
      choiceWrap.innerHTML = '<label for="modal-choice">' + d.choice.label + '</label><select id="modal-choice">' + opts + '</select>';
      choiceWrap.hidden = false;
    } else {
      choiceWrap.innerHTML = '';
      choiceWrap.hidden = true;
    }

    modal.hidden = false;
    document.body.classList.add('is-locked');
    modal.querySelector('.modal-close').focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove('is-locked');
    openId = null;
    if (lastFocus) lastFocus.focus();
  }

  modal.querySelector('[data-modal-add]').addEventListener('click', function () {
    if (!openId) return;
    var d = findDish(openId);
    var sel = modal.querySelector('#modal-choice');
    PolleriaCart.add(openId, 1, sel ? sel.value : '');
    polleriaToast(d.name + (sel ? ' (' + sel.value.toLowerCase() + ')' : '') + ' aggiunto all\'ordine');
  });
  modal.querySelector('.modal-close').addEventListener('click', closeModal);
  modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });

  render();

  // Apertura diretta di una categoria da link esterno (es. menu.html#fritti)
  var hash = location.hash.replace('#', '');
  if (hash) {
    var chip = chips.querySelector('[data-cat="' + hash + '"]');
    if (chip) chip.click();
  }

  // QR code che punta sempre a questa pagina, ovunque sia pubblicato il sito
  var qrBox = document.getElementById('qr-code');
  if (qrBox && window.QRCode) {
    new QRCode(qrBox, {
      text: new URL('menu.html', location.href).href.split('#')[0],
      width: 132, height: 132,
      colorDark: '#1E120B', colorLight: '#F6EBDD'
    });
  }
})();
