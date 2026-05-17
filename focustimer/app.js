// ── Fonctions pures ──────────────────────────────────────────────────────────
function formatTime(totalSeconds) {
  var m = Math.floor(totalSeconds / 60);
  var s = totalSeconds % 60;
  return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

function getDefaultConfig() {
  return { workDuration: 15, checkInterval: 5 };
}

function secondsUntilNextCheck(elapsedSeconds, checkIntervalSeconds) {
  if (elapsedSeconds === 0) return checkIntervalSeconds;
  return checkIntervalSeconds - (elapsedSeconds % checkIntervalSeconds);
}

function clampFraction(value) {
  return Math.max(0, Math.min(1, value));
}

function timerColorName(fraction) {
  if (fraction > 0.5) return 'green';
  if (fraction > 0.2) return 'orange';
  return 'red';
}

// ── Config & messages ────────────────────────────────────────────────────────
var cfg  = require('Storage').readJSON('focustimer.json',     true) || getDefaultConfig();
var msgs = require('Storage').readJSON('focustimer.msg.json', true) || {
  green:  'Super !',
  orange: 'Respire.',
  red:    "Demande aide !"
};

// ── Constantes écran (Bangle.js 2 : 176×176, widget bar 24px) ────────────────
var W  = g.getWidth();
var H  = g.getHeight();
var CX = W / 2;
var WH = 24;

// ── État ─────────────────────────────────────────────────────────────────────
var state = {
  screen:      'IDLE',
  totalSec:    cfg.workDuration  * 60,
  checkEvery:  cfg.checkInterval * 60,
  elapsed:     0,
  tickTimer:   null,
  helpColor:   null,
  lastTimeTxt: ''
};

// ── Couleurs ─────────────────────────────────────────────────────────────────
var C = {
  green:     g.toColor(0, 0.75, 0.2),
  orange:    g.toColor(1, 0.55, 0),
  red:       g.toColor(0.9, 0.1, 0.1),
  blue:      g.toColor(0.2, 0.5, 1),
  navy:      g.toColor(0, 0.08, 0.16),
  panel:     g.toColor(0.08, 0.14, 0.2),
  white:     g.toColor(1, 1, 1),
  black:     g.toColor(0, 0, 0),
  grey:      g.toColor(0.35, 0.35, 0.35),
  lightgrey: g.toColor(0.8, 0.8, 0.8),
  muted:     g.toColor(0.6, 0.72, 0.78),
  track:     g.toColor(0.18, 0.25, 0.3)
};

// Regroupe couleur + message d'aide pour éviter les ternaires parallèles
var HELP = {
  orange: { color: C.orange, msg: msgs.orange },
  red:    { color: C.red,    msg: msgs.red    }
};

// ── Présets IDLE ──────────────────────────────────────────────────────────────
var PRESETS    = [10, 15, 20];
var PRESET_COL = [C.blue, C.green, C.orange];
var PR         = 22;
var PRESET_POS = [
  {x: 30,      y: 108},
  {x: CX,      y: 100},
  {x: W - 30,  y: 108}
];

// ── Helpers graphiques ────────────────────────────────────────────────────────
function fillBg() {
  g.setColor(C.white);
  g.fillRect(0, WH, W - 1, H - 1);
}

function drawPill(x1, y1, x2, y2, color) {
  var r = Math.floor((y2 - y1) / 2);
  g.setColor(color);
  g.fillRect(x1 + r, y1, x2 - r, y2);
  g.fillCircle(x1 + r, y1 + r, r);
  g.fillCircle(x2 - r, y1 + r, r);
}

function drawZone(color, textColor, y1, y2, text, icon) {
  drawPill(16, y1, W - 16, y2, color);
  g.setColor(textColor);
  g.setFont('Vector', 16);
  g.setFontAlign(0, 0);
  g.drawString(icon + '  ' + text, CX, Math.floor((y1 + y2) / 2));
}

function drawSector(cx, cy, r, startA, endA, color) {
  var pts = [cx, cy];
  var steps = sectorSteps(startA, endA, r);
  for (var i = 0; i <= steps; i++) {
    var a = startA + (endA - startA) * i / steps;
    pts.push(Math.round(cx + r * Math.cos(a)));
    pts.push(Math.round(cy + r * Math.sin(a)));
  }
  g.setColor(color);
  g.fillPoly(pts);
}

function sectorSteps(startA, endA, r) {
  var maxSteps = 62; // center point + arc endpoints must stay within fillPoly's 64-point limit
  return Math.min(maxSteps, Math.max(2, Math.ceil(Math.abs(endA - startA) * r / 3)));
}

function drawRing(cx, cy, r, fraction, color) {
  g.setColor(C.lightgrey);
  g.fillCircle(cx, cy, r);

  if (fraction > 0.005) {
    drawSector(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * fraction, color);
  }
}

// ── Navigation d'état ─────────────────────────────────────────────────────────
function goState(screen, drawFn) {
  state.screen = screen;
  drawFn();
}

function stopTimer() {
  clearInterval(state.tickTimer);
  state.tickTimer = null;
}

// ── IDLE ─────────────────────────────────────────────────────────────────────
function drawIdle() {
  fillBg();
  g.setFontAlign(0, 0);
  g.setColor(C.grey);
  g.setFont('Vector', 10);
  g.drawString('FOCUS', CX, 38);
  g.setColor(C.black);
  g.setFont('Vector', 24);
  g.drawString('Timer', CX, 60);

  PRESETS.forEach(function(min, i) {
    var p = PRESET_POS[i];
    g.setColor(C.lightgrey);
    g.fillCircle(p.x, p.y, PR + 5);
    g.setColor(PRESET_COL[i]);
    g.fillCircle(p.x, p.y, PR);
    g.setColor(C.white);
    g.fillCircle(p.x, p.y, PR - 6);
    g.setColor(C.black);
    g.setFont('Vector', i === 1 ? 20 : 17);
    g.drawString('' + min, p.x, p.y - 5);
    g.setFont('Vector', 10);
    g.setColor(C.grey);
    g.drawString('min', p.x, p.y + 12);
  });

  g.setColor(C.grey);
  g.setFont('Vector', 10);
  g.drawString('choisis une duree', CX, 152);
}

// ── WORKING ───────────────────────────────────────────────────────────────────
function drawWorking() {
  var remaining = state.totalSec - state.elapsed;
  var timeTxt   = formatTime(remaining);
  if (timeTxt === state.lastTimeTxt) return;
  state.lastTimeTxt = timeTxt;

  fillBg();

  var cx = CX, cy = 88, r = 60;
  var fraction = clampFraction(state.totalSec > 0 ? remaining / state.totalSec : 0);
  var col = C[timerColorName(fraction)];

  drawRing(cx, cy, r, fraction, col);

  // Temps restant
  g.setColor(C.black);
  g.setFont('Vector', 24);
  g.setFontAlign(0, 0);
  g.drawString(timeTxt, cx, cy - 4);

  g.setColor(col);
  g.fillCircle(cx, cy + 24, 4);

  // Prochain check
  var untilCheck = secondsUntilNextCheck(state.elapsed, state.checkEvery);
  g.setColor(C.grey);
  g.setFont('Vector', 12);
  g.drawString('check ' + formatTime(untilCheck), cx, 162);
}

// ── CHECKIN ───────────────────────────────────────────────────────────────────
function drawCheckin() {
  fillBg();
  g.setColor(C.black);
  g.setFont('Vector', 18);
  g.setFontAlign(0, 0);
  g.drawString('Ca va ?', CX, 38);

  drawZone(C.green,  C.black, 54,  86,  'TOP',    ':)');
  drawZone(C.orange, C.black, 96,  128, 'MOYEN',  ':|');
  drawZone(C.red,    C.white, 138, 170, 'BLOQUE', ':(');
}

function drawGoodFeedback() {
  fillBg();
  drawPill(22, 70, W - 22, 118, C.green);
  g.setColor(C.black);
  g.setFont('Vector', 18);
  g.setFontAlign(0, 0);
  g.drawString(msgs.green, CX, 94);
  g.setColor(C.green);
  g.setFont('Vector', 11);
  g.drawString('on continue', CX, 136);
}

function handleCheckinTouch(y) {
  if (y < 92) {
    state.lastTimeTxt = '';
    goState('WORKING', drawGoodFeedback);
    setTimeout(beginTicking, 2000);
  } else {
    state.helpColor = y < 136 ? 'orange' : 'red';
    goState('HELP', drawHelp);
  }
}

// ── HELP ──────────────────────────────────────────────────────────────────────
function drawHelp() {
  var h       = HELP[state.helpColor];
  var bgColor = h.color;
  var msg     = h.msg;

  fillBg();
  drawPill(18, 58, W - 18, 122, bgColor);

  var words = msg.split(' '), lines = [], line = '';
  words.forEach(function(w) {
    if ((line + ' ' + w).trim().length > 11) { lines.push(line.trim()); line = w; }
    else { line = (line + ' ' + w).trim(); }
  });
  if (line) lines.push(line);

  g.setColor(C.black);
  g.setFont('Vector', 17);
  g.setFontAlign(0, 0);
  var sy = 88 - (lines.length - 1) * 13;
  lines.forEach(function(l, i) { g.drawString(l, CX, sy + i * 28); });

  drawPill(58, 142, 118, 170, C.white);
  g.setColor(C.black);
  g.setFont('Vector', 14);
  g.drawString('OK', CX, 156);
}

// ── DONE ──────────────────────────────────────────────────────────────────────
function drawDone() {
  fillBg();
  g.setColor(C.green);
  g.fillCircle(CX, 88, 70);
  g.setColor(C.white);
  g.fillCircle(CX, 88, 50);
  g.setColor(C.black);
  g.setFont('Vector', 24);
  g.setFontAlign(0, 0);
  g.drawString('Bravo', CX, 74);
  g.setFont('Vector', 22);
  g.drawString('Ayden', CX, 104);
  g.setColor(C.green);
  g.setFont('Vector', 14);
  g.drawString('session terminee', CX, 150);

  Bangle.buzz(200);
  setTimeout(function() { Bangle.buzz(200); }, 400);
  setTimeout(function() { Bangle.buzz(600); }, 800);
}

// ── Touch ─────────────────────────────────────────────────────────────────────
Bangle.on('touch', function(btn, xy) {
  if (state.screen === 'IDLE') {
    for (var i = 0; i < PRESET_POS.length; i++) {
      var p = PRESET_POS[i];
      var dx = xy.x - p.x, dy = xy.y - p.y;
      if (dx * dx + dy * dy < PR * PR) {
        cfg.workDuration = PRESETS[i];
        state.totalSec   = cfg.workDuration * 60;
        startSession();
        return;
      }
    }
    return;
  }
  if (state.screen === 'CHECKIN')               { handleCheckinTouch(xy.y); return; }
  if (state.screen === 'HELP'   && xy.y > 130)  { beginTicking();           return; }
  if (state.screen === 'DONE')                  { goState('IDLE', drawIdle); return; }
});

// ── Session ───────────────────────────────────────────────────────────────────
function beginTicking() {
  state.screen      = 'WORKING';
  state.lastTimeTxt = '';
  state.tickTimer   = setInterval(tick, 1000);
  drawWorking();
}

function startSession() {
  state.elapsed = 0;
  beginTicking();
}

function tick() {
  state.elapsed++;
  if (state.elapsed >= state.totalSec) {
    stopTimer();
    goState('DONE', drawDone);
    return;
  }
  if (state.elapsed % state.checkEvery === 0) {
    stopTimer();
    Bangle.setLCDPower(1);
    Bangle.setLocked(false);
    Bangle.buzz(400);
    setTimeout(function() { Bangle.buzz(200); }, 600);
    goState('CHECKIN', drawCheckin);
    return;
  }
  drawWorking();
}

// ── Boot ──────────────────────────────────────────────────────────────────────
g.setBgColor(1, 1, 1);
Bangle.loadWidgets();
Bangle.drawWidgets();
drawIdle();
