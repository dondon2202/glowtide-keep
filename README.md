# glowtide-keep

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/dondon2202/glowtide-keep/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/dondon2202/glowtide-keep/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

Glowtide Keep is an original top-down arena defender that plays offline in a desktop browser. You are the Warden of a lighthouse Keep. Hold the light through five waves of the Gloom: guard the crystal Keep, guard yourself, gather shards, and choose a boon after every cleared wave. Survive the final wave and the Herald to win.

All art is drawn in code on one canvas and all sound is synthesized with WebAudio. The game ships no image, audio, font, or library files and makes no network request.

Move with WASD or arrow keys, aim with the mouse, shoot by holding click or Space, dash with Shift or right-click, pause with P or Esc, sound with M, restart with R. Between waves, click a boon card or press 1, 2, or 3. Foes: Gloom Motes press the Keep, Dartwings hunt you, Bulwarks soak hits and split, and the Gloom Herald charges on the final wave. Pickups: shards score and heal a little, hearts heal more, stars grant Starflare rapid fire for a few seconds. You lose if the Warden falls or the Keep falls. Your best score is kept in the browser.

## Run it

```sh
cd game && python3 -m http.server 8901
```

Then open http://localhost:8901/ in desktop Chrome. Screenshot scenes are deterministic: append `?shot=start|play|upgrade|victory|defeat&seed=1` to the page URL to freeze one scene. See `shots.json` for the four shots this entry uses.

## Layout

- `main.ts` hands the entry in: it copies `game/` and `screenshots/` to the output directory and writes `dossier.json`.
- `game/index.html` and `game/styles.css` are the page and its styling.
- `game/src/` holds one job per file: `game.js` (states and combat), `render.js` (all drawing), `entities.js`, `waves.js`, `upgrades.js`, `particles.js`, `audio.js`, `input.js`, `rng.js`, `config.js`, `shots.js`, and `main.js` (boot and frame loop).
- `vendor/makefun-game.ts` is the kit's dossier library, unchanged.
- `screenshots/` holds the maker's real renders of the game.

## License

MIT. See LICENSE.

---

<sub>Entered on [make.fun](https://make.fun/?ref=7k0kankw&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
