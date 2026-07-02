"""Deterministic constructive scheduler for CCC services.

Processes services in chronological order so the stateful rules (monthly
preach/lead caps and the closing-prayer rotation) can be tracked as it goes.

Returns (assignments, unfilled):
  assignments: list of {service_id, person_id, role}  (role == position name)
  unfilled:    list of {service_id, role}              (positions with no candidate)

Each service dict must provide: id, date (datetime.date), service_type.
Each person dict must provide: id, gender, rank, availability, is_shepherd.
"""
from __future__ import annotations

from collections import defaultdict

from app.scheduling.calendar import SUNDAY, is_nth_weekday
from app.scheduling.positions import (
    APPOINTMENT_SERVICES,
    CLOSING_PRAYER,
    FIRST_LESSON,
    FIRST_MEMBER_PRAYER,
    PREACHER,
    SECOND_LESSON,
    SECOND_MEMBER_PRAYER,
    SERVICE_CONDUCTOR,
    SHEPHERD_PREACH_SERVICES,
    THIRD_MEMBER_PRAYER,
    positions_for,
)
from app.scheduling.ranks import FEMALE, MALE, rank_gender, rank_number

# weekday() index (Mon=0 .. Sun=6) -> availability JSON key
WEEKDAY_KEYS = [
    "mondays",
    "tuesdays",
    "wednesdays",
    "thursdays",
    "fridays",
    "saturdays",
    "sundays",
]

MONTHLY_PREACH_LEAD_CAP = 2
MONTHLY_ROLE_CAP = 2  # max times one person may fill the same role in a calendar month


def _gender(p: dict) -> str | None:
    g = (p.get("gender") or "").strip().lower()
    if g.startswith("m"):
        return MALE
    if g.startswith("f"):
        return FEMALE
    return rank_gender(p.get("rank"))


def is_available(p: dict, weekday: int) -> bool:
    """A person with no availability data is treated as always available."""
    av = p.get("availability")
    if not av or not isinstance(av, dict):
        return True
    return bool(av.get(WEEKDAY_KEYS[weekday], False))


def generate_schedule(services: list[dict], people: list[dict]):
    males = [p for p in people if _gender(p) == MALE]
    females = [p for p in people if _gender(p) == FEMALE]
    shepherd = next((p for p in people if p.get("is_shepherd")), None)

    # Closing-prayer pool: women holding the highest women's rank present.
    closing_pool_ids: set = set()
    if females:
        top_rank = max(rank_number(p.get("rank")) for p in females)
        closing_pool_ids = {p["id"] for p in females if rank_number(p.get("rank")) == top_rank}

    load: dict = defaultdict(int)             # person_id -> positions assigned (fairness)
    preach_lead: dict = defaultdict(int)      # (person_id, (year, month)) -> count (rule 5)
    role_month_count: dict = defaultdict(int) # (person_id, role, ym) -> count (rule A)

    assignments: list[dict] = []
    unfilled: list[dict] = []

    # Closing-prayer rotation (rule 9): the same top-rank woman may not render the
    # closing prayer on two consecutive occasions, so she is never chosen on two
    # consecutive weeks either.
    last_closing_woman: int | None = None

    for svc in sorted(services, key=lambda s: (s["date"], s.get("time") or "")):
        d = svc["date"]
        wd = d.weekday()
        ym = (d.year, d.month)
        stype = svc["service_type"]
        positions = positions_for(stype)
        if not positions:
            continue

        males_avail = [p for p in males if is_available(p, wd)]
        females_avail = [p for p in females if is_available(p, wd)]
        used: set = set()  # person ids already used in THIS service

        def assign(person: dict, role: str):
            assignments.append({
                "service_id": svc["id"],
                "person_id": person["id"],
                "role": role,
            })
            load[person["id"]] += 1
            used.add(person["id"])
            role_month_count[(person["id"], role, ym)] += 1

        def at_role_cap(p: dict, role: str) -> bool:
            """True when this person has already filled this role twice this month.
            Shepherd in charge is exempt from the per-role cap."""
            if shepherd and p["id"] == shepherd["id"]:
                return False
            return role_month_count[(p["id"], role, ym)] >= MONTHLY_ROLE_CAP

        womens_roles = {SECOND_MEMBER_PRAYER, CLOSING_PRAYER}

        def fail(role: str):
            # Give an actionable hint about *why* nobody could fill the slot.
            if role in womens_roles:
                if not females:
                    reason = "no women on the roster for this parish"
                elif not females_avail:
                    reason = "no women available on this day"
                else:
                    reason = "all available women already assigned to other roles"
            else:
                if not males:
                    reason = "no men on the roster for this parish"
                elif not males_avail:
                    reason = "no men available on this day"
                else:
                    reason = "all available men already assigned to other roles"
            unfilled.append({"service_id": svc["id"], "role": role, "reason": reason})

        def pick_male(exclude: set, role: str = ""):
            cands = [p for p in males_avail
                     if p["id"] not in exclude
                     and (not role or not at_role_cap(p, role))]
            if not cands:
                cands = [p for p in males_avail if p["id"] not in exclude]  # relax cap
            if not cands:
                cands = males_avail[:]  # forced reuse when pool exhausted
            if not cands:
                return None
            cands.sort(key=lambda p: (load[p["id"]], rank_number(p.get("rank")), p["id"]))
            return cands[0]

        def pick_two_males(exclude: set, role1: str = "", role2: str = "",
                           no_shepherd_in_first: bool = False):
            """Return (lower_rank, higher_rank) males for an ordered position pair.
            no_shepherd_in_first prevents the shepherd from filling role1 (Rule B)."""
            shep_id = shepherd["id"] if shepherd else None
            lower_exclude = exclude | ({shep_id} if no_shepherd_in_first and shep_id else set())

            first = pick_male(lower_exclude, role1)
            if first is None and no_shepherd_in_first:
                first = pick_male(exclude, role1)  # relax shepherd exclusion if no one else
            if not first:
                return None, None

            second = pick_male(exclude | {first["id"]}, role2)
            if not second:
                return first, None

            pair = sorted([first, second], key=lambda p: rank_number(p.get("rank")))
            # If rank sort puts shepherd in role1 position, swap to honour Rule B
            if no_shepherd_in_first and shep_id and pair[0]["id"] == shep_id:
                pair = [pair[1], pair[0]]
            return pair[0], pair[1]

        def pick_preach_lead(exclude: set, role: str):
            cands = [
                p for p in males_avail
                if p["id"] not in exclude
                and preach_lead[(p["id"], ym)] < MONTHLY_PREACH_LEAD_CAP
                and not at_role_cap(p, role)
            ]
            if not cands:  # relax per-role cap
                cands = [
                    p for p in males_avail
                    if p["id"] not in exclude
                    and preach_lead[(p["id"], ym)] < MONTHLY_PREACH_LEAD_CAP
                ]
            if not cands:  # relax both caps
                cands = [p for p in males_avail if p["id"] not in exclude]
            if not cands:
                return None
            cands.sort(key=lambda p: (
                load[p["id"]],
                preach_lead[(p["id"], ym)],
                rank_number(p.get("rank")),
                p["id"],
            ))
            return cands[0]

        def highest_male(exclude: set):
            cands = [p for p in males_avail if p["id"] not in exclude]
            if not cands:
                cands = males_avail[:]
            if not cands:
                return None
            cands.sort(key=lambda p: (-rank_number(p.get("rank")), load[p["id"]], p["id"]))
            return cands[0]

        def pick_female(pool_ids: set | None, exclude: set, avoid: set):
            pool = (
                females_avail if pool_ids is None
                else [p for p in females_avail if p["id"] in pool_ids]
            )
            cands = [p for p in pool if p["id"] not in exclude and p["id"] not in avoid]
            if not cands:  # relax the "not last week" rule if forced
                cands = [p for p in pool if p["id"] not in exclude]
            if not cands:
                cands = pool[:]
            if not cands:
                return None
            cands.sort(key=lambda p: (load[p["id"]], rank_number(p.get("rank")), p["id"]))
            return cands[0]

        shepherd_avail = shepherd is not None and is_available(shepherd, wd)
        is_appointment = stype in APPOINTMENT_SERVICES
        first_sunday = wd == SUNDAY and is_nth_weekday(d, SUNDAY, 1)
        shepherd_preaches = (
            is_appointment
            or stype in SHEPHERD_PREACH_SERVICES
            or first_sunday
        )

        # --- Service Conductor & Preacher (shepherd rules) ---
        if is_appointment:
            # Rule 6: shepherd conducts AND preaches; rule 8 fallback substitute.
            officiant = shepherd if shepherd_avail else highest_male(set())
            if PREACHER in positions:
                if officiant:
                    assign(officiant, PREACHER)
                    preach_lead[(officiant["id"], ym)] += 1
                else:
                    fail(PREACHER)
            if SERVICE_CONDUCTOR in positions:
                if officiant:
                    assign(officiant, SERVICE_CONDUCTOR)
                    preach_lead[(officiant["id"], ym)] += 1
                else:
                    fail(SERVICE_CONDUCTOR)
        else:
            if PREACHER in positions:
                if shepherd_preaches:
                    preacher = shepherd if shepherd_avail else highest_male(used)
                else:
                    preacher = pick_preach_lead(used, PREACHER)
                if preacher:
                    assign(preacher, PREACHER)
                    preach_lead[(preacher["id"], ym)] += 1
                else:
                    fail(PREACHER)
            if SERVICE_CONDUCTOR in positions:
                conductor = pick_preach_lead(used, SERVICE_CONDUCTOR)
                if conductor:
                    assign(conductor, SERVICE_CONDUCTOR)
                    preach_lead[(conductor["id"], ym)] += 1
                else:
                    fail(SERVICE_CONDUCTOR)

        # --- Lessons (rule 4: 2nd lesson rank >= 1st lesson rank; Rule B: shepherd not in 1st) ---
        if FIRST_LESSON in positions or SECOND_LESSON in positions:
            lower, higher = pick_two_males(
                used, FIRST_LESSON, SECOND_LESSON, no_shepherd_in_first=True
            )
            if FIRST_LESSON in positions:
                if lower:
                    assign(lower, FIRST_LESSON)
                else:
                    fail(FIRST_LESSON)
            if SECOND_LESSON in positions:
                target = higher or lower
                if target:
                    assign(target, SECOND_LESSON)
                else:
                    fail(SECOND_LESSON)

        # --- Member prayers 1 & 3 (rule 3: 3rd rank >= 1st rank; Rule B: shepherd not in 1st) ---
        if FIRST_MEMBER_PRAYER in positions or THIRD_MEMBER_PRAYER in positions:
            lower, higher = pick_two_males(
                used, FIRST_MEMBER_PRAYER, THIRD_MEMBER_PRAYER, no_shepherd_in_first=True
            )
            if FIRST_MEMBER_PRAYER in positions:
                if lower:
                    assign(lower, FIRST_MEMBER_PRAYER)
                else:
                    fail(FIRST_MEMBER_PRAYER)
            if THIRD_MEMBER_PRAYER in positions:
                target = higher or lower
                if target:
                    assign(target, THIRD_MEMBER_PRAYER)
                else:
                    fail(THIRD_MEMBER_PRAYER)

        # --- Women: 2nd member prayer (any) and closing prayer (top-rank, rotated) ---
        if SECOND_MEMBER_PRAYER in positions:
            w = pick_female(None, exclude=used, avoid=set())
            if w:
                assign(w, SECOND_MEMBER_PRAYER)
            else:
                fail(SECOND_MEMBER_PRAYER)

        if CLOSING_PRAYER in positions:
            avoid = {last_closing_woman} if last_closing_woman is not None else set()
            w = pick_female(closing_pool_ids, exclude=used, avoid=avoid)
            if w is None:  # no top-rank woman available -> any available woman
                w = pick_female(None, exclude=used, avoid=avoid)
            if w:
                assign(w, CLOSING_PRAYER)
                last_closing_woman = w["id"]
            else:
                fail(CLOSING_PRAYER)

    return assignments, unfilled
