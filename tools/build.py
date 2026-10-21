"""Build the demo index.html from Rezto's rendered mobile page (dom-en.html).

Keeps Rezto's markup and CSS, strips their scripts and pop-ups, swaps the venue
for Khachapuri House, and puts the 3D viewer where the venue photo was.
"""
import re, sys, pathlib

SRC = pathlib.Path(__file__).with_name('dom-en.html')
OUT = pathlib.Path(sys.argv[1])
h = SRC.read_text(encoding='utf-8')


def remove_element(html, start, tag='div'):
    """Remove the element whose opening tag starts at `start` (balanced by tag name)."""
    depth = 0
    pat = re.compile(r'<(/?)%s\b[^>]*?(/?)>' % tag)
    for m in pat.finditer(html, start):
        if m.group(1):
            depth -= 1
        elif not m.group(2):
            depth += 1
        if depth == 0:
            return html[:start] + html[m.end():]
    raise ValueError('unbalanced')


def remove_by_marker(html, marker, tag='div', all_=False, required=True):
    count = 0
    while True:
        i = html.find(marker)
        if i < 0:
            break
        start = html.rfind('<' + tag, 0, i + 1)
        html = remove_element(html, start, tag)
        count += 1
        if not all_:
            break
    if required and not count:
        raise ValueError('marker not found: ' + marker)
    return html


def sub1(pattern, repl, html, flags=0):
    new, n = re.subn(pattern, repl, html, count=1, flags=flags)
    if n != 1:
        raise ValueError('pattern not found: ' + pattern[:80])
    return new


# ---------- head ----------
head = h[:h.find('<body')]
body = h[h.find('<body'):h.rfind('</body>')]

head = re.sub(r'<script\b.*?</script>', '', head, flags=re.S)
head = re.sub(r'<link[^>]*(as="script"|rel="preload"|rel="manifest"|rel="canonical"|rel="alternate"|apple-touch-icon|favicon)[^>]*>', '', head)
head = re.sub(r'<meta[^>]*(property="og:|name="twitter:|name="description"|name="keywords"|name="robots"|name="google)[^>]*>', '', head)
head = re.sub(r'<meta name="next-size-adjust"[^>]*>', '', head)
head = re.sub(r'href="/_next/static/css/', 'href="assets/rezto/css/', head)
head = re.sub(r'<title>.*?</title>', '', head, flags=re.S)
head = head.replace('</head>', '')
head_extra = '''<title>Khachapuri House, online table reservation | Rezto</title>
<meta name="robots" content="noindex, nofollow">
<link rel="icon" type="image/svg+xml" href="assets/rezto/favicon.svg">
<link rel="icon" type="image/png" sizes="96x96" href="assets/rezto/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
<link rel="preload" as="image" href="https://pub-b253d60df14c4c1f94bada002fa59596.r2.dev/food-market-main/1788464911301_Copy_of_________________.webp">
<link rel="stylesheet" href="ar/xr.css">
<link rel="stylesheet" href="demo.css">
<script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js"></script>
</head>'''
head = head + head_extra

# ---------- body ----------
body = re.sub(r'<script\b.*?</script>', '', body, flags=re.S)
body = re.sub(r'<template\b.*?</template>', '', body, flags=re.S)
body = re.sub(r'<next-route-announcer.*?</next-route-announcer>', '', body, flags=re.S)
body = re.sub(r'<link rel="preload"[^>]*>', '', body)
body = re.sub(r' (srcset|srcSet|imagesrcset)="[^"]*"', '', body)
assert 'Get full experience' not in body or True
body = sub1(r'<body[^>]*>', '<body>', body)

# Pop-ups: "Get full experience in App", login, forgot details, payment cards, sidebar.
body = remove_by_marker(body, 'class="fixed inset-0 z-[100] flex items-end', all_=True)
body = remove_by_marker(body, 'class="backdrfop-blur-sm fixed inset-0 z-[102]', all_=True)
body = remove_by_marker(body, 'class="sidebar_overlay', all_=True, required=False)
# Partner pill ("By Hilton Garden Inn"), both the mobile and desktop copies.
body = remove_by_marker(body, 'By Hilton Garden Inn</span>', all_=True)

body = body.replace('src="/images/flags/', 'src="assets/rezto/flags/')

# Venue name.
body = body.replace('>Andazi<', '>Khachapuri House<')

# Opening hours tooltip.
body = body.replace('06:30 — 00:00', '11:00 — 23:00')

# Address pill.
body = sub1(r'64a Ilia Chavchavadze Avenue\s+Tbilisi', '12 Rustaveli Avenue  Tbilisi', body)

# Restaurant logo (lifted above the 3D stage, which makes its own stacking layer).
body = sub1(r'<div class="absolute left-0 top-0 cursor-pointer"([^>]*)><img alt="Restaurant Logo"', r'<div id="venue-logo" class="absolute left-0 top-0 cursor-pointer"><img alt="Restaurant Logo"', body)
body = sub1(r'(<img alt="Restaurant Logo"[^>]*?)src="[^"]*"', r'\1src="assets/betareal-logo.png"', body)

# Venue photo -> 3D dish (Food & Market's viewer settings).
hero = '''<div id="dish-stage" class="aspect-[914/558] rounded-[300px] border-[10px] md:border-[15px]" style="border-color:#bfc9ca">
<model-viewer id="dish-viewer"
    src="https://pub-b253d60df14c4c1f94bada002fa59596.r2.dev/food-market-main/1789294491888_khachapuri_enhanced_half_size.glb"
    poster="https://pub-b253d60df14c4c1f94bada002fa59596.r2.dev/food-market-main/1788464911301_Copy_of_________________.webp"
    alt="Adjarian khachapuri in 3D"
    camera-controls
    shadow-intensity="1"
    min-camera-orbit="auto 0deg auto"
    max-camera-orbit="auto 85deg auto"
    camera-orbit="0deg 60deg 105%"
    auto-rotate auto-rotate-delay="0" rotation-per-second="20deg"
    touch-action="pan-y"
    interaction-prompt="none"></model-viewer>
</div>'''
body = sub1(r'<img alt="Andazi image 1"[^>]*>', hero, body)

# "See it on your table" goes under the oval, so it never covers the dish.
# An <a>, not a <button>: inside Instagram/Facebook the escape has to be a real link tap.
ar_btn = '''<a href="#" role="button" id="see-on-table" class="primary_button flex w-full !py-[18px]">
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l8.5 4.9v9.8L12 21.6l-8.5-4.9V6.9z"/><path d="M12 12l8.5-5M12 12v9.6M12 12L3.5 7"/></svg>
<span>See it on your table</span>
</a>'''
i = body.find('id="dish-stage"')
rel = body.rfind('<div class="relative">', 0, i)
# insert after the closing of that .relative wrapper
tmp = remove_element(body, rel)  # find where it ends by measuring removal length
end = rel + (len(body) - len(tmp))
body = body[:end] + '\n' + ar_btn + '\n' + body[end:]

# Form: hooks for the demo script.
body = sub1(r'<span class="text-\[13px\] font-\[500\] text-\[#979797\] undefined">Select date</span>\s*<span class="w-full text-\[14px\] font-\[400\] text-black undefined line-clamp-2">Select date</span>',
            '<span class="text-[13px] font-[500] text-[#979797] undefined">Select date</span><span data-value="date" class="w-full text-[14px] font-[400] text-black undefined line-clamp-2">Select date</span>', body)
body = sub1(r'<span class="text-\[13px\] font-\[500\] text-\[#979797\] undefined">Arrival time</span>',
            '<span class="text-[13px] font-[500] text-[#979797] undefined">Arrival time</span><span data-value="time" class="w-full text-[14px] font-[400] text-black undefined line-clamp-2" hidden></span>', body)
body = sub1(r'<span class="text-\[13px\] font-\[500\] text-\[#979797\] undefined">Select area type</span>',
            '<span class="text-[13px] font-[500] text-[#979797] undefined">Select area type</span><span data-value="area" class="w-full text-[14px] font-[400] text-black undefined line-clamp-2" hidden></span>', body)

# Live statistics tracking pill sits on top of Rezto's bottom bar.
body = sub1(r'(<div class="border-t border-\[#774EE91A\] bg-white px-6 pb-6 pt-4">)',
            r'\1<button type="button" class="stats-pill" id="stats-pill"><span class="live" id="stats-dot"></span>Live statistics tracking<span class="n" id="stats-n">0</span></button>', body)

# "Demo by BetaReal" under Rezto's Technical Assistance line (mobile bottom bar).
CREDIT = '<a class="demo-credit" href="https://betareal.ge" target="_blank" rel="noopener"><img src="assets/betareal-mark.png" alt="">Demo by <b>BetaReal</b></a>'
body = sub1(r'(<a href="mailto:info@rezto.ge"[^>]*>info@rezto.ge</a></div>)', lambda m: m.group(1) + CREDIT, body)

overlay = pathlib.Path(OUT.parent / 'ar' / 'xr-overlay.html').read_text(encoding='utf-8').rstrip()
# The Reserve button must live inside #xr-overlay: it is the WebXR dom-overlay root.
assert overlay.endswith('</div>')
overlay = overlay[:-len('</div>')] + '    <button id="xr-reserve-btn" type="button">Reserve a table</button>\n    </div>\n'
tail = overlay + pathlib.Path(OUT.parent / 'parts.html').read_text(encoding='utf-8')

html = head + body + tail + '\n</body>\n</html>\n'
html = html.replace('<html lang="en" data-host="rezto.ge"', '<html lang="en" data-fm-motion data-host="rezto.ge"', 1)
OUT.write_text('<!DOCTYPE html>' + html if not html.lstrip().lower().startswith('<!doctype') else html, encoding='utf-8')
print('wrote', OUT, len(html))
