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
| `map.tmj`, `conference.tmj` | **us** | Tiled maps (JSON). Every `*.tmj` at the repo root is picked up automatically by `getMaps()`. |
| `map.png`, `conference.png` | **us** | Map thumbnails, referenced by the `mapImage` property. |
| `tilesets/` | **us** | Tileset PNGs, referenced by relative path from the `.tmj` files. |
| `src/main.ts` | **us** | Map script, referenced by each map's `script` property (`src/main.ts`). Browser scripts must live in `src/`. |
| `public/` | **us** | Static files served as-is (PDFs, audio, ...). |
| `README.md`, `LICENSE.map`, `LICENSE.assets` | **us** | |
| `app/app.ts` | upstream | Dev-server entry point. It only re-exports `@workadventure/map-starter-kit-core`. Do not add logic here. |
| `web.vite.config.ts` | upstream | `npm run dev` (Vite + Express publishing UI) |
| `buildmap.vite.config.ts` | upstream | `npm run buildmap` (optimizes maps into `dist/`) |
| `tsconfig.json`, `.gitignore`, `LICENSE.code` | upstream | |
| `.env` | mixed | Build options and `UPLOAD_MODE`. Here it is **`GH_PAGES`**. Never commit secrets; use `.env.secret` (gitignored). |
| `.github/workflows/build-and-deploy.yml` | upstream + local tweak | Triggers on **`main`** (upstream uses `master`). |
| `.agents/skills/upgrade-starter-kit/` | upstream | Upgrade skill. `.claude/skills/upgrade-starter-kit` is a symlink to it. |

## Commands

```bash
npm install          # Node 20+ (CI uses 20)
npm run dev          # local server + publishing UI at http://localhost:5173
npm run buildmap     # tsc + optimize all maps into dist/
npm run preview      # serve dist/ as production would
```

On npm >= 11, native install scripts are blocked unless they are allow-listed. `package.json` → `allowScripts` lists `sharp`, `esbuild` and `pngquant-bin` at exact versions.
If a dependency bump changes those versions, re-run `npm install-scripts approve <pkg>`, or the build fails with `Cannot find module ... sharp-*.node`.
`pngquant-bin` is only needed when `TILESET_OPTIMIZATION=true`.

## Deploy

Pushing to `main` runs the workflow, which builds and then publishes `dist/` to the `gh-pages` branch.
There is no separate staging, so a push to `main` is live.

## Editing maps

- `.tmj` files are edited in [Tiled](https://www.mapeditor.org/). Prefer telling the user what to change in Tiled over hand-editing the JSON.
  If you must edit the JSON, keep Tiled's formatting, keep tile and object IDs consistent (`nextobjectid`, `nextlayerid`), and never reorder `tilesets` (the GIDs depend on the order).
- WorkAdventure behaviour comes from layer and object **properties**. Examples used here: `exitUrl`, `start`, `jitsiRoom`, `jitsiTrigger`, `silent`, `openWebsite`, `focusable`, `zoom_margin`, `collides`, plus `script` and `mapName`/`mapImage`/`mapDescription` on the map.
  Reference: https://docs.workadventu.re/map-building/
- Maps link to each other with `exitUrl` = `<file>.tmj#<entry-layer>`. Current links: `map.tmj` `to-conference` → `conference.tmj#from-office`, and `conference.tmj` `to-office` → `map.tmj#from-conference`.
  Keep entry layer names in sync when renaming.
- New map: copy an existing `.tmj` to the repo root, then set `mapName`, `mapImage` and `script`. Thumbnails are ideally 512x512.
- Third-party assets: credit them in the tileset's `tilesetCopyright` property and in `LICENSE.assets`.

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
- Keep `main` in the workflow and `GH_PAGES` in `.env`.
- Never copy upstream's example maps (`office.tmj`, `office.png`, upstream `conference.tmj`) over ours.
- Regenerate `package-lock.json` with `npm install` instead of merging it.
- Run `npm run buildmap` before committing.

You can also follow the `upgrade-starter-kit` skill in `.agents/skills/`, which does a file-by-file upgrade.

## Conventions

- Branch off `main` for changes and open a PR. Remember that `main` deploys.
- **Squash and merge PRs by default** so `main` gets one commit per PR (for example `gh pr merge <n> --squash`). Give the squash commit a clear title.
  **Exception: PRs that merge `upstream/master`** (the starter-kit migration, and any later upstream sync) **must use a regular merge commit** (`gh pr merge <n> --merge`).
  Squashing or rebasing those PRs would drop the upstream parent, and then the next `git merge upstream/master` would no longer know what was already synced.
- Do not commit `dist/`, `node_modules/` or `.env.secret`.
