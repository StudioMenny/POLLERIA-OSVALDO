(function () {
  var root = document.getElementById('party');
  if (!root) return;

  var state = { adults: 6, kids: 2, appetite: 'normale', fritti: true, drinks: false };
  var APPETITE = { leggero: 0.25, normale: 0.34, tanta: 0.5 }; // polli a testa (adulti)
  var KID = 0.17;
  var plan = [];

  var CHICKEN = '<svg viewBox="0 0 64 44" aria-hidden="true"><path class="l" d="M44 17C50 12 54 9 57 9"/><path class="l" d="M44 31C50 35 54 37 57 37"/><circle class="k" cx="58.5" cy="8.5" r="3"/><circle class="k" cx="58.5" cy="37.5" r="3"/><ellipse class="b" cx="27" cy="24" rx="22" ry="15"/><path class="h" d="M13 21c4-5 12-7 20-5"/></svg>';

  function compute() {
    var people = state.adults + state.kids;
    var polli = state.adults * APPETITE[state.appetite] + state.kids * KID;
    var halves = people > 0 ? Math.max(1, Math.ceil(polli * 2)) : 0;
    var interi = Math.floor(halves / 2);
    var mezzi = halves % 2;

    plan = [];
    if (interi) plan.push({ id: 'pollo-intero', qty: interi, why: 'ognuno con il suo contorno' });
    if (mezzi) plan.push({ id: 'mezzo-pollo', qty: mezzi, why: 'per arrotondare senza sprechi' });

    // Ogni pollo ha già un contorno: ne aggiungiamo altri se siete in tanti
    var contorniInclusi = interi + mezzi;
    var extraPatate = Math.max(0, Math.ceil(people / 3) - contorniInclusi);
    if (extraPatate) plan.push({ id: 'patate-arrosto', qty: extraPatate, why: 'contorno in più da condividere' });

    if (state.fritti && people > 0) {
      if (state.kids > 0) plan.push({ id: 'nuggets', qty: Math.ceil(state.kids / 2), why: 'per i bambini' });
      var share = Math.ceil(state.adults / 4);
      if (share) plan.push({ id: 'mozzarelline', qty: share, why: 'da mettere al centro' });
      if (state.adults >= 6) plan.push({ id: 'anelli', qty: Math.ceil(state.adults / 6), why: 'da mettere al centro' });
    }

    if (state.drinks && people > 0) {
      var acqua = Math.ceil(people / 2);
      plan.push({ id: 'acqua', qty: acqua, why: 'mezzo litro ogni due persone' });
      if (state.kids) plan.push({ id: 'bibita', qty: state.kids, why: 'una per bambino' });
    }

    render(people, interi, mezzi);
  }

  function render(people, interi, mezzi) {
    // Fila di polli: la parte "wow" visiva del calcolatore
    var icons = '';
    for (var i = 0; i < interi && i < 24; i++) icons += '<span class="bird">' + CHICKEN + '</span>';
    if (mezzi) icons += '<span class="bird bird--half">' + CHICKEN + '</span>';
    if (interi > 24) icons += '<span class="bird-more">+' + (interi - 24) + '</span>';
    document.getElementById('party-birds').innerHTML = icons;

    var headline = people === 0
      ? 'Aggiungi almeno una persona'
      : (interi ? interi + (interi === 1 ? ' pollo intero' : ' polli interi') : '') +
        (interi && mezzi ? ' e ' : '') +
        (mezzi ? 'mezzo pollo' : '');
    document.getElementById('party-headline').textContent = headline;
    document.getElementById('party-people').textContent = people === 1 ? 'per 1 persona' : 'per ' + people + ' persone';

    var total = 0;
    document.getElementById('party-list').innerHTML = plan.map(function (p) {
      var d = findDish(p.id);
      total += d.price * p.qty;
      return '<li><span class="pl-qty">' + p.qty + '×</span><span class="pl-name">' + d.name + (d.note && !d.choice ? ' <em>' + d.note + '</em>' : '') +
        '<small>' + p.why + '</small></span><span class="pl-price">' + euro(d.price * p.qty) + '</span></li>';
    }).join('');
    document.getElementById('party-total').textContent = euro(total);
    document.getElementById('party-add').disabled = plan.length === 0;
    document.getElementById('party-perhead').textContent = people ? 'circa ' + euro(total / people) + ' a persona' : '';
  }

  // Contatori adulti / bambini
  root.querySelectorAll('[data-step]').forEach(function (b) {
    b.addEventListener('click', function () {
      var key = b.getAttribute('data-step');
      var delta = Number(b.getAttribute('data-delta'));
      var max = key === 'adults' ? 80 : 40;
      state[key] = Math.max(0, Math.min(max, state[key] + delta));
      document.querySelector('[data-value="' + key + '"]').textContent = state[key];
      compute();
    });
  });

  root.querySelectorAll('[data-appetite]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.appetite = b.getAttribute('data-appetite');
      root.querySelectorAll('[data-appetite]').forEach(function (x) {
        x.classList.toggle('is-active', x === b);
        x.setAttribute('aria-pressed', String(x === b));
      });
      compute();
    });
  });

  document.getElementById('opt-fritti').addEventListener('change', function (e) { state.fritti = e.target.checked; compute(); });
  document.getElementById('opt-drinks').addEventListener('change', function (e) { state.drinks = e.target.checked; compute(); });

  document.getElementById('party-add').addEventListener('click', function () {
    plan.forEach(function (p) { PolleriaCart.add(p.id, p.qty); });
    polleriaToast('Aggiunto tutto all\'ordine');
    document.getElementById('party-next').hidden = false;
  });

  compute();
})();
