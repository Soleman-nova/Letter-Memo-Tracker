# EEU Centralized Correspondence Registry — Technical Documentation

**Project:** EEU Centralized Correspondence Registry  
**Organization:** Ethiopian Electric Utility (EEU)  
**Version:** 1.0.0  
**Date:** February 2026  

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Backend Documentation](#4-backend-documentation)
5. [Frontend Documentation](#5-frontend-documentation)
6. [Authentication & Security](#6-authentication--security)
7. [Document Workflow Engine](#7-document-workflow-engine)
8. [Internationalization](#8-internationalization)
9. [Ethiopian Calendar Integration](#9-ethiopian-calendar-integration)
10. [Deployment Guide](#10-deployment-guide)
11. [Configuration Reference](#11-configuration-reference)
12. [Database Schema](#12-database-schema)
13. [API Reference](#13-api-reference)
14. [Project Structure](#14-project-structure)

---

## 1. System Overview

The EEU Centralized Correspondence Registry is a full-stack web application that digitizes the document tracking workflow at Ethiopian Electric Utility. It manages the lifecycle of three document types — **Incoming Letters**, **Outgoing Letters**, and **Memos** — across 14 distinct routing scenarios between the CEO Office and 13 CxO (Chief x Officer) departmental offices.

### Key Capabilities
- **Document Registration** with auto-generated reference numbers
- **Multi-step Workflow** (Register → Direct → Dispatch → Receive → Close)
- **Role-Based Access Control** with 5 user roles
- **Receipt Tracking** per directed office
- **CC Acknowledgment** (mark as seen) for copied offices
- **Ethiopian & Gregorian Calendar** support
- **Bilingual Interface** (English & Amharic)
- **Dark Mode** with persistent preference
- **File Attachments** with download links
- **Activity Audit Trail** for every document action

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client Browser                     │
│  React 18 + Vite + TailwindCSS + MUI Date Picker    │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS / JWT Bearer
                       ▼
┌─────────────────────────────────────────────────────┐
│              Django REST Framework API                │
│         (Waitress WSGI / WhiteNoise Static)          │
├──────────────┬──────────────┬───────────────────────┤
│  apps.core   │ apps.documents│   django.contrib.auth │
│  (Users,     │ (Documents,   │   (User model,        │
│  Departments,│  Attachments, │    Authentication)     │
│  Profiles)   │  Activities,  │                        │
│              │  Receipts,    │                        │
│              │  Ack, etc.)   │                        │
└──────────────┴──────┬───────┴───────────────────────┘
                      │
                      ▼
              ┌──────────────┐
              │  PostgreSQL   │
              │  Database     │
              └──────────────┘
```

### Communication Flow
1. Frontend makes API calls via **Axios** with JWT Bearer token in headers.
2. Axios interceptor automatically refreshes expired tokens.
3. Backend validates JWT, checks role-based permissions, and returns JSON.
4. Static frontend assets served by Vite dev server (development) or built and deployed separately (production).

---

## 3. Technology Stack

### Backend
| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Django | 5.0.2 |
| REST API | Django REST Framework | 3.14.0 |
| Auth Tokens | Simple JWT | 5.3.1 |
| Database | PostgreSQL | (via psycopg 3.3.2) |
| CORS | django-cors-headers | 4.3.1 |
| Static Files | WhiteNoise | 6.11.0 |
| WSGI Server | Waitress | 2.1.2 |
| Environment | python-dotenv | 1.0.1 |

### Frontend
| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | React | 18.2.0 |
| Build Tool | Vite | 5.x |
| Routing | React Router DOM | 6.22.0 |
| HTTP Client | Axios | 1.6.5 |
| Styling | TailwindCSS | 3.4.1 |
| Icons | Lucide React | 0.312.0 |
| Date Picker | MUI Ethiopian Datepicker | 0.3.2 |
| UI Components | MUI Material | 5.18.0 |
| i18n | i18next + react-i18next | 23.x / 13.x |

---

## 4. Backend Documentation

### 4.1 Django Project Structure

```
backend/
├── eeu_tracker/          # Django project settings
│   ├── settings.py       # Configuration (DB, JWT, CORS, logging)
│   ├── urls.py           # Root URL configuration
│   ├── wsgi.py           # WSGI entry point
│   └── asgi.py           # ASGI entry point
├── apps/
│   ├── core/             # User management & departments
│   │   ├── models.py     # Department, UserProfile
│   │   ├── serializers.py# User/Profile/Department serializers
│   │   ├── views.py      # UserViewSet, DepartmentViewSet, me(), change_password()
│   │   ├── urls.py       # /api/core/ routes
│   │   ├── admin.py      # Django admin registration
│   │   └── management/commands/
│   │       └── seed_departments.py  # Department seeding command
│   └── documents/        # Document management
│       ├── models.py     # Document, Attachment, Activity, Receipt, Acknowledgment, NumberingRule, NumberSequence
│       ├── serializers.py# List/Detail/Create/Update serializers with scenario logic
│       ├── views.py      # DocumentViewSet with workflow actions
│       ├── urls.py       # /api/documents/ routes
│       └── admin.py      # Django admin registration
├── manage.py
├── requirements.txt
├── run_production.py     # Waitress production server script
└── .env.example          # Environment variable template
```

### 4.2 Core App (`apps.core`)

#### Models

**`Department`**
- `code` (CharField, unique) — Short code (e.g., "IT", "HR", "Finance")
- `name` (CharField) — Full name
- `parent` (ForeignKey, self, nullable) — Hierarchical parent
- `active` (BooleanField) — Soft delete flag

**`UserProfile`** (OneToOne with Django `User`)
- `role` (CharField, choices) — One of: `SUPER_ADMIN`, `CEO_SECRETARY`, `CXO_SECRETARY`, `CEO`, `CXO`
- `department` (ForeignKey to `Department`, nullable) — Required for CxO-level roles
- Properties: `is_super_admin`, `is_ceo_secretary`, `is_cxo_secretary`, `is_ceo`, `is_cxo`
- Permission helpers: `can_manage_users`, `can_create_documents`, `can_edit_all_documents`, `can_view_all_documents`, `can_view_document(doc)`, `can_edit_document(doc)`

**Signal:** Auto-creates `UserProfile` on `User` creation. Django superusers get `SUPER_ADMIN` role by default.

#### Views

- **`DepartmentViewSet`** — Read-only; authenticated users only.
- **`UserViewSet`** — Full CRUD; Super Admin only. Includes `reset_password` action.
- **`me()`** — Returns current user with full profile (role, department, permissions).
- **`change_password()`** — Allows authenticated users to change their own password.

### 4.3 Documents App (`apps.documents`)

#### Models

**`Document`**
- `doc_type` — `INCOMING`, `OUTGOING`, or `MEMO`
- `source` — `EXTERNAL` or `INTERNAL`
- `department` — Originating department (null for CEO-level documents)
- `ref_no` — Unique reference number
- `subject`, `summary` — Document content
- `company_office_name` — External party name (for external scenarios)
- `cc_external_names` — Free-text external CC names (used for outgoing external letters; stored as comma-separated text)
- `co_offices` (M2M → Department) — CC'd offices or originating office (context-dependent)
- `directed_offices` (M2M → Department) — Primary recipient offices
- `status` — Current workflow status
- `priority`, `confidentiality` — Classification
- Date fields: `received_date`, `written_date`, `memo_date`, `ceo_directed_date`, `due_date`
- `ceo_note`, `signature_name` — Additional metadata
- `requires_ceo_direction` (Boolean) — Enables S14 workflow
- `created_by`, `assigned_to` — User references

**`Attachment`** — File uploads linked to documents.

**`Activity`** — Audit trail: actor, action, notes, timestamp.

**`DocumentReceipt`** — Tracks per-department receipt confirmation. Unique per (document, department).

**`DocumentAcknowledgment`** — Tracks per-department CC acknowledgment. Unique per (document, department).

**`NumberingRule`** — Defines reference number prefix per department/doc_type.

**`NumberSequence`** — Auto-incrementing counter per department/doc_type/EC year.

#### Serializers

| Serializer | Purpose |
|-----------|---------|
| `DocumentListSerializer` | Lightweight list view (id, ref_no, type, source, subject, status, priority, date, department) + `perspective_direction` (incoming/outgoing from viewer’s perspective) |
| `DocumentDetailSerializer` | Full detail with computed fields: `scenario`, `pending_receipts`, `pending_acknowledgments`, `user_can_acknowledge`, `user_can_receive`, office names |
| `DocumentCreateSerializer` | Creation with validation per scenario, attachment handling, activity logging |
| `DocumentUpdateSerializer` | Status progression and field updates |

**Scenario Detection (`_get_scenario`):**
```
CEO-level (department is null):
  INCOMING + EXTERNAL → S1
  INCOMING + INTERNAL → S2
  OUTGOING + EXTERNAL → S3
  OUTGOING + INTERNAL → S4
  MEMO + has co_offices → S5   (incoming memo from CxO; originating office stored in co_offices)
  MEMO + no co_offices → S6    (outgoing memo from CEO)

CxO-level (department is set):
  INCOMING + EXTERNAL → S7
  INCOMING + INTERNAL → S8
  OUTGOING + EXTERNAL → S9
  OUTGOING + INTERNAL + requires_ceo_direction → S14
  OUTGOING + INTERNAL + has directed_offices → S11
  OUTGOING + INTERNAL + no directed_offices → S10
  MEMO + has directed_offices → S12
  MEMO + no directed_offices → S13
```

#### Views (`DocumentViewSet`)

**Standard CRUD** with role-based access:
- `list` — Filtered by user's role (CEO-level sees all; CxO-level sees own department's docs)
- `retrieve` — Permission check via `can_view_document()`
- `create` — Only users with `can_create_documents` permission
- `update`/`partial_update` — Only users with edit permission
- `destroy` — Only Super Admin / CEO Secretary

**Custom Actions:**

| Action | Method | Description |
|--------|--------|-------------|
| `update_status` | POST | Validates status transitions per scenario and role |
| `mark_received` | POST | Creates `DocumentReceipt`, checks all-received, updates status |
| `acknowledge` | POST | Creates `DocumentAcknowledgment` for CC'd CxO Secretary |
| `attachments` | POST | Uploads additional files to existing document |

**Query Filtering:**
- `q` — Free-text search (ref_no, subject, sender_name, receiver_name)
- `doc_type` — Filter by INCOMING/OUTGOING/MEMO
- `source` — Filter by EXTERNAL/INTERNAL
- `status` — Filter by workflow status
- `co_office` — Filter by source/CC offices (comma-separated IDs)
- `directed_office` — Filter by directed offices (comma-separated IDs)
- `date_from`, `date_to` — Date range on `registered_at`

---

## 5. Frontend Documentation

### 5.1 Project Structure

```
frontend/src/
├── main.jsx              # React entry point with providers
├── App.jsx               # Routes, NavBar, Sidebar layout
├── api.js                # Axios instance with JWT interceptors
├── i18n.js               # i18next configuration (EN + AM translations)
├── index.css             # Global styles + Tailwind directives
├── store/
│   └── auth.js           # JWT token storage (localStorage)
├── contexts/
│   ├── AuthContext.jsx    # User state, permissions, role helpers
│   ├── SettingsContext.jsx# Dark mode, fullscreen preferences
│   └── ToastContext.jsx   # Toast notification system
├── components/
│   ├── EthiopianDateInput.jsx  # Date picker with ET/GC toggle
│   ├── EthDateDisplay.jsx      # Date display in ET + GC formats
│   ├── MultiSelect.jsx         # Multi-select dropdown with checkboxes
│   └── Pagination.jsx          # Reusable pagination control
├── pages/
│   ├── Login.jsx          # Login page with branded hero
│   ├── Dashboard.jsx      # Stats cards + recent documents
│   ├── DocumentsList.jsx  # Filterable document table with pagination
│   ├── DocumentForm.jsx   # Create/edit form with scenario-based fields
│   ├── DocumentDetail.jsx # Full document view with workflow actions
│   ├── Settings.jsx       # Appearance, account, security settings
│   └── UserManagement.jsx # User CRUD with role/department assignment
└── Data/
    ├── Department-en.json # English department name translations
    └── Department-am.json # Amharic department name translations
```

### 5.2 Application Layout

The authenticated app uses a fixed layout:
- **Top NavBar** (`NavBar`) — Logo, app title, language switcher, logout button
- **Left Sidebar** (`Sidebar`) — User profile card, navigation links (permission-filtered)
- **Main Content Area** — Routed page content

Routes:

| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/` | `Login` | Public | Login page |
| `/login` | `Login` | Public | Login page (alias) |
| `/dashboard` | `Dashboard` | Required | Dashboard with stats |
| `/documents` | `DocumentsList` | Required | Document list with filters |
| `/documents/new` | `DocumentForm` | Required | Create new document |
| `/documents/:id` | `DocumentDetail` | Required | View document detail |
| `/documents/:id/edit` | `DocumentForm` | Required | Edit document (CEO direction) |
| `/settings` | `Settings` | Required | User settings |
| `/users` | `UserManagement` | Required | User management (Super Admin) |

### 5.3 State Management

The application uses **React Context** for global state:

**`AuthContext`** — Provided by `AuthProvider`:
- `user` — Current user object with profile
- `loading` — Auth state loading flag
- `logout()` — Clear tokens and user state
- `refreshUser()` — Re-fetch user profile
- Permission booleans: `canManageUsers`, `canCreateDocuments`, `canEditAllDocuments`, `canViewAllDocuments`
- Role booleans: `isSuperAdmin`, `isCeoSecretary`, `isCxoSecretary`, `isCeo`, `isCxo`
- `userRole`, `userDepartment`

**`SettingsContext`** — Provided by `SettingsProvider`:
- `darkMode` / `toggleDarkMode()` — Persisted to `localStorage`
- `isFullscreen` / `toggleFullscreen()` — Browser fullscreen API

**`ToastContext`** — Provided by `ToastProvider`:
- `success(msg)`, `error(msg)`, `warning(msg)`, `info(msg)` — Show toast notifications
- `parseApiError(err)` — Converts Django REST Framework errors to user-friendly strings

**Token Storage** (`store/auth.js`):
- Tokens stored in `localStorage` as `eeu_access` and `eeu_refresh`
- Functions: `setTokens()`, `clearTokens()`, `getAccessToken()`, `getRefreshToken()`, `login()`

### 5.4 API Client (`api.js`)

- Axios instance with configurable `baseURL` via `VITE_API_BASE_URL`
- **Request interceptor:** Attaches `Authorization: Bearer <token>` header
- **Response interceptor:** On 401, attempts token refresh. If refresh fails, redirects to login. Queues concurrent requests during refresh.

### 5.5 Key Components

#### `EthiopianDateInput`
- Wraps `mui-ethiopian-datepicker` with ET/GC calendar toggle buttons
- Converts between `YYYY-MM-DD` strings (backend format) and `Date` objects
- Supports Amharic localization when language is `am`
- MUI theme-aware styling matching Tailwind dark mode

#### `EthDateDisplay`
- Converts Gregorian dates to Ethiopian calendar format
- Shows Ethiopian date as primary, Gregorian as secondary
- Supports inline and block layout modes
- Optional time display

#### `MultiSelect`
- Custom checkbox-based multi-select dropdown
- Select All / Deselect All toggle
- Click-outside-to-close behavior
- Chips display for selected values

#### `Pagination`
- Page number buttons with first/last/prev/next navigation
- Configurable page size selector (10, 25, 50, 100)
- Item count display ("Showing 1-10 of 50")

### 5.6 Document Form (`DocumentForm.jsx`)

The most complex component, handling all 14 scenarios with conditional rendering.

**Key Behaviors:**
- **Role Detection:** `isCeoLevel` (Super Admin, CEO Secretary) vs `isCxoSecretary`
- **Auto-prefix:** Generates reference number prefix from department code and doc type
- **Memo Source Lock:** When `doc_type` changes to `MEMO`, source is forced to `INTERNAL`
- **Memo Direction:** A separate `memoDirection` state (`OPTION_1` / `OPTION_2`) controls which memo scenario fields appear, decoupled from `form.source`
- **Dropdown Filtering:**
  - `deptOptionsExcludeSelf` — Removes user's own department (CxO scenarios)
  - `deptOptionsForCC` — Removes directed offices from CC dropdown (CEO scenarios)
  - `deptOptionsForCCExcludeSelf` — Removes both self and directed offices from CC dropdown (CxO scenarios)
- **Edit Mode:** When accessed via `/documents/:id/edit`, shows CEO direction fields only (directed offices, CEO note, directed date)
- **Department Localization:** Department names loaded from backend, labels from `Department-en.json` / `Department-am.json`

### 5.7 Document Detail (`DocumentDetail.jsx`)

Displays full document information with workflow controls:
- **Scenario-aware labels** for all field sections
- **Action Buttons** rendered based on: current status, scenario, user role
  - CEO Direction (S1, S2, S14) → links to edit page
  - Dispatch → CEO Secretary for CEO scenarios; CxO Secretary for CxO scenarios
  - Mark Received → driven by backend `user_can_receive`
  - Mark as Seen → driven by backend `user_can_acknowledge`
  - In Progress, Responded, Close → based on status and edit permission
- **Delivery Status** card — received vs pending receipts per office
- **CC Acknowledgments** card — seen vs pending per CC office
- **Workflow Progress** — visual step indicator per scenario
- **Attachments** — file download links
- **Activity Log** — chronological audit trail

---

## 6. Authentication & Security

### 6.1 JWT Flow

```
1. User submits username/password → POST /api/auth/token/
2. Backend returns { access: "...", refresh: "..." }
3. Frontend stores tokens in localStorage
4. Every API request includes: Authorization: Bearer <access_token>
5. On 401 response:
   a. Frontend calls POST /api/auth/token/refresh/ with refresh token
   b. New access token received → retry original request
   c. If refresh fails → clear tokens → redirect to /login
```

### 6.2 Token Configuration
- **Access token lifetime:** 60 minutes
- **Refresh token lifetime:** 7 days
- **Refresh rotation:** Enabled (new refresh token on each refresh)

### 6.3 Permission Enforcement
- **Backend:** Every ViewSet action checks user permissions via `UserProfile` methods
- **Frontend:** UI elements conditionally rendered based on `AuthContext` permission flags
- **Double protection:** Frontend hides unauthorized actions; backend rejects unauthorized API calls

### 6.4 Production Security Headers
When `DEBUG=False`:
- `SECURE_BROWSER_XSS_FILTER = True`
- `SECURE_CONTENT_TYPE_NOSNIFF = True`
- `X_FRAME_OPTIONS = 'DENY'`
- `SESSION_COOKIE_SECURE = True`
- `CSRF_COOKIE_SECURE = True`
- `SECURE_HSTS_SECONDS = 31536000` (1 year)

---

## 7. Document Workflow Engine

### 7.1 Status Transition Validation

The backend enforces valid status transitions per scenario. Invalid transitions return `400 Bad Request` with an error message.

**S1, S2, S14 (CEO Direction Required):**
```
REGISTERED → DIRECTED → DISPATCHED → RECEIVED → IN_PROGRESS/CLOSED
                                                → RESPONDED → CLOSED
```

**S4, S6, S8, S11, S12 (Direct Dispatch):**
```
REGISTERED → DISPATCHED → RECEIVED → IN_PROGRESS/CLOSED
                                    → RESPONDED → CLOSED
```

**S5, S7, S10, S13 (Direct Receipt):**
```
REGISTERED → RECEIVED → IN_PROGRESS/CLOSED
                       → RESPONDED → CLOSED
```

**S5 (Forwarding Variant):** When CEO Secretary selects `directed_offices` for an S5 memo, it follows:
```
REGISTERED → DISPATCHED → RECEIVED → IN_PROGRESS/CLOSED
                                   → RESPONDED → CLOSED
```

**S3, S9 (External Outgoing — Register & Close):**
```
REGISTERED → CLOSED
```

### 7.2 Dispatch Authorization

| Scenario | Who Can Dispatch | From Status |
|----------|-----------------|-------------|
| S1, S2, S14 | CEO Secretary / Super Admin | DIRECTED |
| S4, S6 | CEO Secretary / Super Admin | REGISTERED |
| S8, S11, S12 | CxO Secretary (own dept) | REGISTERED |

### 7.3 Receipt Logic

**CEO Office receives (S5, S10, S13):**
- CEO Secretary or Super Admin marks receipt
- Immediately sets status to `RECEIVED`
- Display name: "CEO Office"

**Self-receive (S7):**
- Destination CxO Secretary marks their own office's receipt
- Must belong to the document's department

**Directed office receives (all other scenarios):**
- Each directed CxO Secretary marks their office's receipt individually
- Status changes to `RECEIVED` only when ALL directed offices have confirmed

---

## 8. Internationalization

### 8.1 Setup
- Uses `i18next` with `react-i18next` integration
- Translations defined inline in `frontend/src/i18n.js`
- Two supported languages: English (`en`) and Amharic (`am`)
- Language persisted via `i18next` (localStorage by default)

Default language is configured to **Amharic** (`lng: 'am'`, `fallbackLng: 'am'`).

### 8.2 Translation Scope
- All UI labels, button text, placeholders, error messages
- Scenario titles and descriptions
- Role names and status labels
- Department names (via JSON files: `Department-en.json`, `Department-am.json`)

### 8.3 Language Switching
- Toggle in the top navigation bar (globe icon)
- Dropdown with "English" and "አማርኛ" options
- Instant switch without page reload

### 8.4 Department Name Localization
Backend departments have English `code` and `name`. The frontend maintains separate JSON files with localized department names, matched by `short_name` → `code` mapping.

---

## 9. Ethiopian Calendar Integration

### 9.1 Date Input (`EthiopianDateInput`)
- Uses `mui-ethiopian-datepicker` library
- Toggle between Ethiopian (ET) and Gregorian (GC) calendar modes
- Ethiopian mode: Full Ethiopian calendar date picker with month/year navigation
- Gregorian mode: Standard HTML `<input type="date">`
- Both modes output dates as `YYYY-MM-DD` Gregorian strings for backend storage

### 9.2 Date Display (`EthDateDisplay`)
- Converts Gregorian dates to Ethiopian calendar using `EthiopianDateUtil.toEth()`
- Displays Ethiopian date as primary (e.g., "Meskerem 15, 2018")
- Displays Gregorian date as secondary (e.g., "Sep 25, 2025")
- Amharic month names used when language is `am`
- Optional time display in 12-hour format

### 9.3 Ethiopian Month Names (English)
Meskerem, Tikimt, Hidar, Tahsas, Tir, Yekatit, Megabit, Miazia, Ginbot, Sene, Hamle, Nehase, Pagume

---

## 10. Deployment Guide

### 10.1 Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 13+

### 10.2 Backend Setup

```bash
# 1. Create virtual environment
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
copy .env.example .env
# Edit .env with your database credentials and secret key

# 4. Run migrations
python manage.py migrate

# 5. Seed departments
python manage.py seed_departments

# 6. Create superuser
python manage.py createsuperuser

# 7. Collect static files (production)
python manage.py collectstatic --noinput

# 8. Run development server
python manage.py runserver

# 8b. Run production server (Waitress)
python run_production.py
```

### 10.3 Frontend Setup

```bash
# 1. Install dependencies
cd frontend
npm install

# 2. Configure environment
copy .env.example .env.local
# Edit .env.local: VITE_API_BASE_URL=http://localhost:8000

# 3. Run development server
npm run dev
# → http://localhost:5173

# 4. Build for production
npm run build
# Output: frontend/dist/
```

### 10.4 Production Deployment

**Backend:**
- Set `DEBUG=False` in `.env`
- Set a strong random `SECRET_KEY`
- Configure `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`
- Run with Waitress: `python run_production.py`
- Or use any WSGI server (Gunicorn, uWSGI)
- Serve media files via reverse proxy (Nginx) for best performance

**Frontend:**
- Build: `npm run build`
- Deploy `frontend/dist/` to any static hosting (Nginx, CDN, Netlify)
- Set `VITE_API_BASE_URL` in `.env.production` to the backend URL

### 10.5 Environment Variables

**Backend (`.env`):**

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | `unsafe-secret-key-for-dev` |
| `DEBUG` | Debug mode | `True` |
| `ALLOWED_HOSTS` | Comma-separated hosts | `localhost,127.0.0.1` |
| `DB_NAME` | PostgreSQL database name | `eeu_tracker` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | — |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `CORS_ALLOWED_ORIGINS` | Allowed frontend origins | All (debug) |
| `CSRF_TRUSTED_ORIGINS` | Trusted CSRF origins | — |
| `MEDIA_ROOT` | File upload directory | `backend/media` |
| `DEFAULT_NUMBER_PREFIX` | Default ref no prefix | `""` |
| `HOST` | Server bind host | `0.0.0.0` |
| `PORT` | Server bind port | `8000` |

**Frontend (`.env.local`):**

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000` |

---

## 11. Configuration Reference

### 11.1 Django REST Framework
```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': ('rest_framework_simplejwt.authentication.JWTAuthentication',),
    'DEFAULT_PERMISSION_CLASSES': ('rest_framework.permissions.IsAuthenticated',),
    'DEFAULT_PARSER_CLASSES': ('JSONParser', 'FormParser', 'MultiPartParser'),
}
```

### 11.2 Simple JWT
```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'AUTH_HEADER_TYPES': ('Bearer',),
    'ROTATE_REFRESH_TOKENS': True,
}
```

### 11.3 Vite Build Configuration
- Manual chunk splitting: `vendor-mui`, `vendor-ethiopian`, `vendor-react`
- Dev server port: `5173`

### 11.4 Tailwind CSS
- Config: `frontend/tailwind.config.js`
- PostCSS: `frontend/postcss.config.js`
- Brand colors: Primary `#0B3C5D`, Accent `#F0B429`
- Dark mode: class-based (`dark:` prefix)

---

## 12. Database Schema

### 12.1 Entity Relationship Diagram (Textual)

```
User (django.contrib.auth)
  └── 1:1 UserProfile
        ├── role (SUPER_ADMIN|CEO_SECRETARY|CXO_SECRETARY|CEO|CXO)
        └── FK → Department (nullable)

Department
  ├── code, name, parent (self-FK), active
  ├── → NumberingRule (1:N per doc_type)
  ├── → NumberSequence (1:N per doc_type/ec_year)
  └── M2M relationships via Document

Document
  ├── doc_type, source, status, priority, confidentiality
  ├── ref_no (unique), subject, summary, ec_year
  ├── FK → Department (originating, nullable)
  ├── FK → User (created_by, assigned_to)
  ├── M2M → Department (co_offices)
  ├── M2M → Department (directed_offices)
  ├── Date fields: received_date, written_date, memo_date, ceo_directed_date, due_date
  ├── Text fields: ceo_note, signature_name, company_office_name
  ├── requires_ceo_direction (boolean)
  ├── → Attachment (1:N)
  ├── → Activity (1:N)
  ├── → DocumentReceipt (1:N, unique per department)
  └── → DocumentAcknowledgment (1:N, unique per department)
```

### 12.2 Key Constraints
- `Document.ref_no` — UNIQUE
- `NumberingRule` — UNIQUE TOGETHER (`department`, `doc_type`)
- `NumberSequence` — UNIQUE TOGETHER (`department`, `doc_type`, `ec_year`)
- `DocumentReceipt` — UNIQUE TOGETHER (`document`, `department`)
- `DocumentAcknowledgment` — UNIQUE TOGETHER (`document`, `department`)

---

## 13. API Reference

### 13.1 Authentication

#### Obtain Token
```
POST /api/auth/token/
Body: { "username": "...", "password": "..." }
Response: { "access": "jwt...", "refresh": "jwt..." }
```

#### Refresh Token
```
POST /api/auth/token/refresh/
Body: { "refresh": "jwt..." }
Response: { "access": "jwt...", "refresh": "jwt..." }
```

### 13.2 Current User

#### Get Profile
```
GET /api/core/me/
Response: {
  "id": 1, "username": "admin", "first_name": "...", "last_name": "...",
  "profile": {
    "role": "CEO_SECRETARY", "role_display": "CEO Secretary",
    "department": { "id": 1, "code": "CEO", "name": "..." } | null,
    "can_manage_users": false, "can_create_documents": true,
    "can_edit_all_documents": true, "can_view_all_documents": true
  }
}
```

#### Change Password
```
POST /api/core/change-password/
Body: { "current_password": "...", "new_password": "..." }
Response: { "message": "Password changed successfully" }
```

### 13.3 Departments
```
GET /api/core/departments/
Response: [{ "id": 1, "code": "CEO", "name": "Chief Executive Officer", "parent": null, "active": true }, ...]
```

### 13.4 Users (Super Admin only)
```
GET    /api/core/users/          # List all users
POST   /api/core/users/          # Create user (username, password, role, department)
GET    /api/core/users/{id}/     # Get user detail
PATCH  /api/core/users/{id}/     # Update user
DELETE /api/core/users/{id}/     # Delete user (cannot delete self)
POST   /api/core/users/{id}/reset_password/  # Reset password
```

### 13.5 Documents

#### List
```
GET /api/documents/documents/?q=...&doc_type=...&source=...&status=...&co_office=1,2&directed_office=3&date_from=2025-01-01&date_to=2025-12-31
Response: [{ "id": 1, "ref_no": "CEO/001/18", "doc_type": "INCOMING", "source": "EXTERNAL", "subject": "...", "status": "REGISTERED", "priority": "NORMAL", "registered_at": "...", "department_name": null, "perspective_direction": "INCOMING" }, ...]
```

#### Create
```
POST /api/documents/documents/
Content-Type: multipart/form-data
Fields: doc_type, source, ref_no, ec_year, subject, summary, priority, confidentiality, co_offices[], directed_offices[], received_date, written_date, memo_date, company_office_name, ceo_note, signature_name, department, requires_ceo_direction, attachments[]
Response: { "id": 1, "ref_no": "...", ... }
```

#### Detail
```
GET /api/documents/documents/{id}/
Response: {
  ...all document fields...,
  "scenario": 1,
  "co_office_names": ["IT - Information Technology"],
  "directed_office_names": ["HR - Human Resource"],
  "attachments": [...],
  "activities": [...],
  "receipts": [...],
  "pending_receipts": [{ "id": 0, "name": "CEO Office", "code": "CEO" }],
  "acknowledgments": [...],
  "pending_acknowledgments": [...],
  "user_can_acknowledge": false,
  "user_can_receive": true
}
```

#### Update Status
```
POST /api/documents/documents/{id}/update_status/
Body: { "status": "DISPATCHED" }
Response: { "status": "DISPATCHED" }
Error: { "error": "Cannot transition from REGISTERED to RECEIVED..." }
```

#### Mark Received
```
POST /api/documents/documents/{id}/mark_received/
Response: {
  "message": "Document marked as received",
  "department": "HR",
  "received_at": "2025-01-15T10:30:00Z",
  "all_received": true
}
```

#### Acknowledge (Mark as Seen)
```
POST /api/documents/documents/{id}/acknowledge/
Response: {
  "message": "Document acknowledged successfully",
  "department": "Finance",
  "acknowledged_at": "2025-01-15T10:30:00Z"
}
```

#### Upload Attachments
```
POST /api/documents/documents/{id}/attachments/
Content-Type: multipart/form-data
Fields: files[] (multiple)
Response: [{ "id": 1, "file": "/media/...", "original_name": "...", "size": 1024, ... }]
```

---

## 14. Project Structure

```
windsurf-project/
├── backend/
│   ├── apps/
│   │   ├── core/                    # User & department management
│   │   │   ├── models.py            # Department, UserProfile
│   │   │   ├── serializers.py       # User, Profile, Department serializers
│   │   │   ├── views.py             # CRUD + me() + change_password()
│   │   │   ├── urls.py              # /api/core/ routes
│   │   │   ├── admin.py             # Admin registrations
│   │   │   └── management/commands/
│   │   │       └── seed_departments.py
│   │   └── documents/               # Document management
│   │       ├── models.py            # Document, Attachment, Activity, Receipt, Ack
│   │       ├── serializers.py       # 4 serializers + scenario logic
│   │       ├── views.py             # ViewSet + workflow actions
│   │       ├── urls.py              # /api/documents/ routes
│   │       └── admin.py             # Admin registrations
│   ├── eeu_tracker/                 # Django project
│   │   ├── settings.py              # All configuration
│   │   ├── urls.py                  # Root URL routing
│   │   ├── wsgi.py                  # WSGI entry
│   │   └── asgi.py                  # ASGI entry
│   ├── manage.py
│   ├── requirements.txt             # Python dependencies
│   ├── run_production.py            # Waitress production server
│   └── .env.example                 # Environment template
├── frontend/
│   ├── src/
│   │   ├── main.jsx                 # Entry point with providers
│   │   ├── App.jsx                  # Layout + routes
│   │   ├── api.js                   # Axios + JWT interceptors
│   │   ├── i18n.js                  # Translations (EN + AM)
│   │   ├── store/auth.js            # Token management
│   │   ├── contexts/                # React context providers
│   │   │   ├── AuthContext.jsx
│   │   │   ├── SettingsContext.jsx
│   │   │   └── ToastContext.jsx
│   │   ├── components/              # Reusable UI components
│   │   │   ├── EthiopianDateInput.jsx
│   │   │   ├── EthDateDisplay.jsx
│   │   │   ├── MultiSelect.jsx
│   │   │   └── Pagination.jsx
│   │   └── pages/                   # Page components
│   │       ├── Login.jsx
│   │       ├── Dashboard.jsx
│   │       ├── DocumentsList.jsx
│   │       ├── DocumentForm.jsx
│   │       ├── DocumentDetail.jsx
│   │       ├── Settings.jsx
│   │       └── UserManagement.jsx
│   ├── Data/                        # Department translation JSONs
│   ├── public/                      # Static assets (eeu-logo.png)
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .env.example
├── REQUIREMENTS.md                  # Requirements document
├── DOCUMENTATION.md                 # This documentation
└── README.md
```

---

*© 2026 Ethiopian Electric Utility. Developed by EEU IT.*
