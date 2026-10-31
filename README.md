# Carnet de cuisine

Application Android personnelle : choisir des recettes pour la semaine et obtenir la liste de courses correspondante, regroupée par rayon.

## Installer l'application sur le téléphone

1. Sur ton téléphone, ouvre la page **Releases** de ce dépôt (colonne de droite sur GitHub, ou `…/cook/releases`).
2. Dans la dernière version, touche le fichier `carnet-de-cuisine-1.0.X.apk` pour le télécharger.
3. Ouvre le fichier téléchargé. Android demande d'autoriser l'installation depuis cette source (navigateur ou gestionnaire de fichiers) : accepte, puis touche **Installer**.
4. Si Google Play Protect affiche un avertissement (« application inconnue »), choisis **Installer quand même**. C'est normal pour une appli qui ne vient pas du Play Store.

Les mises à jour s'installent par-dessus l'ancienne version sans perdre les données (profil, menu, liste, recettes personnelles).

## Fonctionnalités

- **Questionnaire de départ** : allergies et interdits, régime, aliments non aimés, temps de cuisine, niveau, équipement, taille du foyer.
- **Découvrir** : 56 recettes détaillées (étapes précises et astuces), avec une image générée par IA et de vraies photos, filtrées selon le profil ; recherche par nom ou ingrédient ; filtres (saison, rapide, anti-gaspi, type de plat). Si une recette n'existe pas, l'IA peut la générer.
- **Mes recettes** : favoris, recettes écrites à la main et recettes générées par l'IA, classés par type de plat.
- **Fiche recette** : image, quantités ajustables, étapes, astuces, note en étoiles, date de dernière préparation et commentaires personnels. Toutes les recettes (même celles du carnet) sont modifiables à la main, avec retour possible à l'original.
- **Semaine** : nombre de personnes et de recettes, portions par recette, répartition sur les jours, historique des semaines précédentes.
- **Liste de courses** : ingrédients additionnés sur une seule ligne, regroupés par rayon ; cocher, « je l'ai déjà », ajout manuel, placard de base masqué, budget estimé, copie de la liste.
- **Profil** : modification de tous les critères, placard de base, assistant IA (service compatible OpenAI ou Gemini), recettes masquées.

Les données restent sur le téléphone. Les images générées des recettes du carnet sont incluses dans l'appli. Les vraies photos (Wikimedia Commons, auteur et licence affichés) et l'assistant IA demandent une connexion internet.

## Structure

- `www/` : l'application (HTML, CSS, JavaScript). Recettes : `www/js/data.js` (ingrédients) et `www/js/details.js` (étapes et astuces). Photos : `www/js/images.js`.
- `scripts/` : recherche des photos (`fetch-images.mjs`, requêtes et choix dans `image-queries.json`), planches de vérification, aperçu pour ordinateur (`build-preview.py`).
- `android/` : projet Android généré par Capacitor.
- `.github/workflows/generate-images.yml` : génère les images des recettes avec le service compatible OpenAI (secrets `OPENAI_API_KEY` et `OPENAI_BASE_URL`).
- `.github/workflows/fetch-images.yml` : relance la recherche de photos (onglet **Actions** › « Chercher les photos »).
- `.github/workflows/build-apk.yml` : compile l'APK et le publie dans les Releases à chaque modification sur `main` (ou à la demande depuis l'onglet **Actions**).

## Modifier l'appli

Tester dans un navigateur : servir le dossier `www/` (par exemple `python3 -m http.server` dans `www/`) et ouvrir la page en mode mobile.
