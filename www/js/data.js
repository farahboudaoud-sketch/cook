/* Carnet de cuisine – données : rayons, ingrédients, recettes.
 * Unités de recette : g, ml, pc (pièce), cs (cuillère à soupe), cc (cuillère à café), pincee.
 * Prix indicatifs : €/kg (u:'kg'), €/L (u:'L') ou €/pièce (u:'pc').
 */
'use strict';

const AISLES = [
  { id: 'fl', name: 'Fruits et légumes' },
  { id: 'bp', name: 'Boucherie et poissonnerie' },
  { id: 'cr', name: 'Crèmerie et frais' },
  { id: 'bo', name: 'Boulangerie' },
  { id: 'ep', name: 'Épicerie salée' },
  { id: 'es', name: 'Épices et condiments' },
  { id: 'su', name: 'Épicerie sucrée' },
  { id: 'sg', name: 'Surgelés' },
  { id: 'bs', name: 'Boissons' },
  { id: 'au', name: 'Autres' }
];

/* Étiquettes utilisées pour les allergies et régimes */
const ALLERGENS = [
  { id: 'gluten', name: 'Gluten' },
  { id: 'lait', name: 'Lait / lactose' },
  { id: 'oeuf', name: 'Œufs' },
  { id: 'arachide', name: 'Arachide' },
  { id: 'fruits_coque', name: 'Fruits à coque' },
  { id: 'poisson', name: 'Poisson' },
  { id: 'crustaces', name: 'Crustacés et fruits de mer' },
  { id: 'soja', name: 'Soja' },
  { id: 'sesame', name: 'Sésame' },
  { id: 'celeri', name: 'Céleri' },
  { id: 'moutarde', name: 'Moutarde' }
];

const DIETS = [
  { id: 'aucun', name: 'Aucun régime particulier', excl: [] },
  { id: 'vegetarien', name: 'Végétarien', excl: ['viande', 'poisson', 'crustaces'] },
  { id: 'vegan', name: 'Vegan', excl: ['viande', 'poisson', 'crustaces', 'lait', 'oeuf', 'miel'] },
  { id: 'sans_porc', name: 'Sans porc', excl: ['porc'] },
  { id: 'halal', name: 'Halal (sans porc ni alcool)', excl: ['porc', 'alcool'] },
  { id: 'sans_gluten', name: 'Sans gluten', excl: ['gluten'] }
];

const EQUIPMENT = [
  { id: 'plaques', name: 'Plaques de cuisson' },
  { id: 'four', name: 'Four' },
  { id: 'micro', name: 'Micro-ondes' },
  { id: 'mixeur', name: 'Mixeur / blender' },
  { id: 'airfryer', name: 'Airfryer' }
];

const TYPES = [
  { id: 'brunch', name: 'Petit-déjeuner' },
  { id: 'salade', name: 'Entrées et salades' },
  { id: 'soupe', name: 'Soupes' },
  { id: 'plat', name: 'Plats' },
  { id: 'dessert', name: 'Desserts' }
];

const SEASONS = { pr: 'Printemps', et: 'Été', au: 'Automne', hi: 'Hiver' };

/* n: nom, a: rayon, u: unité de prix, p: prix, t: étiquettes, l: [singulier, pluriel] pour les pièces, pantry: placard par défaut */
const INGREDIENTS = {
  // Fruits et légumes
  oignon: { n: 'Oignon', a: 'fl', u: 'pc', p: 0.25, l: ['oignon', 'oignons'] },
  oignon_rouge: { n: 'Oignon rouge', a: 'fl', u: 'pc', p: 0.4, l: ['oignon rouge', 'oignons rouges'] },
  echalote: { n: 'Échalote', a: 'fl', u: 'pc', p: 0.3, l: ['échalote', 'échalotes'] },
  ail: { n: 'Ail', a: 'fl', u: 'pc', p: 0.15, l: ['gousse', 'gousses'] },
  gingembre: { n: 'Gingembre frais', a: 'fl', u: 'kg', p: 10 },
  carotte: { n: 'Carotte', a: 'fl', u: 'pc', p: 0.2, l: ['carotte', 'carottes'] },
  pdt: { n: 'Pommes de terre', a: 'fl', u: 'kg', p: 1.6 },
  patate_douce: { n: 'Patate douce', a: 'fl', u: 'kg', p: 3 },
  poireau: { n: 'Poireau', a: 'fl', u: 'pc', p: 0.8, l: ['poireau', 'poireaux'] },
  butternut: { n: 'Courge butternut', a: 'fl', u: 'kg', p: 2.5 },
  potiron: { n: 'Potiron', a: 'fl', u: 'kg', p: 2.5 },
  courgette: { n: 'Courgette', a: 'fl', u: 'pc', p: 0.8, l: ['courgette', 'courgettes'] },
  aubergine: { n: 'Aubergine', a: 'fl', u: 'pc', p: 1.2, l: ['aubergine', 'aubergines'] },
  poivron: { n: 'Poivron', a: 'fl', u: 'pc', p: 1, l: ['poivron', 'poivrons'] },
  tomate: { n: 'Tomate', a: 'fl', u: 'pc', p: 0.5, l: ['tomate', 'tomates'] },
  tomates_cerises: { n: 'Tomates cerises', a: 'fl', u: 'kg', p: 7 },
  concombre: { n: 'Concombre', a: 'fl', u: 'pc', p: 0.9, l: ['concombre', 'concombres'] },
  champignons: { n: 'Champignons de Paris', a: 'fl', u: 'kg', p: 5 },
  brocoli: { n: 'Brocoli', a: 'fl', u: 'pc', p: 1.8, l: ['tête', 'têtes'] },
  epinards_frais: { n: 'Pousses d’épinards', a: 'fl', u: 'kg', p: 9 },
  salade: { n: 'Salade', a: 'fl', u: 'pc', p: 1.2, l: ['salade', 'salades'] },
  endive: { n: 'Endive', a: 'fl', u: 'pc', p: 0.4, l: ['endive', 'endives'] },
  navet: { n: 'Navet', a: 'fl', u: 'pc', p: 0.5, l: ['navet', 'navets'] },
  celeri: { n: 'Céleri branche', a: 'fl', u: 'pc', p: 0.3, t: ['celeri'], l: ['branche', 'branches'] },
  haricots_verts: { n: 'Haricots verts', a: 'fl', u: 'kg', p: 6 },
  avocat: { n: 'Avocat', a: 'fl', u: 'pc', p: 1.2, l: ['avocat', 'avocats'] },
  citron: { n: 'Citron', a: 'fl', u: 'pc', p: 0.5, l: ['citron', 'citrons'] },
  citron_vert: { n: 'Citron vert', a: 'fl', u: 'pc', p: 0.45, l: ['citron vert', 'citrons verts'] },
  pomme: { n: 'Pomme', a: 'fl', u: 'pc', p: 0.4, l: ['pomme', 'pommes'] },
  poire: { n: 'Poire', a: 'fl', u: 'pc', p: 0.5, l: ['poire', 'poires'] },
  banane: { n: 'Banane', a: 'fl', u: 'pc', p: 0.3, l: ['banane', 'bananes'] },
  mangue: { n: 'Mangue', a: 'fl', u: 'pc', p: 1.8, l: ['mangue', 'mangues'] },
  fruits_rouges: { n: 'Fruits rouges', a: 'fl', u: 'kg', p: 12 },
  persil: { n: 'Persil', a: 'fl', u: 'pc', p: 1, l: ['botte', 'bottes'] },
  coriandre: { n: 'Coriandre', a: 'fl', u: 'pc', p: 1, l: ['botte', 'bottes'] },
  menthe: { n: 'Menthe', a: 'fl', u: 'pc', p: 1.2, l: ['botte', 'bottes'] },
  ciboulette: { n: 'Ciboulette', a: 'fl', u: 'pc', p: 1, l: ['botte', 'bottes'] },
  basilic: { n: 'Basilic', a: 'fl', u: 'pc', p: 1.2, l: ['pot', 'pots'] },
  pousses_mungo: { n: 'Pousses de haricot mungo', a: 'fl', u: 'kg', p: 8 },
  oignon_nouveau: { n: 'Oignon nouveau', a: 'fl', u: 'pc', p: 0.3, l: ['oignon nouveau', 'oignons nouveaux'] },

  // Boucherie et poissonnerie
  boeuf_hache: { n: 'Bœuf haché', a: 'bp', u: 'kg', p: 13, t: ['viande'] },
  steak_hache: { n: 'Steak haché', a: 'bp', u: 'pc', p: 1.5, t: ['viande'], l: ['steak', 'steaks'] },
  boeuf_bourguignon: { n: 'Bœuf à braiser', a: 'bp', u: 'kg', p: 15, t: ['viande'] },
  veau: { n: 'Veau pour blanquette', a: 'bp', u: 'kg', p: 18, t: ['viande'] },
  blanc_poulet: { n: 'Blancs de poulet', a: 'bp', u: 'kg', p: 12, t: ['viande'] },
  cuisses_poulet: { n: 'Cuisses de poulet', a: 'bp', u: 'pc', p: 1.5, t: ['viande'], l: ['cuisse', 'cuisses'] },
  echine_porc: { n: 'Échine de porc', a: 'bp', u: 'kg', p: 9, t: ['viande', 'porc'] },
  lardons: { n: 'Lardons', a: 'bp', u: 'kg', p: 12, t: ['viande', 'porc'] },
  jambon: { n: 'Jambon blanc', a: 'bp', u: 'pc', p: 0.6, t: ['viande', 'porc'], l: ['tranche', 'tranches'] },
  saumon: { n: 'Pavés de saumon', a: 'bp', u: 'pc', p: 3, t: ['poisson'], l: ['pavé', 'pavés'] },
  cabillaud: { n: 'Dos de cabillaud', a: 'bp', u: 'kg', p: 22, t: ['poisson'] },
  crevettes: { n: 'Crevettes décortiquées', a: 'bp', u: 'kg', p: 22, t: ['crustaces'] },
  moules: { n: 'Moules', a: 'bp', u: 'kg', p: 5, t: ['crustaces'] },
  saumon_fume: { n: 'Saumon fumé', a: 'bp', u: 'kg', p: 35, t: ['poisson'] },

  // Crèmerie et frais
  creme: { n: 'Crème fraîche', a: 'cr', u: 'L', p: 4, t: ['lait'] },
  lait: { n: 'Lait', a: 'cr', u: 'L', p: 1.1, t: ['lait'] },
  beurre: { n: 'Beurre', a: 'cr', u: 'kg', p: 10, t: ['lait'] },
  oeufs: { n: 'Œufs', a: 'cr', u: 'pc', p: 0.3, t: ['oeuf'], l: ['œuf', 'œufs'] },
  gruyere: { n: 'Gruyère râpé', a: 'cr', u: 'kg', p: 14, t: ['lait'] },
  parmesan: { n: 'Parmesan', a: 'cr', u: 'kg', p: 25, t: ['lait'] },
  mozzarella: { n: 'Mozzarella', a: 'cr', u: 'kg', p: 10, t: ['lait'] },
  chevre: { n: 'Bûche de chèvre', a: 'cr', u: 'kg', p: 14, t: ['lait'] },
  feta: { n: 'Feta', a: 'cr', u: 'kg', p: 12, t: ['lait'] },
  ricotta: { n: 'Ricotta', a: 'cr', u: 'kg', p: 10, t: ['lait'] },
  reblochon: { n: 'Reblochon', a: 'cr', u: 'pc', p: 6, t: ['lait'], l: ['reblochon', 'reblochons'] },
  cheddar: { n: 'Cheddar en tranches', a: 'cr', u: 'pc', p: 0.3, t: ['lait'], l: ['tranche', 'tranches'] },
  yaourt: { n: 'Yaourt nature', a: 'cr', u: 'pc', p: 0.3, t: ['lait'], l: ['pot', 'pots'] },
  tofu: { n: 'Tofu ferme', a: 'cr', u: 'kg', p: 8, t: ['soja'] },
  pate_brisee: { n: 'Pâte brisée', a: 'cr', u: 'pc', p: 1.2, t: ['gluten', 'lait'], l: ['rouleau', 'rouleaux'] },
  pate_pizza: { n: 'Pâte à pizza', a: 'cr', u: 'pc', p: 1.5, t: ['gluten'], l: ['rouleau', 'rouleaux'] },
  gnocchis: { n: 'Gnocchis', a: 'cr', u: 'kg', p: 4, t: ['gluten'] },
  pesto: { n: 'Pesto au basilic', a: 'cr', u: 'kg', p: 18, t: ['lait', 'fruits_coque'] },
  tortillas: { n: 'Tortillas de blé', a: 'cr', u: 'pc', p: 0.25, t: ['gluten'], l: ['tortilla', 'tortillas'] },
  mayonnaise: { n: 'Mayonnaise', a: 'es', u: 'kg', p: 6, t: ['oeuf', 'moutarde'] },
  houmous: { n: 'Houmous', a: 'cr', u: 'kg', p: 10, t: ['sesame'] },
  fromage_frais: { n: 'Fromage frais (type Saint Môret)', a: 'cr', u: 'kg', p: 9, t: ['lait'] },

  // Boulangerie
  baguette: { n: 'Baguette', a: 'bo', u: 'pc', p: 1, t: ['gluten'], l: ['baguette', 'baguettes'] },
  pain_mie: { n: 'Pain de mie', a: 'bo', u: 'pc', p: 0.15, t: ['gluten'], l: ['tranche', 'tranches'] },
  pain_burger: { n: 'Pains à burger', a: 'bo', u: 'pc', p: 0.5, t: ['gluten', 'sesame'], l: ['pain', 'pains'] },

  // Épicerie salée
  riz: { n: 'Riz basmati', a: 'ep', u: 'kg', p: 2.5 },
  riz_arborio: { n: 'Riz arborio', a: 'ep', u: 'kg', p: 4 },
  spaghetti: { n: 'Spaghetti', a: 'ep', u: 'kg', p: 1.6, t: ['gluten'] },
  pates: { n: 'Pâtes courtes', a: 'ep', u: 'kg', p: 1.6, t: ['gluten'] },
  tagliatelles: { n: 'Tagliatelles', a: 'ep', u: 'kg', p: 3, t: ['gluten', 'oeuf'] },
  coquillettes: { n: 'Coquillettes', a: 'ep', u: 'kg', p: 1.6, t: ['gluten'] },
  petites_pates: { n: 'Petites pâtes à soupe', a: 'ep', u: 'kg', p: 2, t: ['gluten'] },
  lasagnes: { n: 'Feuilles de lasagne', a: 'ep', u: 'kg', p: 3.5, t: ['gluten'] },
  nouilles: { n: 'Nouilles aux œufs', a: 'ep', u: 'kg', p: 4, t: ['gluten', 'oeuf'] },
  nouilles_riz: { n: 'Nouilles de riz', a: 'ep', u: 'kg', p: 5 },
  semoule: { n: 'Semoule', a: 'ep', u: 'kg', p: 2, t: ['gluten'] },
  boulgour: { n: 'Boulgour', a: 'ep', u: 'kg', p: 3, t: ['gluten'] },
  quinoa: { n: 'Quinoa', a: 'ep', u: 'kg', p: 7 },
  lentilles_corail: { n: 'Lentilles corail', a: 'ep', u: 'kg', p: 4 },
  lentilles_vertes: { n: 'Lentilles vertes', a: 'ep', u: 'kg', p: 4 },
  pois_chiches: { n: 'Pois chiches cuits', a: 'ep', u: 'kg', p: 3 },
  haricots_rouges: { n: 'Haricots rouges cuits', a: 'ep', u: 'kg', p: 3 },
  haricots_blancs: { n: 'Haricots blancs cuits', a: 'ep', u: 'kg', p: 3 },
  mais: { n: 'Maïs doux', a: 'ep', u: 'kg', p: 4 },
  thon: { n: 'Thon au naturel', a: 'ep', u: 'kg', p: 15, t: ['poisson'] },
  olives: { n: 'Olives', a: 'ep', u: 'kg', p: 12 },
  cornichons: { n: 'Cornichons', a: 'ep', u: 'kg', p: 8 },
  tomates_concassees: { n: 'Tomates concassées', a: 'ep', u: 'kg', p: 2.2 },
  coulis_tomate: { n: 'Coulis de tomate', a: 'ep', u: 'kg', p: 3 },
  concentre_tomate: { n: 'Concentré de tomate', a: 'ep', u: 'kg', p: 8 },
  lait_coco: { n: 'Lait de coco', a: 'ep', u: 'L', p: 4.5 },
  bouillon: { n: 'Bouillon de légumes', a: 'ep', u: 'pc', p: 0.15, t: ['celeri'], l: ['cube', 'cubes'] },
  cacahuetes: { n: 'Cacahuètes', a: 'ep', u: 'kg', p: 10, t: ['arachide'] },

  // Épices et condiments
  sauce_soja: { n: 'Sauce soja', a: 'es', u: 'L', p: 6, t: ['soja', 'gluten'] },
  huile_olive: { n: 'Huile d’olive', a: 'es', u: 'L', p: 9, pantry: true },
  huile: { n: 'Huile neutre', a: 'es', u: 'L', p: 3, pantry: true },
  vinaigre: { n: 'Vinaigre', a: 'es', u: 'L', p: 3, pantry: true },
  moutarde: { n: 'Moutarde', a: 'es', u: 'kg', p: 6, t: ['moutarde'], pantry: true },
  sel: { n: 'Sel', a: 'es', u: 'kg', p: 1, pantry: true },
  poivre: { n: 'Poivre', a: 'es', u: 'kg', p: 30, pantry: true },
  muscade: { n: 'Noix de muscade', a: 'es', u: 'kg', p: 40, pantry: true },
  herbes_provence: { n: 'Herbes de Provence', a: 'es', u: 'kg', p: 40, pantry: true },
  thym: { n: 'Thym', a: 'es', u: 'kg', p: 40, pantry: true },
  sauge: { n: 'Sauge fraîche', a: 'fl', u: 'pc', p: 1.2, l: ['botte', 'bottes'] },
  laurier: { n: 'Laurier', a: 'es', u: 'pc', p: 0.05, pantry: true, l: ['feuille', 'feuilles'] },
  cumin: { n: 'Cumin', a: 'es', u: 'kg', p: 40 },
  curry: { n: 'Curry en poudre', a: 'es', u: 'kg', p: 40 },
  curcuma: { n: 'Curcuma', a: 'es', u: 'kg', p: 40 },
  paprika: { n: 'Paprika', a: 'es', u: 'kg', p: 40 },
  piment: { n: 'Piment en poudre', a: 'es', u: 'kg', p: 40 },
  ras_el_hanout: { n: 'Ras el hanout', a: 'es', u: 'kg', p: 40 },
  cannelle: { n: 'Cannelle', a: 'es', u: 'kg', p: 40 },
  graines_sesame: { n: 'Graines de sésame', a: 'es', u: 'kg', p: 12, t: ['sesame'] },

  // Épicerie sucrée
  farine: { n: 'Farine', a: 'su', u: 'kg', p: 1, t: ['gluten'], pantry: true },
  farine_sarrasin: { n: 'Farine de sarrasin', a: 'su', u: 'kg', p: 4 },
  sucre: { n: 'Sucre', a: 'su', u: 'kg', p: 1.2, pantry: true },
  sucre_vanille: { n: 'Sucre vanillé', a: 'su', u: 'pc', p: 0.15, l: ['sachet', 'sachets'] },
  levure: { n: 'Levure chimique', a: 'su', u: 'pc', p: 0.2, l: ['sachet', 'sachets'] },
  chocolat_noir: { n: 'Chocolat noir', a: 'su', u: 'kg', p: 12 },
  flocons_avoine: { n: 'Flocons d’avoine', a: 'su', u: 'kg', p: 3, t: ['gluten'] },
  miel: { n: 'Miel', a: 'su', u: 'kg', p: 12, t: ['miel'] },
  amandes_poudre: { n: 'Poudre d’amande', a: 'su', u: 'kg', p: 16, t: ['fruits_coque'] },

  // Surgelés
  epinards_surgeles: { n: 'Épinards hachés surgelés', a: 'sg', u: 'kg', p: 3 },
  edamame: { n: 'Edamame', a: 'sg', u: 'kg', p: 9, t: ['soja'] },
  petits_pois: { n: 'Petits pois surgelés', a: 'sg', u: 'kg', p: 3 },

  // Boissons
  vin_blanc: { n: 'Vin blanc sec', a: 'bs', u: 'L', p: 6, t: ['alcool'] },
  vin_rouge: { n: 'Vin rouge', a: 'bs', u: 'L', p: 6, t: ['alcool'] }
};

/* Recettes : p = portions de base ; d = difficulté 1 facile, 2 moyen, 3 difficile ;
 * s = saisons (vide = toute l'année) ; eq = équipement nécessaire ; i = [clé, quantité, unité] */
const RECIPES = [
  { id: 'curry_pois_chiches', n: 'Curry de pois chiches au lait de coco', e: '🍛', type: 'plat', t: 35, d: 1, s: [], eq: ['plaques'], p: 4,
    i: [['pois_chiches', 500, 'g'], ['lait_coco', 400, 'ml'], ['tomates_concassees', 400, 'g'], ['oignon', 1, 'pc'], ['ail', 2, 'pc'], ['gingembre', 20, 'g'], ['curry', 2, 'cs'], ['epinards_frais', 150, 'g'], ['riz', 300, 'g'], ['huile', 2, 'cs'], ['sel', 1, 'cc']],
    st: ['Faire cuire le riz selon les indications du paquet.', 'Émincer l’oignon, hacher l’ail et râper le gingembre. Les faire revenir 5 min dans l’huile.', 'Ajouter le curry, mélanger 1 min, puis verser les tomates et le lait de coco.', 'Ajouter les pois chiches égouttés, saler et laisser mijoter 15 min.', 'Incorporer les épinards en fin de cuisson et servir avec le riz.'] },

  { id: 'gratin_butternut', n: 'Gratin de courge butternut', e: '🎃', type: 'plat', t: 60, d: 1, s: ['au', 'hi'], eq: ['four'], p: 4,
    i: [['butternut', 1200, 'g'], ['creme', 200, 'ml'], ['gruyere', 100, 'g'], ['ail', 1, 'pc'], ['beurre', 15, 'g'], ['muscade', 1, 'pincee'], ['sel', 1, 'cc'], ['poivre', 1, 'pincee'], ['salade', 1, 'pc']],
    st: ['Préchauffer le four à 200 °C.', 'Éplucher la courge et la couper en fines tranches.', 'Beurrer un plat frotté à l’ail et y disposer la courge en couches.', 'Mélanger la crème, le sel, le poivre et la muscade, puis napper la courge.', 'Parsemer de gruyère et enfourner 40 min. Servir avec la salade.'] },

  { id: 'poulet_citron', n: 'Poulet rôti au citron et pommes de terre', e: '🍗', type: 'plat', t: 60, d: 1, s: [], eq: ['four'], p: 4,
    i: [['cuisses_poulet', 4, 'pc'], ['pdt', 800, 'g'], ['citron', 2, 'pc'], ['ail', 4, 'pc'], ['thym', 1, 'cc'], ['huile_olive', 3, 'cs'], ['sel', 1, 'cc'], ['poivre', 1, 'pincee']],
    st: ['Préchauffer le four à 200 °C.', 'Couper les pommes de terre en quartiers et les citrons en rondelles.', 'Mettre le tout dans un plat avec les cuisses de poulet et les gousses d’ail entières.', 'Arroser d’huile, saler, poivrer, parsemer de thym.', 'Enfourner 45 min en retournant le poulet à mi-cuisson.'] },

  { id: 'risotto_champignons', n: 'Risotto aux champignons', e: '🍄', type: 'plat', t: 40, d: 2, s: ['au'], eq: ['plaques'], p: 4,
    i: [['riz_arborio', 320, 'g'], ['champignons', 400, 'g'], ['oignon', 1, 'pc'], ['bouillon', 2, 'pc'], ['vin_blanc', 100, 'ml'], ['parmesan', 80, 'g'], ['beurre', 30, 'g'], ['huile_olive', 2, 'cs']],
    st: ['Préparer 1 L de bouillon chaud avec les cubes.', 'Faire revenir l’oignon émincé dans l’huile, ajouter le riz et le nacrer 2 min.', 'Déglacer au vin blanc, puis ajouter le bouillon louche par louche en remuant (environ 18 min).', 'Pendant ce temps, poêler les champignons émincés dans un peu de beurre.', 'Hors du feu, ajouter les champignons, le reste du beurre et le parmesan.'] },

  { id: 'soupe_poireaux', n: 'Soupe poireaux pommes de terre', e: '🥣', type: 'soupe', t: 40, d: 1, s: ['au', 'hi'], eq: ['plaques', 'mixeur'], p: 4,
    i: [['poireau', 3, 'pc'], ['pdt', 500, 'g'], ['oignon', 1, 'pc'], ['bouillon', 1, 'pc'], ['creme', 100, 'ml'], ['beurre', 20, 'g'], ['sel', 1, 'cc'], ['baguette', 1, 'pc']],
    st: ['Laver et émincer les poireaux, éplucher et couper les pommes de terre en dés.', 'Faire fondre les poireaux et l’oignon dans le beurre 5 min.', 'Ajouter les pommes de terre, le cube et 1,2 L d’eau. Cuire 25 min.', 'Mixer, ajouter la crème, rectifier l’assaisonnement. Servir avec du pain.'] },

  { id: 'bolognaise', n: 'Spaghetti à la bolognaise', e: '🍝', type: 'plat', t: 45, d: 1, s: [], eq: ['plaques'], p: 4,
    i: [['spaghetti', 400, 'g'], ['boeuf_hache', 500, 'g'], ['tomates_concassees', 800, 'g'], ['oignon', 1, 'pc'], ['carotte', 1, 'pc'], ['ail', 2, 'pc'], ['concentre_tomate', 2, 'cs'], ['herbes_provence', 1, 'cs'], ['huile_olive', 2, 'cs'], ['parmesan', 50, 'g']],
    st: ['Hacher finement l’oignon, la carotte et l’ail, les faire revenir dans l’huile.', 'Ajouter le bœuf et le faire dorer en l’émiettant.', 'Ajouter le concentré, les tomates et les herbes. Laisser mijoter 25 min.', 'Cuire les spaghetti, égoutter et servir avec la sauce et le parmesan.'] },

  { id: 'chili_con_carne', n: 'Chili con carne', e: '🌶️', type: 'plat', t: 50, d: 1, s: ['au', 'hi'], eq: ['plaques'], p: 4,
    i: [['boeuf_hache', 500, 'g'], ['haricots_rouges', 500, 'g'], ['tomates_concassees', 400, 'g'], ['poivron', 1, 'pc'], ['oignon', 1, 'pc'], ['ail', 2, 'pc'], ['cumin', 1, 'cc'], ['piment', 0.5, 'cc'], ['riz', 300, 'g'], ['huile', 2, 'cs']],
    st: ['Faire revenir l’oignon, l’ail et le poivron coupés dans l’huile.', 'Ajouter la viande et les épices, cuire 5 min.', 'Ajouter les tomates et les haricots égouttés, laisser mijoter 30 min.', 'Servir avec le riz cuit.'] },


  { id: 'quiche_lorraine', n: 'Quiche lorraine', e: '🥧', type: 'plat', t: 50, d: 1, s: [], eq: ['four'], p: 4,
    i: [['pate_brisee', 1, 'pc'], ['lardons', 200, 'g'], ['oeufs', 3, 'pc'], ['creme', 200, 'ml'], ['lait', 100, 'ml'], ['gruyere', 80, 'g'], ['muscade', 1, 'pincee'], ['salade', 1, 'pc']],
    st: ['Préchauffer le four à 180 °C et étaler la pâte dans un moule.', 'Faire dorer les lardons à sec dans une poêle.', 'Battre les œufs avec la crème, le lait, la muscade et le gruyère.', 'Répartir les lardons sur la pâte, verser l’appareil.', 'Cuire 35 min. Servir avec la salade.'] },

  { id: 'quiche_poireaux_chevre', n: 'Quiche aux poireaux', e: '🥧', type: 'plat', t: 55, d: 1, s: ['au', 'hi', 'pr'], eq: ['four', 'plaques'], p: 4,
    i: [['pate_brisee', 1, 'pc'], ['poireau', 3, 'pc'], ['gruyere', 100, 'g'], ['oeufs', 3, 'pc'], ['creme', 200, 'ml'], ['lait', 100, 'ml'], ['beurre', 20, 'g'], ['muscade', 1, 'pincee'], ['sel', 1, 'cc'], ['poivre', 1, 'pincee']],
    st: [] },

  { id: 'saumon_brocoli', n: 'Saumon au four, riz et brocoli', e: '🐟', type: 'plat', t: 30, d: 1, s: [], eq: ['four', 'plaques'], p: 4,
    i: [['saumon', 4, 'pc'], ['brocoli', 1, 'pc'], ['riz', 300, 'g'], ['citron', 1, 'pc'], ['huile_olive', 2, 'cs'], ['sel', 1, 'cc'], ['poivre', 1, 'pincee']],
    st: ['Préchauffer le four à 200 °C. Mettre le riz à cuire.', 'Déposer les pavés dans un plat, arroser d’huile et de jus de citron, saler, poivrer.', 'Enfourner 15 min.', 'Cuire le brocoli en fleurettes 6 min à l’eau bouillante salée et servir le tout.'] },

  { id: 'dahl', n: 'Dahl de lentilles corail', e: '🍲', type: 'plat', t: 35, d: 1, s: ['au', 'hi'], eq: ['plaques'], p: 4,
    i: [['lentilles_corail', 300, 'g'], ['lait_coco', 400, 'ml'], ['tomates_concassees', 400, 'g'], ['oignon', 1, 'pc'], ['ail', 2, 'pc'], ['gingembre', 15, 'g'], ['curry', 2, 'cs'], ['curcuma', 1, 'cc'], ['riz', 300, 'g'], ['coriandre', 1, 'pc'], ['huile', 2, 'cs']],
    st: ['Faire revenir l’oignon, l’ail et le gingembre dans l’huile, ajouter les épices.', 'Ajouter les lentilles rincées, les tomates, le lait de coco et 400 ml d’eau.', 'Cuire 20 min à feu doux en remuant.', 'Servir avec le riz et la coriandre ciselée.'] },

  { id: 'ratatouille', n: 'Ratatouille', e: '🍆', type: 'plat', t: 60, d: 1, s: ['et'], eq: ['plaques'], p: 4,
    i: [['courgette', 2, 'pc'], ['aubergine', 1, 'pc'], ['poivron', 2, 'pc'], ['tomate', 4, 'pc'], ['oignon', 1, 'pc'], ['ail', 3, 'pc'], ['herbes_provence', 1, 'cs'], ['huile_olive', 4, 'cs'], ['sel', 1, 'cc'], ['riz', 250, 'g']],
    st: ['Couper tous les légumes en dés.', 'Faire revenir oignon et poivrons dans l’huile, puis ajouter aubergine et courgettes.', 'Ajouter tomates, ail et herbes, saler.', 'Couvrir et laisser mijoter 40 min. Servir avec du riz.'] },


  { id: 'croque_monsieur', n: 'Croque-monsieur et salade', e: '🥪', type: 'plat', t: 25, d: 1, s: [], eq: ['four'], p: 4,
    i: [['pain_mie', 16, 'pc'], ['jambon', 8, 'pc'], ['gruyere', 150, 'g'], ['beurre', 40, 'g'], ['creme', 100, 'ml'], ['salade', 1, 'pc']],
    st: ['Préchauffer le four à 220 °C.', 'Beurrer les tranches de pain, garnir de jambon et de gruyère, refermer.', 'Napper le dessus de crème et parsemer de gruyère.', 'Cuire 12 min et servir avec la salade.'] },

  { id: 'hachis_parmentier', n: 'Hachis parmentier', e: '🥔', type: 'plat', t: 60, d: 2, s: ['au', 'hi'], eq: ['four', 'plaques'], p: 4,
    i: [['boeuf_hache', 500, 'g'], ['pdt', 1000, 'g'], ['lait', 200, 'ml'], ['beurre', 50, 'g'], ['oignon', 1, 'pc'], ['gruyere', 60, 'g'], ['muscade', 1, 'pincee'], ['sel', 1, 'cc']],
    st: ['Cuire les pommes de terre épluchées 20 min à l’eau salée, puis les écraser avec le lait, le beurre et la muscade.', 'Faire revenir l’oignon puis la viande, saler.', 'Dans un plat, étaler la viande puis la purée, parsemer de gruyère.', 'Gratiner 20 min à 200 °C.'] },


  { id: 'pates_pesto', n: 'Pâtes au pesto et tomates cerises', e: '🌿', type: 'plat', t: 15, d: 1, s: ['pr', 'et'], eq: ['plaques'], p: 4,
    i: [['pates', 400, 'g'], ['pesto', 190, 'g'], ['tomates_cerises', 250, 'g'], ['parmesan', 40, 'g'], ['basilic', 1, 'pc']],
    st: ['Cuire les pâtes al dente.', 'Couper les tomates cerises en deux.', 'Mélanger les pâtes égouttées avec le pesto et un peu d’eau de cuisson.', 'Ajouter les tomates, le parmesan et le basilic.'] },

  { id: 'omelette_champignons', n: 'Omelette aux champignons', e: '🍳', type: 'plat', t: 15, d: 1, s: [], eq: ['plaques'], p: 4,
    i: [['oeufs', 8, 'pc'], ['champignons', 250, 'g'], ['ciboulette', 1, 'pc'], ['beurre', 20, 'g'], ['salade', 1, 'pc'], ['sel', 1, 'cc']],
    st: ['Poêler les champignons émincés dans le beurre.', 'Battre les œufs avec le sel et la ciboulette ciselée.', 'Verser sur les champignons et cuire à feu moyen.', 'Plier l’omelette et servir avec la salade.'] },

  { id: 'gnocchis_epinards', n: 'Gnocchis poêlés, épinards et parmesan', e: '🥟', type: 'plat', t: 20, d: 1, s: [], eq: ['plaques'], p: 4,
    i: [['gnocchis', 1000, 'g'], ['epinards_frais', 200, 'g'], ['parmesan', 60, 'g'], ['creme', 150, 'ml'], ['ail', 1, 'pc'], ['huile_olive', 2, 'cs'], ['poivre', 1, 'pincee']],
    st: [] },

  { id: 'wok_poulet', n: 'Wok de poulet aux légumes', e: '🥢', type: 'plat', t: 30, d: 1, s: [], eq: ['plaques'], p: 4,
    i: [['blanc_poulet', 500, 'g'], ['nouilles', 250, 'g'], ['poivron', 1, 'pc'], ['carotte', 2, 'pc'], ['oignon', 1, 'pc'], ['sauce_soja', 4, 'cs'], ['gingembre', 15, 'g'], ['ail', 2, 'pc'], ['huile', 2, 'cs'], ['graines_sesame', 1, 'cs']],
    st: ['Cuire les nouilles, les égoutter.', 'Saisir le poulet en lanières dans l’huile très chaude.', 'Ajouter les légumes en fines lanières, l’ail et le gingembre, cuire 5 min.', 'Ajouter les nouilles et la sauce soja, mélanger, parsemer de sésame.'] },


  { id: 'tajine_poulet', n: 'Tajine de poulet citron et olives', e: '🫒', type: 'plat', t: 75, d: 2, s: ['au', 'hi'], eq: ['plaques'], p: 4,
    i: [['cuisses_poulet', 4, 'pc'], ['citron', 2, 'pc'], ['olives', 100, 'g'], ['oignon', 2, 'pc'], ['ail', 2, 'pc'], ['cumin', 1, 'cc'], ['curcuma', 1, 'cc'], ['coriandre', 1, 'pc'], ['semoule', 300, 'g'], ['huile_olive', 3, 'cs']],
    st: ['Dorer le poulet dans l’huile, réserver.', 'Faire fondre les oignons émincés et l’ail, ajouter les épices.', 'Remettre le poulet, ajouter 300 ml d’eau et le citron en quartiers. Couvrir et cuire 45 min.', 'Ajouter les olives 10 min avant la fin. Servir avec la semoule et la coriandre.'] },


  { id: 'boeuf_bourguignon', n: 'Bœuf bourguignon', e: '🍷', type: 'plat', t: 180, d: 3, s: ['au', 'hi'], eq: ['plaques'], p: 4,
    i: [['boeuf_bourguignon', 1000, 'g'], ['vin_rouge', 750, 'ml'], ['carotte', 3, 'pc'], ['oignon', 2, 'pc'], ['champignons', 250, 'g'], ['lardons', 150, 'g'], ['farine', 2, 'cs'], ['ail', 2, 'pc'], ['thym', 1, 'cc'], ['laurier', 2, 'pc'], ['pdt', 800, 'g']],
    st: ['Faire dorer la viande en morceaux dans une cocotte, réserver.', 'Faire revenir lardons et oignons, saupoudrer de farine.', 'Remettre la viande, verser le vin, ajouter carottes, ail, thym et laurier.', 'Couvrir et mijoter 2 h 30 à feu doux. Ajouter les champignons 30 min avant la fin.', 'Servir avec des pommes de terre vapeur.'] },

  { id: 'blanquette', n: 'Blanquette de veau', e: '🍚', type: 'plat', t: 120, d: 3, s: ['au', 'hi'], eq: ['plaques'], p: 4,
    i: [['veau', 1000, 'g', 'Viande et bouillon'], ['carotte', 3, 'pc', 'Viande et bouillon'], ['oignon', 1, 'pc', 'Viande et bouillon'], ['bouillon', 1, 'pc', 'Viande et bouillon'], ['laurier', 2, 'pc', 'Viande et bouillon'], ['champignons', 250, 'g', 'Sauce'], ['creme', 200, 'ml', 'Sauce'], ['oeufs', 1, 'pc', 'Sauce'], ['citron', 1, 'pc', 'Sauce'], ['beurre', 40, 'g', 'Sauce'], ['farine', 40, 'g', 'Sauce'], ['riz', 300, 'g', 'Accompagnement']],
    st: ['Mettre la viande dans une cocotte avec 1,5 L d’eau, le cube, l’oignon, les carottes et le laurier. Cuire 1 h 30.', 'Faire un roux avec le beurre et la farine, ajouter 750 ml de bouillon filtré.', 'Ajouter les champignons poêlés, la crème et le jaune d’œuf hors du feu, puis le jus de citron.', 'Remettre la viande et les carottes dans la sauce. Servir avec le riz.'] },

  { id: 'tartiflette', n: 'Tartiflette', e: '🧀', type: 'plat', t: 60, d: 1, s: ['hi'], eq: ['four', 'plaques'], p: 4,
    i: [['pdt', 1000, 'g'], ['reblochon', 1, 'pc'], ['lardons', 200, 'g'], ['oignon', 2, 'pc'], ['creme', 100, 'ml'], ['vin_blanc', 50, 'ml'], ['salade', 1, 'pc']],
    st: ['Cuire les pommes de terre 20 min, les couper en rondelles.', 'Faire revenir oignons et lardons, déglacer au vin blanc.', 'Alterner pommes de terre et lardons dans un plat, ajouter la crème.', 'Couvrir du reblochon coupé en deux dans l’épaisseur, cuire 25 min à 200 °C.'] },

  { id: 'soupe_potiron', n: 'Velouté de potiron', e: '🎃', type: 'soupe', t: 40, d: 1, s: ['au', 'hi'], eq: ['plaques', 'mixeur'], p: 4,
    i: [['potiron', 1000, 'g'], ['pdt', 300, 'g'], ['oignon', 1, 'pc'], ['bouillon', 1, 'pc'], ['creme', 100, 'ml'], ['muscade', 1, 'pincee'], ['huile_olive', 1, 'cs'], ['baguette', 1, 'pc']],
    st: ['Faire revenir l’oignon dans l’huile.', 'Ajouter potiron et pommes de terre en cubes, le cube et 1 L d’eau.', 'Cuire 25 min puis mixer avec la crème et la muscade.'] },

  { id: 'veloute_carottes', n: 'Velouté de carottes au cumin', e: '🥕', type: 'soupe', t: 35, d: 1, s: [], eq: ['plaques', 'mixeur'], p: 4,
    i: [['carotte', 8, 'pc'], ['pdt', 200, 'g'], ['oignon', 1, 'pc'], ['cumin', 1, 'cc'], ['lait_coco', 200, 'ml'], ['bouillon', 1, 'pc'], ['huile_olive', 1, 'cs']],
    st: ['Faire revenir l’oignon et le cumin dans l’huile.', 'Ajouter les carottes en rondelles, la pomme de terre, le cube et 1 L d’eau.', 'Cuire 25 min, mixer avec le lait de coco.'] },


  { id: 'salade_lentilles', n: 'Salade de lentilles et feta', e: '🥗', type: 'salade', t: 35, d: 1, s: [], eq: ['plaques'], p: 4,
    i: [['lentilles_vertes', 250, 'g'], ['carotte', 2, 'pc'], ['oignon_rouge', 1, 'pc'], ['feta', 150, 'g'], ['persil', 1, 'pc'], ['moutarde', 1, 'cc'], ['huile_olive', 4, 'cs'], ['vinaigre', 2, 'cs']],
    st: ['Cuire les lentilles 25 min à l’eau, égoutter.', 'Râper les carottes, émincer l’oignon rouge, ciseler le persil.', 'Préparer la vinaigrette moutarde-huile-vinaigre.', 'Mélanger le tout avec la feta émiettée.'] },

  { id: 'taboule', n: 'Taboulé libanais', e: '🌿', type: 'salade', t: 25, d: 1, s: ['et', 'pr'], eq: [], p: 4,
    i: [['boulgour', 150, 'g'], ['persil', 3, 'pc'], ['menthe', 1, 'pc'], ['tomate', 4, 'pc'], ['oignon', 1, 'pc'], ['citron', 2, 'pc'], ['huile_olive', 4, 'cs'], ['sel', 1, 'cc'], ['houmous', 200, 'g']],
    st: ['Faire gonfler le boulgour 15 min dans de l’eau froide, égoutter.', 'Ciseler finement persil et menthe, couper tomates et oignon en petits dés.', 'Mélanger le tout avec le jus des citrons, l’huile et le sel.', 'Servir frais avec le houmous.'] },

  { id: 'buddha_bowl', n: 'Buddha bowl patate douce et quinoa', e: '🥑', type: 'salade', t: 40, d: 1, s: ['au', 'hi'], eq: ['four', 'plaques'], p: 4,
    i: [['quinoa', 250, 'g'], ['patate_douce', 600, 'g'], ['pois_chiches', 265, 'g'], ['avocat', 2, 'pc'], ['epinards_frais', 100, 'g'], ['citron', 1, 'pc'], ['paprika', 1, 'cc'], ['huile_olive', 3, 'cs'], ['graines_sesame', 1, 'cs']],
    st: ['Préchauffer le four à 200 °C.', 'Rôtir la patate douce en cubes et les pois chiches avec huile et paprika, 25 min.', 'Cuire le quinoa 12 min.', 'Composer les bols : épinards, quinoa, légumes rôtis, avocat, citron et sésame.'] },

  { id: 'chakchouka', n: 'Chakchouka', e: '🍳', type: 'plat', t: 35, d: 1, s: ['et', 'au'], eq: ['plaques'], p: 4,
    i: [['oeufs', 6, 'pc'], ['poivron', 3, 'pc'], ['tomates_concassees', 800, 'g'], ['oignon', 1, 'pc'], ['ail', 2, 'pc'], ['cumin', 1, 'cc'], ['paprika', 1, 'cc'], ['huile_olive', 3, 'cs'], ['baguette', 1, 'pc'], ['coriandre', 1, 'pc']],
    st: ['Faire revenir l’oignon et les poivrons en lanières 10 min dans l’huile.', 'Ajouter ail, épices et tomates, laisser mijoter 15 min.', 'Creuser des puits, y casser les œufs, couvrir et cuire 6 min.', 'Parsemer de coriandre, servir avec du pain.'] },

  { id: 'fajitas', n: 'Fajitas de poulet', e: '🌯', type: 'plat', t: 30, d: 1, s: [], eq: ['plaques'], p: 4,
    i: [['blanc_poulet', 500, 'g', 'Poulet et légumes'], ['poivron', 2, 'pc', 'Poulet et légumes'], ['oignon', 1, 'pc', 'Poulet et légumes'], ['paprika', 1, 'cc', 'Poulet et légumes'], ['cumin', 1, 'cc', 'Poulet et légumes'], ['huile', 2, 'cs', 'Poulet et légumes'], ['avocat', 1, 'pc', 'Guacamole'], ['citron_vert', 1, 'pc', 'Guacamole'], ['tortillas', 8, 'pc', 'Pour servir'], ['creme', 150, 'ml', 'Pour servir'], ['salade', 1, 'pc', 'Pour servir']],
    st: ['Couper poulet, poivrons et oignon en lanières.', 'Saisir le poulet avec les épices, ajouter les légumes et cuire 8 min.', 'Écraser l’avocat avec le citron vert.', 'Garnir les tortillas chaudes de poulet, salade, guacamole et crème.'] },

  { id: 'burgers', n: 'Burgers maison et potatoes', e: '🍔', type: 'plat', t: 40, d: 1, s: [], eq: ['four', 'plaques'], p: 4,
    i: [['pain_burger', 4, 'pc'], ['steak_hache', 4, 'pc'], ['cheddar', 4, 'pc'], ['tomate', 1, 'pc'], ['salade', 1, 'pc'], ['oignon_rouge', 1, 'pc'], ['cornichons', 50, 'g'], ['pdt', 800, 'g'], ['huile', 3, 'cs'], ['paprika', 1, 'cc']],
    st: ['Couper les pommes de terre en quartiers, les mélanger à l’huile et au paprika, cuire 30 min à 210 °C.', 'Cuire les steaks à la poêle, poser le cheddar en fin de cuisson.', 'Toaster les pains, garnir de salade, tomate, oignon, steak et cornichons.'] },

  { id: 'pizza', n: 'Pizza jambon champignons', e: '🍕', type: 'plat', t: 30, d: 1, s: [], eq: ['four'], p: 4,
    i: [['pate_pizza', 2, 'pc'], ['coulis_tomate', 300, 'g'], ['mozzarella', 250, 'g'], ['jambon', 4, 'pc'], ['champignons', 200, 'g'], ['olives', 50, 'g'], ['herbes_provence', 1, 'cs']],
    st: ['Préchauffer le four à 240 °C.', 'Étaler les pâtes, les napper de coulis.', 'Garnir de jambon, champignons émincés, mozzarella et olives.', 'Parsemer d’herbes et cuire 12 à 15 min.'] },

  { id: 'carbonara', n: 'Spaghetti carbonara', e: '🍝', type: 'plat', t: 20, d: 1, s: [], eq: ['plaques'], p: 4,
    i: [['spaghetti', 400, 'g'], ['lardons', 200, 'g'], ['oeufs', 4, 'pc'], ['parmesan', 80, 'g'], ['poivre', 1, 'cc']],
    st: ['Cuire les spaghetti al dente.', 'Faire dorer les lardons à sec.', 'Battre les jaunes d’œufs avec le parmesan et beaucoup de poivre.', 'Hors du feu, mélanger pâtes, lardons et œufs avec un peu d’eau de cuisson.'] },

  { id: 'tagliatelles_saumon', n: 'Tagliatelles au saumon', e: '🐟', type: 'plat', t: 25, d: 1, s: [], eq: ['plaques'], p: 4,
    i: [['tagliatelles', 400, 'g'], ['saumon', 2, 'pc'], ['creme', 200, 'ml'], ['citron', 1, 'pc'], ['ciboulette', 1, 'pc'], ['sel', 1, 'cc']],
    st: ['Cuire les tagliatelles.', 'Couper le saumon en dés et le saisir 3 min à la poêle.', 'Ajouter la crème, le zeste et le jus du citron, laisser réduire 3 min.', 'Mélanger aux pâtes, parsemer de ciboulette.'] },

  { id: 'curry_poulet', n: 'Curry de poulet au lait de coco', e: '🍛', type: 'plat', t: 35, d: 1, s: [], eq: ['plaques'], p: 4,
    i: [['blanc_poulet', 600, 'g'], ['lait_coco', 400, 'ml'], ['poivron', 1, 'pc'], ['oignon', 1, 'pc'], ['ail', 2, 'pc'], ['gingembre', 15, 'g'], ['curry', 2, 'cs'], ['riz', 300, 'g'], ['coriandre', 1, 'pc'], ['huile', 2, 'cs']],
    st: ['Cuire le riz.', 'Faire revenir oignon, ail et gingembre dans l’huile, ajouter le curry.', 'Ajouter le poulet en morceaux et le poivron, cuire 5 min.', 'Verser le lait de coco et laisser mijoter 15 min. Servir avec riz et coriandre.'] },


  { id: 'cabillaud_puree', n: 'Cabillaud et purée de patate douce', e: '🐟', type: 'plat', t: 35, d: 1, s: ['au', 'hi'], eq: ['plaques', 'four'], p: 4,
    i: [['cabillaud', 600, 'g'], ['patate_douce', 1000, 'g'], ['beurre', 30, 'g'], ['lait', 100, 'ml'], ['citron', 1, 'pc'], ['persil', 1, 'pc'], ['huile_olive', 2, 'cs']],
    st: ['Cuire la patate douce en cubes 20 min à l’eau, l’écraser avec le beurre et le lait.', 'Cuire le cabillaud 12 min au four à 200 °C avec l’huile et le citron.', 'Servir avec la purée et le persil.'] },

  { id: 'moules_frites', n: 'Moules marinières et frites au four', e: '🦪', type: 'plat', t: 45, d: 2, s: ['et', 'au'], eq: ['plaques', 'four'], p: 4,
    i: [['moules', 2000, 'g'], ['echalote', 2, 'pc'], ['vin_blanc', 200, 'ml'], ['persil', 1, 'pc'], ['beurre', 30, 'g'], ['pdt', 1000, 'g'], ['huile', 3, 'cs']],
    st: ['Couper les pommes de terre en frites, les mélanger à l’huile, cuire 35 min à 210 °C.', 'Nettoyer les moules.', 'Faire fondre les échalotes dans le beurre, ajouter le vin et les moules.', 'Couvrir et cuire 6 min en remuant, jusqu’à ouverture. Parsemer de persil.'] },

  { id: 'crevettes_ail', n: 'Crevettes sautées ail et persil', e: '🦐', type: 'plat', t: 20, d: 1, s: [], eq: ['plaques'], p: 4,
    i: [['crevettes', 400, 'g'], ['ail', 4, 'pc'], ['persil', 1, 'pc'], ['riz', 300, 'g'], ['citron', 1, 'pc'], ['beurre', 30, 'g'], ['huile_olive', 1, 'cs']],
    st: ['Cuire le riz.', 'Faire chauffer beurre et huile, ajouter l’ail haché puis les crevettes.', 'Cuire 4 min, ajouter le persil et le jus de citron.', 'Servir sur le riz.'] },

  { id: 'gratin_coquillettes', n: 'Gratin de coquillettes au jambon', e: '🧀', type: 'plat', t: 30, d: 1, s: [], eq: ['four', 'plaques'], p: 4,
    i: [['coquillettes', 400, 'g'], ['jambon', 4, 'pc'], ['creme', 200, 'ml'], ['gruyere', 120, 'g'], ['sel', 1, 'cc']],
    st: ['Cuire les coquillettes.', 'Les mélanger avec le jambon en dés, la crème et la moitié du gruyère.', 'Verser dans un plat, couvrir du reste de gruyère.', 'Gratiner 15 min à 200 °C.'] },



  { id: 'galettes_completes', n: 'Galettes de sarrasin complètes', e: '🥞', type: 'plat', t: 40, d: 2, s: [], eq: ['plaques'], p: 4,
    i: [['farine_sarrasin', 250, 'g', 'Pâte'], ['sel', 1, 'cc', 'Pâte'], ['oeufs', 5, 'pc', 'Garniture'], ['jambon', 4, 'pc', 'Garniture'], ['gruyere', 150, 'g', 'Garniture'], ['beurre', 40, 'g', 'Garniture'], ['salade', 1, 'pc', 'Garniture']],
    st: ['Mélanger la farine, 1 œuf, le sel et 500 ml d’eau. Laisser reposer 30 min si possible.', 'Cuire une galette dans une poêle beurrée.', 'Garnir de jambon, de gruyère et casser un œuf au centre.', 'Replier les bords et cuire jusqu’à ce que l’œuf soit pris.'] },

  { id: 'salade_cesar', n: 'Salade César au poulet', e: '🥗', type: 'salade', t: 25, d: 1, s: [], eq: ['plaques'], p: 4,
    i: [['blanc_poulet', 400, 'g', 'Salade'], ['salade', 2, 'pc', 'Salade'], ['baguette', 1, 'pc', 'Salade'], ['huile_olive', 3, 'cs', 'Salade'], ['parmesan', 50, 'g', 'Sauce'], ['mayonnaise', 4, 'cs', 'Sauce'], ['citron', 1, 'pc', 'Sauce'], ['ail', 1, 'pc', 'Sauce']],
    st: ['Faire dorer le poulet en lanières dans l’huile.', 'Couper la baguette en cubes et les faire griller à la poêle.', 'Mélanger mayonnaise, jus de citron, ail râpé et la moitié du parmesan.', 'Assembler salade, poulet, croûtons, sauce et copeaux de parmesan.'] },

  { id: 'pad_thai', n: 'Pad thaï aux crevettes', e: '🍜', type: 'plat', t: 30, d: 2, s: [], eq: ['plaques'], p: 4,
    i: [['nouilles_riz', 250, 'g'], ['crevettes', 300, 'g'], ['oeufs', 2, 'pc'], ['pousses_mungo', 200, 'g'], ['cacahuetes', 50, 'g'], ['sauce_soja', 3, 'cs'], ['citron_vert', 2, 'pc'], ['sucre', 1, 'cs'], ['oignon_nouveau', 3, 'pc'], ['huile', 2, 'cs']],
    st: ['Faire tremper les nouilles dans l’eau chaude 10 min.', 'Saisir les crevettes dans l’huile, pousser sur le côté et brouiller les œufs.', 'Ajouter nouilles, sauce soja, sucre et jus de citron vert, mélanger 3 min.', 'Ajouter les pousses, l’oignon nouveau et les cacahuètes concassées.'] },


  { id: 'lentilles_carottes', n: 'Lentilles mijotées aux carottes', e: '🥘', type: 'plat', t: 40, d: 1, s: ['au', 'hi'], eq: ['plaques'], p: 4,
    i: [['lentilles_vertes', 300, 'g'], ['carotte', 3, 'pc'], ['oignon', 1, 'pc'], ['ail', 1, 'pc'], ['thym', 1, 'cc'], ['laurier', 1, 'pc'], ['bouillon', 1, 'pc'], ['moutarde', 1, 'cs'], ['huile_olive', 2, 'cs']],
    st: ['Faire revenir l’oignon et les carottes en rondelles dans l’huile.', 'Ajouter les lentilles, l’ail, le thym, le laurier, le cube et 900 ml d’eau.', 'Cuire 25 min à feu doux.', 'Hors du feu, ajouter la moutarde et rectifier l’assaisonnement.'] },


  // Desserts et brunch
  { id: 'crumble_pommes', n: 'Crumble aux pommes', e: '🍎', type: 'dessert', t: 50, d: 1, s: ['au', 'hi'], eq: ['four'], p: 6,
    i: [['pomme', 6, 'pc', 'Fruits'], ['cannelle', 1, 'cc', 'Fruits'], ['farine', 150, 'g', 'Crumble'], ['beurre', 100, 'g', 'Crumble'], ['sucre', 100, 'g', 'Crumble']],
    st: ['Préchauffer le four à 180 °C.', 'Éplucher et couper les pommes en dés, les mettre dans un plat avec la cannelle.', 'Sabler du bout des doigts la farine, le sucre et le beurre froid.', 'Recouvrir les pommes et cuire 35 min.'] },

  { id: 'mousse_chocolat', n: 'Mousse au chocolat', e: '🍫', type: 'dessert', t: 20, d: 2, s: [], eq: ['micro'], p: 6,
    i: [['chocolat_noir', 200, 'g'], ['oeufs', 6, 'pc'], ['sucre', 30, 'g'], ['sel', 1, 'pincee']],
    st: ['Faire fondre le chocolat doucement au micro-ondes.', 'Séparer les blancs des jaunes ; mélanger les jaunes au chocolat tiédi.', 'Monter les blancs en neige avec le sel, ajouter le sucre en fin.', 'Incorporer délicatement les blancs au chocolat. Réfrigérer au moins 4 h.'] },

  { id: 'gateau_yaourt', n: 'Gâteau au yaourt', e: '🍰', type: 'dessert', t: 45, d: 1, s: [], eq: ['four'], p: 8, pu: 'parts',
    i: [['yaourt', 1, 'pc'], ['farine', 250, 'g'], ['sucre', 150, 'g'], ['oeufs', 3, 'pc'], ['huile', 4, 'cs'], ['levure', 1, 'pc'], ['sucre_vanille', 1, 'pc']],
    st: ['Préchauffer le four à 180 °C.', 'Mélanger le yaourt, le sucre et les œufs.', 'Ajouter la farine, la levure, puis l’huile.', 'Verser dans un moule beurré et cuire 35 min.'] },

  { id: 'pancakes', n: 'Pancakes moelleux', e: '🥞', type: 'brunch', t: 25, d: 1, s: [], eq: ['plaques'], p: 4,
    i: [['farine', 250, 'g'], ['lait', 300, 'ml'], ['oeufs', 2, 'pc'], ['sucre', 30, 'g'], ['levure', 1, 'pc'], ['beurre', 30, 'g'], ['fruits_rouges', 200, 'g']],
    st: ['Mélanger farine, sucre et levure.', 'Ajouter les œufs, le lait et le beurre fondu, fouetter.', 'Cuire de petites louches dans une poêle chaude 2 min par face.', 'Servir avec les fruits rouges.'] },

  { id: 'porridge', n: 'Porridge banane et cannelle', e: '🥣', type: 'brunch', t: 10, d: 1, s: ['au', 'hi'], eq: ['plaques'], p: 2,
    i: [['flocons_avoine', 100, 'g'], ['lait', 400, 'ml'], ['banane', 1, 'pc'], ['cannelle', 1, 'cc'], ['miel', 1, 'cs']],
    st: ['Porter le lait à frémissement avec la cannelle.', 'Ajouter les flocons et cuire 5 min en remuant.', 'Servir avec la banane en rondelles et le miel.'] },


  { id: 'financiers', n: 'Financiers aux amandes', e: '🧁', type: 'dessert', t: 30, d: 2, s: [], eq: ['four'], p: 12, pu: 'pieces',
    i: [['amandes_poudre', 100, 'g'], ['sucre', 120, 'g'], ['farine', 40, 'g'], ['oeufs', 4, 'pc'], ['beurre', 100, 'g']],
    st: ['Préchauffer le four à 200 °C. Faire fondre le beurre jusqu’à ce qu’il soit noisette.', 'Mélanger poudre d’amande, sucre et farine.', 'Ajouter les blancs d’œufs non battus puis le beurre.', 'Remplir des moules et cuire 12 min.'] },

  // Ajouts
  { id: 'gnocchis_alfredo', n: 'Gnocchis au poulet façon Alfredo', e: '🍝', type: 'plat', t: 25, d: 1, s: [], eq: ['plaques'], p: 4,
    i: [['gnocchis', 1000, 'g'], ['blanc_poulet', 500, 'g'], ['creme', 300, 'ml'], ['parmesan', 80, 'g'], ['beurre', 30, 'g'], ['ail', 2, 'pc'], ['persil', 1, 'pc'], ['huile_olive', 2, 'cs'], ['muscade', 1, 'pincee'], ['sel', 1, 'cc'], ['poivre', 1, 'pincee']],
    st: [] },

  { id: 'lasagnes', n: 'Lasagnes à la bolognaise', e: '🍝', type: 'plat', t: 90, d: 2, s: [], eq: ['four', 'plaques'], p: 6,
    i: [['boeuf_hache', 600, 'g', 'Bolognaise'], ['tomates_concassees', 800, 'g', 'Bolognaise'], ['concentre_tomate', 2, 'cs', 'Bolognaise'], ['oignon', 1, 'pc', 'Bolognaise'], ['carotte', 1, 'pc', 'Bolognaise'], ['ail', 2, 'pc', 'Bolognaise'], ['herbes_provence', 1, 'cs', 'Bolognaise'], ['huile_olive', 2, 'cs', 'Bolognaise'], ['sel', 1, 'cc', 'Bolognaise'], ['lait', 750, 'ml', 'Béchamel'], ['beurre', 60, 'g', 'Béchamel'], ['farine', 60, 'g', 'Béchamel'], ['muscade', 1, 'pincee', 'Béchamel'], ['lasagnes', 300, 'g', 'Montage'], ['gruyere', 100, 'g', 'Montage'], ['parmesan', 40, 'g', 'Montage']],
    st: [] },

  { id: 'risotto_poireaux', n: 'Risotto aux poireaux', e: '🍚', type: 'plat', t: 40, d: 2, s: ['au', 'hi', 'pr'], eq: ['plaques'], p: 4,
    i: [['riz_arborio', 320, 'g'], ['poireau', 3, 'pc'], ['echalote', 1, 'pc'], ['bouillon', 2, 'pc'], ['vin_blanc', 100, 'ml'], ['parmesan', 70, 'g'], ['beurre', 30, 'g'], ['huile_olive', 1, 'cs'], ['poivre', 1, 'pincee']],
    st: [] },

  { id: 'risotto_butternut', n: 'Risotto à la courge butternut', e: '🎃', type: 'plat', t: 45, d: 2, s: ['au', 'hi'], eq: ['plaques'], p: 4,
    i: [['riz_arborio', 320, 'g'], ['butternut', 600, 'g'], ['oignon', 1, 'pc'], ['bouillon', 2, 'pc'], ['vin_blanc', 100, 'ml'], ['parmesan', 70, 'g'], ['beurre', 30, 'g'], ['sauge', 1, 'pc'], ['huile_olive', 2, 'cs'], ['muscade', 1, 'pincee']],
    st: [] },

  { id: 'soupe_butternut', n: 'Velouté de butternut', e: '🥣', type: 'soupe', t: 40, d: 1, s: ['au', 'hi'], eq: ['plaques', 'mixeur'], p: 4,
    i: [['butternut', 1200, 'g'], ['carotte', 1, 'pc'], ['oignon', 1, 'pc'], ['bouillon', 1, 'pc'], ['creme', 100, 'ml'], ['muscade', 1, 'pincee'], ['huile_olive', 1, 'cs'], ['baguette', 1, 'pc']],
    st: [] },

  { id: 'wraps_poulet', n: 'Wraps au poulet', e: '🌯', type: 'plat', t: 25, d: 1, s: [], eq: ['plaques'], p: 4,
    i: [['tortillas', 8, 'pc'], ['blanc_poulet', 500, 'g'], ['salade', 1, 'pc'], ['tomate', 2, 'pc'], ['avocat', 1, 'pc'], ['cheddar', 4, 'pc'], ['mayonnaise', 4, 'cs'], ['citron', 1, 'pc'], ['paprika', 1, 'cc'], ['huile', 1, 'cs']],
    st: [] },

  { id: 'wraps_saumon', n: 'Wraps au saumon fumé', e: '🌯', type: 'plat', t: 15, d: 1, s: [], eq: [], p: 4,
    i: [['tortillas', 8, 'pc'], ['saumon_fume', 250, 'g'], ['fromage_frais', 150, 'g'], ['concombre', 1, 'pc'], ['avocat', 1, 'pc'], ['salade', 1, 'pc'], ['citron', 1, 'pc'], ['ciboulette', 1, 'pc']],
    st: [] },

  { id: 'wraps_crevettes', n: 'Wraps aux crevettes', e: '🌯', type: 'plat', t: 20, d: 1, s: [], eq: ['plaques'], p: 4,
    i: [['crevettes', 300, 'g', 'Crevettes'], ['ail', 1, 'pc', 'Crevettes'], ['piment', 0.5, 'cc', 'Crevettes'], ['huile_olive', 1, 'cs', 'Crevettes'], ['avocat', 2, 'pc', 'Guacamole et sauce'], ['citron_vert', 1, 'pc', 'Guacamole et sauce'], ['mayonnaise', 3, 'cs', 'Guacamole et sauce'], ['tortillas', 8, 'pc', 'Garniture'], ['salade', 1, 'pc', 'Garniture'], ['tomate', 2, 'pc', 'Garniture']],
    st: [] }
];
