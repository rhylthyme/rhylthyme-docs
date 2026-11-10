/* "Try it live": shows the buttons, loads the editor bundle on first use and
   opens an example from a button or a ?try=<id> link. No dependencies. */
(function () {
  var base = document.currentScript.src;
  var FAILED = 'Could not load the editor. Reload the page to try again.';
  var bundle = null; // the one in-flight (or finished) bundle load
  var started = false;
  var wasOpen = false;

  function buttonFor(id) {
    return Array.prototype.find.call(document.querySelectorAll('.rt-try'), function (b) {
      return b.getAttribute('data-example') === id;
    }) || null;
  }

  function loadBundle() {
    if (window.RhylthymePlayground) return Promise.resolve();
    if (!bundle) {
      bundle = new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = new URL('playground.bundle.js', base).href;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      }).catch(function (e) { bundle = null; throw e; });
    }
    return bundle;
  }

  function withoutTry() {
    var u = new URL(location.href);
    u.searchParams.delete('try');
    return u.href;
  }

  function open(id, button) {
    button = button || buttonFor(id);
    var label = button && button.textContent;
    if (button) {
      if (button.getAttribute('aria-busy') === 'true') return Promise.resolve();
      button.setAttribute('aria-busy', 'true');
      button.classList.remove('rt-try-failed');
      button.textContent = 'Loading…';
    }
    return loadBundle()
      .then(function () {
        return window.RhylthymePlayground.open({
          id: id,
          exampleUrl: new URL('../playground/examples/' + encodeURIComponent(id) + '.json', base).href,
          pageUrl: withoutTry(),
          returnFocus: button,
        });
      })
      .then(function () {
        if (button) button.textContent = label;
      }, function () {
        if (button) {
          button.textContent = FAILED;
          button.classList.add('rt-try-failed');
        }
      })
      .then(function () {
        if (button) button.removeAttribute('aria-busy');
      });
  }

  function watchClose() {
    new MutationObserver(function () {
      var now = document.documentElement.classList.contains('rt-pg-open');
      if (wasOpen && !now) {
        if (withoutTry() !== location.href) history.replaceState(history.state, '', withoutTry());
      }
      wasOpen = now;
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  function init() {
    if (started) {
      if (window.RhylthymePlayground && window.RhylthymePlayground.isOpen()) window.RhylthymePlayground.close();
    } else {
      started = true;
      watchClose();
    }
    document.documentElement.classList.add('rt-try-ready');
    var id = new URLSearchParams(location.search).get('try');
    if (id && buttonFor(id)) open(id);
  }

  document.addEventListener('click', function (e) {
    var button = e.target.closest && e.target.closest('.rt-try');
    if (button && button.getAttribute('data-example')) open(button.getAttribute('data-example'), button);
  });

  window.RhylthymeTryItLive = { open: function (id) { return open(id); } };

  if (window.document$ && window.document$.subscribe) window.document$.subscribe(init);
  else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
