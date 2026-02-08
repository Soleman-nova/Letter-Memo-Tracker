# EEU Letter & Memo Tracker

A LAN-only, offline-capable tracking system for Ethiopian Electric Utility (EEU) letters and memos.

- **Frontend**: React 18 (Vite, TailwindCSS, i18next, Lucide icons)
- **Backend**: Django 5 + Django REST Framework + JWT (SimpleJWT)
- **Database**: PostgreSQL
- **Deployment target**: Windows Server behind IIS reverse proxy (offline LAN)

---

## Features

### 13 Document Workflow Scenarios
All 13 scenarios are fully implemented with role-based permissions:

| # | Type | Source | Flow | Key Action |
|---|------|--------|------|------------|
| S1 | Incoming Letter | External | Outside → CEO → CxO | CEO Direction → Dispatch → Receive |
| S2 | Incoming Letter | Internal | CxO → CEO | Register → Receive |
| S3 | Outgoing Letter | External | CEO → Outside | Register only |
| S4 | Outgoing Letter | Internal | CEO → CxO | Dispatch → Receive |
| S5 | Memo | Internal | CxO → CEO | Register → Receive |
| S6 | Memo | External | CEO → CxO | Dispatch → Receive |
| S7 | Incoming Letter | External | Outside → CxO | Register → Receive |
| S8 | Incoming Letter | Internal | CxO → CxO | Dispatch → Receive |
| S9 | Outgoing Letter | External | CxO → Outside | Register only |
| S10 | Outgoing Letter | Internal | CxO → CEO | Register → Receive |
| S11 | Outgoing Letter | Internal | CxO → CxO | Dispatch → Receive |
| S12 | Memo | Internal | CxO → CxO | Dispatch → Receive |
| S13 | Memo | External | CxO → CEO | Register → Receive |

### Roles & Permissions
| Role | Create Docs | View | Edit | User Mgmt |
|------|------------|------|------|-----------|
| SUPER_ADMIN | All | All | All | Yes |
| CEO_SECRETARY | All | All | All | No |
| CXO_SECRETARY | Own dept | Own dept | Own dept | No |
| CEO | No | All | No | No |
| CXO | No | Own dept | No | No |

### Status Workflow
`REGISTERED → DIRECTED → DISPATCHED → RECEIVED → IN_PROGRESS → RESPONDED → CLOSED`

Invalid transitions are blocked by a backend status transition matrix.

### Other Features
- **JWT Authentication** with token refresh and auto-redirect on expiry
- **Dark Mode** with persistent toggle
- **Internationalization** (English / Amharic)
- **File Attachments** with streaming upload (no memory limit)
- **Activity Log** tracking all document actions
- **Receipt Tracking** per department with pending/completed status
- **CC Acknowledgment** (Mark as Seen) for CC'd offices
- **Priority** (Low/Normal/High/Urgent) and **Confidentiality** (Regular/Confidential/Secret)
- **User Management** (SUPER_ADMIN only): create, edit, reset password, delete
- **Settings**: dark mode, fullscreen, change password, account info

---

## Quick Start (Development)

### Backend
```bash
cd backend
pip install -r requirements.txt
copy .env.example .env          # Edit with your DB credentials
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173

---

## Production Deployment

### Backend
```bash
cd backend
copy .env.example .env
# Edit .env: set DEBUG=False, SECRET_KEY, ALLOWED_HOSTS, CORS_ALLOWED_ORIGINS, DB credentials

pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser

# Run with Waitress (Windows-compatible production server)
python run_production.py
```

### Frontend
```bash
cd frontend
# Edit .env.production: set VITE_API_BASE_URL (empty if same domain)
npm install
npm run build
# Serve dist/ folder via IIS or any static file server
```

### IIS Reverse Proxy Setup
1. Install IIS with ARR (Application Request Routing) and URL Rewrite
2. Create a site pointing to `frontend/dist`
3. Add URL Rewrite rules:
   - `/api/*` → `http://127.0.0.1:8000/api/{R:1}`
   - `/admin/*` → `http://127.0.0.1:8000/admin/{R:1}`
   - `/media/*` → `http://127.0.0.1:8000/media/{R:1}`
4. Add a catch-all rewrite for SPA: all other routes → `index.html`
5. Increase request size limits for file uploads

### Environment Variables (Backend)
| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | unsafe-dev-key | Django secret key (change in production!) |
| `DEBUG` | True | Set to False in production |
| `ALLOWED_HOSTS` | localhost,127.0.0.1 | Comma-separated hostnames |
| `DB_NAME` | eeu_tracker | PostgreSQL database name |
| `DB_USER` | postgres | Database user |
| `DB_PASSWORD` | - | Database password |
| `DB_HOST` | localhost | Database host |
| `DB_PORT` | 5432 | Database port |
| `CORS_ALLOWED_ORIGINS` | - | Frontend URL(s), e.g. https://your-domain.com |
| `CSRF_TRUSTED_ORIGINS` | - | Same as CORS origins |
| `MEDIA_ROOT` | ./media | Attachment storage path |
| `SECURE_SSL_REDIRECT` | False | Set True if behind HTTPS |

---

## Project Structure
```
windsurf-project/
├── backend/
│   ├── apps/
│   │   ├── core/          # Users, Departments, Profiles
│   │   └── documents/     # Documents, Attachments, Activities, Receipts
│   ├── eeu_tracker/       # Django settings, URLs, WSGI
│   ├── manage.py
│   ├── run_production.py  # Waitress production server
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/    # MultiSelect
│   │   ├── contexts/      # Auth, Settings, Toast
│   │   ├── pages/         # Dashboard, Documents, Settings, Users
│   │   ├── store/         # JWT token management
│   │   ├── api.js         # Axios instance with JWT interceptors
│   │   ├── i18n.js        # English + Amharic translations
│   │   └── App.jsx        # Routes, NavBar, Sidebar
│   ├── Data/              # Department JSON (en/am)
│   └── package.json
└── README.md
```

---

## Future Enhancements
- Printing/export templates (PDF)
- Date range filters and pagination
- Email/notification reminders for due dates
- Dashboard charts and reporting
- Backup/restore scripts for PostgreSQL and media
