# Sunday Forever — Spoiler-Free Replay

A DVR for my fantasy football matchup. It records my live Sleeper score
(mine vs. my opponent, every week) throughout each game window, then lets
me "replay" the whole matchup afterward — dragging through the timeline
myself, with no way to peek at the final result before I get there.

## How it works

- **`scripts/collector.py`** — a dependency-free Python script that:
  1. Asks Sleeper's [`/state/nfl`](https://api.sleeper.app/v1/state/nfl) for the current week.
  2. Finds my roster in league `1312186976245391360` via my Sleeper user ID.
  3. Finds my opponent for that week via `/league/{id}/matchups/{week}`.
  4. Appends a timestamped snapshot — both scores plus full starting
     lineups with live per-player points — to `data/snapshots_week{N}.json`,
     but only if something actually changed since the last snapshot (so
     polling almost around the clock doesn't fill the file with thousands
     of identical duplicate entries once a game is over).
  5. Updates `data/current.json`, a small pointer file the site reads to
     know which weeks have data and who's playing whom.
  6. Caches `/players/nfl` (a multi-MB file Sleeper asks not to hammer) to
     `data/players_cache.json` and only refreshes it once every 24h.

- **`.github/workflows/collect.yml`** — runs the collector on a schedule
  and commits any new snapshot data back to the repo. Schedule: every 10
  minutes, every day of the week, 10:00-23:59 and 00:00-05:59 UTC (roughly
  6am ET through 1am ET the next day). NFL games don't stick to a fixed
  Thu/Sat/Sun/Mon pattern (Wednesday openers, Friday international games,
  Christmas games, etc.), so this covers every realistic kickoff window
  instead of guessing specific days. Can also be run manually from the
  Actions tab (`workflow_dispatch`). This repo is public, so GitHub Actions
  minutes are free.

- **`scripts/backfill_week.py`** — a manual, one-off recovery tool for a
  week that was already missed live (this is how week 1 got fixed, after
  the season opener landed on a Wednesday before the schedule above
  existed). Since Sleeper's API has no history endpoint — it only ever
  reports the current/final score — a missed week can't be recovered from
  Sleeper alone. Instead this script:
  1. Downloads that week's actual play-by-play from
     [nflverse](https://github.com/nflverse/nflverse-data) (public,
     GitHub-hosted, includes a real timestamp per play).
  2. Crosswalks each play's NFL GSIS player ID to a Sleeper player ID
     (Sleeper's own `gsis_id` field is missing for a lot of players, so it
     falls back to matching by team + last name against nflverse's own
     name fields when needed).
  3. Replays every play in real chronological order, applying the
     league's actual scoring settings (including IDP: tackles, sacks,
     forced fumbles, interceptions, pass defense, etc.) to build a
     timestamped snapshot after each play that changed someone's score.
  4. Overwrites only the **final** snapshot with Sleeper's own
     authoritative per-player point totals, so the ending is always
     exactly correct even though the interior progression is a best-effort
     reconstruction (mainly for IDP stats, where play-by-play attribution
     doesn't always match Sleeper's internal scoring engine precisely).

  Run it with `python scripts/backfill_week.py <week_number>`.

- **`index.html`** — a static, mobile-friendly, dark-themed page with no
  build step. It reads `data/current.json` and `data/snapshots_week{N}.json`
  directly (same-origin, served by GitHub Pages) and renders a replay:
  - Loads to the **first** snapshot of the match — never the live/final one.
  - A draggable scrubber lets you move freely through the timeline by
    hand; **Play** auto-advances through it, **Pause** stops it.
  - Play behaves like a DVR skipping commercials: snapshots where nothing
    changed zip by almost instantly, while a snapshot where the score
    actually moved holds at your chosen Slow/Normal/Fast pace, with a
    "+X.XX" badge and a brief highlight on whichever player just scored.
  - If a week has no scoring changes recorded yet (e.g. before kickoff),
    a banner says so instead of Play silently doing nothing.

## Local testing

```bash
python scripts/collector.py
python -m http.server 8000
```

Then open `http://localhost:8000`.
