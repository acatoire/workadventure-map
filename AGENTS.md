# AGENTS.md

Guidance for AI coding agents (Claude Code, Codex, etc.) working on this repository.

## What this repo is

A [WorkAdventure](https://workadventu.re) world for a team, made of Tiled maps.
It was created from the GitHub **template** `workadventure/map-starter-kit`, so it is **not a fork**.
It is hosted on GitHub Pages: https://acatoire.github.io/workadventure-map/

To play a map, use `https://play.workadventu.re/_/global/acatoire.github.io/workadventure-map/<map>.tmj`.

## Layout

| Path | Owner | Notes |
|---|---|---|
| `office.tmj`, `conference.tmj` | **us** | Tiled maps (JSON). WorkAdventure SaaS turns an exit to `<file>.tmj` into the room `<file>`, so **each file name must match its room slug** in the `mythicHQ` world (`office`, `conference`). Every `*.tmj` at the repo root is picked up automatically by `getMaps()`. |
| `map.png`, `conference.png` | **us** | Map thumbnails, referenced by the `mapImage` property. |
| `tilesets/` | **us** | Tileset PNGs, referenced by relative path from the `.tmj` files. |
| `src/main.ts` | **us** | Map script, referenced by each map's `script` property (`src/main.ts`). Browser scripts must live in `src/`. |
| `public/` | **us** | Static files served as-is (PDFs, audio, ...). |
| `README.md`, `LICENSE.map`, `LICENSE.assets` | **us** | |
| `app/app.ts` | upstream + local tweak | Dev-server entry point that wraps `@workadventure/map-starter-kit-core`. **Local fix:** it forces `Cache-Control: no-cache`, because core 1.1.5 caches maps for 1 day and tilesets for 7 days, so Tiled edits wouldn't show on refresh. Keep this when merging upstream, unless upstream fixes the caching. Add no other logic here. |
| `web.vite.config.ts` | upstream | `npm run dev` (Vite + Express publishing UI) |
| `buildmap.vite.config.ts` | upstream | `npm run buildmap` (optimizes maps into `dist/`) |
| `tsconfig.json`, `.gitignore`, `LICENSE.code` | upstream | |
| `.env` | mixed | Build options and `UPLOAD_MODE`. Here it is **`BOTH`** (local tweak: publish to the WA map storage and to GitHub Pages), with `MAP_STORAGE_URL` and `UPLOAD_DIRECTORY`. Never commit secrets: the API key is the `MAP_STORAGE_API_KEY` GitHub secret, or `.env.secret` (gitignored) locally. |
| `.github/workflows/build-and-deploy.yml` | upstream + local tweak | Triggers on **`main`** (upstream uses `master`). Accepts `UPLOAD_MODE=BOTH`, which runs both the map storage and the GitHub Pages deploy steps. Actions are pinned to Node 24 majors (`checkout@v7`, `setup-node@v7`, `github-pages-deploy-action@v4`); keep them when merging upstream if upstream is older. |
| `.agents/skills/upgrade-starter-kit/` | upstream | Upgrade skill. `.claude/skills/upgrade-starter-kit` is a symlink to it. |

## Commands

```bash
npm install          # Node 20+ (CI uses 24)
npm run dev          # local server + publishing UI at http://localhost:5173
npm run buildmap     # tsc + optimize all maps into dist/
npm run preview      # serve dist/ as production would
```

On npm >= 11, native install scripts are blocked unless they are allow-listed. `package.json` → `allowScripts` lists `sharp`, `esbuild` and `pngquant-bin` at exact versions.
If a dependency bump changes those versions, re-run `npm install-scripts approve <pkg>`, or the build fails with `Cannot find module ... sharp-*.node`.
`pngquant-bin` is only needed when `TILESET_OPTIMIZATION=true`.

## Deploy

Pushing to `main` runs the workflow, which builds `dist/` and publishes it to two places:
- the WorkAdventure map storage of the mythicHQ world, in the `UPLOAD_DIRECTORY` folder. This copy is the one where the in-game map editor works (native Meeting rooms, etc.), and editor changes survive new uploads. Every upload replaces all files in that folder.
- the `gh-pages` branch (GitHub Pages), which only has what is in the `.tmj` files.

There is no separate staging, so a push to `main` is live.

## Editing maps

- `.tmj` files are edited in [Tiled](https://www.mapeditor.org/). Prefer telling the user what to change in Tiled over hand-editing the JSON.
  If you must edit the JSON, keep Tiled's formatting, keep tile and object IDs consistent (`nextobjectid`, `nextlayerid`), and never reorder `tilesets` (the GIDs depend on the order).
- WorkAdventure behaviour comes from layer and object **properties**. Examples used here: `exitUrl`, `start`, `silent`, `openWebsite`, `focusable`, `zoom_margin`, `collides`, plus `script` and `mapName`/`mapImage`/`mapDescription` on the map.
  Reference: https://docs.workadventu.re/map-building/
- Meeting rooms are **not** in the `.tmj` files: they are WorkAdventure's native Meeting room areas, created with the in-game map editor on the map storage copy. Do not add `jitsiRoom` back, or Jitsi and the Meeting room would both open.
- Maps link to each other with `exitUrl` = `<file>.tmj#<entry-layer>`. Current links: `office.tmj` `to-conference` → `conference.tmj#from-office`, and `conference.tmj` `to-office` → `office.tmj#from-conference`.
  Keep entry layer names in sync when renaming.
- New map: copy an existing `.tmj` to the repo root, then set `mapName`, `mapImage` and `script`. Thumbnails are ideally 512x512.
- Third-party assets: credit them in the tileset's `tilesetCopyright` property and in `LICENSE.assets`.

### Shared custom tileset: `tilesets/mythic_tiles.png`

Our own objects live in one image, `mythic_tiles`, which is embedded in **both** maps at the same `firstgid`: 2956, the last tileset in each.
WorkAdventure needs tilesets embedded in the map, not external `.tsx` files.
It holds the team logo and the Magic paintings, each with half-tile-offset versions for centring on walls, our arcade cabinets, and LPC Revised office furniture.
`LICENSE.assets` lists what is where and who to credit.

Rules, because placed tiles are stored as `firstgid + row * 8 + column`:
- **Keep it 8 tiles (256 px) wide.** Changing the width renumbers every tile already placed in the maps.
- **Add new objects only in empty cells or in new rows at the bottom.** Never move or overwrite existing pixels.
- After resizing the image, update `imageheight` and `tilecount` (columns × rows) of the `mythic_tiles` entry in **every** `.tmj`, then run `npm run buildmap`.
- Keep any new tileset after `mythic_tiles`, or give `mythic_tiles` room, so that `firstgid` does not change.
- Credit any new third-party art in the tileset's `tilesetCopyright` property and in `LICENSE.assets`.

Map variables: `{{{ name }}}` placeholders, such as `openWebsite` = `{{{ websiteURL }}}` in `conference.tmj`, are filled by scripting-api-extra from the `configuration` object layer.
Change the value in that layer's variable object (its `default` property), not in the placeholder.

## Scripting

`src/main.ts` uses the WorkAdventure iframe API (`WA.*`, typings from `@workadventure/iframe-api-typings`) and `@workadventure/scripting-api-extra` (`bootstrapExtra()`).
Docs: https://docs.workadventu.re/developer/map-scripting/
`tsc` runs in strict mode with `noUnusedLocals`, so fix type errors rather than loosening the config.

## Keeping up with upstream

The `upstream` remote points to `https://github.com/workadventure/map-starter-kit.git`.
When the 2026 migration was done, upstream `master` was merged with `-s ours`, so git treats upstream as an ancestor.

```bash
git fetch upstream
git merge upstream/master   # brings only upstream changes made since the last sync
```

Then resolve the conflicts following the ownership column above:
- Upstream wins for scaffolding.
- Ours wins for maps and content.
- Keep `main` in the workflow, the `BOTH` conditions in its deploy steps, and `BOTH` in `.env`.
- Never copy upstream's example maps (`office.tmj`, `office.png`, `conference.tmj`) over ours. Our `office.tmj` has the same name as upstream's, so always keep ours in a conflict.
- Regenerate `package-lock.json` with `npm install` instead of merging it.
- Run `npm run buildmap` before committing.

You can also follow the `upgrade-starter-kit` skill in `.agents/skills/`, which does a file-by-file upgrade.

## Conventions

- Branch off `main` for changes and open a PR. Remember that `main` deploys.
- **Squash and merge PRs by default** so `main` gets one commit per PR (for example `gh pr merge <n> --squash`). Give the squash commit a clear title.
  **Exception: PRs that merge `upstream/master`** (the starter-kit migration, and any later upstream sync) **must use a regular merge commit** (`gh pr merge <n> --merge`).
  Squashing or rebasing those PRs would drop the upstream parent, and then the next `git merge upstream/master` would no longer know what was already synced.
- Do not commit `dist/`, `node_modules/` or `.env.secret`.
