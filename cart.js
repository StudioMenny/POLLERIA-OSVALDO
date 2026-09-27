// Carrello salvato nel browser (localStorage): resta anche cambiando pagina.
// Ogni riga è { key, id, qty, choice } — lo stesso piatto con contorni diversi sta su righe diverse.
var PolleriaCart = (function () {
  var KEY = 'polleria-cart-v3';
  var LAST = 'polleria-last-order-v3';

  function safeGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function read() {
    var lines = safeGet(KEY);
    if (!Array.isArray(lines)) return [];
    return lines.filter(function (l) { return l && findDish(l.id) && l.qty > 0; });
  }

  function write(lines) {
    safeSet(KEY, lines);
    document.dispatchEvent(new CustomEvent('cart:change'));
  }

  function keyOf(id, choice) { return id + '|' + (choice || ''); }

  function add(id, qty, choice) {
    var dish = findDish(id);
    if (!dish) return;
    if (dish.choice && !choice) choice = dish.choice.options[0];
    var lines = read();
    var key = keyOf(id, choice);
    var found = null;
    lines.forEach(function (l) { if (l.key === key) found = l; });
    if (found) found.qty += (qty || 1);
    else lines.push({ key: key, id: id, qty: qty || 1, choice: choice || '' });
    write(lines);
  }

  function setQty(key, qty) {
    var lines = read().filter(function (l) {
      if (l.key === key) l.qty = qty;
      return l.qty > 0;
    });
    write(lines);
  }

  function setChoice(key, choice) {
    var lines = read();
    var target = null, merge = null, newKey;
    lines.forEach(function (l) { if (l.key === key) target = l; });
    if (!target) return;
    newKey = keyOf(target.id, choice);
    lines.forEach(function (l) { if (l.key === newKey) merge = l; });
    if (merge && merge !== target) {
      merge.qty += target.qty;
      lines = lines.filter(function (l) { return l !== target; });
    } else {
      target.choice = choice;
      target.key = newKey;
    }
    write(lines);
  }

  // Quantità totale di un piatto (tutte le varianti insieme)
  function qtyOf(id) {
    var n = 0;
    read().forEach(function (l) { if (l.id === id) n += l.qty; });
    return n;
  }

  // Toglie un'unità dall'ultima riga aggiunta di quel piatto
  function decrement(id) {
    var lines = read();
    for (var i = lines.length - 1; i >= 0; i--) {
      if (lines[i].id === id) { lines[i].qty -= 1; break; }
    }
    write(lines.filter(function (l) { return l.qty > 0; }));
  }

  function count() {
    var n = 0;
    read().forEach(function (l) { n += l.qty; });
    return n;
  }

  function subtotal() {
    var t = 0;
    read().forEach(function (l) { t += findDish(l.id).price * l.qty; });
    return t;
  }

  function clear() { write([]); }

  function saveLast() { safeSet(LAST, read()); }
  function readLast() {
    var l = safeGet(LAST);
    return Array.isArray(l) ? l.filter(function (x) { return x && findDish(x.id); }) : [];
  }
  function restoreLast() {
    var last = readLast();
    if (last.length) write(last);
  }

  return {
    read: read, add: add, setQty: setQty, setChoice: setChoice, qtyOf: qtyOf,
    decrement: decrement, count: count, subtotal: subtotal, clear: clear,
    saveLast: saveLast, readLast: readLast, restoreLast: restoreLast
  };
})();
