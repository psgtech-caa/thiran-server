@echo off
echo ======================================
echo Thiran Backend - Database Setup
echo ======================================
echo.

echo This script will help you set up the database for Thiran Backend
echo.

echo Step 1: Make sure PostgreSQL is installed and running
echo.
pause

echo.
echo Step 2: Creating database and user...
echo.
echo Please enter your PostgreSQL superuser password when prompted
echo.

docker exec -it postgres psql -U postgres -c "CREATE DATABASE thiran_db;"
docker exec -it postgres psql -U postgres -c "CREATE USER thiran_user WITH PASSWORD 'thiran2026';"
docker exec -it postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE thiran_db TO thiran_user;"
docker exec -it postgres psql -U postgres -d thiran_db -c "GRANT ALL ON SCHEMA public TO thiran_user;"

echo.
echo Step 3: Running migrations...
echo.
node src\database\migrate.js

echo.
echo Step 4: Seeding sample data...
echo.
node src\database\seed.js

echo.
echo ======================================
echo Database setup complete!
echo ======================================
echo.
echo Next steps:
echo 1. Update .env file with your email credentials
echo 2. Run: npm run dev
echo 3. Test API at http://localhost:5000/health
echo.
pause
