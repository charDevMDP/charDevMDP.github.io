// Efecto de tipeo de la frase de la portada. Script clásico y externo (CSP: script-src 'self'),
// solo en el <head> de las portadas, sin async ni defer: decide antes del primer pintado para
// que no haya un destello del texto completo. Sin JS el texto estático ya está visible.
(function () {
  var root = document.documentElement;
  var KEY = 'typewriter-done';
  var START_DELAY = 300; // ms antes de la primera letra
  var CHAR_DELAY = 55; // ms por letra (± JITTER)
  var JITTER = 20;
  var CURSOR_TAIL = 2200; // 3 parpadeos de 0,7 s (ver global.css) + margen
  var FAILSAFE = 8000; // si algo falla, se muestra el texto completo

  function reducedMotion() {
    try {
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) {
      return false;
    }
  }

  function alreadyTyped() {
    try {
      return window.sessionStorage.getItem(KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function remember() {
    try {
      window.sessionStorage.setItem(KEY, '1');
    } catch (e) {}
  }

  if (reducedMotion() || alreadyTyped()) return;

  root.classList.add('js-typing');

  var finished = false;
  var box = null;

  function finish() {
    if (finished) return;
    finished = true;
    root.classList.remove('js-typing');
    if (box) {
      box.classList.remove('tw-done');
    }
  }

  window.setTimeout(finish, FAILSAFE);

  function start() {
    if (finished) return;
    try {
      box = document.querySelector('.typewriter');
      var ghost = box && box.querySelector('.tw-ghost');
      var live = box && box.querySelector('.tw-live');
      if (!ghost || !live) return finish();

      var text = ghost.textContent || '';
      // El texto sin escribir queda en un tramo invisible: el renglón mide siempre lo mismo
      // y el corte de líneas es el del texto final (sin saltos).
      var typed = document.createElement('span');
      typed.className = 'tw-typed';
      var rest = document.createElement('span');
      rest.className = 'tw-rest';
      rest.textContent = text;
      live.textContent = '';
      live.appendChild(typed);
      live.appendChild(rest);
      remember();

      var i = 0;
      var step = function () {
        if (finished) return;
        i += 1;
        typed.textContent = text.slice(0, i);
        rest.textContent = text.slice(i);
        if (i >= text.length) {
          box.classList.add('tw-done');
          window.setTimeout(finish, CURSOR_TAIL);
          return;
        }
        window.setTimeout(step, CHAR_DELAY + (Math.random() * 2 - 1) * JITTER);
      };
      window.setTimeout(step, START_DELAY);
    } catch (e) {
      finish();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
