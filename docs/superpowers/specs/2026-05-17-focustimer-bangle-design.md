# FocusTimer — Bangle.js 2 App Design

**Date :** 2026-05-17
**Cible :** Bangle.js 2 (Espruino JS, standalone)
**Utilisateur :** Enfant de 8 ans avec TDA (Trouble du Déficit de l'Attention)

---

## Objectif

Application autonome sur Bangle.js 2 qui aide un enfant avec TDA à rester concentré pendant une session de travail. L'enfant démarre lui-même la session, la montre vibre périodiquement pour lui demander comment il va, et lui fournit une action concrète s'il est bloqué.

---

## Structure des fichiers

```
focustimer/
├── metadata.json        # Identité App Store : nom, version, icône, permissions
├── app.js               # Machine d'états principale (point d'entrée)
├── widget.js            # Widget "FT" ouvrant l'app depuis une clock compatible
├── app-settings.js      # Écran de config (durée session, intervalle check-in)
├── messages.json        # Messages d'aide par couleur, stocké en flash
├── app.png              # Icône 48×48px pour l'App Loader
└── app-icon.js          # Image Espruino évaluée en focustimer.img pour le launcher
```

**Responsabilités :**
- `app.js` orchestre les transitions d'état et lit les données depuis le Storage — il ne contient pas les messages en dur
- `widget.js` enregistre `WIDGETS.focustimer` et lance `load("focustimer.app.js")` quand sa zone est touchée
- `app-settings.js` est chargé à la demande par le système Bangle.js (menu Réglages) et n'alourdit pas l'app au démarrage
- `messages.json` est éditable indépendamment via l'App Loader — un adulte peut personnaliser les messages sans toucher au code

---

## Machine d'états

```
IDLE ──[démarrer]──► WORKING ──[timer check-in]──► CHECKIN
                        ▲                               │
                        │          ┌────────────────────┘
                        │          ▼
                        │        VERT   → flash encouragement (2s auto) → WORKING
                        │        ORANGE → HELP (fond orange, "OK compris") → WORKING
                        │        ROUGE  → HELP (fond rouge, "OK compris")  → WORKING
                        │
                     [timer fin]
                        │
                        ▼
                       DONE (célébration + vibration longue)
```

L'état courant est stocké dans un objet central unique dans `app.js`. Aucune variable globale d'état éparpillée.

---

## Interface utilisateur

Écran Bangle.js 2 176×176px avec barre widgets de 24px. UI conçue pour un enfant : grand texte, couleurs vives, zones tactiles larges.

### IDLE — Écran de démarrage

```
┌─────────────────────┐
│                     │
│       FOCUS         │
│       Timer         │
│                     │
│  [10] [15] [20]    │  ← gros boutons tactiles circulaires
│                     │
│  choisis une duree │
│                     │
└─────────────────────┘
```

### WORKING — Compte à rebours actif

```
┌─────────────────────┐
│       14:32         │  ← temps restant
│                     │
│    disque rempli    │  ← temps restant, vert → orange → rouge
│                     │
│   check 03:00       │
└─────────────────────┘
```

La montre peut entrer en veille — le timer continue en arrière-plan.

### CHECKIN — Question (précédée d'une vibration)

```
┌─────────────────────┐
│      Ca va ?         │
│                     │
│  ┌─────────────┐    │
│  │  :)  TOP   │    │  ← zone tactile haute
│  ├─────────────┤    │
│  │  :| MOYEN  │    │  ← zone tactile milieu
│  ├─────────────┤    │
│  │  :( BLOQUE │    │  ← zone tactile basse
│  └─────────────┘    │
└─────────────────────┘
```

### HELP — Message d'aide (🟠 ou 🔴)

Bandeau coloré (orange ou rouge), texte court, bouton "OK" pour reprendre. Les écrans de feedback n'utilisent plus de grand disque coloré au centre afin d'éviter toute persistance visuelle derrière le timer.

```
┌─────────────────────┐  ← fond rouge
│                     │
│  Demande aide !     │
│                     │
│        [ OK ]       │
│                     │
└─────────────────────┘
```

Après "OK" → retour à WORKING, le timer reprend là où il s'est arrêté.

### DONE — Fin de session

Vibration en trois temps + écran de célébration.

---

## Données & Storage flash

### `focustimer.json` — Paramètres de session

```json
{
  "workDuration": 15,
  "checkInterval": 5
}
```

Lu au démarrage avec `require('Storage').readJSON('focustimer.json')`. Si absent (premier lancement), les valeurs par défaut ci-dessus s'appliquent — l'app ne plante jamais.

### `messages.json` — Messages d'aide

```json
{
  "green":  "Super ! Continue comme ça !",
  "orange": "Respire, relis ta dernière phrase.",
  "red":    "Demande de l'aide à quelqu'un !"
}
```

Si absent, des messages par défaut sont définis dans `app.js` en fallback.

---

## Gestion des cas limites

| Situation | Comportement |
|---|---|
| Premier lancement (pas de fichiers JSON) | Valeurs par défaut silencieuses, pas d'erreur |
| Veille pendant WORKING | `setInterval` continue, `Bangle.setLCDPower(1)` et `Bangle.setLocked(false)` affichent le check-in |
| Bouton long pendant la session | Retour menu système natif Bangle.js (comportement standard, non bloqué) |
| App lancée depuis une clock | Le widget `FT` ouvre `focustimer.app.js` si la clock charge les widgets |
| Durée ≤ intervalle check-in | Un seul check-in avant la fin, comportement cohérent |
| Timer fin pendant un check-in | DONE prioritaire, pas de superposition d'états |

---

## Contraintes techniques Bangle.js 2

- **Langage :** Espruino JavaScript (subset ES5/ES6, pas de modules npm)
- **Mémoire :** ~64 KB RAM disponibles pour l'app — pas de bibliothèques lourdes
- **Storage flash :** `require('Storage')` pour la persistance
- **Affichage :** `Graphics` via `g` global, 176×176px couleur sur Bangle.js 2
- **Entrées :** touchscreen + bouton système Bangle.js 2
- **Vibration :** `Bangle.buzz(durée_ms, intensité)`
- **Timer :** `setInterval` / `setTimeout` natifs Espruino
- **Widgets :** fichier `focustimer.wid.js`, chargé par `Bangle.loadWidgets()`
- **Icône launcher :** `app.png` pour l'App Loader, `app-icon.js` évalué en `focustimer.img` sur la montre

---

## Ce qui est hors scope (v1)

- Historique des sessions (pas de log des réponses couleur)
- Synchronisation Bluetooth avec un smartphone
- Sons / musique (le haut-parleur Bangle.js 2 est limité)
- Modes multiples (Pomodoro, chronométre) — une seule app focus
