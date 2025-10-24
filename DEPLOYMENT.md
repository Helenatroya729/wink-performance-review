# WINK Performance Review System - Deployment Guide

## System Requirements

### Required Software
- Node.js 18+ and npm
- PostgreSQL 17
- Git

### System Specifications
- OS: Windows 10/11 or Linux
- RAM: 4GB minimum (8GB recommended)
- Disk: 2GB free space

## Quick Installation

### 1. Clone Repository

```bash
git clone https://github.com/Helenatroya729/wink-performance-review.git
cd wink-performance-review
```

### 2. Install PostgreSQL 17

Download and install from: https://www.postgresql.org/download/

During installation:
- Port: 5433 (recommended) or 5432
- Password: remember your password
- Locale: Default

### 3. Create Database

```bash
psql -U postgres -p 5433
CREATE DATABASE wink_performance_review;
\q
```

### 4. Restore Database from Backup

**Option A: Using PowerShell Script (Windows)**

```powershell
.\RESTORE_DATABASE.ps1
```

**Option B: Using psql Command**

```bash
psql -U postgres -p 5433 -d wink_performance_review -f database_backups/wink_db_backup_2025-10-24_17-49-38.sql
```

### 5. Install Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd ../client
npm install
```

### 6. Configure Environment

**Backend Configuration** (`server/.env`):
```
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=wink_performance_review
JWT_SECRET=your-secret-key-here
PORT=5000
```

**Frontend Configuration** (`client/.env`):
```
REACT_APP_API_URL=http://localhost:5000/api
```

### 7. Start Application

**Option A: Using Start Script (Windows)**

```powershell
.\START_FULL.ps1
```

**Option B: Manual Start**

Terminal 1 - Backend:
```bash
cd server
node server-new.js
```

Terminal 2 - Frontend:
```bash
cd client
npm start
```

### 8. Access Application

Open browser: http://localhost:3000

## Default Users

All users have password: **123456**

### Administrator
- Email: admin@wink.ru
- Role: System Administrator

### HR Manager
- Email: hr@wink.ru
- Role: HR Manager

### Managers
- Email: manager1@wink.ru
- Email: manager2@wink.ru
- Role: Team Lead / Manager

### Employees
- Email: emp1@wink.ru
- Email: emp2@wink.ru
- Email: emp3@wink.ru
- Email: emp4@wink.ru
- Email: emp5@wink.ru
- Role: Employee

## Database Schema

The system includes 30 tables with complete data:

Core Tables:
- users (11 users)
- review_cycles (evaluation periods)
- employee_goals (employee objectives)
- self_assessments (self-evaluations)
- manager_evaluations (manager assessments)
- peer_feedbacks (colleague reviews)
- potential_assessments (potential evaluations)
- notifications (system notifications)

## Features

### For Employees
- Create and manage goals (up to 5 per period)
- Complete self-assessment
- Request peer feedback
- View evaluation results
- Track personal rating

### For Managers
- Review team goals (approve/reject)
- Evaluate employee performance
- Assess employee potential
- View team analytics
- Access 9-box matrix

### For HR
- View all employee evaluations
- Access analytics dashboard
- Manage evaluation cycles
- Generate reports
- 9-box talent matrix

## Troubleshooting

### Cannot Connect to Database

Check PostgreSQL is running:
```bash
pg_isready -h localhost -p 5433
```

Verify credentials in `server/.env`

### Port Already in Use

Frontend (3000):
```bash
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000
```

Backend (5000):
```bash
# Windows
netstat -ano | findstr :5000

# Linux/Mac
lsof -i :5000
```

### Frontend Build Errors

Clear cache and reinstall:
```bash
cd client
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Errors

1. Check PostgreSQL service is running
2. Verify port in .env matches PostgreSQL port
3. Confirm database exists: `psql -U postgres -l`
4. Test connection: `psql -U postgres -p 5433 -d wink_performance_review`

## Backup and Restore

### Create Backup

```powershell
.\EXPORT_DATABASE.ps1
```

Backup will be saved to: `database_backups/wink_db_backup_[timestamp].sql`

### Restore from Backup

```powershell
.\RESTORE_DATABASE.ps1
```

Select backup file when prompted.

## Production Deployment

### Environment Variables

Set production values:
```
NODE_ENV=production
DB_HOST=your-production-host
DB_PORT=5432
JWT_SECRET=strong-random-secret
REACT_APP_API_URL=https://your-domain.com/api
```

### Build Frontend

```bash
cd client
npm run build
```

Files will be in `client/build/` directory.

### Run Backend

```bash
cd server
NODE_ENV=production node server-new.js
```

Consider using PM2 for process management:
```bash
npm install -g pm2
pm2 start server-new.js --name wink-api
pm2 startup
pm2 save
```

## Security Notes

1. Change default password (123456) for all users
2. Use strong JWT_SECRET in production
3. Enable HTTPS in production
4. Configure PostgreSQL authentication properly
5. Set up firewall rules
6. Regular database backups

## Support

For issues or questions:
- Check logs in console
- Review database connection
- Verify all dependencies installed
- Ensure PostgreSQL is running

## License

Proprietary - WINK Performance Review System
