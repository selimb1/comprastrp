"""
Script de seed para crear el usuario administrador de ComproScan AR.
Uso: python seed_admin.py

Crea o actualiza el usuario barcat823@gmail.com con:
- Plan Enterprise (el más caro)
- is_superuser = True (acceso permanente, sin expiración)
- is_verified = True (sin necesidad de verificar email)
- is_active = True
"""
import os
import sys
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Agregar el directorio actual al path para importar los módulos del proyecto
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine, Base
from models import User, PLAN_ENTERPRISE
from security import get_password_hash

# Datos del usuario administrador
ADMIN_EMAIL = "barcat823@gmail.com"
ADMIN_PASSWORD = "tangofutbolyboxeo"
ADMIN_FULL_NAME = "Selim Barcat"

def seed_admin():
    # Asegurarse de que todas las tablas existan
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        
        if existing:
            # Actualizar si ya existe
            existing.password_hash = get_password_hash(ADMIN_PASSWORD)
            existing.plan = PLAN_ENTERPRISE
            existing.is_superuser = True
            existing.is_verified = True
            existing.is_active = True
            existing.trial_expires_at = None  # Acceso permanente, sin expiración
            existing.data_treatment_consent = True
            existing.consent_date = datetime.utcnow()
            existing.updated_at = datetime.utcnow()
            db.commit()
            print(f"✅ Usuario admin ACTUALIZADO: {ADMIN_EMAIL} (Plan: Enterprise, Superuser: True)")
        else:
            # Crear si no existe
            admin_user = User(
                email=ADMIN_EMAIL,
                password_hash=get_password_hash(ADMIN_PASSWORD),
                full_name=ADMIN_FULL_NAME,
                plan=PLAN_ENTERPRISE,
                is_superuser=True,
                is_verified=True,
                is_active=True,
                trial_expires_at=None,  # Acceso permanente
                data_treatment_consent=True,
                consent_date=datetime.utcnow(),
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print(f"✅ Usuario admin CREADO: {ADMIN_EMAIL} (Plan: Enterprise, Superuser: True)")
        
        print(f"   Email: {ADMIN_EMAIL}")
        print(f"   Plan:  Enterprise ♾️")
        print(f"   Acceso: Permanente (sin expiración)")
        print(f"   Verificado: Sí")
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
