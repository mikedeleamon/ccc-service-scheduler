from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,  # recycle before Supabase closes idle connections (~10 min)
    connect_args={
        "keepalives": 1,
        "keepalives_idle": 10,    # start probing after 10s idle
        "keepalives_interval": 5, # retry every 5s
        "keepalives_count": 3,    # give up after 3 misses (25s max dead-connection hang)
        "connect_timeout": 10,    # fail fast on a new connection instead of hanging
    },
)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()