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

  function $(id) { return document.getElementById(id); }

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
  // The AR engine reports through window.track(name, menuIndex, meta).
  window.track = function (name) {
    if (name === 'ar_placed') $('xr-reserve-btn').classList.add('visible');
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
      if (navigator.share) {
        navigator.share({ title: VENUE, text: 'See the Adjarian khachapuri on your own table', url: shareUrl() })
          .catch(function () {});
      } else {
        copy(shareUrl()).then(function () { toast('Link copied'); });
      }
    });
  });
  $('escape-copy').addEventListener('click', function () {
    copy(BASE + '?ar=1&from=' + (APP || 'inapp')).then(function () { toast('Link copied'); });
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
  // On a computer the button opens a QR code, so say that instead.
  if (!IOS && !ANDROID) $('see-on-table-sub').textContent = 'Scan a QR code to try it on your phone';

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
    // Instagram on iPhone and in-app browsers on Android follow the button's href.
    if (APP && (ANDROID || (IOS && APP === 'instagram'))) return;
    e.preventDefault();
    if (APP && IOS) { openSheet('escape-sheet'); return; }
    if (arOpening) return;
    arOpening = true;
    setTimeout(function () { arOpening = false; }, 2500);

    var cap = window.__arCap || await detectAR();
    if (cap === 'arkit') {
      // Prebuilt USDZ straight to Quick Look, inside the tap (production _launchQuickLook).
      ql.href = quickLookHref();
      ql.click();
    } else if (cap === 'webxr' && window.XR) {
      try {
        await window.XR.start(0, MENU);
      } catch (err) {
        console.error('XR start failed:', err);
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
    if (e.data === '_apple_ar_quicklook_button_tapped') goToBooking();
  }, false);

  // "Reserve a table" inside Android AR
  $('xr-reserve-btn').addEventListener('click', function () {
    $('xr-exit').click();
    setTimeout(goToBooking, 300);
  });

  // Labels the production page sets on the AR overlay.
  $('xr-move-hint').textContent = UI.en.moveHint;
  $('xr-exit').textContent = UI.en.exitAR;
  $('xr-place-again').textContent = UI.en.placeAgain;
  $('xr-hide-ui').textContent = UI.en.hideUI;

  document.addEventListener('xr-session-end', function (e) {
    arOpening = false;
    $('xr-reserve-btn').classList.remove('visible');
    if (e.detail && e.detail.fallbackIdx != null) {
      toast(e.detail.message || 'Could not start AR. Showing the 3D model instead.');
    }
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

  // Float the "Number of Guests" label above the caret and the number, like Rezto's other fields.
  var guestsWrap = guestsInput.parentElement;
  function floatGuestsLabel() {
    guestsWrap.classList.toggle('demo-float', document.activeElement === guestsInput || !!guestsInput.value);
  }
  guestsInput.addEventListener('focus', floatGuestsLabel);
  guestsInput.addEventListener('blur', floatGuestsLabel);
  guestsInput.addEventListener('input', floatGuestsLabel);

  guestsInput.addEventListener('input', function () {
    form.guests = guestsInput.value;
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
      var missing = false;
      if (!form.date) { missing = true; dateBox.classList.add('demo-missing'); }
      if (!form.time) { missing = true; timeBox.classList.add('demo-missing'); }
      if (!form.guests) { missing = true; guestsInput.closest('.relative').classList.add('demo-missing'); }
      if (missing) {
        toast('Choose a date, time and number of guests');
        return;
      }
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
  // Events from the old statistics panel, on phones that opened an earlier version.
  try { localStorage.removeItem('rz_events'); } catch (e) {}
  if (qs.get('ar') === '1' && qs.get('from')) {
    toast('One more tap and the dish is on your table');
  }
  if (qs.has('ar')) {
    qs.delete('ar');
    try { history.replaceState(null, '', BASE + (qs.toString() ? '?' + qs.toString() : '')); } catch (e) {}
  }
})();
