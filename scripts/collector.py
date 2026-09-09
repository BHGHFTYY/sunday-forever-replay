#!/usr/bin/env python3
"""
Sleeper live-matchup collector.

Every run:
  1. Refreshes the local player-name cache (data/players_cache.json) at most
     once every 24h — Sleeper asks not to hit /players/nfl more often.
  2. Looks up the current NFL week.
  3. Finds "my" roster (via LEAGUE_ID + USER_ID) and this week's opponent.
  4. Appends a timestamped snapshot (score + full starting lineup with live
     points) to data/snapshots_week{N}.json.
  5. Updates data/current.json, a small pointer/index file the frontend
     reads to know which weeks have data and who played whom.

No external dependencies — stdlib only, so the GitHub Actions workflow
doesn't need a pip install step.
"""
import json
import os
import urllib.request
from datetime import datetime, timezone

LEAGUE_ID = "1312186976245391360"
USER_ID = "651506591132246016"

BASE = "https://api.sleeper.app/v1"
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
PLAYERS_CACHE_PATH = os.path.join(DATA_DIR, "players_cache.json")
CURRENT_PATH = os.path.join(DATA_DIR, "current.json")

HEADERS = {"User-Agent": "sunday-forever-replay/1.0 (personal fantasy football replay tool)"}


def fetch_json(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def load_json(path, default):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return default


def save_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        f.write("\n")


def get_players_cache():
    """Refresh the full player list at most once every 24h."""
    cache = load_json(PLAYERS_CACHE_PATH, None)
    now = datetime.now(timezone.utc)
    if cache is not None:
        fetched_at = datetime.fromisoformat(cache["fetched_at"])
        age_hours = (now - fetched_at).total_seconds() / 3600
        if age_hours < 24:
            return cache["players"]

    print("Refreshing player cache from Sleeper (once/day)...")
    players = fetch_json(f"{BASE}/players/nfl")
    slim = {
        pid: {
            "name": p.get("full_name") or f"{p.get('first_name', '')} {p.get('last_name', '')}".strip() or pid,
            "position": p.get("position"),
            "team": p.get("team"),
        }
        for pid, p in players.items()
    }
    save_json(PLAYERS_CACHE_PATH, {"fetched_at": now.isoformat(), "players": slim})
    return slim


def build_lineup(roster_entry, roster_positions, players_by_id):
    starters = roster_entry.get("starters") or []
    starters_points = roster_entry.get("starters_points") or []
    slots = [p for p in roster_positions if p != "BN"]

    lineup = []
    for i, pid in enumerate(starters):
        slot = slots[i] if i < len(slots) else "FLEX"
        pts = starters_points[i] if i < len(starters_points) else 0.0
        info = players_by_id.get(pid, {"name": pid, "position": None, "team": None})
        lineup.append({
            "slot": slot,
            "player_id": pid,
            "name": info["name"],
            "position": info["position"],
            "team": info["team"],
            "points": pts,
        })
    return lineup


def team_name_for(roster, users_by_id):
    user = users_by_id.get(roster.get("owner_id"))
    if not user:
        return f"Roster {roster['roster_id']}"
    metadata = user.get("metadata") or {}
    return metadata.get("team_name") or user.get("display_name") or f"Roster {roster['roster_id']}"


def main():
    state = fetch_json(f"{BASE}/state/nfl")
    week = state["week"]

    league = fetch_json(f"{BASE}/league/{LEAGUE_ID}")
    rosters = fetch_json(f"{BASE}/league/{LEAGUE_ID}/rosters")
    users = fetch_json(f"{BASE}/league/{LEAGUE_ID}/users")
    matchups = fetch_json(f"{BASE}/league/{LEAGUE_ID}/matchups/{week}")

    users_by_id = {u["user_id"]: u for u in users}
    rosters_by_id = {r["roster_id"]: r for r in rosters}

    my_roster = next((r for r in rosters if r.get("owner_id") == USER_ID), None)
    if my_roster is None:
        raise SystemExit(f"Could not find a roster owned by user_id={USER_ID} in league {LEAGUE_ID}")
    my_roster_id = my_roster["roster_id"]

    my_matchup = next((m for m in matchups if m["roster_id"] == my_roster_id), None)
    if my_matchup is None:
        print(f"No matchup found yet for week {week} (offseason / bye?) — skipping snapshot.")
        return

    matchup_id = my_matchup["matchup_id"]
    opp_matchup = next(
        (m for m in matchups if m["matchup_id"] == matchup_id and m["roster_id"] != my_roster_id),
        None,
    )
    if opp_matchup is None:
        print(f"No opponent found for week {week} (bye week?) — skipping snapshot.")
        return

    players_by_id = get_players_cache()
    roster_positions = league["roster_positions"]

    opp_roster = rosters_by_id[opp_matchup["roster_id"]]
    my_team_name = team_name_for(my_roster, users_by_id)
    opp_team_name = team_name_for(opp_roster, users_by_id)

    snapshot = {
        "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "week": week,
        "my": {
            "roster_id": my_roster_id,
            "team_name": my_team_name,
            "points": my_matchup.get("points", 0.0),
            "lineup": build_lineup(my_matchup, roster_positions, players_by_id),
        },
        "opp": {
            "roster_id": opp_roster["roster_id"],
            "team_name": opp_team_name,
            "points": opp_matchup.get("points", 0.0),
            "lineup": build_lineup(opp_matchup, roster_positions, players_by_id),
        },
    }

    snapshots_path = os.path.join(DATA_DIR, f"snapshots_week{week}.json")
    snapshots = load_json(snapshots_path, [])
    snapshots.append(snapshot)
    save_json(snapshots_path, snapshots)
    print(f"Appended snapshot #{len(snapshots)} for week {week}: "
          f"{my_team_name} {snapshot['my']['points']} vs {opp_team_name} {snapshot['opp']['points']}")

    current = load_json(CURRENT_PATH, {"league_name": league.get("name"), "my_roster_id": my_roster_id, "weeks": {}})
    current["league_name"] = league.get("name")
    current["my_roster_id"] = my_roster_id
    current["generated_at"] = snapshot["timestamp"]
    current["latest_week"] = week
    current.setdefault("weeks", {})[str(week)] = {
        "my_team_name": my_team_name,
        "opponent_team_name": opp_team_name,
        "opponent_roster_id": opp_roster["roster_id"],
        "snapshot_count": len(snapshots),
        "file": f"data/snapshots_week{week}.json",
    }
    save_json(CURRENT_PATH, current)


if __name__ == "__main__":
    main()
