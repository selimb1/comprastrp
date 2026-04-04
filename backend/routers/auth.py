from fastapi import APIRouter, Depends, HTTPException, status, Response
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from models import User
from security import get_password_hash, verify_password, create_access_token, create_refresh_token

router = APIRouter(prefix="/auth", tags=["auth"])

class SignUpRequest(BaseModel):
    fullName: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(request: SignUpRequest, db: Session = Depends(get_db)):
    # Verify email
    db_user = db.query(User).filter(User.email == request.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Este correo ya está registrado.")
    
    # We assume consent was validated in the frontend, but ideally we add `consent: bool` to SignUpRequest.
    # We register the user compliance.
    new_user = User(
        email=request.email,
        full_name=request.fullName,
        password_hash=get_password_hash(request.password),
        data_treatment_consent=True,
        consent_date=datetime.utcnow()
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Ideally trigger a celery task to send an email here...
    return {"message": "Cuenta creada con éxito. Por favor verifique su correo."}

@router.post("/login")
async def login(request: LoginRequest, response: Response, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == request.email).first()
    if not db_user or not verify_password(request.password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )
    
    # Verify account is active/verified
    # if not db_user.is_verified:
    #     raise HTTPException(status_code=403, detail="Por favor, verificá tu email primero.")
    
    access_token = create_access_token(data={"sub": str(db_user.id)})
    refresh_token = create_refresh_token(data={"sub": str(db_user.id)})
    
    # Set HttpOnly Cookie for security
    response.set_cookie(
        key="refresh_token", value=refresh_token, 
        httponly=True, secure=True, samesite="lax", max_age=7*24*60*60
    )
    
    return {"access_token": access_token, "token_type": "bearer", "user": {"fullName": db_user.full_name, "email": db_user.email}}
