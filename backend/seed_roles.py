import json
from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.database import SessionLocal, init_db
from backend.models.db_models import User
from backend.utils.auth import hash_password

init_db()
db = SessionLocal()

import os

admin_email = os.getenv("ADMIN_EMAIL", "admin@hirenova.com").lower().strip()
admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
recruiter_email = os.getenv("RECRUITER_EMAIL", "recruiter@hirenova.com").lower().strip()
recruiter_password = os.getenv("RECRUITER_PASSWORD", "recruiter123")
manager_email = os.getenv("HIRING_MANAGER_EMAIL", "manager@hirenova.com").lower().strip()
manager_password = os.getenv("HIRING_MANAGER_PASSWORD", "manager123")
hr_email = os.getenv("HR_LEAD_EMAIL", "hrlead@hirenova.com").lower().strip()
hr_password = os.getenv("HR_LEAD_PASSWORD", "hrlead123")

seed_accounts = [
    {
        "email": admin_email,
        "password": admin_password,
        "full_name": "System Administrator",
        "role": "admin",
        "company_name": "HireNova Enterprise"
    },
    {
        "email": recruiter_email,
        "password": recruiter_password,
        "full_name": "Senior Recruiter",
        "role": "recruiter",
        "company_name": "HireNova Operations"
    },
    {
        "email": manager_email,
        "password": manager_password,
        "full_name": "Engineering Hiring Manager",
        "role": "hiring_manager",
        "company_name": "HireNova Engineering"
    },
    {
        "email": hr_email,
        "password": hr_password,
        "full_name": "HR Lead Director",
        "role": "hr_lead",
        "company_name": "HireNova People & Culture"
    },
    # Compatibility aliases
    {
        "email": "admin@talentai.com",
        "password": "admin123",
        "full_name": "System Administrator",
        "role": "admin",
        "company_name": "HireNova Enterprise"
    },
    {
        "email": "recruiter@talentai.com",
        "password": "recruiter123",
        "full_name": "Senior Recruiter",
        "role": "recruiter",
        "company_name": "HireNova Operations"
    },
    {
        "email": "hiring.manager@talentai.com",
        "password": "manager123",
        "full_name": "Engineering Hiring Manager",
        "role": "hiring_manager",
        "company_name": "HireNova Engineering"
    },
    {
        "email": "hr.lead@talentai.com",
        "password": "hrlead123",
        "full_name": "HR Lead Director",
        "role": "hr_lead",
        "company_name": "HireNova People & Culture"
    }
]

for acc in seed_accounts:
    user = db.query(User).filter(User.email == acc["email"]).first()
    if not user:
        user = User(
            email=acc["email"],
            hashed_password=hash_password(acc["password"]),
            full_name=acc["full_name"],
            role=acc["role"],
            company_name=acc["company_name"],
            is_active=True
        )
        db.add(user)
        db.commit()
        print(f"Created user: {acc['email']} -> {acc['role']}")
    else:
        user.role = acc["role"]
        user.full_name = acc["full_name"]
        user.company_name = acc["company_name"]
        user.hashed_password = hash_password(acc["password"])
        db.commit()
# Ensure akhilesh1343@gmail.com is Admin (password preserved)
akhil_acc = db.query(User).filter(User.email == "akhilesh1343@gmail.com").first()
if akhil_acc and akhil_acc.role != "admin":
    akhil_acc.role = "admin"
    db.commit()
    print("Preserved akhilesh1343@gmail.com -> admin")

print("\n--- Current Users in Database ---")
for u in db.query(User).all():
    print(f"ID={u.id} | Email={u.email} | Role={u.role} | Name={u.full_name}")

db.close()
