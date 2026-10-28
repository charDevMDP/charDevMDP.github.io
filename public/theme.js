// Tema claro/oscuro. Script clásico y externo (CSP: script-src 'self'); se carga en el <head>,
// sin async ni defer, para aplicar el tema guardado antes del primer pintado.
(function () {
  var root = document.documentElement;
  var query = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;

  function stored() {
    try {
      var v = window.localStorage.getItem('theme');
      return v === 'light' || v === 'dark' ? v : null;
    } catch (e) {
      return null;
    }
  }

  function effective() {
    var set = root.getAttribute('data-theme');
    if (set === 'light' || set === 'dark') return set;
    return query && query.matches ? 'light' : 'dark';
  }

  var saved = stored();
  if (saved) root.setAttribute('data-theme', saved);

  document.addEventListener('DOMContentLoaded', function () {
    var button = document.querySelector('.theme-toggle');
    if (!button) return;

    function refresh() {
      var key = effective() === 'dark' ? 'data-label-to-light' : 'data-label-to-dark';
      var label = button.getAttribute(key) || '';
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
    }

    button.hidden = false;
    refresh();

    button.addEventListener('click', function () {
      var next = effective() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try {
        window.localStorage.setItem('theme', next);
      } catch (e) {}
      refresh();
    });

    if (query) {
      var onChange = function () {
        if (!stored()) refresh();
      };
      if (query.addEventListener) query.addEventListener('change', onChange);
      else if (query.addListener) query.addListener(onChange);
    }
  });
})();
