# VaultGuru — Password Manager

A full-stack, encrypted password manager built for companies to securely manage credentials for internal use and multiple clients. Built with **FastAPI** on the backend and **React + TypeScript** on the frontend.

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@passwordmanager.com` | `Admin@123!` |
| Team Member | *(create via admin panel)* | *(set on creation)* |
| Client | *(create via admin panel)* | *(set on creation)* |

> Run `python seed.py` to create the admin account and seed default categories.

---

## Live Application

> **⚠️ Not yet deployed.** See [Deployment Process](#deployment-process) section for how to deploy and what is needed.

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Backend Framework | FastAPI (Python) | REST API, routing, dependency injection |
| ORM | SQLAlchemy | Database models and queries |
| Migrations | Alembic | Schema version control |
| Validation | Pydantic v2 | Request/response schema validation |
| Authentication | python-jose | JWT creation and verification |
| Password Hashing | passlib (bcrypt) | Secure user password hashing |
| Encryption | cryptography (AES-256-GCM) | Credential data encryption |
| Database | SQLite (dev) / PostgreSQL (prod) | Data persistence |
| Frontend Framework | React 19 + TypeScript | UI |
| Build Tool | Vite | Frontend bundling |
| Styling | Tailwind CSS | Utility-first CSS |
| Animations | Framer Motion | Page transitions, card effects |
| UI Components | MUI (Material UI) | Select, Dialog components |
| Icons | Lucide React | Icon set |
| HTTP Client | Fetch API (native) | API communication |
| Routing | React Router v7 | Client-side routing |

---

## Project Structure

```
password-manager/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── dependencies.py        # Auth guards: get_current_user, RequireRole, RequirePermission
│   │   │   └── routes/
│   │   │       ├── auth.py            # POST /api/auth/login
│   │   │       ├── users.py           # User CRUD + bulk share + reset password
│   │   │       ├── credentials.py     # Credential CRUD with AES-256-GCM encryption
│   │   │       ├── sharing.py         # Share and revoke credential access
│   │   │       ├── categories.py      # Category CRUD
│   │   │       ├── clients.py         # Client CRUD
│   │   │       ├── dashboard.py       # Aggregated stats endpoint
│   │   │       ├── logs.py            # Activity log viewer (admin only)
│   │   │       └── password_generator.py  # Cryptographically secure password gen
│   │   ├── core/
│   │   │   ├── database.py            # SQLAlchemy engine, session, Base
│   │   │   ├── encryption.py          # AES-256-GCM encrypt/decrypt functions
│   │   │   ├── security.py            # JWT creation, bcrypt verify/hash
│   │   │   └── config.py              # (placeholder)
│   │   ├── models/
│   │   │   └── models.py              # SQLAlchemy ORM models (all tables)
│   │   ├── schemas/
│   │   │   └── schemas.py             # Pydantic request/response schemas
│   │   └── main.py                    # FastAPI app init, CORS, router registration
│   ├── alembic/                       # Alembic migration environment
│   │   ├── versions/                  # Migration scripts
│   │   └── env.py                     # Migration config
│   ├── seed.py                        # Seeds roles, admin user, default categories
│   ├── test_api.py                    # Automated API test script
│   ├── requirements.txt               # Python dependencies
│   ├── alembic.ini                    # Alembic config
│   ├── .env                           # Environment variables (do not commit)
│   └── .env.example                   # Environment variable template
│
└── frontend/
    └── src/
        ├── context/
        │   └── AuthContext.tsx        # JWT token state, login/logout, isAuthenticated
        ├── lib/
        │   ├── api.ts                 # fetchApi wrapper — injects Bearer token, handles 401
        │   └── utils.ts               # Utility helpers
        ├── pages/
        │   ├── Login.tsx              # Login page with animated editorial layout
        │   ├── Dashboard.tsx          # Main vault — credential grid, stats, filters, modals
        │   ├── Users.tsx              # User management (admin only)
        │   ├── Clients.tsx            # Client management
        │   ├── Categories.tsx         # Category management
        │   └── Logs.tsx               # Activity log viewer
        ├── components/
        │   ├── Layout.tsx             # Sidebar navigation + page outlet
        │   ├── CredentialForm.tsx     # Add/edit credential with type switching
        │   ├── ShareCredentialForm.tsx # Share credential by email with expiry
        │   ├── PasswordGenerator.tsx  # Inline password generator with options
        │   └── AnimatedBackground.tsx # Animated gradient background
        ├── App.tsx                    # Routes, ProtectedRoute guard, AuthProvider
        ├── main.tsx                   # React entry point
        └── index.css                  # Global styles + Tailwind
```

---

## Installation & Setup Instructions

### Prerequisites

- Python 3.11+
- Node.js 18+
- Git

### 1. Clone the Repository

```bash
git clone <repository-url>
cd password-manager
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Open .env and update SECRET_KEY, ENCRYPTION_KEY, ENCRYPTION_SALT

# Run database migrations
alembic upgrade head

# Seed initial data (roles, admin user, 11 default categories)
python seed.py

# Start the development server
uvicorn app.main:app --reload --port 8000
```

Backend available at: `http://localhost:8000`
API docs (Swagger): `http://localhost:8000/docs`
API docs (ReDoc): `http://localhost:8000/redoc`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend available at: `http://localhost:5173`

### 4. Verify Setup

```bash
# With backend running and seeded, run the API test suite:
cd backend
python test_api.py
```

Expected output: `--- ALL TESTS PASSED SUCCESSFULLY! ---`

---

## Environment Variables

All backend configuration lives in `backend/.env`. Copy from `backend/.env.example`:

| Variable | Description | Example / Default |
|----------|-------------|-------------------|
| `DATABASE_URL` | SQLAlchemy DB connection string | `sqlite:///./test.db` |
| `SECRET_KEY` | JWT signing secret — change in production | 64-char random string |
| `ENCRYPTION_KEY` | Passphrase for AES key derivation — change in production | Random passphrase |
| `ENCRYPTION_SALT` | Hex salt for PBKDF2 — change in production | `python -c "import os; print(os.urandom(32).hex())"` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT token lifetime | `30` |
| `ADMIN_EMAIL` | Initial admin email (used by seed.py) | `admin@passwordmanager.com` |
| `ADMIN_PASSWORD` | Initial admin password (used by seed.py) | `Admin@123!` |
| `FRONTEND_URL` | Allowed CORS origin — set to frontend domain | `http://localhost:5173` |

**Frontend** — create `frontend/.env`:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000/api` |

> ⚠️ **Never commit `.env` to version control.** Generate strong random values for `SECRET_KEY`, `ENCRYPTION_KEY`, and `ENCRYPTION_SALT` before any deployment.

### Using PostgreSQL (Production)

```env
DATABASE_URL=postgresql://username:password@localhost:5432/vaultguru
```

---

## Database Design

### Entity Relationship Overview

```
roles ──< users ──< credentials
                        │
              clients ──┤
                        │
            categories ──┤
                        │
                        └──< shared_access
                        │
                        └──< activity_logs
```

### Tables

**`roles`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | String UNIQUE | `admin`, `team_member`, `client` |
| permissions | JSON | Array of permission strings |

**`users`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| email | String UNIQUE | |
| name | String | |
| password_hash | String | bcrypt hash |
| role_id | UUID FK → roles | |
| is_active | Boolean | Default true |
| created_at | DateTime | Auto |
| updated_at | DateTime | Auto on update |

**`clients`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | String UNIQUE | |
| description | String | Nullable |
| created_at | DateTime | Auto |

**`categories`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | String UNIQUE | |
| is_default | Boolean | True for 11 seeded defaults |
| created_at | DateTime | Auto |

**`credentials`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| title | String | Plaintext — searchable |
| client_id | UUID FK → clients | Nullable — null = company credential |
| category_id | UUID FK → categories | Nullable |
| credential_type | String | `standard` or `api` |
| encrypted_data | Text | AES-256-GCM ciphertext (Base64) |
| encryption_iv | String | Per-record random IV (Base64) |
| tags | String | Comma-separated, plaintext — searchable |
| created_by | UUID FK → users | |
| created_at | DateTime | Auto |
| updated_at | DateTime | Auto on update |

**`shared_access`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| credential_id | UUID FK → credentials | |
| shared_with_user_id | UUID FK → users | Nullable — for registered users |
| shared_by_email | String | Nullable — for external/unregistered emails |
| access_level | String | `view_only` or `full_access` |
| expires_at | DateTime | Nullable — null = no expiry |
| created_at | DateTime | Auto |

**`activity_logs`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → users | Who performed the action |
| action | String | e.g. `credential_created`, `credential_shared` |
| credential_id | UUID FK → credentials | Nullable |
| credential_title | String | Stored at log time (survives deletion) |
| metadata_info | JSON | Extra context |
| created_at | DateTime | Auto |

### Key Design Decisions

- **Credential data is a single encrypted blob** — the `encrypted_data` column stores any JSON payload. This makes the data model flexible enough to store standard login fields, API keys, tokens, or any future credential type without schema changes.
- **Company vs. client separation** — `client_id = NULL` means the credential belongs to the company. Any UUID points to a specific client. This simple convention enforces clean data separation.
- **Credential title and tags are plaintext** — to allow efficient search and filtering. They are considered non-sensitive metadata. All sensitive values (passwords, keys, tokens) live exclusively in the encrypted blob.

---

## Authentication & RBAC Approach

### Authentication Flow

1. User submits email + password to `POST /api/auth/login`
2. Server verifies bcrypt hash using `passlib.verify()`
3. On success, a signed JWT is issued containing `{"sub": email, "role": role_name, "exp": timestamp}`
4. The JWT is stored in the browser's `localStorage` via `AuthContext`
5. Every subsequent API request includes `Authorization: Bearer <token>` added by `fetchApi()`
6. Backend `get_current_user()` dependency decodes and validates the JWT on every protected endpoint
7. `get_current_active_user()` additionally checks `user.is_active`
8. On 401, `fetchApi()` clears the token and redirects to `/login`

### Role-Based Access Control

Three roles with a permission-based model:

| Role | Permissions |
|------|------------|
| `admin` | `manage_users`, `manage_company_credentials`, `manage_client_credentials`, `share_credentials`, `view_activity`, `edit_credentials` |
| `team_member` | `view_credentials`, `edit_credentials` |
| `client` | `view_shared_credentials` |

**Enforcement layers:**

- `RequireRole(["admin"])` — route-level guard, blocks by role name
- `RequirePermission("permission_name")` — route-level guard, blocks by specific permission
- Inline checks — credential endpoints manually check `role.permissions` for fine-grained logic
- Credential visibility scoping — admins see all, team members with `view_credentials` see all, clients see only credentials explicitly in `SharedAccess` for their user ID

**Client data isolation:** Client-role users can only access credentials that appear in the `shared_access` table with their `user_id`. The query joins `Credential` with `SharedAccess` filtered by `shared_with_user_id = current_user.id`. This is enforced on both the list endpoint and the single-credential endpoint. No cross-client leakage is possible at the query level.

---

## Encryption Strategy

### Credential Data Encryption

All sensitive credential data (usernames, passwords, API keys, tokens, URLs, notes) is encrypted using **AES-256-GCM** before being written to the database.

**Key Derivation:**

The `ENCRYPTION_KEY` environment variable is never used as the AES key directly. It is passed through **PBKDF2-HMAC-SHA256** with 100,000 iterations to derive a 32-byte key:

```
ENCRYPTION_KEY (env var string)
        │
        ▼
PBKDF2-HMAC-SHA256 (100,000 iterations, SALT from env var)
        │
        ▼
32-byte AES-256 key (in memory only, never stored)
```

**Per-Credential Encryption:**

```
Credential fields (dict)
        │
        ▼
JSON serialization  →  UTF-8 bytes
        │
        ├── os.urandom(12)  →  12-byte random IV (unique per credential)
        │
        ▼
AES-256-GCM encrypt(key, IV, plaintext)
        │
        ├── ciphertext + GCM authentication tag
        │
        ▼
Base64 encode both ciphertext and IV
        │
        ▼
Store in DB:  encrypted_data (Text) + encryption_iv (String)
```

**Why AES-256-GCM:**
- AES-256 is the industry standard for symmetric encryption
- GCM (Galois/Counter Mode) provides **authenticated encryption** — the authentication tag detects any tampering with the stored ciphertext before decryption
- Each credential gets a unique 12-byte random IV — identical passwords stored in two credentials produce different ciphertexts

**Decryption:** On retrieval, Base64 values are decoded, AES-256-GCM decrypts using the derived key and stored IV, the authentication tag is verified automatically, and the JSON is deserialized into a dict returned in the API response.

### User Password Hashing

Login passwords are hashed with **bcrypt** via `passlib`:
- bcrypt is a slow, adaptive hashing algorithm designed specifically for passwords
- `passlib` automatically generates a unique random salt per hash
- The work factor can be increased as hardware improves
- The plaintext password is never stored, logged, or returned anywhere

### What Is NOT Encrypted

The following columns are stored as plaintext for query performance:
- `title`, `tags` — needed for server-side search
- `credential_type`, `client_id`, `category_id` — needed for filtering
- `created_at`, `updated_at` — timestamps

All actual secret values live exclusively in the encrypted blob.

---

## API Documentation

Interactive API documentation is auto-generated by FastAPI:

- **Swagger UI:** `http://localhost:8000/docs` — full interactive docs, try requests directly
- **ReDoc:** `http://localhost:8000/redoc` — clean reference documentation
- **OpenAPI JSON:** `http://localhost:8000/openapi.json` — importable into Postman

### Endpoint Summary

**Auth**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/health` | Public | Health check |

**Credentials**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/credentials` | Any | List credentials (role-scoped). Params: `search`, `client_id`, `category_id` |
| POST | `/api/credentials` | `edit_credentials` | Create credential, encrypts data |
| GET | `/api/credentials/{id}` | Any | Get single credential (access-checked) |
| PUT | `/api/credentials/{id}` | `edit_credentials` | Update, re-encrypts if data changed |
| DELETE | `/api/credentials/{id}` | `edit_credentials` | Delete credential |
| POST | `/api/credentials/{id}/share` | `share_credentials` | Share by email with access level + expiry |
| DELETE | `/api/credentials/{id}/share/{share_id}` | `share_credentials` | Revoke shared access |

**Users**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | Admin | List all users |
| POST | `/api/users` | Admin | Create user |
| DELETE | `/api/users/{id}` | Admin | Delete user (no self-delete) |
| PUT | `/api/users/{id}/reset-password` | Admin | Reset any user's password |
| POST | `/api/users/{id}/bulk-share` | Admin | Bulk share vault/category with a user |
| GET | `/api/users/roles` | Admin | List all roles |

**Clients**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/clients` | Admin, Team Member | List clients |
| POST | `/api/clients` | Admin | Create client |
| DELETE | `/api/clients/{id}` | Admin | Delete client |

**Categories**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/categories` | Any | List categories |
| POST | `/api/categories` | Any | Create category |
| DELETE | `/api/categories/{id}` | Any | Delete category |

**Tools & Monitoring**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/generate-password` | Any | Generate secure password with options |
| GET | `/api/dashboard` | Any | Stats: totals, recent credentials (role-scoped) |
| GET | `/api/logs` | Admin | Activity log (ordered newest first) |

---

## Deployment Process

### Prerequisites for Deployment

Before deploying, complete these steps:

1. **Fix hardcoded API URL** — in `frontend/src/lib/api.ts` change:
   ```typescript
   // FROM:
   export const API_BASE_URL = "http://localhost:8000/api";
   // TO:
   export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
   ```

2. **Restrict CORS** — in `backend/app/main.py` change:
   ```python
   # FROM:
   allow_origins=["*"]
   # TO:
   allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")]
   ```

3. **Set strong secrets** — generate new values for `SECRET_KEY`, `ENCRYPTION_KEY`, `ENCRYPTION_SALT`

### Recommended: Render (Backend) + Vercel (Frontend)

**Step 1 — Deploy Backend on Render**

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect repo, set root directory: `backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `alembic upgrade head && python seed.py && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add a **Render PostgreSQL** database (free tier available)
7. Set environment variables:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Render internal PostgreSQL URL |
   | `SECRET_KEY` | Strong random 64-char string |
   | `ENCRYPTION_KEY` | Strong random passphrase |
   | `ENCRYPTION_SALT` | Output of `python -c "import os; print(os.urandom(32).hex())"` |
   | `FRONTEND_URL` | Your Vercel frontend URL (set after Step 2) |
   | `ADMIN_EMAIL` | Your admin email |
   | `ADMIN_PASSWORD` | Strong admin password |

**Step 2 — Deploy Frontend on Vercel**

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import the `frontend/` folder (or set root directory to `frontend`)
3. Framework preset: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. Add environment variable:

   | Key | Value |
   |-----|-------|
   | `VITE_API_BASE_URL` | `https://your-backend.onrender.com/api` |

7. Deploy — Vercel gives you a URL like `https://vaultguru.vercel.app`

**Step 3 — Connect**

1. Copy the Vercel URL
2. Go back to Render backend → Environment → update `FRONTEND_URL` to the Vercel URL
3. Redeploy the backend to pick up the CORS change

### Docker (Local Full-Stack)

Create `backend/Dockerfile`:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["sh", "-c", "alembic upgrade head && python seed.py && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
```

Create `docker-compose.yml` at project root:
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file:
      - ./backend/.env

  frontend:
    image: node:18-alpine
    working_dir: /app
    volumes:
      - ./frontend:/app
    ports:
      - "5173:5173"
    command: sh -c "npm install && npm run dev -- --host"
    environment:
      - VITE_API_BASE_URL=http://localhost:8000/api
```

Run with: `docker-compose up`

---

## Assumptions & Known Limitations

### Assumptions Made

1. **Single encryption key for all credentials** — all credentials are encrypted with the same server-side key derived from `ENCRYPTION_KEY`. This is a symmetric server-side encryption model, not end-to-end per-user encryption.
2. **Roles are fixed** — the three roles (`admin`, `team_member`, `client`) are defined at seed time. The system supports dynamic permissions per role but role names are not user-configurable via the UI.
3. **Credential title and tags are non-sensitive** — stored as plaintext to support efficient search. Users should not store sensitive information in the title field.
4. **SQLite for development** — the app ships with SQLite for zero-config local dev. PostgreSQL is required for production.
5. **Single admin seeded at startup** — `seed.py` creates one admin account from env vars. Additional admins must be created through the UI.

### Known Limitations & Gaps

**Security**
- `SALT` for PBKDF2 is currently hardcoded in `encryption.py` — should be moved to `ENCRYPTION_SALT` env var before production
- `allow_origins=["*"]` in `main.py` must be restricted to `FRONTEND_URL` before deployment
- Shared access `expires_at` is stored but not checked at credential retrieval time — expired shares still grant access
- `view_only` share access level is stored but not enforced at edit/delete time

**Missing Features**
- No token refresh mechanism — JWT expires after 30 minutes, requiring re-login
- No frontend role-based UI hiding — non-admin users see all nav items (API correctly returns 403, but UX is broken)
- No `PUT` endpoint for users, clients, or categories — edits are not possible after creation
- No `GET /api/credentials/{id}/shares` endpoint — no UI to view or revoke existing shares
- Password generator is hidden when credential type is switched to `api`
- 5 API credential fields missing from form: `client_secret`, `access_token`, `refresh_token`, `docs_url`, `client_id`
- Activity log viewer only shows `action` — user and credential title columns are missing from the UI
- Log timestamps display incorrectly due to `log.timestamp` field reference (should be `log.created_at`)
- `ActivityLogResponse` schema has non-optional `credential_id`/`credential_title` but model has both as nullable — potential 500 on future login log entries
- FK cascade missing on `client_id` and `category_id` — deleting a client/category orphans credentials in SQLite and crashes in PostgreSQL

**UX**
- All feedback uses `alert()` — no toast notification system
- No loading states or skeleton screens while fetching data
- No empty state message when credential list is empty
- Sidebar does not collapse on mobile devices
- `created_at` and `updated_at` are not displayed on credential cards
- No copy-username action (copy password works via double-click, username does not)
- Category filter uses unreliable name-string match instead of UUID
- No Postman collection (Swagger UI at `/docs` serves as API documentation)
- Application is not yet deployed — no live URL available

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│                                                             │
│  React 19 + TypeScript + Vite                               │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────────────┐ │
│  │AuthContext│  │React Router│  │Pages + Components        │ │
│  │(JWT state)│  │(Protected  │  │Dashboard, Users, Clients │ │
│  └──────────┘  │ Routes)    │  │Categories, Logs, Login   │ │
│                └───────────┘  └──────────────────────────┘ │
│                        │ fetchApi() + Bearer token           │
└────────────────────────│────────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────────┐
│                   FastAPI Backend                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Middleware Layer                         │   │
│  │  CORSMiddleware → OAuth2PasswordBearer               │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                   │
│  ┌──────────────────────▼────────────────────────────────┐ │
│  │                  Route Handlers                         │ │
│  │  auth │ users │ credentials │ sharing │ categories     │ │
│  │  clients │ dashboard │ logs │ password_generator       │ │
│  └──────────────────────┬────────────────────────────────┘ │
│                         │                                   │
│  ┌──────────────────────▼────────────────────────────────┐ │
│  │               Core Services                            │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │ security.py  │  │encryption.py │  │ database.py  │ │ │
│  │  │ JWT + bcrypt │  │ AES-256-GCM  │  │ SQLAlchemy   │ │ │
│  │  └─────────────┘  └──────────────┘  └──────────────┘ │ │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                     Database                                 │
│                                                             │
│  SQLite (dev)  /  PostgreSQL (prod)                         │
│                                                             │
│  roles → users → credentials ← shared_access               │
│                      │                                      │
│               clients + categories                          │
│                      │                                      │
│                 activity_logs                               │
└─────────────────────────────────────────────────────────────┘
```

**Request lifecycle (authenticated):**
1. React calls `fetchApi('/credentials')` → adds `Authorization: Bearer <JWT>`
2. FastAPI `CORSMiddleware` checks origin
3. `get_current_user()` dependency decodes JWT, loads user from DB
4. `get_current_active_user()` checks `is_active`
5. `RequireRole` or `RequirePermission` checks role/permission
6. Route handler executes business logic
7. For credential reads: `decrypt_data()` decrypts AES-256-GCM ciphertext per record
8. Pydantic serializes response → JSON returned to browser

---

## Running Tests

```bash
cd backend

# Ensure backend is running and seeded first
uvicorn app.main:app --reload --port 8000 &
python seed.py

# Run tests
python test_api.py
```

Test coverage: login, categories fetch, client CRUD, password generator, credential create/encrypt/decrypt.

---

*Last updated: September 11, 2026*
