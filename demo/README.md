# Aura — démo cliquable

Démo de l'app mobile qui numérise la garde-robe des femmes et des hommes de 18 à 40 ans, quel que soit leur style (corporate, costume et tailleur, streetwear, casual, sport), et leur sert de styliste IA. Les marques partenaires paient un abonnement (B2B) pour y être connectées et recommander la bonne pièce, à la bonne taille.

> **Nom de l'app** : « Aura » est le nom retenu. Il se change en une ligne dans [`lib/config.ts`](lib/config.ts) (`APP_NAME`).

Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Framer Motion · Zustand (persistance `localStorage`) · Recharts · API Claude (Sonnet 5.5, avec outils et streaming).

---

## Installation et lancement

```bash
cd demo
npm install
cp .env.example .env.local      # puis renseigner ANTHROPIC_API_KEY (facultatif)
npm run dev                     # http://localhost:3000
```

Pour la projection, préférez la version de production, plus fluide :

```bash
npm run build && npm start
```

### Clés (`.env.local`)

| Variable | Rôle | Obligatoire ? |
|---|---|---|
| `ANTHROPIC_API_KEY` | Assistant IA en direct (`claude-sonnet-5-5`) | Non : sans clé, ou si l'appel échoue, le **mode secours** répond à l'identique pour les 4 scénarios |
| `PIXABAY_API_KEY` | Récupérer à nouveau photos et vidéo (`npm run images`) | Non : les images sont déjà dans `public/` |
| `PEXELS_API_KEY` | Alternative à Pixabay pour la récolte | Non |
| `OPENAI_API_KEY` | Générer des packshots IA (`npm run images:generate`) | Non |

> Pexels n'émettant plus de nouvelles clés, les photos ont été récoltées sur **Pixabay** (licence libre, usage commercial autorisé). Le script accepte les deux.

### Déploiement sur Vercel

1. Importer le dépôt dans Vercel et choisir **`demo`** comme *Root Directory*.
2. Ajouter `ANTHROPIC_API_KEY` dans *Settings → Environment Variables* (facultatif).
3. Déployer : aucune autre configuration n'est nécessaire.

---

## Mode présentation

- **Bouton « Redémarrer la démo »** en haut à gauche, hors du téléphone (grand écran) : remet tout à zéro et revient au splash.
- **`Shift + D`** (ou **appui long sur le logo « AURA »**) ouvre le menu caché : préremplir le compte de Thomas, réinitialiser la démo, sauter à n'importe quelle étape, effacer la conversation, préparer le mode hors ligne.
- **Hors ligne** : en production, un service worker met l'app en cache. Avant la présentation, ouvrez le menu puis cliquez sur **« Préparer le mode hors ligne »** : toutes les pages, photos et la vidéo sont téléchargées. L'assistant bascule alors automatiquement en mode secours.
- Sur un ordinateur, l'app s'affiche dans un cadre de téléphone ; sur un vrai téléphone, elle occupe tout l'écran. Pour l'installer comme une app : *Partager → Sur l'écran d'accueil*.
- Le menu indique si la dernière réponse venait de l'**IA en direct** ou du **mode secours** : le jury, lui, ne voit pas la différence.

---

## Script de démo (3 minutes)

**Avant de monter sur scène** : `Shift + D` → *Réinitialiser la démo*, puis *Préparer le mode hors ligne*. Ouvrir `/bienvenue` en plein écran (F11).

| Temps | Quoi cliquer | Quoi dire |
|---|---|---|
| **0:00** | Carrousel : *Suivant* ×2, puis *Commencer* | « Thomas, 28 ans, consultant. Son armoire est pleine, et pourtant chaque matin il n'a rien à se mettre. » |
| **0:15** | *Continuer avec Apple*, puis *Continuer* jusqu'au quiz : choisir 3 tenues, 3 couleurs, *Continuer* ×2. Sur l'écran RGPD, montrer les 3 interrupteurs puis *Valider mes choix* | « Le profil prend 30 secondes. Et le consentement est granulaire : chaque donnée est activable séparément. » |
| **0:40** | Boutiques : *Connecter* **Maison Vérac**, puis *Se connecter* → *Autoriser*. Laisser défiler l'import, *Terminé*. Connecter **Ligne Bastide** de la même façon, puis *Continuer* | « Ses achats en ligne arrivent tout seuls, avec la photo, la matière, et surtout la **taille**. Notez le retour pris en compte : une chemise renvoyée en 39 parce que trop petite. » |
| **1:05** | *Utiliser la vidéo exemple* : laisser l'analyse se faire (6 s), puis montrer un doublon et cliquer *Fusionner*, puis *Découvrir mon dressing* | « Pour le reste, il filme son dressing 30 secondes : une quarantaine de pièces détectées. Ce blazer correspond à un achat Maison Vérac : on fusionne. Pas besoin de tout saisir. » |
| **1:30** | Accueil : la carte « Demain 10 h — Orsay Conseil », puis *Préparer ma tenue* | « Demain, rendez-vous client, business formel, et il pleut. » → la tenue s'affiche, avec l'alerte : sa chemise blanche est au pressing, remplacée automatiquement. |
| **1:55** | Taper la suggestion **« Je suis invité à un mariage en juin, il me manque quoi ? »** | « Le styliste ne pousse pas à l'achat : il a déjà la chemise et les chaussures. Il ne manque qu'un costume léger. **Taille 50** chez Maison Vérac, alors qu'il fait du 48 ailleurs, parce que la marque taille petit : confiance 94 %. » → *Ajouter au panier*, puis *Commander* et *Payer*. |
| **2:25** | `Shift + D` → *Espace marque (B2B)* | « Côté marque, c'est là qu'est notre modèle : 12 400 clients connectés, un taux de retour de **9,4 % au lieu de 27,4 %**, et des insights que personne d'autre n'a : 38 % de leurs clients n'ont pas de pantalon habillé gris. L'abonnement est rentabilisé environ 3,7 fois. » |
| **2:50** | Retour à l'app | « Moins d'achats inutiles pour lui, moins de retours pour les marques. » |

**Variante budget (30 s)** : dans l'assistant, « J'ai 80 € de budget, fais-moi une tenue. » → trois tenues, avec les pièces à acheter tirées des catalogues (en stock à sa taille) et le reste pris dans son dressing. *Tout ajouter au panier* → *Commander* → *Payer*, ou *Voir sur le site* pour ouvrir la fiche sur la boutique de la marque.

**Variantes si l'on a plus de temps** : l'onglet **Catalogue** (articles des marques connectées, taille recommandée affichée sur chaque photo, filtre « dans mon budget »), la question « Quel pantalon je mets avec ma chemise oxford bleue ? » (alerte « chino au linge » remplacé par le gris anthracite), la valise pour Lyon (liste cochable), la fiche de la **Chelsea Marcel** (vue 360° à faire tourner), l'ajout d'une pièce par photo, ou le tableau « Mes tailles par marque » dans le Profil.

**En cas de pépin** : `Shift + D` → *Compte de Léa* ou *Compte de Thomas* remet un compte complet (marques connectées, scan fait) et permet de sauter directement à n'importe quelle étape.

---

## Deux profils de démo

| | Léa Garnier | Thomas Lefèvre |
|---|---|---|
| Profil | 26 ans, chargée de projet marketing, Paris 10e | 28 ans, consultant junior, Paris 11e |
| Style | Streetwear et corporate | Smart casual et costume |
| Dressing | 39 fiches (15 importées, 18 détectées en vidéo, 6 par photo) | 61 fiches (22, 29 et 10) |
| Tailles | S, 36 femme, W27 L30, pointure 38 | M, col 39, W31 L32, pointure 43,5 |
| Exemple de taille | Maison Vérac : **38** (taille petit) ; Atelier Ferrand : **37,5** | Maison Vérac : **50** en veste ; Atelier Ferrand : **43** |

Le profil se choisit à l'inscription (étape « Vous êtes ») ou dans le menu de présentation. Les deux profils ont leurs propres commandes, retours, journal de port, scénarios d'assistant et questions d'enrichissement. Les catalogues sont mixtes : 7 marques fictives, dont **Bitume Club** (streetwear), 213 produits, avec un sélecteur Femme / Homme / Tout.

Design : interface neutre et épurée (une seule police sans-serif, noir, blanc et gris), pour accueillir tous les styles sans connoter le luxe.

## Contenu de la démo

### Parcours

1. **Accueil et compte** (`/`, `/bienvenue`, `/inscription`) : splash, carrousel en 3 écrans, connexion Apple / Google / e-mail simulée, profil, quiz de style (3 tenues parmi 9), couleurs, budget, consentement RGPD granulaire.
2. **Boutiques** (`/boutiques`) : 6 marques fictives ; connexion aux couleurs de la marque, écran d'autorisation, import animé des commandes ; fiche marque avec guide des tailles et tailles calculées pour l'utilisateur.
3. **Scan vidéo** (`/scan`) : vraie vidéo de dressing, cadres de détection animés, compteur, quantités modifiables et dédoublonnage avec les achats importés (vignettes extraites de la vidéo).
4. **Mon dressing** (`/dressing`) : grille filtrable (catégorie, couleur, marque, statut), recherche, statistiques, enrichissement progressif en 2 taps ; fiche article avec historique de port, statut linge, *Marquer comme lavé*, **vue 360°** pour deux articles ; **ajout par photo** (prise de vue, détourage, formulaire pré-rempli et reconnaissance du produit).
5. **Assistant** (`/assistant`) : chat en streaming avec cartes riches (tenue en flat lay, alerte linge, achat avec taille recommandée et indice de confiance, valise cochable), panier et confirmation de commande simulés.
6. **Catalogue** (`/catalogue`) : articles des marques connectées, filtrables par marque, catégorie et budget, avec la taille recommandée sur chaque produit ; fiche produit avec choix de taille, ajout au panier et commande dans l'app, ou **« Voir sur le site »** (`/site/[id]`, boutique de la marque dans le navigateur intégré, taille présélectionnée).
7. **Espace marque** (`/marque`) : tableau de bord de Maison Vérac (Recharts).

### L'assistant IA

`app/api/assistant/route.ts` appelle Claude (`claude-sonnet-5-5`, effort `low` pour la réactivité) en streaming, avec les outils `get_wardrobe`, `get_wear_history`, `get_calendar`, `get_weather`, `search_catalog`, `recommend_size` et `show_cards`. Les cartes sont validées par **Zod** (`lib/cards.ts`), puis nettoyées côté serveur : les identifiants inconnus sont écartés, et la taille est **toujours recalculée** par le moteur de tailles, jamais devinée par le modèle. Le repli serveur `fallbacks: "default"` reroute vers un autre modèle si une réponse est refusée.

**Mode secours** (`lib/scenarios.ts`) : sans clé, si l'API échoue, ou si le réseau est coupé (exécution dans le navigateur), des réponses scénarisées prennent le relais. Elles sont **calculées à partir des vraies données** : statuts linge, agenda, météo, tailles. Si l'on marque le chino beige comme lavé, la réponse change.

### Tailles

`lib/sizing.ts` applique le guide de chaque marque aux tailles habituelles de Thomas (haut M, col 39, W31 L32, veste 48, pointure 43,5) et à son historique de commandes gardées ou retournées :

| Marque | Particularité | Taille de Thomas |
|---|---|---|
| Maison Vérac | Taille petit (+1) | Col **40**, veste **50**, pantalon **42** |
| Ligne Bastide | Normal | **M**, chino **W31 L32** |
| Kolm Denim | W/L, coupe étroite | **W31 L32** |
| Norrland Supply | Taille grand (−1) | **S** |
| Atelier Ferrand | Chausse grand d'une demi-pointure | **43** |
| Studio Rivage | Normal | **M**, pointure **43,5** |

`scripts/generate-data.ts` vérifie que chaque achat importé correspond à la taille donnée par le moteur ; sinon, la génération échoue.

### Données (`data/`)

Générées de façon déterministe (graine fixe) par `npm run data` : 6 marques et leurs guides de tailles, 152 produits (références, matières, stocks, notes, taux de retour), le profil de Thomas, 14 commandes sur 18 mois (dont 3 retours), 61 fiches de garde-robe (22 importées, 29 détectées en vidéo, 10 ajoutées par photo), un journal de port sur 30 jours, l'agenda et la météo (relatifs à la date du jour), et le tableau de bord marque. Les marques ont été vérifiées : aucune ne correspond à une marque existante connue.

### Photos (`public/images`, `public/video`)

- `scripts/fetch-images.ts harvest` récolte les candidats (Pixabay, ou Pexels si la clé est fournie) ; chaque photo a ensuite été **vérifiée à l'œil** : bon vêtement, bonne couleur, homme, aucun texte ni logo lisible. Les photos montrant un logo de marque réelle ont été écartées. Les choix sont consignés dans `data/image-picks.json`, et les fiches articles sont rédigées d'après ce que montre la photo.
- `scripts/fetch-images.ts download` télécharge les photos retenues en haute définition, les recadre au format 4:5 et écrit `data/credits.json` (page *Profil → Crédits photos*).
- `scripts/build-video.sh` assemble la vidéo verticale du dressing (ffmpeg).
- `scripts/generate-images.ts` : option de packshots générés par IA si `OPENAI_API_KEY` est fourni (à vérifier visuellement après génération).
- La vue 360° utilise deux séries de photos du même modèle prises sous plusieurs angles, plutôt qu'un modèle 3D grossier.

### Scripts npm

| Commande | Effet |
|---|---|
| `npm run dev` / `npm run build` / `npm start` | Développement, build (régénère la liste hors ligne), production |
| `npm run data` | Régénère `data/*.json` |
| `npm run images -- harvest` puis `npm run images -- download` | Récolte et téléchargement des photos |
| `npm run images:generate` | Packshots IA (option) |
| `npm run typecheck` | Vérification TypeScript |
