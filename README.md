# EEU Letter & Memo Tracker

A LAN-only, offline-capable tracking system for Ethiopian Electric Utility (EEU) letters and memos.

- Frontend: React (Vite, TailwindCSS, i18next)
- Backend: Django 5 + Django REST Framework + JWT (SimpleJWT)
- Database: PostgreSQL
- Deployment target: Windows Server behind IIS reverse proxy (offline LAN)

---

## Current Status (What’s Implemented)

- Authentication
  - JWT auth endpoints (`/api/auth/token/`, `/api/auth/token/refresh/`)
  - Frontend login + token storage/refresh
- Core domain
  - Departments (CRUD via admin)
  - Document model with numbering: `prefix/sequence/EC` (e.g., `7.23/234/18 EC`)
  - NumberingRule (per department + doc_type → prefix)
  - NumberSequence (per department + doc_type + EC year → sequence)
  - Attachments (no in-memory size limit; streamed to disk)
  - Activities (basic create/attachment activity logs)
- Document fields (per template)
  - `company_office_name`
  - `co_offices` (Many-to-Many Departments)
  - `directed_offices` (Many-to-Many Departments)
  - Dates: `received_date`, `written_date`, `memo_date`, `ceo_directed_date`, `due_date`
  - `ceo_note`, `signature_name`
  - Validation by `doc_type` (INCOMING, OUTGOING, MEMO)
- API
  - `/api/core/departments/`
  - `/api/documents/documents/` (list/detail/create)
  - `/api/documents/documents/{id}/attachments/` (POST files)
  - Query params for filter/search: `q`, `doc_type`, `status`, `department`
- Frontend
  - Pages: Login, Dashboard, Documents List, New Document, Document Detail
  - Internationalization (English/Amharic)
  - Header with title + left-side vertical sidebar navigation
  - New Document form supports multi-select for CO office(s) and Directed office(s)
- File handling / streaming
  - `FILE_UPLOAD_MAX_MEMORY_SIZE=0` (stream uploads to disk)
  - `MEDIA_ROOT` configured
- Windows-friendly dependencies
  - psycopg v3 binary wheels
  - Pillow removed (not needed)

---

## Data Model (Overview)

- Department(code, name, parent)
- NumberingRule(department, doc_type, prefix, active)
- NumberSequence(department, doc_type, ec_year, current_value)
- Document(
  - doc_type, department, assigned_to, ref_no, prefix, sequence, ec_year,
  - subject, summary,
  - company_office_name,
  - co_offices [M2M Department],
  - directed_offices [M2M Department],
  - sender_name, receiver_name,
  - status, priority, confidentiality, registered_at,
  - received_date, written_date, memo_date, ceo_directed_date, due_date,
  - ceo_note, signature_name,
  - created_by
)
- Attachment(document, file, original_name, size, uploaded_by, uploaded_at)
- Activity(document, actor, action, notes, created_at)

Numbering: `ref_no = f"{prefix}/{sequence}/{ec_year:0>2} EC"`

---

## Backend: Setup & Run (Windows)

1. Prerequisites
   - Python 3.11+
   - PostgreSQL 14+ (local, offline)

2. Install deps
   - `pip install -r backend/requirements.txt`

3. Configure environment
   - Copy `backend/.env.example` to `backend/.env` and set values:
     - `DB_NAME=eeu_tracker`
     - `DB_USER=postgres`
     - `DB_PASSWORD=...`
     - `DB_HOST=localhost`
     - `DB_PORT=5432`
     - `MEDIA_ROOT=C:/eeu_tracker_media` (example path)
     - `SECRET_KEY=...`

4. Database & migrations
   - Create the database in PostgreSQL.
   - Run:
     - `python backend/manage.py makemigrations apps.core apps.documents`
     - `python backend/manage.py migrate`
   - Create superuser:
     - `python backend/manage.py createsuperuser`

5. Run dev server
   - `python backend/manage.py runserver 0.0.0.0:8000`

6. Configure numbering rules (admin)
   - Visit `/admin`, add `NumberingRule` for each (department, doc_type) with the desired prefix (e.g., `7.23`).

Notes:
- Backend accepts both single `co_office`/`directed_office` and multi `co_offices[]`/`directed_offices[]` when creating documents. Prefer multi going forward.

---

## Frontend: Setup & Run

1. Prerequisites
   - Node 18+

2. Install deps
   - `cd frontend`
   - `npm install`

3. Configure API base URL
   - Create `frontend/.env.local`:
     - `VITE_API_BASE_URL=http://localhost:8000`

4. Run dev
   - `npm run dev`
   - Open http://localhost:5173

5. Build for production
   - `npm run build` (outputs to `frontend/dist`)

---

## Deployment (Windows Server + IIS, Offline LAN)

- Frontend
  - Serve `frontend/dist` via IIS as a static site.
- Backend
  - Create Python venv; install the backend requirements.
  - Set environment variables (same as dev). Ensure `MEDIA_ROOT` directory exists with write permission.
  - Run Django behind IIS using reverse proxy (ARR + URL Rewrite):
    - Backend service (example): `waitress-serve --port=8000 eeu_tracker.wsgi:application`
    - Proxy `/api/*` and `/admin/*` from IIS to `http://127.0.0.1:8000`.
  - Increase IIS max request length to allow large attachments (Request Filtering + web.config settings).
- Database
  - Local PostgreSQL instance (offline). Configure backups.

---

## Known Gaps / Limitations

- New Document form still uses single-select for CO/Directed office in the UI (backend supports multi).
- No role-based permissions yet (departmental visibility/ownership not enforced).
- No printing/export templates.
- No scheduled reminders/notifications.
- Minimal error toasts and form-level error display (improved but basic).

---

## Suggested Next Steps

1. Workflows & Assignments
   - Add assignment, due dates, reminders (email or local notifications), and SLA statuses.

2. RBAC & Audit
   - Roles: admin, registrar, department user.
   - Department-based visibility for documents.
   - Detailed activity/audit logs.

3. Search & Reporting
   - Add more filters (date ranges, office filters), pagination, sorting.
   - Export CSV, print-friendly PDFs, and summarized reports by department/date.

4. Deployment Hardening
   - Production settings split (DEBUG=false, secure cookies, logging).
   - IIS reverse proxy rules, upload size limits, and health checks.
   - Backup/restore scripts for PostgreSQL and media.

5. Data Migration (if needed)
   - If any legacy records used single `co_office`/`directed_office`, create a one-time data migration to copy them into M2M fields.

---

## Changelog (Keep Updating)

- 2026-02-05
  - Frontend: DocumentForm now uses multi-select inputs for `co_offices` and `directed_offices` and submits arrays via FormData.
  - Switched `co_offices`/`directed_offices` to Many-to-Many in backend; serializers accept both arrays and single values.
  - Sidebar layout added (left vertical), header keeps title on the left.
  - Improved frontend form error display from backend responses.
  - Switched to psycopg v3 binary wheels; removed Pillow dependency.
  - Implemented numbering rules/sequences per department + doc type with EC year.
  - Added template fields (company/office names, dates, CEO note, signature).

---

## Maintenance

This README is a living document. As features are added/changed, update:
- Current Status
- Known Gaps
- Suggested Next Steps
- Changelog (date + bullet of changes)
