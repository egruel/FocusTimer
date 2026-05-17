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
