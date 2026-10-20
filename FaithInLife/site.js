/* =========================================================================
   Faith In Life — site.js
   Two jobs only: the folio's chapter label, and the Week Rose (the page's
   bespoke interaction). The scroll mechanism belongs to the engine.
   ========================================================================= */
(function () {
  'use strict';

  var DAYS = [
    { name: 'Sunday',    tag: "the Lord's day",  warm: 1,
      line: 'The day the Church gathers. The longest, deepest reading of the week.' },
    { name: 'Monday',    tag: 'the beginning',   warm: 0.15,
      line: 'The week starts before you feel ready. Begin with the Gospel, not the inbox.' },
    { name: 'Tuesday',   tag: 'a check-in',      warm: 0.3,
      line: 'One honest question about how the week is actually going.' },
    { name: 'Wednesday', tag: 'the middle',      warm: 0.45,
      line: 'A reflection for the day the week stops being new.' },
    { name: 'Thursday',  tag: 'gratitude',       warm: 0.6,
      line: 'Three small things that went right. Name them out loud.' },
    { name: 'Friday',    tag: 'the penance',     warm: 0.35,
      line: 'Friday is still a day of penance. Choose the small thing you will give up for the Sunday coming.' },
    { name: 'Saturday',  tag: 'rest',            warm: 0.2,
      line: 'Fewer words. A quiet image. Nothing to achieve.' }
  ];

  /* ------------------------------------------------------------ the rose -- */
  var rose = document.querySelector('[data-rose]');
  var week = document.querySelector('.week');
  var roseButtons = Array.prototype.slice.call(document.querySelectorAll('.rose__day'));
  var rowButtons  = Array.prototype.slice.call(document.querySelectorAll('.week-row button'));
  var hand        = document.querySelector('[data-hand]');
  var arc         = document.querySelector('[data-arc]');
  var nodes       = Array.prototype.slice.call(document.querySelectorAll('[data-node]'));
  var ARC_C       = 2 * Math.PI * 35.4;
  var nameEl      = document.querySelector('[data-day-name]');
  var tagEl       = document.querySelector('[data-day-tag]');
  var lineEl      = document.querySelector('[data-day-line]');
  var STEP        = 360 / 7;
  var current     = -1;

  function select(i, focus) {
    i = ((i % 7) + 7) % 7;
    if (i === current) return;
    current = i;
    var d = DAYS[i];

    roseButtons.concat(rowButtons).forEach(function (b) {
      var on = Number(b.getAttribute('data-day')) === i;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on && focus) b.focus({ preventScroll: true });
    });

    if (hand) hand.style.transform = 'rotate(' + (i * STEP) + 'deg)';

    // the gold arc measures how far into the week the chosen day is
    if (arc) {
      var len = (i / 7) * ARC_C;
      arc.style.strokeDasharray = len.toFixed(2) + ' ' + (ARC_C - len).toFixed(2);
    }
    nodes.forEach(function (nd, k) {
      nd.classList.toggle('is-on', k === i);
    });
    if (nameEl) nameEl.textContent = d.name;
    if (tagEl) tagEl.textContent = d.tag;
    if (lineEl) lineEl.textContent = d.line;
    if (week) week.style.setProperty('--warm', d.warm);
  }

  if (rose || rowButtons.length) {
    [].concat(roseButtons, rowButtons).forEach(function (b) {
      b.addEventListener('click', function () { select(Number(b.getAttribute('data-day')), false); });
    });

    // A week opens on the day you are having.
    select(new Date().getDay(), false);

    if (rose) {
      var dragging = false;

      function pick(e) {
        var r = rose.getBoundingClientRect();
        var cx = r.left + r.width / 2;
        var cy = r.top + r.height / 2;
        var dx = e.clientX - cx;
        var dy = e.clientY - cy;
        if (Math.hypot(dx, dy) < r.width * 0.15) return;      // the centre mark is not a target
        if (Math.hypot(dx, dy) > r.width * 0.62) return;      // ignore the margin around the dial
        var theta = Math.atan2(dx, -dy) * 180 / Math.PI;      // 0 at top, clockwise
        if (theta < 0) theta += 360;
        select(Math.round(theta / STEP), false);
      }

      rose.addEventListener('pointerdown', function (e) { dragging = true; pick(e); });
      rose.addEventListener('pointermove', function (e) {
        if (dragging || e.pointerType === 'mouse') pick(e);
      });
      window.addEventListener('pointerup', function () { dragging = false; });
      window.addEventListener('pointercancel', function () { dragging = false; });

      rose.addEventListener('keydown', function (e) {
        var k = e.key;
        if (k === 'ArrowRight' || k === 'ArrowDown') { e.preventDefault(); select(current + 1, true); }
        else if (k === 'ArrowLeft' || k === 'ArrowUp') { e.preventDefault(); select(current - 1, true); }
        else if (k === 'Home') { e.preventDefault(); select(0, true); }
        else if (k === 'End') { e.preventDefault(); select(6, true); }
      });
    }
  }

  /* ----------------------------------------------------------- the folio -- */
  var chapters = Array.prototype.slice.call(document.querySelectorAll('[data-chapter]'));
  var folioNum = document.querySelector('[data-chnum]');
  var folioName = document.querySelector('[data-chname]');
  var ticking = false;

  function label() {
    ticking = false;
    var probe = Math.min(window.innerHeight * 0.16, 120);
    var found = null;
    for (var i = 0; i < chapters.length; i++) {
      var r = chapters[i].getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) { found = chapters[i]; break; }
    }
    if (!found) return;
    var num = found.getAttribute('data-chnum') || '';
    var name = found.getAttribute('data-chname') || '';
    if (folioNum && folioNum.textContent !== num) folioNum.textContent = num;
    if (folioName && folioName.textContent !== name) folioName.textContent = name;

    // What the folio is actually sitting on, rather than what the section list
    // thinks: a hard cut can happen anywhere in the viewport's top strip.
    var under = document.elementFromPoint(14, 26);
    var host = under && under.closest ? under.closest('[data-ground]') : null;
    var ground = (host && host.getAttribute('data-ground')) ||
                 found.getAttribute('data-ground') || 'paper';
    if (document.body.getAttribute('data-ground') !== ground) {
      document.body.setAttribute('data-ground', ground);
    }
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(label); }
  }, { passive: true });
  window.addEventListener('resize', label);
  label();

  /* ---------------------------------------------------------- the engine -- */
  if (window.ScrollCraft && window.ScrollCraft.mount) {
    window.ScrollCraft.mount(document.body);
  }
})();

/* --- chapter II: play the candle loop only while it is on screen ---------- */
(function () {
  var v = document.querySelector('.ch2__loop');
  if (!v) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) { v.removeAttribute('autoplay'); v.pause(); return; }
  v.addEventListener('playing', function () { v.classList.add('is-playing'); }, { once: true });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { v.play().catch(function () {}); }
        else { v.pause(); }
      });
    }, { threshold: 0.02 }).observe(v);
  }
})();

/* --- the emblem leans toward the pointer, a few pixels, never more -------- */
(function () {
  var seal = document.querySelector('.seal');
  if (!seal) return;
  if (!window.matchMedia('(pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var tx = 0, ty = 0, gx = 0, gy = 0, raf = null;
  function step() {
    tx += (gx - tx) * 0.11;
    ty += (gy - ty) * 0.11;
    seal.style.setProperty('--px', tx.toFixed(2) + 'px');
    seal.style.setProperty('--py', ty.toFixed(2) + 'px');
    raf = (Math.abs(gx - tx) > 0.08 || Math.abs(gy - ty) > 0.08)
      ? window.requestAnimationFrame(step) : null;
  }
  window.addEventListener('pointermove', function (e) {
    gx = (e.clientX / window.innerWidth - 0.5) * 20;
    gy = (e.clientY / window.innerHeight - 0.5) * 16;
    if (!raf) raf = window.requestAnimationFrame(step);
  }, { passive: true });
})();
