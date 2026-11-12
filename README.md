# Apex Rivals GP

An arcade Grand Prix racing game for the browser, built with Three.js.

**Play:** https://mucchun.github.io/apex-rivals-gp/

- 12 rival drivers and teams, 6 circuits (two night races)
- Slide through corners to charge a three-tier turbo, slipstream to open the DRS
- Power-ups: ERS boost, oil slick, loose tyre, shield, yellow flag
- Four-race championship or single race, three difficulty levels, 11 AI rivals

## Controls

| Key | Action |
| --- | --- |
| Arrows / WASD | Drive |
| Shift / Space (while turning) | Slide, release for turbo |
| E | Use power-up |
| C | Look back |
| M | Mute |
| Esc | Pause |

Touch buttons appear on phones.

## Run locally

```
python3 serve.py 5190
```

Then open http://localhost:5190/. No build step.

## Credits

- [three.js](https://threejs.org) (MIT), vendored in `vendor/`
- Car and scenery models in `models/` generated with Meshy
