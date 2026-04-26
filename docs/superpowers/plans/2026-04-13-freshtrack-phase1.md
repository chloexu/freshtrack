# FreshTrack Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working FastAPI backend (deployed on Fly.io) and Expo iOS app that lets a user log in, photograph a receipt, parse it with GPT-4o, and manage a fridge inventory with freshness grouping.

**Architecture:** Python FastAPI + PostgreSQL backend deployed on Fly.io; Expo React Native (TypeScript) iOS client with no local storage — all state served from the API. JWT auth, OpenAI GPT-4o for receipt vision parsing.

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy 2, Alembic, psycopg2, python-jose, passlib, httpx, pytest; Expo SDK 51, React Native, TypeScript, expo-camera, expo-image-manipulator, expo-secure-store, expo-router.

**Spec:** `docs/superpowers/specs/2026-04-13-freshtrack-design.md`

---

## File Map

```
freshtrack/
  backend/
    app/
      __init__.py
      main.py              # FastAPI app, CORS, router registration
      database.py          # SQLAlchemy engine + get_db dependency
      models.py            # User, Settings, Item ORM models
      schemas.py           # Pydantic request/response schemas
      auth.py              # JWT encode/decode, password hash, get_current_user
      routers/
        __init__.py
        auth.py            # POST /auth/register, POST /auth/login
        items.py           # GET/POST/PATCH/DELETE /items
        parse.py           # POST /parse/receipt
        settings.py        # GET/PATCH /settings
      services/
        __init__.py
        openai.py          # GPT-4o receipt parsing
    tests/
      __init__.py
      conftest.py          # test DB, TestClient, fixtures
      test_auth.py
      test_items.py
      test_parse.py
    alembic/
      env.py
      versions/
        001_initial.py
    alembic.ini
    requirements.txt
    .env.example
    Dockerfile
    fly.toml
  mobile/
    app/
      _layout.tsx          # root layout, auth gate
      onboarding.tsx       # login/register + meal time setup
      (tabs)/
        _layout.tsx        # tab bar (Fridge, Add)
        index.tsx          # Fridge home screen
        camera.tsx         # Camera/Add screen
    components/
      FridgeItem.tsx       # single item row with inline actions
      ConfirmItemList.tsx  # post-parse confirmation list
    services/
      api.ts               # typed fetch wrapper (base URL, auth header injection)
      auth.ts              # token get/set/clear via expo-secure-store
    constants/
      freshness.ts         # freshness bucket logic (days → label/color)
    app.json
    tsconfig.json
    package.json
```

---

## Task 1: Bootstrap backend project

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/.env.example`
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`

- [ ] **Step 1: Create backend directory and requirements**

```bash
mkdir -p /Users/chloexu/Chloe/code/freshtrack/backend/app/routers
mkdir -p /Users/chloexu/Chloe/code/freshtrack/backend/app/services
mkdir -p /Users/chloexu/Chloe/code/freshtrack/backend/tests
touch /Users/chloexu/Chloe/code/freshtrack/backend/app/__init__.py
touch /Users/chloexu/Chloe/code/freshtrack/backend/app/routers/__init__.py
touch /Users/chloexu/Chloe/code/freshtrack/backend/app/services/__init__.py
touch /Users/chloexu/Chloe/code/freshtrack/backend/tests/__init__.py
```

- [ ] **Step 2: Write `backend/requirements.txt`**

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
sqlalchemy==2.0.30
psycopg2-binary==2.9.9
alembic==1.13.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
httpx==0.27.0
python-dotenv==1.0.1
pytest==8.2.0
pytest-mock==3.14.0
```

- [ ] **Step 3: Write `backend/.env.example`**

```
DATABASE_URL=postgresql://user:password@localhost:5432/freshtrack
SECRET_KEY=change-me-to-a-random-32-char-string
OPENAI_API_KEY=sk-...
```

- [ ] **Step 4: Write `backend/app/main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, items, parse, settings

app = FastAPI(title="FreshTrack API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(items.router, prefix="/items", tags=["items"])
app.include_router(parse.router, prefix="/parse", tags=["parse"])
app.include_router(settings.router, prefix="/settings", tags=["settings"])


@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 5: Install dependencies and verify app starts**

```bash
cd /Users/chloexu/Chloe/code/freshtrack/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

- [ ] **Step 6: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git init
git add backend/
git commit -m "feat: bootstrap backend project"
```

---

## Task 2: Database setup

**Files:**
- Create: `backend/app/database.py`
- Create: `backend/app/models.py`
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`
- Create: `backend/alembic/versions/001_initial.py`

- [ ] **Step 1: Write `backend/app/database.py`**

```python
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 2: Write `backend/app/models.py`**

```python
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, Date, DateTime, Time, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    items = relationship("Item", back_populates="user", cascade="all, delete-orphan")
    settings = relationship("Settings", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Settings(Base):
    __tablename__ = "settings"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    lunch_time = Column(String, nullable=False, default="12:00")
    dinner_time = Column(String, nullable=False, default="18:30")

    user = relationship("User", back_populates="settings")


class Item(Base):
    __tablename__ = "items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    quantity = Column(String)
    purchase_date = Column(Date, nullable=False)
    predicted_expiry = Column(Date, nullable=False)
    status = Column(String, nullable=False, default="in_fridge")
    status_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    user = relationship("User", back_populates="items")
```

- [ ] **Step 3: Initialize Alembic**

```bash
cd /Users/chloexu/Chloe/code/freshtrack/backend
source venv/bin/activate
alembic init alembic
```

- [ ] **Step 4: Update `backend/alembic/env.py`** — replace the `target_metadata` line and add model import

Find these lines in the generated `env.py`:
```python
# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata = None
```

Replace with:
```python
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from app.database import Base
from app import models  # noqa: F401 — ensures models are registered

target_metadata = Base.metadata
```

Also replace the `get_url` / `run_migrations_online` section's `connectable` with:
```python
from dotenv import load_dotenv
load_dotenv()
connectable = engine_from_config(
    {"sqlalchemy.url": os.environ["DATABASE_URL"]},
    prefix="sqlalchemy.",
    poolclass=pool.NullPool,
)
```

- [ ] **Step 5: Generate initial migration**

Ensure a local Postgres DB is running (e.g. `brew services start postgresql`), create the DB, then:

```bash
cd /Users/chloexu/Chloe/code/freshtrack/backend
source venv/bin/activate
createdb freshtrack 2>/dev/null || true
DATABASE_URL=postgresql://localhost/freshtrack alembic revision --autogenerate -m "initial"
DATABASE_URL=postgresql://localhost/freshtrack alembic upgrade head
```

Expected output ends with: `Running upgrade  -> <hash>, initial`

- [ ] **Step 6: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add backend/
git commit -m "feat: database models and initial migration"
```

---

## Task 3: Auth — schemas, helpers, endpoints

**Files:**
- Create: `backend/app/schemas.py`
- Create: `backend/app/auth.py`
- Create: `backend/app/routers/auth.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_auth.py`

- [ ] **Step 1: Write `backend/app/schemas.py`** (auth + shared types only for now)

```python
from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import Optional
from uuid import UUID


# Auth
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    token: str


# Items
class ItemCreate(BaseModel):
    name: str
    quantity: Optional[str] = None
    purchase_date: date
    predicted_expiry: date


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[str] = None
    predicted_expiry: Optional[date] = None
    status: Optional[str] = None


class ItemResponse(BaseModel):
    id: UUID
    name: str
    quantity: Optional[str]
    purchase_date: date
    predicted_expiry: date
    status: str
    status_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


# Settings
class SettingsUpdate(BaseModel):
    lunch_time: Optional[str] = None   # "HH:MM"
    dinner_time: Optional[str] = None  # "HH:MM"


class SettingsResponse(BaseModel):
    lunch_time: str
    dinner_time: str

    model_config = {"from_attributes": True}


# Parse
class ParseReceiptRequest(BaseModel):
    image_base64: str


class ParsedItem(BaseModel):
    name: str
    quantity: Optional[str]
    predicted_expiry_days: int
    confidence: str  # high | medium | low


class ParseReceiptResponse(BaseModel):
    items: list[ParsedItem]
    parse_notes: Optional[str] = None
```

- [ ] **Step 2: Write `backend/app/auth.py`**

```python
import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .database import get_db
from . import models

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": user_id, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user
```

- [ ] **Step 3: Write `backend/app/routers/auth.py`**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth import hash_password, verify_password, create_token

router = APIRouter()


@router.post("/register", response_model=schemas.TokenResponse, status_code=201)
def register(body: schemas.RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(email=body.email, password_hash=hash_password(body.password))
    db.add(user)
    db.flush()

    settings = models.Settings(user_id=user.id)
    db.add(settings)
    db.commit()
    db.refresh(user)

    return {"token": create_token(str(user.id))}


@router.post("/login", response_model=schemas.TokenResponse)
def login(body: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"token": create_token(str(user.id))}
```

- [ ] **Step 4: Write `backend/tests/conftest.py`**

```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db

TEST_DATABASE_URL = "postgresql://localhost/freshtrack_test"

engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def auth_client(client):
    """Returns a TestClient with a registered+logged-in user and auth headers."""
    client.post("/auth/register", json={"email": "test@example.com", "password": "password123"})
    res = client.post("/auth/login", json={"email": "test@example.com", "password": "password123"})
    token = res.json()["token"]
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client
```

- [ ] **Step 5: Write `backend/tests/test_auth.py`**

```python
def test_register_returns_token(client):
    res = client.post("/auth/register", json={"email": "a@b.com", "password": "secret"})
    assert res.status_code == 201
    assert "token" in res.json()


def test_register_duplicate_email_returns_400(client):
    client.post("/auth/register", json={"email": "a@b.com", "password": "secret"})
    res = client.post("/auth/register", json={"email": "a@b.com", "password": "other"})
    assert res.status_code == 400


def test_login_valid_credentials_returns_token(client):
    client.post("/auth/register", json={"email": "a@b.com", "password": "secret"})
    res = client.post("/auth/login", json={"email": "a@b.com", "password": "secret"})
    assert res.status_code == 200
    assert "token" in res.json()


def test_login_wrong_password_returns_401(client):
    client.post("/auth/register", json={"email": "a@b.com", "password": "secret"})
    res = client.post("/auth/login", json={"email": "a@b.com", "password": "wrong"})
    assert res.status_code == 401
```

- [ ] **Step 6: Create test DB and run tests**

```bash
cd /Users/chloexu/Chloe/code/freshtrack/backend
source venv/bin/activate
createdb freshtrack_test 2>/dev/null || true
DATABASE_URL=postgresql://localhost/freshtrack_test pytest tests/test_auth.py -v
```

Expected: 4 passed

- [ ] **Step 7: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add backend/
git commit -m "feat: auth register and login endpoints"
```

---

## Task 4: Items CRUD endpoints

**Files:**
- Create: `backend/app/routers/items.py`
- Create: `backend/tests/test_items.py`

- [ ] **Step 1: Write failing tests in `backend/tests/test_items.py`**

```python
from datetime import date, timedelta

TODAY = date.today().isoformat()
TOMORROW = (date.today() + timedelta(days=1)).isoformat()
IN_5_DAYS = (date.today() + timedelta(days=5)).isoformat()


def _item(name="Strawberries", expiry=IN_5_DAYS):
    return {"name": name, "purchase_date": TODAY, "predicted_expiry": expiry, "quantity": "1 pint"}


def test_list_items_empty(auth_client):
    res = auth_client.get("/items")
    assert res.status_code == 200
    assert res.json() == []


def test_create_item(auth_client):
    res = auth_client.post("/items", json=[_item()])
    assert res.status_code == 201
    data = res.json()
    assert len(data) == 1
    assert data[0]["name"] == "Strawberries"
    assert data[0]["status"] == "in_fridge"


def test_list_items_returns_in_fridge_only(auth_client):
    res = auth_client.post("/items", json=[_item("Apple"), _item("Banana")])
    items = res.json()
    # mark Apple as consumed
    auth_client.patch(f"/items/{items[0]['id']}", json={"status": "consumed"})
    res = auth_client.get("/items")
    assert len(res.json()) == 1
    assert res.json()[0]["name"] == "Banana"


def test_patch_item_status(auth_client):
    item_id = auth_client.post("/items", json=[_item()]).json()[0]["id"]
    res = auth_client.patch(f"/items/{item_id}", json={"status": "consumed"})
    assert res.status_code == 200
    assert res.json()["status"] == "consumed"
    assert res.json()["status_at"] is not None


def test_delete_item(auth_client):
    item_id = auth_client.post("/items", json=[_item()]).json()[0]["id"]
    res = auth_client.delete(f"/items/{item_id}")
    assert res.status_code == 204
    assert auth_client.get("/items").json() == []


def test_items_require_auth(client):
    assert client.get("/items").status_code == 403
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/chloexu/Chloe/code/freshtrack/backend
source venv/bin/activate
DATABASE_URL=postgresql://localhost/freshtrack_test pytest tests/test_items.py -v
```

Expected: errors (router not implemented)

- [ ] **Step 3: Write `backend/app/routers/items.py`**

```python
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter()


@router.get("", response_model=list[schemas.ItemResponse])
def list_items(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.Item)
        .filter(models.Item.user_id == current_user.id, models.Item.status == "in_fridge")
        .order_by(models.Item.predicted_expiry)
        .all()
    )


@router.post("", response_model=list[schemas.ItemResponse], status_code=201)
def create_items(
    body: list[schemas.ItemCreate],
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = [models.Item(**item.model_dump(), user_id=current_user.id) for item in body]
    db.add_all(items)
    db.commit()
    for item in items:
        db.refresh(item)
    return items


@router.patch("/{item_id}", response_model=schemas.ItemResponse)
def update_item(
    item_id: UUID,
    body: schemas.ItemUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(models.Item).filter(
        models.Item.id == item_id, models.Item.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    updates = body.model_dump(exclude_unset=True)
    if "status" in updates and updates["status"] != "in_fridge":
        updates["status_at"] = datetime.utcnow()

    for key, value in updates.items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def delete_item(
    item_id: UUID,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(models.Item).filter(
        models.Item.id == item_id, models.Item.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
DATABASE_URL=postgresql://localhost/freshtrack_test pytest tests/test_items.py -v
```

Expected: 6 passed

- [ ] **Step 5: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add backend/
git commit -m "feat: items CRUD endpoints"
```

---

## Task 5: Settings endpoint

**Files:**
- Create: `backend/app/routers/settings.py`

- [ ] **Step 1: Write `backend/app/routers/settings.py`**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter()


@router.get("", response_model=schemas.SettingsResponse)
def get_settings(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return current_user.settings


@router.patch("", response_model=schemas.SettingsResponse)
def update_settings(
    body: schemas.SettingsUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    settings = current_user.settings
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(settings, key, value)
    db.commit()
    db.refresh(settings)
    return settings
```

- [ ] **Step 2: Register the router in `backend/app/main.py`** — it's already imported in the bootstrap step. Verify by running:

```bash
cd /Users/chloexu/Chloe/code/freshtrack/backend
source venv/bin/activate
DATABASE_URL=postgresql://localhost/freshtrack uvicorn app.main:app --reload
```

Open `http://localhost:8000/docs` — confirm `/settings` routes appear.

- [ ] **Step 3: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add backend/
git commit -m "feat: settings endpoint"
```

---

## Task 6: OpenAI receipt parsing service + endpoint

**Files:**
- Create: `backend/app/services/openai.py`
- Create: `backend/app/routers/parse.py`
- Create: `backend/tests/test_parse.py`

- [ ] **Step 1: Write `backend/app/services/openai.py`**

```python
import os
import json
import httpx
from ..schemas import ParsedItem

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_URL = "https://api.openai.com/v1/chat/completions"

RECEIPT_SYSTEM_PROMPT = """You are a grocery receipt parser. Extract all food/grocery items from the receipt image.
For each item, estimate how many days from today until it expires based on typical shelf life.
Return JSON only, no markdown, matching this schema exactly:
{
  "items": [
    {
      "name": "string",
      "quantity": "string or null",
      "predicted_expiry_days": integer,
      "confidence": "high" | "medium" | "low"
    }
  ],
  "parse_notes": "string or null"
}
Use confidence "low" for items you are unsure about (blurry, obscured, ambiguous).
Use confidence "high" only when name and expiry are clear."""


async def parse_receipt(image_base64: str) -> dict:
    """Call GPT-4o vision to parse a receipt image. Returns raw parsed dict."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            OPENAI_URL,
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o",
                "max_tokens": 1500,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": RECEIPT_SYSTEM_PROMPT},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}",
                                    "detail": "high",
                                },
                            },
                        ],
                    }
                ],
            },
        )
        response.raise_for_status()

    content = response.json()["choices"][0]["message"]["content"]
    return json.loads(content)
```

- [ ] **Step 2: Write `backend/app/routers/parse.py`**

```python
from fastapi import APIRouter, Depends, HTTPException
from .. import schemas
from ..auth import get_current_user, models
from ..services.openai import parse_receipt
import json

router = APIRouter()


@router.post("/receipt", response_model=schemas.ParseReceiptResponse)
async def receipt(
    body: schemas.ParseReceiptRequest,
    current_user: models.User = Depends(get_current_user),
):
    try:
        result = await parse_receipt(body.image_base64)
    except Exception as e:
        error_str = str(e)
        if "429" in error_str:
            raise HTTPException(status_code=429, detail="OpenAI rate limit hit — try again in a moment")
        raise HTTPException(status_code=502, detail="Receipt parsing failed — add items manually")

    try:
        return schemas.ParseReceiptResponse(**result)
    except Exception:
        raise HTTPException(status_code=422, detail="Receipt parsing returned unexpected format")
```

- [ ] **Step 3: Write `backend/tests/test_parse.py`**

```python
from unittest.mock import patch, AsyncMock


MOCK_PARSE_RESULT = {
    "items": [
        {"name": "Strawberries", "quantity": "1 pint", "predicted_expiry_days": 5, "confidence": "high"},
        {"name": "Chicken breast", "quantity": "1 lb", "predicted_expiry_days": 2, "confidence": "high"},
    ],
    "parse_notes": None,
}


def test_parse_receipt_returns_items(auth_client):
    with patch("app.routers.parse.parse_receipt", new=AsyncMock(return_value=MOCK_PARSE_RESULT)):
        res = auth_client.post("/parse/receipt", json={"image_base64": "base64encodedimage"})
    assert res.status_code == 200
    assert len(res.json()["items"]) == 2
    assert res.json()["items"][0]["name"] == "Strawberries"


def test_parse_receipt_openai_failure_returns_502(auth_client):
    with patch("app.routers.parse.parse_receipt", new=AsyncMock(side_effect=Exception("connection error"))):
        res = auth_client.post("/parse/receipt", json={"image_base64": "anything"})
    assert res.status_code == 502


def test_parse_receipt_rate_limit_returns_429(auth_client):
    with patch("app.routers.parse.parse_receipt", new=AsyncMock(side_effect=Exception("429 Too Many Requests"))):
        res = auth_client.post("/parse/receipt", json={"image_base64": "anything"})
    assert res.status_code == 429


def test_parse_receipt_requires_auth(client):
    res = client.post("/parse/receipt", json={"image_base64": "anything"})
    assert res.status_code == 403
```

- [ ] **Step 4: Run all tests**

```bash
cd /Users/chloexu/Chloe/code/freshtrack/backend
source venv/bin/activate
DATABASE_URL=postgresql://localhost/freshtrack_test pytest tests/ -v
```

Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add backend/
git commit -m "feat: OpenAI receipt parsing endpoint"
```

---

## Task 7: Dockerize and deploy to Fly.io

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/fly.toml`

- [ ] **Step 1: Write `backend/Dockerfile`**

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

- [ ] **Step 2: Install Fly CLI and authenticate**

```bash
brew install flyctl
flyctl auth login
```

- [ ] **Step 3: Launch the Fly app (run from `backend/` directory)**

```bash
cd /Users/chloexu/Chloe/code/freshtrack/backend
flyctl launch --name freshtrack-api --region sjc --no-deploy
```

When prompted: select `yes` for Postgres, choose the free/development plan. Note the Postgres connection string from the output — you'll need it for `DATABASE_URL`.

- [ ] **Step 4: Set secrets on Fly**

```bash
flyctl secrets set \
  SECRET_KEY=$(openssl rand -hex 32) \
  OPENAI_API_KEY=sk-your-key-here \
  --app freshtrack-api
```

The `DATABASE_URL` is auto-set by Fly when you attach the Postgres instance. Verify:
```bash
flyctl secrets list --app freshtrack-api
```
Expected: `DATABASE_URL`, `SECRET_KEY`, `OPENAI_API_KEY` all listed.

- [ ] **Step 5: Run Alembic migration on production DB**

```bash
flyctl ssh console --app freshtrack-api
# inside the console:
alembic upgrade head
exit
```

- [ ] **Step 6: Deploy**

```bash
cd /Users/chloexu/Chloe/code/freshtrack/backend
flyctl deploy --app freshtrack-api
```

Expected output ends with: `v1 deployed successfully`

- [ ] **Step 7: Verify health endpoint**

```bash
curl https://freshtrack-api.fly.dev/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 8: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add backend/Dockerfile backend/fly.toml
git commit -m "feat: Dockerfile and Fly.io deployment config"
```

---

## Task 8: Bootstrap Expo mobile app

**Files:**
- Create: `mobile/` (Expo scaffold)
- Create: `mobile/services/api.ts`
- Create: `mobile/services/auth.ts`
- Create: `mobile/constants/freshness.ts`

- [ ] **Step 1: Scaffold Expo app**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
npx create-expo-app mobile --template blank-typescript
cd mobile
```

- [ ] **Step 2: Install dependencies**

```bash
cd /Users/chloexu/Chloe/code/freshtrack/mobile
npx expo install expo-router expo-camera expo-image-manipulator expo-secure-store expo-notifications
npx expo install react-native-safe-area-context react-native-screens
```

- [ ] **Step 3: Update `mobile/app.json`** — add scheme for expo-router

Find:
```json
{
  "expo": {
    "name": "mobile",
```

Replace with:
```json
{
  "expo": {
    "name": "FreshTrack",
    "scheme": "freshtrack",
```

- [ ] **Step 4: Write `mobile/services/auth.ts`**

```typescript
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'freshtrack_token';
const API_URL_KEY = 'freshtrack_api_url';

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getApiUrl(): Promise<string> {
  const url = await SecureStore.getItemAsync(API_URL_KEY);
  return url ?? 'https://freshtrack-api.fly.dev';
}

export async function setApiUrl(url: string): Promise<void> {
  await SecureStore.setItemAsync(API_URL_KEY, url);
}
```

- [ ] **Step 5: Write `mobile/services/api.ts`**

```typescript
import { getToken, getApiUrl } from './auth';

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const [token, baseUrl] = await Promise.all([getToken(), getApiUrl()]);

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail?.detail ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  get: <T>(path: string) => request<T>('GET', path),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
```

- [ ] **Step 6: Write `mobile/constants/freshness.ts`**

```typescript
export type FreshnessBucket = 'use_today' | 'use_soon' | 'still_fresh';

export function getFreshnessBucket(predictedExpiry: string): FreshnessBucket {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(predictedExpiry);
  expiry.setHours(0, 0, 0, 0);
  const daysUntilExpiry = Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry <= 1) return 'use_today';
  if (daysUntilExpiry <= 5) return 'use_soon';
  return 'still_fresh';
}

export function getFreshnessLabel(predictedExpiry: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(predictedExpiry);
  expiry.setHours(0, 0, 0, 0);
  const days = Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (days <= 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `${days} days`;
}

export const BUCKET_CONFIG: Record<FreshnessBucket, { label: string; color: string }> = {
  use_today: { label: 'Use today', color: '#EF4444' },
  use_soon: { label: 'Use soon', color: '#F59E0B' },
  still_fresh: { label: 'Still fresh', color: '#22C55E' },
};
```

- [ ] **Step 7: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add mobile/
git commit -m "feat: bootstrap Expo mobile app with services layer"
```

---

## Task 9: Onboarding screen (auth + meal times)

**Files:**
- Create: `mobile/app/_layout.tsx`
- Create: `mobile/app/onboarding.tsx`
- Create: `mobile/app/(tabs)/_layout.tsx`

- [ ] **Step 1: Write `mobile/app/_layout.tsx`**

```typescript
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { getToken } from '../services/auth';

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    getToken().then((token) => setIsAuthenticated(!!token));
  }, []);

  useEffect(() => {
    if (isAuthenticated === null) return;
    const inTabs = segments[0] === '(tabs)';
    if (!isAuthenticated && inTabs) {
      router.replace('/onboarding');
    } else if (isAuthenticated && !inTabs) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 2: Write `mobile/app/onboarding.tsx`**

```typescript
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../services/api';
import { setToken, setApiUrl } from '../services/auth';

type Step = 'auth' | 'meal_times';

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('auth');
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lunchTime, setLunchTime] = useState('12:00');
  const [dinnerTime, setDinnerTime] = useState('18:30');
  const [loading, setLoading] = useState(false);

  async function handleAuth() {
    if (!email || !password) {
      Alert.alert('Error', 'Email and password required');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<{ token: string }>(
        `/auth/${mode}`,
        { email, password },
      );
      await setToken(res.token);
      setStep('meal_times');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleMealTimes() {
    setLoading(true);
    try {
      await api.patch('/settings', { lunch_time: lunchTime, dinner_time: dinnerTime });
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  if (step === 'meal_times') {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={styles.title}>When do you eat?</Text>
        <Text style={styles.subtitle}>We'll use these times to schedule reminders.</Text>
        <Text style={styles.label}>Lunch time</Text>
        <TextInput style={styles.input} value={lunchTime} onChangeText={setLunchTime} placeholder="12:00" />
        <Text style={styles.label}>Dinner time</Text>
        <TextInput style={styles.input} value={dinnerTime} onChangeText={setDinnerTime} placeholder="18:30" />
        <TouchableOpacity style={styles.button} onPress={handleMealTimes} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Get started'}</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>FreshTrack</Text>
      <Text style={styles.subtitle}>Zero-waste grocery tracking.</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? '...' : mode === 'register' ? 'Create account' : 'Sign in'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setMode(mode === 'register' ? 'login' : 'register')}>
        <Text style={styles.toggle}>{mode === 'register' ? 'Already have an account? Sign in' : 'New here? Create account'}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 32, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 32 },
  label: { fontSize: 14, color: '#333', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  button: { backgroundColor: '#22C55E', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  toggle: { textAlign: 'center', color: '#666', marginTop: 16 },
});
```

- [ ] **Step 3: Write `mobile/app/(tabs)/_layout.tsx`**

```typescript
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#22C55E' }}>
      <Tabs.Screen name="index" options={{ title: 'Fridge', tabBarLabel: 'Fridge' }} />
      <Tabs.Screen name="camera" options={{ title: 'Add', tabBarLabel: 'Add' }} />
    </Tabs>
  );
}
```

- [ ] **Step 4: Run app in Expo Go to verify onboarding flow**

```bash
cd /Users/chloexu/Chloe/code/freshtrack/mobile
npx expo start
```

Scan QR code with Expo Go on iPhone. Expected: onboarding screen appears, can register, meal times step shows, tapping "Get started" navigates to tabs.

- [ ] **Step 5: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add mobile/
git commit -m "feat: onboarding screen with auth and meal time setup"
```

---

## Task 10: Fridge home screen

**Files:**
- Create: `mobile/components/FridgeItem.tsx`
- Create: `mobile/app/(tabs)/index.tsx`

- [ ] **Step 1: Write `mobile/components/FridgeItem.tsx`**

```typescript
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { getFreshnessLabel } from '../constants/freshness';

export type Item = {
  id: string;
  name: string;
  quantity: string | null;
  predicted_expiry: string;
  status: string;
};

type Props = {
  item: Item;
  onConsume: (id: string) => void;
  onDiscard: (id: string) => void;
  onEdit: (item: Item) => void;
};

export function FridgeItem({ item, onConsume, onDiscard, onEdit }: Props) {
  const [expanded, setExpanded] = useState(false);
  const label = getFreshnessLabel(item.predicted_expiry);

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity style={styles.row} onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          {item.quantity && <Text style={styles.quantity}>{item.quantity}</Text>}
        </View>
        <Text style={styles.expiry}>{label}</Text>
        <TouchableOpacity style={styles.checkBtn} onPress={() => onConsume(item.id)}>
          <Text style={styles.checkText}>✓</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => onConsume(item.id)}>
            <Text style={styles.actionText}>Used it</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={() => onEdit(item)}>
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={() => onDiscard(item.id)}>
            <Text style={styles.actionText}>Remove</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '500', color: '#111' },
  quantity: { fontSize: 13, color: '#888', marginTop: 2 },
  expiry: { fontSize: 13, color: '#555', marginRight: 12 },
  checkBtn: { backgroundColor: '#22C55E', borderRadius: 8, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  checkText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  actionBtn: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#f9f9f9' },
  actionBtnSecondary: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#f0f0f0' },
  actionBtnDanger: { backgroundColor: '#fff5f5' },
  actionText: { fontSize: 14, color: '#333', fontWeight: '500' },
});
```

- [ ] **Step 2: Write `mobile/app/(tabs)/index.tsx`**

```typescript
import { useEffect, useState, useCallback } from 'react';
import { View, Text, SectionList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api } from '../../services/api';
import { FridgeItem, Item } from '../../components/FridgeItem';
import { getFreshnessBucket, BUCKET_CONFIG, FreshnessBucket } from '../../constants/freshness';

const BUCKET_ORDER: FreshnessBucket[] = ['use_today', 'use_soon', 'still_fresh'];

export default function FridgeScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function loadItems() {
    try {
      const data = await api.get<Item[]>('/items');
      setItems(data);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  useFocusEffect(useCallback(() => { loadItems(); }, []));

  async function handleStatusChange(id: string, status: 'consumed' | 'discarded') {
    try {
      await api.patch(`/items/${id}`, { status });
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  const sections = BUCKET_ORDER.map((bucket) => ({
    bucket,
    title: BUCKET_CONFIG[bucket].label,
    color: BUCKET_CONFIG[bucket].color,
    data: items.filter((i) => getFreshnessBucket(i.predicted_expiry) === bucket),
  })).filter((s) => s.data.length > 0);

  if (items.length === 0 && !refreshing) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Your fridge is empty.</Text>
        <Text style={styles.emptyHint}>Tap Add to photograph a receipt.</Text>
      </View>
    );
  }

  return (
    <SectionList
      style={styles.list}
      contentContainerStyle={styles.content}
      sections={sections}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section }) => (
        <View style={[styles.sectionHeader, { borderLeftColor: section.color }]}>
          <Text style={[styles.sectionTitle, { color: section.color }]}>{section.title}</Text>
        </View>
      )}
      renderItem={({ item }) => (
        <FridgeItem
          item={item}
          onConsume={(id) => handleStatusChange(id, 'consumed')}
          onDiscard={(id) => handleStatusChange(id, 'discarded')}
          onEdit={() => Alert.alert('Edit', 'Edit modal coming soon')}
        />
      )}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadItems(); setRefreshing(false); }} />}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#f8f8f8' },
  content: { paddingVertical: 16 },
  sectionHeader: { marginHorizontal: 16, marginBottom: 8, marginTop: 16, borderLeftWidth: 3, paddingLeft: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f8f8' },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#333' },
  emptyHint: { fontSize: 14, color: '#888', marginTop: 8 },
});
```

- [ ] **Step 3: Test in Expo Go**

Add a test item directly via the API:
```bash
TOKEN=$(curl -s -X POST https://freshtrack-api.fly.dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}' | jq -r .token)

curl -X POST https://freshtrack-api.fly.dev/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '[{"name":"Strawberries","quantity":"1 pint","purchase_date":"2026-04-13","predicted_expiry":"2026-04-15"}]'
```

Reload the app — confirm strawberries appear in "Use soon" group. Tap ✓ — confirm they disappear.

- [ ] **Step 4: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add mobile/
git commit -m "feat: fridge home screen with freshness grouping"
```

---

## Task 11: Camera / Add screen

**Files:**
- Create: `mobile/components/ConfirmItemList.tsx`
- Create: `mobile/app/(tabs)/camera.tsx`

- [ ] **Step 1: Write `mobile/components/ConfirmItemList.tsx`**

```typescript
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';

export type ParsedItem = {
  name: string;
  quantity: string | null;
  predicted_expiry_days: number;
  confidence: 'high' | 'medium' | 'low';
};

type Props = {
  items: ParsedItem[];
  parseNotes: string | null;
  onConfirm: (items: ParsedItem[]) => void;
  onCancel: () => void;
};

export function ConfirmItemList({ items: initialItems, parseNotes, onConfirm, onCancel }: Props) {
  const [items, setItems] = useState(initialItems);

  function updateItem(index: number, field: keyof ParsedItem, value: string) {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirm items</Text>
      {parseNotes && <Text style={styles.notes}>{parseNotes}</Text>}
      <FlatList
        data={items}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item, index }) => (
          <View style={[styles.row, item.confidence === 'low' && styles.rowAmber]}>
            {item.confidence === 'low' && <Text style={styles.badge}>Low confidence — tap to confirm</Text>}
            <TextInput
              style={styles.nameInput}
              value={item.name}
              onChangeText={(v) => updateItem(index, 'name', v)}
            />
            <View style={styles.row2}>
              <TextInput
                style={[styles.input, styles.flex1]}
                value={item.quantity ?? ''}
                placeholder="Quantity"
                onChangeText={(v) => updateItem(index, 'quantity', v)}
              />
              <TextInput
                style={[styles.input, styles.daysInput]}
                value={String(item.predicted_expiry_days)}
                keyboardType="numeric"
                onChangeText={(v) => updateItem(index, 'predicted_expiry_days', v)}
              />
              <Text style={styles.daysLabel}>days</Text>
              <TouchableOpacity onPress={() => removeItem(index)}>
                <Text style={styles.remove}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.confirmBtn} onPress={() => onConfirm(items)}>
          <Text style={styles.confirmText}>Save to fridge ({items.length})</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  notes: { fontSize: 13, color: '#F59E0B', marginBottom: 12 },
  row: { backgroundColor: '#f9f9f9', borderRadius: 10, padding: 12, marginBottom: 10 },
  rowAmber: { borderWidth: 1, borderColor: '#F59E0B', backgroundColor: '#FFFBEB' },
  badge: { fontSize: 11, color: '#92400E', marginBottom: 6 },
  nameInput: { fontSize: 16, fontWeight: '500', borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 4, marginBottom: 8 },
  row2: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 8, fontSize: 14 },
  flex1: { flex: 1 },
  daysInput: { width: 48, textAlign: 'center' },
  daysLabel: { fontSize: 13, color: '#666' },
  remove: { fontSize: 18, color: '#ccc', paddingHorizontal: 4 },
  footer: { flexDirection: 'row', gap: 12, marginTop: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  cancelText: { fontSize: 15, color: '#666' },
  confirmBtn: { flex: 2, padding: 14, borderRadius: 8, backgroundColor: '#22C55E', alignItems: 'center' },
  confirmText: { fontSize: 15, color: '#fff', fontWeight: '600' },
});
```

- [ ] **Step 2: Write `mobile/app/(tabs)/camera.tsx`**

```typescript
import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { api } from '../../services/api';
import { ConfirmItemList, ParsedItem } from '../../components/ConfirmItemList';

type ParseReceiptResponse = {
  items: ParsedItem[];
  parse_notes: string | null;
};

type ItemToCreate = {
  name: string;
  quantity: string | null;
  purchase_date: string;
  predicted_expiry: string;
};

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [parsedData, setParsedData] = useState<ParseReceiptResponse | null>(null);
  const [parsing, setParsing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>Camera access needed to scan receipts.</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function takePicture() {
    if (!cameraRef.current) return;
    setParsing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo) throw new Error('No photo captured');

      // Resize to max 1024px long edge
      const resized = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );

      const base64 = await FileSystem.readAsStringAsync(resized.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const result = await api.post<ParseReceiptResponse>('/parse/receipt', { image_base64: base64 });
      setParsedData(result);
    } catch (e: any) {
      Alert.alert('Parse failed', e.message + '\n\nAdd items manually instead.');
    } finally {
      setParsing(false);
    }
  }

  async function handleConfirm(items: ParsedItem[]) {
    const today = new Date().toISOString().split('T')[0];
    const itemsToCreate: ItemToCreate[] = items.map((item) => {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + Number(item.predicted_expiry_days));
      return {
        name: item.name,
        quantity: item.quantity,
        purchase_date: today,
        predicted_expiry: expiry.toISOString().split('T')[0],
      };
    });
    try {
      await api.post('/items', itemsToCreate);
      setParsedData(null);
      Alert.alert('Saved', `${itemsToCreate.length} item(s) added to your fridge.`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  if (parsedData) {
    return (
      <ConfirmItemList
        items={parsedData.items}
        parseNotes={parsedData.parse_notes}
        onConfirm={handleConfirm}
        onCancel={() => setParsedData(null)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera}>
        <View style={styles.overlay}>
          <Text style={styles.hint}>Point at your receipt and tap capture</Text>
          {parsing ? (
            <ActivityIndicator size="large" color="#fff" style={styles.spinner} />
          ) : (
            <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
              <View style={styles.captureInner} />
            </TouchableOpacity>
          )}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  permText: { fontSize: 16, textAlign: 'center', marginBottom: 16 },
  btn: { backgroundColor: '#22C55E', padding: 14, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '600' },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40 },
  hint: { color: '#fff', fontSize: 14, marginBottom: 24, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  captureBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  captureInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff' },
  spinner: { marginBottom: 16 },
});
```

- [ ] **Step 3: Test end-to-end in Expo Go**

1. Open app → tap Add tab
2. Point at a grocery receipt and tap capture
3. Confirm: parsed items appear in confirmation list
4. Low-confidence items should have amber border
5. Tap "Save to fridge" → navigate to Fridge tab → items appear grouped by freshness

- [ ] **Step 4: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add mobile/
git commit -m "feat: camera screen with receipt parsing and confirmation list"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered in |
|---|---|
| JWT auth (register/login) | Task 3 |
| Items CRUD (in_fridge/consumed/discarded) | Task 4 |
| Settings (lunch/dinner time) | Task 5 |
| GPT-4o receipt parsing | Task 6 |
| Deploy to Fly.io | Task 7 |
| Expo scaffold + service layer | Task 8 |
| Onboarding (auth + meal times) | Task 9 |
| Fridge home (freshness grouping, ✓ button, inline actions) | Task 10 |
| Camera → parse → confirm list (amber badges) | Task 11 |
| predicted_expiry stored internally, UI shows freshness language | Task 10 + freshness.ts |
| Error handling: 429, 502, manual fallback | Task 6 + camera.tsx |
| Expo SecureStore for token | Task 8 |

**Type consistency check:** `ParsedItem`, `Item`, `ItemToCreate` types used consistently across `ConfirmItemList`, `camera.tsx`, `api.ts`. `FreshnessBucket` used in both `freshness.ts` and `index.tsx`. No drift found.

**Placeholder scan:** No TBDs. Edit modal in fridge screen shows `Alert.alert('Edit', '...')` — acceptable for Phase 1, full edit modal is Phase 2 work.

---

## Phase 2

Phase 2 (Reminders, Notification Scheduler, Reminder Chat screen, Settings screen) is a separate plan.
Run `/gstack-ship` after Phase 1 is working end-to-end, then start Phase 2.
