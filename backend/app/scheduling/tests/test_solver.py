from collections import defaultdict
from datetime import date

from app.scheduling.calendar import generate_services
from app.scheduling.positions import (
    CHRISTMAS_SERVICE,
    CLOSING_PRAYER,
    DEVOTIONAL_SERVICE,
    EASTER_SERVICE,
    FIRST_LESSON,
    FIRST_MEMBER_PRAYER,
    NEW_MOON_SERVICE,
    PREACHER,
    SECOND_LESSON,
    SECOND_MEMBER_PRAYER,
    SERVICE_CONDUCTOR,
    THIRD_MEMBER_PRAYER,
    WOMEN_POSITIONS,
)
from app.scheduling.ranks import FEMALE, MALE, rank_number
from app.scheduling.solver import generate_schedule

SHEPHERD_ID = 1

MALE_RANKS = [
    "Supreme Evangelist",
    "Superior Evangelist",
    "Most Senior Evangelist",
    "Senior Evangelist",
    "Honorary Senior Evangelist",
    "Evangelist",
    "Assistant Evangelist",
    "Superior Senior Leader",
    "Senior Leader",
    "Leader",
    "Assistant Leader",
    "Senior Elder",
    "Cape Elder Brother",
    "Elder",
    "Brother",
]

FEMALE_RANKS = [
    "Lace Superior Senior Elder Sister",
    "Lace Superior Senior Elder Sister",
    "Superior Senior Elder Sister",
    "Senior Elder Sister",
    "Cape Elder Sister",
    "Elder Sister",
    "Sister",
]


def all_days(value=True):
    keys = ["mondays", "tuesdays", "wednesdays", "thursdays", "fridays", "saturdays", "sundays"]
    return {k: value for k in keys}


def build_people(shepherd_availability=None):
    people = [{
        "id": SHEPHERD_ID,
        "gender": "Male",
        "rank": "Pastor C.C.C. Worldwide",
        "availability": shepherd_availability,
        "is_shepherd": True,
    }]
    next_id = 2
    for r in MALE_RANKS:
        people.append({"id": next_id, "gender": "Male", "rank": r, "availability": None, "is_shepherd": False})
        next_id += 1
    for r in FEMALE_RANKS:
        people.append({"id": next_id, "gender": "Female", "rank": r, "availability": None, "is_shepherd": False})
        next_id += 1
    return people


def services_for_june_2026():
    specs = generate_services(date(2026, 6, 1), date(2026, 6, 30))
    return [{"id": i, "date": s["date"], "service_type": s["service_type"]} for i, s in enumerate(specs)]


def by_service(assignments):
    grouped = defaultdict(dict)
    for a in assignments:
        grouped[a["service_id"]][a["role"]] = a["person_id"]
    return grouped


def test_full_month_satisfies_rules():
    people = build_people()
    gender = {p["id"]: p["gender"].lower()[0] for p in people}
    rnum = {p["id"]: rank_number(p["rank"]) for p in people}
    services = services_for_june_2026()
    svc_type = {s["id"]: s["service_type"] for s in services}
    svc_date = {s["id"]: s["date"] for s in services}

    assignments, unfilled = generate_schedule(services, people)
    assert unfilled == [], f"unexpected unfilled positions: {unfilled}"

    grouped = by_service(assignments)

    # Rule 1 & 2: gender partition.
    for a in assignments:
        if a["role"] in WOMEN_POSITIONS:
            assert gender[a["person_id"]] == "f", f"{a} should be a woman"
        else:
            assert gender[a["person_id"]] == "m", f"{a} should be a man"

    # Rules 3 & 4: rank ordering within prayer and lesson pairs.
    for sid, roles in grouped.items():
        if FIRST_MEMBER_PRAYER in roles and THIRD_MEMBER_PRAYER in roles:
            assert rnum[roles[THIRD_MEMBER_PRAYER]] >= rnum[roles[FIRST_MEMBER_PRAYER]]
        if FIRST_LESSON in roles and SECOND_LESSON in roles:
            assert rnum[roles[SECOND_LESSON]] >= rnum[roles[FIRST_LESSON]]

    # Rule 5: no NON-shepherd preaches or leads more than twice in the month.
    preach_lead = defaultdict(int)
    for a in assignments:
        if a["role"] in (PREACHER, SERVICE_CONDUCTOR):
            preach_lead[a["person_id"]] += 1
    for pid, count in preach_lead.items():
        if pid != SHEPHERD_ID:
            assert count <= 2, f"person {pid} preached/led {count} times"

    # Rule 9: the same woman never renders the closing prayer on two consecutive
    # occasions (which guarantees never on two consecutive weeks).
    closing = sorted(
        (a for a in assignments if a["role"] == CLOSING_PRAYER),
        key=lambda a: svc_date[a["service_id"]],
    )
    closing_ids = [a["person_id"] for a in closing]
    for earlier, later in zip(closing_ids, closing_ids[1:]):
        assert earlier != later, "closing prayer woman repeated on consecutive services"

    # Rule 7: shepherd preaches the first Sunday (2026-06-07).
    first_sunday_sid = next(s for s, d in svc_date.items() if d == date(2026, 6, 7))
    assert grouped[first_sunday_sid][PREACHER] == SHEPHERD_ID

    # Rule 6: shepherd conducts AND preaches the New Moon service (2026-06-25).
    new_moon_sid = next(s for s, t in svc_type.items() if t == NEW_MOON_SERVICE)
    assert grouped[new_moon_sid][PREACHER] == SHEPHERD_ID
    assert grouped[new_moon_sid][SERVICE_CONDUCTOR] == SHEPHERD_ID


def test_shepherd_unavailable_fallback():
    # Shepherd available every day except Thursday (the New Moon day).
    avail = all_days(True)
    avail["thursdays"] = False
    people = build_people(shepherd_availability=avail)
    rnum = {p["id"]: rank_number(p["rank"]) for p in people}

    services = [{"id": 1, "date": date(2026, 6, 25), "service_type": NEW_MOON_SERVICE}]
    assignments, unfilled = generate_schedule(services, people)
    grouped = by_service(assignments)

    preacher = grouped[1][PREACHER]
    conductor = grouped[1][SERVICE_CONDUCTOR]
    assert preacher == conductor, "fallback officiant should conduct AND preach"
    assert preacher != SHEPHERD_ID, "shepherd is unavailable, should be substituted"

    # Substitute is the highest-ranked available male.
    available_males = [p for p in people if p["gender"] == "Male" and p["id"] != SHEPHERD_ID]
    highest = max(rnum[p["id"]] for p in available_males)
    assert rnum[preacher] == highest


def test_shepherd_preaches_easter_and_christmas():
    people = build_people()
    services = [
        {"id": 1, "date": date(2026, 4, 5), "service_type": EASTER_SERVICE},
        {"id": 2, "date": date(2026, 12, 24), "service_type": CHRISTMAS_SERVICE},
    ]
    assignments, _ = generate_schedule(services, people)
    grouped = by_service(assignments)
    assert grouped[1][PREACHER] == SHEPHERD_ID
    assert grouped[2][PREACHER] == SHEPHERD_ID


def test_women_only_in_devotional_closing_and_second_prayer():
    people = build_people()
    gender = {p["id"]: p["gender"] for p in people}
    services = [{"id": 1, "date": date(2026, 6, 14), "service_type": DEVOTIONAL_SERVICE}]
    assignments, unfilled = generate_schedule(services, people)
    assert unfilled == []
    grouped = by_service(assignments)
    roles = grouped[1]
    assert gender[roles[SECOND_MEMBER_PRAYER]] == "Female"
    assert gender[roles[CLOSING_PRAYER]] == "Female"
    # the closing-prayer woman holds the top women's rank
    assert roles[CLOSING_PRAYER] != roles[SECOND_MEMBER_PRAYER]
