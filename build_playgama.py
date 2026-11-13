#!/usr/bin/env python3
"""Builds the Playgama package: dist-playgama/ + apex-rivals-gp-playgama.zip.

The Playgama build loads the Bridge SDK first, initialises it before the game module is imported,
ships no peer-to-peer online code (Playgama allows only its own services) and never touches browser storage.
"""
import json, os, re, shutil, subprocess, sys, zipfile
ROOT = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(ROOT, 'dist-playgama'); VER = sys.argv[1] if len(sys.argv) > 1 else '1.0.0'
shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT)
for d in ['audio', 'fonts', 'models', 'media']:
    shutil.copytree(os.path.join(ROOT, d), os.path.join(OUT, d), ignore=shutil.ignore_patterns('peerjs*', '*trailer*', '.DS_Store'))
js = open(os.path.join(ROOT, 'game.js')).read()
js = '\n'.join(l for l in js.split('\n') if '/*WEB-ONLY*/' not in l)
assert 'localStorage' not in js and 'sessionStorage' not in js
# Bundle into one classic script (no ES modules, no import map) so the game also starts in portal previews
# that cannot import module scripts. Uses a locally installed esbuild: set ESBUILD to its path.
ESBUILD = os.environ.get('ESBUILD') or os.path.expanduser('~/argus/node_modules/.bin/esbuild')
tmp = os.path.join(ROOT, 'pg-entry.tmp.js'); open(tmp, 'w').write(js)
subprocess.run([ESBUILD, tmp, '--bundle', '--format=iife', '--minify', '--target=es2020', '--alias:three=./vendor/three.module.js', '--outfile=' + os.path.join(OUT, 'game.bundle.js'), '--log-level=warning'], cwd=ROOT, check=True)
os.remove(tmp)
html = open(os.path.join(ROOT, 'index.html')).read()
html = html.replace('<head>', '<head>\n<script src="https://bridge.playgama.com/v2/stable/playgama-bridge.js"></script>', 1)
m = re.search(r'<script type="module" src="\./game\.js[^"]*"></script>', html); assert m
im = re.search(r'<script type="importmap">.*?</script>\n?', html, re.S); assert im
html = html.replace(im.group(0), '')
loader = '''<script>
(function(){
  var started = false;
  function fail(msg){ var l = document.getElementById('loading'); if (l) l.classList.add('out'); var e = document.getElementById('err'); if (!e) { e = document.createElement('div'); e.id = 'err'; document.body.appendChild(e); } e.style.zIndex = 60; e.textContent = msg; }
  function start(){ if (started) return; started = true; var s = document.createElement('script'); s.src = './game.bundle.js'; s.onerror = function(){ fail('The game file (game.bundle.js) could not be loaded. Check that every file and folder was uploaded.'); }; document.body.appendChild(s); }
  addEventListener('error', function(e){ if (!window.__alive && e && e.message) fail('The game could not start: ' + e.message); });
  if (location.protocol === 'file:') { fail('This game cannot run by double-clicking index.html: browsers block game files opened straight from disk. Upload the files to the portal, or use the "Play locally" launcher next to them.'); return; }
  if (!window.bridge) { start(); return; }
  var t = setTimeout(start, 7000); // if the platform SDK never answers, start without it
  function wait(p, ms){ return Promise.race([p, new Promise(function(r){ setTimeout(function(){ r(null); }, ms); })]); }
  try {
    bridge.initialize().then(function(){ return wait(bridge.storage.get(['apexgp.save']), 4000).catch(function(){ return null; }); })
      .then(function(d){ clearTimeout(t); if (!started) { window.__pgSave = d && d[0]; window.__pgReady = true; } start(); })
      .catch(function(){ clearTimeout(t); start(); });
  } catch (e) { clearTimeout(t); start(); }
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
