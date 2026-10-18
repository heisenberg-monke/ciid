from database import SessionLocal, engine, Base
from models import Student, Investigator, IncidentCategory, Location, Incident
from datetime import datetime

def seed_data():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Seed Students
        students = [
            Student(name="Alice Smith", email="alice@student.example.com", phone="1234567890", department="Computer Science"),
            Student(name="Bob Jones", email="bob@student.example.com", phone="0987654321", department="Electrical Engineering"),
            Student(name="Charlie Brown", email="charlie@student.example.com", phone="5551234567", department="Mechanical Engineering"),
        ]
        db.add_all(students)
        db.commit()

        # 2. Seed Investigators
        investigators = [
            Investigator(staff_id="STF001", name="Officer Sarah", email="sarah@staff.example.com", specialization="Theft", availability_status="Available"),
            Investigator(staff_id="STF002", name="Officer Mike", email="mike@staff.example.com", specialization="Vandalism", availability_status="Available"),
        ]
        db.add_all(investigators)
        db.commit()

        # 3. Seed Categories
        categories = [
            IncidentCategory(category_name="Theft", description="Theft of personal or university property"),
            IncidentCategory(category_name="Vandalism", description="Damage to university property"),
            IncidentCategory(category_name="Harassment", description="Interpersonal conflicts or harassment"),
        ]
        db.add_all(categories)
        db.commit()

        # 4. Seed Locations
        locations = [
            Location(building="Main Library", room_no="Floor 2", location_type="Indoor"),
            Location(building="Engineering Block", room_no="Lab 101", location_type="Indoor"),
            Location(building="Campus Square", room_no="North Gate", location_type="Outdoor"),
        ]
        db.add_all(locations)
        db.commit()

        # 5. Seed Incidents
        incidents = [
            Incident(
                category_id=categories[0].category_id,
                location_id=locations[0].location_id,
                reported_by=students[0].student_id,
                incident_date=datetime(2026, 10, 1),
                description="Laptop stolen from library desk",
                severity="High",
                status="Open"
            ),
            Incident(
                category_id=categories[1].category_id,
                location_id=locations[1].location_id,
                reported_by=students[1].student_id,
                incident_date=datetime(2026, 10, 5),
                description="Graffiti on lab walls",
                severity="Medium",
                status="In Progress"
            ),
            Incident(
                category_id=categories[0].category_id,
                location_id=locations[2].location_id,
                reported_by=students[2].student_id,
                incident_date=datetime(2026, 10, 10),
                description="Wallet missing near north gate",
                severity="Low",
                status="Closed"
            ),
        ]
        db.add_all(incidents)
        db.commit()

        print("Sample data seeded successfully!")
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
