# Lumina

Private photo gallery. Browse GCS folders and photos through a clean web UI — secured by Google OAuth, served via signed URLs.

## Stack

- **Next.js 14** (App Router, TypeScript, Tailwind CSS)
- **NextAuth v5** — Google OAuth, single-email whitelist
- **Google Cloud Storage** — private bucket, signed URLs (1hr expiry)
- **Cloud Run** — scale-to-zero hosting (~$2–5/month)

## Features

- Folder/subfolder browsing with breadcrumb navigation
- Lazy-loaded image thumbnails
- Lightbox: full-screen view, scroll-to-zoom, drag-to-pan, ←→ keyboard nav, preloads adjacent images
- Zero public GCS access — every image served through a time-limited signed URL

## Setup

**1. Clone and install**
```bash
git clone ...
cd lumina
npm install
```

**2. Configure environment**
```bash
cp .env.local.example .env.local
# fill in all values
```

Required env vars:

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_URL` | App URL (use `http://localhost:3000` locally) |
| `NEXTAUTH_SECRET` | Random secret: `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 client secret |
| `ALLOWED_EMAIL` | Only this Google account can log in |
| `GCS_BUCKET_NAME` | GCS bucket name |
| `GCS_SERVICE_ACCOUNT_JSON` | Full service account JSON (single line) |

**3. Google OAuth setup**

In [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials:
- Create OAuth 2.0 Client ID (Web application)
- Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

**4. GCS Service Account**

Create a service account with role **Storage Object Viewer** on the bucket.
Download JSON key → paste the entire content as `GCS_SERVICE_ACCOUNT_JSON`.

**5. Run locally**
```bash
npm run dev
# open http://localhost:3000
```

## Deploy to Cloud Run

```bash
# Build
gcloud builds submit --tag gcr.io/PROJECT_ID/lumina

# Deploy
gcloud run deploy lumina \
  --image gcr.io/PROJECT_ID/lumina \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars "NEXTAUTH_URL=https://YOUR_URL,..."

# Add Cloud Run URL as redirect URI in Google OAuth console
# https://YOUR_URL/api/auth/callback/google
```
