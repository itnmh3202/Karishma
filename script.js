/* ═══════════════════════════════════════════════════════════
   SERENITY SHIFT — script.js
   Face-consistent generation via fal.ai PuLID Flux

   FLOW:
     1. User enters fal.ai API key (free, no credit card)
     2. User uploads their photo → stored as base64
     3. Photo preview shows with live CSS filter effects
     4. User drags slider → CSS effects shift instantly
     5. User hits Generate:
          a. Photo (base64) + divine form prompt → fal.ai queue
          b. Poll for completion (~20-40s)
          c. Generated image URL → displayed with same CSS effects
     6. User can toggle between their photo and the generated image
     7. Drag slider again → regenerate in a new form
═══════════════════════════════════════════════════════════ */


// ── SECTION 1: DOM REFERENCES ──────────────────────────────
const root            = document.documentElement;
const apiKeyInput     = document.getElementById('apiKeyInput');
const btnSetKey       = document.getElementById('btnSetKey');
const keyStatus       = document.getElementById('keyStatus');

const fileInput       = document.getElementById('fileInput');
const uploadZone      = document.getElementById('uploadZone');
const photoFrame      = document.getElementById('photoFrame');
const photoImg        = document.getElementById('photoImg');
const genFrame        = document.getElementById('genFrame');
const genImg          = document.getElementById('genImg');
const genBadge        = document.getElementById('genBadge');
const loadingOverlay  = document.getElementById('loadingOverlay');
const loadingText     = document.getElementById('loadingText');
const toggleRow       = document.getElementById('toggleRow');
const btnShowPhoto    = document.getElementById('btnShowPhoto');
const btnShowGen      = document.getElementById('btnShowGen');
const btnNewPhoto     = document.getElementById('btnNewPhoto');

const auraRing        = document.getElementById('auraRing');
const mandalaRing     = document.getElementById('mandalaRing');
const thirdEyePhoto   = document.getElementById('thirdEyePhoto');
const thirdEyeGen     = document.getElementById('thirdEyeGen');

const slider          = document.getElementById('serenitySlider');
const stateName       = document.getElementById('stateName');
const serenityNum     = document.getElementById('serenityNumber');
const descBox         = document.getElementById('descBox');
const btnGenerate     = document.getElementById('btnGenerate');

const statusBar       = document.getElementById('statusBar');
const errorBar        = document.getElementById('errorBar');

const canvas          = document.getElementById('particleCanvas');
const ctx             = canvas.getContext('2d');


// ── SECTION 2: APP STATE ───────────────────────────────────
let falKey          = '';         // fal.ai API key — memory only
let photoBase64     = '';         // Raw base64 of uploaded photo
let photoMimeType   = 'image/jpeg';
let currentSerenity = 100;
let isGenerating    = false;
let particleMode    = 'lotus';
let hasGenerated    = false;      // true after first successful generation


// ── SECTION 3: SERENITY STATES ────────────────────────────
// Maps slider ranges to CSS values and AI prompt styles.
// The prompt style is what PuLID gets — your face + this style
// = your face rendered as that divine form.

const STATES = [
  {
    min: 80, max: 100,
    name:  '✦ Radiant Durga',
    desc:  'She radiates golden light. The lotus blooms beneath her. Compassion without boundary. Peace without end.',
    prompt: [
      'divine goddess Durga in full lotus meditation posture (padmasana),',
      'sitting cross-legged on a luminous lotus flower,',
      'warm golden radiant light emanating from body,',
      'peaceful serene loving expression,',
      'eyes gently closed in meditation,',
      'ornate golden jewelry and silk garments,',
      'sacred geometry mandala halo behind head,',
      'soft warm golden aura,',
      'ethereal divine beauty,',
      'temple setting with lotus petals falling,',
      'highly detailed digital art, cinematic warm lighting,',
      'masterpiece quality portrait',
    ].join(' '),
    negative: 'ugly, disfigured, deformed, extra limbs, dark, scary, fierce, flames, skulls, text, watermark',
    aura:   'rgba(218,165,32,0.72)', aura2: 'rgba(218,165,32,0.2)',
    border: '#b8860b',
    hue: '30deg',   sat: 1.1,  contrast: 1.0,  bright: 1.1,
    goldOp: 0.36,   bloodOp: 0,
  },
  {
    min: 55, max: 79,
    name:  '◇ Gentle Mother',
    desc:  'A warmth settles in the air. Her eyes are soft — seeing all, judging none.',
    prompt: [
      'gentle divine goddess in lotus meditation posture (padmasana),',
      'warm amber and golden light,',
      'soft compassionate expression, eyes half open,',
      'marigold and lotus flowers surrounding figure,',
      'sacred feminine energy,',
      'ornate jewelry, flowing saffron silk garments,',
      'soft divine golden glow,',
      'peaceful garden setting,',
      'highly detailed digital art, warm cinematic lighting',
    ].join(' '),
    negative: 'ugly, deformed, dark, scary, fierce, flames, skulls, text, watermark',
    aura:   'rgba(200,110,20,0.65)', aura2: 'rgba(200,110,20,0.18)',
    border: '#cc7020',
    hue: '55deg',   sat: 1.3,  contrast: 1.05, bright: 1.05,
    goldOp: 0.2,    bloodOp: 0,
  },
  {
    min: 30, max: 54,
    name:  '⊕ The Threshold',
    desc:  'Between stillness and storm. Something ancient stirs beneath the calm surface.',
    prompt: [
      'mystical goddess at the threshold between light and darkness,',
      'lotus meditation posture (padmasana),',
      'violet and deep purple twilight energy surrounding figure,',
      'half golden half shadow expression — intense, focused, transcendent,',
      'duality of divine power, cosmic mandala background,',
      'ornate jewelry catching violet light,',
      'spiritual power emanating,',
      'highly detailed digital art, dramatic twilight lighting',
    ].join(' '),
    negative: 'ugly, deformed, text, watermark',
    aura:   'rgba(100,40,180,0.65)', aura2: 'rgba(100,40,180,0.18)',
    border: '#7030a0',
    hue: '200deg',  sat: 1.5,  contrast: 1.2,  bright: 0.95,
    goldOp: 0.07,   bloodOp: 0.18,
  },
  {
    min: 10, max: 29,
    name:  '⚡ Kali Awakens',
    desc:  'The ground trembles. She holds the skull not from cruelty — but because she has stared death down and laughed.',
    prompt: [
      'goddess Kali awakening, fierce divine power,',
      'lotus meditation posture (padmasana),',
      'dark crimson red and black energy radiating from body,',
      'fierce intense expression of divine wrath and liberation,',
      'flames and fire swirling around figure,',
      'dark cosmic night sky background,',
      'glowing red third eye on forehead,',
      'skull garland jewelry, disheveled dark hair,',
      'powerful terrifying beauty,',
      'highly detailed digital art, dramatic dark cinematic lighting',
    ].join(' '),
    negative: 'ugly, deformed, text, watermark, peaceful, serene, golden',
    aura:   'rgba(160,0,20,0.75)', aura2: 'rgba(160,0,20,0.22)',
    border: '#8b0000',
    hue: '275deg',  sat: 1.7,  contrast: 1.45, bright: 0.88,
    goldOp: 0,      bloodOp: 0.38,
  },
  {
    min: 0, max: 9,
    name:  '☽ Fierce Kali',
    desc:  'She dances on the chaos. Her tongue is fire. Destroyer of illusions. Mother of liberation. Fear her. Love her.',
    prompt: [
      'fierce goddess Kali in supreme dark power,',
      'lotus meditation posture (padmasana) on cremation ground,',
      'dark crimson and black energy, blazing fire all around,',
      'terrifyingly beautiful expression — tongue out, eyes blazing red,',
      'glowing third eye wide open on forehead,',
      'skull garland, wild dark hair like storm,',
      'dark tantric cosmic void background with stars,',
      'destroyer of illusion and ego,',
      'dramatic red fire lighting,',
      'highly detailed digital art, dark and powerful masterpiece',
    ].join(' '),
    negative: 'ugly, deformed, text, watermark, peaceful, golden, serene',
    aura:   'rgba(110,0,10,0.88)', aura2: 'rgba(110,0,10,0.28)',
    border: '#5a0000',
    hue: '300deg',  sat: 2.0,  contrast: 1.6,  bright: 0.82,
    goldOp: 0,      bloodOp: 0.5,
  },
];

function getState(val) {
  return STATES.find(s => val >= s.min && val <= s.max) || STATES[0];
}


// ── SECTION 4: FEEDBACK ────────────────────────────────────
function setStatus(msg)  { statusBar.textContent = msg; }
function clearStatus()   { statusBar.textContent = ''; }
function setError(msg)   {
  errorBar.textContent = msg;
  setTimeout(() => { errorBar.textContent = ''; }, 8000);
}


// ── SECTION 5: API KEY ─────────────────────────────────────
// fal.ai key stays in the JS variable only.
// Never written to localStorage, cookies, or the DOM.
// Sent only to queue.fal.run in the Authorization header.

btnSetKey.addEventListener('click', async () => {
  const val = apiKeyInput.value.trim();
  if (!val || val.length < 10) {
    keyStatus.style.color = '#ff7070';
    keyStatus.textContent = '⚠ Please paste your fal.ai key';
    return;
  }
  falKey = val;
  keyStatus.style.color = '#e8d5b7';
  keyStatus.textContent  = 'Verifying key…';
  apiKeyInput.value      = '•'.repeat(20);

  // Quick test ping — cheapest endpoint to validate auth
  try {
    const test = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ prompt: 'test', num_inference_steps: 1, image_size: 'square' }),
    });

    // 401 = bad key. 422 = bad params but key is valid. 200/other = working.
    if (test.status === 401) {
      falKey = '';
      keyStatus.style.color = '#ff7070';
      keyStatus.textContent  = '⚠ Key rejected — check it and try again';
      apiKeyInput.value      = '';
      return;
    }

    keyStatus.style.color = '#90ee90';
    keyStatus.textContent  = '✓ Key verified and saved for this session';
    setStatus('Key set. Upload your photo to begin.');
    if (photoBase64) btnGenerate.disabled = false;

  } catch (err) {
    // Network error — still accept the key, CORS might block the test
    keyStatus.style.color = '#ffd166';
    keyStatus.textContent  = '⚠ Could not verify (network) — key saved, try Generating';
    setStatus('Key saved. Upload your photo and try generating.');
    if (photoBase64) btnGenerate.disabled = false;
  }
});

apiKeyInput.addEventListener('keydown', e => { if (e.key === 'Enter') btnSetKey.click(); });


// ── SECTION 6: FILE UPLOAD ────────────────────────────────
// FileReader converts the image to base64.
// We store it — then send it directly to fal.ai as a data URI.
// The photo is also shown in the circle with live CSS effects.

function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    setError('Please upload an image file.');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl    = e.target.result;
    photoBase64      = dataUrl.split(',')[1];
    photoMimeType    = file.type;

    // Show the photo preview
    photoImg.src      = dataUrl;
    uploadZone.hidden = true;
    photoFrame.hidden = false;
    genFrame.hidden   = true;
    toggleRow.hidden  = false;

    showPhoto();

    // Enable generate if key is set
    if (falKey) btnGenerate.disabled = false;
    setStatus(falKey
      ? 'Photo loaded. Choose your form on the slider, then Generate.'
      : 'Photo loaded. Enter your fal.ai key above to generate.');
  };
  reader.readAsDataURL(file);
}

fileInput.addEventListener('change', e => handleFile(e.target.files[0]));

// Explicit click handler — more reliable than label-for with absolutely positioned inputs
uploadZone.addEventListener('click', (e) => {
  // Don't double-fire if the click came from the input itself
  if (e.target === fileInput) return;
  fileInput.click();
});

uploadZone.addEventListener('dragover',  e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
uploadZone.addEventListener('dragleave', ()  => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop',      e  => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  handleFile(e.dataTransfer.files[0]);
});

btnNewPhoto.addEventListener('click', () => {
  photoBase64      = '';
  photoImg.src     = '';
  genImg.src       = '';
  hasGenerated     = false;
  uploadZone.hidden = false;
  photoFrame.hidden = true;
  genFrame.hidden   = true;
  toggleRow.hidden  = true;
  btnGenerate.disabled = true;
  clearStatus();
  fileInput.value  = '';
});


// ── SECTION 7: PHOTO / GEN TOGGLE ─────────────────────────
// The user can switch between viewing their original photo
// (with live CSS effects) and the AI-generated divine image.
// Both frames are in the same spot in the DOM — we show one, hide the other.

window.showPhoto = function () {
  photoFrame.hidden = false;
  genFrame.hidden   = hasGenerated ? true : true;  // keep gen hidden unless generated
  if (hasGenerated) genFrame.hidden = true;
  photoFrame.hidden = false;
  btnShowPhoto.classList.add('active');
  btnShowGen.classList.remove('active');
};

window.showGen = function () {
  if (!hasGenerated) return;
  photoFrame.hidden = true;
  genFrame.hidden   = false;
  btnShowGen.classList.add('active');
  btnShowPhoto.classList.remove('active');
};


// ── SECTION 8: FAL.AI IMAGE GENERATION ────────────────────
//
// fal.ai uses a queue-based REST API:
//   1. POST to queue.fal.run/{model}  → gets request_id
//   2. Poll GET .../{request_id}/status until COMPLETED
//   3. GET .../{request_id}  → returns the image URL
//
// The reference image is sent as a base64 data URI.
// PuLID Flux locks onto the face from that image and
// renders it in whatever style the prompt describes.

const FAL_MODEL = 'fal-ai/flux-pulid';
const FAL_BASE  = 'https://queue.fal.run';
const FAL_SYNC  = 'https://fal.run';

async function generateImage() {
  if (!falKey)      { setError('Enter your fal.ai API key first.'); return; }
  if (!photoBase64) { setError('Upload your photo first.'); return; }
  if (isGenerating) return;

  isGenerating = true;
  btnGenerate.disabled = true;

  const state = getState(currentSerenity);

  // Show generated frame with loading spinner
  photoFrame.hidden         = true;
  genFrame.hidden           = false;
  loadingOverlay.hidden     = false;
  loadingText.textContent   = `Generating your ${state.name.replace(/[✦◇⊕⚡☽]/g,'').trim()} form…`;
  btnShowGen.classList.remove('active');
  btnShowPhoto.classList.add('active');

  setStatus('Submitting to fal.ai — using your face as the reference…');

  const payload = {
    prompt:               state.prompt,
    reference_image_url:  `data:${photoMimeType};base64,${photoBase64}`,
    num_inference_steps:  25,
    guidance_scale:       4.5,
    id_weight:            1.0,
    negative_prompt:      state.negative,
    image_size:           'square_hd',
    enable_safety_checker: true,
  };

  try {
    // Try queue first, fall back to sync if CORS blocks it
    let imgUrl;
    try {
      imgUrl = await submitToQueue(payload, state);
    } catch (queueErr) {
      console.warn('Queue failed, trying sync endpoint:', queueErr.message);
      setStatus('Trying synchronous endpoint…');
      imgUrl = await submitSync(payload);
    }
    displayGenerated(imgUrl, state);

  } catch (err) {
    loadingOverlay.hidden = true;
    photoFrame.hidden     = false;
    genFrame.hidden       = true;
    showPhoto();
    isGenerating          = false;
    btnGenerate.disabled  = false;
    // Surface the real error message
    const msg = err.message || 'Unknown error';
    setError(`Generation failed: ${msg}`);
    console.error('fal.ai error:', err);
    setStatus('');
  }
}

// Queue-based (async, supports polling progress)
async function submitToQueue(payload, state) {
  const submitRes = await fetch(`${FAL_BASE}/${FAL_MODEL}`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${falKey}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!submitRes.ok) {
    const err = await submitRes.json().catch(() => ({}));
    const msg = err.detail || err.message || err.error || `HTTP ${submitRes.status}`;
    throw new Error(msg);
  }

  const { request_id } = await submitRes.json();
  if (!request_id) throw new Error('No request_id returned from queue');

  setStatus(`Queued (${request_id.slice(0,8)}…) — rendering your face…`);
  return await pollQueue(request_id);
}

// Synchronous (blocks until done — simpler but no progress updates)
async function submitSync(payload) {
  const res = await fetch(`${FAL_SYNC}/${FAL_MODEL}`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${falKey}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || `HTTP ${res.status}`);
  }

  const data   = await res.json();
  const imgUrl = data?.images?.[0]?.url;
  if (!imgUrl) throw new Error('No image URL in sync response');
  return imgUrl;
}

async function pollQueue(requestId) {
  const statusUrl = `${FAL_BASE}/${FAL_MODEL}/requests/${requestId}/status`;
  const resultUrl = `${FAL_BASE}/${FAL_MODEL}/requests/${requestId}`;

  const MAX_POLLS  = 60;   // max ~60 × 3s = 3 minutes
  const POLL_DELAY = 3000; // ms between polls

  for (let i = 0; i < MAX_POLLS; i++) {
    await sleep(POLL_DELAY);

    const res  = await fetch(statusUrl, {
      headers: { 'Authorization': `Key ${falKey}` },
    });
    const data = await res.json();

    const status = data.status;

    if (status === 'COMPLETED') {
      // Fetch the actual result
      const resultRes  = await fetch(resultUrl, {
        headers: { 'Authorization': `Key ${falKey}` },
      });
      const resultData = await resultRes.json();
      const imgUrl     = resultData?.images?.[0]?.url;
      if (!imgUrl) throw new Error('No image URL in result');
      return imgUrl;
    }

    if (status === 'FAILED') {
      throw new Error('Generation failed on fal.ai — try again.');
    }

    // Update progress text
    const elapsed = ((i + 1) * POLL_DELAY / 1000).toFixed(0);
    setStatus(`Rendering… ${elapsed}s elapsed (${status})`);
    loadingText.textContent = `Rendering with your face… ${elapsed}s`;
  }

  throw new Error('Timed out waiting for result — try again.');
}

function displayGenerated(imgUrl, state) {
  genImg.onload = () => {
    loadingOverlay.hidden = false; // keep hidden now
    loadingOverlay.hidden = true;
    genImg.style.opacity  = '1';
    genBadge.textContent  = `✨ ${state.name.replace(/[✦◇⊕⚡☽]/g,'').trim()}`;
    hasGenerated          = true;
    isGenerating          = false;
    btnGenerate.disabled  = false;

    // Switch to generated view
    photoFrame.hidden     = true;
    genFrame.hidden       = false;
    btnShowGen.classList.add('active');
    btnShowPhoto.classList.remove('active');

    setStatus('Done ✓  Drag the slider to a new form and Generate again.');
  };
  genImg.onerror = () => {
    loadingOverlay.hidden = true;
    isGenerating          = false;
    btnGenerate.disabled  = false;
    setError('Failed to load generated image — try again.');
    showPhoto();
  };
  genImg.style.opacity = '0.3';
  genImg.src = imgUrl;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

btnGenerate.addEventListener('click', generateImage);


// ── SECTION 9: CSS CUSTOM PROPERTY UPDATES ────────────────
// This is the core lesson in CSS ↔ JS interaction.
//
// When the slider moves:
//   JS reads the value → calls root.style.setProperty()
//   CSS vars update on :root
//   Every rule using var(--img-hue) etc. reacts instantly
//   No page reload, no class toggling — one variable, cascades everywhere

function applySerenity(val) {
  const state = getState(val);

  // Update CSS custom properties — stylesheet reacts immediately
  root.style.setProperty('--img-hue',        state.hue);
  root.style.setProperty('--img-sat',        state.sat);
  root.style.setProperty('--img-contrast',   state.contrast);
  root.style.setProperty('--img-brightness', state.bright);
  root.style.setProperty('--gold-op',        state.goldOp);
  root.style.setProperty('--blood-op',       state.bloodOp);

  // Aura glow
  auraRing.style.boxShadow =
    `0 0 28px 10px ${state.aura}, 0 0 58px 24px ${state.aura2}`;

  // Mandala petal colour and spin speed (faster = more intense)
  const speed = 22 - 14 * ((100 - val) / 100);  // 22s calm → 8s fierce
  mandalaRing.style.animationDuration = `${speed.toFixed(1)}s`;
  document.querySelectorAll('.petal').forEach(p => { p.style.fill = state.aura; });
  document.querySelectorAll('.mandala-circle').forEach(c => { c.style.stroke = state.border; });

  // Third eye fades in below serenity 30
  const eyeOp = val < 30 ? ((30 - val) / 30).toFixed(3) : '0';
  thirdEyePhoto.style.opacity = eyeOp;
  thirdEyeGen.style.opacity   = eyeOp;

  // Slider thumb colour (pseudo-elements need injected style)
  updateThumbStyle(val);

  // Text
  stateName.textContent   = state.name;
  serenityNum.textContent = val;
  descBox.textContent     = state.desc;
  descBox.style.borderColor = state.border;

  // Particle mode
  particleMode = val > 50 ? 'lotus' : 'fire';
}

let thumbStyleEl = null;
function updateThumbStyle(val) {
  const bg = val > 50
    ? 'radial-gradient(circle, #fff8e7 20%, #ffd700 60%, #ff8c00 100%)'
    : 'radial-gradient(circle, #ff6060 20%, #990000 60%, #440000 100%)';
  const glow = val > 50 ? 'rgba(255,200,0,0.9)' : 'rgba(200,0,0,0.95)';

  if (!thumbStyleEl) {
    thumbStyleEl = document.createElement('style');
    document.head.appendChild(thumbStyleEl);
  }
  thumbStyleEl.textContent = `
    #serenitySlider::-webkit-slider-thumb {
      background: ${bg} !important;
      box-shadow: 0 0 16px ${glow}, 0 0 32px ${glow.replace(/[\d.]+\)$/, '0.4)')} !important;
    }
    #serenitySlider::-moz-range-thumb {
      background: ${bg} !important;
      box-shadow: 0 0 16px ${glow} !important;
    }
  `;
}


// ── SECTION 10: SLIDER EVENT ───────────────────────────────
// 'input' fires on every pixel of drag movement — gives us
// live CSS effects as the user drags, before they release.

slider.addEventListener('input', e => {
  currentSerenity = parseInt(e.target.value, 10);
  applySerenity(currentSerenity);
});


// ── SECTION 11: CANVAS PARTICLE SYSTEM ────────────────────
// Lotus petals (Durga) → fire sparks (Kali)
// requestAnimationFrame keeps it smooth at ~60fps.

const particles = [];
const MAX_PARTS = 70;

class Particle {
  constructor() { this.reset(); }

  reset() {
    this.mode  = particleMode;
    this.life  = 1;
    this.decay = Math.random() * 0.004 + 0.0025;
    this.size  = Math.random() * 4 + 1.5;

    if (this.mode === 'lotus') {
      const edge = Math.floor(Math.random() * 4);
      if (edge === 0)      { this.x = Math.random() * canvas.width; this.y = -10; }
      else if (edge === 1) { this.x = canvas.width + 10; this.y = Math.random() * canvas.height; }
      else if (edge === 2) { this.x = Math.random() * canvas.width; this.y = canvas.height + 10; }
      else                 { this.x = -10; this.y = Math.random() * canvas.height; }

      const angle = Math.atan2(canvas.height / 2 - this.y, canvas.width / 2 - this.x);
      const spd   = Math.random() * 0.5 + 0.2;
      this.vx     = Math.cos(angle) * spd + (Math.random() - 0.5) * 0.4;
      this.vy     = Math.sin(angle) * spd + (Math.random() - 0.5) * 0.4;
      this.hue    = 30 + Math.random() * 30;
      this.shape  = Math.random() > 0.45 ? 'petal' : 'circle';
    } else {
      this.x      = Math.random() * canvas.width;
      this.y      = canvas.height + 8;
      this.vx     = (Math.random() - 0.5) * 1.5;
      this.vy     = -(Math.random() * 2.2 + 0.6);
      this.hue    = Math.random() > 0.45 ? Math.random() * 28 : 270 + Math.random() * 35;
      this.shape  = 'circle';
      this.decay  = Math.random() * 0.006 + 0.003;
    }
  }

  update() {
    this.x    += this.vx;
    this.y    += this.vy;
    this.life -= this.decay;
    if (this.mode === 'lotus') { this.vx *= 0.994; this.vy *= 0.994; }
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life * 0.62);
    ctx.fillStyle   = `hsl(${this.hue}, 88%, 64%)`;
    ctx.shadowColor = `hsl(${this.hue}, 100%, 68%)`;
    ctx.shadowBlur  = 7;

    if (this.shape === 'petal') {
      ctx.translate(this.x, this.y);
      ctx.rotate(Math.atan2(this.vy, this.vx) + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, -this.size * 1.6);
      ctx.quadraticCurveTo(this.size * 0.9, 0, 0, this.size * 1.6);
      ctx.quadraticCurveTo(-this.size * 0.9, 0, 0, -this.size * 1.6);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  isDead() { return this.life <= 0; }
}

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw();
    if (particles[i].isDead()) particles.splice(i, 1);
  }

  const rate = particleMode === 'fire' ? 2 : 1;
  for (let i = 0; i < rate; i++) {
    if (particles.length < MAX_PARTS) particles.push(new Particle());
  }

  requestAnimationFrame(animate);
}


// ── SECTION 12: INIT ───────────────────────────────────────
applySerenity(100);
animate();
