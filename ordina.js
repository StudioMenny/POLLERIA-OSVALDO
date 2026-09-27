(function () {
  var list = document.getElementById('order-list');
  if (!list) return;

  var emptyBox = document.getElementById('order-empty');
  var filled = document.querySelectorAll('[data-when-filled]');
  var reorderBtn = document.getElementById('order-reorder');
  var mode = 'ritiro';

  var nameInput = document.getElementById('o-name');
  var addressInput = document.getElementById('o-address');
  var notesInput = document.getElementById('o-notes');
  var errorBox = document.getElementById('order-error');

  // Ricorda nome e indirizzo per la prossima volta (solo in questo browser)
  var PROFILE = 'polleria-profile-v3';
  try {
    var saved = JSON.parse(localStorage.getItem(PROFILE)) || {};
    if (saved.name) nameInput.value = saved.name;
    if (saved.address) addressInput.value = saved.address;
  } catch (e) {}

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function fee() { return mode === 'domicilio' ? POLLERIA.deliveryFee : 0; }

  function render() {
    var lines = PolleriaCart.read();
    var has = lines.length > 0;

    emptyBox.hidden = has;
    filled.forEach(function (el) { el.hidden = !has; });
    reorderBtn.hidden = has || PolleriaCart.readLast().length === 0;

    list.innerHTML = lines.map(function (l) {
      var d = findDish(l.id);
      var choice = '';
      if (d.choice) {
        choice = '<label class="line-choice"><span>' + d.choice.label + '</span><select data-choice="' + esc(l.key) + '">' +
          d.choice.options.map(function (o) {
            return '<option' + (o === l.choice ? ' selected' : '') + '>' + esc(o) + '</option>';
          }).join('') + '</select></label>';
      }
      return '' +
        '<li class="line">' +
          '<img src="images/' + d.img + '" alt="" class="line-img' + (d.fit === 'contain' ? ' is-contain' : '') + '">' +
          '<div class="line-main">' +
            '<p class="line-name">' + esc(d.name) + (d.note && !d.choice ? ' <span>' + esc(d.note) + '</span>' : '') + '</p>' +
            choice +
          '</div>' +
          '<div class="qty qty--small">' +
            '<button type="button" class="qty-btn" data-minus="' + esc(l.key) + '" aria-label="Togli uno">&minus;</button>' +
            '<output>' + l.qty + '</output>' +
            '<button type="button" class="qty-btn" data-plus="' + esc(l.key) + '" aria-label="Aggiungi uno">+</button>' +
          '</div>' +
          '<span class="line-price">' + euro(d.price * l.qty) + '</span>' +
          '<button type="button" class="line-remove" data-remove="' + esc(l.key) + '" aria-label="Rimuovi ' + esc(d.name) + '">&times;</button>' +
        '</li>';
    }).join('');

    var sub = PolleriaCart.subtotal();
    document.getElementById('sum-sub').textContent = euro(sub);
    document.getElementById('sum-fee-row').hidden = mode !== 'domicilio';
    document.getElementById('sum-fee').textContent = euro(fee());
    document.getElementById('sum-total').textContent = euro(sub + fee());
    document.getElementById('order-count').textContent = PolleriaCart.count();
  }

  list.addEventListener('click', function (e) {
    var t = e.target.closest('button');
    if (!t) return;
    var lines = PolleriaCart.read();
    function lineOf(key) { for (var i = 0; i < lines.length; i++) if (lines[i].key === key) return lines[i]; }
    if (t.dataset.plus) { var a = lineOf(t.dataset.plus); PolleriaCart.setQty(a.key, a.qty + 1); }
    if (t.dataset.minus) { var b = lineOf(t.dataset.minus); PolleriaCart.setQty(b.key, b.qty - 1); }
    if (t.dataset.remove) { PolleriaCart.setQty(t.dataset.remove, 0); }
  });

  list.addEventListener('change', function (e) {
    if (e.target.dataset.choice) PolleriaCart.setChoice(e.target.dataset.choice, e.target.value);
  });

  // Ritiro / consegna
  document.querySelectorAll('[data-mode]').forEach(function (b) {
    b.addEventListener('click', function () {
      mode = b.getAttribute('data-mode');
      document.querySelectorAll('[data-mode]').forEach(function (x) {
        var on = x === b;
        x.classList.toggle('is-active', on);
        x.setAttribute('aria-pressed', String(on));
      });
      document.getElementById('address-field').hidden = mode !== 'domicilio';
      render();
    });
  });

  document.getElementById('order-clear').addEventListener('click', function () {
    PolleriaCart.clear();
    polleriaToast('Carrello svuotato');
  });

  reorderBtn.addEventListener('click', function () {
    PolleriaCart.restoreLast();
    polleriaToast('Ultimo ordine di nuovo nel carrello');
  });

  function showError(msg, field) {
    errorBox.textContent = msg;
    errorBox.hidden = false;
    if (field) field.focus();
  }

  document.getElementById('order-send').addEventListener('click', function () {
    var lines = PolleriaCart.read();
    errorBox.hidden = true;
    if (!lines.length) return;

    var name = nameInput.value.trim();
    var address = addressInput.value.trim();
    if (!name) return showError('Scrivi il tuo nome, così il negozio sa di chi è l\'ordine.', nameInput);
    if (mode === 'domicilio' && !address) return showError('Scrivi l\'indirizzo a cui consegnare.', addressInput);

    try { localStorage.setItem(PROFILE, JSON.stringify({ name: name, address: address })); } catch (e) {}

    var msg = ['Ciao! Vorrei ordinare:'];
    lines.forEach(function (l) {
      var d = findDish(l.id);
      var extra = d.choice ? ' (' + d.choice.label.toLowerCase() + ': ' + l.choice.toLowerCase() + ')' : (d.note ? ' (' + d.note + ')' : '');
      msg.push('- ' + l.qty + 'x ' + d.name + extra + ': ' + euro(d.price * l.qty));
    });
    var sub = PolleriaCart.subtotal();
    msg.push('');
    if (mode === 'domicilio') {
      msg.push('Subtotale: ' + euro(sub));
      msg.push('Consegna a domicilio: ' + euro(fee()));
    }
    msg.push('Totale: ' + euro(sub + fee()));
    msg.push('');
    msg.push('Nome: ' + name);
    msg.push(mode === 'domicilio' ? 'Consegna a: ' + address : 'Ritiro in negozio');
    if (notesInput.value.trim()) msg.push('Note: ' + notesInput.value.trim());
    msg.push('');
    msg.push('(in attesa di conferma da parte vostra)');

    PolleriaCart.saveLast();
    window.open('https://wa.me/' + POLLERIA.whatsapp + '?text=' + encodeURIComponent(msg.join('\n')), '_blank');
    polleriaToast('Ordine pronto su WhatsApp: premi invia per mandarlo');
  });

  document.addEventListener('cart:change', render);
  render();
})();
