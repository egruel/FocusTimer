var assert = require('assert');

// ── Fonctions pures ──────────────────────────────────────────────────────────
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

function sectorSteps(startA, endA, r) {
  var maxSteps = 62;
  return Math.min(maxSteps, Math.max(2, Math.ceil(Math.abs(endA - startA) * r / 3)));
}

function clampFraction(value) {
  return Math.max(0, Math.min(1, value));
}

function timerColorName(fraction) {
  if (fraction > 0.5) return 'green';
  if (fraction > 0.2) return 'orange';
  return 'red';
}

// ── Tests formatTime ─────────────────────────────────────────────────────────
assert.strictEqual(formatTime(0),   '00:00', 'zero');
assert.strictEqual(formatTime(65),  '01:05', '65 secondes');
assert.strictEqual(formatTime(599), '09:59', '599 secondes');
assert.strictEqual(formatTime(900), '15:00', '15 minutes');

// ── Tests calcProgress ───────────────────────────────────────────────────────
assert.strictEqual(calcProgress(0,   900),   0, 'debut');
assert.strictEqual(calcProgress(450, 900),  50, 'moitie');
assert.strictEqual(calcProgress(900, 900), 100, 'fin');
assert.strictEqual(calcProgress(950, 900), 100, 'depassement plafonne a 100');

// ── Tests getDefaultConfig ───────────────────────────────────────────────────
var cfg = getDefaultConfig();
assert.strictEqual(cfg.workDuration,  15, 'duree par defaut 15 min');
assert.strictEqual(cfg.checkInterval,  5, 'intervalle par defaut 5 min');

// ── Tests secondsUntilNextCheck ──────────────────────────────────────────────
assert.strictEqual(secondsUntilNextCheck(0,   300), 300, 'debut, intervalle 5min');
assert.strictEqual(secondsUntilNextCheck(299, 300),   1, 'une seconde avant premier check');
assert.strictEqual(secondsUntilNextCheck(300, 300), 300, 'juste apres premier check');
assert.strictEqual(secondsUntilNextCheck(310, 300), 290, 'milieu du deuxieme intervalle');

// ── Tests sectorSteps ───────────────────────────────────────────────────────
assert.strictEqual(1 + sectorSteps(-Math.PI / 2, -Math.PI / 2 + 2 * Math.PI, 58) + 1 <= 64, true, 'secteur complet compatible fillPoly');

// ── Tests progression visuelle ──────────────────────────────────────────────
assert.strictEqual(clampFraction(1.2), 1, 'progression plafonnee');
assert.strictEqual(clampFraction(-0.2), 0, 'progression minimum');
assert.strictEqual(timerColorName(0.8), 'green', 'debut vert');
assert.strictEqual(timerColorName(0.5), 'orange', 'milieu orange');
assert.strictEqual(timerColorName(0.2), 'red', 'fin rouge');

console.log('Tous les tests passent.');
