import jwt
from datetime import datetime, timedelta
from fastapi import HTTPException, Security, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os

SECRET_KEY = os.getenv("JWT_SECRET", "super_secret_ventra_key_123")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 1 day

security = HTTPBearer()

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

def verify_super_admin(payload: dict = Security(verify_token)):
    if payload.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    return payload

def verify_company_admin(company_id: int, payload: dict):
    if payload.get('role') == 'super_admin':
        return payload
    if payload.get('role') != 'company_admin' or str(payload.get('company_id')) != str(company_id):
        raise HTTPException(status_code=403, detail='Company admin access required for this company')
    return payload

