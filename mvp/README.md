# Dressr — MVP

Application web mobile-first : ton dressing multi-marques et un styliste IA qui compose tes tenues dans ton budget.

## Fonctionnalités

| Onglet | Ce qu'on peut faire |
|---|---|
| **Styliste** | Demander une tenue en langage naturel : « un date ce soir, 100 € », « trois hauts pour 80 € avec mon chino », « tenue de soirée de zéro pour 200 € ». Les pièces déjà possédées sont marquées « Dans ton dressing », celles qui manquent ont un prix et un bouton d'achat. Le total est comparé au budget. |
| **Mon dressing** | Toutes les pièces, toutes marques confondues : statistiques, **top marques**, filtre par marque, ajout manuel, suppression. |
| **Mes marques** | Import des achats en collant un e-mail de confirmation de commande (exemples Zara et Massimo Dutti fournis). L'IA extrait les articles et les ajoute au dressing. |

## Lancer en local

```bash
cd mvp
npm install
npm run dev
```

Puis ouvrir http://localhost:3000.

### Avec ou sans IA

- **Sans clé API**, l'app tourne avec un **moteur de démo** à base de règles, pratique pour une démo hors ligne.
- **Avec une clé**, le styliste et l'import d'e-mails passent par Claude :

```bash
cp .env.example .env.local   # puis renseigner ANTHROPIC_API_KEY
```

Si un appel à l'API échoue, l'app bascule automatiquement sur le moteur de démo.

## Architecture

```
mvp/
├── app/page.tsx              Interface (3 onglets, dressing stocké dans le navigateur)
├── app/api/stylist/route.ts  POST : demande et dressing → tenues
├── app/api/import/route.ts   POST : texte d'e-mail → articles
├── lib/catalog.ts            Catalogue de démo (produits et prix fictifs), dressing de démo
├── lib/engine.ts             Moteur de règles + vérification des réponses de l'IA
├── lib/ai.ts                 Appels Claude (sorties structurées, cache du catalogue)
└── tests/engine.test.ts      Tests du moteur
```

Garde-fous :
- **L'IA renvoie uniquement des identifiants d'articles.** Le serveur retrouve les vrais articles, ignore les identifiants inventés et **recalcule lui-même les prix et le budget**.
- **Le catalogue est placé dans le prompt système**, mis en cache pour réduire le coût des requêtes suivantes.

## Commandes

```bash
npm test          # tests du moteur
npm run typecheck
npm run build
```

## Limites du MVP (prochaines étapes)

- Le catalogue est fictif : prochaine étape, brancher de vrais flux produits (plateformes d'affiliation, Shopify).
- Le dressing est stocké dans le navigateur : prochaine étape, des comptes utilisateurs et une base de données (Supabase).
- Import par copier-coller : prochaine étape, une adresse de transfert d'e-mails dédiée, puis la connexion à Gmail ou Outlook.
- Pas encore d'ajout de vêtement par photo (vision), ni d'essayage virtuel.
- Pas encore de liens d'affiliation sur le bouton « Acheter ».

*Catalogue et prix de démonstration, fictifs. Dressr n'est pas affilié aux marques citées.*
