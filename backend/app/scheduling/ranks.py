"""Canonical CCC rank hierarchy.

Each title maps to a numeric position within its gender's hierarchy. Some titles
share the same number (parallel ladders, e.g. Elder / Woli are both rank 3) — the
number expresses relative seniority, which is what the scheduling rules compare.
"""
from __future__ import annotations

MALE = "Male"
FEMALE = "Female"

# title -> (rank number, gender)
RANK_INFO: dict[str, tuple[int, str]] = {
    # ---- Men (main ladder) ----
    "Brother": (1, MALE),
    "Anointed Brother": (2, MALE),
    "Elder": (3, MALE),
    "Cape Elder Brother": (4, MALE),
    "Senior Elder": (5, MALE),
    "Assistant Leader": (6, MALE),
    "Leader": (7, MALE),
    "Senior Leader": (8, MALE),
    "Superior Senior Leader": (9, MALE),
    "Assistant Evangelist": (10, MALE),
    "Evangelist": (11, MALE),
    "Honorary Senior Evangelist": (12, MALE),
    "Senior Evangelist": (13, MALE),
    "Most Senior Evangelist": (14, MALE),
    "Superior Evangelist": (15, MALE),
    "Supreme Evangelist": (16, MALE),
    "Pastor C.C.C. Worldwide": (17, MALE),
    # ---- Men (parallel ladder) ----
    "Woli": (3, MALE),
    "Wolijah": (4, MALE),
    "Woleader": (7, MALE),
    "Senior Woleader": (8, MALE),
    "Superior Senior Woleader": (9, MALE),
    # ---- Women (main ladder) ----
    "Sister": (1, FEMALE),
    "Elder Sister": (2, FEMALE),
    "Cape Elder Sister": (3, FEMALE),
    "Senior Elder Sister": (4, FEMALE),
    "Superior Senior Elder Sister": (5, FEMALE),
    "Lace Superior Senior Elder Sister": (6, FEMALE),
    # ---- Women (parallel ladder) ----
    "Prophetess": (2, FEMALE),
    "Cape Elder Prophetess": (3, FEMALE),
    "Senior Prophetess": (4, FEMALE),
    "Superior Senior Prophetess": (5, FEMALE),
}


def rank_number(rank: str | None) -> int:
    """Seniority number for a rank title; unknown/empty ranks sort lowest (0)."""
    if not rank:
        return 0
    info = RANK_INFO.get(rank.strip())
    return info[0] if info else 0


def rank_gender(rank: str | None) -> str | None:
    """Gender implied by a rank title, or None if unknown."""
    if not rank:
        return None
    info = RANK_INFO.get(rank.strip())
    return info[1] if info else None
