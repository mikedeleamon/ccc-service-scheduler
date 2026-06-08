from datetime import date

from app.scheduling.calendar import (
    easter_sunday,
    generate_services,
    is_nth_weekday,
    last_weekday_of_month,
    service_for_date,
)
from app.scheduling.positions import (
    CHRISTMAS_SERVICE,
    DEVOTIONAL_SERVICE,
    EASTER_SERVICE,
    MERCY_DAY_SERVICE,
    NEW_MOON_SERVICE,
    NEW_YEARS_SERVICE,
    POWER_DAY_SERVICE,
    YOUTH_SERVICE,
)

THURSDAY = 3
SUNDAY = 6


def test_easter_sunday():
    assert easter_sunday(2026) == date(2026, 4, 5)
    assert easter_sunday(2024) == date(2024, 3, 31)
    assert easter_sunday(2025) == date(2025, 4, 20)


def test_last_thursday():
    # Last Thursday of June 2026 is the 25th.
    assert last_weekday_of_month(2026, 6, THURSDAY) == date(2026, 6, 25)
    # Last Thursday of December 2026 is the 31st.
    assert last_weekday_of_month(2026, 12, THURSDAY) == date(2026, 12, 31)


def test_third_sunday():
    # 3rd Sunday of June 2026 is the 21st.
    assert is_nth_weekday(date(2026, 6, 21), SUNDAY, 3)
    assert not is_nth_weekday(date(2026, 6, 14), SUNDAY, 3)


def test_service_for_date_weekly():
    assert service_for_date(date(2026, 6, 7)) == (DEVOTIONAL_SERVICE, "10:00")   # 1st Sunday
    assert service_for_date(date(2026, 6, 21)) == (YOUTH_SERVICE, "10:00")       # 3rd Sunday
    assert service_for_date(date(2026, 6, 3)) == (MERCY_DAY_SERVICE, "18:00")    # Wednesday
    assert service_for_date(date(2026, 6, 5)) == (POWER_DAY_SERVICE, "18:00")    # Friday
    assert service_for_date(date(2026, 6, 25)) == (NEW_MOON_SERVICE, "22:00")    # last Thursday
    assert service_for_date(date(2026, 6, 2)) is None                            # Tuesday


def test_service_for_date_special():
    assert service_for_date(date(2026, 4, 5)) == (EASTER_SERVICE, "10:00")       # Easter
    assert service_for_date(date(2026, 12, 24)) == (CHRISTMAS_SERVICE, "18:00")  # Christmas Eve
    assert service_for_date(date(2026, 12, 31)) == (NEW_YEARS_SERVICE, "22:00")  # NYE (overrides Thu New Moon)


def test_generate_services_dedup_count():
    specs = generate_services(date(2026, 6, 1), date(2026, 6, 30))
    types = [s["service_type"] for s in specs]
    # June 2026: Sundays 7,14,21,28 (21 -> Youth), Wednesdays 3,10,17,24, Fridays 5,12,19,26, New Moon 25.
    assert types.count(YOUTH_SERVICE) == 1
    assert types.count(DEVOTIONAL_SERVICE) == 3
    assert types.count(MERCY_DAY_SERVICE) == 4
    assert types.count(POWER_DAY_SERVICE) == 4
    assert types.count(NEW_MOON_SERVICE) == 1
