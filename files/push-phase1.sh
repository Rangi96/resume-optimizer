#!/bin/bash

# Phase 1: Push Configuration Files to GitHub
# Usage: bash push-phase1.sh

set -e

echo "🚀 Starting Phase 1 GitHub Push..."

# Check if git is initialized
if [ ! -d .git ]; then
    echo "❌ Error: Not a git repository. Initialize with: git init"
    exit 1
fi

# Check git status
echo "📋 Checking git status..."
git status

# Add all Phase 1 files
echo "➕ Adding Phase 1 configuration files..."
git add vercel.json
git add package.json
git add vite.config.js
git add tailwind.config.js
git add postcss.config.js
git add .env.example
git add .gitignore
git add PHASE_1_SETUP.md
git add PUSH_CHECKLIST.md

# Commit with detailed message
echo "💾 Committing files..."
git commit -m "Phase 1: Environment & Configuration Setup

- Add vercel.json with security headers and build configuration
- Add package.json with dependencies (React, Vite, Tailwind)
- Add vite.config.js with code splitting and minification
- Add tailwind.config.js and postcss.config.js for CSS pipeline
- Add .env.example template for environment variables
- Add .gitignore to protect sensitive files
- Add PHASE_1_SETUP.md with deployment guide
- Add PUSH_CHECKLIST.md with push instructions

Configuration enables:
- Vercel auto-deployment with Next.js-like setup
- Security headers (no sniffing, no clickjacking, HSTS)
- Cache optimization (1hr static, no-cache API)
- Code splitting for optimal bundle size
- Environment variable management"

# Push to main
echo "🚀 Pushing to GitHub main branch..."
git push origin main

# Success message
echo ""
echo "✅ SUCCESS! Phase 1 files pushed to GitHub"
echo ""
echo "Next steps:"
echo "1. Check Vercel Dashboard: https://vercel.com/dashboard"
echo "2. Wait for auto-deployment (1-2 minutes)"
echo "3. Add environment variables in Vercel Settings"
echo "4. Verify site loads at your domain"
echo ""
