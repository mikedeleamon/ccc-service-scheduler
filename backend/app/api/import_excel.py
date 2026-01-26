from fastapi import APIRouter, UploadFile
import pandas as pd

router = APIRouter()

@router.post("/")
async def import_people(file: UploadFile):
    df = pd.read_excel(file.file)

    required_cols = {"first name", "last name", "birth date", "gender", "phone", "parish", "email", "rank", "availability"}
    if not required_cols.issubset(df.columns):
        return {"error": "Missing required columns"}

    df["roles"] = df["roles"].apply(lambda x: [r.strip() for r in x.split(",")])

    records = df.to_dict(orient="records")

    print(records)
    return {
        "preview": records,
        "count": len(records)
    }
