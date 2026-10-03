/* I Am Jane Doe — story library
   Reads stories.json and renders:
     - the full, searchable library   (element with id="library")
     - a short preview of new stories (element with id="story-preview")
     - the topic choices in the form  (element with id="topic-choices")
*/
(function () {
  'use strict';

  var DATA_URL = 'stories.json';
  var PREVIEW_COUNT = 3;
  var EXCERPT_CHARS = 320;

  // ---------- helpers ----------
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  function words(q) {
    return norm(q).split(/\s+/).filter(Boolean);
  }
  function slug(s) {
    return norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  function regexEscape(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  // Escape text, then wrap search words in <mark>.
  function highlight(text, terms) {
    var out = esc(text);
    if (!terms.length) return out;
    var re = new RegExp('(' + terms.map(function (t) { return regexEscape(esc(t)); }).join('|') + ')', 'gi');
    return out.replace(re, '<mark>$1</mark>');
  }

  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  function prettyDate(d) {
    var m = /^(\d{4})-(\d{2})/.exec(d || '');
    return m ? MONTHS[parseInt(m[2], 10) - 1] + ' ' + m[1] : '';
  }

  function paragraphs(text) {
    return String(text || '').split(/\n\s*\n/).map(function (p) { return p.trim(); }).filter(Boolean);
  }

  function excerpt(text) {
    var flat = String(text || '').replace(/\s+/g, ' ').trim();
    if (flat.length <= EXCERPT_CHARS) return { text: flat, cut: false };
    var cut = flat.slice(0, EXCERPT_CHARS);
    cut = cut.slice(0, Math.max(cut.lastIndexOf(' '), EXCERPT_CHARS - 40));
    return { text: cut + '…', cut: true };
  }

  function prepare(data) {
    var stories = (data && data.stories) || [];
    stories = stories.filter(function (s) { return s && s.story && s.published !== false; });
    stories.forEach(function (s, i) {
      s.id = s.id || slug((s.date || '') + '-' + (s.title || 'story-' + i));
      s.categories = s.categories || [];
      s.tags = s.tags || [];
      s._hay = norm([s.title, s.name, s.story, s.categories.join(' '), s.tags.join(' '), s.contentNote].join(' '));
    });
    stories.sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });
    return { categories: (data && data.categories) || [], stories: stories };
  }

  function load() {
    return fetch(DATA_URL, { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('load'); return r.json(); })
      .then(prepare);
  }

  // ---------- one story card ----------
  function storyCard(s, opts) {
    opts = opts || {};
    var terms = opts.terms || [];
    var ex = excerpt(s.story);
    var cats = s.categories.map(function (c) { return '<span class="tag">' + esc(c) + '</span>'; }).join('');
    var meta = '<span>' + esc(s.name || 'Jane Doe') + '</span>' +
               (s.date ? '<span aria-hidden="true">·</span><span>' + esc(prettyDate(s.date)) + '</span>' : '') +
               cats;
    var note = s.contentNote ? '<p class="note">Content note: ' + esc(s.contentNote) + '</p>' : '';
    var title = s.title || 'Untitled';

    if (opts.preview) {
      return '<li class="story">' +
        '<h3><a href="stories.html#s-' + esc(s.id) + '">' + esc(title) + '</a></h3>' +
        '<div class="meta">' + meta + '</div>' + note +
        '<p>' + esc(ex.text) + '</p>' +
        '<div class="actions"><a class="read-btn" href="stories.html#s-' + esc(s.id) + '">Read her story →</a></div>' +
        '</li>';
    }

    var full = paragraphs(s.story).map(function (p) { return '<p>' + highlight(p, terms) + '</p>'; }).join('');
    return '<li class="story" id="s-' + esc(s.id) + '" data-id="' + esc(s.id) + '">' +
      '<h3>' + highlight(title, terms) + '</h3>' +
      '<div class="meta">' + meta + '</div>' + note +
      '<div class="body excerpt"' + (opts.open ? ' hidden' : '') + '><p>' + highlight(ex.text, terms) + '</p></div>' +
      '<div class="body full" id="full-' + esc(s.id) + '"' + (opts.open ? '' : ' hidden') + '>' + full + '</div>' +
      '<div class="actions">' +
        (ex.cut ? '<button type="button" class="read-btn" aria-expanded="' + (opts.open ? 'true' : 'false') + '" aria-controls="full-' + esc(s.id) + '">' + (opts.open ? 'Show less' : 'Read her story') + '</button>' : '') +
        '<button type="button" class="linkish copy-link" data-id="' + esc(s.id) + '">Copy link</button>' +
      '</div>' +
      '</li>';
  }

  // ---------- full library ----------
  function initLibrary(root, data) {
    var params = new URLSearchParams(location.search);
    var state = { q: params.get('q') || '', cat: params.get('topic') || '' };
    var openId = (location.hash || '').replace(/^#s-/, '');
    if (openId && location.hash.indexOf('#s-') !== 0) openId = '';

    var searchEl = root.querySelector('#story-search');
    var chipsEl = root.querySelector('#topic-chips');
    var listEl = root.querySelector('#story-list');
    var countEl = root.querySelector('#result-count');
    var clearEl = root.querySelector('#clear-filters');

    if (!data.stories.length) {
      root.querySelector('.toolbar').hidden = true;
      var cta = root.querySelector('#bottom-cta'); if (cta) cta.hidden = true;
      listEl.outerHTML =
        '<div class="empty">' +
          '<p class="big">The first stories are being read with care.</p>' +
          '<p>Every story is read by a person before it is shared here. Please check back soon.</p>' +
          '<a class="btn" href="index.html#share">Be one of the first to share</a>' +
        '</div>';
      countEl.textContent = '';
      return;
    }

    searchEl.value = state.q;

    // topic chips, with counts
    function countFor(cat) {
      return data.stories.filter(function (s) { return !cat || s.categories.indexOf(cat) > -1; }).length;
    }
    var used = data.categories.filter(function (c) { return countFor(c) > 0; });
    chipsEl.innerHTML = ['', ].concat(used).map(function (c) {
      return '<button type="button" class="chip" data-cat="' + esc(c) + '" aria-pressed="' + (state.cat === c) + '">' +
        esc(c || 'All stories') + ' <span class="n">' + countFor(c) + '</span></button>';
    }).join('');
    if (state.cat && used.indexOf(state.cat) === -1) state.cat = '';
    if (!state.cat) chipsEl.querySelector('[data-cat=""]').setAttribute('aria-pressed', 'true');

    function syncUrl() {
      var p = new URLSearchParams();
      if (state.q.trim()) p.set('q', state.q.trim());
      if (state.cat) p.set('topic', state.cat);
      var qs = p.toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
    }

    function render() {
      var terms = words(state.q);
      var hits = data.stories.filter(function (s) {
        if (state.cat && s.categories.indexOf(state.cat) === -1) return false;
        return terms.every(function (t) { return s._hay.indexOf(t) > -1; });
      });
      if (!hits.length) {
        listEl.innerHTML = '<li class="empty"><p class="big">No stories match that yet.</p>' +
          '<p>Try a different word, or <button type="button" class="linkish" data-clear>see all stories</button>.</p></li>';
      } else {
        listEl.innerHTML = hits.map(function (s) {
          return storyCard(s, { terms: terms, open: s.id === openId });
        }).join('');
      }
      var n = hits.length;
      countEl.textContent = n + (n === 1 ? ' story' : ' stories') +
        (state.cat ? ' about ' + state.cat.toLowerCase() : '') +
        (state.q.trim() ? ' matching “' + state.q.trim() + '”' : '');
      clearEl.hidden = !(state.cat || state.q.trim());
    }

    var t;
    searchEl.addEventListener('input', function () {
      clearTimeout(t);
      t = setTimeout(function () { state.q = searchEl.value; openId = ''; render(); syncUrl(); }, 150);
    });
    root.querySelector('#search-form').addEventListener('submit', function (e) { e.preventDefault(); });

    chipsEl.addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return;
      state.cat = b.getAttribute('data-cat');
      chipsEl.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', String(c === b)); });
      render(); syncUrl();
    });

    function clearAll() {
      state.q = ''; state.cat = ''; searchEl.value = '';
      chipsEl.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-cat') === '')); });
      render(); syncUrl(); searchEl.focus();
    }
    clearEl.addEventListener('click', clearAll);

    listEl.addEventListener('click', function (e) {
      if (e.target.closest('[data-clear]')) { clearAll(); return; }
      var rb = e.target.closest('.read-btn');
      if (rb) {
        var card = rb.closest('.story');
        var open = rb.getAttribute('aria-expanded') === 'true';
        card.querySelector('.full').hidden = open;
        card.querySelector('.excerpt').hidden = !open;
        rb.setAttribute('aria-expanded', String(!open));
        rb.textContent = open ? 'Read her story' : 'Show less';
        if (open) card.scrollIntoView({ block: 'nearest' });
        return;
      }
      var cl = e.target.closest('.copy-link');
      if (cl) {
        var url = location.origin + location.pathname + '#s-' + cl.getAttribute('data-id');
        var done = function () { cl.textContent = 'Link copied'; setTimeout(function () { cl.textContent = 'Copy link'; }, 2000); };
        if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { prompt('Copy this link:', url); });
        else prompt('Copy this link:', url);
      }
    });

    render();

    if (openId) {
      var target = document.getElementById('s-' + openId);
      if (target) { target.classList.add('highlight'); setTimeout(function () { target.scrollIntoView({ block: 'start' }); }, 50); }
    }
  }

  // ---------- home page preview ----------
  function initPreview(root, data) {
    var list = root.querySelector('#preview-list');
    var emptyMsg = root.querySelector('#preview-empty');
    if (!data.stories.length) { list.hidden = true; emptyMsg.hidden = false; return; }
    list.innerHTML = data.stories.slice(0, PREVIEW_COUNT).map(function (s) { return storyCard(s, { preview: true }); }).join('');
    var total = root.querySelector('#preview-total');
    if (total) total.textContent = 'Browse all ' + data.stories.length + (data.stories.length === 1 ? ' story' : ' stories');
  }

  // ---------- topic choices in the share form ----------
  function initTopics(root, data) {
    if (!data.categories.length) return;
    root.innerHTML = data.categories.map(function (c, i) {
      return '<label class="check-chip"><input type="checkbox" name="topic" value="' + esc(c) + '"><span>' + esc(c) + '</span></label>';
    }).join('');
    root.closest('.field').hidden = false;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var lib = document.getElementById('library');
    var prev = document.getElementById('story-preview');
    var topics = document.getElementById('topic-choices');
    if (!lib && !prev && !topics) return;
    load().then(function (data) {
      if (lib) initLibrary(lib, data);
      if (prev) initPreview(prev, data);
      if (topics) initTopics(topics, data);
    }).catch(function () {
      if (lib) {
        var l = lib.querySelector('#story-list');
        if (l) l.innerHTML = '<li class="empty"><p class="big">The stories couldn’t load just now.</p><p>Please refresh the page in a moment.</p></li>';
      }
      if (prev) { var p = prev.querySelector('#preview-empty'); if (p) p.hidden = false; }
    });
  });
})();
