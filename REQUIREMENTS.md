# EEU Centralized Correspondence Registry — Requirements Document

**Project:** EEU Centralized Correspondence Registry  
**Organization:** Ethiopian Electric Utility (EEU)  
**Version:** 1.0.0  
**Date:** February 2026  

---

## 1. Introduction

### 1.1 Purpose
This document defines the functional and non-functional requirements for the EEU Centralized Correspondence Registry — a web-based application for tracking, managing, and routing letters and memos within the Ethiopian Electric Utility organization.

### 1.2 Scope
The system serves the CEO Office and all CxO (Chief x Officer) offices across EEU. It manages the full lifecycle of incoming letters, outgoing letters, and internal memos — from registration through direction, dispatch, receipt, and closure.

### 1.3 Stakeholders
- **CEO Office** — Central hub for inter-office and external correspondence
- **CxO Offices** — 13 departmental offices (Audit, Legal & Ethics, Strategic Planning, Communication, NIM, Marketing, Finance, HR, IT, Process & Quality Management, PPM, Supply Chain & PGS, Region Coordination)
- **IT Department** — System administration and maintenance

---

## 2. User Roles and Permissions

### 2.1 Role Definitions

| Role | Code | Description |
|------|------|-------------|
| **Super Admin** | `SUPER_ADMIN` | Full access including user management |
| **CEO Secretary** | `CEO_SECRETARY` | Full document access; creates/edits CEO-level documents; no user management |
| **CxO Secretary** | `CXO_SECRETARY` | Creates/edits documents for their assigned department only |
| **CEO** | `CEO` | Read-only access to all documents |
| **CxO** | `CXO` | Read-only access to their department's documents |

### 2.2 Permission Matrix

| Capability | Super Admin | CEO Secretary | CxO Secretary | CEO | CxO |
|------------|:-----------:|:------------:|:-------------:|:---:|:---:|
| Manage users | ✓ | ✗ | ✗ | ✗ | ✗ |
| Create documents | ✓ | ✓ | ✓ (own dept) | ✗ | ✗ |
| Edit all documents | ✓ | ✓ | ✗ | ✗ | ✗ |
| Edit own dept documents | ✓ | ✓ | ✓ | ✗ | ✗ |
| View all documents | ✓ | ✓ | ✗ | ✓ | ✗ |
| View own dept documents | ✓ | ✓ | ✓ | ✓ | ✓ |
| Delete documents | ✓ | ✓ | ✗ | ✗ | ✗ |
| Change own password | ✓ | ✓ | ✓ | ✓ | ✓ |
| Reset any password | ✓ | ✗ | ✗ | ✗ | ✗ |

### 2.3 Department Association
- **CEO-level roles** (Super Admin, CEO Secretary, CEO): No department required (department is `null`).
- **CxO-level roles** (CxO Secretary, CxO): Must be assigned to exactly one department.

---

## 3. Document Types and Classification

### 3.1 Document Types
| Type | Code | Description |
|------|------|-------------|
| Incoming Letter | `INCOMING` | Letters received from external or internal sources |
| Outgoing Letter | `OUTGOING` | Letters sent to external or internal destinations |
| Memo | `MEMO` | Internal memoranda between offices (source is always INTERNAL) |

### 3.2 Source Classification
| Source | Code | Applicable To |
|--------|------|---------------|
| External | `EXTERNAL` | Letters to/from outside companies and agencies |
| Internal | `INTERNAL` | Letters between CEO and CxO offices; all memos |

### 3.3 Priority Levels
`LOW` · `NORMAL` (default) · `HIGH` · `URGENT`

### 3.4 Confidentiality Levels
`REGULAR` (default) · `CONFIDENTIAL` · `SECRET`

---

## 4. Document Scenarios

The system supports 14 distinct document scenarios, split between CEO-level and CxO-level operations.

### 4.1 CEO-Level Scenarios (Created by CEO Secretary / Super Admin)

| # | Scenario | Type | Source | Description |
|---|----------|------|--------|-------------|
| S1 | External Incoming to CEO | INCOMING | EXTERNAL | Letter from outside company → CEO Office |
| S2 | Internal Incoming to CEO | INCOMING | INTERNAL | Letter from CxO Office → CEO Office |
| S3 | External Outgoing from CEO | OUTGOING | EXTERNAL | Letter from CEO Office → Outside company |
| S4 | Internal Outgoing from CEO | OUTGOING | INTERNAL | Letter from CEO Office → CxO Office(s) |
| S5 | Incoming Memo to CEO | MEMO | INTERNAL | Memo from CxO Office → CEO Office (origin stored in co_offices; can be forwarded by CEO Secretary via directed_offices) |
| S6 | Outgoing Memo from CEO | MEMO | INTERNAL | Memo from CEO → CxO Office(s) (no co_offices; directed_offices are the recipients) |

### 4.2 CxO-Level Scenarios (Created by CxO Secretary)

| # | Scenario | Type | Source | Description |
|---|----------|------|--------|-------------|
| S7 | External Incoming to CxO | INCOMING | EXTERNAL | Letter from outside company → CxO Office |
| S8 | Internal Incoming to CxO | INCOMING | INTERNAL | Letter from another CxO Office → this CxO Office |
| S9 | External Outgoing from CxO | OUTGOING | EXTERNAL | Letter from CxO Office → Outside company |
| S10 | Internal Outgoing to CEO | OUTGOING | INTERNAL | Letter from CxO Office → CEO Office (no directed_offices) |
| S11 | Internal Outgoing to CxO | OUTGOING | INTERNAL | Letter from CxO Office → Other CxO Office(s) (has directed_offices) |
| S12 | Memo to Other CxO | MEMO | INTERNAL | Memo from CxO Office → Other CxO Office(s) (has directed_offices) |
| S13 | Memo to CEO | MEMO | INTERNAL | Memo from CxO Office → CEO Office (no directed_offices) |
| S14 | Internal to CEO with Direction | OUTGOING | INTERNAL | Letter from CxO Office → CEO for direction → CxO Office(s) |

### 4.3 Scenario Detection Logic
- **Memos (S5/S6, S12/S13):** Memos always have `source = INTERNAL`. CEO-level memos are differentiated using `co_offices`:
  - S5 if `co_offices` exist (originating CxO office)
  - S6 if `co_offices` do not exist (outgoing memo from CEO)
- **CxO Outgoing Internal (S10/S11/S14):** S14 if `requires_ceo_direction = true`; S11 if `directed_offices` exist; S10 otherwise.

---

## 5. Document Workflow

### 5.1 Status Lifecycle
| Status | Code | Description |
|--------|------|-------------|
| Registered | `REGISTERED` | Initial entry by secretary |
| Directed | `DIRECTED` | CEO has reviewed and added direction (S1, S2, S14 only) |
| Dispatched | `DISPATCHED` | Sent to destination office(s) |
| Received | `RECEIVED` | Destination office confirmed receipt |
| In Progress | `IN_PROGRESS` | Being actively worked on |
| Responded | `RESPONDED` | Response has been sent |
| Closed | `CLOSED` | Document lifecycle complete |

### 5.2 Workflow per Scenario

| Scenario | Workflow Steps |
|----------|---------------|
| S1, S2, S14 | REGISTERED → DIRECTED → DISPATCHED → RECEIVED → [IN_PROGRESS → RESPONDED →] CLOSED |
| S4, S6, S8, S11, S12 | REGISTERED → DISPATCHED → RECEIVED → [IN_PROGRESS → RESPONDED →] CLOSED |
| S5, S7, S10, S13 | REGISTERED → RECEIVED → [IN_PROGRESS → RESPONDED →] CLOSED |
| S3, S9 | REGISTERED → CLOSED |

Note: **S5 forwarding** is supported when CEO Secretary selects `directed_offices`. In that case, S5 follows:
`REGISTERED → DISPATCHED → RECEIVED → ...` for the directed CxO office(s).

### 5.3 Receipt Tracking
- **Directed offices receive:** For S1, S2, S4, S6, S8, S11, S12, S14 — each directed CxO office must individually mark as received.
- **CEO Office receives:** For S5, S10, S13 — CEO Secretary marks receipt on behalf of CEO Office.
- **Self-receive:** For S7 — the destination CxO Secretary marks their own office's receipt.
- **All-received check:** Status transitions to `RECEIVED` only when all directed offices have confirmed receipt.

### 5.4 CC Acknowledgment (Mark as Seen)
- CC'd offices (via `co_offices`) can acknowledge/mark a document as "seen."
- Applicable in scenarios: S1, S2, S3, S4, S6, S8, S9, S10, S11, S12, S13, S14.
- Only CxO Secretaries of CC'd departments can acknowledge.

---

## 6. Functional Requirements

### 6.1 Authentication & Authorization
- **FR-AUTH-01:** Users must authenticate via username and password.
- **FR-AUTH-02:** System shall use JWT (JSON Web Tokens) with 60-minute access tokens and 7-day refresh tokens.
- **FR-AUTH-03:** Expired access tokens shall be automatically refreshed using the refresh token.
- **FR-AUTH-04:** Failed refresh shall redirect the user to the login page.
- **FR-AUTH-05:** Users can change their own passwords (minimum 8 characters).
- **FR-AUTH-06:** Super Admin can reset any user's password.

### 6.2 User Management
- **FR-USR-01:** Super Admin shall be able to create, edit, and delete user accounts.
- **FR-USR-02:** User creation requires: username, password, role. Email, first/last name are optional.
- **FR-USR-03:** CxO and CxO Secretary roles require a department assignment.
- **FR-USR-04:** Users cannot delete their own account.
- **FR-USR-05:** System shall auto-create a `UserProfile` when a Django `User` is created.

### 6.3 Document Registration
- **FR-DOC-01:** CEO Secretary / Super Admin can register CEO-level documents (S1–S6).
- **FR-DOC-02:** CxO Secretary can register CxO-level documents (S7–S14) for their department.
- **FR-DOC-03:** Each document shall be assigned a unique reference number (`ref_no`).
- **FR-DOC-04:** Reference number format includes a prefix and sequence number per department, doc type, and EC year.
- **FR-DOC-05:** All documents require: reference number, subject, EC year, and scenario-specific required fields.
- **FR-DOC-06:** Documents may optionally include: summary, priority, confidentiality, due date, and file attachments.
- **FR-DOC-06b:** External outgoing letters can optionally include external CC names (`cc_external_names`) in addition to CC offices.
- **FR-DOC-07:** Memo documents shall always have `source = INTERNAL`. The direction (incoming/outgoing) is determined by the presence of `directed_offices`.

### 6.4 Document Direction (CEO Workflow)
- **FR-DIR-01:** For S1, S2, and S14, the CEO Secretary shall add CEO direction (directed offices, CEO note, directed date) before dispatch.
- **FR-DIR-02:** Adding direction changes the status from `REGISTERED` to `DIRECTED`.
- **FR-DIR-03:** Only CEO Secretary or Super Admin can add direction.

### 6.5 Document Dispatch
- **FR-DIS-01:** S1, S2, S14: CEO Secretary dispatches after CEO direction (`DIRECTED` → `DISPATCHED`).
- **FR-DIS-02:** S4, S6: CEO Secretary dispatches directly from `REGISTERED`.
- **FR-DIS-03:** S8, S11, S12: CxO Secretary dispatches from `REGISTERED` (only for their own department).
- **FR-DIS-04:** S3, S9: No dispatch step (external outgoing — register and close).
- **FR-DIS-05:** S5, S7, S10, S13: No dispatch step (direct receipt).

### 6.6 Document Receipt
- **FR-REC-01:** Directed CxO offices mark documents as received individually.
- **FR-REC-02:** CEO Office receipt is marked by CEO Secretary (for S5, S10, S13).
- **FR-REC-03:** Self-receipt by destination CxO Secretary (for S7).
- **FR-REC-04:** Document status changes to `RECEIVED` when all expected offices have confirmed receipt.

### 6.7 CC Acknowledgment
- **FR-ACK-01:** CxO Secretaries of CC'd departments can mark documents as "seen."
- **FR-ACK-02:** Each department can only acknowledge once per document.
- **FR-ACK-03:** System tracks pending and completed acknowledgments.

### 6.8 Document Listing & Filtering
- **FR-LST-01:** All users see documents based on their role permissions.
- **FR-LST-02:** Filters: document type, source (External/Internal), status, source/originating CxO office, directed/destination CxO office, date range, free-text search.
- **FR-LST-03:** Free-text search covers: reference number, subject, sender name, receiver name.
- **FR-LST-04:** Results are paginated (configurable: 10, 25, 50, 100 per page).
- **FR-LST-05:** Document list shall display a **Direction** indicator that is computed from the viewer's perspective (incoming vs outgoing) so the same document can appear outgoing for the sending secretary and incoming for recipients/CC offices.

### 6.9 Document Detail View
- **FR-DET-01:** Display all document fields, scenario label, and workflow progress.
- **FR-DET-02:** Show delivery status (received/pending for each directed office).
- **FR-DET-03:** Show CC acknowledgment status (seen/pending for each CC office).
- **FR-DET-04:** Display activity log (all status changes, attachments, acknowledgments).
- **FR-DET-05:** Display attached files with download links.
- **FR-DET-06:** Show contextual action buttons based on current status, scenario, and user role.

### 6.10 Attachments
- **FR-ATT-01:** File uploads supported during document creation.
- **FR-ATT-02:** Additional files can be uploaded after creation.
- **FR-ATT-03:** System records: file name, size, uploader, and upload timestamp.

### 6.11 Form Business Logic
- **FR-FRM-01:** For memo documents, the source field is always forced to `INTERNAL`.
- **FR-FRM-02:** CC dropdown excludes departments already selected in the "To" (directed offices) field.
- **FR-FRM-03:** CxO-level outgoing scenarios exclude the user's own department from dropdowns.
- **FR-FRM-04:** Form fields are conditionally rendered based on selected document type, source, and user role.

---

## 7. Non-Functional Requirements

### 7.1 Internationalization (i18n)
- **NFR-I18N-01:** System shall support English and Amharic languages.
- **NFR-I18N-02:** Language switch shall be available from the top navigation bar.
- **NFR-I18N-03:** Department names shall be localized using JSON translation files.
- **NFR-I18N-04:** All UI labels, messages, and placeholders shall be translatable.
- **NFR-I18N-05:** The default (primary) UI language shall be Amharic.

### 7.2 Calendar System
- **NFR-CAL-01:** System shall support the Ethiopian calendar (primary) and Gregorian calendar.
- **NFR-CAL-02:** Date input components shall allow toggling between Ethiopian and Gregorian modes.
- **NFR-CAL-03:** Dates shall be displayed in both Ethiopian and Gregorian formats throughout the application.
- **NFR-CAL-04:** Backend stores dates in Gregorian format (ISO 8601); conversion happens in the frontend.

### 7.3 UI/UX
- **NFR-UI-01:** Responsive design supporting desktop and tablet screens.
- **NFR-UI-02:** Dark mode and light mode with persistent user preference.
- **NFR-UI-03:** Fullscreen mode toggle.
- **NFR-UI-04:** Color-coded document types and statuses for quick visual identification.
- **NFR-UI-05:** Toast notifications for success, error, warning, and info messages.
- **NFR-UI-06:** Loading skeletons during data fetch operations.

### 7.4 Security
- **NFR-SEC-01:** All API endpoints require authentication (JWT Bearer token).
- **NFR-SEC-02:** Password minimum length: 8 characters with Django's built-in validators.
- **NFR-SEC-03:** Production mode enables: HSTS, secure cookies, XSS protection, content-type sniffing protection, clickjacking protection.
- **NFR-SEC-04:** CORS restricted to configured allowed origins.
- **NFR-SEC-05:** CSRF protection for trusted origins.
- **NFR-SEC-06:** JWT tokens stored in `localStorage` (keys: `eeu_access`, `eeu_refresh`).

### 7.5 Performance
- **NFR-PERF-01:** Frontend pagination to handle large document lists.
- **NFR-PERF-02:** Database queries use `select_related` for efficient JOINs.
- **NFR-PERF-03:** Static files served via WhiteNoise with compression.
- **NFR-PERF-04:** Frontend build uses manual chunk splitting for vendor libraries.

### 7.6 Deployment
- **NFR-DEP-01:** Backend deployable via Waitress (Windows-compatible WSGI server) or any WSGI server.
- **NFR-DEP-02:** Frontend builds to static files via Vite for any static hosting.
- **NFR-DEP-03:** Environment-based configuration via `.env` files.
- **NFR-DEP-04:** Media files (attachments) served from configurable `MEDIA_ROOT`.
- **NFR-DEP-05:** PostgreSQL required as the database engine.

### 7.7 Logging
- **NFR-LOG-01:** Application logging to console (development) and file (production).
- **NFR-LOG-02:** All document actions recorded as `Activity` entries (audit trail).

---

## 8. Data Model Summary

### 8.1 Core Entities
| Entity | Description |
|--------|-------------|
| `Department` | Organizational unit (code, name, parent, active) |
| `UserProfile` | Extended user data (role, department, permissions) |

### 8.2 Document Entities
| Entity | Description |
|--------|-------------|
| `Document` | Main document record with all metadata |
| `Attachment` | File attached to a document |
| `Activity` | Audit log entry for document actions |
| `DocumentReceipt` | Receipt confirmation by directed office |
| `DocumentAcknowledgment` | CC acknowledgment by CC'd office |
| `NumberingRule` | Per-department, per-type reference number prefix |
| `NumberSequence` | Auto-incrementing sequence per department/type/year |

### 8.3 Key Relationships
- `Document` → `Department` (originating department, nullable for CEO-level)
- `Document` ↔ `Department` (M2M: `co_offices` for CC, `directed_offices` for recipients)
- `Document` → `User` (`created_by`, `assigned_to`)
- `DocumentReceipt` → unique per (`Document`, `Department`)
- `DocumentAcknowledgment` → unique per (`Document`, `Department`)

---

## 9. API Endpoints Summary

### 9.1 Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/token/` | Obtain JWT access + refresh tokens |
| POST | `/api/auth/token/refresh/` | Refresh access token |

### 9.2 Core
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/core/me/` | Current user with profile |
| POST | `/api/core/change-password/` | Change own password |
| GET | `/api/core/departments/` | List all departments |
| CRUD | `/api/core/users/` | User management (Super Admin only) |
| POST | `/api/core/users/{id}/reset_password/` | Reset user password |

### 9.3 Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/documents/documents/` | List documents (filtered by role) |
| POST | `/api/documents/documents/` | Create document |
| GET | `/api/documents/documents/{id}/` | Document detail |
| PUT/PATCH | `/api/documents/documents/{id}/` | Update document |
| DELETE | `/api/documents/documents/{id}/` | Delete document |
| POST | `/api/documents/documents/{id}/update_status/` | Change document status |
| POST | `/api/documents/documents/{id}/mark_received/` | Mark as received |
| POST | `/api/documents/documents/{id}/acknowledge/` | Mark CC as seen |
| POST | `/api/documents/documents/{id}/attachments/` | Upload attachments |

### 9.4 Query Parameters (Document List)
`q`, `doc_type`, `source`, `status`, `department`, `co_office`, `directed_office`, `date_from`, `date_to`

---

## 10. Departments

| Code | Department Name |
|------|----------------|
| CEO | Chief Executive Officer |
| Audit | Internal Audit |
| Legal&Ethics | Legal Service and Ethics |
| SPlanning | Strategic Planning and Investment |
| Communication | Communication |
| NIM | Network Infrastructure Management |
| Marketing | Marketing, Sales and Customer Service |
| Finance | Finance |
| HR | Human Resource |
| IT | Information Technology |
| P&Qmgt | Process and Quality Management |
| PPM | EEU Projects Portfolio Management |
| SC&PGS | Supply Chain Management and PGS |
| RGN Coordination | Region Coordination |

---

## 11. Glossary

| Term | Definition |
|------|-----------|
| **CEO** | Chief Executive Officer |
| **CxO** | Any Chief x Officer (e.g., CIO, CFO, CHR) |
| **EC** | Ethiopian Calendar |
| **GC** | Gregorian Calendar |
| **JWT** | JSON Web Token |
| **CC** | Carbon Copy (additional offices notified) |
| **Directed Office** | The primary destination/recipient office |
| **Co Office** | Source/originating office or CC office (context-dependent) |
| **EEU** | Ethiopian Electric Utility |
