# EEU Centralized Correspondence & Payment Registry

A comprehensive LAN-based tracking system for Ethiopian Electric Utility (EEU) managing letters, memos, and payment processing.

- **Frontend**: React 18 (Vite, TailwindCSS, i18next, Lucide icons, MUI)
- **Backend**: Django 5 + Django REST Framework + JWT (SimpleJWT)
- **Database**: PostgreSQL
- **Deployment target**: Windows Server behind IIS reverse proxy (offline LAN)

---

## Features

### Document Management

#### 15 Document Workflow Scenarios
All 15 scenarios are fully implemented with role-based permissions:

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
| S14 | Outgoing Letter | Internal | CxO → CEO | CEO Direction → Dispatch |
| S15 | Memo | Internal | CxO → CEO | CEO Direction → Dispatch |

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

### Document Features
- **Letter Categorization**: General or Regulatory letters
- **Letter Types**: Technical, Legal, Financial, Administrative, General
- **Regulatory Bodies**: Dynamic management of regulatory body names (CEO Secretary)
- **File Attachments** with streaming upload (no memory limit)
- **Activity Log** tracking all document actions
- **Receipt Tracking** per department with pending/completed status
- **CC Acknowledgment** (Mark as Seen) for CC'd offices
- **Priority** (Low/Normal/High/Urgent) and **Confidentiality** (Regular/Confidential/Secret)
- **Audit Export**: Download immutable CSV audit trail for compliance
- **Timeline View**: Unified chronological view of all activities, receipts, and acknowledgments
- **Performance Tracking**: Fastest Receipt and CC Acknowledgment metrics by department

### Payment Management
- **Payment Registration**: Track invoices, TT numbers, vendor payments
- **Payment Types**: Invoice, Advance, Reimbursement, Petty Cash, Other
- **Multi-Currency**: ETB, USD, EUR support
- **Payment Status**: Pending, Approved, Paid, Rejected, Cancelled
- **Duplicate Detection**: Real-time warnings for duplicate invoices/TT numbers
- **Vendor Autocomplete**: Smart suggestions from payment history
- **Saved Filters**: Save and reuse common filter combinations
- **Payment Reports**: Monthly summaries with currency breakdowns
- **Excel Export**: Export payment data to Excel with multiple sheets
- **Payment History**: Track status changes and modifications

### Performance Analytics (CEO & CEO Secretary)
- **Best Performers Dashboard**: Track department performance metrics
- **Receipt Performance**: Average time from dispatch to receipt confirmation
- **CC Acknowledgment Performance**: Average time from dispatch to acknowledgment
- **Historical Trends**: Month-over-month performance comparison
- **Ranking System**: Gold/Silver/Bronze badges for top performers
- **Excel Export**: Download performance data for analysis
- **Monthly Snapshots**: Automated performance data archival

### System Features
- **JWT Authentication** with token refresh and auto-redirect on expiry
- **Dark Mode** with persistent toggle across all pages
- **Internationalization** (English / Amharic) with full UI translation
- **Ethiopian Calendar**: Date picker and display with ET/GC toggle
- **User Management** (SUPER_ADMIN only): create, edit, reset password, delete
- **Settings**: dark mode, fullscreen, change password, account info
- **Responsive Design**: Mobile-friendly interface with horizontal scrolling support
- **Real-time Search**: Debounced search with instant results
- **Pagination**: Server-side pagination for large datasets

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

## Recent Enhancements (2026)
- ✅ Payment management system with multi-currency support
- ✅ Performance tracking and analytics dashboard
- ✅ Regulatory body management
- ✅ Letter categorization (General/Regulatory)
- ✅ Enhanced audit trail with CSV export
- ✅ Monthly performance snapshots
- ✅ Saved payment filters
- ✅ Duplicate payment detection
- ✅ Excel export for payments and performance data
- ✅ Horizontal scrolling support for wide tables
- ✅ Filter improvements (letter category, letter type)

## Planned Enhancements
- 📋 Advanced reporting with custom report builder
- 📋 Email/SMS notifications for due dates and approvals
- 📋 Document templates for common letter types
- 📋 Workflow automation and auto-routing
- 📋 SLA management with deadline tracking
- 📋 Budget tracking integration with payments
- 📋 Vendor management profiles
- 📋 Two-factor authentication (2FA)
- 📋 Mobile app (iOS/Android)
- 📋 Advanced search with full-text indexing
