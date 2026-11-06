
# A/0001

Independent artist portfolio and online art store for Alper / A/0001.

## Run locally

```bash
cd /workspace/a0001
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm start
```

## Content

Works, tattoo pieces and shop items live in `data/content.json`.
Edit them in the admin panel (`/admin`, password `a0001`) while running `npm run dev`.
See `ADMIN.md` for short steps in Turkish.

UI copy is English.

## Static preview

```bash
npm run build:static
```

This writes the public site into `out/` (admin page included; upload API excluded).

## Pages

- `/` Home
- `/works` and `/works/[slug]`
- `/tattoo` and `/tattoo/[slug]`
- `/shop` and `/shop/[slug]`
- `/about`
- `/contact`
