(function () {
  // Tabella orari con il giorno di oggi evidenziato
  var table = document.getElementById('hours-table');
  if (table) {
    var order = [1, 2, 3, 4, 5, 6, 0];
    var today = new Date().getDay();
    table.innerHTML = order.map(function (d) {
      var name = PolleriaHours.DAYS[d];
      name = name.charAt(0).toUpperCase() + name.slice(1);
      var closed = d === POLLERIA.closedDay;
      return '<tr' + (d === today ? ' class="is-today"' : '') + '><th scope="row">' + name +
        (d === today ? ' <span>oggi</span>' : '') + '</th><td>' + (closed ? 'Chiuso' : '10:00 – 19:00') + '</td></tr>';
    }).join('');
  }

  // Salva il contatto in rubrica (file .vcf)
  var vcardBtn = document.getElementById('save-contact');
  if (vcardBtn) {
    vcardBtn.addEventListener('click', function () {
      var site = location.href.replace(/[^/]*$/, '');
      var vcf = [
        'BEGIN:VCARD', 'VERSION:3.0',
        'FN:La Polleria',
        'ORG:La Polleria di Pelizza Lalla & C. snc',
        'TEL;TYPE=WORK,VOICE:' + POLLERIA.phone,
        'EMAIL;TYPE=WORK:' + POLLERIA.email,
        'ADR;TYPE=WORK:;;Via Palmino Sterzi 41;Nogara;VR;;Italia',
        'URL:' + site,
        'NOTE:Aperto tutti i giorni 10-19, chiuso il martedì',
        'END:VCARD'
      ].join('\r\n');
      var blob = new Blob([vcf], { type: 'text/vcard' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'la-polleria.vcf';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      polleriaToast('Contatto scaricato: aprilo per salvarlo in rubrica');
    });
  }

  // Copia l'indirizzo
  var copyBtn = document.getElementById('copy-address');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var text = POLLERIA.address;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function () { polleriaToast('Indirizzo copiato'); });
      } else {
        polleriaToast(text);
      }
    });
  }
})();
