from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session
from typing import Optional
import pandas as pd
import json

from app.deps import get_db
from app.models import Person

router = APIRouter()

REQUIRED_COLS = {"first name", "last name", "rank"}

COL_MAP = {
    "first name": "first_name",
    "last name": "last_name",
    "birth date": "birth_date",
    "gender": "gender",
    "phone": "phone",
    "parish": "parish",
    "email": "email",
    "rank": "rank",
    "availability": "availability",
}


def _clean_str(val) -> Optional[str]:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    s = str(val).strip()
    return s if s else None


def _clean_phone(val) -> Optional[str]:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    try:
        # Excel stores phone numbers as floats (e.g. 3016751196.0)
        return str(int(float(val)))
    except (ValueError, TypeError):
        s = str(val).strip()
        return s if s else None


def _clean_availability(val) -> Optional[dict]:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    if isinstance(val, dict):
        return val
    try:
        parsed = json.loads(str(val))
        return parsed if isinstance(parsed, dict) else None
    except (json.JSONDecodeError, TypeError):
        return None


def _clean_birth_date(val) -> Optional[str]:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    s = str(val).strip()
    return s if s else None


@router.post("/")
async def import_people(file: UploadFile, db: Session = Depends(get_db)):
    try:
        df = pd.read_excel(file.file)
    except Exception:
        raise HTTPException(status_code=422, detail="Could not read the file. Make sure it is a valid .xlsx or .xls file.")

    df.columns = [c.strip().lower() for c in df.columns]

    missing = REQUIRED_COLS - set(df.columns)
    if missing:
        raise HTTPException(
            status_code=422,
            detail=f"Missing required columns: {', '.join(sorted(missing))}",
        )

    created = 0
    updated = 0
    skipped = 0

    for _, row in df.iterrows():
        first_name = _clean_str(row.get("first name"))
        last_name = _clean_str(row.get("last name"))
        rank = _clean_str(row.get("rank"))

        if not first_name or not last_name or not rank:
            skipped += 1
            continue

        email = _clean_str(row.get("email")) if "email" in df.columns else None

        data = {
            "first_name": first_name,
            "last_name": last_name,
            "birth_date": _clean_birth_date(row.get("birth date")) if "birth date" in df.columns else None,
            "gender": _clean_str(row.get("gender")) if "gender" in df.columns else None,
            "phone": _clean_phone(row.get("phone")) if "phone" in df.columns else None,
            "parish": _clean_str(row.get("parish")) if "parish" in df.columns else None,
            "email": email,
            "rank": rank,
            "availability": _clean_availability(row.get("availability")) if "availability" in df.columns else None,
        }

        existing = None
        if email:
            existing = db.query(Person).filter(Person.email == email).first()

        if not existing:
            existing = (
                db.query(Person)
                .filter(Person.first_name == first_name, Person.last_name == last_name)
                .first()
            )

        if existing:
            for field, value in data.items():
                setattr(existing, field, value)
            updated += 1
        else:
            db.add(Person(**data))
            created += 1

    db.commit()

    return {"created": created, "updated": updated, "skipped": skipped}
