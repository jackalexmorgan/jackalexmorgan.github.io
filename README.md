# designedbyjack

Personal UX portfolio for Jack Morgan, Digital Product Designer.

## View locally

```bash
python3 -m http.server 8080
```

Then visit [http://localhost:8080](http://localhost:8080).

## Structure

- `index.html`, Homepage with hero, case studies, and galleries
- `work/`, Case study pages (Recertifications, Digital HQ, ZILO Migrate, AtOnce)
- `css/style.css`, Global styles
- `images/`, Thumbnails, case study screenshots, and gallery assets
- `js/`, Gallery overlay and case study panel scripts

## Customise

- Update the email address in `index.html` (currently `jackalexmorgan@gmail.com`)
- Resume PDF/DOCX and build scripts live in `resumes/` (gitignored; regenerate with `python3 build-resume-docx.py` or `build-resume-pdf.py` from `resumes/scripts/`)
