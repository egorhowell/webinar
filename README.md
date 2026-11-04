# Hired in Data — webinar landing page

Static site (one `index.html`), no build step. Registration uses the same Tally form as the current page (`laBlop`).

## Deploy to Vercel

```bash
cd hiredindata-webinar
./get-images.sh          # pull images from the current page into ./assets
npx vercel               # preview deploy (log in / link project on first run)
npx vercel --prod        # production
```

Then in Vercel → Project → Settings → Domains, add `webinar.hiredindata.com` and update the DNS record Vercel shows you (replace the current Carrd record).

Run `get-images.sh` before switching DNS — once the domain points to Vercel the old image URLs stop existing.

## Changing the date
Edit the countdown target in `index.html` (`2026-11-10T19:00:00-05:00`) plus the "Tuesday, 10 November" text (search for "10 November").
