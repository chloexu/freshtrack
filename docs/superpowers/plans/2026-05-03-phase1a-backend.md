# FreshTrack Phase 1a — Backend Foundation & Items API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a FastAPI + PostgreSQL backend with auth and items CRUD, then wire it into the Expo mobile app, replacing `mockApi.ts` for all item operations.

**Architecture:** FastAPI (sync SQLAlchemy, Alembic migrations) running locally via Docker Compose for Postgres. Mobile `api.ts` is a typed fetch wrapper that injects the stored JWT and mirrors `mockApi.ts` function signatures so screen logic is unchanged. `parseReceipt` stays mocked until Phase 1b.

**Tech Stack:** Python 3.11+, FastAPI 0.111, SQLAlchemy 2, Alembic, psycopg2-binary, python-jose, passlib[bcrypt], pytest + httpx; Expo React Native, expo-secure-store.

---

## File Map

```
backend/
  app/
    __init__.py             empty package marker
    main.py                 FastAPI app, CORS, router registration
    database.py             SQLAlchemy engine + SessionLocal + get_db
    models.py               User + Item ORM models
    schemas.py              Pydantic request/response schemas
    auth.py                 JWT, bcrypt helpers, get_current_user dependency
    routers/
      __init__.py           empty package marker
      auth.py               POST /auth/register  POST /auth/login
      items.py              GET/POST/PATCH/DELETE /items
  alembic/
    versions/               migration files (auto-generated)
    env.py                  modified to read DATABASE_URL + import models
  alembic.ini               alembic config
  docker-compose.yml        postgres:16 on port 5432
  requirements.txt          all Python deps
  pytest.ini                test config
  .env                      DATABASE_URL + JWT_SECRET (gitignored)
  .env.example              template (committed)
  tests/
    __init__.py             empty
    conftest.py             TestClient + per-test DB transaction rollback
    test_auth.py            register + login endpoint tests
    test_items.py           items CRUD + auth isolation tests

mobile/
  constants/
    config.ts               API_BASE_URL — single place to change
  services/
    api.ts                  typed fetch wrapper + auth storage
    mockApi.ts              unchanged — still used for parseReceipt
  app/
    onboarding.tsx          wire real register/login, add error display
    (tabs)/
      index.tsx             swap mockApi import → api
      camera.tsx            createItems from api, parseReceipt from mockApi
```

---

## Task 1: Backend scaffold

**Files:**
- Create: `backend/docker-compose.yml`
- Create: `backend/requirements.txt`
- Create: `backend/.env.example`
- Create: `backend/.env`
- Create: `backend/pytest.ini`
- Create: `backend/app/__init__.py`
- Create: `backend/app/routers/__init__.py`
- Create: `backend/app/database.py`
- Create: `backend/app/main.py`

- [ ] **Step 1: Create `backend/docker-compose.yml`**

```yaml
version: '3.9'
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: freshtrack
      POSTGRES_USER: freshtrack
      POSTGRES_PASSWORD: freshtrack
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  postgres_data:
```

- [ ] **Step 2: Create `backend/requirements.txt`**

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
sqlalchemy==2.0.30
psycopg2-binary==2.9.9
alembic==1.13.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.1
pytest==8.2.0
httpx==0.27.0
```

- [ ] **Step 3: Create `backend/.env.example`**

```
DATABASE_URL=postgresql://freshtrack:freshtrack@localhost:5432/freshtrack
JWT_SECRET=change-me-to-a-long-random-string
```

- [ ] **Step 4: Create `backend/.env`** (gitignored)

Copy `.env.example` to `.env`. The defaults work for local Docker Compose. Pick any string for `JWT_SECRET`:

```bash
cp backend/.env.example backend/.env
```

Then open `backend/.env` and set `JWT_SECRET` to any random string, e.g. `my-local-dev-secret`.

- [ ] **Step 5: Add `.env` to `.gitignore`**

Open the repo root `.gitignore` (or `backend/.gitignore` if it exists). Add:

```
backend/.env
backend/venv/
backend/__pycache__/
backend/**/__pycache__/
backend/.pytest_cache/
```

- [ ] **Step 6: Create `backend/pytest.ini`**

```ini
[pytest]
testpaths = tests
pythonpath = .
```

- [ ] **Step 7: Create empty package markers**

Create `backend/app/__init__.py` — empty file.
Create `backend/app/routers/__init__.py` — empty file.
Create `backend/tests/__init__.py` — empty file.

- [ ] **Step 8: Create `backend/app/database.py`**

```python
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 9: Create `backend/app/main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, items

app = FastAPI(title="FreshTrack API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(items.router, prefix="/items", tags=["items"])
```

- [ ] **Step 10: Set up Python venv and install deps**

```bash
cd /Users/chloexu/Chloe/code/freshtrack/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Expected: packages install without errors.

- [ ] **Step 11: Start Postgres**

```bash
cd /Users/chloexu/Chloe/code/freshtrack/backend
docker compose up -d
```

Expected: `freshtrack-db-1` container running. Verify: `docker ps` shows it up.

- [ ] **Step 12: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add backend/
git commit -m "feat: backend scaffold — FastAPI, SQLAlchemy, Docker Compose"
```

---

## Task 2: ORM models

**Files:**
- Create: `backend/app/models.py`

- [ ] **Step 1: Create `backend/app/models.py`**

```python
import uuid
from sqlalchemy import Column, String, Date, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Item(Base):
    __tablename__ = "items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    quantity = Column(Text, nullable=True)
    purchase_date = Column(Date, nullable=False)
    predicted_expiry = Column(Date, nullable=False)
    status = Column(String, nullable=False, default="in_fridge")
    status_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

- [ ] **Step 2: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add backend/app/models.py
git commit -m "feat: SQLAlchemy ORM models for User and Item"
```

---

## Task 3: Alembic migrations

**Files:**
- Create: `backend/alembic/` (via `alembic init`)
- Modify: `backend/alembic/env.py`

- [ ] **Step 1: Initialise Alembic**

```bash
cd /Users/chloexu/Chloe/code/freshtrack/backend
source venv/bin/activate
alembic init alembic
```

Expected: `alembic/` directory created with `env.py`, `script.py.mako`, `versions/`. `alembic.ini` created in `backend/`.

- [ ] **Step 2: Replace `backend/alembic/env.py` with this**

```python
import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# Make `app` importable from this file
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

import app.models  # noqa: F401 — registers models with Base
from app.database import Base

config = context.config

# Override sqlalchemy.url from environment
config.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL"])

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

- [ ] **Step 3: Generate migration**

```bash
cd /Users/chloexu/Chloe/code/freshtrack/backend
source venv/bin/activate
alembic revision --autogenerate -m "create users and items tables"
```

Expected: a file created in `alembic/versions/` with `create users and items tables` in the name. Open it and verify it contains `op.create_table('users', ...)` and `op.create_table('items', ...)`.

- [ ] **Step 4: Apply migration**

```bash
alembic upgrade head
```

Expected:
```
INFO  [alembic.runtime.migration] Running upgrade  -> <hash>, create users and items tables
```

- [ ] **Step 5: Verify tables exist**

```bash
docker exec -it freshtrack-db-1 psql -U freshtrack -d freshtrack -c "\dt"
```

Expected output:
```
        List of relations
 Schema | Name  | Type  |   Owner
--------+-------+-------+-----------
 public | items | table | freshtrack
 public | users | table | freshtrack
```

- [ ] **Step 6: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add backend/alembic/ backend/alembic.ini
git commit -m "feat: Alembic migrations — create users and items tables"
```

---

## Task 4: Pydantic schemas

**Files:**
- Create: `backend/app/schemas.py`

- [ ] **Step 1: Create `backend/app/schemas.py`**

```python
from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict


# --- Auth ---

class RegisterRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    token: str


# --- Items ---

class ItemCreate(BaseModel):
    name: str
    quantity: Optional[str] = None
    purchase_date: date
    predicted_expiry: date


class ItemCreateBatch(BaseModel):
    items: list[ItemCreate]


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[str] = None
    predicted_expiry: Optional[date] = None
    status: Optional[str] = None


class ItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    name: str
    quantity: Optional[str]
    purchase_date: date
    predicted_expiry: date
    status: str
    status_at: Optional[datetime]
    created_at: datetime
```

- [ ] **Step 2: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add backend/app/schemas.py
git commit -m "feat: Pydantic schemas for auth and items"
```

---

## Task 5: Auth utilities

**Files:**
- Create: `backend/app/auth.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_auth_utils.py`

- [ ] **Step 1: Write failing tests in `backend/tests/test_auth_utils.py`**

```python
import os
os.environ.setdefault("DATABASE_URL", "postgresql://freshtrack:freshtrack@localhost:5432/test_freshtrack")
os.environ.setdefault("JWT_SECRET", "test-secret")

from app.auth import hash_password, verify_password, create_token


def test_hash_and_verify():
    hashed = hash_password("mypassword")
    assert hashed != "mypassword"
    assert verify_password("mypassword", hashed)


def test_wrong_password_fails():
    hashed = hash_password("correct")
    assert not verify_password("wrong", hashed)


def test_create_token_returns_string():
    token = create_token("some-user-id")
    assert isinstance(token, str)
    assert len(token) > 20
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/chloexu/Chloe/code/freshtrack/backend
source venv/bin/activate
pytest tests/test_auth_utils.py -v
```

Expected: `ImportError` — `app.auth` does not exist yet.

- [ ] **Step 3: Create the test database**

```bash
docker exec freshtrack-db-1 createdb -U freshtrack test_freshtrack
```

Expected: no output (success).

- [ ] **Step 4: Create `backend/tests/conftest.py`**

```python
import os

# Must be set before any app import — database.py reads DATABASE_URL at import time
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql://freshtrack:freshtrack@localhost:5432/test_freshtrack",
)
os.environ.setdefault("JWT_SECRET", "test-secret")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db

TEST_DB_URL = os.environ["DATABASE_URL"]
engine = create_engine(TEST_DB_URL)
SessionFactory = sessionmaker(engine, autocommit=False, autoflush=False)


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture(autouse=True)
def clean_tables():
    """Truncate all tables between tests to guarantee isolation."""
    yield
    with engine.connect() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())
        conn.commit()


@pytest.fixture
def db():
    session = SessionFactory()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
```

- [ ] **Step 5: Create `backend/app/auth.py`**

```python
import os
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.database import get_db
from app import models

JWT_SECRET = os.environ["JWT_SECRET"]
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": user_id, "exp": expire}, JWT_SECRET, algorithm=ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
pytest tests/test_auth_utils.py -v
```

Expected:
```
tests/test_auth_utils.py::test_hash_and_verify PASSED
tests/test_auth_utils.py::test_wrong_password_fails PASSED
tests/test_auth_utils.py::test_create_token_returns_string PASSED
3 passed
```

- [ ] **Step 7: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add backend/app/auth.py backend/tests/
git commit -m "feat: auth utilities — bcrypt hashing, JWT creation, get_current_user"
```

---

## Task 6: Auth router

**Files:**
- Create: `backend/app/routers/auth.py`
- Create: `backend/tests/test_auth.py`

- [ ] **Step 1: Write failing tests in `backend/tests/test_auth.py`**

```python
def test_register_returns_token(client):
    res = client.post("/auth/register", json={"email": "a@test.com", "password": "pass123"})
    assert res.status_code == 200
    data = res.json()
    assert "token" in data
    assert isinstance(data["token"], str)


def test_register_duplicate_email_returns_409(client):
    client.post("/auth/register", json={"email": "a@test.com", "password": "pass123"})
    res = client.post("/auth/register", json={"email": "a@test.com", "password": "other"})
    assert res.status_code == 409


def test_login_returns_token(client):
    client.post("/auth/register", json={"email": "a@test.com", "password": "pass123"})
    res = client.post("/auth/login", json={"email": "a@test.com", "password": "pass123"})
    assert res.status_code == 200
    assert "token" in res.json()


def test_login_wrong_password_returns_401(client):
    client.post("/auth/register", json={"email": "a@test.com", "password": "pass123"})
    res = client.post("/auth/login", json={"email": "a@test.com", "password": "wrong"})
    assert res.status_code == 401


def test_login_unknown_email_returns_401(client):
    res = client.post("/auth/login", json={"email": "nobody@test.com", "password": "x"})
    assert res.status_code == 401
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/chloexu/Chloe/code/freshtrack/backend
source venv/bin/activate
pytest tests/test_auth.py -v
```

Expected: 5 tests fail with `404 Not Found` (routes don't exist yet).

- [ ] **Step 3: Create `backend/app/routers/auth.py`**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth as auth_utils

router = APIRouter()


@router.post("/register", response_model=schemas.TokenResponse)
def register(req: schemas.RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    user = models.User(
        email=req.email,
        password_hash=auth_utils.hash_password(req.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"token": auth_utils.create_token(str(user.id))}


@router.post("/login", response_model=schemas.TokenResponse)
def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user or not auth_utils.verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return {"token": auth_utils.create_token(str(user.id))}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_auth.py -v
```

Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add backend/app/routers/auth.py backend/tests/test_auth.py
git commit -m "feat: auth endpoints — register and login with JWT"
```

---

## Task 7: Items router

**Files:**
- Create: `backend/app/routers/items.py`
- Create: `backend/tests/test_items.py`

- [ ] **Step 1: Write failing tests in `backend/tests/test_items.py`**

```python
def _register(client, email="user@test.com", password="pass"):
    res = client.post("/auth/register", json={"email": email, "password": password})
    return res.json()["token"]


def _headers(token):
    return {"Authorization": f"Bearer {token}"}


def _item_payload(name="Apples", qty="6", days_from_now=7):
    return {
        "items": [{
            "name": name,
            "quantity": qty,
            "purchase_date": "2026-05-03",
            "predicted_expiry": "2026-05-10",
        }]
    }


def test_get_items_empty(client):
    token = _register(client)
    res = client.get("/items", headers=_headers(token))
    assert res.status_code == 200
    assert res.json() == []


def test_create_items(client):
    token = _register(client)
    res = client.post("/items", headers=_headers(token), json=_item_payload())
    assert res.status_code == 200
    assert len(res.json()) == 1
    item = res.json()[0]
    assert item["name"] == "Apples"
    assert item["status"] == "in_fridge"
    assert "id" in item


def test_created_items_appear_in_get(client):
    token = _register(client)
    client.post("/items", headers=_headers(token), json=_item_payload())
    res = client.get("/items", headers=_headers(token))
    assert len(res.json()) == 1
    assert res.json()[0]["name"] == "Apples"


def test_patch_status_consumed(client):
    token = _register(client)
    item_id = client.post("/items", headers=_headers(token), json=_item_payload()).json()[0]["id"]
    res = client.patch(f"/items/{item_id}", headers=_headers(token), json={"status": "consumed"})
    assert res.status_code == 200
    assert res.json()["status"] == "consumed"
    assert res.json()["status_at"] is not None


def test_consumed_item_hidden_from_get(client):
    token = _register(client)
    item_id = client.post("/items", headers=_headers(token), json=_item_payload()).json()[0]["id"]
    client.patch(f"/items/{item_id}", headers=_headers(token), json={"status": "consumed"})
    res = client.get("/items", headers=_headers(token))
    assert res.json() == []


def test_delete_item(client):
    token = _register(client)
    item_id = client.post("/items", headers=_headers(token), json=_item_payload()).json()[0]["id"]
    res = client.delete(f"/items/{item_id}", headers=_headers(token))
    assert res.status_code == 204
    assert client.get("/items", headers=_headers(token)).json() == []


def test_items_isolated_between_users(client):
    token1 = _register(client, "u1@test.com")
    token2 = _register(client, "u2@test.com")
    client.post("/items", headers=_headers(token1), json=_item_payload())
    res = client.get("/items", headers=_headers(token2))
    assert res.json() == []


def test_get_items_requires_auth(client):
    res = client.get("/items")
    assert res.status_code == 403


def test_patch_other_users_item_returns_404(client):
    token1 = _register(client, "u1@test.com")
    token2 = _register(client, "u2@test.com")
    item_id = client.post("/items", headers=_headers(token1), json=_item_payload()).json()[0]["id"]
    res = client.patch(f"/items/{item_id}", headers=_headers(token2), json={"status": "consumed"})
    assert res.status_code == 404
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/chloexu/Chloe/code/freshtrack/backend
source venv/bin/activate
pytest tests/test_items.py -v
```

Expected: 9 tests fail with `404 Not Found` (routes don't exist yet).

- [ ] **Step 3: Create `backend/app/routers/items.py`**

```python
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter()


@router.get("", response_model=list[schemas.ItemResponse])
def get_items(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.Item)
        .filter(models.Item.user_id == user.id, models.Item.status == "in_fridge")
        .all()
    )


@router.post("", response_model=list[schemas.ItemResponse])
def create_items(
    body: schemas.ItemCreateBatch,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    created = []
    for item_data in body.items:
        item = models.Item(user_id=user.id, **item_data.model_dump())
        db.add(item)
        created.append(item)
    db.commit()
    for item in created:
        db.refresh(item)
    return created


@router.patch("/{item_id}", response_model=schemas.ItemResponse)
def update_item(
    item_id: str,
    body: schemas.ItemUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    item = (
        db.query(models.Item)
        .filter(models.Item.id == item_id, models.Item.user_id == user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    patch = body.model_dump(exclude_unset=True)
    if "status" in patch and patch["status"] != "in_fridge":
        patch["status_at"] = datetime.now(timezone.utc)
    for key, value in patch.items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def delete_item(
    item_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    item = (
        db.query(models.Item)
        .filter(models.Item.id == item_id, models.Item.user_id == user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_items.py -v
```

Expected: 9 passed.

- [ ] **Step 5: Run full backend test suite**

```bash
pytest -v
```

Expected: all 17 tests pass (3 auth utils + 5 auth + 9 items).

- [ ] **Step 6: Verify Swagger UI works**

```bash
uvicorn app.main:app --reload
```

Open `http://localhost:8000/docs`. Expected: Swagger UI shows `/auth/register`, `/auth/login`, `/items` endpoints. Test register via the UI — should return a token.

- [ ] **Step 7: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add backend/app/routers/items.py backend/tests/test_items.py
git commit -m "feat: items CRUD endpoints with user isolation"
```

---

## Task 8: Mobile — install expo-secure-store and config

**Files:**
- Create: `mobile/constants/config.ts`

- [ ] **Step 1: Install expo-secure-store**

```bash
cd /Users/chloexu/Chloe/code/freshtrack/mobile
npx expo install expo-secure-store
```

Expected: `expo-secure-store` added to `package.json`.

- [ ] **Step 2: Create `mobile/constants/config.ts`**

```typescript
// For iOS simulator: 'http://localhost:8000'
// For real device on WiFi: find your laptop's local IP with `ipconfig getifaddr en0`
// and set e.g. 'http://192.168.1.42:8000'
export const API_BASE_URL = 'http://localhost:8000';
```

- [ ] **Step 3: Run mobile tests to confirm nothing broke**

```bash
cd /Users/chloexu/Chloe/code/freshtrack/mobile
npx jest --no-coverage
```

Expected: 15 passed.

- [ ] **Step 4: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add mobile/constants/config.ts mobile/package.json mobile/package-lock.json
git commit -m "feat: add expo-secure-store and API base URL config"
```

---

## Task 9: Mobile api.ts

**Files:**
- Create: `mobile/services/api.ts`

- [ ] **Step 1: Create `mobile/services/api.ts`**

```typescript
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/config';

const TOKEN_KEY = 'auth_token';

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function saveToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  requiresAuth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (requiresAuth) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.detail ?? res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// --- Auth ---

export async function register(email: string, password: string): Promise<void> {
  const { token } = await request<{ token: string }>(
    '/auth/register',
    { method: 'POST', body: JSON.stringify({ email, password }) },
    false,
  );
  await saveToken(token);
}

export async function login(email: string, password: string): Promise<void> {
  const { token } = await request<{ token: string }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
    false,
  );
  await saveToken(token);
}

// --- Items (same signatures as mockApi.ts) ---

export type Item = {
  id: string;
  name: string;
  quantity: string | null;
  purchase_date: string;
  predicted_expiry: string;
  status: 'in_fridge' | 'consumed' | 'discarded';
  status_at: string | null;
  created_at: string;
};

export type ItemCreate = {
  name: string;
  quantity: string | null;
  purchase_date: string;
  predicted_expiry: string;
};

export async function getItems(): Promise<Item[]> {
  return request<Item[]>('/items');
}

export async function updateItem(id: string, patch: Partial<Item>): Promise<Item> {
  return request<Item>(`/items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deleteItem(id: string): Promise<void> {
  return request<void>(`/items/${id}`, { method: 'DELETE' });
}

export async function createItems(items: ItemCreate[]): Promise<Item[]> {
  return request<Item[]>('/items', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}
```

- [ ] **Step 2: Run mobile tests**

```bash
cd /Users/chloexu/Chloe/code/freshtrack/mobile
npx jest --no-coverage
```

Expected: 15 passed (api.ts has no tests — it's a network layer; tested via integration).

- [ ] **Step 3: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add mobile/services/api.ts
git commit -m "feat: mobile api.ts — typed fetch wrapper with JWT auth"
```

---

## Task 10: Wire onboarding screen

**Files:**
- Modify: `mobile/app/onboarding.tsx`

- [ ] **Step 1: Replace `mobile/app/onboarding.tsx` with**

```typescript
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { T } from '../constants/theme';
import { register, login, ApiError } from '../services/api';

type Step = 'auth' | 'meal_times';
type Mode = 'register' | 'login';

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('auth');
  const [mode, setMode] = useState<Mode>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lunchTime, setLunchTime] = useState('12:00');
  const [dinnerTime, setDinnerTime] = useState('18:30');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAuth() {
    setError(null);
    setLoading(true);
    try {
      if (mode === 'register') {
        await register(email, password);
      } else {
        await login(email, password);
      }
      setStep('meal_times');
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 409) setError('An account with this email already exists.');
        else if (e.status === 401) setError('Incorrect email or password.');
        else setError('Something went wrong. Check your connection.');
      } else {
        setError("Couldn't connect. Make sure the backend is running.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleGetStarted() {
    router.replace('/(tabs)');
  }

  if (step === 'meal_times') {
    return (
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Text style={s.title}>When do you eat?</Text>
          <Text style={s.subtitle}>We'll use these times to schedule reminders.</Text>

          <Text style={s.label}>Lunch time</Text>
          <TextInput
            style={s.input}
            value={lunchTime}
            onChangeText={setLunchTime}
            placeholder="12:00"
            placeholderTextColor={T.inkLight}
          />

          <Text style={s.label}>Dinner time</Text>
          <TextInput
            style={s.input}
            value={dinnerTime}
            onChangeText={setDinnerTime}
            placeholder="18:30"
            placeholderTextColor={T.inkLight}
          />

          <TouchableOpacity style={s.btn} onPress={handleGetStarted} activeOpacity={0.8}>
            <Text style={s.btnText}>Get started →</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={s.title}>FreshTrack</Text>
        <Text style={s.subtitle}>Zero-waste grocery tracking.</Text>

        <TextInput
          style={s.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={T.inkLight}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={s.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={T.inkLight}
          secureTextEntry
        />

        {error && <Text style={s.error}>{error}</Text>}

        <TouchableOpacity
          style={[s.btn, loading && s.btnDisabled]}
          onPress={handleAuth}
          activeOpacity={0.8}
          disabled={loading}
        >
          <Text style={s.btnText}>
            {loading ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(null); }}>
          <Text style={s.toggle}>
            {mode === 'register'
              ? 'Already have an account? Sign in'
              : 'New here? Create account'}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.cream },
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 26, fontWeight: '700', color: T.ink, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 13, color: T.inkMid, fontFamily: 'DMSans_400Regular', marginBottom: 32 },
  label: { fontSize: 13, color: T.inkMid, fontFamily: 'DMSans_400Regular', marginBottom: 6 },
  input: {
    backgroundColor: T.creamDark,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: T.ink,
    fontFamily: 'DMSans_400Regular',
    marginBottom: 12,
  },
  error: { fontSize: 13, color: T.coral, fontFamily: 'DMSans_400Regular', marginBottom: 8 },
  btn: {
    backgroundColor: T.green700,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: T.white, fontSize: 16, fontWeight: '600', fontFamily: 'DMSans_600SemiBold' },
  toggle: { textAlign: 'center', color: T.inkLight, fontFamily: 'DMSans_400Regular', fontSize: 13, marginTop: 16 },
});
```

- [ ] **Step 2: Run mobile tests**

```bash
cd /Users/chloexu/Chloe/code/freshtrack/mobile
npx jest --no-coverage
```

Expected: 15 passed.

- [ ] **Step 3: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add mobile/app/onboarding.tsx
git commit -m "feat: wire onboarding to real auth API with error handling"
```

---

## Task 11: Wire Fridge screen

**Files:**
- Modify: `mobile/app/(tabs)/index.tsx` (lines 1–12 only — swap import)

- [ ] **Step 1: Update the import in `mobile/app/(tabs)/index.tsx`**

Change line 9 from:
```typescript
import { getItems, updateItem, deleteItem, Item } from '../../services/mockApi';
```
to:
```typescript
import { getItems, updateItem, deleteItem, Item, ApiError } from '../../services/api';
```

- [ ] **Step 2: Add 401 handling to `loadItems`**

Find `loadItems` (around line 39) and replace it:

```typescript
  async function loadItems() {
    try {
      const data = await getItems();
      setItems(data);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        router.replace('/onboarding');
      }
    }
  }
```

- [ ] **Step 3: Run mobile tests**

```bash
cd /Users/chloexu/Chloe/code/freshtrack/mobile
npx jest --no-coverage
```

Expected: 15 passed.

- [ ] **Step 4: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add mobile/app/\(tabs\)/index.tsx
git commit -m "feat: wire Fridge screen to real items API"
```

---

## Task 12: Wire Camera screen

**Files:**
- Modify: `mobile/app/(tabs)/camera.tsx` (lines 6–8 only — split import)

- [ ] **Step 1: Update imports in `mobile/app/(tabs)/camera.tsx`**

Change lines 6–8 from:
```typescript
import { parseReceipt, createItems, ParsedItem } from '../../services/mockApi';
```
to:
```typescript
import { parseReceipt, ParsedItem } from '../../services/mockApi';
import { createItems, ApiError } from '../../services/api';
```

- [ ] **Step 2: Add 401 handling to `handleConfirm`**

Replace `handleConfirm`:

```typescript
  async function handleConfirm(items: ParsedItem[]) {
    const today = new Date().toISOString().split('T')[0];
    try {
      await createItems(
        items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          purchase_date: today,
          predicted_expiry: daysToDate(item.predicted_expiry_days),
        }))
      );
      setState('capture');
      router.push('/(tabs)');
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        router.replace('/onboarding');
      }
    }
  }
```

- [ ] **Step 3: Run mobile tests**

```bash
cd /Users/chloexu/Chloe/code/freshtrack/mobile
npx jest --no-coverage
```

Expected: 15 passed.

- [ ] **Step 4: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add mobile/app/\(tabs\)/camera.tsx
git commit -m "feat: wire Camera screen — createItems hits real API, parseReceipt stays mock"
```

---

## Task 13: End-to-end verification

- [ ] **Step 1: Ensure backend is running**

```bash
cd /Users/chloexu/Chloe/code/freshtrack/backend
source venv/bin/activate
docker compose up -d
uvicorn app.main:app --reload
```

Expected: API running at `http://localhost:8000`.

- [ ] **Step 2: Run full backend test suite**

```bash
pytest -v
```

Expected: 17 tests pass.

- [ ] **Step 3: Start mobile app**

```bash
cd /Users/chloexu/Chloe/code/freshtrack/mobile
npx expo start
```

Press `i` for simulator (uses `localhost:8000`) or scan QR code on device (update `config.ts` with laptop IP first).

- [ ] **Step 4: Walk through the full flow**

| Step | Expected |
|------|----------|
| Launch app | Onboarding screen |
| Enter email + password, tap "Create account" | Meal times step |
| Tap "Get started →" | Fridge tab loads, empty |
| Tap Add tab → "Analyze Photo" | Confirm list with 3 mock items |
| Tap "Save to fridge" | Fridge tab shows 3 items |
| Tap an item → "✓ Used it" | Item removed, toast shown |
| Kill and reopen app | Items persist (loaded from DB) |
| Go back to onboarding, tap "Sign in" | Same items still there |

The "kill and reopen" test is the key difference from Phase 0 — data now persists in Postgres.

- [ ] **Step 5: Final commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add .
git commit -m "feat: Phase 1a complete — backend wired to mobile, data persists in Postgres"
```
