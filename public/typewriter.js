// Efecto de tipeo de la frase de la portada, en bucle: escribe, queda fija un rato, borra y vuelve a escribir.
// Script clásico y externo (CSP: script-src 'self'), solo en el <head> de las portadas, sin async ni defer:
// decide antes del primer pintado para que no haya un destello del texto completo. Sin JS (o con
// reduced-motion) el texto estático ya está visible. El cursor parpadea siempre (CSS, global.css).
(function () {
  var root = document.documentElement;
  var START_DELAY = 300; // ms antes de la primera letra
  var CHAR_DELAY = 55; // ms por letra (± JITTER)
  var JITTER = 20;
  var HOLD = 4500; // ms con la frase completa y el cursor parpadeando
  var ERASE_DELAY = 28; // ms por letra al borrar
  var RETYPE_PAUSE = 500; // ms con la línea vacía antes de volver a escribir
  var FAILSAFE = 8000; // si el arranque falla, se muestra el texto completo

  function reducedMotion() {
    try {
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) {
      return false;
    }
  }

  if (reducedMotion()) return;

  root.classList.add('js-typing');

  var finished = false;
  var started = false;
  var waiting = null; // paso pendiente mientras la pestaña está oculta

  function finish() {
    if (finished) return;
    finished = true;
    root.classList.remove('js-typing');
  }

  window.setTimeout(function () {
    if (!started) finish();
  }, FAILSAFE);

  // Todos los pasos pasan por acá: si la pestaña está oculta el bucle espera, y cualquier error deja el texto estático.
  function later(fn, ms) {
    window.setTimeout(function () {
      if (finished) return;
      if (document.hidden) {
        waiting = fn;
        return;
      }
      try {
        fn();
      } catch (e) {
        finish();
      }
    }, ms);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden || !waiting || finished) return;
    var fn = waiting;
    waiting = null;
    later(fn, 0);
  });

  function start() {
    if (finished) return;
    try {
      var box = document.querySelector('.typewriter');
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
      live.textContent = '';
      live.appendChild(typed);
      live.appendChild(rest);

      var i = 0;
      var render = function () {
        typed.textContent = text.slice(0, i);
        rest.textContent = text.slice(i);
      };
      var typeStep = function () {
        i += 1;
        render();
        if (i >= text.length) later(eraseStep, HOLD);
        else later(typeStep, CHAR_DELAY + (Math.random() * 2 - 1) * JITTER);
      };
      var eraseStep = function () {
        i -= 1;
        render();
        later(i <= 0 ? typeStep : eraseStep, i <= 0 ? RETYPE_PAUSE : ERASE_DELAY);
      };

      started = true;
      render();
      later(typeStep, START_DELAY);
    } catch (e) {
      finish();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
