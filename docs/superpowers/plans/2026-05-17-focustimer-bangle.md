# FocusTimer — Bangle.js 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire une app Bangle.js 2 standalone qui aide un enfant de 8 ans avec TDA à rester concentré via des sessions de travail minutées et des check-ins périodiques avec code couleur.

**Architecture:** Structure compatible App Store Bangle.js en 5 fichiers. `app.js` héberge une machine d'états centrale (IDLE → WORKING → CHECKIN → HELP → DONE) et toutes les fonctions de rendu. Les fonctions pures (formatage temps, progression, config par défaut) sont extraites en tête de fichier et testées avec Node.js + `assert` avant d'être intégrées dans l'app. Le code Bangle-spécifique (Storage, Graphics, buzz, touch) reste dans `app.js`.

**Tech Stack:** Espruino JavaScript (Bangle.js 2 SDK), Node.js + `assert` (tests des fonctions pures uniquement)

---

## Carte des fichiers

| Fichier | Responsabilité |
|---|---|
| `focustimer/metadata.json` | Identité App Store (nom, version, icône, permissions, liste storage) |
| `focustimer/app.js` | Machine d'états, timers, rendu UI, gestion touch |
| `focustimer/app-settings.js` | Menu réglages (durée travail, intervalle check-in) |
| `focustimer/messages.json` | Messages d'aide par couleur (éditable sans toucher au code) |
| `focustimer/app.png` | Icône 48×48px pour le launcher Bangle.js |
| `focustimer/tests/logic.test.js` | Tests Node.js des fonctions pures |

---

### Task 1 : Initialisation git + scaffold projet

**Files:**
- Create: `focustimer/metadata.json`
- Create: `focustimer/messages.json`
- Create: `focustimer/tests/` (répertoire)

- [ ] **Step 1 : Initialiser git**

```bash
cd /home/egruel/PhpstormProjects/deden.2.0
git init
git add .gitignore 2>/dev/null || true
```

Expected : `Initialized empty Git repository in .../deden.2.0/.git/`

- [ ] **Step 2 : Créer l'arborescence focustimer**

```bash
mkdir -p focustimer/tests
```

- [ ] **Step 3 : Écrire metadata.json**

Créer `focustimer/metadata.json` :

```json
{
  "id": "focustimer",
  "name": "Focus Timer",
  "version": "0.01",
  "description": "Timer avec check-ins pour enfants TDA",
  "icon": "app.png",
  "type": "app",
  "tags": "productivity",
  "supports": ["BANGLEJS2"],
  "storage": [
    {"name": "focustimer.app.js",      "url": "app.js"},
    {"name": "focustimer.settings.js", "url": "app-settings.js"},
    {"name": "focustimer.msg.json",    "url": "messages.json"},
    {"name": "focustimer.img",         "url": "app.png", "evaluate": true}
  ]
}
```

- [ ] **Step 4 : Écrire messages.json**

Créer `focustimer/messages.json` :

```json
{
  "green":  "Super ! Continue comme ça !",
  "orange": "Respire, relis ta dernière phrase.",
  "red":    "Demande de l'aide à quelqu'un !"
}
```

- [ ] **Step 5 : Créer un placeholder d'icône**

```bash
# Icône temporaire 1x1 pixel PNG (base64 minimal valide)
echo 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' | base64 -d > focustimer/app.png
```

Note : remplacer `app.png` par une vraie icône 48×48px verte avec "⏱" avant publication sur l'App Store.

- [ ] **Step 6 : Commit**

```bash
git add focustimer/
git commit -m "feat: scaffold FocusTimer Bangle.js 2 app structure"
```

---

### Task 2 : Fonctions pures + tests Node.js

**Files:**
- Create: `focustimer/tests/logic.test.js`

Ces fonctions seront copiées verbatim en tête de `app.js` dans la tâche suivante. Les tester en isolation garantit leur exactitude avant d'introduire les APIs Bangle.

- [ ] **Step 1 : Écrire les tests avec les stubs vides**

Créer `focustimer/tests/logic.test.js` :

```javascript
var assert = require('assert');

// ── Fonctions à tester (stubs — seront implémentées step 3) ─────────────────
function formatTime(totalSeconds) {}
function calcProgress(elapsedSeconds, totalSeconds) {}
function getDefaultConfig() {}
function secondsUntilNextCheck(elapsedSeconds, checkIntervalSeconds) {}

// ── Tests formatTime ─────────────────────────────────────────────────────────
assert.strictEqual(formatTime(0),    '00:00', 'zéro');
assert.strictEqual(formatTime(65),   '01:05', '65 secondes');
assert.strictEqual(formatTime(599),  '09:59', '599 secondes');
assert.strictEqual(formatTime(900),  '15:00', '15 minutes');

// ── Tests calcProgress ───────────────────────────────────────────────────────
assert.strictEqual(calcProgress(0,   900),   0,   'début');
assert.strictEqual(calcProgress(450, 900),  50,   'moitié');
assert.strictEqual(calcProgress(900, 900), 100,   'fin');
assert.strictEqual(calcProgress(950, 900), 100,   'dépassement plafonné à 100');

// ── Tests getDefaultConfig ───────────────────────────────────────────────────
var cfg = getDefaultConfig();
assert.strictEqual(cfg.workDuration,  15, 'durée par défaut 15 min');
assert.strictEqual(cfg.checkInterval,  5, 'intervalle par défaut 5 min');

// ── Tests secondsUntilNextCheck ──────────────────────────────────────────────
assert.strictEqual(secondsUntilNextCheck(0,   300), 300, 'début, intervalle 5min');
assert.strictEqual(secondsUntilNextCheck(299, 300),   1, 'une seconde avant premier check');
assert.strictEqual(secondsUntilNextCheck(300, 300), 300, 'juste après premier check');
assert.strictEqual(secondsUntilNextCheck(310, 300), 290, 'milieu du deuxième intervalle');

console.log('Tous les tests passent.');
```

- [ ] **Step 2 : Lancer les tests — vérifier qu'ils échouent**

```bash
node focustimer/tests/logic.test.js
```

Expected : `AssertionError [ERR_ASSERTION]: 'zéro'` (ou similaire — les stubs retournent `undefined`)

- [ ] **Step 3 : Implémenter les fonctions dans le fichier de test**

Remplacer les quatre stubs vides par :

```javascript
function formatTime(totalSeconds) {
  var m = Math.floor(totalSeconds / 60);
  var s = totalSeconds % 60;
  return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

function calcProgress(elapsedSeconds, totalSeconds) {
  if (totalSeconds === 0) return 100;
  return Math.min(100, Math.floor((elapsedSeconds / totalSeconds) * 100));
}

function getDefaultConfig() {
  return { workDuration: 15, checkInterval: 5 };
}

function secondsUntilNextCheck(elapsedSeconds, checkIntervalSeconds) {
  var remaining = checkIntervalSeconds - (elapsedSeconds % checkIntervalSeconds);
  return remaining === checkIntervalSeconds && elapsedSeconds > 0 ? checkIntervalSeconds : remaining;
}
```

- [ ] **Step 4 : Lancer les tests — vérifier qu'ils passent**

```bash
node focustimer/tests/logic.test.js
```

Expected : `Tous les tests passent.`

- [ ] **Step 5 : Commit**

```bash
git add focustimer/tests/logic.test.js
git commit -m "feat: fonctions pures avec tests Node.js (formatTime, calcProgress, getDefaultConfig, secondsUntilNextCheck)"
```

---

### Task 3 : Machine d'états + écran IDLE

**Files:**
- Create: `focustimer/app.js`

- [ ] **Step 1 : Créer app.js complet avec machine d'états et écran IDLE**

Note matérielle : la **Bangle.js 2 n'a qu'un seul bouton physique** (BTN1). Toute interaction de l'app passe par le **touchscreen**. BTN1 (appui long) est réservé au menu système Bangle.js — on n'y attache aucun handler pour ne pas interférer.

L'écran IDLE utilise trois zones tactiles :
- Zone gauche (x < 80) : diminuer la durée (−5 min)
- Zone droite (x > 160) : augmenter la durée (+5 min)
- Zone basse (y > 188) : démarrer la session

Créer `focustimer/app.js` :

```javascript
// ── Fonctions pures (testées dans tests/logic.test.js) ──────────────────────
function formatTime(totalSeconds) {
  var m = Math.floor(totalSeconds / 60);
  var s = totalSeconds % 60;
  return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

function calcProgress(elapsedSeconds, totalSeconds) {
  if (totalSeconds === 0) return 100;
  return Math.min(100, Math.floor((elapsedSeconds / totalSeconds) * 100));
}

function getDefaultConfig() {
  return { workDuration: 15, checkInterval: 5 };
}

function secondsUntilNextCheck(elapsedSeconds, checkIntervalSeconds) {
  var remaining = checkIntervalSeconds - (elapsedSeconds % checkIntervalSeconds);
  return remaining === checkIntervalSeconds && elapsedSeconds > 0 ? checkIntervalSeconds : remaining;
}

// ── Config & messages ────────────────────────────────────────────────────────
var cfg  = require('Storage').readJSON('focustimer.json',    true) || getDefaultConfig();
var msgs = require('Storage').readJSON('focustimer.msg.json', true) || {
  green:  'Super ! Continue comme ca !',
  orange: 'Respire, relis ta derniere phrase.',
  red:    "Demande de l'aide a quelqu'un !"
};

// ── État central ─────────────────────────────────────────────────────────────
var state = {
  screen:    'IDLE',
  totalSec:  cfg.workDuration  * 60,
  checkEvery: cfg.checkInterval * 60,
  elapsed:   0,
  tickTimer: null,
  helpColor: null
};

// ── Couleurs ─────────────────────────────────────────────────────────────────
var C = {
  green:  g.toColor(0, 0.8, 0.2),
  orange: g.toColor(1, 0.55, 0),
  red:    g.toColor(0.9, 0.1, 0.1),
  white:  g.toColor(1, 1, 1),
  black:  g.toColor(0, 0, 0),
  grey:   g.toColor(0.3, 0.3, 0.3)
};

// ── Rendu IDLE ───────────────────────────────────────────────────────────────
function drawIdle() {
  g.clear();

  // Titre
  g.setColor(C.white);
  g.setFont('Vector', 26);
  g.setFontAlign(0, 0);
  g.drawString('FOCUS', 120, 44);

  // Bouton "-" (zone gauche)
  g.setColor(C.grey);
  g.fillRect(10, 78, 78, 148);
  g.setColor(C.white);
  g.setFont('Vector', 44);
  g.drawString('-', 44, 113);

  // Durée au centre
  g.setFont('Vector', 38);
  g.drawString(cfg.workDuration + 'min', 120, 113);

  // Bouton "+" (zone droite)
  g.setColor(C.grey);
  g.fillRect(162, 78, 230, 148);
  g.setColor(C.white);
  g.setFont('Vector', 44);
  g.drawString('+', 196, 113);

  // Bouton DEMARRER (zone basse)
  g.setColor(C.green);
  g.fillRect(50, 165, 190, 210);
  g.setColor(C.black);
  g.setFont('Vector', 22);
  g.drawString('DEMARRER', 120, 188);
}

// ── Gestionnaire touch global ─────────────────────────────────────────────────
Bangle.on('touch', function(btn, xy) {
  if (state.screen === 'IDLE') {
    if (xy.y > 165) {
      startSession();
    } else if (xy.x < 80) {
      cfg.workDuration = Math.max(5, cfg.workDuration - 5);
      state.totalSec   = cfg.workDuration * 60;
      drawIdle();
    } else if (xy.x > 160) {
      cfg.workDuration = Math.min(60, cfg.workDuration + 5);
      state.totalSec   = cfg.workDuration * 60;
      drawIdle();
    }
    return;
  }
  if (state.screen === 'CHECKIN')               { handleCheckinTouch(xy.y); return; }
  if (state.screen === 'HELP'    && xy.y > 188) { resumeWorking();          return; }
  if (state.screen === 'DONE')                  { goIdle();                 return; }
});

// ── Contrôle de session ───────────────────────────────────────────────────────
function startSession() {
  state.screen    = 'WORKING';
  state.elapsed   = 0;
  state.totalSec  = cfg.workDuration  * 60;
  state.checkEvery = cfg.checkInterval * 60;
  state.tickTimer = setInterval(tick, 1000);
  drawWorking();
}

function tick() {
  state.elapsed++;
  if (state.elapsed >= state.totalSec) {
    clearInterval(state.tickTimer);
    state.tickTimer = null;
    state.screen = 'DONE';
    drawDone();
    return;
  }
  if (state.elapsed % state.checkEvery === 0) {
    clearInterval(state.tickTimer);
    state.tickTimer = null;
    state.screen = 'CHECKIN';
    Bangle.buzz(400);
    setTimeout(function() { Bangle.buzz(200); }, 600);
    drawCheckin();
    return;
  }
  drawWorking();
}

function resumeWorking() {
  state.screen    = 'WORKING';
  state.tickTimer = setInterval(tick, 1000);
  drawWorking();
}

function goIdle() {
  state.screen = 'IDLE';
  drawIdle();
}

// ── Stubs — remplacés dans les tâches suivantes ───────────────────────────────
function drawWorking()          { /* Task 4 */ }
function drawCheckin()          { /* Task 5 */ }
function handleCheckinTouch(y)  { /* Task 5 */ }
function drawHelp()             { /* Task 6 */ }
function drawDone()             { /* Task 7 */ }

// ── Démarrage ─────────────────────────────────────────────────────────────────
Bangle.loadWidgets();
Bangle.drawWidgets();
drawIdle();
```

- [ ] **Step 2 : Vérifier dans l'émulateur Bangle.js**

Ouvrir l'IDE Espruino (Espruino Web IDE), coller le contenu de `app.js` dans l'éditeur, exécuter sur l'émulateur Bangle.js 2. Vérifier :
- Titre "FOCUS" en haut
- Bouton gris "-" à gauche, durée "15min" au centre, bouton gris "+" à droite
- Bouton vert "DEMARRER" en bas
- Tap zone gauche ("-") : durée diminue de 5 en 5 (min 5)
- Tap zone droite ("+") : durée augmente de 5 en 5 (max 60)
- Tap bouton DEMARRER : passe à WORKING (écran vide pour l'instant — stub)

- [ ] **Step 3 : Commit**

```bash
git add focustimer/app.js
git commit -m "feat: machine d'états et écran IDLE avec sélecteur de durée"
```

---

### Task 4 : Écran WORKING + décompte

**Files:**
- Modify: `focustimer/app.js` — remplacer le stub `drawWorking`

- [ ] **Step 1 : Remplacer le stub drawWorking**

Dans `app.js`, remplacer `function drawWorking() { /* Task 4 */ }` par :

```javascript
function drawWorking() {
  var remaining   = state.totalSec - state.elapsed;
  var progress    = calcProgress(state.elapsed, state.totalSec);
  var untilCheck  = secondsUntilNextCheck(state.elapsed, state.checkEvery);

  g.clear();

  // Temps restant — police large
  g.setColor(C.white);
  g.setFont('Vector', 52);
  g.setFontAlign(0, 0);
  g.drawString(formatTime(remaining), 120, 78);

  // Barre de progression (fond gris + remplissage vert)
  var bx = 30, by = 128, bw = 180, bh = 14;
  g.setColor(C.grey);
  g.fillRect(bx, by, bx + bw, by + bh);
  g.setColor(C.green);
  g.fillRect(bx, by, bx + Math.floor(bw * progress / 100), by + bh);

  // Prochain check-in
  g.setColor(C.white);
  g.setFont('Vector', 18);
  g.drawString('check dans ' + formatTime(untilCheck), 120, 163);
}
```

- [ ] **Step 2 : Vérifier dans l'émulateur**

Uploader `app.js` → tap DEMARRER → vérifier :
- Timer démarre à "15:00" et décompte chaque seconde
- Barre de progression s'allonge de gauche à droite
- "check dans MM:SS" décroît vers 0
- À 5 minutes (elapsed = 300) : double buzz, écran CHECKIN (stub vide — normal)

- [ ] **Step 3 : Commit**

```bash
git add focustimer/app.js
git commit -m "feat: écran WORKING avec décompte et barre de progression"
```

---

### Task 5 : Écran CHECKIN + zones tactiles

**Files:**
- Modify: `focustimer/app.js` — remplacer les stubs `drawCheckin` et `handleCheckinTouch`

- [ ] **Step 1 : Remplacer le stub drawCheckin**

Dans `app.js`, remplacer `function drawCheckin() { /* Task 5 */ }` par :

```javascript
function drawCheckin() {
  g.clear();
  g.setColor(C.white);
  g.setFont('Vector', 22);
  g.setFontAlign(0, 0);
  g.drawString('Comment tu vas ?', 120, 26);

  // Zone verte (haut)
  g.setColor(C.green);
  g.fillRect(10, 48, 230, 113);
  g.setColor(C.black);
  g.setFont('Vector', 28);
  g.drawString('TOP', 120, 81);

  // Zone orange (milieu)
  g.setColor(C.orange);
  g.fillRect(10, 118, 230, 183);
  g.setColor(C.black);
  g.drawString('MOYEN', 120, 151);

  // Zone rouge (bas)
  g.setColor(C.red);
  g.fillRect(10, 188, 230, 235);
  g.setColor(C.white);
  g.drawString('BLOQUE', 120, 212);
}
```

- [ ] **Step 2 : Remplacer le stub handleCheckinTouch**

Dans `app.js`, remplacer `function handleCheckinTouch(y) { /* Task 5 */ }` par :

```javascript
function handleCheckinTouch(y) {
  if (y < 118) {
    // Vert : flash d'encouragement 2s puis reprise automatique
    g.clear();
    g.setColor(C.green);
    g.fillRect(0, 0, 240, 240);
    g.setColor(C.black);
    g.setFont('Vector', 24);
    g.setFontAlign(0, 0);
    // Découpe le message en deux lignes si nécessaire
    var words = msgs.green.split(' '), lines = [], line = '';
    words.forEach(function(w) {
      if ((line + ' ' + w).trim().length > 16) { lines.push(line.trim()); line = w; }
      else { line = (line + ' ' + w).trim(); }
    });
    if (line) lines.push(line);
    var startY = 110 - (lines.length - 1) * 22;
    lines.forEach(function(l, i) { g.drawString(l, 120, startY + i * 44); });
    state.screen = 'WORKING';
    setTimeout(resumeWorking, 2000);
  } else if (y < 188) {
    // Orange : écran HELP orange
    state.helpColor = 'orange';
    state.screen    = 'HELP';
    drawHelp();
  } else {
    // Rouge : écran HELP rouge
    state.helpColor = 'red';
    state.screen    = 'HELP';
    drawHelp();
  }
}
```

- [ ] **Step 3 : Vérifier dans l'émulateur**

Uploader `app.js` → démarrer session → attendre 5 min (ou réduire `checkInterval` à 1 dans la config pour tester) → vérifier :
- Trois zones colorées occupent l'écran
- Tap zone verte → fond vert avec message d'encouragement, reprise auto après 2s
- Tap zone orange → écran HELP (stub vide pour l'instant)
- Tap zone rouge → écran HELP (stub vide pour l'instant)

Pour tester rapidement sans attendre 5 min, modifier temporairement `cfg.checkInterval` à 1 dans le code.

- [ ] **Step 4 : Commit**

```bash
git add focustimer/app.js
git commit -m "feat: écran CHECKIN avec trois zones tactiles couleur"
```

---

### Task 6 : Écran HELP

**Files:**
- Modify: `focustimer/app.js` — remplacer le stub `drawHelp`

- [ ] **Step 1 : Remplacer le stub drawHelp**

Dans `app.js`, remplacer `function drawHelp() { /* Task 6 */ }` par :

```javascript
function drawHelp() {
  var isRed  = state.helpColor === 'red';
  var bgColor = isRed ? C.red : C.orange;
  var msg     = isRed ? msgs.red : msgs.orange;

  g.clear();
  g.setColor(bgColor);
  g.fillRect(0, 0, 240, 240);

  // Découpe le message en lignes (max 16 chars par ligne)
  var words = msg.split(' '), lines = [], line = '';
  words.forEach(function(w) {
    if ((line + ' ' + w).trim().length > 16) { lines.push(line.trim()); line = w; }
    else { line = (line + ' ' + w).trim(); }
  });
  if (line) lines.push(line);

  g.setColor(C.white);
  g.setFont('Vector', 26);
  g.setFontAlign(0, 0);
  var startY = 95 - (lines.length - 1) * 20;
  lines.forEach(function(l, i) { g.drawString(l, 120, startY + i * 44); });

  // Bouton "OK, compris"
  g.setColor(C.white);
  g.fillRect(45, 192, 195, 230);
  g.setColor(bgColor);
  g.setFont('Vector', 20);
  g.drawString('OK, compris', 120, 211);
}
```

- [ ] **Step 2 : Vérifier dans l'émulateur**

Uploader `app.js` → déclencher un check-in → tap zone orange → vérifier :
- Fond orange
- Texte du message `msgs.orange` affiché lisiblement (retour à la ligne si besoin)
- Bouton blanc "OK, compris" en bas
- Tap sur le bouton → retour à WORKING, timer reprend

Répéter pour la zone rouge avec `msgs.red`.

- [ ] **Step 3 : Commit**

```bash
git add focustimer/app.js
git commit -m "feat: écran HELP avec fond coloré et message d'aide"
```

---

### Task 7 : Écran DONE

**Files:**
- Modify: `focustimer/app.js` — remplacer le stub `drawDone`

- [ ] **Step 1 : Remplacer le stub drawDone**

Dans `app.js`, remplacer `function drawDone() { /* Task 7 */ }` par :

```javascript
function drawDone() {
  g.clear();
  g.setColor(C.green);
  g.fillRect(0, 0, 240, 240);

  g.setColor(C.white);
  g.setFont('Vector', 44);
  g.setFontAlign(0, 0);
  g.drawString('Bravo !', 120, 88);

  g.setFont('Vector', 64);
  g.drawString(':)', 120, 158);

  // Séquence de buzz festive : court-court-long
  Bangle.buzz(200);
  setTimeout(function() { Bangle.buzz(200); }, 400);
  setTimeout(function() { Bangle.buzz(600); }, 800);
}
```

Note : l'emoji 🎉 n'est pas disponible dans la police Vector Espruino — `:)` est utilisé à la place. Remplacer par une image bitmap si une icône plus riche est souhaitée.

- [ ] **Step 2 : Vérifier dans l'émulateur**

Pour tester rapidement : réduire `workDuration` à 1 min dans la config → démarrer session → attendre 1 min → vérifier :
- Fond vert, "Bravo !" en grand, ":)" en dessous
- Trois buzzs (court-court-long)
- Tap sur l'écran → retour à IDLE

- [ ] **Step 3 : Commit**

```bash
git add focustimer/app.js
git commit -m "feat: écran DONE avec célébration et buzz festif"
```

---

### Task 8 : Écran de réglages

**Files:**
- Create: `focustimer/app-settings.js`

- [ ] **Step 1 : Créer app-settings.js**

```javascript
// focustimer/app-settings.js
(function(back) {
  var settings = require('Storage').readJSON('focustimer.json', true) || {
    workDuration: 15,
    checkInterval: 5
  };

  E.showMenu({
    '': { 'title': 'Focus Timer' },
    '< Retour': back,
    'Duree travail (min)': {
      value: settings.workDuration,
      min: 5, max: 60, step: 5,
      onchange: function(v) {
        settings.workDuration = v;
        require('Storage').writeJSON('focustimer.json', settings);
      }
    },
    'Intervalle check (min)': {
      value: settings.checkInterval,
      min: 1, max: 15, step: 1,
      onchange: function(v) {
        settings.checkInterval = v;
        require('Storage').writeJSON('focustimer.json', settings);
      }
    }
  });
})
```

- [ ] **Step 2 : Vérifier dans l'émulateur**

Dans l'émulateur Bangle.js : Settings → Apps → Focus Timer → Settings → vérifier :
- "Duree travail (min)" : cycles 5/10/…/60 avec BTN1/BTN2
- "Intervalle check (min)" : cycles 1/2/…/15
- Relancer l'app → les valeurs modifiées sont appliquées (lues depuis `focustimer.json`)

- [ ] **Step 3 : Commit**

```bash
git add focustimer/app-settings.js
git commit -m "feat: écran de réglages (durée session et intervalle check-in)"
```

---

### Task 9 : Test end-to-end complet

**Files:** aucun fichier modifié — validation manuelle uniquement

- [ ] **Step 1 : Lancer les tests unitaires**

```bash
node focustimer/tests/logic.test.js
```

Expected : `Tous les tests passent.`

- [ ] **Step 2 : Checklist de validation dans l'émulateur Bangle.js**

Uploader tous les fichiers (`app.js`, `app-settings.js`, `messages.json`, `metadata.json`) dans l'émulateur.

| # | Scénario | Résultat attendu |
|---|---|---|
| 1 | Lancement app | Écran IDLE : "⏱ FOCUS", "15 min", bouton vert |
| 2 | BTN1 (×3) | Durée passe à 30 min |
| 3 | BTN2 (×2) | Durée revient à 20 min |
| 4 | BTN1 au-delà de 60 min | Bloqué à 60 min |
| 5 | BTN2 en dessous de 5 min | Bloqué à 5 min |
| 6 | Tap DEMARRER | Écran WORKING : "20:00" qui décompte, barre vide |
| 7 | Après 30s | Barre à ~2%, "check dans 04:30" |
| 8 | À 5 min (elapsed=300) | Double buzz, écran CHECKIN apparaît |
| 9 | Tap zone verte | Flash vert + message, reprise auto 2s |
| 10 | À 10 min (elapsed=600) | Double buzz, écran CHECKIN |
| 11 | Tap zone orange | Fond orange, message orange, bouton "OK" |
| 12 | Tap "OK, compris" | Retour WORKING, timer reprend |
| 13 | À 15 min (elapsed=900) | Double buzz, écran CHECKIN |
| 14 | Tap zone rouge | Fond rouge, message rouge, bouton "OK" |
| 15 | Tap "OK, compris" | Retour WORKING, timer reprend |
| 16 | Fin session (20 min) | Écran vert "Bravo !", 3 buzzs, tap → IDLE |
| 17 | Réglages : durée = 10 min | App redémarre avec 10 min |
| 18 | Réglages : intervalle = 2 min | Check-in toutes les 2 min |

- [ ] **Step 3 : Commit final**

```bash
git add .
git commit -m "feat: FocusTimer v0.01 — app complète et validée"
```

---

## Notes d'installation sur la montre réelle

1. Installer via l'App Loader Bangle.js : ouvrir l'App Loader officiel dans Chrome, connecter la montre en Bluetooth, cliquer "Upload" depuis le répertoire `focustimer/`
2. Ou via l'IDE Espruino : coller chaque fichier dans l'onglet éditeur et envoyer sur la montre
3. L'app apparaît dans le launcher de la montre sous le nom "Focus Timer"
4. Les réglages sont accessibles via Settings → Apps → Focus Timer → Settings
