# ✨ A Magical Birthday Surprise Web Experience

A personalized, interactive, luxury mobile-first birthday celebration website designed for an 11-year-old girl (**Shridhika Sinha**). Built as a high-performance, accessible, vanilla web experience that can be shared via WhatsApp, Instagram, or any modern mobile browser.

---

## 🌟 The Experience Flow

1. **💌 Envelope Intro**: Full-screen interactive envelope with a wax seal that unlocks audio and smoothly unfolds in 3D, sliding up a personalized note with celebratory confetti.
2. **👑 Hero Section**: "11 Years of Magic" glass badge, glowing portrait frame with ambient ring animation, and personalized birthday greeting.
3. **⏳ Life Milestones**: 4 glass cards displaying an exact real-time calculation of years, months, days, and hours lived.
4. **🎂 "Make a Wish & Blow Out The Candles"**: A 3-tier luxury SVG cake with 11 lit candles, authentic flame teardrops with flicker physics, microphone blow detection, and a relight button.
5. **🎟️ "Scratch to Reveal"**: An interactive canvas scratch-off card that reveals a special birthday reward with haptic feel and keyboard accessibility.
6. **📸 "Scrapbook Memories"**: Tilted, taped polaroids that open into an accessible `<dialog>` lightbox with swipe and keyboard arrow navigation.
7. **💌 "A Letter For You"**: A heartfelt personal letter card styled like fine parchment with a bow accent.
8. **💖 "Reasons Why You Make Me Smile"**: 4 glassmorphic cards with custom SVG icons.
9. **🎉 Finale**: Celebration banner with a smooth in-place replay button.
* **🎵 Always Present**: Floating "Birthday Melodies" music pill and ambient falling sakura and heart petals.

---

## 🛠️ Architecture & Tech Stack

- **Core**: Vanilla JavaScript (ES modules) + [Vite](https://vitejs.dev/)
- **Styling**: Modern CSS utilizing `@layer reset, tokens, base, layout, components, utilities`
- **Typography**: `@fontsource/cormorant-garamond`, `@fontsource/dm-sans`, `@fontsource/great-vibes` (100% self-hosted, no external Google Fonts requests)
- **Effects**: `canvas-confetti`, native Canvas API for ambient petals
- **Code Quality**: ESLint (flat config) + Prettier
- **Zero Framework Bloat**: No React, Vue, Tailwind, or jQuery in runtime. Total gzipped bundle size is under **18 kB**.

---

## 🎨 Dev-Only "Content Studio"

All personal content (names, birth dates, photos, letters, reasons, music) can be edited visually without writing any code.

To launch the Content Studio:

```bash
npm run studio
```

This launches a dedicated local studio interface at `http://localhost:5173/studio/` with:
- **Live Dual-Pane Preview**: An interactive phone-sized iframe showing changes live as you edit.
- **Basics Tab**: Update recipient name, sender, birth date (automatically recalculates milestones and candle counts).
- **Photos Tab**: Drag and drop new photos, select photo focal points interactively with click-to-focus, and process images via Sharp (removes EXIF metadata, converts to WebP, auto-rotates).
- **Letter & Reasons Tab**: Rich text inputs for personal greetings.
- **Music Tab**: Upload or change the background birthday melody.
- **Publish & Checklist**: Ensures all photos, text, and settings are verified before deployment.

> **Production Safety Guarantee:** The `/studio/` editor and its Vite plugin are restricted strictly to dev-server mode (`apply: 'serve'`). They are completely stripped from production builds (`npm run build`) and will 404 in production.

---

## 🔒 Privacy & Safety First

Because this site is built for a child:
- **Search Engine Blocking**: Protected with `<meta name="robots" content="noindex, nofollow, noarchive" />`, `robots.txt` (`Disallow: /`), and Vercel `X-Robots-Tag: noindex, nofollow, noarchive` headers.
- **Generic Social Previews**: Open Graph metadata uses a generic celebratory card (`/og-image.jpg`) so personal photos and full names are never leaked in social link scrapers.
- **Zero Third-Party Hotlinks**: All fonts, icons, scripts, and audio ship locally from the repository.
- **Microphone Privacy**: Microphone blow detection runs 100% client-side via Web Audio API; no audio stream is ever recorded, stored, or transmitted.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v20 or higher

### Installation
```bash
npm install
```

### Development
```bash
npm run dev        # Launches the surprise website on http://localhost:5173
npm run studio     # Launches the visual Content Studio on http://localhost:5173/studio/
```

### Code Formatting & Quality
```bash
npm run lint       # Runs ESLint across src, studio, and tools
npm run format     # Runs Prettier formatting
```

### Production Build & Preview
```bash
npm run build      # Builds optimized production bundle in dist/
npm run preview    # Previews the production build locally
```

---

## 🌐 Deploying to Vercel

1. Push this project to a **private** GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit of modular birthday surprise"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/birthday-surprise.git
   git push -u origin main
   ```
2. Log into [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Vercel automatically detects Vite:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**. Your surprise site is now live with full HTTPS, security headers, and asset caching configured via `vercel.json`!

---

## 📄 License
Private, personal birthday project.
