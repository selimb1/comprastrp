from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True) # Mismo trato que OAuth, Nullable si usa MS/Google
    full_name = Column(String(100), nullable=False)
    studio_name = Column(String(150), nullable=True)
    
    # Flags and status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Compliance Ley 25.326
    data_treatment_consent = Column(Boolean, default=False)
    consent_date = Column(DateTime, nullable=True)
    
    # Audit
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # OAuth
    google_id = Column(String(255), unique=True, nullable=True)
    microsoft_id = Column(String(255), unique=True, nullable=True)
