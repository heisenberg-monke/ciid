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

def get_incidents_date_bounds(db: Session):
    from sqlalchemy import func
    bounds = db.query(func.min(Incident.incident_date), func.max(Incident.incident_date)).first()
    return {"min": bounds[0], "max": bounds[1]}

# --- Incidents ---
def get_incidents(db: Session, skip: int = 0, limit: int = 100, sort_by: str = None, sort_order: str = 'asc', severities: list = None, date_min: str = None, date_max: str = None):
    from sqlalchemy import case, asc, desc, or_
    query = db.query(Incident)

    # Filtering
    if severities:
        # Include unassigned (NULL) incidents when any severity filter is active,
        # otherwise they disappear forever because NULL never matches IN (...).
        query = query.filter(
            or_(
                Incident.severity.in_(severities),
                Incident.severity.is_(None)
            )
        )
    if date_min:
        query = query.filter(Incident.incident_date >= date_min)
    if date_max:
        query = query.filter(Incident.incident_date <= date_max)

    # Sorting
    if sort_by:
        if sort_by == 'severity':
            severity_order = case(
                (Incident.severity == 'Low', 1),
                (Incident.severity == 'Medium', 2),
                (Incident.severity == 'High', 3),
                (Incident.severity == 'Critical', 4),
                else_=0
            )
            order_func = asc if sort_order == 'asc' else desc
            query = query.order_by(order_func(severity_order))
        else:
            attr = getattr(Incident, sort_by, Incident.incident_id)
            order_func = asc if sort_order == 'asc' else desc
            query = query.order_by(order_func(attr))
    else:
        query = query.order_by(Incident.incident_id.desc())

    return query.offset(skip).limit(limit).all()

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

def get_investigators(db: Session):
    return db.query(Investigator).all()

def create_investigator(db: Session, staff_id: str, name: str, email: str, specialization: str):
    db_inv = Investigator(staff_id=staff_id, name=name, email=email, specialization=specialization)
    db.add(db_inv)
    db.commit()
    db.refresh(db_inv)
    return db_inv

from sqlalchemy.orm import Session
from models import Student, Incident, IncidentCategory, Location, Investigator, Investigation, Admin

# --- Admin Auth & Setup ---
def get_admin_by_credentials(db: Session, email: str):
    return db.query(Admin).filter(Admin.email == email).first()

# --- Category & Location Creation ---
def create_category(db: Session, category_name: str, description: str = None):
    cat = IncidentCategory(category_name=category_name, description=description)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

def create_location(db: Session, building: str, room_no: str, location_type: str):
    loc = Location(building=building, room_no=room_no, location_type=location_type)
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return loc

# --- Deleting Users & Investigators ---
def delete_student(db: Session, student_id: int):
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if student:
        db.delete(student)
        db.commit()
        return True
    return False

def delete_investigator(db: Session, investigator_id: int):
    inv = db.query(Investigator).filter(Investigator.investigator_id == investigator_id).first()
    if inv:
        db.delete(inv)
        db.commit()
        return True
    return False

def delete_category(db: Session, category_id: int):
    cat = db.query(IncidentCategory).filter(IncidentCategory.category_id == category_id).first()
    if cat:
        db.delete(cat)
        db.commit()
        return True
    return False

def delete_location(db: Session, location_id: int):
    loc = db.query(Location).filter(Location.location_id == location_id).first()
    if loc:
        db.delete(loc)
        db.commit()
        return True
    return False

# --- Admin Incident Management ---
def assign_severity_and_investigator(db: Session, incident_id: int, severity: str, investigator_id: int = None):
    incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not incident:
        return None
    
    incident.severity = severity
    
    if investigator_id:
        # Check if an investigation record exists or create new
        inv = db.query(Investigation).filter(Investigation.incident_id == incident_id).first()
        if inv:
            inv.investigator_id = investigator_id
        else:
            new_inv = Investigation(
                incident_id=incident_id,
                investigator_id=investigator_id,
                status="In Progress"
            )
            db.add(new_inv)
    
    db.commit()
    db.refresh(incident)
    return incident