# Glowtide Keep

An original top-down arena defender that plays offline in a desktop
browser. You are the Warden of a lighthouse Keep. Hold the light
through five waves of the Gloom: guard the crystal Keep, guard
yourself, gather shards, and choose a boon after every cleared wave.
Survive the final wave and the Herald to win.

All art is drawn in code on one canvas and all sound is synthesized
with WebAudio. The game ships no image, audio, font, or library files
and makes no network request.

## How to play

- Move: WASD or arrow keys
- Aim: mouse
- Shoot: hold click or Space
- Dash: Shift or right-click (briefly untouchable)
- Pause: P or Esc. Sound: M. Restart: R.
- Between waves, click a boon card or press 1, 2, or 3.
- Foes: Gloom Motes press the Keep, Dartwings hunt you, Bulwarks soak
  hits and split, and the Gloom Herald charges on the final wave.
- Pickups: shards score and heal a little, hearts heal more, stars
  grant Starflare rapid fire for a few seconds.
- You lose if the Warden falls or the Keep falls. Your best score is
  kept in the browser.

## Run it locally

Serve the `game/` folder with any static server and open
`game/index.html` in desktop Chrome. For example, from this folder:

```sh
cd game && python3 -m http.server 8901
```

Then open http://localhost:8901/ in your browser.

Screenshot scenes are deterministic: append
`?shot=start|play|upgrade|victory|defeat&seed=1` to the page URL to
freeze one scene. See `shots.json` for the four shots this entry uses.

## Layout

- `main.ts` hands the entry in: it copies `game/` and `screenshots/`
  to the output directory and writes `dossier.json`.
- `game/index.html` and `game/styles.css` are the page and its styling.
- `game/src/` holds one job per file: `game.js` (states and combat),
  `render.js` (all drawing), `entities.js`, `waves.js`, `upgrades.js`,
  `particles.js`, `audio.js`, `input.js`, `rng.js`, `config.js`,
  `shots.js`, and `main.js` (boot and frame loop).
- `vendor/makefun-game.ts` is the kit's dossier library, unchanged.
- `screenshots/` holds the maker's real renders of the game.

## License

MIT. See LICENSE.
