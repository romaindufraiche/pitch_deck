# Vidéo de pitch Dressr

`dressr-pitch.mp4` : 1 min 44, 1920 × 1080, 30 i/s, H.264 + AAC (22 Mo).

## Déroulé

| Temps | Séquence |
|---|---|
| 0:00 | Accroche : « Une armoire pleine. Et rien à se mettre. » |
| 0:07 | Le problème (achats qui ne vont avec rien, tailles devinées, retours) |
| 0:15 | Révélation du logo et des 5 styles |
| 0:22 | 01 · Connexion des boutiques (import des commandes et des tailles) |
| 0:32 | 02 · Scan vidéo du dressing |
| 0:42 | 03 · Dressing à jour et vue 360° |
| 0:50 | 04 · Styliste IA : « J'ai 80 €, fais-moi une tenue » jusqu'au paiement |
| 1:04 | 05 · La bonne taille du premier coup (38 chez Maison Vérac, confiance 97 %) |
| 1:15 | 06 · Pour elle, pour lui, tous les styles |
| 1:22 | Pour les marques : 9,4 % de retours vs 27,4 %, panier 157 €, 12 400 clients, ROI × 3,7 |
| 1:36 | Fin : « Achetez moins. Achetez juste. » + lien de la démo |

Les chiffres marques sont ceux de la démo (marque fictive), signalés à l'écran.

## Refaire la vidéo

```bash
cd demo && npm run build && npx next start -p 3300 &      # l'app en production
node marketing/record-clips.js http://localhost:3300       # 1. enregistre les séquences de l'app
# 2. extraction des images (recadrage du quart haut-gauche produit par l'enregistreur)
for f in marketing/clips/*.webm; do n=$(basename $f .webm); mkdir -p marketing/build/frames/$n; \
  ffmpeg -y -i $f -vf "crop=390:844:0:0,scale=780:1688:flags=lanczos,fps=30" -q:v 3 marketing/build/frames/$n/%05d.jpg; done
node marketing/render.js                                   # 3. rendu image par image de composition.html
python3 marketing/music.py marketing/build/music.wav       # 4. bande-son synthétisée (originale, libre de droits)
ffmpeg -y -i marketing/build/video-silent.mp4 -i marketing/build/music.wav -c:v copy -c:a aac -b:a 192k \
  -af volume=0.85 -shortest -movflags +faststart marketing/dressr-pitch.mp4
```

- `composition.html` : toute l'animation (textes, transitions, téléphones 3D, compteurs). Ouvrir avec `?play` pour la prévisualiser en temps réel, `?t=58` pour un instant précis. Les textes et le minutage se modifient directement dans ce fichier.
- `music.py` : musique 120 BPM générée par code (aucun sample externe). Pour utiliser une autre musique, remplacez `music.wav` à l'étape 4.
