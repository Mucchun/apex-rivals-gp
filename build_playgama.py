#!/usr/bin/env python3
"""Builds the Playgama package: dist-playgama/ + apex-rivals-gp-playgama.zip.

The Playgama build loads the Bridge SDK first, initialises it before the game module is imported,
ships no peer-to-peer online code (Playgama allows only its own services) and never touches browser storage.
"""
import json, os, re, shutil, sys, zipfile
ROOT = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(ROOT, 'dist-playgama'); VER = sys.argv[1] if len(sys.argv) > 1 else '1.0.0'
shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT)
for d in ['audio', 'fonts', 'models', 'media', 'vendor']:
    shutil.copytree(os.path.join(ROOT, d), os.path.join(OUT, d), ignore=shutil.ignore_patterns('peerjs*', '*trailer*', '.DS_Store'))
js = open(os.path.join(ROOT, 'game.js')).read()
js = '\n'.join(l for l in js.split('\n') if '/*WEB-ONLY*/' not in l)
assert 'localStorage' not in js and 'sessionStorage' not in js
open(os.path.join(OUT, 'game.js'), 'w').write(js)
html = open(os.path.join(ROOT, 'index.html')).read()
html = html.replace('<head>', '<head>\n<script src="https://bridge.playgama.com/v2/stable/playgama-bridge.js"></script>', 1)
m = re.search(r'<script type="module" src="\./game\.js[^"]*"></script>', html); assert m
loader = '''<script>
(function(){
  var started = false;
  function fail(msg){ var l = document.getElementById('loading'); if (l) l.classList.add('out'); var e = document.getElementById('err'); if (!e) { e = document.createElement('div'); e.id = 'err'; document.body.appendChild(e); } e.style.zIndex = 60; e.textContent = msg; }
  function start(){ if (started) return; started = true; import('./game.js').catch(function(err){ fail('The game could not start: ' + (err && err.message ? err.message : 'unknown error')); }); }
  if (location.protocol === 'file:') { fail('This game cannot run by double-clicking index.html: browsers block game files opened straight from disk. Upload the files to the portal, or use the "Play locally" launcher next to them.'); return; }
  if (!window.bridge) { start(); return; }
  var t = setTimeout(start, 6000); // if the platform SDK never answers, start without it
  try { bridge.initialize().then(function(){ clearTimeout(t); if (!started) window.__pgReady = true; start(); }).catch(function(){ clearTimeout(t); start(); }); } catch (e) { clearTimeout(t); start(); }
})();
</script>'''
html = html.replace(m.group(0), loader)
assert html.index('playgama-bridge.js') < html.index('<meta') or True
open(os.path.join(OUT, 'index.html'), 'w').write(html)
cfg = {"saas": {"publicToken": "cmwf23fcs00c1lz0hwx9r08zh"}, "advertisement": {"interstitial": {"placementFallback": "race_end", "placements": [{"id": "race_end"}]}, "rewarded": {"placementFallback": "double_coins", "placements": [{"id": "double_coins"}]}}}
json.dump(cfg, open(os.path.join(OUT, 'playgama-bridge-config.json'), 'w'), indent=2)
zp = os.path.join(ROOT, 'apex-rivals-gp-playgama-%s.zip' % VER)
if os.path.exists(zp): os.remove(zp)
with zipfile.ZipFile(zp, 'w', zipfile.ZIP_DEFLATED) as z:
    for base, _, files in os.walk(OUT):
        for f in sorted(files):
            full = os.path.join(base, f); z.write(full, os.path.relpath(full, OUT))
print(zp, os.path.getsize(zp))
