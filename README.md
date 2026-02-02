# Kwik Claims Inc. Website (Static HTML)

This package is a fast, SEO-friendly, mobile-first static website with bilingual pages (English + Español).

## Pages
- `/index.html` (EN) + `/es/index.html` (ES)
- Claim Management: `/claim-management.html` + `/es/claim-management.html`
- Custom System Build: `/custom-claim-system.html` + `/es/custom-claim-system.html`
- Emergency Retainer: `/emergency-claim-retainer.html` + `/es/emergency-claim-retainer.html`
- Commercial Building Assessments: `/commercial-building-assessments.html` + `/es/commercial-building-assessments.html`
- How it works: `/how-it-works.html` + `/es/how-it-works.html`
- Training: `/training.html` + `/es/training.html`
- Contact: `/contact.html` + `/es/contact.html`
- Privacy (template): `/privacy.html` + `/es/privacy.html`

## How to preview locally
Open `index.html` in a browser.

For best results (to avoid browser CORS quirks), run a tiny local server:
```bash
python3 -m http.server 8080
# then open http://localhost:8080/
```

## Forms (IMPORTANT)
Forms currently use `action="#"` as a placeholder.

Recommended options:
- **Netlify Forms** (if hosting on Netlify)
- **Formspree** (easy drop-in endpoint)
- Your own CRM endpoint (HubSpot, GoHighLevel, etc.)

Update the `<form action="...">` attribute on:
- Home page (EN/ES)
- Contact page (EN/ES)

## Branding
- Update your phone/email in `contact.html` (EN/ES).
- Logo is at `assets/logo.png`.
- Color palette is derived from the logo.

## Hero video
The hero background video is `assets/hero.mp4` and was created from real construction photos (Ken Burns / cross-fade).
You can replace it with your own footage (recommended):
1. Export an MP4 (H.264) 1280×720 or 1920×1080
2. Name it `hero.mp4`
3. Replace the file in `assets/`

## SEO checklist (recommended)
- Connect Google Search Console
- Submit `sitemap.xml`
- Add Google Business Profile details (address / service areas) once finalized
- Add real testimonials + case studies for authority
- Add a blog section if you want long-tail traffic

## Notes
- Claims/approval outcomes depend on coverage and carrier decisions. Copy is written to be strong but not deceptive.
- Replace the privacy policy template with your official legal policy before launch.

See `CREDITS.md` for placeholder media credits.
