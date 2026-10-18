from database           import Base
from datetime           import datetime
from sqlalchemy         import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm     import relationship

class Student(Base):
    __tablename__ = "students"

    student_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    department = Column(String(100), nullable=False)

    incidents_reported = relationship("Incident", back_populates="reporter", foreign_keys="[Incident.reported_by]")
    evidence_collected = relationship("Evidence", back_populates="collector", foreign_keys="[Evidence.collected_by]")
    witness_profile = relationship("Witness", back_populates="student", uselist=False)


class Location(Base):
    __tablename__ = "locations"

    location_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    building = Column(String(100), nullable=False)
    room_no = Column(String(50), nullable=False)
    location_type = Column(String(100), nullable=False)

    incidents = relationship("Incident", back_populates="location")


class IncidentCategory(Base):
    __tablename__ = "incident_categories"

    category_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category_name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)

    incidents = relationship("Incident", back_populates="category")


class Incident(Base):
    __tablename__ = "incidents"

    incident_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category_id = Column(Integer, ForeignKey("incident_categories.category_id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.location_id"), nullable=False)
    reported_by = Column(Integer, ForeignKey("students.student_id"), nullable=False)
    incident_date = Column(DateTime, nullable=False)
    reported_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    severity = Column(String(50), nullable=True) # Nullable until Admin assigns it
    description = Column(Text, nullable=False)
    status = Column(String(50), default="Open", nullable=False)

    category = relationship("IncidentCategory", back_populates="incidents")
    location = relationship("Location", back_populates="incidents")
    reporter = relationship("Student", foreign_keys=[reported_by], back_populates="incidents_reported")
    investigations = relationship("Investigation", back_populates="incident")
    evidence = relationship("Evidence", back_populates="incident")
    interviews = relationship("Interview", back_populates="incident")
    actions = relationship("IncidentAction", back_populates="incident")
    history = relationship("IncidentHistory", back_populates="incident")


class Investigator(Base):
    __tablename__ = "investigators"

    investigator_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    staff_id = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    specialization = Column(String(100), nullable=True)
    availability_status = Column(String(50), default="Available", nullable=False)

    investigations = relationship("Investigation", back_populates="investigator")
    interviews = relationship("Interview", back_populates="investigator")


class Investigation(Base):
    __tablename__ = "investigations"

    investigation_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    incident_id = Column(Integer, ForeignKey("incidents.incident_id"), nullable=False)
    investigator_id = Column(Integer, ForeignKey("investigators.investigator_id"), nullable=False)
    start_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    expected_completion = Column(DateTime, nullable=True)
    actual_completion = Column(DateTime, nullable=True)
    status = Column(String(50), default="In Progress", nullable=False)
    remarks = Column(Text, nullable=True)

    incident = relationship("Incident", back_populates="investigations")
    investigator = relationship("Investigator", back_populates="investigations")
    findings = relationship("Finding", back_populates="investigation")


class EvidenceType(Base):
    __tablename__ = "evidence_types"

    evidence_type_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    type_name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)

    evidence_items = relationship("Evidence", back_populates="evidence_type")


class Evidence(Base):
    __tablename__ = "evidence"

    evidence_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    incident_id = Column(Integer, ForeignKey("incidents.incident_id"), nullable=False)
    evidence_type_id = Column(Integer, ForeignKey("evidence_types.evidence_type_id"), nullable=False)
    collected_by = Column(Integer, ForeignKey("students.student_id"), nullable=False)
    collection_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    storage_location = Column(String(150), nullable=False)
    status = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)

    incident = relationship("Incident", back_populates="evidence")
    evidence_type = relationship("EvidenceType", back_populates="evidence_items")
    collector = relationship("Student", foreign_keys=[collected_by], back_populates="evidence_collected")


class Witness(Base):
    __tablename__ = "witnesses"

    witness_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.student_id"), nullable=False)
    contact_info = Column(String(150), nullable=False)
    remarks = Column(Text, nullable=True)

    student = relationship("Student", back_populates="witness_profile")
    interviews = relationship("Interview", back_populates="witness")


class Interview(Base):
    __tablename__ = "interviews"

    interview_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    incident_id = Column(Integer, ForeignKey("incidents.incident_id"), nullable=False)
    witness_id = Column(Integer, ForeignKey("witnesses.witness_id"), nullable=False)
    investigator_id = Column(Integer, ForeignKey("investigators.investigator_id"), nullable=False)
    interview_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    summary = Column(Text, nullable=False)

    incident = relationship("Incident", back_populates="interviews")
    witness = relationship("Witness", back_populates="interviews")
    investigator = relationship("Investigator", back_populates="interviews")


class Finding(Base):
    __tablename__ = "findings"

    finding_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    investigation_id = Column(Integer, ForeignKey("investigations.investigation_id"), nullable=False)
    finding_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    finding_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    confidence_level = Column(String(50), nullable=True)

    investigation = relationship("Investigation", back_populates="findings")


class ActionTaken(Base):
    __tablename__ = "actions_taken"

    action_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    action_name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)

    incident_actions = relationship("IncidentAction", back_populates="action")


class IncidentAction(Base):
    __tablename__ = "incident_actions"

    incident_action_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    incident_id = Column(Integer, ForeignKey("incidents.incident_id"), nullable=False)
    action_id = Column(Integer, ForeignKey("actions_taken.action_id"), nullable=False)
    assigned_to = Column(String(100), nullable=False)
    action_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String(50), nullable=False)
    remarks = Column(Text, nullable=True)

    incident = relationship("Incident", back_populates="actions")
    action = relationship("ActionTaken", back_populates="incident_actions")


class IncidentHistory(Base):
    __tablename__ = "incident_history"

    history_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    incident_id = Column(Integer, ForeignKey("incidents.incident_id"), nullable=False)
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    changed_by = Column(String(100), nullable=False)
    change_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    remarks = Column(Text, nullable=True)

    incident = relationship("Incident", back_populates="history")

class Admin(Base):
    __tablename__ = "admins"

    admin_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(100), nullable=False)
    