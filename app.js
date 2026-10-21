(function () {
  'use strict';

  // ---------- The dish (Food & Market, menu_items id 1855) ----------
  var ITEM = {
    id: 1855,
    name: 'ADJARIAN KHACHAPURI',
    name_ka: 'აჭარული ხაჭაპური',
    description: 'Gluten, Milk Product, Egg',
    description_ka: 'გლუტენი, რძის ნაწარმი, კვერცხი',
    price: '27.00 ₾',
    category: 'Georgian — Dough',
    model: 'https://pub-b253d60df14c4c1f94bada002fa59596.r2.dev/food-market-main/1789294491888_khachapuri_enhanced_half_size.glb',
    model_usdz: 'https://pub-b253d60df14c4c1f94bada002fa59596.r2.dev/food-market-main/1789294515939_khachapuri_enhanced_half_size.usdz',
    ar_scale: 1,
    is_3d: true,
    text_only: false
  };
  var VENUE = 'Khachapuri House';
  var MENU = [ITEM];
  window.__menuItems = MENU;

  // ---------- Context ----------
  var qs = new URLSearchParams(location.search);
  var ua = navigator.userAgent;
  var BASE = location.origin + location.pathname;
  var APP = /Instagram/i.test(ua) ? 'instagram' : (/FBAN|FBAV|FB_IAB|FBIOS|FB4A/.test(ua) ? 'facebook' : '');
  var ANDROID = /Android/i.test(ua);
  var sid = Math.random().toString(36).slice(2, 8);

  function $(id) { return document.getElementById(id); }
  function store(k, v) {
    try {
      if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null');
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) { return null; }
  }

  // Same checks as the production menu (index.html: _looksIOS, _deviceCouldDoAR,
  // _capStillPlausible, detectAR).
  function _looksIOS() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }
  function _deviceCouldDoAR() {
    try {
      if ((navigator.maxTouchPoints || 0) > 0) return true;
      if (window.matchMedia && window.matchMedia('(any-pointer: coarse)').matches) return true;
      return false;
    } catch (_) { return true; }
  }
  function _capStillPlausible(cap) {
    if (!cap || cap === 'none') return false;
    if (!_deviceCouldDoAR()) return false;
    if (cap === 'arkit') return _looksIOS();
    if (cap === 'webxr') return !!navigator.xr;
    return false;
  }
  async function detectAR() {
    var cached = null, ts = 0;
    try {
      cached = localStorage.getItem('bl-ar-cap');
      ts = parseInt(localStorage.getItem('bl-ar-cap-ts') || '0', 10);
    } catch (e) {}
    if (_capStillPlausible(cached) && (Date.now() - ts < 7 * 24 * 60 * 60 * 1000)) {
      window.__arCap = cached;
      return cached;
    }
    var cap = 'none';
    if (_deviceCouldDoAR()) {
      if (navigator.xr) {
        try { if (await navigator.xr.isSessionSupported('immersive-ar')) cap = 'webxr'; } catch (e) {}
      }
      if (cap === 'none' && _looksIOS()) cap = 'arkit';
    }
    window.__arCap = cap;
    try {
      localStorage.setItem('bl-ar-cap', cap);
      localStorage.setItem('bl-ar-cap-ts', String(Date.now()));
    } catch (e) {}
    return cap;
  }

  var IOS = _looksIOS();
  // Seed iPhone synchronously, as production does: Quick Look has to fire inside the
  // tap, and an await before it would lose the gesture.
  if (IOS && _deviceCouldDoAR() && !window.__arCap) window.__arCap = 'arkit';
  else if (!IOS) detectAR();
  var device = (IOS ? 'iPhone' : ANDROID ? 'Android' : 'Desktop') + (APP ? ' · ' + APP + ' in-app' : '');
  var source = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].map(function (k) {
    return qs.get(k) ? k.replace('utm_', '') + '=' + qs.get(k) : '';
  }).filter(Boolean).join(' · ') || (qs.get('from') ? 'from=' + qs.get('from') : 'direct');

  // ---------- Live statistics tracking ----------
  var LABELS = {
    page_view: 'Page view',
    model_loaded: '3D dish loaded',
    model_rotate: 'Rotated the 3D dish',
    ar_tap: 'Tapped “See it on your table”',
    ar_open: 'AR opened',
    ar_placed: 'Placed the dish on the table',
    ar_reserve_tap: 'Tapped “Reserve a table” inside AR',
    ar_duration: 'Left AR',
    ar_fallback: 'AR could not start',
    escape_offered: 'In-app browser detected',
    escape_tap: 'Sent to the real browser',
    escape_manual: 'Shown “Open in browser” steps',
    arrived_from_app: 'Arrived from Instagram/Facebook',
    arrived_from_share: 'Arrived via a shared link',
    share_tap: 'Tapped share',
    share_done: 'Shared',
    link_copied: 'Copied the link',
    booking_started: 'Started the reservation',
    booking_incomplete: 'Tapped Next with fields missing',
    booking_next: 'Reservation: Next',
    qr_shown: 'QR shown (desktop)'
  };
  var FUNNEL = [
    ['Page views', 'page_view'],
    ['Touched the 3D dish', 'model_rotate'],
    ['Opened AR', 'ar_open'],
    ['Placed it on the table', 'ar_placed'],
    ['Reserve tapped inside AR', 'ar_reserve_tap'],
    ['Started the reservation', 'booking_started'],
    ['Reservation: Next', 'booking_next']
  ];

  var events = store('rz_events') || [];
  var once = {};

  function track(name, data) {
    events.push({ t: Date.now(), name: name, data: data || null });
    if (events.length > 300) events = events.slice(-300);
    store('rz_events', events);
    var dot = $('stats-dot');
    if (dot) { dot.classList.remove('blink'); void dot.offsetWidth; dot.classList.add('blink'); }
    renderStats();
  }
  function trackOnce(name, data) { if (once[name]) return; once[name] = 1; track(name, data); }
  function count(name) { return events.filter(function (e) { return e.name === name; }).length; }

  function renderStats() {
    if (!$('stats-n')) return;
    $('stats-n').textContent = events.length;
    var top = Math.max(1, count('page_view'));
    $('stats-funnel').innerHTML = FUNNEL.map(function (f) {
      var n = count(f[1]);
      return '<div><span>' + f[0] + '</span><b>' + n + '</b><span class="bar"><i style="width:' +
        Math.min(100, Math.round(n / top * 100)) + '%"></i></span></div>';
    }).join('');
    $('stats-log').innerHTML = events.slice().reverse().map(function (e) {
      var d = new Date(e.t);
      var hh = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ':' + ('0' + d.getSeconds()).slice(-2);
      var extra = e.data ? ' ' + Object.keys(e.data).map(function (k) { return k + '=' + e.data[k]; }).join(' ') : '';
      return '<div><span class="t">' + hh + '</span> ' + (LABELS[e.name] || e.name) + '<span class="t">' + extra + '</span></div>';
    }).join('');
    $('stats-meta').textContent = 'Session ' + sid + ' · ' + device + ' · source: ' + source;
  }

  // The AR engine reports through window.track(name, menuIndex, meta).
  var arStartedAt = 0;
  window.track = function (name, idx, meta) {
    if (name === 'ar_placed') {
      track('ar_placed');
      $('xr-reserve-btn').classList.add('visible');
    }
  };

  // ---------- Sheets, toast ----------
  function openSheet(id) { $(id).classList.add('show'); }
  function closeSheets() {
    document.querySelectorAll('.demo-scrim.show').forEach(function (s) { s.classList.remove('show'); });
  }
  document.querySelectorAll('.demo-scrim').forEach(function (s) {
    s.addEventListener('click', function (e) {
      if (e.target === s || e.target.hasAttribute('data-close')) closeSheets();
    });
  });
  var toastTimer;
  function toast(msg) {
    var el = $('demo-toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2800);
  }

  $('stats-pill').addEventListener('click', function () { renderStats(); openSheet('stats-sheet'); });
  $('stats-reset').addEventListener('click', function () {
    events = []; once = {}; store('rz_events', events); renderStats();
  });

  // ---------- 3D dish ----------
  var mv = $('dish-viewer');
  var t0 = performance.now();
  mv.addEventListener('load', function () { track('model_loaded', { ms: Math.round(performance.now() - t0) }); });
  mv.addEventListener('camera-change', function (e) {
    if (e.detail && e.detail.source === 'user-interaction') trackOnce('model_rotate');
  });

  // ---------- Share ----------
  function shareUrl() { return BASE + '?from=share'; }
  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    var ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove();
    return Promise.resolve();
  }
  document.querySelectorAll('[data-testid="ShareOutlinedIcon"]').forEach(function (icon) {
    var btn = icon.parentElement;
    btn.addEventListener('click', function () {
      track('share_tap');
      if (navigator.share) {
        navigator.share({ title: VENUE, text: 'See the Adjarian khachapuri on your own table', url: shareUrl() })
          .then(function () { track('share_done'); })
          .catch(function () {});
      } else {
        copy(shareUrl()).then(function () { track('link_copied'); toast('Link copied'); });
      }
    });
  });
  $('escape-copy').addEventListener('click', function () {
    copy(BASE + '?ar=1&from=' + (APP || 'inapp')).then(function () { track('link_copied'); toast('Link copied'); });
  });

  // ---------- AR ----------
  // Which path "See it on your table" takes:
  //   iPhone Safari/Chrome   Quick Look with the dish's own USDZ (as on Food & Market),
  //                          plus a "Reserve a table" button inside AR
  //   Android Chrome         BetaReal's WebXR engine (ar/xr-engine.js, from production),
  //                          plus a "Reserve a table" button once the dish is placed
  //   iPhone + Instagram     out.html bounce -> instagram://extbrowser/ (the real browser)
  //   iPhone + Facebook      "Open in browser" steps (no scheme is known to work)
  //   Android in-app         Chrome intent back to this page with ?ar=1
  //   Desktop                QR code
  var arBtn = $('see-on-table');
  var ql = $('ql-launcher');
  var arOpening = false;

  function quickLookHref() {
    var p = new URLSearchParams();
    p.set('callToAction', 'Reserve a table');
    p.set('checkoutTitle', 'Adjarian Khachapuri');
    p.set('checkoutSubtitle', VENUE + ' · 27 ₾');
    p.set('canonicalWebPageURL', shareUrl());
    return ITEM.model_usdz + '#' + p.toString().replace(/\+/g, '%20');
  }

  function chromeIntentHref() {
    var target = new URL(BASE);
    target.searchParams.set('ar', '1');
    target.searchParams.set('from', APP);
    return 'intent://' + target.host + target.pathname + target.search +
      '#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=' +
      encodeURIComponent(target.href) + ';end';
  }

  // In-app escapes must be real link taps, so the button gets an href there.
  if (APP && IOS && APP === 'instagram') arBtn.setAttribute('href', 'out.html');
  else if (APP && ANDROID) arBtn.setAttribute('href', chromeIntentHref());
  if (APP && (IOS || ANDROID)) track('escape_offered', { app: APP });

  function goToBooking() {
    var form = document.querySelector('form');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    var first = document.querySelector('.input_container');
    if (first) {
      first.classList.add('demo-flash');
      setTimeout(function () { first.classList.remove('demo-flash'); }, 2400);
    }
    toast('Pick a date and time for your table');
  }

  function showQR() {
    track('qr_shown');
    var box = $('qr-box');
    box.innerHTML = '';
    if (window.qrcode) {
      var q = window.qrcode(0, 'M');
      q.addData(BASE + '?from=qr');
      q.make();
      box.innerHTML = q.createSvgTag({ cellSize: 5, margin: 2, scalable: true });
    } else {
      box.textContent = BASE;
    }
    openSheet('qr-sheet');
  }

  arBtn.addEventListener('click', async function (e) {
    arBtn.classList.remove('pulse');
    if (APP && IOS && APP === 'instagram') { track('ar_tap', { path: 'escape_instagram' }); track('escape_tap', { app: APP }); return; }
    if (APP && ANDROID) { track('ar_tap', { path: 'escape_android' }); track('escape_tap', { app: APP }); return; }
    e.preventDefault();
    if (APP && IOS) { track('ar_tap', { path: 'escape_manual' }); track('escape_manual', { app: APP }); openSheet('escape-sheet'); return; }
    if (arOpening) return;
    arOpening = true;
    setTimeout(function () { arOpening = false; }, 2500);

    var cap = window.__arCap || await detectAR();
    track('ar_tap', { path: cap });
    if (cap === 'arkit') {
      // Prebuilt USDZ straight to Quick Look, inside the tap (production _launchQuickLook).
      ql.href = quickLookHref();
      ql.click();
      track('ar_open', { via: 'quicklook' });
    } else if (cap === 'webxr' && window.XR) {
      try {
        await window.XR.start(0, MENU);
      } catch (err) {
        console.error('XR start failed:', err);
        track('ar_fallback', { reason: String(err && err.message || err) });
        toast('Could not start AR. Showing the 3D model instead.');
        arOpening = false;
      }
    } else {
      arOpening = false;
      showQR();
    }
  });

  // "Reserve a table" inside iPhone AR
  ql.addEventListener('message', function (e) {
    if (e.data === '_apple_ar_quicklook_button_tapped') {
      track('ar_reserve_tap', { via: 'quicklook' });
      goToBooking();
    }
  }, false);

  // "Reserve a table" inside Android AR
  $('xr-reserve-btn').addEventListener('click', function () {
    track('ar_reserve_tap', { via: 'webxr' });
    $('xr-exit').click();
    setTimeout(goToBooking, 300);
  });

  // Labels the production page sets on the AR overlay.
  $('xr-move-hint').textContent = UI.en.moveHint;
  $('xr-exit').textContent = UI.en.exitAR;
  $('xr-place-again').textContent = UI.en.placeAgain;
  $('xr-hide-ui').textContent = UI.en.hideUI;

  document.addEventListener('xr-session-start', function () {
    arStartedAt = Date.now();
    track('ar_open', { via: 'webxr' });
  });
  document.addEventListener('xr-session-end', function (e) {
    arOpening = false;
    $('xr-reserve-btn').classList.remove('visible');
    if (e.detail && e.detail.fallbackIdx != null) {
      track('ar_fallback', { reason: 'session' });
      toast(e.detail.message || 'Could not start AR. Showing the 3D model instead.');
    } else if (arStartedAt) {
      track('ar_duration', { seconds: Math.round((Date.now() - arStartedAt) / 1000) });
    }
    arStartedAt = 0;
  });

  // Decode the model in the background so the first AR tap is instant (production does the same).
  if (!IOS && navigator.xr && window.XR) {
    window.XR.backgroundPreload(MENU);
  }

  // ---------- Reservation form ----------
  var form = { date: '', time: '', area: '', guests: '' };
  var containers = document.querySelectorAll('form .input_container');
  var dateBox = containers[0], timeBox = containers[1], areaBox = containers[2];
  var guestsInput = $('reservation-person-count');
  var nextBtns = Array.prototype.filter.call(document.querySelectorAll('button.primary_button'), function (b) {
    return /next/i.test(b.textContent);
  });

  function picker(box, options, key, placeholder) {
    var sel = document.createElement('select');
    sel.className = 'demo-picker';
    sel.setAttribute('aria-label', placeholder);
    sel.innerHTML = '<option value="" disabled selected>' + placeholder + '</option>' +
      options.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join('');
    sel.addEventListener('change', function () {
      form[key] = sel.value;
      var label = sel.options[sel.selectedIndex].text;
      var val = box.querySelector('[data-value="' + key + '"]');
      if (val) { val.textContent = label; val.hidden = false; }
      box.classList.remove('demo-missing');
      trackOnce('booking_started', { field: key });
      if (key === 'date') enableTime();
      syncNext();
    });
    box.appendChild(sel);
    return sel;
  }

  var dayFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  var dates = [];
  for (var i = 0; i < 14; i++) {
    var d = new Date(); d.setDate(d.getDate() + i);
    dates.push([d.toISOString().slice(0, 10), i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayFmt.format(d)]);
  }
  var times = [];
  for (var h = 11; h <= 22; h++) { times.push([h + ':00', h + ':00']); times.push([h + ':30', h + ':30']); }

  picker(dateBox, dates, 'date', 'Select date');
  var timeSel = picker(timeBox, times, 'time', 'Arrival time');
  timeSel.disabled = true;
  picker(areaBox, [['hall', 'Main hall'], ['terrace', 'Terrace'], ['vip', 'VIP room']], 'area', 'Select area type');

  function enableTime() {
    timeSel.disabled = false;
    var wrap = timeBox.parentElement;
    wrap.classList.remove('opacity-50');
    timeBox.classList.remove('!cursor-not-allowed');
  }

  guestsInput.addEventListener('input', function () {
    form.guests = guestsInput.value;
    if (guestsInput.value) trackOnce('booking_started', { field: 'guests' });
    guestsInput.closest('.relative').classList.remove('demo-missing');
    syncNext();
  });

  function syncNext() {
    var ready = !!(form.date && form.time && form.guests);
    nextBtns.forEach(function (b) { b.disabled = false; b.style.opacity = ready ? '' : '.6'; });
  }
  syncNext();

  nextBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var missing = [];
      if (!form.date) { missing.push('date'); dateBox.classList.add('demo-missing'); }
      if (!form.time) { missing.push('time'); timeBox.classList.add('demo-missing'); }
      if (!form.guests) { missing.push('guests'); guestsInput.closest('.relative').classList.add('demo-missing'); }
      if (missing.length) {
        track('booking_incomplete', { missing: missing.join(',') });
        toast('Choose a date, time and number of guests');
        return;
      }
      track('booking_next', { guests: form.guests });
      var label = function (sel) { return sel.options[sel.selectedIndex].text; };
      var rows = [
        ['Restaurant', VENUE],
        ['Date', label(dateBox.querySelector('select'))],
        ['Arrival time', form.time],
        ['Area', form.area ? label(areaBox.querySelector('select')) : '—'],
        ['Guests', form.guests]
      ];
      $('next-summary').innerHTML = rows.map(function (r) {
        return '<div><span>' + r[0] + '</span><span>' + r[1] + '</span></div>';
      }).join('');
      openSheet('next-sheet');
    });
  });

  // ---------- Start ----------
  renderStats();
  track('page_view', { device: device, source: source });
  var from = qs.get('from');
  if (qs.get('ar') === '1' && from) {
    track('arrived_from_app', { from: from });
    arBtn.classList.add('pulse');
    toast('One more tap and the dish is on your table');
  } else if (from === 'share') {
    track('arrived_from_share');
  }
  if (qs.has('ar')) {
    qs.delete('ar');
    try { history.replaceState(null, '', BASE + (qs.toString() ? '?' + qs.toString() : '')); } catch (e) {}
  }
})();
