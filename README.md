# 🪷 Serenity Shift · Durga ↔ Kali

Upload your photo — AI renders **your actual face** in lotus meditation posture as either serene **Durga** or fierce **Kali**, controlled by a serenity slider.

---

## 🔮 The flow

```
1. Enter your fal.ai key  (free $10 credit, no credit card)
2. Upload your photo       → shown with live CSS effects
3. Drag the slider         → CSS filters shift instantly between Durga and Kali forms
4. Hit Generate            → your face + divine style → fal.ai PuLID Flux
5. Your face appears       → in lotus posture as that divine form (~20-40s)
6. Drag slider, Generate   → same face, new divine form
```

---

## 🔑 Getting your fal.ai key (free)

1. Go to [fal.ai](https://fal.ai) → Sign Up (Google or email, no credit card)
2. You get **$10 free credits** — enough for ~300 generations
3. Dashboard → API Keys → Create Key
4. Copy it — paste it into the key field when you open the app

The key lives only in browser memory. It's sent only to `queue.fal.run`.

---

## 🚀 Deploy free on GitHub Pages

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/serenity-shift.git
git push -u origin main
```

Then: **Settings → Pages → Source: main branch → Save**

Live at `https://YOUR_USERNAME.github.io/serenity-shift/`

---

## 🧠 Tech concepts demonstrated

| Concept | Location |
|---------|----------|
| CSS custom properties (`--serenity`) | `:root` vars updated by JS |
| CSS filter chain | `hue-rotate()`, `saturate()`, `contrast()` on `img` |
| CSS blend modes | `.gold-overlay` (screen), `.blood-overlay` (multiply) |
| `input` event live slider | `script.js` Section 10 |
| File API + FileReader | Section 6 |
| REST API with `fetch()` | Section 8 — fal.ai queue |
| Async polling | `pollQueue()` — polls every 3s until COMPLETED |
| Canvas + requestAnimationFrame | Section 11 — particles |

---

## 📁 Files

```
serenity-shift/
├── index.html   ← Structure
├── style.css    ← All visuals via CSS custom properties
├── script.js    ← Events, API calls, CSS var updates, particles
└── README.md
```

---

## 🌊 Stack

- Vanilla HTML · CSS · JavaScript — zero dependencies
- [fal.ai](https://fal.ai) PuLID Flux — face-consistent image generation
- GitHub Pages — free HTTPS hosting
