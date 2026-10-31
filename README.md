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
- **Découvrir** : 60 recettes intégrées, filtrées selon le profil ; recherche par nom ou ingrédient ; filtres (saison, rapide, anti-gaspi, favoris, mes recettes, type de plat) ; fiche recette avec quantités ajustables.
- **Semaine** : nombre de personnes et de recettes, portions par recette, répartition sur les jours, historique des semaines précédentes.
- **Liste de courses** : ingrédients additionnés sur une seule ligne, regroupés par rayon ; cocher, « je l'ai déjà », ajout manuel, placard de base masqué, budget estimé, copie de la liste.
- **Profil** : modification de tous les critères, placard de base, recettes personnelles.

Tout fonctionne hors connexion ; les données restent sur le téléphone.

## Structure

- `www/` : l'application (HTML, CSS, JavaScript). Les recettes sont dans `www/js/data.js`.
- `android/` : projet Android généré par Capacitor.
- `.github/workflows/build-apk.yml` : compile l'APK et le publie dans les Releases à chaque modification sur `main` (ou à la demande depuis l'onglet **Actions**).

## Modifier l'appli

Tester dans un navigateur : servir le dossier `www/` (par exemple `python3 -m http.server` dans `www/`) et ouvrir la page en mode mobile.
