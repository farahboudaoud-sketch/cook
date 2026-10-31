/* Étapes détaillées et astuces des recettes de base (remplacent les étapes courtes de data.js). */
'use strict';

const DETAILS = {
  curry_pois_chiches: {
    st: ['Rincer le riz à l’eau froide jusqu’à ce que l’eau soit claire, puis le cuire dans 1,5 fois son volume d’eau salée, à couvert et à feu doux, 12 min. Laisser reposer 5 min hors du feu sans ouvrir.',
      'Pendant ce temps, éplucher et émincer finement l’oignon, hacher l’ail et râper le gingembre (une cuillère à café suffit à le gratter, sans l’éplucher au couteau).',
      'Chauffer l’huile dans une sauteuse à feu moyen. Faire revenir l’oignon 5 min jusqu’à ce qu’il soit translucide, puis ajouter l’ail et le gingembre 1 min en remuant.',
      'Ajouter le curry et le faire griller 1 min en remuant : les épices doivent embaumer sans brûler.',
      'Verser les tomates concassées et le lait de coco, mélanger, puis ajouter les pois chiches rincés et égouttés. Saler.',
      'Laisser mijoter 15 min à feu doux, à découvert, en remuant de temps en temps, jusqu’à ce que la sauce épaississe.',
      'Hors du feu, ajouter les épinards : ils fondent en 1 à 2 min dans la chaleur de la sauce. Goûter, rectifier le sel et servir avec le riz.'],
    tips: ['Un filet de jus de citron juste avant de servir réveille toutes les saveurs.', 'Ce curry est encore meilleur le lendemain : il se garde 3 jours au frais et se congèle très bien.'] },

  gratin_butternut: {
    st: ['Préchauffer le four à 200 °C (chaleur tournante 180 °C).',
      'Couper la courge en deux dans la longueur, retirer les graines avec une cuillère, puis l’éplucher avec un économe solide.',
      'Détailler la chair en tranches fines d’environ 3 mm : plus elles sont fines, plus la cuisson est rapide et homogène.',
      'Frotter le fond d’un plat à gratin avec la gousse d’ail coupée en deux, puis le beurrer.',
      'Disposer la courge en couches qui se chevauchent, en salant et poivrant légèrement chaque couche.',
      'Mélanger la crème avec la muscade et une pincée de sel, puis verser sur la courge. Parsemer de gruyère.',
      'Enfourner 40 à 45 min : la pointe d’un couteau doit s’enfoncer sans résistance et le dessus être bien doré. Servir avec la salade.'],
    tips: ['Si le dessus dore trop vite, couvrir le plat d’une feuille de papier aluminium à mi-cuisson.', 'Les graines de courge rincées, séchées et grillées 10 min au four avec un peu de sel font un apéritif croquant.'] },

  poulet_citron: {
    st: ['Sortir le poulet du réfrigérateur 20 min avant la cuisson et préchauffer le four à 200 °C.',
      'Laver les pommes de terre (inutile de les éplucher) et les couper en quartiers de taille égale.',
      'Couper un citron en rondelles et presser le jus du second.',
      'Dans un grand plat, mélanger pommes de terre, rondelles de citron et gousses d’ail entières non épluchées avec l’huile, le thym, le sel et le poivre.',
      'Poser les cuisses de poulet par-dessus, côté peau vers le haut, et les arroser du jus de citron.',
      'Enfourner 45 à 50 min en arrosant le poulet avec son jus à mi-cuisson. Il est cuit quand le jus qui s’écoule en le piquant est clair.',
      'Écraser les gousses d’ail confites sur les pommes de terre au moment de servir.'],
    tips: ['Pour une peau bien croustillante, sécher les cuisses avec du papier absorbant avant de les assaisonner.', 'Pas de thym ? Les herbes de Provence ou du romarin fonctionnent tout aussi bien.'] },

  risotto_champignons: {
    st: ['Dissoudre les cubes de bouillon dans 1 L d’eau et garder ce bouillon chaud à feu très doux pendant toute la recette.',
      'Nettoyer les champignons avec un papier humide (ne pas les laisser tremper) et les émincer. Émincer finement l’oignon.',
      'Dans une poêle, faire dorer les champignons 5 min à feu vif avec une noix de beurre, saler et réserver.',
      'Dans une casserole à fond épais, faire suer l’oignon dans l’huile 3 min sans coloration.',
      'Ajouter le riz et le nacrer 2 min en remuant : les grains deviennent translucides sur les bords.',
      'Verser le vin blanc et remuer jusqu’à ce qu’il soit absorbé.',
      'Ajouter le bouillon chaud louche par louche, en attendant que chaque louche soit presque absorbée avant d’ajouter la suivante, en remuant souvent. Compter 17 à 18 min : le riz doit rester légèrement ferme à cœur.',
      'Hors du feu, incorporer les champignons, le reste du beurre en dés et le parmesan râpé. Couvrir 2 min avant de servir : c’est la « mantecatura » qui rend le risotto crémeux.'],
    tips: ['Le risotto attend mal : servir dès qu’il est prêt, dans des assiettes chaudes.', 'Sans vin, remplacer par la même quantité de bouillon et un trait de jus de citron à la fin.'] },

  soupe_poireaux: {
    st: ['Couper la racine et le haut trop vert des poireaux, les fendre en deux dans la longueur et les rincer soigneusement sous l’eau pour retirer la terre.',
      'Émincer les poireaux et l’oignon. Éplucher les pommes de terre et les couper en dés.',
      'Faire fondre le beurre dans une grande casserole et y faire revenir poireaux et oignon 5 min à feu moyen, sans coloration.',
      'Ajouter les pommes de terre, le cube de bouillon émietté et 1,2 L d’eau. Porter à ébullition.',
      'Baisser le feu, couvrir et cuire 25 min : les pommes de terre doivent s’écraser facilement.',
      'Mixer jusqu’à obtenir un velouté lisse, ajouter la crème, rectifier l’assaisonnement.',
      'Servir bien chaud avec du pain grillé.'],
    tips: ['Pour une version plus rustique, ne mixer que la moitié de la soupe.', 'Elle se congèle très bien en portions, sans la crème (à ajouter au réchauffage).'] },

  bolognaise: {
    st: ['Éplucher et hacher très finement l’oignon, la carotte et l’ail (ou les passer quelques secondes au mixeur).',
      'Chauffer l’huile dans une cocotte et faire revenir ce hachis 5 min à feu moyen.',
      'Ajouter la viande et la faire dorer à feu vif en l’émiettant avec une spatule, jusqu’à ce qu’elle ne soit plus rosée.',
      'Incorporer le concentré de tomate et le cuire 1 min en remuant, puis ajouter les tomates concassées et les herbes. Saler, poivrer.',
      'Couvrir partiellement et laisser mijoter au moins 25 min à feu doux en remuant de temps en temps. Plus la sauce mijote, meilleure elle est.',
      'Cuire les spaghetti dans une grande quantité d’eau bouillante salée en suivant le temps du paquet. Garder une louche d’eau de cuisson.',
      'Égoutter les pâtes, les mélanger à la sauce avec un peu d’eau de cuisson et servir avec le parmesan.'],
    tips: ['Doubler les quantités de sauce : elle se congèle parfaitement pour une autre semaine.', 'Un carré de chocolat noir ou une pincée de sucre en fin de cuisson adoucit l’acidité des tomates.'] },

  chili_con_carne: {
    st: ['Lancer la cuisson du riz.',
      'Éplucher et émincer l’oignon et l’ail, épépiner et couper le poivron en dés.',
      'Faire revenir l’oignon et le poivron 5 min dans l’huile chaude, puis ajouter l’ail 1 min.',
      'Ajouter la viande et la faire dorer en l’émiettant. Ajouter le cumin et le piment et remuer 1 min.',
      'Verser les tomates, ajouter les haricots rouges rincés et égouttés, saler.',
      'Laisser mijoter 30 min à feu doux à couvert, en remuant de temps en temps. Ajouter un peu d’eau si la sauce devient trop épaisse.',
      'Servir avec le riz.'],
    tips: ['Commencer avec peu de piment : on peut toujours en rajouter à table, jamais en enlever.', 'Une cuillère de crème fraîche et un peu de coriandre fraîche sur chaque assiette, c’est parfait.'] },


  quiche_lorraine: {
    st: ['Préchauffer le four à 180 °C. Dérouler la pâte dans un moule à tarte en gardant le papier cuisson, et la piquer à la fourchette.',
      'Faire dorer les lardons à sec dans une poêle 5 min, puis les égoutter sur du papier absorbant.',
      'Dans un saladier, battre les œufs, puis ajouter la crème, le lait, la muscade et le gruyère. Poivrer (pas de sel : les lardons sont déjà salés).',
      'Répartir les lardons sur le fond de pâte et verser l’appareil par-dessus.',
      'Enfourner 35 min : la quiche doit être gonflée et dorée, et le centre juste pris.',
      'Laisser tiédir 5 min avant de découper. Servir avec la salade.'],
    tips: ['Pour une pâte bien croustillante, la précuire 10 min seule avant de la garnir.', 'La quiche se réchauffe très bien au four (pas au micro-ondes, qui ramollit la pâte).'] },


  saumon_brocoli: {
    st: ['Préchauffer le four à 200 °C et lancer la cuisson du riz.',
      'Déposer les pavés de saumon dans un plat, côté peau vers le bas. Les arroser d’huile et du jus d’un demi-citron, saler et poivrer.',
      'Enfourner 12 à 15 min selon l’épaisseur : le saumon est parfait quand il est encore légèrement nacré au centre.',
      'Pendant ce temps, détailler le brocoli en petites fleurettes et éplucher la tige pour la couper en rondelles.',
      'Cuire le brocoli 5 à 6 min à l’eau bouillante salée ou à la vapeur : il doit rester vert vif et un peu croquant.',
      'Servir le saumon avec le brocoli, le riz et des quartiers de citron.'],
    tips: ['Ne jetez pas la tige du brocoli : épluchée, elle est aussi tendre que les fleurettes.', 'Un mélange sauce soja + miel badigeonné sur le saumon avant cuisson le laque joliment.'] },

  dahl: {
    st: ['Rincer les lentilles corail plusieurs fois jusqu’à ce que l’eau soit presque claire.',
      'Émincer l’oignon, hacher l’ail et râper le gingembre. Les faire revenir 5 min dans l’huile.',
      'Ajouter le curry et le curcuma, remuer 1 min pour libérer les arômes.',
      'Ajouter les lentilles, les tomates, le lait de coco et 400 ml d’eau. Saler.',
      'Cuire 20 min à feu doux en remuant souvent, car les lentilles ont tendance à accrocher. Elles doivent se défaire en purée.',
      'Pendant ce temps, cuire le riz.',
      'Servir le dahl parsemé de coriandre ciselée, avec le riz.'],
    tips: ['Les lentilles corail n’ont pas besoin de trempage et cuisent en 20 min : idéal en semaine.', 'Le dahl épaissit en refroidissant ; ajouter un peu d’eau au réchauffage.'] },

  ratatouille: {
    st: ['Laver tous les légumes. Couper courgettes, aubergine et poivrons en dés d’environ 2 cm, et les tomates en morceaux.',
      'Émincer l’oignon et hacher l’ail.',
      'Dans une grande cocotte, chauffer 2 cs d’huile et faire revenir l’oignon et les poivrons 8 min.',
      'Ajouter l’aubergine avec le reste de l’huile et cuire 5 min, puis les courgettes 5 min de plus.',
      'Ajouter les tomates, l’ail et les herbes, saler, poivrer et mélanger.',
      'Couvrir et laisser mijoter 40 min à feu doux en remuant de temps en temps. Retirer le couvercle les 10 dernières minutes si c’est trop liquide.',
      'Servir chaud ou tiède avec du riz.'],
    tips: ['Cuire les légumes séparément puis les réunir donne une ratatouille où chaque légume garde son goût.', 'Froide le lendemain, avec un œuf mollet ou un peu de feta, elle est excellente.'] },


  croque_monsieur: {
    st: ['Préchauffer le four à 220 °C (ou en position gril).',
      'Beurrer légèrement une face de chaque tranche de pain de mie.',
      'Poser la moitié des tranches, face beurrée vers le bas, sur une plaque couverte de papier cuisson.',
      'Garnir chacune d’une tranche de jambon pliée et d’un peu de gruyère, puis refermer avec une tranche, face beurrée vers le haut.',
      'Napper le dessus d’une cuillère de crème et parsemer du reste de gruyère.',
      'Enfourner 10 à 12 min jusqu’à ce que le fromage soit doré et bouillonnant. Servir avec la salade.'],
    tips: ['Avec un œuf au plat posé sur le dessus, il devient un croque-madame.', 'Un peu de moutarde à l’intérieur relève agréablement le goût.'] },

  hachis_parmentier: {
    st: ['Éplucher les pommes de terre, les couper en morceaux et les cuire 20 min dans l’eau salée froide portée à ébullition.',
      'Pendant ce temps, émincer l’oignon et le faire revenir dans un peu de beurre 5 min, puis ajouter la viande et la faire dorer en l’émiettant. Saler, poivrer.',
      'Préchauffer le four à 200 °C.',
      'Égoutter les pommes de terre et les écraser au presse-purée avec le lait chaud, le reste du beurre et la muscade. Saler.',
      'Étaler la viande dans un plat à gratin, couvrir de purée et lisser à la fourchette en traçant des sillons.',
      'Parsemer de gruyère et enfourner 20 min jusqu’à ce que le dessus soit bien doré.'],
    tips: ['Les sillons tracés à la fourchette dorent davantage et donnent un dessus croustillant.', 'C’est la recette idéale pour utiliser un reste de pot-au-feu ou de rôti haché.'] },


  pates_pesto: {
    st: ['Porter une grande casserole d’eau à ébullition, saler généreusement et y cuire les pâtes selon le temps indiqué.',
      'Couper les tomates cerises en deux.',
      'Avant d’égoutter, prélever une petite tasse d’eau de cuisson.',
      'Remettre les pâtes égouttées dans la casserole hors du feu, ajouter le pesto et 3 à 4 cs d’eau de cuisson, et mélanger : la sauce devient onctueuse.',
      'Ajouter les tomates, le parmesan râpé et les feuilles de basilic. Servir aussitôt.'],
    tips: ['Ne jamais chauffer le pesto : il perd sa couleur et son parfum.', 'Quelques pignons grillés à sec 2 min à la poêle ajoutent du croquant.'] },

  omelette_champignons: {
    st: ['Nettoyer et émincer les champignons, ciseler la ciboulette.',
      'Faire dorer les champignons dans la moitié du beurre 5 min à feu vif, saler et réserver.',
      'Battre les œufs à la fourchette avec le sel et la ciboulette, sans les faire mousser.',
      'Faire fondre le reste du beurre dans la poêle à feu moyen, verser les œufs et remuer doucement avec une spatule en ramenant les bords vers le centre.',
      'Quand l’omelette est presque prise mais encore baveuse au centre, ajouter les champignons sur une moitié.',
      'Replier l’omelette en deux, la glisser sur l’assiette et servir avec la salade.'],
    tips: ['Pour 4 personnes, faire deux omelettes de 4 œufs : elles sont plus faciles à réussir.', 'Une poêle antiadhésive et un feu moyen, jamais trop fort : c’est le secret d’une omelette moelleuse.'] },


  wok_poulet: {
    st: ['Cuire les nouilles selon le paquet, les égoutter et les rincer à l’eau froide pour qu’elles ne collent pas.',
      'Couper le poulet en fines lanières, les carottes et le poivron en bâtonnets fins, l’oignon en lamelles. Hacher l’ail et râper le gingembre.',
      'Chauffer l’huile dans un wok ou une grande poêle à feu très vif. Saisir le poulet 4 à 5 min jusqu’à ce qu’il soit doré, puis le réserver.',
      'Dans le même wok, sauter les légumes 4 min à feu vif : ils doivent rester croquants. Ajouter l’ail et le gingembre 1 min.',
      'Remettre le poulet, ajouter les nouilles et la sauce soja, et mélanger 2 min sur le feu.',
      'Parsemer de graines de sésame et servir aussitôt.'],
    tips: ['Tout couper avant de commencer : la cuisson au wok va très vite.', 'Un trait d’huile de sésame à la fin donne un goût très parfumé.'] },


  tajine_poulet: {
    st: ['Émincer les oignons, hacher l’ail et couper un citron en quartiers. Presser le jus du second.',
      'Dans une cocotte, faire dorer les cuisses de poulet dans l’huile 4 min de chaque côté, puis les réserver.',
      'Faire fondre les oignons 8 min dans la même cocotte, ajouter l’ail, le cumin et le curcuma et remuer 1 min.',
      'Remettre le poulet, ajouter le jus et les quartiers de citron et 300 ml d’eau. Saler, poivrer.',
      'Couvrir et laisser mijoter 45 min à feu doux.',
      'Ajouter les olives 10 min avant la fin. La sauce doit être réduite et parfumée.',
      'Préparer la semoule : la couvrir de son volume d’eau bouillante salée avec un filet d’huile, couvrir 5 min puis égrainer à la fourchette. Servir avec la coriandre.'],
    tips: ['Avec des citrons confits (rayon épicerie du monde), le goût est encore plus authentique.', 'Rincer les olives si elles sont très salées.'] },


  boeuf_bourguignon: {
    st: ['Couper la viande en gros cubes de 4 à 5 cm et bien la sécher avec du papier absorbant.',
      'Dans une cocotte, faire dorer la viande en plusieurs fois dans un peu d’huile, à feu vif, sans trop remplir la cocotte. Réserver.',
      'Faire revenir les lardons et les oignons émincés 5 min, puis saupoudrer de farine et remuer 1 min.',
      'Remettre la viande, verser le vin, ajouter les carottes en rondelles, l’ail écrasé, le thym et le laurier. Ajouter de l’eau à hauteur si besoin. Saler peu, poivrer.',
      'Porter à frémissement, couvrir et laisser mijoter 2 h 30 à feu très doux. La viande doit se défaire à la fourchette.',
      'Faire dorer les champignons à la poêle et les ajouter 30 min avant la fin.',
      'Servir avec des pommes de terre vapeur.'],
    tips: ['Comme tous les plats mijotés, il est encore meilleur réchauffé le lendemain.', 'Choisir un morceau à braiser (paleron, joue, macreuse) : les morceaux maigres deviennent secs.'] },

  blanquette: {
    st: ['Mettre la viande coupée en morceaux dans une cocotte, couvrir d’eau froide, porter à ébullition et écumer la mousse grise qui se forme.',
      'Ajouter le cube de bouillon, l’oignon coupé en deux, les carottes en tronçons et le laurier. Cuire 1 h 30 à petits frémissements, à couvert.',
      'Filtrer le bouillon et en garder 750 ml. Réserver la viande et les carottes.',
      'Poêler les champignons émincés dans une noisette de beurre 5 min.',
      'Dans la cocotte, faire fondre le beurre, ajouter la farine et remuer 2 min (le roux). Verser le bouillon petit à petit en fouettant, et laisser épaissir 5 min.',
      'Hors du feu, mélanger la crème avec le jaune d’œuf et le jus du citron, puis l’incorporer à la sauce.',
      'Remettre la viande, les carottes et les champignons, réchauffer doucement sans faire bouillir, et servir avec le riz.'],
    tips: ['Ne pas faire bouillir la sauce après avoir ajouté le jaune d’œuf : elle tournerait.', 'Le reste de bouillon sert à cuire le riz : il prend tout le goût de la blanquette.'] },

  tartiflette: {
    st: ['Cuire les pommes de terre avec leur peau 20 min dans l’eau salée. Les éplucher tièdes et les couper en rondelles épaisses.',
      'Préchauffer le four à 200 °C.',
      'Faire revenir les oignons émincés et les lardons 8 min dans une poêle, puis déglacer avec le vin blanc.',
      'Dans un plat beurré, alterner une couche de pommes de terre et une couche d’oignons-lardons. Arroser de crème.',
      'Gratter légèrement la croûte du reblochon, le couper en deux dans l’épaisseur et poser les deux moitiés, croûte vers le haut, sur le dessus.',
      'Enfourner 25 min jusqu’à ce que le fromage soit fondu et doré. Servir avec la salade verte.'],
    tips: ['Choisir des pommes de terre à chair ferme (charlotte, amandine) qui se tiennent à la cuisson.', 'Une salade verte bien vinaigrée équilibre la richesse du plat.'] },

  soupe_potiron: {
    st: ['Retirer les graines et la peau du potiron et couper la chair en cubes. Éplucher et couper les pommes de terre.',
      'Faire revenir l’oignon émincé dans l’huile 3 min.',
      'Ajouter potiron et pommes de terre, le cube de bouillon et 1 L d’eau. Porter à ébullition.',
      'Cuire 25 min à couvert jusqu’à ce que les légumes soient très tendres.',
      'Mixer avec la crème et la muscade jusqu’à obtenir un velouté. Rectifier l’assaisonnement.',
      'Servir avec un filet de crème et du pain grillé.'],
    tips: ['Le potimarron peut se cuire avec sa peau : pas besoin de l’éplucher.', 'Quelques graines de courge grillées sur le dessus pour le croquant.'] },

  veloute_carottes: {
    st: ['Éplucher et couper les carottes en rondelles et la pomme de terre en dés.',
      'Faire revenir l’oignon émincé dans l’huile avec le cumin 3 min.',
      'Ajouter les carottes, la pomme de terre, le cube de bouillon et 1 L d’eau.',
      'Cuire 25 min à couvert jusqu’à ce que les carottes soient fondantes.',
      'Mixer en ajoutant le lait de coco, goûter et ajuster le sel.'],
    tips: ['Un peu de gingembre râpé avec l’oignon et un filet d’orange à la fin, pour une variante fraîche.', 'La pomme de terre donne du velouté sans ajouter de crème.'] },


  salade_lentilles: {
    st: ['Rincer les lentilles et les cuire 25 min dans 3 fois leur volume d’eau non salée (le sel les durcit). Saler en fin de cuisson et égoutter.',
      'Pendant ce temps, râper les carottes, émincer finement l’oignon rouge et ciseler le persil.',
      'Préparer la vinaigrette : moutarde, vinaigre, sel, poivre, puis l’huile en fouettant.',
      'Verser la vinaigrette sur les lentilles encore tièdes et mélanger.',
      'Ajouter carottes, oignon, persil et feta émiettée. Servir tiède ou froid.'],
    tips: ['Les lentilles tièdes absorbent mieux l’assaisonnement.', 'Faire tremper l’oignon rouge émincé 10 min dans le vinaigre adoucit son goût.'] },

  taboule: {
    st: ['Mettre le boulgour dans un saladier, le couvrir d’eau froide et le laisser gonfler 15 min, puis l’égoutter en le pressant.',
      'Laver et bien sécher le persil et la menthe, retirer les grosses tiges et les ciseler très finement.',
      'Couper les tomates et l’oignon en tout petits dés.',
      'Mélanger herbes, tomates, oignon et boulgour.',
      'Assaisonner avec le jus des citrons, l’huile et le sel. Mélanger et laisser reposer 15 min au frais.',
      'Servir avec le houmous.'],
    tips: ['Dans le vrai taboulé libanais, le persil est l’ingrédient principal, le boulgour n’est qu’un accent.', 'Bien sécher les herbes avant de les ciseler pour éviter qu’elles noircissent.'] },

  buddha_bowl: {
    st: ['Préchauffer le four à 200 °C.',
      'Éplucher la patate douce et la couper en cubes de 2 cm. Rincer et bien sécher les pois chiches.',
      'Sur une plaque, mélanger patate douce et pois chiches avec 2 cs d’huile, le paprika et du sel. Enfourner 25 min en remuant à mi-cuisson.',
      'Rincer le quinoa puis le cuire 12 min dans 2 fois son volume d’eau salée. Égoutter.',
      'Préparer une sauce : le reste de l’huile, le jus du citron, sel et poivre.',
      'Dans chaque bol, disposer épinards, quinoa, légumes rôtis et avocat en tranches. Arroser de sauce et parsemer de sésame.'],
    tips: ['Rincer le quinoa avant cuisson retire son amertume.', 'Une sauce tahini (purée de sésame, citron, eau) est le classique de ce bol.'] },

  chakchouka: {
    st: ['Émincer l’oignon, couper les poivrons en lanières et hacher l’ail.',
      'Dans une grande poêle, faire revenir oignon et poivrons dans l’huile 10 min à feu moyen, jusqu’à ce qu’ils soient tendres.',
      'Ajouter l’ail, le cumin et le paprika, remuer 1 min, puis verser les tomates. Saler, poivrer et laisser mijoter 15 min.',
      'Creuser 6 petits puits dans la sauce avec une cuillère et y casser un œuf dans chacun.',
      'Couvrir et cuire 6 à 8 min à feu doux : les blancs doivent être pris et les jaunes encore coulants.',
      'Parsemer de coriandre et servir directement dans la poêle avec du pain.'],
    tips: ['Une pincée de piment ou un peu de harissa pour une version plus relevée.', 'Quelques dés de feta ajoutés avec les œufs : délicieux.'] },

  fajitas: {
    st: ['Couper le poulet en fines lanières et les mélanger avec le paprika, le cumin, le sel et la moitié du jus de citron vert.',
      'Couper les poivrons et l’oignon en lanières.',
      'Préparer le guacamole : écraser l’avocat avec le reste du citron vert et une pincée de sel.',
      'Saisir le poulet dans l’huile très chaude 5 min, ajouter les légumes et cuire encore 6 à 8 min : ils doivent rester légèrement croquants.',
      'Réchauffer les tortillas 20 s dans une poêle sèche ou au micro-ondes.',
      'Chacun garnit sa tortilla de poulet, de salade, de guacamole et de crème.'],
    tips: ['Laisser mariner le poulet 30 min (ou même le matin) le rend encore plus savoureux.', 'Un peu de maïs ou de haricots rouges en plus pour nourrir davantage.'] },

  burgers: {
    st: ['Préchauffer le four à 210 °C. Couper les pommes de terre en quartiers avec la peau.',
      'Les mélanger avec l’huile, le paprika et du sel, les étaler sur une plaque et les cuire 30 à 35 min en les retournant à mi-cuisson.',
      'Couper la tomate en rondelles, l’oignon rouge en fines rondelles et laver la salade.',
      'Cuire les steaks dans une poêle chaude 2 à 3 min par face selon la cuisson souhaitée. Saler et poser le cheddar en fin de cuisson, couvrir 1 min pour le faire fondre.',
      'Toaster les pains coupés en deux, face coupée contre la poêle, 1 min.',
      'Monter les burgers : pain, salade, tomate, steak au cheddar, oignon, cornichons, pain. Servir avec les potatoes.'],
    tips: ['Ne pas écraser les steaks avec la spatule pendant la cuisson : ils perdraient leur jus.', 'Sauce express : mayonnaise + ketchup + un peu de moutarde et de cornichon haché.'] },

  pizza: {
    st: ['Préchauffer le four à 240 °C (le plus chaud possible), avec la plaque à l’intérieur.',
      'Dérouler les pâtes sur du papier cuisson.',
      'Étaler le coulis en laissant 1 cm de bord libre.',
      'Répartir le jambon en morceaux, les champignons émincés, la mozzarella égouttée et déchirée, puis les olives.',
      'Parsemer d’herbes et arroser d’un filet d’huile.',
      'Faire glisser la pizza avec son papier sur la plaque chaude et cuire 12 à 15 min jusqu’à ce que la pâte soit dorée.'],
    tips: ['Bien égoutter la mozzarella (et la presser dans un papier) pour éviter une pizza détrempée.', 'Une plaque préchauffée donne une pâte bien plus croustillante dessous.'] },

  carbonara: {
    st: ['Porter une grande casserole d’eau salée à ébullition et y cuire les spaghetti.',
      'Pendant ce temps, faire dorer les lardons à sec dans une grande poêle 5 min, puis couper le feu.',
      'Dans un bol, mélanger les 4 jaunes d’œufs avec le parmesan râpé et beaucoup de poivre fraîchement moulu.',
      'Garder une tasse d’eau de cuisson, puis égoutter les pâtes et les mettre dans la poêle avec les lardons, hors du feu.',
      'Verser le mélange œufs-parmesan avec 3 à 4 cs d’eau de cuisson et mélanger vivement : la chaleur des pâtes crée une sauce crémeuse sans cuire les œufs en omelette.',
      'Servir immédiatement avec encore un peu de parmesan.'],
    tips: ['La vraie carbonara ne contient pas de crème : c’est l’eau de cuisson et le parmesan qui font l’onctuosité.', 'Les blancs restants se gardent 3 jours au frais : parfaits pour une mousse ou des financiers.'] },

  tagliatelles_saumon: {
    st: ['Cuire les tagliatelles dans une grande quantité d’eau bouillante salée.',
      'Retirer la peau du saumon et le couper en dés.',
      'Râper le zeste du citron puis presser son jus.',
      'Saisir le saumon 2 à 3 min dans une poêle chaude avec un filet d’huile : il doit rester tendre.',
      'Ajouter la crème, le zeste et le jus de citron, saler, poivrer et laisser réduire 2 à 3 min.',
      'Mélanger avec les pâtes égouttées et parsemer de ciboulette ciselée.'],
    tips: ['Ajouter le jus de citron hors du feu si la crème a tendance à trancher.', 'Avec du saumon fumé coupé en lanières (ajouté à la fin, sans cuisson), la recette est prête en 10 min.'] },

  curry_poulet: {
    st: ['Lancer la cuisson du riz.',
      'Couper le poulet en morceaux, émincer l’oignon, hacher l’ail, râper le gingembre et couper le poivron en lanières.',
      'Faire revenir l’oignon dans l’huile 5 min, ajouter l’ail, le gingembre et le curry, et remuer 1 min.',
      'Ajouter le poulet et le faire dorer 5 min, puis le poivron.',
      'Verser le lait de coco, saler et laisser mijoter 15 min à feu doux.',
      'Servir avec le riz et la coriandre ciselée.'],
    tips: ['Les hauts de cuisse désossés restent plus moelleux que les blancs dans un curry.', 'Un peu de pâte de curry rouge ou verte à la place de la poudre pour une version thaïe.'] },


  cabillaud_puree: {
    st: ['Éplucher la patate douce, la couper en cubes et la cuire 20 min à l’eau salée.',
      'Préchauffer le four à 200 °C.',
      'Déposer le cabillaud dans un plat, arroser d’huile et de la moitié du jus de citron, saler et poivrer.',
      'Enfourner 12 à 15 min : la chair doit se détacher en lamelles nacrées.',
      'Égoutter la patate douce et l’écraser avec le beurre et le lait chaud.',
      'Servir le poisson sur la purée, avec le persil ciselé et le reste de citron.'],
    tips: ['Le cabillaud surgelé convient très bien : le décongeler la veille au réfrigérateur.', 'Une pincée de cumin ou de muscade dans la purée de patate douce, c’est délicieux.'] },

  moules_frites: {
    st: ['Préchauffer le four à 210 °C. Couper les pommes de terre en frites, les rincer, bien les sécher, puis les mélanger avec l’huile et du sel.',
      'Les étaler en une seule couche sur une plaque et cuire 35 min en les retournant à mi-cuisson.',
      'Pendant ce temps, gratter les moules, retirer leurs filaments et jeter celles qui sont cassées ou restent ouvertes quand on les tapote.',
      'Dans un grand faitout, faire fondre les échalotes émincées dans le beurre 2 min.',
      'Ajouter le vin blanc et les moules, couvrir et cuire 5 à 6 min à feu vif en secouant le faitout, jusqu’à ce qu’elles soient toutes ouvertes.',
      'Parsemer de persil et servir aussitôt avec les frites.'],
    tips: ['Jeter les moules qui restent fermées après cuisson.', 'Variante : ajouter 100 ml de crème et une pincée de curry en fin de cuisson.'] },

  crevettes_ail: {
    st: ['Lancer la cuisson du riz.',
      'Décortiquer les crevettes si besoin et les sécher avec du papier absorbant. Hacher l’ail et ciseler le persil.',
      'Chauffer le beurre et l’huile dans une grande poêle à feu moyen-vif.',
      'Ajouter l’ail 30 s, puis les crevettes en une seule couche. Cuire 2 min de chaque côté : elles deviennent roses et opaques.',
      'Hors du feu, ajouter le persil et le jus de citron, saler et mélanger.',
      'Servir sur le riz en arrosant du beurre à l’ail.'],
    tips: ['Ne pas trop cuire les crevettes : elles deviennent caoutchouteuses.', 'Une pincée de piment d’Espelette pour une version « gambas al ajillo ».'] },

  gratin_coquillettes: {
    st: ['Préchauffer le four à 200 °C.',
      'Cuire les coquillettes 2 min de moins que le temps indiqué (elles finiront de cuire au four).',
      'Couper le jambon en dés.',
      'Mélanger les pâtes égouttées avec le jambon, la crème et la moitié du gruyère. Poivrer.',
      'Verser dans un plat à gratin et couvrir du reste de gruyère.',
      'Enfourner 15 min jusqu’à ce que le dessus soit doré.'],
    tips: ['Les enfants l’adorent : c’est la recette idéale pour les soirs pressés.', 'Quelques champignons ou petits pois ajoutés rendent le plat plus complet.'] },



  galettes_completes: {
    st: ['Dans un saladier, mélanger la farine de sarrasin, 1 œuf et le sel, puis ajouter 500 ml d’eau froide petit à petit en fouettant pour éviter les grumeaux.',
      'Laisser reposer la pâte 30 min si possible (au moins 1 h, c’est encore mieux).',
      'Chauffer une grande poêle à feu vif et la graisser avec un peu de beurre.',
      'Verser une louche de pâte et l’étaler rapidement en tournant la poêle. Cuire 2 min jusqu’à ce que les bords se décollent.',
      'Baisser le feu, poser une tranche de jambon, du gruyère, et casser un œuf au centre.',
      'Rabattre les bords en carré, couvrir 2 min jusqu’à ce que le blanc soit pris. Servir avec la salade.'],
    tips: ['La première galette est souvent ratée : c’est normal, elle sert à régler la température de la poêle.', 'La farine de sarrasin ne contient pas de gluten : idéal pour une version sans gluten.'] },

  salade_cesar: {
    st: ['Couper le pain en cubes et les faire dorer à la poêle avec 1 cs d’huile, 5 min en remuant. Réserver.',
      'Couper le poulet en lanières, saler, poivrer et le faire dorer 6 à 8 min dans le reste de l’huile.',
      'Préparer la sauce : mayonnaise, jus de citron, ail râpé et la moitié du parmesan râpé. Allonger d’un peu d’eau si elle est trop épaisse.',
      'Laver et couper la salade.',
      'Mélanger la salade avec la sauce, puis ajouter le poulet, les croûtons et le reste du parmesan en copeaux.'],
    tips: ['Ajouter les croûtons au dernier moment pour qu’ils restent croustillants.', 'Un filet d’anchois écrasé dans la sauce : c’est la recette originale.'] },

  pad_thai: {
    st: ['Faire tremper les nouilles de riz 10 min dans de l’eau très chaude, puis les égoutter.',
      'Préparer la sauce : sauce soja, sucre et jus d’un citron vert.',
      'Concasser les cacahuètes et émincer les oignons nouveaux.',
      'Dans un wok très chaud avec l’huile, saisir les crevettes 2 min. Les pousser sur le côté, casser les œufs et les brouiller rapidement.',
      'Ajouter les nouilles et la sauce, et mélanger 2 à 3 min à feu vif.',
      'Ajouter les pousses et l’oignon nouveau, mélanger 30 s, puis servir avec les cacahuètes et des quartiers de citron vert.'],
    tips: ['Ne pas trop faire tremper les nouilles : elles finissent de cuire dans le wok.', 'Version végétarienne : remplacer les crevettes par du tofu ferme doré.'] },


  lentilles_carottes: {
    st: ['Rincer les lentilles.',
      'Faire revenir l’oignon émincé et les carottes en rondelles dans l’huile 5 min.',
      'Ajouter les lentilles, l’ail écrasé, le thym, le laurier, le cube de bouillon et 900 ml d’eau.',
      'Porter à ébullition puis cuire 25 min à feu doux à couvert : les lentilles doivent être tendres mais garder leur forme.',
      'Hors du feu, retirer le laurier, ajouter la moutarde, mélanger et rectifier l’assaisonnement.'],
    tips: ['Les lentilles vertes du Puy tiennent très bien à la cuisson.', 'Pour les non-végétariens, quelques saucisses fumées ajoutées 15 min avant la fin.'] },


  crumble_pommes: {
    st: ['Préchauffer le four à 180 °C.',
      'Éplucher les pommes, retirer le cœur et les couper en dés.',
      'Les disposer dans un plat avec la cannelle.',
      'Dans un saladier, mélanger la farine et le sucre, puis ajouter le beurre froid coupé en dés.',
      'Sabler du bout des doigts jusqu’à obtenir une texture de grosse chapelure.',
      'Répartir sur les pommes sans tasser et enfourner 35 à 40 min jusqu’à ce que le dessus soit doré.'],
    tips: ['Remplacer 50 g de farine par des flocons d’avoine ou de la poudre d’amande pour un crumble plus croustillant.', 'Délicieux tiède avec une boule de glace vanille ou une cuillère de crème.'] },

  mousse_chocolat: {
    st: ['Faire fondre le chocolat en morceaux au micro-ondes par tranches de 30 s, en remuant entre chaque, ou au bain-marie.',
      'Séparer les blancs des jaunes.',
      'Hors du feu, incorporer les jaunes un par un au chocolat tiédi en mélangeant bien.',
      'Monter les blancs en neige avec la pincée de sel. Quand ils commencent à être fermes, ajouter le sucre et fouetter encore 1 min.',
      'Ajouter un tiers des blancs au chocolat et mélanger vivement pour détendre, puis incorporer le reste délicatement à la spatule en soulevant la masse.',
      'Répartir dans des verrines et réfrigérer au moins 4 h.'],
    tips: ['Utiliser des œufs à température ambiante et un bol parfaitement propre pour monter les blancs.', 'Une pincée de fleur de sel ou un peu de zeste d’orange sur le dessus.'] },

  gateau_yaourt: {
    st: ['Préchauffer le four à 180 °C et beurrer un moule.',
      'Verser le yaourt dans un saladier et garder le pot propre : il sert de mesure.',
      'Ajouter le sucre et le sucre vanillé, puis les œufs un par un, en fouettant.',
      'Ajouter la farine et la levure, mélanger sans trop travailler la pâte, puis l’huile.',
      'Verser dans le moule et enfourner 30 à 35 min : une lame plantée au centre doit ressortir sèche.',
      'Laisser tiédir avant de démouler.'],
    tips: ['Ajouter le zeste d’un citron ou une poignée de pépites de chocolat pour varier.', 'La recette au pot : 1 pot de yaourt, 3 pots de farine, 2 pots de sucre, 1/2 pot d’huile.'] },

  pancakes: {
    st: ['Faire fondre le beurre.',
      'Dans un saladier, mélanger la farine, le sucre et la levure.',
      'Ajouter les œufs, puis le lait petit à petit en fouettant, et enfin le beurre fondu. La pâte doit être épaisse et nappante.',
      'Laisser reposer 10 min si possible.',
      'Chauffer une poêle légèrement beurrée à feu moyen. Verser une petite louche de pâte.',
      'Retourner quand des bulles apparaissent à la surface (environ 2 min), puis cuire 1 min de l’autre côté. Servir avec les fruits rouges.'],
    tips: ['La première fournée sert à régler le feu : moyen, jamais trop fort.', 'Les pancakes se congèlent : passer 1 min au grille-pain pour les réchauffer.'] },

  porridge: {
    st: ['Verser le lait dans une casserole avec la cannelle et une pincée de sel, et porter à frémissement.',
      'Ajouter les flocons d’avoine et cuire 5 min à feu doux en remuant régulièrement.',
      'Le porridge est prêt quand il est crémeux ; ajouter un peu de lait s’il est trop épais.',
      'Servir dans des bols avec la banane en rondelles et un filet de miel.'],
    tips: ['Version « overnight » : mélanger flocons et lait la veille au soir dans un pot, et le manger froid le matin.', 'Une poignée de fruits rouges ou une cuillère de beurre de cacahuète pour varier.'] },


  financiers: {
    st: ['Préchauffer le four à 200 °C et beurrer des petits moules (ou utiliser des moules en silicone).',
      'Faire fondre le beurre dans une casserole et le laisser cuire jusqu’à ce qu’il devienne doré et sente la noisette. Le laisser tiédir.',
      'Dans un saladier, mélanger la poudre d’amande, le sucre et la farine.',
      'Ajouter les blancs d’œufs non montés et mélanger juste ce qu’il faut.',
      'Incorporer le beurre noisette tiède.',
      'Remplir les moules aux trois quarts et cuire 10 à 12 min jusqu’à ce que les bords soient dorés.'],
    tips: ['La recette parfaite pour utiliser des blancs restants (après une carbonara par exemple).', 'Une framboise posée sur chaque financier avant cuisson, c’est joli et délicieux.'] },

  quiche_poireaux_chevre: {
    st: ['Préchauffer le four à 180 °C. Étaler la pâte dans un moule en gardant le papier cuisson et la piquer à la fourchette.',
      'Couper la racine et le vert trop dur des poireaux, les fendre en deux et les rincer soigneusement, puis les émincer finement.',
      'Faire fondre les poireaux 10 à 12 min dans le beurre à feu doux avec une pincée de sel : ils doivent être tendres sans colorer. Les laisser tiédir.',
      'Battre les œufs avec la crème, le lait, la muscade, le poivre et les deux tiers du gruyère.',
      'Étaler les poireaux sur la pâte, verser l’appareil et parsemer du reste de gruyère.',
      'Cuire 35 min jusqu’à ce que la quiche soit gonflée et dorée. Laisser reposer 5 min avant de couper.'],
    tips: ['Bien égoutter les poireaux après cuisson pour éviter une pâte détrempée.', 'Quelques lardons ou un peu de saumon fumé ajoutés avec les poireaux font une belle variante.'] },

  gnocchis_epinards: {
    st: ['Chauffer l’huile dans une grande poêle à feu moyen-vif.',
      'Ajouter les gnocchis directement, sans les cuire à l’eau, et les faire dorer 8 à 10 min en les remuant régulièrement : ils doivent être croustillants à l’extérieur.',
      'Ajouter l’ail haché et les épinards, et laisser tomber 2 min en remuant.',
      'Verser la crème et laisser réduire 2 min.',
      'Hors du feu, ajouter le parmesan râpé, poivrer généreusement et servir aussitôt.'],
    tips: ['Ne pas trop remplir la poêle : les gnocchis doivent être en une seule couche pour bien dorer.', 'Quelques tomates séchées ou des pignons grillés ajoutent du goût et du croquant.'] },

  gnocchis_alfredo: {
    st: ['Couper le poulet en petits morceaux, saler et poivrer. Hacher l’ail et ciseler le persil. Râper le parmesan.',
      'Dans une grande poêle, chauffer 1 cs d’huile à feu moyen-vif et faire dorer les gnocchis 8 min en remuant, jusqu’à ce qu’ils soient croustillants. Les réserver.',
      'Dans la même poêle, ajouter le reste de l’huile et faire dorer le poulet 6 à 7 min : il doit être bien cuit et doré.',
      'Baisser le feu, ajouter le beurre et l’ail, et remuer 1 min sans laisser brunir l’ail.',
      'Verser la crème, ajouter la muscade et laisser frémir 3 min pour qu’elle épaississe légèrement.',
      'Hors du feu, incorporer le parmesan en remuant jusqu’à obtenir une sauce lisse et nappante.',
      'Remettre les gnocchis, mélanger pour bien les enrober, parsemer de persil et servir aussitôt.'],
    tips: ['Ajouter le parmesan hors du feu : à feu vif, il fait des grumeaux.', 'Si la sauce épaissit trop, la détendre avec un peu de lait ou d’eau chaude.', 'Quelques champignons ou des épinards poêlés avec le poulet complètent bien le plat.'] },

  lasagnes: {
    st: ['Préparer la bolognaise : hacher finement l’oignon, la carotte et l’ail et les faire revenir 5 min dans l’huile.',
      'Ajouter la viande et la faire dorer en l’émiettant. Incorporer le concentré, les tomates et les herbes, saler et laisser mijoter 25 min à feu doux.',
      'Préparer la béchamel : faire fondre le beurre, ajouter la farine et remuer 2 min, puis verser le lait petit à petit en fouettant. Cuire 5 min jusqu’à ce qu’elle nappe la cuillère. Saler, ajouter la muscade.',
      'Préchauffer le four à 180 °C.',
      'Dans un grand plat, étaler un peu de béchamel, puis alterner : feuilles de lasagne, bolognaise, béchamel, un peu de gruyère. Faire 3 ou 4 couches.',
      'Terminer par des feuilles, la béchamel restante, le reste du gruyère et le parmesan.',
      'Enfourner 40 min, en couvrant d’aluminium si le dessus colore trop vite. Laisser reposer 10 min avant de couper.'],
    tips: ['Les feuilles sans précuisson ont besoin d’être bien recouvertes de sauce pour cuire.', 'Les lasagnes sont encore meilleures réchauffées le lendemain, et elles se congèlent très bien en parts.'] },

  risotto_poireaux: {
    st: ['Dissoudre les cubes dans 1 L d’eau et garder ce bouillon chaud à feu très doux.',
      'Fendre les poireaux, les rincer et les émincer finement. Émincer l’échalote.',
      'Dans une casserole à fond épais, faire fondre les poireaux et l’échalote 6 min dans l’huile et la moitié du beurre, sans coloration.',
      'Ajouter le riz et le nacrer 2 min en remuant, jusqu’à ce que les grains deviennent translucides sur les bords.',
      'Verser le vin blanc et remuer jusqu’à ce qu’il soit absorbé.',
      'Ajouter le bouillon louche par louche en remuant souvent, en attendant que chaque louche soit presque absorbée. Compter 17 à 18 min : le riz doit rester légèrement ferme à cœur.',
      'Hors du feu, ajouter le reste du beurre et le parmesan râpé, poivrer, couvrir 2 min puis servir.'],
    tips: ['Garder quelques rondelles de poireau poêlées à part pour décorer l’assiette.', 'Une poignée de lardons ou de saumon fumé en fin de cuisson pour une version plus gourmande.'] },

  risotto_butternut: {
    st: ['Éplucher la courge, retirer les graines et couper la chair en petits dés de 1 cm. Émincer l’oignon.',
      'Dissoudre les cubes dans 1 L d’eau et garder ce bouillon chaud.',
      'Faire revenir les dés de courge 8 min dans 1 cs d’huile, avec quelques feuilles de sauge, jusqu’à ce qu’ils soient tendres et légèrement dorés. Réserver.',
      'Dans une casserole, faire suer l’oignon dans le reste de l’huile 3 min, puis ajouter le riz et le nacrer 2 min.',
      'Déglacer au vin blanc, puis ajouter le bouillon louche par louche en remuant, pendant 17 à 18 min.',
      'À mi-cuisson, ajouter la moitié de la courge : elle va fondre et rendre le risotto orangé et crémeux.',
      'Hors du feu, incorporer le reste de la courge, le beurre, le parmesan et la muscade. Couvrir 2 min et servir avec quelques feuilles de sauge.'],
    tips: ['Faire frire quelques feuilles de sauge 30 s dans le beurre pour une garniture croustillante.', 'Les graines de courge grillées au four avec un peu de sel font un joli topping.'] },

  soupe_butternut: {
    st: ['Éplucher la courge, retirer les graines et couper la chair en cubes. Éplucher et couper la carotte en rondelles et émincer l’oignon.',
      'Faire revenir l’oignon dans l’huile 3 min dans une grande casserole.',
      'Ajouter la courge, la carotte, le cube de bouillon et 1 L d’eau. Porter à ébullition.',
      'Baisser le feu, couvrir et cuire 25 min jusqu’à ce que les légumes soient très tendres.',
      'Mixer avec la crème et la muscade jusqu’à obtenir un velouté lisse. Rectifier l’assaisonnement.',
      'Servir bien chaud avec du pain grillé et un filet de crème.'],
    tips: ['Une cuillère de curry ou un peu de gingembre avec l’oignon pour une version plus parfumée.', 'Remplacer la crème par du lait de coco pour une version sans lactose.'] },

  wraps_poulet: {
    st: ['Couper le poulet en lanières et le mélanger avec le paprika, le sel et la moitié du jus de citron.',
      'Le faire dorer dans l’huile chaude 6 à 8 min jusqu’à ce qu’il soit bien cuit.',
      'Pendant ce temps, laver la salade, couper les tomates en dés et l’avocat en tranches.',
      'Mélanger la mayonnaise avec le reste du jus de citron.',
      'Réchauffer les tortillas 20 s dans une poêle sèche.',
      'Tartiner chaque tortilla de sauce, ajouter salade, tomate, avocat, une demi-tranche de cheddar et le poulet chaud, puis rouler en serrant bien.'],
    tips: ['Couper les wraps en deux en biais et les emballer dans du papier cuisson pour les emporter.', 'Pour un poulet croustillant, rouler les lanières dans de la chapelure avant de les dorer.'] },

  wraps_saumon: {
    st: ['Laver la salade et la ciboulette. Ciseler la ciboulette.',
      'Mélanger le fromage frais avec la ciboulette, un filet de jus de citron et du poivre.',
      'Couper le concombre en fins bâtonnets et l’avocat en tranches. Arroser l’avocat d’un peu de citron.',
      'Tartiner chaque tortilla du mélange au fromage frais.',
      'Ajouter les tranches de saumon fumé, la salade, le concombre et l’avocat.',
      'Rouler en serrant bien et couper en deux en biais.'],
    tips: ['Sans cuisson : idéal pour un repas rapide ou un pique-nique.', 'Roulés serré et filmés, puis coupés en tronçons, ils font de jolies bouchées pour l’apéritif.'] },

  wraps_crevettes: {
    st: ['Hacher l’ail. Faire sauter les crevettes 3 min dans l’huile chaude avec l’ail et le piment : elles doivent devenir roses.',
      'Préparer un guacamole rapide : écraser un avocat avec le jus d’un demi-citron vert et une pincée de sel.',
      'Mélanger la mayonnaise avec le reste du jus de citron vert.',
      'Laver la salade, couper les tomates en dés et le second avocat en tranches.',
      'Réchauffer les tortillas 20 s dans une poêle sèche.',
      'Tartiner de guacamole, ajouter salade, tomates, avocat et crevettes, napper d’un peu de sauce et rouler.'],
    tips: ['Les crevettes surgelées conviennent très bien : les décongeler au frais et bien les sécher avant cuisson.', 'Quelques feuilles de coriandre fraîche donnent une touche mexicaine.'] }
};
