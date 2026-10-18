import crud, models

from database               import SessionLocal, engine, Base
from datetime               import datetime
from fastapi                import FastAPI, Depends, HTTPException
from fastapi.responses      import FileResponse
from fastapi.staticfiles    import StaticFiles
from pathlib                import Path
from pydantic               import BaseModel
from sqlalchemy.orm         import Session

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Campus Incident Management System")

BASE_DIR = Path(__file__).resolve().parent.parent
WEB_DIR = BASE_DIR / "web"

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Pydantic Schemas ---
class StudentCreate(BaseModel):
    name: str
    email: str
    phone: str | None = None
    department: str

class IncidentCreate(BaseModel):
    category_id: int
    location_id: int
    reported_by: int
    incident_date: datetime
    severity: str
    description: str

class InvestigatorCreate(BaseModel):
    staff_id: str
    name: str
    email: str
    specialization: str | None = None

# --- API Endpoints ---
@app.get("/api/students")
def read_students(db: Session = Depends(get_db)):
    return crud.get_students(db)

@app.post("/api/students")
def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    return crud.create_student(db, name=student.name, email=student.email, phone=student.phone, department=student.department)

@app.get("/api/categories")
def read_categories(db: Session = Depends(get_db)):
    return crud.get_categories(db)

@app.get("/api/locations")
def read_locations(db: Session = Depends(get_db)):
    return crud.get_locations(db)

@app.get("/api/incidents")
def read_incidents(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    sort_by: str = None,
    sort_order: str = 'asc',
    severity: list[str] = None,
    date_min: str = None,
    date_max: str = None
):
    return crud.get_incidents(
        db, skip=skip, limit=limit,
        sort_by=sort_by, sort_order=sort_order,
        severities=severity, date_min=date_min, date_max=date_max
    )

@app.post("/api/incidents")
def create_incident(incident: IncidentCreate, db: Session = Depends(get_db)):
    return crud.create_incident(
        db, 
        category_id=incident.category_id,
        location_id=incident.location_id,
        reported_by=incident.reported_by,
        incident_date=incident.incident_date,
        severity=incident.severity,
        description=incident.description
    )

# --- Serve Multi-Page Frontend ---
app.mount("/static", StaticFiles(directory=str(WEB_DIR)), name="static")

@app.get("/")
def serve_login():
    return FileResponse(str(WEB_DIR / "login" / "login.html"))

@app.get("/home")
def serve_home():
    return FileResponse(str(WEB_DIR / "home" / "home.html"))

@app.get("/incident")
def serve_incident():
    return FileResponse(str(WEB_DIR / "incident" / "incident.html"))

@app.get("/api/investigators")
def read_investigators(db: Session = Depends(get_db)):
    return crud.get_investigators(db)

@app.post("/api/investigators")
def create_investigator(inv: InvestigatorCreate, db: Session = Depends(get_db)):
    return crud.create_investigator(db, staff_id=inv.staff_id, name=inv.name, email=inv.email, specialization=inv.specialization)

@app.get("/student-home")
def serve_student_home():
    return FileResponse(str(WEB_DIR / "home" / "student-home.html"))

@app.get("/investigator-home")
def serve_investigator_home():
    return FileResponse(str(WEB_DIR / "home" / "investigator-home.html"))

# --- Schemas ---
class CategoryCreate(BaseModel):
    category_name: str
    description: str | None = None

class LocationCreate(BaseModel):
    building: str
    room_no: str
    location_type: str

class IncidentAssign(BaseModel):
    severity: str
    investigator_id: int | None = None

class AdminLogin(BaseModel):
    email: str
    password: str

# --- Student Incident Creation (No severity from student) ---
class StudentIncidentCreate(BaseModel):
    category_id: int
    location_id: int
    reported_by: int
    incident_date: datetime
    description: str

@app.post("/api/incidents")
def create_incident(incident: StudentIncidentCreate, db: Session = Depends(get_db)):
    return crud.create_incident(
        db, 
        category_id=incident.category_id,
        location_id=incident.location_id,
        reported_by=incident.reported_by,
        incident_date=incident.incident_date,
        severity=None, # Student does not set severity
        description=incident.description
    )

# --- Admin APIs ---
@app.post("/api/admin/login")
def admin_login(data: AdminLogin, db: Session = Depends(get_db)):
    admin = crud.get_admin_by_credentials(db, data.email)
    if admin and admin.password == data.password:
        return {"admin_id": admin.admin_id, "username": admin.username, "email": admin.email}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/api/categories")
def add_category(cat: CategoryCreate, db: Session = Depends(get_db)):
    return crud.create_category(db, cat.category_name, cat.description)

@app.post("/api/locations")
def add_location(loc: LocationCreate, db: Session = Depends(get_db)):
    return crud.create_location(db, loc.building, loc.room_no, loc.location_type)

@app.delete("/api/students/{student_id}")
def remove_student(student_id: int, db: Session = Depends(get_db)):
    if crud.delete_student(db, student_id):
        return {"message": "Student deleted"}
    raise HTTPException(status_code=404, detail="Student not found")

@app.delete("/api/investigators/{investigator_id}")
def remove_investigator(investigator_id: int, db: Session = Depends(get_db)):
    if crud.delete_investigator(db, investigator_id):
        return {"message": "Investigator deleted"}
    raise HTTPException(status_code=404, detail="Investigator not found")

@app.put("/api/incidents/{incident_id}/assign")
def assign_incident(incident_id: int, data: IncidentAssign, db: Session = Depends(get_db)):
    updated = crud.assign_severity_and_investigator(db, incident_id, data.severity, data.investigator_id)
    if updated:
        return updated
    raise HTTPException(status_code=404, detail="Incident not found")

# --- Page Routes ---
@app.get("/admin-home")
def serve_admin_home():
    return FileResponse(str(WEB_DIR / "admin" / "home" / "home.html"))

@app.get("/admin/add-category")
def serve_add_category():
    return FileResponse(str(WEB_DIR / "admin" / "add-category" / "add-category.html"))

@app.get("/admin/add-location")
def serve_add_location():
    return FileResponse(str(WEB_DIR / "admin" / "add-location" / "add-location.html"))

@app.get("/admin/incidents")
def serve_admin_incidents():
    return FileResponse(str(WEB_DIR / "admin" / "incidents" / "incidents.html"))

@app.get("/admin/students")
def serve_admin_students():
    return FileResponse(str(WEB_DIR / "admin" / "students" / "students.html"))

@app.get("/admin/investigators")
def serve_admin_investigators():
    return FileResponse(str(WEB_DIR / "admin" / "investigators" / "investigators.html"))