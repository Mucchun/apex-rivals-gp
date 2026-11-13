# Apex Rivals GP

An arcade Grand Prix racing game for the browser, built with Three.js.

**Play:** https://mucchun.github.io/apex-rivals-gp/

- 12 rival drivers and teams, 6 circuits (two night races)
- Slide through corners to charge a three-tier turbo, slipstream to open the DRS
- Power-ups: ERS boost, oil slick, loose tyre, shield, yellow flag, plus wings (fly over the pack), shrink hex, ice spell, portal swap, jammer and lightning
- Four-race championship or single race, three difficulty levels, 11 AI rivals
- Online rooms for up to 12 players (bots fill the grid), quick match, room leaderboard, room voice chat, world and room text chat, friends list with friend codes
- Car shop: paint finishes, 3D add-ons and turbo flame colours bought with coins won by racing

Online play is peer-to-peer (WebRTC via PeerJS and its public signalling server). There is no game server: the room host runs the bots, and the first player online relays world chat. Progress, coins and friends are stored in the browser.

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

- [three.js](https://threejs.org) (MIT) and [PeerJS](https://peerjs.com) (MIT), vendored in `vendor/`
- Car and scenery models in `models/` generated with Meshy
