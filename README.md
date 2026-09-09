# Sunday Forever — Spoiler-Free Replay

A DVR for my fantasy football matchup. It records my live Sleeper score
(mine vs. my opponent, every week) every ~10 minutes during game windows,
then lets me "replay" the whole matchup the next morning — one step at a
time, with no way to peek at the final result.

## How it works

- **`scripts/collector.py`** — a dependency-free Python script that:
  1. Asks Sleeper's [`/state/nfl`](https://api.sleeper.app/v1/state/nfl) for the current week.
  2. Finds my roster in league `1312186976245391360` via my Sleeper user ID.
  3. Finds my opponent for that week via `/league/{id}/matchups/{week}`.
  4. Appends a timestamped snapshot — both scores plus full starting
     lineups with live per-player points — to `data/snapshots_week{N}.json`.
  5. Updates `data/current.json`, a small pointer file the site reads to
     know which weeks have data and who's playing whom.
  6. Caches `/players/nfl` (a multi-MB file Sleeper asks not to hammer) to
     `data/players_cache.json` and only refreshes it once every 24h.

- **`.github/workflows/collect.yml`** — runs the collector on a schedule
  and commits any new snapshot data back to the repo. Schedule:
  `*/10 15-23,0-5 * * 0,1,2,4,5,6` (UTC) — every 10 minutes, roughly
  11am ET Thursday through the end of Monday Night Football, covering
  Thursday/Saturday/Sunday/Monday games. Can also be run manually from
  the Actions tab (`workflow_dispatch`).

- **`index.html`** — a static, mobile-friendly, dark-themed page with no
  build step. It reads `data/current.json` and `data/snapshots_week{N}.json`
  directly (same-origin, served by GitHub Pages) and renders a replay:
  - Loads to the **first** snapshot of the match — never the live/final one.
  - **Play** auto-advances through snapshots like a recording; **Pause**
    stops it; the step buttons move one snapshot at a time.
  - The progress bar is a read-only indicator, not a seekable slider —
    there's no way to drag, skip, or jump to the end. The only way to see
    a score is to actually play/step through the timeline.

## Local testing

```bash
python scripts/collector.py
python -m http.server 8000
```

Then open `http://localhost:8000`.
