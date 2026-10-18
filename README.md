# 🛡️ Campus Incident Information System (CIIS)

A centralized web application designed for universities and campuses to streamline incident reporting, investigation tracking, security resource dispatching, and administrative oversight.

---

## 📋 Table of Contents
- [Overview](#-overview)
- [Key Features](#-key-features)
  - [Student Portal](#1-student-portal)
  - [Investigator Portal](#2-investigator-portal)
  - [Admin Portal](#3-admin-portal)
  - [Authentication & Access Control](#4-authentication--access-control)
- [Technology Stack](#-technology-stack)
- [Project Architecture](#-project-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Installation & Setup](#installation--setup)
  - [Database Seeding](#database-seeding)
  - [Running the Application](#running-the-application)
- [API Endpoints Overview](#-api-endpoints-overview)
- [License](#-license)

---

## 🌟 Overview

The **Campus Incident Information System (CIIS)** bridges the communication gap between students, campus safety investigators, and administrative staff:
- **Students** can quickly report safety or maintenance issues and track resolution status in real time.
- **Investigators** receive dispatched cases, review incident reports, and update active case statuses directly from their dashboard.
- **Administrators** have complete oversight of campus assets, categories, locations, staff rosters, and incident triage with advanced multi-criteria filtering.

---

## 🚀 Key Features

### 1. Student Portal
- **Dashboard (`/student-home`)**: Personalized hub displaying greetings, department affiliations, and quick-action cards.
- **Report Incident (`/incident`)**: Simple form to submit new reports with categorized incident types, campus building/room mapping, timestamp picker, and detailed description.
- **My Reports (`/my-incidents`)**: Real-time status tracker for all incidents filed by the logged-in student, including severity badges, status tags, and summary metrics (**Open**, **In Progress**, **Resolved**, **Total**).
- **Student Profile (`/student/profile`)**: Academic affiliation, student ID, contact details, and cumulative reporting history statistics.

### 2. Investigator Portal
- **Dashboard (`/investigator-home`)**: Clean interface showing current specialization and active workflow cards.
- **My Active Cases (`/my-cases`)**: Comprehensive case management table listing incidents assigned to the investigator. Allows inline updating of investigation status (**Open** → **In Progress** → **Resolved** → **Closed**).
- **Investigator Profile (`/investigator/profile`)**: Professional credentials, staff ID, security specialization, availability status, and case resolution breakdown.

### 3. Admin Portal
- **Dashboard (`/admin-home`)**: High-level control panel linking to campus asset management.
- **Incident Triage & Assignment (`/admin/incidents`)**:
  - Interactive multi-criteria filtering accordion: Severity multi-select, dual-handle date slider with calendar picker, and multi-investigator checkboxes (including unassigned reports).
  - Instant live filter application without page reload.
  - Interactive table header sorting (`ID`, `Date`, `Severity`).
  - Inline severity rating assignment and investigator dispatching.
- **Category Management (`/admin/add-category`)**: Add and manage campus incident categories (e.g., Theft, Vandalism, Harassment) with instant table deletion.
- **Location Management (`/admin/add-location`)**: Register campus buildings, floor numbers, room IDs, and location types (Indoor/Outdoor).
- **Student Management (`/admin/students`)**: Roster of registered student accounts with deletion capabilities.
- **Investigator Management (`/admin/investigators`)**: Directory of campus safety officers, specializations, and staff IDs with deletion capabilities.

### 4. Authentication & Access Control
- **Unified Portal Login (`/`)**: Role-based authentication tabs for Students, Investigators, and Administrators.
- Self-service account registration for students and investigators.
- Client-side session management (`localStorage`) with route guards preventing cross-role access.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Backend** | Python 3.10+, [FastAPI](https://fastapi.tiangolo.com/), [SQLAlchemy 2.0](https://www.sqlalchemy.org/), [Pydantic v2](https://docs.pydantic.dev/), [Uvicorn](https://www.uvicorn.org/) |
| **Database** | [MySQL](https://www.mysql.com/) via [PyMySQL](https://pymysql.readthedocs.io/) |
| **Frontend** | Vanilla JavaScript (ES6+), HTML5, CSS3 Custom Properties (Design Tokens), [Manrope](https://fonts.google.com/specimen/Manrope) & [DM Sans](https://fonts.google.com/specimen/DM+Sans) typography |
| **Tooling** | Python `venv`, Bash automation (`run.sh`) |

---

## 📁 Project Architecture

```
ciid/
├── run.sh                          # One-click startup script (venv, deps, uvicorn)
├── requirements.txt                # Python dependencies
├── .env                            # Environment variables (DB credentials)
├── src/
│   ├── config.py                   # Environment loader & DB connection string
│   ├── database.py                 # SQLAlchemy engine and session factory
│   ├── models.py                   # Database ORM models (Student, Incident, etc.)
│   ├── crud.py                     # Database access layer & query logic
│   ├── main.py                     # FastAPI application routes & API endpoints
│   └── seed.py                     # Database initialization and mock data seeder
└── web/
    ├── core/                       # Shared styles (core.css), utilities (core.js)
    ├── login/                      # Unified login and signup portal
    ├── student/
    │   ├── home/                   # Student home dashboard
    │   ├── incident/               # Incident report submission form
    │   ├── my-reports/             # Student reports tracker & statistics
    │   └── profile/                # Student profile & history overview
    ├── investigator/
    │   ├── home/                   # Investigator home dashboard
    │   ├── my-cases/               # Assigned case management & status updater
    │   └── profile/                # Investigator profile & case metrics
    └── admin/
        ├── home/                   # Admin central dashboard
        ├── incidents/              # Incident triage, assignment, and filters
        ├── add-category/           # Incident categories manager
        ├── add-location/           # Campus location mapper
        ├── students/               # Student roster manager
        └── investigators/          # Investigator roster manager
```

---

## 🏁 Getting Started

### Prerequisites
- Python 3.10 or higher
- MySQL Server 8.0+ running locally or remotely

### Environment Configuration
Create a `.env` file in the root project directory:

```env
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ciid_db
```

Ensure the MySQL database exists before starting:
```sql
CREATE DATABASE IF NOT EXISTS ciid_db;
```

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd ciid
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

### Database Seeding
Populate the database with sample categories, campus locations, students, investigators, and test incidents:
```bash
python src/seed.py
```

### Running the Application

You can use the provided startup script:
```bash
chmod +x run.sh
./run.sh
```

Or run Uvicorn directly:
```bash
uvicorn main:app --app-dir src --reload --reload-dir src --host 127.0.0.1 --port 8000
```

Once running, navigate to:
```
http://127.0.0.1:8000
```

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| **GET** | `/api/students` | List all registered students |
| **POST** | `/api/students` | Register a new student |
| **DELETE** | `/api/students/{id}` | Delete a student account |
| **GET** | `/api/students/{id}/incidents` | List incidents reported by a specific student |
| **GET** | `/api/investigators` | List all investigators |
| **POST** | `/api/investigators` | Register a new investigator |
| **DELETE** | `/api/investigators/{id}` | Delete an investigator |
| **GET** | `/api/investigators/{id}/cases` | List incidents assigned to an investigator |
| **PUT** | `/api/investigations/{id}/status` | Update investigation status |
| **GET** | `/api/categories` | List all incident categories |
| **POST** | `/api/categories` | Create a new incident category |
| **DELETE** | `/api/categories/{id}` | Delete a category |
| **GET** | `/api/locations` | List campus locations |
| **POST** | `/api/locations` | Create a campus location |
| **DELETE** | `/api/locations/{id}` | Delete a location |
| **GET** | `/api/incidents` | List incidents with sorting and multi-filtering |
| **GET** | `/api/incidents/bounds` | Get min/max incident dates for date pickers |
| **POST** | `/api/incidents` | Submit a new incident report |
| **PUT** | `/api/incidents/{id}/assign` | Assign severity and investigator to an incident |
| **POST** | `/api/admin/login` | Administrator authentication |

---

## 📄 License
This project is developed for educational and campus safety management purposes.
