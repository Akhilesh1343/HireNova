import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Database URL: default to SQLite in the backend directory
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "screening.db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency that provides an isolated SQLAlchemy database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create database tables if they do not exist and seed initial demo data."""
    # Import models so they are registered with Base metadata
    from backend.models import db_models
    Base.metadata.create_all(bind=engine)

    # Lightweight migration check for sqlite users table columns
    try:
        with engine.connect() as conn:
            from sqlalchemy import text
            existing_cols = [r[1] for r in conn.execute(text("PRAGMA table_info(users);")).fetchall()]
            if "company_name" not in existing_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN company_name VARCHAR(255);"))
            if "avatar_url" not in existing_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url TEXT;"))
            if "notification_preferences" not in existing_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN notification_preferences TEXT;"))
            if "theme_preference" not in existing_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN theme_preference VARCHAR(50) DEFAULT 'dark';"))
            conn.commit()
    except Exception as e:
        print(f"[init_db] Column migration note: {e}")

