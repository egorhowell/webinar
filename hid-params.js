/* Hired in Data: carry the visit's URL parameters (trakyo_id, utm_*, fbclid...)
 * forward through every link, redirect, booking widget and form.
 *
 * Loaded straight after the Trakyo tag in <head> on every page. The Trakyo
 * script owns trakyo_id itself (reads it from the URL, stores it, tags links
 * to our own domains and the vendors it knows). This file only fills the gaps:
 *   - links/redirects to our other domains (egorhowell.com <-> hiredindata.com)
 *     and to the booking/form vendors we use, with ALL incoming params;
 *   - the Aura booking embed, which Trakyo doesn't know, before aura.js reads it;
 *   - the Tally form embed (data-tally-src), before Tally's embed.js loads it,
 *     so the form's hidden fields (trakyo_id, utm_*) get filled;
 *   - a hidden trakyo_id input on every <form> (Trakyo fills these);
 *   - window.hidForward(url) / window.hidParams() for our own JS redirects and
 *     form posts.
 * It never removes or overwrites a parameter that is already on a URL, and it
 * never stores trakyo_id anywhere itself.
 */
(function () {
  'use strict';
  var FUNNEL = /(^|\.)(hiredindata\.com|egorhowell\.com|aura-app\.ai|tally\.so)$/i;

  function cookie(name) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }

  // Current page params, plus trakyo_id from Trakyo if the URL lacks it.
  function params() {
    var p;
    try { p = new URLSearchParams(window.location.search); } catch (e) { return null; }
    // Trakyo's own current id wins over whatever came in on the URL: if this
    // browser already had an id, Trakyo keeps it and that's the one to pass on.
    var id = window.trakyo_id || cookie('trakyo_id') || p.get('trakyo_id');
    if (id) p.set('trakyo_id', id);
    return p;
  }

  // Add any of this page's params the target URL doesn't already have.
  function forward(url) {
    try {
      var u = new URL(url, window.location.href);
      if (!/^https?:$/.test(u.protocol)) return url;
      if (u.hostname !== window.location.hostname && !FUNNEL.test(u.hostname)) return url;
      var p = params();
      if (!p) return url;
      var changed = false;
      p.forEach(function (v, k) {
        if (!u.searchParams.has(k)) { u.searchParams.set(k, v); changed = true; }
      });
      return changed ? u.toString() : url;
    } catch (e) { return url; }
  }

  window.hidForward = forward;
  window.hidParams = params;

  function tagLink(a) {
    var raw = a.getAttribute('href');
    if (!raw || raw.charAt(0) === '#' || /^(mailto|tel|javascript|sms):/i.test(raw)) return;
    var next = forward(a.href);
    if (next !== a.href) a.href = next;
  }

  function tagEmbed(el) {
    var u = el.getAttribute('data-url');
    if (u) {
      var next = forward(u);
      if (next !== u) el.setAttribute('data-url', next);
    }
  }

  function tagTally(el) {
    var u = el.getAttribute('data-tally-src');
    if (u) {
      var next = forward(u);
      if (next !== u) el.setAttribute('data-tally-src', next);
    }
  }

  function tagForm(f) {
    if (f.querySelector('input[name="trakyo_id"]')) return;
    var i = document.createElement('input');
    i.type = 'hidden';
    i.name = 'trakyo_id';
    var p = params();
    if (p && p.get('trakyo_id')) i.value = p.get('trakyo_id');
    f.appendChild(i);
  }

  function scan(node) {
    if (!node || node.nodeType !== 1) return;
    if (node.matches('a[href]')) tagLink(node);
    if (node.matches('[data-aura-scheduler]')) tagEmbed(node);
    if (node.matches('form')) tagForm(node);
    if (node.matches('iframe[data-tally-src]')) tagTally(node);
    var i, list = node.querySelectorAll('a[href], [data-aura-scheduler], form, iframe[data-tally-src]');
    for (i = 0; i < list.length; i++) {
      var el = list[i];
      if (el.tagName === 'A') tagLink(el);
      else if (el.tagName === 'FORM') tagForm(el);
      else if (el.tagName === 'IFRAME') tagTally(el);
      else tagEmbed(el);
    }
  }

  // Catch elements as the parser adds them, so the Aura embed is tagged
  // before aura.js (loaded at the end of <body>) reads its data-url.
  if (window.MutationObserver) {
    new MutationObserver(function (records) {
      for (var r = 0; r < records.length; r++) {
        var added = records[r].addedNodes;
        for (var n = 0; n < added.length; n++) scan(added[n]);
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
  document.addEventListener('DOMContentLoaded', function () { scan(document.body); });

  // Re-tag at click time too: a first-time visitor's trakyo_id may only
  // exist after the page has loaded.
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (a) tagLink(a);
  }, true);
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f && f.tagName === 'FORM') {
      tagForm(f);
      var input = f.querySelector('input[name="trakyo_id"]');
      var p = params();
      if (input && !input.value && p && p.get('trakyo_id')) input.value = p.get('trakyo_id');
    }
  }, true);
})();
