# 👑 Rakhi Makeovers — Luxury Bridal & Wedding Studio

A high-performance, mobile-optimized, ultra-luxury web application and Admin Management Studio tailored for **Rakhi Makeovers** (Bhubaneswar, Odisha).

---

## ✨ Features & Architecture

- **Royal Dark-Gold Luxury Aesthetic**: Custom color palette, glassmorphism, smooth micro-interactions, and typography.
- **Bespoke Bridal Services Slider**: Horizontal auto-scrolling carousel with filter tabs, touch-swipe gestures, and pause-on-hover.
- **Real Client Testimonials Slider**: 3-second auto-cycle carousel with verified Google review badges.
- **Filterable Lookbook Portfolio**: 2-column mobile luxury masonry grid with interactive Lightbox photo modals.
- **Interactive Before & After Transformation Slider**: 60fps/120fps touch & drag comparison slider.
- **Admin Studio Panel (`/admin.html` or `/admin`)**:
  - Full CRUD management for Services, Lookbook Gallery, and Client Reviews.
  - Minimalist **Webverse Software Solutions** technical support & developer card.
  - Mobile-optimized top navigation ribbon and bottom-sheet modals.
  - Hardened authentication with active session tracking, brute-force rate limiting, and binary magic-byte image validation.

---

## ☁️ Cloudflare Pages Deployment Configuration

This codebase is **100% Cloudflare Pages friendly** with serverless edge functions in `functions/`.

### Step-by-Step Deployment:
1. Push this repository to GitHub:
   ```bash
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
   git push -u origin main
   ```
2. Log into your **Cloudflare Dashboard** → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
3. Select this GitHub repository.
4. Configure Build Settings:
   - **Framework preset**: `None`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`
5. *(Optional for Cloudflare KV persistence)*:
   - In Cloudflare Pages project **Settings** → **Functions** → **KV namespace bindings**:
     - Variable name: `RAKHI_KV`
     - Value: Select or create your KV namespace.
6. Click **Save and Deploy**! 🚀

---

## 🛡️ Cloudflare Security & Routing
- `_headers`: Enforces strict Content Security Policy (CSP), anti-indexing (`noindex`) for `/admin*`, and long-term asset caching.
- `_redirects`: Enables clean routing for `/admin` -> `/admin.html`.
- `scripts/build.js`: Packages assets into `dist/` and asserts `admin.json` is strictly excluded.

---

## 💻 Local Development

```bash
# Run local preview server with security middleware (port 5173)
npm run dev

# Build for production into dist/
npm run build

# Run automated SEO, image & security audit
npm run audit
```

---

## 📞 Support & Maintenance
Engineered & Maintained by **Webverse Software Solutions**  
- **Phone**: +91 7326974498  
- **Email**: workabhiorg@gmail.com  
- **WhatsApp**: [+91 7326974498](https://wa.me/917326974498)  

*© 2026 Rakhi Makeovers. All rights reserved.*
