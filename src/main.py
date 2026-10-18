from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from database import SessionLocal, engine, Base
import crud, models

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
def read_incidents(db: Session = Depends(get_db)):
    return crud.get_incidents(db)

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