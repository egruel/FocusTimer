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
├── app-settings.js      # Écran de config (durée session, intervalle check-in)
├── messages.json        # Messages d'aide par couleur, stocké en flash
└── app.png              # Icône 48×48px pour le menu système
```

**Responsabilités :**
- `app.js` orchestre les transitions d'état et lit les données depuis le Storage — il ne contient pas les messages en dur
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

Écran rond 240×240px. UI conçue pour un enfant : grand texte, couleurs vives, zones tactiles larges.

### IDLE — Écran de démarrage

```
┌─────────────────────┐
│                     │
│    ⏱  FOCUS        │
│                     │
│   [ 15 min  ▲▼ ]   │  ← BTN1 (+) / BTN2 (-) pour changer la durée
│                     │
│   [ ▶ DÉMARRER ]   │  ← BTN3 ou tap pour lancer
│                     │
└─────────────────────┘
```

### WORKING — Compte à rebours actif

```
┌─────────────────────┐
│   14:32             │  ← temps restant, police large
│                     │
│   ████████░░  80%   │  ← barre de progression
│                     │
│   prochain check    │
│   dans 3 min        │
└─────────────────────┘
```

La montre peut entrer en veille — le timer continue en arrière-plan.

### CHECKIN — Question (précédée d'une vibration)

```
┌─────────────────────┐
│  Comment tu vas ?   │
│                     │
│  ┌─────────────┐    │
│  │  🟢  TOP   │    │  ← zone tactile haute
│  ├─────────────┤    │
│  │ 🟠  MOYEN  │    │  ← zone tactile milieu
│  ├─────────────┤    │
│  │  🔴  BLOQUÉ│    │  ← zone tactile basse
│  └─────────────┘    │
└─────────────────────┘
```

### HELP — Message d'aide (🟠 ou 🔴)

Fond coloré (orange ou rouge), texte court, bouton "OK, compris" pour reprendre.

```
┌─────────────────────┐  ← fond rouge
│                     │
│  Demande de l'aide  │
│  à quelqu'un !      │
│                     │
│   [ OK, compris ]   │
│                     │
└─────────────────────┘
```

Après "OK, compris" → retour à WORKING, le timer reprend là où il s'est arrêté.

### DONE — Fin de session

Vibration longue + écran de célébration (fond vert, emoji, texte "Bravo !").

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
| Veille pendant WORKING | `setInterval` continue, `Bangle.buzz()` réveille pour le check-in |
| BTN1 long pendant la session | Retour menu système natif Bangle.js (comportement standard, non bloqué) |
| Batterie faible | Indicateur discret, session non interrompue |
| Durée ≤ intervalle check-in | Un seul check-in avant la fin, comportement cohérent |
| Timer fin pendant un check-in | DONE prioritaire, pas de superposition d'états |

---

## Contraintes techniques Bangle.js 2

- **Langage :** Espruino JavaScript (subset ES5/ES6, pas de modules npm)
- **Mémoire :** ~64 KB RAM disponibles pour l'app — pas de bibliothèques lourdes
- **Storage flash :** `require('Storage')` pour la persistance
- **Affichage :** `require('Graphics')` via `g` global, 240×240px couleur
- **Entrées :** touchscreen + BTN1 / BTN2 / BTN3
- **Vibration :** `Bangle.buzz(durée_ms, intensité)`
- **Timer :** `setInterval` / `setTimeout` natifs Espruino

---

## Ce qui est hors scope (v1)

- Historique des sessions (pas de log des réponses couleur)
- Synchronisation Bluetooth avec un smartphone
- Sons / musique (le haut-parleur Bangle.js 2 est limité)
- Modes multiples (Pomodoro, chronométre) — une seule app focus