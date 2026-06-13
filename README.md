# PVCS – Document Management System

**पटना सदर प्रखंड प्राथमिक सब्जी उत्पादक सहकारी समिति लिमिटेड**  
PATNA SADAR BLOCK PRIMARY VEGETABLES GROWERS COOPERATIVE SOCIETY LIMITED

Reg. No.: 26/HQR/2018  
E-8, Chitrakut Vihar Colony, Bhagwat Nagar, P.O. Bahadurpur Colony, Patna Sadar, Patna – 800026

---

## Overview

A complete offline-first Correspondence & Document Management System hosted on GitHub Pages.

**No backend. No database. No login. Works fully offline as a PWA.**

---

## Features

- ✍️ **Letter Creation** – Bilingual (English + Hindi) letter drafting with 13 letter types
- 📋 **Templates** – 13 ready-made government letter templates including Land Request, Cold Storage Proposal, Hyper Bazaar Proposal, Tender, Grant Request, Audit Response
- 🔢 **Reference Numbers** – Auto-generated format: `YYYY/SENDER-PVCS/MM/RECIPIENT/DD/TYPE/SERIAL`
- 🆔 **Document ID (DID)** – Permanent unique ID: `PVCS-YYYY-000001-PS`
- 🗂️ **Archive** – Full-text search, filter by type/sender/priority/year, pagination
- 📖 **Bylaw Search** – Upload Model Bylaws PDF → extract text → local search with Fuse.js + Lunr.js
- 📄 **PDF Export** – Professional government-style PDF with letterhead, QR code, page numbers
- 📝 **DOCX Export** – Microsoft Word format export
- 💾 **Backup/Restore** – JSON export/import, CSV register export
- 📱 **PWA** – Installable, works offline on mobile and desktop

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Plain HTML5 + CSS3 + Vanilla JS |
| Storage | IndexedDB (via browser) |
| PDF Generation | pdf-lib |
| PDF Text Extraction | PDF.js |
| Fuzzy Search | Fuse.js |
| Full-text Search | Lunr.js |
| QR Code | QRCode.js |
| DOCX Export | docx.js |
| Hosting | GitHub Pages (static) |
| Offline | Service Worker PWA |

---

## Deployment on GitHub Pages

1. Push all files to a GitHub repository
2. Go to **Settings → Pages**
3. Set source to **main branch / root**
4. Site will be live at `https://yourusername.github.io/repositoryname/`

---

## First Use

1. Open the application
2. Go to **Bylaw Search** and upload the Model Bylaws PDF
3. Go to **Create Letter** to write your first letter
4. Use **Backup** regularly to export your data

---

## Office Bearers

| Role | Name |
|------|------|
| Chairperson | Gautam Raj |
| Vice Chairperson | Sita Ram Singh |
| Secretary | Kavita Devi |
| Advisor to Chairperson | Sushil Kumar |
| Financial Advisor | Harsh Prakash |

---

## Folder Structure

```
PVCS/
├── index.html              # Main app shell
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── .nojekyll               # GitHub Pages config
├── css/
│   └── style.css           # Complete stylesheet
├── js/
│   ├── db.js               # IndexedDB layer
│   ├── utils.js            # Utilities & helpers
│   ├── refnum.js           # Reference number generator
│   ├── templates.js        # Letter templates (EN+HI)
│   ├── pdf-export.js       # PDF generation
│   ├── docx-export.js      # DOCX generation
│   ├── bylaws.js           # Bylaw search engine
│   ├── app.js              # App controller & routing
│   ├── sw-register.js      # Service worker registration
│   └── pages/
│       ├── dashboard.js
│       ├── create-letter.js
│       ├── archive.js
│       ├── templates-page.js
│       ├── bylaws-page.js
│       ├── backup.js
│       └── settings.js
└── assets/
    ├── icon-192.png
    ├── icon-512.png
    └── favicon.ico
```

---

*This system is operated exclusively by the society owner. All data is stored locally in the browser.*
