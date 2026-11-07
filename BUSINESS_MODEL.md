# Business Model — Assistant de style IA (B2B2C)

> Nom de code provisoire : **Dressr**
> Version 1 — novembre 2026
> Les chiffres marqués *(hyp.)* sont des hypothèses de travail à valider avec des entretiens clients et des sources de marché.

---

## 1. Le pitch en une phrase

**Dressr est un assistant de style IA que les marques de mode intègrent à leur site et à leur app : il connaît le dressing du client et compose des tenues complètes dans un budget donné. Il propose uniquement les pièces qui manquent, au lieu de faire racheter ce que le client a déjà.**

> *« Une tenue à 100 € pour un date. »*
> → « Tu as déjà le jean brut et les boots marron. Il te manque une chemise : voici trois options entre 39 € et 59 €. Avec la veste en option, tu arrives à 98 €. »

---

## 2. Pourquoi pivoter du B2C vers le B2B (B2B2C)

| | B2C (l'idée de départ) | B2B2C (la vision) |
|---|---|---|
| Acquisition | Coûteuse : CAC élevé, beaucoup d'apps de dressing concurrentes | Les marques apportent le trafic |
| Monétisation | Abonnement (faible taux de conversion) ou affiliation (2 à 8 %) | SaaS plus commission sur les ventes générées |
| Données produit | Il faut scraper ou reconstruire les catalogues | Accès direct au catalogue, aux stocks et aux tailles via une API |
| Données dressing | L'utilisateur doit tout saisir (forte friction) | L'historique d'achat de la marque pré-remplit le dressing |
| Défensibilité | Faible | Intégrations, données et effet réseau du dressing |

**Conclusion :** le B2C ne disparaît pas. Il devient le **compte Dressr** de l'utilisateur, c'est-à-dire un dressing portable qui le suit d'une marque à l'autre. C'est notre avantage concurrentiel (voir §6).

---

## 3. Le problème

### Côté marques
1. **Retours massifs.** En e-commerce mode, le taux de retour se situe souvent entre 20 et 40 % *(hyp. : à sourcer)*, à cause de la taille, du rendu ou de pièces qui ne vont avec rien. Chaque retour coûte de la logistique et de la marge, et pèse sur le bilan carbone.
2. **Panier moyen faible.** Le client achète une pièce isolée au lieu d'une tenue.
3. **Conversion faible.** Avec un catalogue de plusieurs milliers de références, le client ne sait pas quoi choisir et repart sans acheter.
4. **Recommandations génériques.** Les blocs « vous aimerez aussi » ignorent ce que le client possède déjà.

### Côté consommateurs
1. « Je n'ai rien à me mettre » alors que l'armoire est pleine.
2. Achats impulsifs qui ne vont avec rien, puis retour ou pièce jamais portée.
3. Pas de conseil personnalisé en ligne, ou alors un conseil cher (personal shopper).
4. Difficile de tenir un budget précis pour une occasion précise.

---

## 4. La solution

### 4.1 Pour l'utilisateur final (à l'intérieur du site de la marque)
- **Assistant conversationnel** : « une tenue à 100 € pour un date », « un look pour un mariage en septembre », « complète mon look avec ce pantalon ».
- **Dressing digitalisé** :
  - pré-rempli automatiquement avec les achats passés chez la marque ;
  - enrichi par photo (détourage et étiquetage automatique : catégorie, couleur, matière, style) ;
  - plus tard, import des e-mails de confirmation de commande, avec consentement.
- **Composition de tenue « gap-filling »** : le moteur part du dressing et propose uniquement les pièces manquantes, dans le budget fixé.
- **Mode « from scratch »** : sans dressing, il compose une tenue complète (haut, bas, chaussures, accessoires) dans le budget.
- **Vérificateur d'achat** : « Est-ce que cette veste va avec ce que j'ai ? » Il répond par un score de compatibilité et montre trois tenues possibles avec la pièce.
- **Essayage virtuel** (V2) : rendu de la tenue sur une photo de l'utilisateur ou sur un avatar.
- **Conseils de style** adaptés aux goûts, au budget, à la morphologie (déclarative) et aux habitudes.

### 4.2 Pour la marque (back-office)
- Widget ou SDK intégrable en moins d'une journée (Shopify app, script JS, SDK iOS et Android).
- Tableau de bord : ventes assistées, panier moyen, taux de retour comparé au reste du site, requêtes les plus fréquentes.
- **Insights tendances** : occasions demandées, budgets moyens, pièces manquantes les plus fréquentes. Cela alimente le merchandising et les collections.
- Règles métier : mettre en avant le stock, les nouveautés et les pièces à forte marge, exclure les ruptures.

---

## 5. Segments de clients

| Priorité | Segment | Exemples de profils | Cycle de vente | Ticket |
|---|---|---|---|---|
| **1 (GTM)** | Marques DTC mid-market sur Shopify ou Shopify Plus | Marques françaises de prêt-à-porter, 2 à 50 M€ de CA en ligne | 2 à 8 semaines | €€ |
| **2** | Retailers mode et grandes enseignes | Enseignes nationales multi-marques | 6 à 18 mois | €€€€ |
| **3** | Marketplaces et grands magasins | Sites multi-marques | 9 à 18 mois | €€€€ |
| **4 (plus tard)** | Seconde main et location | Plateformes de revente | Variable | €€ |

**Pourquoi commencer par le mid-market Shopify :** le cycle de vente est court, l'intégration se fait par app store et le décideur est unique (fondateur ou head of e-commerce). Ces clients donnent les premières études de cas chiffrées, indispensables pour vendre ensuite aux grands comptes.

**Utilisateurs finaux** : 18 à 45 ans, acheteurs mode en ligne réguliers. Ils veulent mieux s'habiller sans y passer du temps et sont sensibles au budget comme à la consommation responsable (« acheter moins, mieux »).

---

## 6. Proposition de valeur et avantage défendable

### Proposition de valeur pour la marque
> **« Plus de paniers multi-pièces, moins de retours, et un conseiller de style 24h/24 qui connaît vos clients. »**

KPI promis (objectifs à prouver en pilote *(hyp.)*) :
- +15 à 30 % de panier moyen sur les sessions assistées ;
- +20 % de taux de conversion sur les sessions assistées ;
- −10 à 20 % de retours sur les commandes assistées.

### Proposition de valeur pour l'utilisateur
> **« Ton dressing dans ta poche, et un styliste qui te dit quoi porter et quoi acheter (ou pas). »**

### Moat (ce qui nous rend difficile à copier)
1. **Le dressing portable cross-marques** (effet réseau). Un compte Dressr créé chez la marque A est reconnu chez la marque B (« Se connecter avec Dressr »). Plus il y a de marques, plus le dressing est complet, plus les recommandations sont bonnes, et plus les nouvelles marques veulent nous rejoindre.
2. **Graphe de compatibilité vestimentaire** : modèle propriétaire qui apprend quelles pièces vont ensemble, entraîné sur les tenues acceptées, achetées et gardées (non retournées).
3. **Coûts de changement** : intégration au catalogue, règles métier et historique.

### Règle d'or vis-à-vis des marques (point critique)
Dans le widget de la marque A, **seuls les produits de la marque A sont recommandés.** Les pièces d'autres marques ne servent que de *contexte* (« tu as déjà un pantalon beige ») et ne sont jamais montrées comme suggestion d'achat. Sans cette règle, aucune marque ne signera.

---

## 7. Modèle de revenus

### 7.1 B2B : revenu principal

**Modèle hybride : abonnement SaaS plus commission à la performance.**

| Offre | Cible | Abonnement mensuel *(hyp.)* | Commission sur ventes assistées | Inclus |
|---|---|---|---|---|
| **Starter** | Petites marques Shopify | 299 € | 3 % | Widget, 5 000 conversations par mois, dashboard de base |
| **Growth** | Mid-market | 1 490 € | 2 % | 50 000 conversations, règles métier, vérificateur d'achat, A/B test |
| **Enterprise** | Grands comptes | à partir de 8 000 € | 1 à 1,5 % (négocié) | Volume illimité, SDK mobile, essayage virtuel, SSO, SLA, CSM dédié |
| **Setup** | Enterprise | 15 000 à 50 000 € (unique) | – | Intégration PIM, ERP et CRM, entraînement sur le catalogue |

Une **vente assistée** est une commande contenant au moins un produit recommandé par l'assistant, passée dans les 7 jours après l'interaction (attribution à définir contractuellement).

**Pourquoi l'hybride :** l'abonnement couvre les coûts d'inférence IA et assure un revenu prévisible. La commission aligne nos intérêts sur ceux de la marque, ce qui facilite la vente (« vous ne payez que si ça marche »).

### 7.2 Revenus secondaires
- **Data et insights** (anonymisés, agrégés) : rapports tendances vendus aux marques, en module payant (500 à 2 000 € par mois).
- **Compte Dressr Premium** (B2C, plus tard) : 4,99 € par mois. Il donne un dressing illimité, l'essayage virtuel illimité, un planning de tenues et des statistiques (marques les plus achetées, coût par port, pièces jamais portées, « top 10 » de l'année).
- **Affiliation** dans l'app Dressr standalone, pour les marques non partenaires.

---

## 8. Structure de coûts

| Poste | Nature | Commentaire |
|---|---|---|
| Inférence IA (LLM et vision) | Variable | Environ 0,005 à 0,03 € par conversation *(hyp.)*. À optimiser avec le cache, des petits modèles pour l'étiquetage et des embeddings précalculés |
| Essayage virtuel (génération d'images) | Variable | Poste le plus cher, environ 0,03 à 0,10 € par rendu *(hyp.)*. À réserver aux offres Growth et au-dessus |
| Hébergement, base vectorielle, stockage d'images | Semi-variable | |
| Équipe tech et IA | Fixe | Poste principal |
| Sales et customer success | Fixe | Important pour l'Enterprise |
| Conformité (RGPD, AI Act), sécurité, SOC 2 ou ISO 27001 | Fixe | Indispensable pour les grands comptes |

**Objectif de marge brute : 75 % ou plus** (l'abonnement couvre l'inférence et la commission est quasi pure marge).

---

## 9. Concurrence

| Catégorie | Acteurs (exemples) | Leur angle | Notre différence |
|---|---|---|---|
| Apps de dressing B2C | Whering, Acloset, Indyx, Stylebook | Organisation du dressing | Ils n'ont ni catalogue ni transaction. Nous sommes dans le tunnel d'achat des marques |
| Recommandation et « complete the look » B2B | Stylitics, Vue.ai, Syte, Dressipi | Looks éditoriaux et recommandation catalogue | Ils ignorent le dressing réel du client et n'ont ni conversation ni budget |
| Essayage virtuel | Solutions de virtual try-on des géants tech, start-ups VTO | Rendu visuel | L'essayage n'est pour nous qu'une fonctionnalité, pas le produit |
| Assistants des grandes plateformes | Assistants IA internes des grandes marketplaces | Développés en interne | Ils sont limités à leur propre plateforme, alors que notre dressing est cross-marques |
| Chatbots e-commerce génériques | Plateformes de chatbot SAV et vente | FAQ et SAV | Ils n'ont pas de compréhension mode (compatibilité, style, morphologie) |

**Positionnement :** *le seul assistant qui part de ce que le client possède déjà.*

---

## 10. Go-to-market

### Phase 1 : preuve de valeur (mois 0 à 6)
- MVP en web app plus démo widget (voir §13).
- 3 à 5 **pilotes gratuits ou à 50 %** avec des marques DTC françaises, en échange de données de performance et de témoignages.
- Mesure par A/B test : sessions avec assistant comparées aux sessions sans.

### Phase 2 : traction mid-market (mois 6 à 18)
- **App Shopify** publiée (canal d'acquisition self-service).
- Content marketing (études de cas, « comment X a réduit ses retours de 15 % »).
- Salons e-commerce et retail (Paris Retail Week, VivaTech).
- Partenariats avec des agences e-commerce (Shopify Plus partners).

### Phase 3 : grands comptes et réseau (mois 18 et plus)
- Équipe sales Enterprise, certifications sécurité.
- Lancement du **compte Dressr cross-marques** et de l'app standalone, une fois au moins 20 marques partenaires actives.
- Europe : Allemagne, Espagne, Italie, Benelux.

---

## 11. Projections financières (scénario de base *(hyp.)*)

| | Année 1 | Année 2 | Année 3 |
|---|---|---|---|
| Clients Starter | 15 | 80 | 200 |
| Clients Growth | 3 | 25 | 70 |
| Clients Enterprise | 0 | 2 | 8 |
| ARR abonnements | ~110 k€ | ~1,0 M€ | ~2,8 M€ |
| Commissions (sur GMV assistée) | ~60 k€ | ~0,9 M€ | ~3,5 M€ |
| Setup et data | ~20 k€ | ~150 k€ | ~500 k€ |
| **Revenu total** | **~0,19 M€** | **~2,0 M€** | **~6,8 M€** |
| Équipe (ETP) | 5 | 15 | 35 |
| Burn mensuel moyen | ~60 k€ | ~180 k€ | ~350 k€ |

Ces projections sont indicatives. Elles doivent être recalculées après les pilotes, avec les vrais chiffres de GMV assistée et d'uplift.

### Besoin de financement
- **Pre-seed : 500 k€ à 800 k€.** Il finance le MVP, 3 à 5 pilotes, l'app Shopify et 12 à 15 mois de runway (sources : BPI Bourse French Tech, prêt d'honneur, business angels).
- **Seed : 3 à 4 M€** après des pilotes réussis (objectif : 300 à 500 k€ d'ARR et un uplift prouvé).

---

## 12. KPIs à suivre

**Côté produit**
- % de visiteurs qui ouvrent l'assistant
- % de conversations qui aboutissent à une tenue proposée
- Taux d'ajout au panier depuis une tenue
- Nombre de pièces dans le dressing par utilisateur actif

**Côté business (prouvés à la marque)**
- Uplift de conversion, de panier moyen et de baisse des retours (A/B)
- GMV assistée
- Taux de rétention des tenues (articles assistés non retournés)

**Côté SaaS**
- MRR, NRR (cible : plus de 120 % grâce à la commission qui croît avec le client), churn logo, CAC payback (cible : moins de 12 mois)

---

## 13. Risques et réponses

| Risque | Réponse |
|---|---|
| Les marques refusent de partager les données clients | Traitement en tant que sous-traitant RGPD, données cloisonnées par marque, consentement explicite pour le dressing cross-marques |
| Les grandes marques développent l'outil en interne | Viser d'abord le mid-market. L'effet réseau cross-marques est impossible à reproduire seul |
| Qualité des recommandations insuffisante | Boucle de feedback (j'aime, achat, retour), validation par des stylistes humains au début |
| La saisie du dressing rebute l'utilisateur | Pré-remplissage par l'historique d'achat. Le mode « from scratch » fonctionne sans dressing |
| Coûts d'inférence | Petits modèles spécialisés, cache, essayage virtuel réservé aux offres hautes |
| Réglementation (AI Act, RGPD, photos corporelles) | Privacy by design, photos traitées puis supprimées sur demande, transparence sur l'IA |
| Attribution des ventes contestée | Règles d'attribution contractuelles claires et tracking server-side |

---

## 14. Lean Canvas (synthèse)

| Problème | Solution | Proposition de valeur unique | Avantage déloyal | Segments |
|---|---|---|---|---|
| Retours élevés, panier mono-pièce, recommandations génériques, « rien à me mettre » | Assistant IA qui connaît le dressing et compose des tenues dans un budget | **Le seul assistant qui part de ce que vous possédez déjà** | Dressing portable cross-marques (effet réseau) et graphe de compatibilité | Marques DTC mid-market, puis retailers et marketplaces |

| Indicateurs clés | Canaux | Coûts | Revenus |
|---|---|---|---|
| Uplift de panier moyen et de conversion, baisse des retours, GMV assistée, MRR, NRR | App Shopify, ventes directes, agences, salons | Inférence IA, équipe, sales, conformité | SaaS (299 à 8 000 € et plus par mois), commission (1 à 3 %), setup, data, B2C Premium |

---

## 15. Aperçu du périmètre MVP (prochaine étape)

**Objectif du MVP :** prouver que l'IA compose des tenues pertinentes dans un budget, à partir d'un dressing, sur un vrai catalogue. Il doit aussi servir de démo pour signer les premiers pilotes.

**Dans le MVP :**
1. Web app responsive (mobile-first) avec l'assistant conversationnel.
2. Dressing : ajout de pièces par photo, avec étiquetage automatique par IA vision (catégorie, couleur, style).
3. Catalogue de démo : environ 200 à 500 produits d'une marque fictive, ou import d'un flux produit Shopify.
4. Moteur de tenue : demande (occasion et budget), puis dressing et catalogue, puis tenue composée avec les pièces possédées et les pièces à acheter, et le total du budget.
5. Vérificateur d'achat : « ça va avec mon dressing ? »
6. Mini dashboard marque : nombre de conversations, tenues proposées, ajouts au panier.

**Hors MVP (V2 et plus) :** essayage virtuel, app native, compte cross-marques, import des e-mails, SDK mobile.

**Stack proposée :** Next.js (web et widget) avec Supabase (auth, base Postgres et pgvector, stockage) et un LLM multimodal pour le chat et l'étiquetage photo. Déploiement sur Vercel ou Render.
