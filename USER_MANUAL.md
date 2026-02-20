# EEU Centralized Correspondence Registry - User Manual

## Table of Contents
1. [System Overview](#system-overview)
2. [User Roles and Permissions](#user-roles-and-permissions)
3. [Getting Started](#getting-started)
4. [Document Management](#document-management)
5. [Document Scenarios](#document-scenarios)
6. [Workflows and Status Transitions](#workflows-and-status-transitions)
7. [Search and Filtering](#search-and-filtering)
8. [Attachments and File Management](#attachments-and-file-management)
9. [Reporting and Analytics](#reporting-and-analytics)
10. [System Administration](#system-administration)
11. [Troubleshooting](#troubleshooting)
12. [Glossary](#glossary)

---

## System Overview

The EEU Centralized Correspondence Registry is a comprehensive document management system designed to track, manage, and monitor all official correspondence within the Ethiopian Electric Utility organization. The system provides end-to-end tracking of incoming letters, outgoing letters, and internal memos, ensuring proper routing, acknowledgment, and archival of all communications.

### Key Features
- **Document Registration**: Register incoming letters, outgoing letters, and internal memos
- **Role-Based Access Control**: Different user roles with specific permissions
- **Workflow Management**: Automated routing based on document types and scenarios
- **Status Tracking**: Real-time monitoring of document progress
- **Search and Filter**: Advanced search capabilities with multiple criteria
- **Acknowledgment System**: Track when documents are received and acknowledged
- **Reporting**: Generate reports on document volumes and processing times
- **Bilingual Support**: Full English and Amharic language support
- **Direction View (Incoming/Outgoing)**: Documents are labeled as incoming/outgoing based on the viewer’s office perspective

---

## User Roles and Permissions

### SUPER_ADMIN
- **Full System Access**: Complete access to all system features
- **User Management**: Create, modify, and deactivate user accounts
- **Department Management**: Manage organizational structure
- **Document Management**: View, edit, and manage all documents
- **System Configuration**: Configure system settings and parameters

### CEO_SECRETARY
- **CEO Office Management**: Manage documents directed to/from CEO office
- **Document Registration**: Register incoming letters and internal memos
- **CEO Direction**: Add CEO directions and route documents to CxO offices
- **Dispatch Control**: Dispatch documents to appropriate offices
- **View All Documents**: Access all documents in the system

### CXO_SECRETARY
- **Department Management**: Manage documents for their specific CxO office
- **Document Registration**: Register outgoing letters and internal memos
- **CC Acknowledgment**: Mark CC'd documents as seen/acknowledged
- **Receipt Confirmation**: Confirm receipt of directed documents
- **Limited View**: Access documents related to their department

### CEO
- **Document Review**: Review documents requiring CEO attention
- **Direction Approval**: Provide directions on sensitive documents
- **Strategic Oversight**: Monitor critical correspondence
- **Limited Access**: Focus on documents requiring CEO involvement

### CXO
- **Department Documents**: Access documents directed to their office
- **Action Required**: Process and respond to assigned documents
- **Status Updates**: Update document progress and responses
- **Limited Scope**: Access only documents relevant to their department

---

## Getting Started

### System Login
1. Open your web browser and navigate to the EEU Correspondence Registry
2. Enter your username and password
3. The system loads in **Amharic by default**; you can switch to English from the language toggle if needed
4. Click "Login" to access the system

### Dashboard Overview
After logging in, you'll see the main dashboard with:
- **Navigation Menu**: Access to different system modules
- **Quick Actions**: Common tasks like creating new documents
- **Recent Documents**: Latest documents relevant to your role
- **Status Summary**: Overview of document statuses
- **Language Toggle**: Switch between English and Amharic

### First-Time Setup
1. **Profile Verification**: Ensure your department and role are correct
2. **Password Change**: Change your default password if required
3. **Language Preference**: Set your preferred language
4. **Notification Settings**: Configure email notifications if available

---

## Document Management

### Creating New Documents

#### Step 1: Access Document Creation
1. Click "Documents" in the navigation menu
2. Click "New Document" button
3. Select the appropriate document type

#### Step 2: Fill Document Information
- **Reference Number**: Unique document identifier
- **Document Type**: Select INCOMING, OUTGOING, or MEMO
- **Source**: Choose EXTERNAL or INTERNAL based on origin
- **Date Fields**: Enter relevant dates (received, written, memo date)
- **Subject**: Brief descriptive title
- **Summary**: Detailed description of the document content

#### Step 3: Add Office Information
- **From/To**: Specify sending and receiving offices
- **CC Offices**: Add offices that should receive copies
- **CC External Names (Optional)**: For external outgoing letters, you can type additional external company/agency names to be CC’d
- **Directed Offices**: Specify offices for action required

#### Step 4: Attach Files
1. Click "Add Attachment"
2. Select files from your computer
3. Add descriptive names if needed
4. Upload supporting documents

#### Step 5: Review and Submit
1. Review all entered information
2. Ensure required fields are completed
3. Click "Save" to register the document
4. Note the generated reference number

### Editing Documents
1. Navigate to the document details page
2. Click "Edit" if you have permission
3. Modify the required fields
4. Add notes explaining changes
5. Save the updates

### Deleting Documents
- **Deletion Restrictions**: Documents cannot be deleted once registered
- **Correction Process**: Use the edit function to correct errors
- **Audit Trail**: All changes are logged for accountability

---

## Document Scenarios

The system handles 14 different document scenarios based on type, source, and routing:

### Scenario 1: Incoming External Letter to CEO
- **Description**: External letters addressed to the CEO
- **Process**: CEO Secretary registers → CEO direction → Dispatch to CxO
- **Key Features**: Requires CEO direction before dispatch

### Scenario 2: Incoming Internal Letter to CEO
- **Description**: Internal letters from departments to CEO
- **Process**: CEO Secretary registers → CEO direction → Dispatch to CxO
- **Key Features**: Similar to Scenario 1 but internal source

### Scenario 3: Outgoing External Letter from CEO
- **Description**: CEO office sending letters to external entities
- **Process**: CEO Secretary creates → Optional CC to CxO offices → No receipt required
- **Key Features**: Can CC multiple CxO offices; CC’d CxO offices can mark the document as **Seen**

### Scenario 4: Outgoing Internal Letter from CEO
- **Description**: CEO office sending internal directives
- **Process**: CEO Secretary creates → Direct dispatch to CxO offices
- **Key Features**: Requires acknowledgment from CxO offices

### Scenario 5: Incoming Memo from CxO to CEO
- **Description**: CxO offices sending memos to CEO
- **Process**: CxO Secretary registers → CEO Secretary can forward to other CxO
- **Key Features**: Supports forwarding to multiple CxO offices

If the CEO Secretary forwards the memo to one or more CxO offices, the memo will include a **Dispatch** step before those offices can mark it as **Received**.

### Scenario 6: Outgoing Memo from CEO to CxO
- **Description**: CEO sending memos to CxO offices
- **Process**: CEO Secretary creates → Dispatch to all CxO offices
- **Key Features**: Standard memo distribution

### Scenario 7: Incoming External Letter to CxO
- **Description**: External letters addressed to specific CxO offices
- **Process**: CxO Secretary registers → Direct processing
- **Key Features**: Department-specific handling

### Scenario 8: Incoming Internal Letter to CxO
- **Description**: Internal letters to CxO offices
- **Process**: CxO Secretary registers → Forward to CEO if required
- **Key Features**: Can be escalated to CEO level

### Scenario 9: Outgoing External Letter from CxO
- **Description**: CxO offices sending external correspondence
- **Process**: CxO Secretary creates → CC to CEO and other CxO offices
- **Key Features**: Includes external CC names option; CC’d CxO offices can mark the document as **Seen**

### Scenario 10: Outgoing Internal Letter from CxO to CEO
- **Description**: CxO offices sending internal letters to CEO
- **Process**: CxO Secretary creates → Direct to CEO
- **Key Features**: Direct CEO communication

### Scenario 11: Outgoing Internal Letter from CxO to CxO
- **Description**: Inter-CxO office correspondence
- **Process**: CxO Secretary creates → Direct dispatch to target CxO
- **Key Features**: Direct office-to-office communication

### Scenario 12: Internal Memo from CxO to CxO
- **Description**: Memos between CxO offices
- **Process**: CxO Secretary creates → Direct dispatch
- **Key Features**: Memo-style inter-office communication

### Scenario 13: Internal Memo from CxO to CEO
- **Description**: CxO memos addressed to CEO
- **Process**: CxO Secretary creates → Direct to CEO
- **Key Features**: Direct memo communication

### Scenario 14: Internal Letter from CxO to CEO with Direction
- **Description**: CxO letters requiring CEO direction
- **Process**: CxO Secretary creates → CEO adds direction → Dispatch
- **Key Features**: CEO direction step included

---

## Workflows and Status Transitions

### Document Status Types

#### REGISTERED
- **Definition**: Document has been successfully registered in the system
- **Next Steps**: CEO direction (if required) or direct dispatch
- **Responsible Role**: Registering secretary

#### DIRECTED
- **Definition**: CEO has provided direction on the document
- **Next Steps**: Dispatch to designated offices
- **Responsible Role**: CEO Secretary

#### DISPATCHED
- **Definition**: Document has been sent to target offices
- **Next Steps**: Receipt confirmation by receiving offices
- **Responsible Role**: Dispatching secretary

#### RECEIVED
- **Definition**: Target office has confirmed receipt
- **Next Steps**: Processing and response
- **Responsible Role**: Receiving office secretary

#### IN_PROGRESS
- **Definition**: Document is being actively processed
- **Next Steps**: Response preparation or action completion
- **Responsible Role**: Assigned office

#### RESPONDED
- **Definition**: Response has been prepared and sent
- **Next Steps**: Document closure
- **Responsible Role**: Processing office

#### CLOSED
- **Definition**: Document lifecycle is complete
- **Next Steps**: Archival and reference
- **Responsible Role**: System or administrator

### Status Transition Rules

#### From REGISTERED
- **To DIRECTED**: When CEO provides direction (Scenarios 1, 2, 14)
- **To DISPATCHED**: Direct dispatch scenarios (4, 6, 8, 11, 12)
- **To RECEIVED**: Scenarios without dispatch requirement (3, 9)

#### From DIRECTED
- **To DISPATCHED**: After CEO direction is added
- **To RECEIVED**: Direct receipt by CEO office

#### From DISPATCHED
- **To RECEIVED**: When receiving office confirms receipt

#### From RECEIVED
- **To IN_PROGRESS**: When processing begins
- **To CLOSED**: Direct closure if no action needed

#### From IN_PROGRESS
- **To RESPONDED**: When response is prepared
- **To CLOSED**: If action is completed

#### From RESPONDED
- **To CLOSED**: Final document closure

---

## Search and Filtering

### Basic Search
1. **Quick Search**: Use the search bar on the documents page
2. **Search Fields**: Reference number, subject, sender/receiver names
3. **Results**: Instant filtering as you type

### Advanced Search
1. **Access Advanced Search**: Click "Advanced Search" button
2. **Filter Options**:
   - Document type (INCOMING/OUTGOING/MEMO)
   - Source (EXTERNAL/INTERNAL)
   - Status (all status types)
   - Date range (written, received, memo dates)
   - Department/Office filters
   - Priority levels
   - Confidentiality levels

### Filter Combinations
- **Multiple Criteria**: Combine different filters for precise results
- **Date Range**: Filter by specific date periods
- **Office Filters**: Filter by originating, receiving, or CC offices
- **Status Workflow**: Track documents at specific workflow stages

### Direction Column (Incoming vs Outgoing)
On the **Documents** page, the table includes a **Direction** column. This is computed from the viewer’s perspective:
- **Outgoing** for the secretary who created/sent the letter or memo
- **Incoming** for the secretary offices that receive it (Directed offices) or are CC’d

This helps the same document appear correctly for different offices.

### Saved Searches
1. **Create Saved Search**: After setting filters, click "Save Search"
2. **Name Your Search**: Give it a descriptive name
3. **Quick Access**: Saved searches appear in your dashboard
4. **Modify/Delete**: Edit or remove saved searches as needed

### Export Results
1. **Select Export Format**: Choose Excel, PDF, or CSV
2. **Choose Columns**: Select which data to include
3. **Download File**: Export filtered results for reporting

---

## Attachments and File Management

### Supported File Types
- **Documents**: PDF, DOC, DOCX, TXT
- **Images**: JPG, JPEG, PNG, GIF, BMP
- **Spreadsheets**: XLS, XLSX, CSV
- **Presentations**: PPT, PPTX
- **Other**: ZIP files for multiple documents

### Upload Process
1. **Select Files**: Click "Add Attachment" button
2. **Choose Files**: Browse and select files from your computer
3. **File Validation**: System checks file type and size
4. **Upload Progress**: Visual indicator shows upload status
5. **Completion**: Files appear in the attachments list

### File Size Limits
- **Single File**: Maximum 10MB per file
- **Total Attachments**: Maximum 50MB per document
- **Recommended**: Use PDF for documents to ensure compatibility

### Attachment Management
- **View Attachments**: Click file names to download/view
- **Add More**: Additional files can be added during editing
- **Delete Attachments**: Remove files if needed (with proper permissions)
- **Version Control**: New versions can be uploaded as needed

### Security Considerations
- **Access Control**: Only authorized users can view attachments
- **Virus Scanning**: Files are scanned during upload
- **Audit Trail**: All attachment activities are logged
- **Encryption**: Files are stored securely on the server

---

## Reporting and Analytics

### Available Reports

#### Document Volume Reports
- **Time Period**: Daily, weekly, monthly, or custom ranges
- **Document Types**: Breakdown by INCOMING/OUTGOING/MEMO
- **Source Analysis**: External vs Internal document ratios
- **Department Statistics**: Documents per department

#### Workflow Performance Reports
- **Processing Times**: Average time per status transition
- **Bottleneck Analysis**: Identify delays in the workflow
- **Response Times**: Track how quickly documents are processed
- **Completion Rates**: Percentage of documents completed on time

#### User Activity Reports
- **Registration Statistics**: Documents registered by each user
- **Action Summary**: Actions taken by different roles
- **Login Activity**: User access patterns and frequency
- **Department Performance**: Comparative analysis

### Generating Reports
1. **Access Reports**: Click "Reports" in the navigation menu
2. **Select Report Type**: Choose from available report templates
3. **Set Parameters**: Define date ranges and filters
4. **Generate Report**: Click "Generate" to create the report
5. **View/Export**: View online or download in various formats

### Custom Reports
1. **Create Custom Report**: Use the report builder tool
2. **Select Data Fields**: Choose which data to include
3. **Set Filters**: Define specific criteria
4. **Save Template**: Save for future use
5. **Schedule Reports**: Set up automatic report generation

### Dashboard Analytics
- **Real-time Metrics**: Live statistics on the dashboard
- **Visual Charts**: Graphical representation of data
- **Trend Analysis**: Track patterns over time
- **KPI Monitoring**: Key performance indicators

---

## System Administration

### User Management

#### Creating New Users
1. **Access User Management**: Navigate to "Users" section
2. **Add New User**: Click "Create User" button
3. **Enter User Details**:
   - Username and password
   - Full name and contact information
   - Department assignment
   - Role selection
4. **Set Permissions**: Configure access levels
5. **Save Account**: Create the user account

#### Managing User Accounts
- **Edit Information**: Update user details and permissions
- **Reset Password**: Help users with password issues
- **Deactivate Accounts**: Disable access for departing employees
- **Role Changes**: Modify user roles as needed
- **Department Transfer**: Move users between departments

### Department Management
1. **Department Structure**: Create and modify organizational hierarchy
2. **Office Details**: Set up CxO offices and departments
3. **Contact Information**: Maintain current contact details
4. **Reporting Structure**: Define reporting relationships

### System Configuration
- **Language Settings**: Configure default language options
- **Email Notifications**: Set up automated email alerts
- **Backup Schedule**: Configure automatic data backups
- **Security Settings**: Manage password policies and access rules

### Audit and Monitoring
- **Activity Logs**: Review all system activities
- **Access Logs**: Monitor user login patterns
- **Change History**: Track modifications to documents
- **System Performance**: Monitor server performance metrics

---

## Troubleshooting

### Common Issues and Solutions

#### Login Problems
- **Issue**: Cannot log in with correct credentials
- **Solution**: Check username spelling, reset password if needed
- **Contact**: System administrator for account issues

#### Document Creation Errors
- **Issue**: Required field validation errors
- **Solution**: Complete all mandatory fields marked with red asterisk
- **Check**: Ensure date formats are correct

#### File Upload Issues
- **Issue**: File upload fails
- **Solution**: Check file size, ensure supported format, try again
- **Alternative**: Compress large files or split into multiple uploads

#### Search Not Working
- **Issue**: Search returns no results
- **Solution**: Check spelling, try broader search terms, clear filters
- **Advanced**: Use advanced search with specific criteria

#### Status Update Problems
- **Issue**: Cannot change document status
- **Solution**: Verify you have appropriate permissions, check workflow rules
- **Contact**: Document owner or system administrator

### Performance Issues
- **Slow Loading**: Check internet connection, clear browser cache
- **Search Timeout**: Reduce search criteria, try during off-peak hours
- **Attachment Issues**: Check file size, try uploading individually

### Browser Compatibility
- **Recommended Browsers**: Chrome, Firefox, Safari, Edge
- **JavaScript Required**: Ensure JavaScript is enabled
- **Cookies Required**: Accept cookies for proper functionality
- **Pop-up Blockers**: Allow pop-ups for this site

### Getting Help
1. **User Guide**: Refer to this manual for detailed instructions
2. **Online Help**: Click the Help icon in the system
3. **Contact Support**: Email support@eeu.gov.et for technical issues
4. **System Administrator**: Contact your internal IT support

---

## Glossary

### Terms and Definitions

**CC (Carbon Copy)**
- Sending copies of documents to additional offices for information purposes

**CxO (Chief Officer)**
- Collective term for Chief Executive Officer, Chief Financial Officer, Chief Operating Officer, etc.

**Dispatch**
- The process of sending documents to their intended recipients

**Memo (Memorandum)**
- Internal communication document for inter-office correspondence

**Reference Number**
- Unique identifier assigned to each document for tracking purposes

**Scenario**
- Specific workflow path determined by document type, source, and routing

**Workflow**
- The sequence of steps a document goes through from creation to closure

### Acronyms

- **EEU**: Ethiopian Electric Utility
- **CEO**: Chief Executive Officer
- **CFO**: Chief Financial Officer
- **COO**: Chief Operating Officer
- **CCO**: Chief Compliance Officer
- **IT**: Information Technology

### Role Definitions

**SUPER_ADMIN**
- System administrator with full access to all features

**CEO_SECRETARY**
- Secretary managing CEO office correspondence

**CXO_SECRETARY**
- Secretary managing a specific CxO office correspondence

**CEO**
- Chief Executive Officer

**CXO**
- Any Chief Officer position (CEO, CFO, COO, etc.)

---

## Contact Information

### Technical Support
- **Email**: support@eeu.gov.et
- **Phone**: +251-11-123-4567
- **Hours**: Monday-Friday, 8:30 AM - 5:30 PM

### System Administration
- **Email**: it.admin@eeu.gov.et
- **Phone**: +251-11-123-4568
- **Hours**: Monday-Friday, 8:00 AM - 6:00 PM

### Training and Documentation
- **Email**: training@eeu.gov.et
- **Phone**: +251-11-123-4569
- **Hours**: Monday-Friday, 9:00 AM - 5:00 PM

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-14 | Initial comprehensive user manual | System Team |
| 1.1 | 2026-02-14 | Added scenario details and workflows | System Team |

---

*This user manual is a living document and will be updated as the system evolves. Users are encouraged to provide feedback and suggestions for improvement.*
