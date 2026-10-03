/* I Am Jane Doe — quick exit
   The "Leave this site" button (or pressing Esc twice) swaps this page for a
   weather page. location.replace means the Back button won't return here. */
(function () {
  'use strict';
  var SAFE_URL = 'https://weather.com';

  function leave(e) {
    if (e) e.preventDefault();
    try { document.body.style.display = 'none'; document.title = 'Weather'; } catch (_) {}
    window.location.replace(SAFE_URL);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('quick-exit');
    if (btn) btn.addEventListener('click', leave);
  });

  var lastEsc = 0;
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var now = Date.now();
    if (now - lastEsc < 800) leave();
    lastEsc = now;
  });
})();
