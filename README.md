# Qress-ent Website — Version 1

Premium African hair-care brand website built according to the full design & development brief.

**Brand philosophy:** Hair is an identity.  
**Founders:** Catherine & Tracy Ojiambo (twins)  
**Previous name:** Qressinah Enterprises

---

## What’s included

### Public pages
- `index.html` — Homepage (hero, featured products, pillars, story preview, Hair & Culture, social, closing CTA)
- `pages/shop.html` — Product catalogue
- `pages/product.html` — Product detail template (tabs, WhatsApp order)
- `pages/our-story.html` — Brand & founders story
- `pages/hair-culture.html` — Educational content categories (Hair Care / Hairstyles / Culture)
- `pages/contact.html` — WhatsApp + Linktree contact

### Design system
- Temporary premium earth palette (cream, deep brown, muted gold, charcoal)
- Editorial typography: Playfair Display (headings) + Inter (UI)
- Fully responsive, mobile-first
- Accessible focus states, semantic HTML
- Clean, restrained, non-AI-looking aesthetic

### Functionality
- Mobile navigation
- “Add to Order” cart (localStorage)
- WhatsApp ordering with pre-filled message
- Smooth scroll header
- Product tabs on detail page

### Data
- `data/products.json` — Placeholder products (clearly marked)
- `data/articles.json` — Placeholder articles

### Placeholders (do not invent real data)
All product names, prices, ingredients, benefits, photos, email, phone, address, and Instagram/TikTok handles are marked `[PLACEHOLDER]`.  
Replace them via the future CMS once real assets are available.

Official logo not yet supplied → temporary wordmark “QRESS-ENT” is used.  
When the logo arrives, update the colour variables in `css/styles.css` and replace the logo text.

---

## How to run locally

1. Open the folder in any static server, or simply open `index.html` in a browser.
2. For best results (and to avoid CORS issues with future data fetching):

```bash
# Python
python -m http.server 8000

# or Node
npx serve .
```

Then visit `http://localhost:8000`

---

## Deployment (low cost)

**Recommended: Cloudflare Pages (free)**
1. Push this folder to a GitHub repository
2. Connect the repo to Cloudflare Pages
3. Build command: leave empty (static)
4. Output directory: `/` (root)
5. Custom domain + free SSL via Cloudflare

Alternative free options: Netlify, Vercel, GitHub Pages.

**Target operating cost:** well under KSh 1,500–2,500/year (domain only).

---

## Next steps (when ready)

1. **Replace placeholders**
   - Real product catalogue, photos, prices, ingredients
   - Official logo → update colour palette
   - Real WhatsApp number in `js/main.js` (`WHATSAPP_NUMBER`)
   - Email / address

2. **Add full CMS** (recommended path for low cost)
   - Cloudflare D1 + Workers + R2 for images, **or**
   - Supabase (free tier) + simple admin, **or**
   - PocketBase (self-hosted)

3. **Future e-commerce**
   - M-Pesa / card checkout
   - Order tracking
   - Customer accounts
   - Inventory

The current architecture is intentionally simple so these can be added without a full rewrite.

---

## File structure

```
qress-ent/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── main.js
├── data/
│   ├── products.json
│   └── articles.json
├── pages/
│   ├── shop.html
│   ├── product.html
│   ├── our-story.html
│   ├── hair-culture.html
│   └── contact.html
├── images/          (add real photos here)
├── admin/           (future admin dashboard)
└── README.md
```

---

Built to feel like a professional African beauty-brand site — not a generic template.
