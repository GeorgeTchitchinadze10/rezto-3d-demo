# Rezto 3D demo

A concept demo for Rezto's founder: a Rezto-style restaurant booking page where the hero photo
is replaced by a 3D dish with a big **See it on your table** button. It belongs to the BetaReal ×
Rezto test partnership. The restaurant (Ember House) is fictional and **no real booking is
made**. The page is hidden from search engines.

Live: https://georgetchitchinadze10.github.io/rezto-3d-demo/

This repo is deliberately separate from BetaReal's production and rebuild repos.

## What it shows

| Feature | How |
|---|---|
| 3D dish in the hero | `model-viewer` 3.4.0, burger model from BetaReal's rights-clean R2 set |
| AR on iPhone (Safari/Chrome) | AR Quick Look via a persistent `<a rel="ar">`, with a **Reserve a table** button inside AR (`callToAction`). Tapping it scrolls to the booking form |
| AR on Android (Chrome) | Scene Viewer intent, true size (`resizable=false`), with a `link` back to the page (`?from=ar&reserve=1`) |
| iPhone + Instagram | `out.html` / `out-en.html`: meta refresh to `instagram://extbrowser/` opens the real browser on `?ar=1` |
| iPhone + Facebook | A sheet with the manual steps (••• → Open in browser) plus Copy link. No working scheme is known |
| Android in-app | Chrome intent back to the page with `?ar=1` |
| Desktop | QR code to open it on a phone |
| Pre-order −10% | Toggle on the dish card, carried into the booking summary |
| Share | `navigator.share`, or copy the link. Shared links carry `?from=share` |
| Live tracking | The pill above **Next** opens a funnel plus an event log. Events are kept in this browser only (`localStorage`); there is no backend |
| Languages | Georgian by default, EN toggle (`?lang=en`) |

UTM parameters (`utm_source`, `utm_campaign`, …) show up as the session's source in the
tracking panel.

## Events

`page_view`, `model_loaded`, `model_rotate`, `ar_tap`, `ar_open`, `ar_reserve_tap`,
`escape_offered`, `escape_tap`, `escape_manual`, `arrived_from_app`, `arrived_from_share`,
`arrived_from_ar`, `ar_unsupported`, `share_tap`, `share_done`, `link_copied`, `preorder_add`,
`preorder_remove`, `booking_started`, `booking_incomplete`, `booking_next`, `qr_shown`

## Phone test checklist

None of the in-app escapes are documented by Meta or Google. Re-check after app updates.

- [ ] iPhone Safari: 3D loads, AR opens, **Reserve a table** shows inside AR, and tapping it
      logs `ar_reserve_tap` and scrolls to the form
- [ ] iPhone, link opened inside Instagram: the button jumps to Safari and lands with the
      "one more tap" banner
- [ ] iPhone, link opened inside Facebook: the manual-steps sheet appears
- [ ] Android Chrome: Scene Viewer opens at true size, and its link returns to the form
- [ ] Android, link opened inside Instagram/Facebook: Chrome opens on the same page
- [ ] Share from the phone: the friend's link opens in 3D and logs `arrived_from_share`

## Moving it

`out.html` and `out-en.html` hardcode the live URL inside their meta refresh (it has to be
declarative to fire in Instagram). Update both if the demo moves to another domain.

## Run locally

```bash
py -3 -m http.server 8791 --bind 127.0.0.1
```

AR needs a real phone and HTTPS, so test AR on the live link.
