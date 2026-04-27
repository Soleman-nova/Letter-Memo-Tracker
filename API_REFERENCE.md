# API Reference - EEU Centralized Correspondence & Payment Registry

**Version:** 2.0  
**Last Updated:** April 2026

---

## Table of Contents

1. [Authentication](#authentication)
2. [Core APIs](#core-apis)
3. [Document APIs](#document-apis)
4. [Payment APIs](#payment-apis)
5. [Performance APIs](#performance-apis)
6. [Regulatory Body APIs](#regulatory-body-apis)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)

---

## Authentication

### Obtain JWT Token

**Endpoint:** `POST /api/auth/token/`

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Token Lifetime:**
- Access Token: 60 minutes
- Refresh Token: 7 days

---

### Refresh JWT Token

**Endpoint:** `POST /api/auth/token/refresh/`

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Note:** Refresh token rotation is enabled. A new refresh token is returned with each refresh.

---

## Core APIs

### Get Current User Profile

**Endpoint:** `GET /api/core/me/`

**Headers:** `Authorization: Bearer <access_token>`

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "admin",
  "first_name": "John",
  "last_name": "Doe",
  "email": "admin@eeu.gov.et",
  "profile": {
    "role": "CEO_SECRETARY",
    "role_display": "CEO Secretary",
    "department": {
      "id": 1,
      "code": "CEO",
      "name": "Chief Executive Officer"
    },
    "can_manage_users": false,
    "can_create_documents": true,
    "can_edit_all_documents": true,
    "can_view_all_documents": true
  }
}
```

---

### Change Password

**Endpoint:** `POST /api/core/change-password/`

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "current_password": "string",
  "new_password": "string"
}
```

**Response (200 OK):**
```json
{
  "message": "Password changed successfully"
}
```

---

### List Departments

**Endpoint:** `GET /api/core/departments/`

**Headers:** `Authorization: Bearer <access_token>`

**Query Parameters:**
- `page` (optional): Page number for pagination
- `page_size` (optional): Number of items per page

**Response (200 OK):**
```json
{
  "count": 14,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "code": "CEO",
      "name": "Chief Executive Officer",
      "parent": null,
      "active": true
    },
    {
      "id": 2,
      "code": "CFO",
      "name": "Chief Financial Officer",
      "parent": null,
      "active": true
    }
  ]
}
```

---

### User Management (SUPER_ADMIN only)

#### List Users

**Endpoint:** `GET /api/core/users/`

**Response (200 OK):**
```json
{
  "count": 25,
  "results": [
    {
      "id": 1,
      "username": "admin",
      "first_name": "John",
      "last_name": "Doe",
      "email": "admin@eeu.gov.et",
      "profile": {
        "role": "SUPER_ADMIN",
        "department": null
      }
    }
  ]
}
```

#### Create User

**Endpoint:** `POST /api/core/users/`

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "first_name": "string",
  "last_name": "string",
  "email": "string",
  "profile": {
    "role": "CXO_SECRETARY",
    "department": 2
  }
}
```

#### Reset User Password

**Endpoint:** `POST /api/core/users/{id}/reset_password/`

**Request Body:**
```json
{
  "new_password": "string"
}
```

---

## Document APIs

### List Documents

**Endpoint:** `GET /api/documents/documents/`

**Query Parameters:**
- `q` (string): Search in ref_no, subject, sender_name, receiver_name
- `doc_type` (string): INCOMING, OUTGOING, MEMO
- `source` (string): EXTERNAL, INTERNAL
- `status` (string): REGISTERED, DIRECTED, DISPATCHED, RECEIVED, IN_PROGRESS, RESPONDED, CLOSED
- `letter_category` (string): GENERAL, REGULATORY
- `letter_type` (string): TECHNICAL, LEGAL, FINANCIAL, ADMINISTRATIVE, GENERAL
- `co_office` (string): Comma-separated department IDs
- `directed_office` (string): Comma-separated department IDs
- `date_from` (date): YYYY-MM-DD format
- `date_to` (date): YYYY-MM-DD format
- `page` (integer): Page number
- `page_size` (integer): Items per page (default: 10)

**Response (200 OK):**
```json
{
  "count": 150,
  "next": "http://api/documents/documents/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "ref_no": "CEO/001/2018",
      "doc_type": "INCOMING",
      "source": "EXTERNAL",
      "subject": "Budget Approval Request",
      "status": "REGISTERED",
      "priority": "HIGH",
      "registered_at": "2026-04-20T10:30:00Z",
      "department_name": null,
      "perspective_direction": "INCOMING",
      "destination_display": "Finance Office",
      "letter_category": "GENERAL",
      "letter_type": "FINANCIAL",
      "letter_category_display": "General",
      "letter_type_display": "Financial",
      "regulatory_body_name": null
    }
  ]
}
```

---

### Get Document Detail

**Endpoint:** `GET /api/documents/documents/{id}/`

**Response (200 OK):**
```json
{
  "id": 1,
  "ref_no": "CEO/001/2018",
  "doc_type": "INCOMING",
  "source": "EXTERNAL",
  "subject": "Budget Approval Request",
  "summary": "Request for Q2 budget approval",
  "sender_name": "Ministry of Finance",
  "receiver_name": "EEU CEO",
  "status": "DIRECTED",
  "priority": "HIGH",
  "confidentiality": "REGULAR",
  "registered_at": "2026-04-20T10:30:00Z",
  "received_date": "2026-04-20",
  "written_date": "2026-04-19",
  "ceo_directed_date": "2026-04-21",
  "ceo_note": "Please review and provide recommendations",
  "letter_category": "GENERAL",
  "letter_type": "FINANCIAL",
  "regulatory_body": null,
  "scenario": 1,
  "department": null,
  "department_name": null,
  "co_offices": [],
  "co_office_names": [],
  "cc_offices": [2, 3],
  "cc_office_names": ["Finance Office", "Legal Office"],
  "directed_offices": [2],
  "directed_office_names": ["Finance Office"],
  "attachments": [
    {
      "id": 1,
      "file": "/media/attachments/2026/04/20/budget_proposal.pdf",
      "original_name": "budget_proposal.pdf",
      "size": 1024000,
      "uploaded_at": "2026-04-20T10:35:00Z"
    }
  ],
  "activities": [
    {
      "id": 1,
      "action": "created",
      "notes": "Document registered",
      "created_at": "2026-04-20T10:30:00Z",
      "actor_name": "CEO Secretary"
    }
  ],
  "receipts": [],
  "pending_receipts": [
    {
      "id": 2,
      "name": "Finance Office",
      "code": "CFO"
    }
  ],
  "acknowledgments": [],
  "pending_acknowledgments": [
    {
      "id": 3,
      "name": "Legal Office",
      "code": "CLO"
    }
  ],
  "user_can_acknowledge": false,
  "user_can_receive": true
}
```

---

### Create Document

**Endpoint:** `POST /api/documents/documents/`

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `doc_type` (required): INCOMING, OUTGOING, MEMO
- `source` (required): EXTERNAL, INTERNAL
- `ref_no` (required): Unique reference number
- `subject` (required): Document subject
- `summary` (optional): Detailed description
- `priority` (optional): LOW, NORMAL, HIGH, URGENT
- `confidentiality` (optional): REGULAR, CONFIDENTIAL, SECRET
- `letter_category` (optional): GENERAL, REGULATORY
- `letter_type` (optional): TECHNICAL, LEGAL, FINANCIAL, ADMINISTRATIVE, GENERAL
- `regulatory_body` (optional): Regulatory body ID
- `department` (optional): Department ID for CxO-level documents
- `co_offices[]` (optional): Array of department IDs
- `cc_offices[]` (optional): Array of department IDs
- `directed_offices[]` (optional): Array of department IDs
- `received_date` (optional): YYYY-MM-DD
- `written_date` (optional): YYYY-MM-DD
- `memo_date` (optional): YYYY-MM-DD
- `company_office_name` (optional): External party name
- `cc_external_names` (optional): External CC names
- `ceo_note` (optional): CEO direction notes
- `signature_name` (optional): Signatory name
- `requires_ceo_direction` (optional): Boolean
- `attachments[]` (optional): File uploads

**Response (201 Created):**
```json
{
  "id": 1,
  "ref_no": "CEO/001/2018",
  ...
}
```

---

### Update Document Status

**Endpoint:** `POST /api/documents/documents/{id}/update_status/`

**Request Body:**
```json
{
  "status": "DISPATCHED"
}
```

**Response (200 OK):**
```json
{
  "status": "DISPATCHED",
  "message": "Status updated successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Cannot transition from REGISTERED to RECEIVED. Valid transitions: DIRECTED, DISPATCHED"
}
```

---

### Mark Document as Received

**Endpoint:** `POST /api/documents/documents/{id}/mark_received/`

**Response (200 OK):**
```json
{
  "message": "Document marked as received",
  "department": "Finance Office",
  "received_at": "2026-04-21T14:30:00Z",
  "all_received": true
}
```

---

### Acknowledge Document (Mark as Seen)

**Endpoint:** `POST /api/documents/documents/{id}/acknowledge/`

**Response (200 OK):**
```json
{
  "message": "Document acknowledged successfully",
  "department": "Legal Office",
  "acknowledged_at": "2026-04-21T15:00:00Z"
}
```

---

### Export Audit Log

**Endpoint:** `GET /api/documents/documents/{id}/audit_export/`

**Response:** CSV file download

**CSV Format:**
```csv
ref_no,event_type,action,department,actor,timestamp,notes
CEO/001/2018,activity,created,,CEO Secretary,2026-04-20T10:30:00Z,Document registered
CEO/001/2018,activity,Status changed to DIRECTED,,CEO Secretary,2026-04-21T09:00:00Z,
CEO/001/2018,receipt,received,CFO,Finance Secretary,2026-04-21T14:30:00Z,
```

---

## Payment APIs

### List Payments

**Endpoint:** `GET /api/payments/payments/`

**Query Parameters:**
- `q` (string): Search in ref_no, vendor_name, invoice_number, tt_number
- `status` (string): PENDING, APPROVED, PAID, REJECTED, CANCELLED
- `payment_type` (string): INVOICE, ADVANCE, REIMBURSEMENT, PETTY_CASH, OTHER
- `date_from` (date): YYYY-MM-DD
- `date_to` (date): YYYY-MM-DD
- `page` (integer): Page number
- `page_size` (integer): Items per page

**Response (200 OK):**
```json
{
  "count": 75,
  "results": [
    {
      "id": 1,
      "temp_ref_no": "TMP-001",
      "ref_no": "PAY/2018/001",
      "registry_date": "2026-04-20",
      "tt_number": "TT123456",
      "arrival_date": "2026-04-19",
      "amount": "50000.00",
      "currency": "ETB",
      "payment_type": "INVOICE",
      "vendor_name": "ABC Suppliers Ltd",
      "invoice_number": "INV-2026-001",
      "description": "Office supplies",
      "payment_date": "2026-04-25",
      "due_date": "2026-05-01",
      "priority": "NORMAL",
      "status": "PENDING",
      "registered_at": "2026-04-20T11:00:00Z",
      "created_by_name": "Finance Secretary"
    }
  ]
}
```

---

### Create Payment

**Endpoint:** `POST /api/payments/payments/`

**Request Body:**
```json
{
  "temp_ref_no": "TMP-001",
  "ref_no": "PAY/2018/001",
  "registry_date": "2026-04-20",
  "tt_number": "TT123456",
  "arrival_date": "2026-04-19",
  "amount": "50000.00",
  "currency": "ETB",
  "payment_type": "INVOICE",
  "vendor_name": "ABC Suppliers Ltd",
  "invoice_number": "INV-2026-001",
  "description": "Office supplies",
  "payment_date": "2026-04-25",
  "due_date": "2026-05-01",
  "priority": "NORMAL"
}
```

---

### Update Payment Status

**Endpoint:** `POST /api/payments/payments/{id}/update_status/`

**Request Body:**
```json
{
  "status": "APPROVED",
  "notes": "Approved by CFO"
}
```

---

### Monthly Payment Summary

**Endpoint:** `GET /api/payments/payments/monthly_summary/`

**Query Parameters:**
- `year` (required): Year (e.g., 2026)
- `month` (optional): Month (1-12)

**Response (200 OK):**
```json
{
  "year": 2026,
  "month": 4,
  "total_count": 45,
  "totals": [
    {
      "currency": "ETB",
      "total_amount": "2500000.00",
      "count": 40
    },
    {
      "currency": "USD",
      "total_amount": "15000.00",
      "count": 5
    }
  ],
  "by_type": [
    {
      "payment_type": "INVOICE",
      "count": 30,
      "total_amount": "2000000.00"
    }
  ],
  "by_status": [
    {
      "status": "PAID",
      "count": 25,
      "total_amount": "1500000.00"
    }
  ]
}
```

---

## Performance APIs

### Get Performance Metrics

**Endpoint:** `GET /api/documents/documents/performance/`

**Headers:** `Authorization: Bearer <access_token>`

**Permissions:** CEO or CEO Secretary only

**Response (200 OK):**
```json
{
  "receipt_performance": [
    {
      "department_id": 2,
      "department_code": "CFO",
      "department_name": "Finance Office",
      "average_hours": 4.5,
      "document_count": 25,
      "rank": 1
    },
    {
      "department_id": 3,
      "department_code": "CLO",
      "department_name": "Legal Office",
      "average_hours": 6.2,
      "document_count": 18,
      "rank": 2
    }
  ],
  "cc_performance": [
    {
      "department_id": 2,
      "department_code": "CFO",
      "department_name": "Finance Office",
      "average_hours": 2.1,
      "document_count": 30,
      "rank": 1
    }
  ]
}
```

---

### Get Performance History

**Endpoint:** `GET /api/documents/documents/performance/history/`

**Query Parameters:**
- `year` (required): Year
- `month` (required): Month (1-12)

**Response (200 OK):**
```json
{
  "month": "2026-03-01",
  "receipt_performance": [...],
  "cc_performance": [...]
}
```

---

## Regulatory Body APIs

### List Regulatory Bodies

**Endpoint:** `GET /api/documents/regulatory-bodies/`

**Response (200 OK):**
```json
{
  "count": 5,
  "results": [
    {
      "id": 1,
      "name_en": "Ethiopian Energy Authority",
      "name_am": "የኢትዮጵያ ኢነርጂ ባለስልጣን",
      "created_at": "2026-01-15T10:00:00Z"
    }
  ]
}
```

---

### Create Regulatory Body (CEO Secretary only)

**Endpoint:** `POST /api/documents/regulatory-bodies/`

**Request Body:**
```json
{
  "name_en": "Ethiopian Energy Authority",
  "name_am": "የኢትዮጵያ ኢነርጂ ባለስልጣን"
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "error": "Error message",
  "detail": "Detailed error description",
  "field_errors": {
    "field_name": ["Error message for this field"]
  }
}
```

### HTTP Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required or failed
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Rate Limiting

Currently, no rate limiting is implemented. This may be added in future versions for production security.

---

## Pagination

All list endpoints support pagination with the following parameters:

- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 10, max: 100)

**Paginated Response Format:**
```json
{
  "count": 150,
  "next": "http://api/endpoint/?page=2",
  "previous": null,
  "results": [...]
}
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- All dates are in YYYY-MM-DD format
- File uploads use multipart/form-data encoding
- JWT tokens must be included in Authorization header: `Bearer <token>`
- Refresh tokens before they expire to maintain session

---

**For additional support, contact:** it.admin@eeu.gov.et
