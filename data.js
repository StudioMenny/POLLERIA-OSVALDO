// Unica fonte di verità per piatti e prezzi: menù, ordine e calcolatore feste leggono tutti da qui.
// Per cambiare un prezzo o una descrizione basta modificare questo file.
var POLLERIA = {
  phone: '+393665488260',
  phoneLabel: '+39 366 548 8260',
  whatsapp: '393665488260',
  email: 'studiomenny.web@gmail.com',
  address: 'Via dei Mercanti 14, Nogara (VR)',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Nogara+VR',
  deliveryFee: 1.5,
  openMin: 10 * 60,
  closeMin: 19 * 60,
  closedDay: 2 // martedì
};

var SIDES = ['Patate arrosto', 'Patatine fritte', 'Verdure grigliate'];

var CATEGORIES = [
  { id: 'pollo', label: 'Pollo' },
  { id: 'fritti', label: 'Fritti' },
  { id: 'panini', label: 'Panini' },
  { id: 'contorni', label: 'Contorni' },
  { id: 'bevande', label: 'Bevande' }
];

var MENU = [
  { id: 'pollo-intero', cats: ['pollo'], name: 'Pollo intero', note: 'con contorno a scelta', price: 13, img: 'menu-pollo-intero.jpg', featured: true,
    choice: { label: 'Contorno', options: SIDES },
    detail: 'Cotto lentamente e girato di continuo sul fuoco vivo, per una pelle croccante e una carne succosa fino all\'ultimo boccone.' },
  { id: 'mezzo-pollo', cats: ['pollo'], name: 'Mezzo pollo', note: 'con contorno a scelta', price: 7, img: 'menu-mezzo-pollo.jpg',
    choice: { label: 'Contorno', options: SIDES },
    detail: 'La stessa cottura lenta sul fuoco del pollo intero, in porzione da condividere in due o da gustare da soli.' },
  { id: 'coscia', cats: ['pollo'], name: 'Coscia di pollo', note: 'con contorno a scelta', price: 3.5, img: 'menu-coscia.jpg',
    choice: { label: 'Contorno', options: SIDES },
    detail: 'Coscia di pollo grigliata fino a una doratura intensa, succosa e saporita.' },
  { id: 'alette-piccanti', cats: ['pollo'], name: 'Alette piccanti', note: '4 pezzi', price: 4.5, img: 'menu-alette-paprika.jpg', spicy: true,
    detail: 'Alette glassate e speziate, per chi ama un piccante deciso.' },
  { id: 'straccetti', cats: ['pollo'], name: 'Straccetti di pollo', note: 'al limone o alla paprika', price: 4, img: 'menu-straccetti.jpg',
    choice: { label: 'Gusto', options: ['Al limone', 'Alla paprika'] },
    detail: 'Petto di pollo tagliato sottile e saltato in padella, con limone fresco o con paprika.' },
  { id: 'cotoletta', cats: ['pollo'], name: 'Cotoletta', note: 'con contorno a scelta', price: 6, img: 'menu-cotoletta.jpg',
    choice: { label: 'Contorno', options: SIDES },
    detail: 'Petto di pollo impanato e fritto fino a una doratura croccante.' },

  { id: 'patatine', cats: ['fritti', 'contorni'], name: 'Patatine fritte', note: '', price: 2.5, img: 'menu-patatine-fritte.jpg',
    detail: 'Fritte fino a renderle dorate: croccanti fuori, morbide dentro.' },
  { id: 'mozzarelline', cats: ['fritti'], name: 'Mozzarelline fritte', note: '8 pezzi', price: 3.5, img: 'menu-mozzarelline.jpg',
    detail: 'Bocconcini di mozzarella filante in panatura croccante, fritti al momento.' },
  { id: 'anelli', cats: ['fritti'], name: 'Anelli di cipolla', note: '', price: 3, img: 'menu-anelli-cipolla.jpg',
    detail: 'Cipolla dolce tagliata ad anelli, panata e fritta.' },
  { id: 'nuggets', cats: ['fritti'], name: 'Nuggets', note: '6 pezzi', price: 3.5, img: 'menu-nuggets.jpg',
    detail: 'Bocconcini di pollo tenero panati e fritti, i preferiti dei bambini.' },
  { id: 'alette-paprika', cats: ['fritti'], name: 'Alette fritte alla paprika', note: '4 pezzi', price: 4.5, img: 'menu-alette-piccanti.jpg',
    detail: 'Alette di pollo in panatura croccante insaporita con paprika dolce.' },

  { id: 'apollo', cats: ['panini'], name: 'Apollo', note: 'panino', price: 8, img: 'menu-panino-apollo.jpg',
    short: 'Pollo sfilacciato, rucola e salsa al pomodoro leggermente piccante, in ciabatta.',
    detail: 'Pollo sfilacciato e rucola fresca con una salsa al pomodoro leggermente piccante, dentro una ciabatta croccante.' },
  { id: 'american', cats: ['panini'], name: 'American', note: 'panino', price: 8, img: 'menu-panino-american.jpg',
    short: 'Cotoletta di pollo, lattuga, pomodoro e salsa cremosa, in baguette.',
    detail: 'Cotoletta di pollo croccante, lattuga, pomodoro e salsa cremosa in una baguette morbida.' },

  { id: 'patate-arrosto', cats: ['contorni'], name: 'Patate arrosto', note: '', price: 2.5, img: 'menu-patate-arrosto.jpg',
    detail: 'Patate al forno con rosmarino ed erbe aromatiche.' },
  { id: 'verdure', cats: ['contorni'], name: 'Verdure grigliate', note: 'a scelta', price: 2, img: 'menu-verdure.jpg',
    detail: 'Verdure di stagione grigliate alla piastra.' },

  { id: 'acqua', cats: ['bevande'], name: 'Acqua naturale', note: '0,5 l', price: 1, img: 'menu-acqua.jpg', fit: 'contain',
    detail: 'Acqua naturale in bottiglia da mezzo litro.' },
  { id: 'bibita', cats: ['bevande'], name: 'Bibita', note: 'in lattina', price: 2.5, img: 'menu-bibita-lattina.jpg', fit: 'contain',
    detail: 'Bibita gassata in lattina, servita fredda.' },
  { id: 'birra33', cats: ['bevande'], name: 'Birra', note: '33 cl', price: 3, img: 'menu-birra-33.jpg', fit: 'contain',
    detail: 'Birra chiara in bottiglia da 33 cl.' },
  { id: 'birra66', cats: ['bevande'], name: 'Birra', note: '66 cl', price: 5, img: 'menu-birra-66.jpg', fit: 'contain',
    detail: 'Birra chiara in bottiglia da 66 cl, da dividere in due.' }
];

function findDish(id) {
  for (var i = 0; i < MENU.length; i++) { if (MENU[i].id === id) return MENU[i]; }
  return null;
}

function euro(n) {
  return n.toFixed(2).replace('.', ',') + ' €';
}
