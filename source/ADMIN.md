# A/0001 admin

The studio site is a static export on flypod. The `/admin/` page is included in that export so it opens in the browser, but the host cannot write files or accept image uploads.

## Open

- Live: `https://fb05980b9e194bd4.flypod.page/admin/`
- Local: `npm run dev` then `http://localhost:3000/admin/`

## Password

Default password: `a0001`

Change it with either:

- `NEXT_PUBLIC_ADMIN_PASSWORD` — used by the browser gate (required for the live static page)
- `ADMIN_PASSWORD` — used by the local API (`npm run dev`)

Session is stored in `sessionStorage` until the tab is closed.

This is a simple gate, not strong hosting security. Anyone who can read the public JavaScript can find the static password.

## What works on the live site

- Sign in
- List, add, edit, delete and reorder Works, Tattoo and Shop items
- Edit image *paths* such as `/uploads/works/photo.jpg` or `/tattoo/tattoo-01.jpg`
- Download an updated `content.json`

The live host will not save those edits by itself. After downloading `content.json`:

1. Replace `data/content.json` (and `public/data/content.json`) in the project
2. Put any new image files under `public/uploads/<works|tattoo|shop>/`
3. Rebuild and redeploy

Small images (under 400KB) can be stored as data URLs inside the downloaded JSON. Larger files need to be added in the repo.

## What works only with `npm run dev`

API routes write to disk:

- `POST /api/admin/login`
- `GET` / `PUT /api/admin/content` writes `data/content.json`
- `POST /api/admin/upload` writes `public/uploads/...`

Use **Save on server** after editing. Refresh the public pages to see filesystem updates in development.

## Site content source

Pages read Works, Tattoo and Shop entries from `data/content.json` at build time. A public copy lives at `/data/content.json` so the admin page can load the current catalog on the static host.
