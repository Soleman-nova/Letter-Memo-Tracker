# Deployment Guide - EEU Centralized Correspondence & Payment Registry

**Version:** 2.0  
**Last Updated:** April 2026

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Database Setup](#database-setup)
6. [IIS Configuration](#iis-configuration)
7. [Security Hardening](#security-hardening)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Backup & Recovery](#backup--recovery)
10. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Hardware Requirements

**Minimum:**
- CPU: 4 cores @ 2.5 GHz
- RAM: 8 GB
- Storage: 100 GB SSD
- Network: 100 Mbps LAN

**Recommended:**
- CPU: 8 cores @ 3.0 GHz
- RAM: 16 GB
- Storage: 250 GB SSD (RAID 1 for redundancy)
- Network: 1 Gbps LAN

### Software Requirements

**Operating System:**
- Windows Server 2016 or later
- Windows 10/11 Pro (for testing)

**Required Software:**
- Python 3.10 or later
- PostgreSQL 13 or later
- Node.js 18 or later
- IIS 10 or later with:
  - Application Request Routing (ARR)
  - URL Rewrite Module

**Optional:**
- Git for version control
- PostgreSQL pgAdmin for database management

---

## Pre-Deployment Checklist

### Before You Begin

- [ ] Verify hardware meets minimum requirements
- [ ] Install all required software
- [ ] Obtain SSL certificate (if using HTTPS)
- [ ] Create PostgreSQL database and user
- [ ] Configure firewall rules
- [ ] Prepare backup storage location
- [ ] Document all passwords securely
- [ ] Test network connectivity
- [ ] Schedule maintenance window
- [ ] Notify users of deployment

---

## Backend Deployment

### Step 1: Prepare Environment

```powershell
# Create application directory
mkdir C:\EEU\backend
cd C:\EEU\backend

# Copy application files
# (Transfer files via network, USB, or Git)

# Create virtual environment
python -m venv venv
.\venv\Scripts\activate
```

### Step 2: Install Dependencies

```powershell
# Upgrade pip
python -m pip install --upgrade pip

# Install requirements
pip install -r requirements.txt

# Verify installation
pip list
```

### Step 3: Configure Environment Variables

Create `.env` file in `backend/` directory:

```env
# Django Settings
SECRET_KEY=your-very-long-random-secret-key-change-this-in-production
DEBUG=False
ALLOWED_HOSTS=your-server-ip,your-domain.com,localhost,127.0.0.1

# Database Configuration
DB_NAME=eeu_tracker
DB_USER=eeu_admin
DB_PASSWORD=your-secure-database-password
DB_HOST=localhost
DB_PORT=5432

# CORS and CSRF
CORS_ALLOWED_ORIGINS=http://your-server-ip,http://your-domain.com
CSRF_TRUSTED_ORIGINS=http://your-server-ip,http://your-domain.com

# Media Files
MEDIA_ROOT=C:\EEU\media

# Server Configuration
HOST=0.0.0.0
PORT=8000

# Security (if using HTTPS)
SECURE_SSL_REDIRECT=False
```

**Important:** Generate a strong SECRET_KEY:
```powershell
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### Step 4: Database Migration

```powershell
# Run migrations
python manage.py migrate

# Seed departments
python manage.py seed_departments

# Create superuser
python manage.py createsuperuser
# Follow prompts to create admin account
```

### Step 5: Collect Static Files

```powershell
# Collect all static files
python manage.py collectstatic --noinput

# Verify static files in backend/staticfiles/
```

### Step 6: Test Backend Server

```powershell
# Test with development server
python manage.py runserver 0.0.0.0:8000

# Access http://localhost:8000/admin to verify
# Press Ctrl+C to stop
```

### Step 7: Configure Production Server

**Option A: Using Waitress (Recommended for Windows)**

```powershell
# Start production server
python run_production.py

# Server runs on http://0.0.0.0:8000
```

**Option B: Using Windows Service**

Create a Windows Service using NSSM (Non-Sucking Service Manager):

```powershell
# Download NSSM from nssm.cc
# Install service
nssm install EEU-Backend "C:\EEU\backend\venv\Scripts\python.exe" "C:\EEU\backend\run_production.py"

# Set working directory
nssm set EEU-Backend AppDirectory "C:\EEU\backend"

# Start service
nssm start EEU-Backend

# Verify service status
nssm status EEU-Backend
```

### Step 8: Verify Backend

```powershell
# Test API endpoint
curl http://localhost:8000/api/core/departments/

# Should return 401 Unauthorized (authentication required)
# This confirms the API is running
```

---

## Frontend Deployment

### Step 1: Prepare Build Environment

```powershell
# Create frontend directory
mkdir C:\EEU\frontend
cd C:\EEU\frontend

# Copy source files
# Install dependencies
npm install
```

### Step 2: Configure Production Environment

Create `.env.production` file:

```env
# Leave empty if frontend and backend on same domain
VITE_API_BASE_URL=

# Or specify backend URL if different domain
# VITE_API_BASE_URL=http://backend-server:8000
```

### Step 3: Build Frontend

```powershell
# Build for production
npm run build

# Output will be in frontend/dist/
# Verify build completed successfully
dir dist
```

### Step 4: Deploy to IIS

The `dist/` folder will be served by IIS (configured in next section).

---

## Database Setup

### PostgreSQL Installation

1. **Download PostgreSQL** from postgresql.org
2. **Run installer** and follow wizard
3. **Set password** for postgres user
4. **Note port** (default: 5432)

### Create Database and User

```sql
-- Connect to PostgreSQL as postgres user
psql -U postgres

-- Create database
CREATE DATABASE eeu_tracker;

-- Create user
CREATE USER eeu_admin WITH PASSWORD 'your-secure-password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE eeu_tracker TO eeu_admin;

-- Connect to database
\c eeu_tracker

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO eeu_admin;

-- Exit
\q
```

### Configure PostgreSQL for Network Access

Edit `postgresql.conf`:
```conf
listen_addresses = 'localhost'  # or '*' for network access
```

Edit `pg_hba.conf`:
```conf
# Allow local connections
host    eeu_tracker    eeu_admin    127.0.0.1/32    md5
```

Restart PostgreSQL service.

---

## IIS Configuration

### Step 1: Install IIS Components

**Via Server Manager:**
1. Add Roles and Features
2. Select Web Server (IIS)
3. Add features:
   - Application Request Routing (ARR)
   - URL Rewrite Module
   - WebSocket Protocol (optional)

**Via PowerShell:**
```powershell
Install-WindowsFeature -name Web-Server -IncludeManagementTools
Install-WindowsFeature -name Web-App-Dev
```

### Step 2: Create IIS Site

1. Open IIS Manager
2. Right-click Sites → Add Website
3. Configure:
   - **Site name:** EEU-Tracker
   - **Physical path:** `C:\EEU\frontend\dist`
   - **Binding:** HTTP, Port 80 (or 443 for HTTPS)
   - **Host name:** (leave empty or specify domain)

### Step 3: Configure URL Rewrite Rules

**Rule 1: API Proxy**

```xml
<rule name="API Proxy" stopProcessing="true">
  <match url="^api/(.*)" />
  <action type="Rewrite" url="http://127.0.0.1:8000/api/{R:1}" />
</rule>
```

**Rule 2: Admin Proxy**

```xml
<rule name="Admin Proxy" stopProcessing="true">
  <match url="^admin/(.*)" />
  <action type="Rewrite" url="http://127.0.0.1:8000/admin/{R:1}" />
</rule>
```

**Rule 3: Media Proxy**

```xml
<rule name="Media Proxy" stopProcessing="true">
  <match url="^media/(.*)" />
  <action type="Rewrite" url="http://127.0.0.1:8000/media/{R:1}" />
</rule>
```

**Rule 4: Static Files Proxy**

```xml
<rule name="Static Proxy" stopProcessing="true">
  <match url="^static/(.*)" />
  <action type="Rewrite" url="http://127.0.0.1:8000/static/{R:1}" />
</rule>
```

**Rule 5: SPA Fallback**

```xml
<rule name="SPA Fallback" stopProcessing="true">
  <match url=".*" />
  <conditions logicalGrouping="MatchAll">
    <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
    <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
    <add input="{REQUEST_URI}" pattern="^/(api|admin|media|static)" negate="true" />
  </conditions>
  <action type="Rewrite" url="/index.html" />
</rule>
```

### Step 4: Configure Request Limits

In IIS Manager → Request Filtering:
- **Maximum allowed content length:** 52428800 (50 MB)
- **Maximum URL length:** 4096
- **Maximum query string:** 2048

### Step 5: Enable ARR Proxy

1. Open IIS Manager
2. Select server node
3. Double-click Application Request Routing Cache
4. Click Server Proxy Settings
5. Check "Enable proxy"
6. Set timeout to 300 seconds
7. Apply changes

### Step 6: Configure Application Pool

1. Create new Application Pool: "EEU-AppPool"
2. Set .NET CLR version: "No Managed Code"
3. Set Pipeline mode: Integrated
4. Set Identity: ApplicationPoolIdentity
5. Advanced Settings:
   - Start Mode: AlwaysRunning
   - Idle Timeout: 0 (never timeout)
   - Recycling: Regular intervals (1740 minutes)

### Step 7: Set Permissions

```powershell
# Grant IIS_IUSRS read access to frontend
icacls "C:\EEU\frontend\dist" /grant "IIS_IUSRS:(OI)(CI)R" /T

# Grant IIS_IUSRS read/write access to media
icacls "C:\EEU\media" /grant "IIS_IUSRS:(OI)(CI)M" /T
```

---

## Security Hardening

### Backend Security

1. **Change SECRET_KEY** to a strong random value
2. **Set DEBUG=False** in production
3. **Configure ALLOWED_HOSTS** with specific domains
4. **Enable HTTPS** if available:
   ```env
   SECURE_SSL_REDIRECT=True
   SESSION_COOKIE_SECURE=True
   CSRF_COOKIE_SECURE=True
   ```
5. **Restrict CORS** to specific origins
6. **Set strong database password**
7. **Disable directory browsing** in IIS

### Database Security

1. **Use strong passwords** for database users
2. **Restrict network access** in pg_hba.conf
3. **Enable SSL connections** (optional)
4. **Regular backups** with encryption
5. **Limit user privileges** to minimum required

### Network Security

1. **Configure firewall** to allow only necessary ports:
   - Port 80/443 (HTTP/HTTPS)
   - Port 5432 (PostgreSQL - localhost only)
2. **Use VPN** for remote administration
3. **Enable Windows Firewall**
4. **Disable unnecessary services**

### File System Security

1. **Restrict permissions** on application directories
2. **Separate media storage** from application code
3. **Regular security updates** for all software
4. **Antivirus scanning** on media uploads

---

## Monitoring & Maintenance

### Application Monitoring

**Check Backend Status:**
```powershell
# Check if service is running
nssm status EEU-Backend

# View logs
Get-Content C:\EEU\backend\logs\django.log -Tail 50
```

**Check Frontend Status:**
```powershell
# Check IIS site status
Get-IISSite -Name "EEU-Tracker"

# Check application pool
Get-IISAppPool -Name "EEU-AppPool"
```

### Database Monitoring

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('eeu_tracker'));

-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'eeu_tracker';

-- Check table sizes
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Performance Monitoring

1. **Monitor CPU and RAM** usage via Task Manager
2. **Check disk space** regularly
3. **Review IIS logs** for errors
4. **Monitor response times** via browser dev tools
5. **Set up alerts** for critical issues

### Regular Maintenance Tasks

**Daily:**
- Check application logs for errors
- Verify backup completion
- Monitor disk space

**Weekly:**
- Review user activity logs
- Check for failed login attempts
- Update virus definitions

**Monthly:**
- Apply security patches
- Review and archive old documents
- Database maintenance (VACUUM, ANALYZE)
- Test backup restoration

**Quarterly:**
- Review user accounts and permissions
- Update documentation
- Performance optimization review
- Disaster recovery drill

---

## Backup & Recovery

### Database Backup

**Automated Daily Backup:**

Create PowerShell script `backup-database.ps1`:
```powershell
$date = Get-Date -Format "yyyy-MM-dd"
$backupPath = "C:\EEU\backups\db\eeu_tracker_$date.backup"

# Set PostgreSQL password
$env:PGPASSWORD = "your-database-password"

# Run backup
& "C:\Program Files\PostgreSQL\13\bin\pg_dump.exe" `
  -U eeu_admin `
  -h localhost `
  -F c `
  -b `
  -v `
  -f $backupPath `
  eeu_tracker

# Remove backups older than 30 days
Get-ChildItem "C:\EEU\backups\db" -Filter "*.backup" | 
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | 
  Remove-Item
```

**Schedule with Task Scheduler:**
```powershell
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
  -Argument "-File C:\EEU\scripts\backup-database.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -Action $action -Trigger $trigger `
  -TaskName "EEU Database Backup" -Description "Daily database backup"
```

### Media Files Backup

```powershell
# Backup media files
$date = Get-Date -Format "yyyy-MM-dd"
Compress-Archive -Path "C:\EEU\media" `
  -DestinationPath "C:\EEU\backups\media\media_$date.zip"
```

### Database Restoration

```powershell
# Stop backend service
nssm stop EEU-Backend

# Restore database
$env:PGPASSWORD = "your-database-password"
& "C:\Program Files\PostgreSQL\13\bin\pg_restore.exe" `
  -U eeu_admin `
  -h localhost `
  -d eeu_tracker `
  -c `
  -v `
  "C:\EEU\backups\db\eeu_tracker_2026-04-20.backup"

# Start backend service
nssm start EEU-Backend
```

### Disaster Recovery Plan

1. **Maintain offsite backups** (network drive, cloud storage)
2. **Document recovery procedures**
3. **Test restoration quarterly**
4. **Keep backup of configuration files**
5. **Maintain list of dependencies and versions**

---

## Troubleshooting

### Backend Issues

**Service Won't Start:**
```powershell
# Check service status
nssm status EEU-Backend

# View service logs
Get-EventLog -LogName Application -Source EEU-Backend -Newest 20

# Try manual start
cd C:\EEU\backend
.\venv\Scripts\activate
python run_production.py
```

**Database Connection Errors:**
- Verify PostgreSQL service is running
- Check database credentials in `.env`
- Test connection: `psql -U eeu_admin -d eeu_tracker -h localhost`
- Review `pg_hba.conf` for access rules

**Static Files Not Loading:**
```powershell
# Re-collect static files
python manage.py collectstatic --noinput --clear

# Check permissions
icacls "C:\EEU\backend\staticfiles"
```

### Frontend Issues

**Blank Page:**
- Check browser console for errors
- Verify `index.html` exists in dist folder
- Check IIS URL Rewrite rules
- Verify API base URL in `.env.production`

**API Calls Failing:**
- Check backend service is running
- Verify ARR proxy is enabled in IIS
- Check URL Rewrite rules for API proxy
- Review browser network tab for errors

**Authentication Issues:**
- Clear browser cache and cookies
- Check JWT token expiration settings
- Verify CORS configuration
- Check browser console for CORS errors

### Database Issues

**Slow Queries:**
```sql
-- Find slow queries
SELECT pid, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - query_start > interval '5 seconds';

-- Run VACUUM and ANALYZE
VACUUM ANALYZE;
```

**Database Full:**
```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('eeu_tracker'));

-- Find large tables
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

### IIS Issues

**502 Bad Gateway:**
- Backend service not running
- ARR proxy not configured
- Backend listening on wrong port

**413 Request Entity Too Large:**
- Increase request limits in IIS Request Filtering
- Check `maxAllowedContentLength` in web.config

**500 Internal Server Error:**
- Check IIS logs: `C:\inetpub\logs\LogFiles`
- Review URL Rewrite failed request tracing
- Verify file permissions

---

## Post-Deployment Checklist

- [ ] Backend service running and accessible
- [ ] Frontend loading correctly
- [ ] Database connections working
- [ ] User authentication functioning
- [ ] File uploads working
- [ ] All API endpoints responding
- [ ] Backups configured and tested
- [ ] Monitoring in place
- [ ] Documentation updated
- [ ] Users trained
- [ ] Support contacts documented

---

## Support Contacts

**Technical Support:**
- Email: it.admin@eeu.gov.et
- Phone: +251-11-123-4568

**Emergency Contact:**
- On-call IT: +251-91-234-5678

---

**Document Version:** 2.0  
**Last Updated:** April 2026  
**Next Review:** July 2026
