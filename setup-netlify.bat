@echo off
REM TechNexus Netlify Deployment Setup Script

echo.
echo 🚀 TechNexus Netlify Deployment Setup
echo ======================================
echo.

REM Check if Netlify CLI is installed
where netlify >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo 📦 Installing Netlify CLI...
    npm install -g netlify-cli
)

echo ✅ Installing dependencies...
cd backend
call npm install
cd ../frontend
call npm install
cd ..

echo.
echo 🔨 Building frontend...
cd frontend
call npm run build
cd ..

echo.
echo ✅ Deployment setup complete!
echo.
echo 📋 Next steps:
echo 1. Create a Netlify account at https://netlify.com
echo 2. Run: netlify login
echo 3. Run: netlify deploy --prod
echo 4. Configure environment variables in Netlify dashboard:
echo    - VITE_API_URL (your backend URL)
echo    - VITE_SUPABASE_URL
echo    - VITE_SUPABASE_ANON_KEY
echo.
echo 📚 For detailed instructions, see NETLIFY_DEPLOYMENT.md
