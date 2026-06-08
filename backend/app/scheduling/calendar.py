"""Date logic for the recurring CCC service calendar.

Python weekday convention: Monday=0 ... Sunday=6.
"""
from __future__ import annotations

from calendar import monthrange
from datetime import date, timedelta

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

SUNDAY = 6
WEDNESDAY = 2
THURSDAY = 3
FRIDAY = 4


def easter_sunday(year: int) -> date:
    """Gregorian Easter Sunday (Anonymous / Meeus-Jones-Butcher algorithm)."""
    a = year % 19
    b = year // 100
    c = year % 100
    d = b // 4
    e = b % 4
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i = c // 4
    k = c % 4
    ell = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * ell) // 451
    month = (h + ell - 7 * m + 114) // 31
    day = ((h + ell - 7 * m + 114) % 31) + 1
    return date(year, month, day)


def is_nth_weekday(d: date, weekday: int, n: int) -> bool:
    """True if d is the nth occurrence of `weekday` in its month (1-based)."""
    return d.weekday() == weekday and (d.day - 1) // 7 == n - 1


def last_weekday_of_month(year: int, month: int, weekday: int) -> date:
    """Date of the last given weekday in a month."""
    last_day = monthrange(year, month)[1]
    d = date(year, month, last_day)
    offset = (d.weekday() - weekday) % 7
    return d - timedelta(days=offset)


def service_for_date(d: date) -> tuple[str, str] | None:
    """Return (service_type, time) for a date, or None if no service that day.

    Special calendar dates (Christmas Eve, NYE) take priority over the regular
    weekday services and replace them when they collide.
    """
    # Fixed-date special services first (override the regular weekday service).
    if d.month == 12 and d.day == 24:
        return CHRISTMAS_SERVICE, "18:00"
    if d.month == 12 and d.day == 31:
        return NEW_YEARS_SERVICE, "22:00"

    wd = d.weekday()
    if wd == SUNDAY:
        if d == easter_sunday(d.year):
            return EASTER_SERVICE, "10:00"
        if is_nth_weekday(d, SUNDAY, 3):
            return YOUTH_SERVICE, "10:00"
        return DEVOTIONAL_SERVICE, "10:00"
    if wd == WEDNESDAY:
        return MERCY_DAY_SERVICE, "18:00"
    if wd == FRIDAY:
        return POWER_DAY_SERVICE, "18:00"
    if wd == THURSDAY and d == last_weekday_of_month(d.year, d.month, THURSDAY):
        return NEW_MOON_SERVICE, "22:00"
    return None


def generate_services(start_date: date, end_date: date, parish: str | None = None) -> list[dict]:
    """All service specs between start_date and end_date inclusive.

    Each dict: {date, time, service_type, parish}. Caller is responsible for
    de-duplicating against services already in the database.
    """
    specs: list[dict] = []
    d = start_date
    while d <= end_date:
        result = service_for_date(d)
        if result:
            service_type, time = result
            specs.append({
                "date": d,
                "time": time,
                "service_type": service_type,
                "parish": parish,
            })
        d += timedelta(days=1)
    return specs
