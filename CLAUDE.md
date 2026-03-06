# Lumina — CLAUDE.md

Private photo gallery: Next.js 14 App Router + Google OAuth + GCS private bucket + Signed URLs + Cloud Run.

## Commands

```bash
npm run dev      # local dev server (http://localhost:3000)
npm run build    # production build (must pass before deploy)
npm start        # run production build locally
```

## Architecture

```
Browser → Cloudflare Worker (reverse proxy)
              └── Cloud Run asia-southeast3 (Next.js)
                      ├── NextAuth v5 (Google OAuth) — email whitelist via ALLOWED_EMAIL
                      ├── /api/browse?prefix=  → GCS listObjects (server-side, signed in)
                      └── /api/sign?key=       → GCS getSignedUrl (1hr) → browser fetches directly
```

Gallery pages are **server components** that call `listObjects()` directly (no fetch).
`ImageCard` + `FolderCard` are **client components** that fetch `/api/sign` lazily on mount.

## Key Files

| File | Purpose |
|------|---------|
| `lib/auth.ts` | NextAuth v5 config — Google provider + ALLOWED_EMAIL check + `trustHost: true` |
| `lib/gcs.ts` | GCS client — `listObjects(prefix)` + `getSignedUrl(key)` + `getFirstImageKey()` |
| `app/api/browse/route.ts` | Lists GCS folder contents (auth-gated) |
| `app/api/sign/route.ts` | Returns signed URL for a GCS key (auth-gated) |
| `app/gallery/page.tsx` | Root gallery (server component) |
| `app/gallery/[...path]/page.tsx` | Nested folder view — decodes URL params before passing to GCS |
| `app/login/page.tsx` | Google Sign-In button (server action calls `signIn`) |
| `components/GalleryGrid.tsx` | Mixed folder+image grid, manages Lightbox state |
| `components/FolderCard.tsx` | Shows first image in folder as cover (lazy signed URL fetch) |
| `components/ImageCard.tsx` | Lazy-fetches signed URL via /api/sign |
| `components/Lightbox.tsx` | Full-screen viewer: scroll zoom, drag pan, ←→/ESC keyboard nav, touch swipe, click half to nav, signed URL cache + preload |
| `components/Breadcrumb.tsx` | Home > folder > subfolder nav (encodes segments in href) |
| `Dockerfile` | Multi-stage build → `output: standalone` for Cloud Run |

## Environment Variables

Copy `.env.local.example` → `.env.local` and fill in:

```env
NEXTAUTH_URL=http://localhost:3000          # use custom domain URL in production
NEXTAUTH_SECRET=<openssl rand -base64 32>

GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

ALLOWED_EMAIL=your@gmail.com               # only this email can log in

GCS_BUCKET_NAME=your-bucket-name
GCS_SERVICE_ACCOUNT_JSON={"type":"service_account",...}  # full JSON, single line
```

## Deploy

### Cloud Run
```bash
gcloud run deploy lumina \
  --source . \
  --region asia-southeast3 \
  --platform managed \
  --allow-unauthenticated

# Set env vars (use env.yaml for GCS_SERVICE_ACCOUNT_JSON due to special characters)
gcloud run services update lumina \
  --region asia-southeast3 \
  --env-vars-file env.yaml
```

`env.yaml` format (do NOT commit — already in `.gitignore`):
```yaml
NEXTAUTH_URL: "https://lumina.zia16.com"
NEXTAUTH_SECRET: "..."
GOOGLE_CLIENT_ID: "..."
GOOGLE_CLIENT_SECRET: "..."
ALLOWED_EMAIL: "..."
GCS_BUCKET_NAME: "..."
GCS_SERVICE_ACCOUNT_JSON: '{"type":"service_account",...}'
```

### Custom Domain (via Cloudflare Worker)

asia-southeast3 does not support Cloud Run domain mappings — use a Cloudflare Worker as reverse proxy instead:

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const originalHost = url.hostname;
    url.hostname = "lumina-73050260514.asia-southeast3.run.app";
    const headers = new Headers(request.headers);
    headers.set("x-forwarded-host", originalHost);
    return fetch(new Request(url.toString(), {
      method: request.method,
      headers,
      body: request.body,
      redirect: "follow",
    }));
  }
};
```

Worker → Settings → Domains & Routes → Custom Domain → `lumina.zia16.com`

After deploy, add redirect URI in Google OAuth Console:
`https://lumina.zia16.com/api/auth/callback/google`

## Gotchas

- **`next.config.mjs`** — Next.js 14 does not support `.ts` config files. Must be `.mjs`.
- **`autoprefixer`** must be an explicit dep — Tailwind 3 does not bundle it.
- **`next-auth` v5 beta** — uses `auth()` for server-side session, `handlers` for route export. Requires `trustHost: true` when behind a proxy.
- **GCS `getFiles` with delimiter** — `prefixes` and `items` come from `apiResponse` (3rd element of the tuple). Types are loose, cast via `(apiResponse as any).prefixes`.
- **URL encoding** — `params.path` from Next.js may contain encoded segments. Always `decodeURIComponent` before passing to GCS, and `encodeURIComponent` when building hrefs.
- **GCS service account JSON** — pass as single-line string in env var, parsed in `getStorage()`. Use `env.yaml` + `--env-vars-file` to avoid shell escaping issues.
- **Cloudflare Worker proxy** — must set `x-forwarded-host` to original domain, otherwise Next.js Server Actions rejects the request.
- **asia-southeast3** — does not support `gcloud run domain-mappings`. Use Cloudflare Worker instead.
- **Signed URL** requires service account with `roles/storage.objectViewer` — not ADC/impersonation.

## What's Next

- [ ] Thumbnail generation (store small thumbnails in GCS for faster grid load)
- [ ] Download button in Lightbox
- [ ] EXIF metadata display (date, camera, location)
