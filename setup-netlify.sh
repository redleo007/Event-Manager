#!/bin/bash

# TechNexus Netlify Deployment Setup Script

echo "🚀 TechNexus Netlify Deployment Setup"
echo "======================================"
echo ""

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "📦 Installing Netlify CLI..."
    npm install -g netlify-cli
fi

echo "✅ Installing dependencies..."
cd backend
npm install
cd ../frontend
npm install
cd ..

echo ""
echo "🔨 Building frontend..."
cd frontend
npm run build
cd ..

echo ""
echo "✅ Deployment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Create a Netlify account at https://netlify.com"
echo "2. Run: netlify login"
echo "3. Run: netlify deploy --prod"
echo "4. Configure environment variables in Netlify dashboard:"
echo "   - VITE_API_URL (your backend URL)"
echo "   - VITE_SUPABASE_URL"
echo "   - VITE_SUPABASE_ANON_KEY"
echo ""
echo "📚 For detailed instructions, see NETLIFY_DEPLOYMENT.md"
