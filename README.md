# Sydney Automation Co. — Job System (Vercel)

## Setup Steps

### 1. Push this folder to a GitHub repo
- Create a new private repo: `sydney-job-system`
- Push all files in this folder

### 2. Create new Vercel project
- vercel.com → Add New Project → Import the new repo
- Do NOT add it to your existing website project

### 3. Set the environment variable (IMPORTANT)
In Vercel → Your new project → Settings → Environment Variables:

  Name:  SITE_PASSWORD
  Value: Sydney@utoc0

This keeps your password out of your code files.

### 4. Deploy
Vercel auto-deploys on every git push. First deploy is automatic.

### 5. Update Supabase allowed URLs
In Supabase → Authentication → URL Configuration:
- Add your new Vercel URL to the allowed list
- e.g. https://sydney-job-system.vercel.app

## To Change Your Password Later
Vercel → Project → Settings → Environment Variables → Edit SITE_PASSWORD
No redeploy needed. Takes effect on next login.

## File Structure
  index.html     — your job system
  login.html     — login page
  middleware.js  — server-side auth check (runs before every request)
  api/auth.js    — validates password, sets secure cookie
  vercel.json    — vercel config
