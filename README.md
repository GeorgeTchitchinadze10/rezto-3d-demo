# Rezto 3D demo

Rezto's restaurant booking page (mobile, English) with the venue photo replaced by a 3D dish
and a **See it on your table** button. It's for the BetaReal × Rezto pilot and is seen only by
BetaReal and Rezto. The restaurant (Khachapuri House) is fictional and no real booking is made.
The page is hidden from search engines.

Live: https://georgetchitchinadze10.github.io/rezto-3d-demo/

This repo is deliberately separate from BetaReal's production and rebuild repos.

## What's whose

| Part | Source |
|---|---|
| Page markup, CSS, fonts, flags | Rezto's live page (`rezto.ge/en/reservation/andazi`), as Chrome renders it on a phone. Their scripts and pop-ups are removed |
| 3D view | `model-viewer` 3.4.0 with Food & Market's modal settings and the dish's saved camera view (`item_view_1855` = `0 60 105`) |
| Dish | Food & Market's Adjarian khachapuri (`menu_items` 1855): GLB, prebuilt USDZ, thumbnail as poster |
| Android AR | `ar/xr-engine.js`, `ar/xr.css`, `ar/xr-overlay.html`, copied verbatim from the production menu (`Nikoloz-Chachua/Restaurant-AR`, `cloudflare` @ `fcce5c2`) with Food & Market's AR effects on (`data-fm-motion`): plate guide, drop-in, ripple, shadow, steam. Don't edit them; re-copy from production |
| iPhone AR | Quick Look with the prebuilt USDZ, launched inside the tap as production does |
| Ours | `app.js`, `demo.css`, `parts.html`, `ar/shims.js`, the logo, `out.html` |

## What we added

- **See it on your table** under the oval, so it never covers the dish.
- **Reserve a table inside AR.** On iPhone it's Quick Look's `callToAction`; tapping it
  scrolls to the booking form. On Android it's a button in the WebXR overlay, shown once the
  dish is placed.
- **Getting out of in-app browsers**:
  - iPhone + Instagram: `out.html`, meta refresh to `instagram://extbrowser/`;
  - iPhone + Facebook: "Open in browser" steps;
  - Android in-app: Chrome intent with `?ar=1`.
- **Live statistics tracking**: the pill above **Next** opens a funnel and an event log.
  Events are kept in this browser only (`localStorage`); there's no backend. UTM parameters
  show as the session source.
- **Working booking fields**: native pickers over Rezto's cards. **Next** shows a summary.
- **Share icon**: the native share sheet. Shared links carry `?from=share`.
- **Desktop**: the AR button shows a QR code.

## Events

- **3D:** `page_view`, `model_loaded`, `model_rotate`
- **AR:** `ar_tap`, `ar_open`, `ar_placed`, `ar_reserve_tap`, `ar_duration`, `ar_fallback`
- **In-app browsers:** `escape_offered`, `escape_tap`, `escape_manual`, `arrived_from_app`
- **Sharing:** `arrived_from_share`, `share_tap`, `share_done`, `link_copied`
- **Booking:** `booking_started`, `booking_incomplete`, `booking_next`
- **Desktop:** `qr_shown`

## Phone test checklist

None of the in-app escapes are documented by Meta or Google. Re-check after app updates.

- [ ] iPhone Safari: the 3D spins, AR opens, **Reserve a table** shows inside AR, and tapping
      it scrolls to the form
- [ ] Android Chrome: F&M's AR (scan guide, plate circle, drop-in, steam), then **Reserve a
      table** once placed
- [ ] iPhone, link opened inside Instagram: jumps to Safari, then one more tap
- [ ] iPhone, link opened inside Facebook: the "Open in browser" steps appear
- [ ] Android, link opened inside Instagram/Facebook: Chrome opens on the same page
- [ ] Share from the phone: the link opens on the dish

## Rebuilding `index.html`

`tools/build.py` turns a capture of Rezto's rendered page into `index.html`. It strips their
scripts and pop-ups, swaps in the venue, the 3D stage and the button, then appends
`ar/xr-overlay.html` and `parts.html`. Capture with headless Chrome at phone size:

```bash
chrome --headless=new --window-size=390,844 --user-agent="<iPhone Safari UA>" \
  --virtual-time-budget=15000 --dump-dom https://rezto.ge/en/reservation/andazi > tools/dom-en.html
py -3 tools/build.py index.html
```

`out.html` hardcodes the live URL inside its meta refresh (it has to be declarative to fire in
Instagram). Update it if the demo moves to another domain.
