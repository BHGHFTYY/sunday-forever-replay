#!/usr/bin/env python3
"""
One-off backfill: reconstruct a play-by-play replay timeline for a week
whose games already happened before the live collector was recording
(e.g. the 2026 season opener landing on a Wednesday, which the original
collect.yml schedule didn't cover).

Live snapshots only ever capture "whatever the score is right now" -
Sleeper's API has no history endpoint. So for a week that's already been
missed, the only way to get a real progression is to rebuild it from
public play-by-play data (nflverse, github-hosted, not blocked like
ESPN's live scoreboard) and replay each play's fantasy-point effect in
the order it actually happened, using each play's real timestamp.

This is best-effort, especially for IDP (individual defensive player)
scoring, since nflverse's per-play tackle/sack/etc. attribution doesn't
necessarily match Sleeper's own internal scoring engine exactly. To
guarantee the replay's ending is always correct even if some interior
IDP numbers are slightly approximate, the FINAL snapshot is overwritten
with Sleeper's own authoritative current/final per-player point totals
(pulled live from the matchups endpoint) rather than the computed
running total.

Usage:
    python scripts/backfill_week.py <week_number>
"""
import csv
import gzip
import io
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone

LEAGUE_ID = "1312186976245391360"
USER_ID = "651506591132246016"
SEASON = "2026"

BASE = "https://api.sleeper.app/v1"
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
HEADERS = {"User-Agent": "sunday-forever-replay/1.0 (personal fantasy football replay tool)"}


def fetch_json(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_bytes(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()


def save_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        f.write("\n")


def team_name_for(roster, users_by_id):
    user = users_by_id.get(roster.get("owner_id"))
    if not user:
        return f"Roster {roster['roster_id']}"
    metadata = user.get("metadata") or {}
    return metadata.get("team_name") or user.get("display_name") or f"Roster {roster['roster_id']}"


def load_play_by_play(season):
    print(f"Downloading nflverse play-by-play for {season}...")
    raw = fetch_bytes(f"https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_{season}.csv.gz")
    with gzip.open(io.BytesIO(raw), "rt", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    print(f"Loaded {len(rows)} plays.")
    return rows


# (id_column, name_column, team_column_or_None) — team_column None means "use
# posteam" (offense) vs a literal column name for defense-side attributions.
NAME_XWALK_COLUMNS = [
    ("passer_player_id", "passer_player_name", None),
    ("rusher_player_id", "rusher_player_name", None),
    ("receiver_player_id", "receiver_player_name", None),
    ("kicker_player_id", "kicker_player_name", None),
    ("sack_player_id", "sack_player_name", "defteam"),
    ("half_sack_1_player_id", "half_sack_1_player_name", "defteam"),
    ("half_sack_2_player_id", "half_sack_2_player_name", "defteam"),
    ("solo_tackle_1_player_id", "solo_tackle_1_player_name", "solo_tackle_1_team"),
    ("solo_tackle_2_player_id", "solo_tackle_2_player_name", "solo_tackle_2_team"),
    ("assist_tackle_1_player_id", "assist_tackle_1_player_name", "assist_tackle_1_team"),
    ("assist_tackle_2_player_id", "assist_tackle_2_player_name", "assist_tackle_2_team"),
    ("assist_tackle_3_player_id", "assist_tackle_3_player_name", "assist_tackle_3_team"),
    ("assist_tackle_4_player_id", "assist_tackle_4_player_name", "assist_tackle_4_team"),
    ("forced_fumble_player_1_player_id", "forced_fumble_player_1_player_name", "forced_fumble_player_1_team"),
    ("forced_fumble_player_2_player_id", "forced_fumble_player_2_player_name", "forced_fumble_player_2_team"),
    ("interception_player_id", "interception_player_name", "defteam"),
    ("pass_defense_1_player_id", "pass_defense_1_player_name", "defteam"),
    ("pass_defense_2_player_id", "pass_defense_2_player_name", "defteam"),
    ("fumble_recovery_1_player_id", "fumble_recovery_1_player_name", "fumble_recovery_1_team"),
]


def last_name_key(full_name):
    if not full_name:
        return ""
    return full_name.strip().split(" ")[-1].lower()


def build_name_crosswalk(plays):
    """(team, last_name) -> gsis_id, built from nflverse's own id/name pairs.
    Used as a fallback when Sleeper's own gsis_id field is missing/blank."""
    xwalk = {}
    for row in plays:
        for id_col, name_col, team_col in NAME_XWALK_COLUMNS:
            gsis = row.get(id_col)
            name = row.get(name_col)
            if not gsis or not name:
                continue
            team = row.get(team_col) if team_col else row.get("posteam")
            if not team:
                continue
            key = (team, last_name_key(name.split(".")[-1] if "." in name else name))
            xwalk[key] = gsis.strip()
    return xwalk


def build_gsis_map(plays):
    print("Fetching full Sleeper player list for GSIS-ID crosswalk...")
    players = fetch_json(f"{BASE}/players/nfl")
    name_xwalk = build_name_crosswalk(plays)

    gsis_to_sleeper = {}
    sleeper_info = {}
    fallback_matches = 0
    for pid, p in players.items():
        gsis = (p.get("gsis_id") or "").strip()
        if not gsis:
            key = (p.get("team"), last_name_key(p.get("full_name")))
            fallback_gsis = name_xwalk.get(key)
            if fallback_gsis:
                gsis = fallback_gsis
                fallback_matches += 1
        if gsis:
            gsis_to_sleeper[gsis] = pid
        sleeper_info[pid] = {
            "name": p.get("full_name") or f"{p.get('first_name', '')} {p.get('last_name', '')}".strip() or pid,
            "position": p.get("position"),
            "team": p.get("team"),
        }
    print(f"Matched {fallback_matches} players via name+team fallback (missing gsis_id in Sleeper's data).")
    return gsis_to_sleeper, sleeper_info


def f(row, key):
    v = row.get(key)
    try:
        return float(v) if v not in (None, "") else 0.0
    except ValueError:
        return 0.0


FG_TIERS = [
    (19, "fgm_0_19"), (29, "fgm_20_29"), (39, "fgm_30_39"), (49, "fgm_40_49"), (999, "fgm_50p"),
]


def fg_tier_key(distance):
    for max_dist, key in FG_TIERS:
        if distance <= max_dist:
            return key
    return "fgm_50p"


def score_play(row, scoring, gsis_to_sleeper, relevant_ids):
    """Returns {sleeper_player_id: point_delta} for one play, only for players in relevant_ids."""
    deltas = {}

    def add(gsis_id, pts):
        if not gsis_id or pts == 0:
            return
        gsis_id = gsis_id.strip()
        sid = gsis_to_sleeper.get(gsis_id)
        if sid and sid in relevant_ids:
            deltas[sid] = deltas.get(sid, 0.0) + pts

    passer = row.get("passer_player_id")
    rusher = row.get("rusher_player_id")
    receiver = row.get("receiver_player_id")

    # Passing
    if passer:
        add(passer, f(row, "passing_yards") * scoring.get("pass_yd", 0))
        if row.get("pass_touchdown") == "1":
            add(passer, scoring.get("pass_td", 0))
        if row.get("interception") == "1":
            add(passer, scoring.get("pass_int", 0))

    # Rushing
    if rusher:
        add(rusher, f(row, "rushing_yards") * scoring.get("rush_yd", 0))
        if row.get("rush_touchdown") == "1":
            add(rusher, scoring.get("rush_td", 0))

    # Receiving (PPR reception + yards + td)
    if receiver and row.get("complete_pass") == "1":
        add(receiver, scoring.get("rec", 0))
        add(receiver, f(row, "receiving_yards") * scoring.get("rec_yd", 0))
        if row.get("pass_touchdown") == "1":
            add(receiver, scoring.get("rec_td", 0))

    # Two-point conversions
    if row.get("two_point_conv_result") == "success":
        if passer and receiver:
            add(passer, scoring.get("pass_2pt", 0))
            add(receiver, scoring.get("rec_2pt", 0))
        elif rusher:
            add(rusher, scoring.get("rush_2pt", 0))

    # Return touchdowns (punt/kickoff return)
    if row.get("return_touchdown") == "1":
        returner = row.get("punt_returner_player_id") or row.get("kickoff_returner_player_id")
        if returner:
            add(returner, scoring.get("st_td", 0))

    # Fumbles lost (offense)
    if row.get("fumble_lost") == "1" and row.get("fumbled_1_player_id"):
        add(row["fumbled_1_player_id"], scoring.get("fum_lost", 0))

    # Kicking
    if row.get("field_goal_result") == "made" and row.get("kicker_player_id"):
        dist = int(f(row, "kick_distance"))
        add(row["kicker_player_id"], scoring.get(fg_tier_key(dist), 0))
    elif row.get("field_goal_result") in ("missed", "blocked") and row.get("kicker_player_id"):
        add(row["kicker_player_id"], scoring.get("fgmiss", 0))
    if row.get("extra_point_result") == "good" and row.get("kicker_player_id"):
        add(row["kicker_player_id"], scoring.get("xpm", 0))
    elif row.get("extra_point_result") in ("failed", "blocked") and row.get("kicker_player_id"):
        add(row["kicker_player_id"], scoring.get("xpmiss", 0))

    # IDP: sacks (split credit on half-sacks)
    if row.get("sack") == "1":
        if row.get("sack_player_id"):
            add(row["sack_player_id"], scoring.get("idp_sack", 0))
        else:
            for k in ("half_sack_1_player_id", "half_sack_2_player_id"):
                if row.get(k):
                    add(row[k], scoring.get("idp_sack", 0) / 2.0)

    # IDP: combined tackles (solo + assist, 1pt each per this league's config)
    for k in ("solo_tackle_1_player_id", "solo_tackle_2_player_id"):
        if row.get(k):
            add(row[k], scoring.get("idp_tkl", 0))
    for k in ("assist_tackle_1_player_id", "assist_tackle_2_player_id",
              "assist_tackle_3_player_id", "assist_tackle_4_player_id"):
        if row.get(k):
            add(row[k], scoring.get("idp_tkl", 0))

    # IDP: forced fumbles, recoveries, interceptions, pass defense, safeties
    for k in ("forced_fumble_player_1_player_id", "forced_fumble_player_2_player_id"):
        if row.get(k):
            add(row[k], scoring.get("idp_ff", 0))
    if row.get("interception_player_id"):
        add(row["interception_player_id"], scoring.get("idp_int", 0))
    for k in ("pass_defense_1_player_id", "pass_defense_2_player_id"):
        if row.get(k):
            add(row[k], scoring.get("idp_pass_def", 0))
    if row.get("safety_player_id"):
        add(row["safety_player_id"], scoring.get("idp_safe", 0))
    if row.get("fumble") == "1":
        recovering_team = row.get("fumble_recovery_1_team")
        if recovering_team and recovering_team != row.get("posteam") and row.get("fumble_recovery_1_player_id"):
            add(row["fumble_recovery_1_player_id"], scoring.get("idp_fum_rec", 0))

    return deltas


def sort_key(row):
    tod = row.get("time_of_day")
    if tod:
        return (0, tod)
    # fallback ordering for the handful of rows missing time_of_day
    qtr = int(row["qtr"]) if row.get("qtr") else 0
    secs = int(f(row, "game_seconds_remaining"))
    return (1, qtr, -secs)


def format_clock(row):
    try:
        qtr = int(row.get("qtr") or 0)
    except ValueError:
        qtr = 0
    try:
        secs = int(f(row, "game_seconds_remaining"))
    except ValueError:
        secs = None
    qlabel = "OT" if qtr > 4 else f"Q{qtr}" if qtr else ""
    if secs is None or not qtr:
        return qlabel
    # game_seconds_remaining counts down the whole regulation game (3600s);
    # convert to time remaining within just this quarter. OT periods count
    # down on their own from their own start.
    remaining = secs if qtr > 4 else secs - 900 * (4 - qtr)
    remaining = max(0, remaining)
    m, s = divmod(remaining, 60)
    return f"{qlabel} {m}:{s:02d}".strip()


def build_lineup_snapshot(starters, points_by_id, sleeper_info, roster_positions):
    slots = [p for p in roster_positions if p != "BN"]
    lineup = []
    for i, pid in enumerate(starters):
        slot = slots[i] if i < len(slots) else "FLEX"
        info = sleeper_info.get(pid, {"name": pid, "position": None, "team": None})
        lineup.append({
            "slot": slot, "player_id": pid, "name": info["name"],
            "position": info["position"], "team": info["team"],
            "points": round(points_by_id.get(pid, 0.0), 2),
        })
    return lineup


def main():
    week = int(sys.argv[1]) if len(sys.argv) > 1 else None
    if week is None:
        state = fetch_json(f"{BASE}/state/nfl")
        week = state["week"]

    league = fetch_json(f"{BASE}/league/{LEAGUE_ID}")
    rosters = fetch_json(f"{BASE}/league/{LEAGUE_ID}/rosters")
    users = fetch_json(f"{BASE}/league/{LEAGUE_ID}/users")
    matchups = fetch_json(f"{BASE}/league/{LEAGUE_ID}/matchups/{week}")
    scoring = league["scoring_settings"]
    roster_positions = league["roster_positions"]

    users_by_id = {u["user_id"]: u for u in users}
    rosters_by_id = {r["roster_id"]: r for r in rosters}

    my_roster = next(r for r in rosters if r.get("owner_id") == USER_ID)
    my_roster_id = my_roster["roster_id"]
    my_matchup = next(m for m in matchups if m["roster_id"] == my_roster_id)
    matchup_id = my_matchup["matchup_id"]
    opp_matchup = next(m for m in matchups if m["matchup_id"] == matchup_id and m["roster_id"] != my_roster_id)
    opp_roster = rosters_by_id[opp_matchup["roster_id"]]

    my_team_name = team_name_for(my_roster, users_by_id)
    opp_team_name = team_name_for(opp_roster, users_by_id)

    my_starters = my_matchup["starters"]
    opp_starters = opp_matchup["starters"]
    relevant_ids = set(my_starters) | set(opp_starters)

    plays = load_play_by_play(SEASON)
    plays = [r for r in plays if r.get("week") == str(week)]
    gsis_to_sleeper, sleeper_info = build_gsis_map(plays)
    plays.sort(key=sort_key)
    print(f"{len(plays)} week-{week} plays to replay.")

    running = {pid: 0.0 for pid in relevant_ids}
    snapshots = []

    def make_snapshot(ts, play_info=None):
        my_lineup = build_lineup_snapshot(my_starters, running, sleeper_info, roster_positions)
        opp_lineup = build_lineup_snapshot(opp_starters, running, sleeper_info, roster_positions)
        snap = {
            "timestamp": ts,
            "week": week,
            "my": {"roster_id": my_roster_id, "team_name": my_team_name,
                   "points": round(sum(p["points"] for p in my_lineup), 2), "lineup": my_lineup},
            "opp": {"roster_id": opp_roster["roster_id"], "team_name": opp_team_name,
                    "points": round(sum(p["points"] for p in opp_lineup), 2), "lineup": opp_lineup},
        }
        if play_info:
            snap["play"] = play_info
        return snap

    # Opening snapshot: kickoff, everyone at 0, no play description yet.
    first_ts = next((r["time_of_day"] for r in plays if r.get("time_of_day")), datetime.now(timezone.utc).isoformat())
    snapshots.append(make_snapshot(first_ts))

    # Emit one snapshot per actual play (not just scoring ones), so the
    # replay is literally play-by-play -- non-scoring plays will just get
    # skipped through fast by the frontend's "no change" auto-skip, while
    # the description is still there if you pause on one.
    for row in plays:
        if not row.get("desc") or row.get("desc") == "GAME":
            continue
        deltas = score_play(row, scoring, gsis_to_sleeper, relevant_ids)
        for pid, delta in deltas.items():
            running[pid] = running.get(pid, 0.0) + delta
        ts = row.get("time_of_day") or snapshots[-1]["timestamp"]
        play_info = {"clock": format_clock(row), "desc": row["desc"].strip()}
        snapshots.append(make_snapshot(ts, play_info))

    # Anchor the final snapshot to Sleeper's own authoritative numbers, so the
    # ending is always correct even if some interior IDP math is approximate.
    def anchor(matchup, lineup):
        official = matchup.get("players_points") or {}
        for p in lineup:
            if p["player_id"] in official:
                p["points"] = round(official[p["player_id"]], 2)
        return lineup

    final = snapshots[-1]
    final["my"]["lineup"] = anchor(my_matchup, final["my"]["lineup"])
    final["opp"]["lineup"] = anchor(opp_matchup, final["opp"]["lineup"])
    final["my"]["points"] = round(my_matchup.get("points", final["my"]["points"]), 2)
    final["opp"]["points"] = round(opp_matchup.get("points", final["opp"]["points"]), 2)
    final["timestamp"] = datetime.now(timezone.utc).isoformat(timespec="seconds")

    snapshots_path = os.path.join(DATA_DIR, f"snapshots_week{week}.json")
    save_json(snapshots_path, snapshots)
    print(f"Wrote {len(snapshots)} reconstructed snapshots to {snapshots_path}")

    current_path = os.path.join(DATA_DIR, "current.json")
    current = json.load(open(current_path, encoding="utf-8")) if os.path.exists(current_path) else {"weeks": {}}
    current["league_name"] = league.get("name")
    current["my_roster_id"] = my_roster_id
    current["generated_at"] = final["timestamp"]
    current["latest_week"] = week
    current.setdefault("weeks", {})[str(week)] = {
        "my_team_name": my_team_name,
        "opponent_team_name": opp_team_name,
        "opponent_roster_id": opp_roster["roster_id"],
        "snapshot_count": len(snapshots),
        "file": f"data/snapshots_week{week}.json",
    }
    save_json(current_path, current)
    print("Updated current.json")


if __name__ == "__main__":
    main()
