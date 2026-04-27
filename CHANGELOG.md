# Changelog - EEU Centralized Correspondence & Payment Registry

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-04-22

### Added - Payment Management System
- Complete payment tracking module with invoice, TT number, and vendor management
- Multi-currency support (ETB, USD, EUR)
- Payment types: Invoice, Advance, Reimbursement, Petty Cash, Other
- Payment status workflow: Pending → Approved → Paid
- Real-time duplicate detection for invoices and TT numbers
- Vendor name autocomplete from payment history
- Saved filter functionality for quick access to common searches
- Monthly payment summary reports with currency breakdowns
- Excel export with multiple sheets (summary, details, by type, by status)
- Payment history tracking with status change logs

### Added - Performance Analytics Dashboard
- Best Performers section for CEO and CEO Secretary dashboards
- Receipt performance tracking (dispatch to receipt confirmation time)
- CC acknowledgment performance tracking (dispatch to acknowledgment time)
- Department rankings with Gold/Silver/Bronze badges
- Month-over-month trend indicators (up/down/stable)
- Historical performance data with month selector
- Excel export for performance metrics
- Automated monthly performance snapshots
- Django management command for snapshot generation

### Added - Document Enhancements
- Letter categorization: General vs Regulatory
- Letter types: Technical, Legal, Financial, Administrative, General
- Regulatory body management (CEO Secretary only)
- Regulatory body names in English and Amharic
- Enhanced audit trail export (CSV format)
- Timeline view with unified activities, receipts, and acknowledgments
- Timeline filtering by event type and text search
- Scenario 14 and 15 support (CEO direction for CxO documents)
- `dispatched_at` timestamp field for performance tracking
- Enhanced document filters (letter category, letter type)

### Added - UI/UX Improvements
- Horizontal scrolling support for wide tables
- Consistent background colors in light and dark modes
- Navbar stretching to fit content width
- Improved filter auto-apply functionality
- Enhanced date displays with Ethiopian and Gregorian calendars
- Performance dashboard with visual indicators
- Excel export buttons with download functionality
- Improved responsive design for mobile devices

### Changed
- Updated document scenarios from 13 to 15
- Enhanced DocumentDetailSerializer with regulatory body support
- Improved permission system for regulatory body access
- Updated frontend routing for payment management
- Enhanced dashboard layout with performance metrics
- Improved filter persistence with localStorage

### Fixed
- Document list horizontal scrolling issue
- Filter application for letter category and letter type
- Regulatory body API 403 error for non-CEO Secretary users
- Background color consistency when scrolling
- Navbar width on documents page
- Filter auto-apply dependency warnings
- CC office handling for Scenarios 1 and 3

---

## [1.5.0] - 2026-02-14

### Added - Ethiopian Calendar Integration
- Ethiopian date picker component with ET/GC toggle
- Ethiopian date display throughout the application
- Amharic month names support
- Date conversion utilities

### Added - Enhanced Document Features
- CC acknowledgment (Mark as Seen) functionality
- Receipt tracking per department
- Pending receipts and acknowledgments display
- Delivery status card on document detail page
- Timeline view with chronological events
- Activity audit log with actor tracking

### Changed
- Updated document detail page layout
- Enhanced workflow progress indicators
- Improved scenario-based field rendering
- Updated translations for new features

### Fixed
- Date format consistency across the application
- Timeline sorting and filtering
- Receipt confirmation for multiple offices

---

## [1.0.0] - 2026-01-15

### Added - Initial Release
- Complete document management system
- 13 document workflow scenarios
- Role-based access control (5 roles)
- JWT authentication with token refresh
- Dark mode with persistent toggle
- Bilingual support (English/Amharic)
- File attachment management
- User management (SUPER_ADMIN only)
- Department management
- Document status workflow
- Activity logging
- Search and filtering
- Pagination support

### Backend Features
- Django 5 + Django REST Framework
- PostgreSQL database
- JWT authentication (SimpleJWT)
- Waitress production server
- WhiteNoise static file serving
- CORS support
- Comprehensive API endpoints

### Frontend Features
- React 18 + Vite
- TailwindCSS styling
- Lucide React icons
- React Router DOM
- Axios HTTP client
- i18next internationalization
- Context-based state management
- Responsive design

### Security Features
- JWT token authentication
- Role-based permissions
- CSRF protection
- XSS protection
- Secure password hashing
- Activity audit trail

---

## Version History Summary

| Version | Release Date | Major Features |
|---------|--------------|----------------|
| 2.0.0 | 2026-04-22 | Payment Management, Performance Analytics, Regulatory Bodies |
| 1.5.0 | 2026-02-14 | Ethiopian Calendar, Enhanced Audit Trail |
| 1.0.0 | 2026-01-15 | Initial Release with 13 Document Scenarios |

---

## Upgrade Notes

### Upgrading from 1.5.0 to 2.0.0

**Database Migrations:**
```bash
python manage.py migrate
```

**New Dependencies:**
```bash
pip install -r requirements.txt
npm install
```

**New Features to Configure:**
- Regulatory bodies (CEO Secretary can add via admin or API)
- Performance snapshot generation (set up cron job or scheduled task)
- Payment module access (ensure users have appropriate permissions)

**Breaking Changes:**
- None - fully backward compatible

### Upgrading from 1.0.0 to 1.5.0

**Database Migrations:**
```bash
python manage.py migrate
```

**New Dependencies:**
```bash
npm install mui-ethiopian-datepicker
```

**Configuration Changes:**
- None required

---

## Planned Features (Roadmap)

### Version 2.1.0 (Q3 2026)
- Complete audit trail implementation (from planning phase)
- Document lifecycle milestones
- SLA tracking and deadline management
- Email notifications for overdue documents
- Advanced reporting with custom report builder

### Version 2.2.0 (Q4 2026)
- Workflow automation and auto-routing
- Document templates for common letter types
- Budget tracking integration with payments
- Vendor management profiles
- Two-factor authentication (2FA)

### Version 3.0.0 (Q1 2027)
- Mobile app (iOS/Android)
- Advanced search with full-text indexing
- Real-time collaboration features
- Document versioning and comparison
- Integration with external systems (email, ERP)

---

## Support and Feedback

For bug reports, feature requests, or general feedback:
- **Email:** it.admin@eeu.gov.et
- **Phone:** +251-11-123-4568

---

## Contributors

- **Development Team:** EEU IT Department
- **Project Manager:** [Name]
- **Lead Developer:** [Name]
- **QA Team:** [Names]

---

## License

Proprietary - Ethiopian Electric Utility (EEU)  
All rights reserved.

---

**Last Updated:** April 22, 2026  
**Document Version:** 2.0
