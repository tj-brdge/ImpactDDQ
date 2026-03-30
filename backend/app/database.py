import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "impact_ddq.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_database():
    from app.models import Company, Tag
    db = SessionLocal()

    if db.query(Company).count() > 0:
        db.close()
        return

    companies = [
        Company(
            name="SolarHarvest Energy",
            sector="clean energy",
            stage="series B",
            location="Nairobi, Kenya",
            founded_year=2019,
            description="Distributed solar microgrids providing affordable electricity to off-grid communities in East Africa. Operates 47 microgrids serving 120,000+ households.",
        ),
        Company(
            name="AquaPure Technologies",
            sector="water & sanitation",
            stage="series A",
            location="Mumbai, India",
            founded_year=2020,
            description="Low-cost water purification systems using proprietary membrane technology. Deployed in 200+ rural communities across South Asia.",
        ),
        Company(
            name="GreenYield Agriculture",
            sector="sustainable agriculture",
            stage="growth",
            location="Des Moines, Iowa",
            founded_year=2017,
            description="Precision agriculture platform combining satellite imagery and AI to optimize crop yields while reducing water and fertilizer usage by 30-40%.",
        ),
        Company(
            name="MicroFinance Plus",
            sector="financial inclusion",
            stage="series B",
            location="Lagos, Nigeria",
            founded_year=2018,
            description="Mobile-first lending platform for smallholder farmers and micro-entrepreneurs. 500,000+ active borrowers with 97% repayment rate.",
        ),
        Company(
            name="HealthBridge Diagnostics",
            sector="healthcare access",
            stage="series A",
            location="Medellín, Colombia",
            founded_year=2021,
            description="Portable AI-powered diagnostic devices for rural clinics. Enables lab-quality testing for 15+ conditions without specialized equipment.",
        ),
        Company(
            name="EduReach Global",
            sector="education",
            stage="seed",
            location="Kigali, Rwanda",
            founded_year=2022,
            description="Offline-first educational platform delivering interactive STEM curriculum to schools with limited internet connectivity.",
        ),
        Company(
            name="CircularPack Solutions",
            sector="circular economy",
            stage="series A",
            location="Amsterdam, Netherlands",
            founded_year=2020,
            description="Biodegradable packaging made from agricultural waste. Partnerships with 50+ consumer brands replacing single-use plastics.",
        ),
        Company(
            name="HomeFirst Affordable Housing",
            sector="affordable housing",
            stage="growth",
            location="São Paulo, Brazil",
            founded_year=2016,
            description="Modular construction system reducing housing costs by 45%. Has delivered 8,000+ affordable units across Latin America.",
        ),
        Company(
            name="ClimateShield Insurance",
            sector="climate adaptation",
            stage="series B",
            location="Dhaka, Bangladesh",
            founded_year=2019,
            description="Parametric insurance products protecting smallholder farmers against climate events. Uses satellite data for automatic payout triggers.",
        ),
        Company(
            name="FemPower Finance",
            sector="gender lens",
            stage="seed",
            location="Kampala, Uganda",
            founded_year=2023,
            description="Women-focused savings and investment platform with integrated financial literacy training. 85,000+ registered users in first year.",
        ),
    ]

    tags = [
        Tag(name="clean energy"),
        Tag(name="financial inclusion"),
        Tag(name="healthcare access"),
        Tag(name="sustainable agriculture"),
        Tag(name="affordable housing"),
        Tag(name="gender lens"),
        Tag(name="climate adaptation"),
        Tag(name="circular economy"),
        Tag(name="education"),
        Tag(name="water & sanitation"),
    ]

    db.add_all(companies)
    db.add_all(tags)
    db.commit()
    db.close()
