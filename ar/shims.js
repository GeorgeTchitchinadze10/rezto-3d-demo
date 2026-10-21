// Globals that the production WebXR engine (ar/xr-engine.js) expects from the
// rest of the BetaReal menu page. Values copied from the production menu
// (Nikoloz-Chachua/Restaurant-AR, index.html) so the AR looks and reads the same.

const UI = {
    en: {
        moveHint:    'Drag to rotate · Pinch to scale',
        exitAR:      'Exit Model view',
        placeAgain:  'Place Again',
        hintStep1:   'STEP 1 OF 2',
        hintScan:    'Slowly scan a well-lit, textured table',
        hintStep2:   'STEP 2 OF 2',
        hintTap:     'Tap to place your dish',
        carouselBtn: 'CAROUSEL',
        singleBtn:   'SINGLE ITEM',
        onTable:     'ON TABLE',
        floating:    'FLOATING',
        hideUI:      'HIDE UI',
        showUI:      'SHOW UI'
    }
};

const _xrAddedKeys = new Set();

function _priceDisplay(price) {
    return String(price == null ? '' : price).trim();
}

function _safeAssetUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    try {
        const url = new URL(raw, location.href);
        return /^https?:$/.test(url.protocol) ? url.href : '';
    } catch (_) {
        return '';
    }
}

function _isAREnabledMenuItem(item) {
    return item?.text_only !== true && item?.is_3d !== false && !!_safeAssetUrl(item?.model);
}

window.__lang = 'en';
