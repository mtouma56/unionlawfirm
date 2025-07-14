from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Form, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import os
import motor.motor_asyncio
import bcrypt
import jwt
from datetime import datetime, timedelta
import uuid
from enum import Enum
import aiofiles
import mimetypes

# MongoDB setup
MONGO_URL = os.environ.get('MONGO_URL')
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
db = client.law_firm_db

# Collections
users_collection = db.users
cases_collection = db.cases
appointments_collection = db.appointments
videos_collection = db.videos

# JWT settings
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Initialize FastAPI
app = FastAPI(title="Union Law Firm API", description="API for Union Law Firm Platform")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Models
class UserRole(str, Enum):
    CLIENT = "client"
    ADMIN = "admin"

class User(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: UserRole
    phone: Optional[str] = None
    created_at: datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class CaseStatus(str, Enum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REJECTED = "rejected"

class CaseType(str, Enum):
    DIVORCE = "divorce"
    INHERITANCE = "inheritance"
    CUSTODY = "custody"
    ALIMONY = "alimony"
    OTHER = "other"

class Case(BaseModel):
    id: str
    user_id: str
    case_type: CaseType
    title: str
    description: str
    status: CaseStatus
    files: List[str]
    created_at: datetime
    updated_at: datetime

class CaseCreate(BaseModel):
    case_type: CaseType
    title: str
    description: str

class AppointmentStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Appointment(BaseModel):
    id: str
    user_id: str
    appointment_date: datetime
    status: AppointmentStatus
    payment_status: str
    amount: float
    notes: Optional[str] = None
    created_at: datetime

class AppointmentCreate(BaseModel):
    appointment_date: datetime
    notes: Optional[str] = None

class Video(BaseModel):
    id: str
    title: str
    description: str
    video_url: str
    thumbnail_url: str
    category: str
    duration: int
    views: int
    created_at: datetime

# Utility functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = await users_collection.find_one({"email": email})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return User(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],
            phone=user.get("phone"),
            created_at=user["created_at"]
        )
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# Routes
@app.get("/api/")
async def root():
    return {"message": "Union Law Firm API is running"}

@app.post("/api/auth/register")
async def register(user: UserCreate):
    # Check if user already exists
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user_id = str(uuid.uuid4())
    hashed_password = hash_password(user.password)
    
    user_data = {
        "id": user_id,
        "email": user.email,
        "password": hashed_password,
        "name": user.name,
        "role": UserRole.CLIENT,
        "phone": user.phone,
        "created_at": datetime.utcnow()
    }
    
    await users_collection.insert_one(user_data)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user.email,
            "name": user.name,
            "role": UserRole.CLIENT
        }
    }

@app.post("/api/auth/login")
async def login(user: UserLogin):
    db_user = await users_collection.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user["id"],
            "email": db_user["email"],
            "name": db_user["name"],
            "role": db_user["role"]
        }
    }

@app.get("/api/auth/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

@app.post("/api/cases")
async def create_case(
    case_type: CaseType = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    files: List[UploadFile] = File(default=[]),
    current_user: User = Depends(get_current_user)
):
    # Create uploads directory if it doesn't exist
    upload_dir = "/app/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Save uploaded files
    file_paths = []
    for file in files:
        if file.filename:
            file_extension = os.path.splitext(file.filename)[1]
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = os.path.join(upload_dir, unique_filename)
            
            async with aiofiles.open(file_path, 'wb') as out_file:
                content = await file.read()
                await out_file.write(content)
            
            file_paths.append(unique_filename)
    
    # Create case
    case_id = str(uuid.uuid4())
    case_data = {
        "id": case_id,
        "user_id": current_user.id,
        "case_type": case_type,
        "title": title,
        "description": description,
        "status": CaseStatus.PENDING,
        "files": file_paths,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await cases_collection.insert_one(case_data)
    
    return {
        "message": "Case submitted successfully",
        "case_id": case_id,
        "status": CaseStatus.PENDING
    }

@app.get("/api/cases")
async def get_user_cases(current_user: User = Depends(get_current_user)):
    cases = []
    async for case in cases_collection.find({"user_id": current_user.id}):
        cases.append({
            "id": case["id"],
            "case_type": case["case_type"],
            "title": case["title"],
            "description": case["description"],
            "status": case["status"],
            "files": case["files"],
            "created_at": case["created_at"],
            "updated_at": case["updated_at"]
        })
    
    return cases

@app.get("/api/cases/{case_id}")
async def get_case(case_id: str, current_user: User = Depends(get_current_user)):
    case = await cases_collection.find_one({"id": case_id, "user_id": current_user.id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    return {
        "id": case["id"],
        "case_type": case["case_type"],
        "title": case["title"],
        "description": case["description"],
        "status": case["status"],
        "files": case["files"],
        "created_at": case["created_at"],
        "updated_at": case["updated_at"]
    }

@app.post("/api/appointments")
async def create_appointment(
    appointment: AppointmentCreate,
    current_user: User = Depends(get_current_user)
):
    appointment_id = str(uuid.uuid4())
    appointment_data = {
        "id": appointment_id,
        "user_id": current_user.id,
        "appointment_date": appointment.appointment_date,
        "status": AppointmentStatus.PENDING,
        "payment_status": "pending",
        "amount": 100.0,  # Default consultation fee
        "notes": appointment.notes,
        "created_at": datetime.utcnow()
    }
    
    await appointments_collection.insert_one(appointment_data)
    
    return {
        "message": "Appointment scheduled successfully",
        "appointment_id": appointment_id,
        "status": AppointmentStatus.PENDING
    }

@app.get("/api/appointments")
async def get_user_appointments(current_user: User = Depends(get_current_user)):
    appointments = []
    async for appointment in appointments_collection.find({"user_id": current_user.id}):
        appointments.append({
            "id": appointment["id"],
            "appointment_date": appointment["appointment_date"],
            "status": appointment["status"],
            "payment_status": appointment["payment_status"],
            "amount": appointment["amount"],
            "notes": appointment.get("notes"),
            "created_at": appointment["created_at"]
        })
    
    return appointments

@app.get("/api/videos")
async def get_videos():
    videos = []
    async for video in videos_collection.find():
        videos.append({
            "id": video["id"],
            "title": video["title"],
            "description": video["description"],
            "video_url": video["video_url"],
            "thumbnail_url": video["thumbnail_url"],
            "category": video["category"],
            "duration": video["duration"],
            "views": video["views"],
            "created_at": video["created_at"]
        })
    
    return videos

@app.get("/api/videos/{video_id}")
async def get_video(video_id: str):
    video = await videos_collection.find_one({"id": video_id})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Increment views
    await videos_collection.update_one(
        {"id": video_id},
        {"$inc": {"views": 1}}
    )
    
    return {
        "id": video["id"],
        "title": video["title"],
        "description": video["description"],
        "video_url": video["video_url"],
        "thumbnail_url": video["thumbnail_url"],
        "category": video["category"],
        "duration": video["duration"],
        "views": video["views"] + 1,
        "created_at": video["created_at"]
    }

# Admin routes
@app.get("/api/admin/cases")
async def get_all_cases(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    cases = []
    async for case in cases_collection.find():
        # Get user info
        user = await users_collection.find_one({"id": case["user_id"]})
        cases.append({
            "id": case["id"],
            "user_name": user["name"] if user else "Unknown",
            "user_email": user["email"] if user else "Unknown",
            "case_type": case["case_type"],
            "title": case["title"],
            "description": case["description"],
            "status": case["status"],
            "files": case["files"],
            "created_at": case["created_at"],
            "updated_at": case["updated_at"]
        })
    
    return cases

@app.put("/api/admin/cases/{case_id}/status")
async def update_case_status(
    case_id: str,
    status: CaseStatus,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await cases_collection.update_one(
        {"id": case_id},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Case not found")
    
    return {"message": "Case status updated successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)