(() => {
  function openApp() {
    load("focustimer.app.js");
  }

  function draw() {
    g.reset();
    g.setColor(g.theme.bg);
    g.fillRect(this.x, this.y, this.x + this.width - 1, this.y + 23);
    g.setColor("#0b6");
    g.fillCircle(this.x + 12, this.y + 12, 9);
    g.setColor(g.theme.bg);
    g.fillCircle(this.x + 12, this.y + 12, 5);
    g.setColor(g.theme.fg);
    g.setFont("6x8");
    g.setFontAlign(0, 0);
    g.drawString("FT", this.x + 29, this.y + 12);
  }

  WIDGETS.focustimer = {
    area: "tl",
    sortorder: 20,
    width: 44,
    draw: draw
  };

  Bangle.on("touch", function(_, xy) {
    var w = WIDGETS.focustimer;
    if (!w || w.x === undefined || xy.y > w.y + 23) return;
    if (xy.x >= w.x && xy.x < w.x + w.width) openApp();
  });
})();
