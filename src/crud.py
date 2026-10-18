from sqlalchemy.orm import Session
from models import Student, Incident, IncidentCategory, Location, Investigator

# --- Students ---
def get_students(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Student).offset(skip).limit(limit).all()

def create_student(db: Session, name: str, email: str, phone: str, department: str):
    db_student = Student(name=name, email=email, phone=phone, department=department)
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

# --- Lookups (Categories & Locations) ---
def get_categories(db: Session):
    return db.query(IncidentCategory).all()

def get_locations(db: Session):
    return db.query(Location).all()

def get_investigators(db: Session):
    return db.query(Investigator).all()

# --- Incidents ---
def get_incidents(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Incident).offset(skip).limit(limit).all()

def create_incident(db: Session, category_id: int, location_id: int, reported_by: int, incident_date: str, severity: str, description: str):
    db_incident = Incident(
        category_id=category_id,
        location_id=location_id,
        reported_by=reported_by,
        incident_date=incident_date,
        severity=severity,
        description=description,
        status="Open"
    )
    db.add(db_incident)
    db.commit()
    db.refresh(db_incident)
    return db_incident