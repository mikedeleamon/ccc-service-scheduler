"""Service positions and which positions each service type needs.

Gender partition (from the church rules):
  - Women may ONLY render the 2nd member prayer and the closing prayer.
  - Men may render any position EXCEPT the 2nd member prayer and closing prayer.
So every position is effectively single-gender.
"""

# ---- Position names (also used as the assignment `role` value) ----
SERVICE_CONDUCTOR = "Service Conductor"
FIRST_MEMBER_PRAYER = "1st member prayer"
SECOND_MEMBER_PRAYER = "2nd member prayer"
THIRD_MEMBER_PRAYER = "3rd member prayer"
FIRST_LESSON = "1st lesson"
SECOND_LESSON = "2nd lesson"
PREACHER = "Preacher"
CLOSING_PRAYER = "Closing prayer"

# Positions that women fill; everything else is filled by men.
WOMEN_POSITIONS = {SECOND_MEMBER_PRAYER, CLOSING_PRAYER}

# ---- Service types ----
DEVOTIONAL_SERVICE = "Devotional Service"
MERCY_DAY_SERVICE = "Mercy Day Service"
POWER_DAY_SERVICE = "Power Day Service"
NEW_MOON_SERVICE = "New Moon Service"
EASTER_SERVICE = "Easter Service"
CHRISTMAS_SERVICE = "Christmas Service"
NEW_YEARS_SERVICE = "New Years Service"
YOUTH_SERVICE = "Youth Service"

SERVICE_TYPES = [
    DEVOTIONAL_SERVICE,
    MERCY_DAY_SERVICE,
    POWER_DAY_SERVICE,
    NEW_MOON_SERVICE,
    EASTER_SERVICE,
    CHRISTMAS_SERVICE,
    NEW_YEARS_SERVICE,
    YOUTH_SERVICE,
]

# Full set (with 2nd lesson) used by devotional-style services.
DEVOTIONAL_POSITIONS = [
    SERVICE_CONDUCTOR,
    FIRST_MEMBER_PRAYER,
    SECOND_MEMBER_PRAYER,
    THIRD_MEMBER_PRAYER,
    FIRST_LESSON,
    SECOND_LESSON,
    PREACHER,
    CLOSING_PRAYER,
]

# Mercy-style set: same, minus the 2nd lesson.
MERCY_POSITIONS = [
    SERVICE_CONDUCTOR,
    FIRST_MEMBER_PRAYER,
    SECOND_MEMBER_PRAYER,
    THIRD_MEMBER_PRAYER,
    FIRST_LESSON,
    PREACHER,
    CLOSING_PRAYER,
]

SERVICE_POSITIONS: dict[str, list[str]] = {
    DEVOTIONAL_SERVICE: DEVOTIONAL_POSITIONS,
    EASTER_SERVICE: DEVOTIONAL_POSITIONS,
    YOUTH_SERVICE: DEVOTIONAL_POSITIONS,
    MERCY_DAY_SERVICE: MERCY_POSITIONS,
    POWER_DAY_SERVICE: MERCY_POSITIONS,
    NEW_MOON_SERVICE: MERCY_POSITIONS,
    CHRISTMAS_SERVICE: MERCY_POSITIONS,
    NEW_YEARS_SERVICE: MERCY_POSITIONS,
}

# Appointment services: only the shepherd conducts AND preaches (rule 6).
APPOINTMENT_SERVICES = {NEW_MOON_SERVICE, NEW_YEARS_SERVICE}

# Services where the shepherd always preaches (rule 7). The first Sunday of the
# month is handled separately in the scheduler since it depends on the date.
SHEPHERD_PREACH_SERVICES = {EASTER_SERVICE, CHRISTMAS_SERVICE}


def positions_for(service_type: str) -> list[str]:
    """Ordered positions for a service type (empty list if unknown type)."""
    return SERVICE_POSITIONS.get(service_type, [])
