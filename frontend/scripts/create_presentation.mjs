import pptxgen from 'pptxgenjs'
import fs from 'node:fs'
import path from 'node:path'

const pptx = new pptxgen()
pptx.layout = 'LAYOUT_WIDE'
pptx.author = 'AI Detection Project'
pptx.company = 'AI Detection Project'
pptx.subject = 'Project overview and technical architecture'
pptx.title = 'AI Detection | Project Presentation'
pptx.lang = 'en-US'
pptx.theme = {
  headFontFace: 'Aptos Display',
  bodyFontFace: 'Aptos',
  lang: 'en-US'
}
pptx.defineSlideMaster({
  title: 'MASTER',
  background: { color: 'F5F7F9' },
  objects: [
    { rect: { x: 0, y: 0, w: 13.333, h: 0.12, fill: { color: '0B7285' }, line: { color: '0B7285' } } },
    { text: { text: 'AI DETECTION', options: { x: 0.55, y: 7.12, w: 2.2, h: 0.18, fontFace: 'Aptos', fontSize: 8, bold: true, color: '6B7885', charSpacing: 1.2, margin: 0 } } },
    { text: { text: 'PROJECT PRESENTATION', options: { x: 10.55, y: 7.12, w: 2.2, h: 0.18, fontFace: 'Aptos', fontSize: 8, color: '6B7885', align: 'right', charSpacing: 0.7, margin: 0 } } }
  ],
  slideNumber: { x: 12.83, y: 7.08, color: '6B7885', fontFace: 'Aptos', fontSize: 8 }
})

const C = {
  ink: '17232D',
  muted: '586773',
  teal: '0B7285',
  tealLight: 'DDF2F1',
  navy: '183B56',
  coral: 'D96459',
  coralLight: 'FBE8E5',
  gold: 'D9A441',
  goldLight: 'FFF3D6',
  white: 'FFFFFF',
  line: 'D7E0E5',
  green: '2E8B72',
  greenLight: 'E3F4EE'
}

function addTitle(slide, kicker, title, subtitle = '') {
  slide.addText(kicker.toUpperCase(), { x: 0.65, y: 0.48, w: 5.8, h: 0.2, fontSize: 10, bold: true, color: C.teal, charSpacing: 1.4, margin: 0 })
  slide.addText(title, { x: 0.62, y: 0.78, w: 11.4, h: 0.62, fontFace: 'Aptos Display', fontSize: 28, bold: true, color: C.ink, margin: 0, breakLine: false, fit: 'shrink' })
  if (subtitle) slide.addText(subtitle, { x: 0.65, y: 1.48, w: 10.9, h: 0.35, fontSize: 13, color: C.muted, margin: 0, fit: 'shrink' })
}

function addPill(slide, text, x, y, w, fill = C.tealLight, color = C.teal) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h: 0.32, rectRadius: 0.06, fill: { color: fill }, line: { color: fill } })
  slide.addText(text, { x, y: y + 0.07, w, h: 0.12, fontSize: 9, bold: true, color, align: 'center', margin: 0, fit: 'shrink' })
}

function addCard(slide, { x, y, w, h, title, body, accent = C.teal, fill = C.white, icon = '' }) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.05, fill: { color: fill }, line: { color: C.line, width: 1 } })
  slide.addShape(pptx.ShapeType.rect, { x, y, w: 0.07, h, fill: { color: accent }, line: { color: accent } })
  if (icon) slide.addText(icon, { x: x + 0.22, y: y + 0.2, w: 0.4, h: 0.35, fontSize: 20, margin: 0, fit: 'shrink' })
  const tx = x + (icon ? 0.72 : 0.25)
  slide.addText(title, { x: tx, y: y + 0.2, w: w - (tx - x) - 0.22, h: 0.26, fontSize: 15, bold: true, color: C.ink, margin: 0, fit: 'shrink' })
  slide.addText(body, { x: x + 0.25, y: y + 0.64, w: w - 0.48, h: h - 0.82, fontSize: 11.5, color: C.muted, breakLine: false, valign: 'top', margin: 0, fit: 'shrink', bullet: undefined })
}

function addFlowArrow(slide, x, y, label) {
  slide.addShape(pptx.ShapeType.chevron, { x, y, w: 0.62, h: 0.34, fill: { color: C.teal }, line: { color: C.teal } })
  if (label) slide.addText(label, { x: x - 0.15, y: y + 0.43, w: 0.9, h: 0.18, fontSize: 8.5, color: C.muted, align: 'center', margin: 0, fit: 'shrink' })
}

function addMetric(slide, x, y, value, label, fill = C.navy) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 1.65, h: 0.98, rectRadius: 0.05, fill: { color: fill }, line: { color: fill } })
  slide.addText(value, { x, y: y + 0.16, w: 1.65, h: 0.34, fontSize: 23, bold: true, color: C.white, align: 'center', margin: 0 })
  slide.addText(label, { x: x + 0.08, y: y + 0.62, w: 1.49, h: 0.16, fontSize: 8.5, color: 'D8E5EC', align: 'center', margin: 0, fit: 'shrink' })
}

function addBuildNotes(slide, text) {
  slide.addNotes(`Suggested presentation build: ${text}`)
}

// 1. Cover
{
  const slide = pptx.addSlide('MASTER')
  slide.background = { color: C.navy }
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: C.navy }, line: { color: C.navy } })
  slide.addShape(pptx.ShapeType.arc, { x: 8.3, y: -0.8, w: 5.8, h: 5.8, adjustPoint: 0.25, rotate: 12, line: { color: '2E657A', width: 2, transparency: 20 }, fill: { color: C.navy, transparency: 100 } })
  slide.addShape(pptx.ShapeType.arc, { x: 9.0, y: 2.8, w: 5.1, h: 5.1, adjustPoint: 0.25, rotate: 35, line: { color: C.teal, width: 3, transparency: 15 }, fill: { color: C.navy, transparency: 100 } })
  slide.addText('AI DETECTION PLATFORM', { x: 0.75, y: 1.15, w: 4.4, h: 0.25, fontSize: 11, bold: true, color: '8BD2D0', charSpacing: 1.7, margin: 0 })
  slide.addText('Deepfake Defense', { x: 0.72, y: 1.65, w: 8.2, h: 0.8, fontFace: 'Aptos Display', fontSize: 42, bold: true, color: C.white, margin: 0, fit: 'shrink' })
  slide.addText('A multi-modal workspace for verifying images, video, documents, text, audio, and presentation attacks.', { x: 0.78, y: 2.72, w: 6.5, h: 0.75, fontSize: 20, color: 'D9E8ED', margin: 0, breakLine: false, fit: 'shrink' })
  addPill(slide, 'PROJECT OVERVIEW', 0.78, 4.15, 1.75, '24566B', 'A7E1DE')
  slide.addText('React frontend  •  FastAPI backend  •  Optional Supabase persistence', { x: 0.8, y: 4.72, w: 6.6, h: 0.22, fontSize: 11.5, color: 'B8D2DA', margin: 0 })
  slide.addText('2026', { x: 0.78, y: 6.55, w: 1.1, h: 0.22, fontSize: 10, bold: true, color: '8BD2D0', charSpacing: 1.2, margin: 0 })
  slide.addText('Clear signals. One analysis surface.', { x: 8.0, y: 6.48, w: 4.45, h: 0.28, fontSize: 12, italic: true, color: 'B8D2DA', align: 'right', margin: 0 })
  addBuildNotes(slide, 'Fade in the title, then reveal the subtitle and architecture line.')
}

// 2. Problem / solution
{
  const slide = pptx.addSlide('MASTER')
  addTitle(slide, '01 / The case for it', 'Trust breaks when content crosses formats', 'Deepfake Defense gives a reviewer one place to ask: “Can I trust this?”')
  addCard(slide, { x: 0.7, y: 2.05, w: 3.75, h: 2.55, title: 'Many signals', body: 'A suspicious story may include a video, voice note, screenshot, document, or text post. Each carries different clues.', accent: C.coral, fill: C.coralLight, icon: '!' })
  addCard(slide, { x: 4.8, y: 2.05, w: 3.75, h: 2.55, title: 'One workspace', body: 'The dashboard routes each input to the right detector and returns the same readable result shape.', accent: C.teal, fill: C.tealLight, icon: '→' })
  addCard(slide, { x: 8.9, y: 2.05, w: 3.75, h: 2.55, title: 'A decision aid', body: 'Reviewers get a first-pass risk score, evidence highlights, and a traceable report when they sign in.', accent: C.gold, fill: C.goldLight, icon: '✓' })
  slide.addText('Designed for', { x: 0.72, y: 5.2, w: 1.4, h: 0.18, fontSize: 10, bold: true, color: C.teal, charSpacing: 1, margin: 0 })
  addPill(slide, 'MEDIA REVIEW', 2.05, 5.12, 1.35)
  addPill(slide, 'SECURITY TEAMS', 3.62, 5.12, 1.52, C.goldLight, '8A6417')
  addPill(slide, 'CONTENT MODERATION', 5.38, 5.12, 1.75, C.coralLight, C.coral)
  addPill(slide, 'IDENTITY WORKFLOWS', 7.38, 5.12, 1.62, C.greenLight, C.green)
  addBuildNotes(slide, 'Reveal the three cards from left to right, then bring in the audience pills as a final emphasis.')
}

// 3. Product surface
{
  const slide = pptx.addSlide('MASTER')
  addTitle(slide, '02 / The product', 'Six detectors. One review surface.', 'Choose a modality, submit evidence, and receive a consistent signal without changing tools.')
  const modes = [
    ['01', 'Image', 'Manipulation, noise, compression'],
    ['02', 'Video', 'Temporal and facial artifacts'],
    ['03', 'Document', 'Visual tampering and layout'],
    ['04', 'Text', 'Synthetic writing signals'],
    ['05', 'Audio', 'Voice cloning and synthesis'],
    ['06', 'Spoofing', 'Replay and liveness risk']
  ]
  modes.forEach(([number, title, body], index) => {
    const x = 0.72 + (index % 3) * 4.15
    const y = 2.1 + Math.floor(index / 3) * 1.48
    slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 3.65, h: 1.12, rectRadius: 0.05, fill: { color: C.white }, line: { color: C.line, width: 1 } })
    slide.addText(number, { x: x + 0.22, y: y + 0.22, w: 0.42, h: 0.32, fontSize: 16, bold: true, color: C.teal, margin: 0 })
    slide.addText(title, { x: x + 0.78, y: y + 0.18, w: 2.55, h: 0.25, fontSize: 15, bold: true, color: C.ink, margin: 0 })
    slide.addText(body, { x: x + 0.78, y: y + 0.56, w: 2.55, h: 0.18, fontSize: 10.5, color: C.muted, margin: 0, fit: 'shrink' })
  })
  slide.addShape(pptx.ShapeType.roundRect, { x: 0.72, y: 5.35, w: 11.9, h: 0.78, rectRadius: 0.04, fill: { color: C.navy }, line: { color: C.navy } })
  slide.addText('Start as a guest. Sign in when you need private history and saved reports.', { x: 1.0, y: 5.61, w: 11.3, h: 0.22, fontSize: 13, color: C.white, align: 'center', margin: 0, fit: 'shrink' })
  addBuildNotes(slide, 'Build the six modality tiles in two rows; finish with the dark guest-to-history banner.')
}

// 4. Workflow
{
  const slide = pptx.addSlide('MASTER')
  addTitle(slide, '03 / The moment of use', 'Upload once. Follow the signal.', 'Every path converges on a small, consistent result contract that a reviewer can explain.')
  const steps = [
    ['01', 'Select', 'Choose image, video, document, text, audio, or spoofing.'],
    ['02', 'Submit', 'Upload a supported file or paste text into the analyzer.'],
    ['03', 'Route', 'The API selects the detector based on modality and format.'],
    ['04', 'Review', 'Inspect score, verdict, description, and highlights.'],
    ['05', 'Save', 'Persist the report and request history when logged in.']
  ]
  steps.forEach(([num, title, body], i) => {
    const x = 0.68 + i * 2.48
    slide.addShape(pptx.ShapeType.ellipse, { x, y: 2.23, w: 0.63, h: 0.63, fill: { color: i === 4 ? C.coral : C.teal }, line: { color: i === 4 ? C.coral : C.teal } })
    slide.addText(num, { x, y: 2.43, w: 0.63, h: 0.14, fontSize: 10, bold: true, color: C.white, align: 'center', margin: 0 })
    slide.addText(title, { x: x - 0.15, y: 3.1, w: 0.95, h: 0.22, fontSize: 14, bold: true, color: C.ink, align: 'center', margin: 0 })
    slide.addText(body, { x: x - 0.35, y: 3.52, w: 1.42, h: 0.75, fontSize: 10, color: C.muted, align: 'center', margin: 0, fit: 'shrink' })
    if (i < steps.length - 1) addFlowArrow(slide, x + 0.92, 2.38, i === 2 ? 'API route' : '')
  })
  slide.addShape(pptx.ShapeType.roundRect, { x: 1.05, y: 5.22, w: 11.1, h: 0.78, rectRadius: 0.04, fill: { color: C.tealLight }, line: { color: C.tealLight } })
  slide.addText('Result: risk score  •  verdict  •  explanation  •  evidence highlights  •  runtime mode', { x: 1.32, y: 5.48, w: 10.55, h: 0.2, fontSize: 14, bold: true, color: C.teal, align: 'center', margin: 0, fit: 'shrink' })
  addBuildNotes(slide, 'Wipe the five steps from left to right; pause on the result contract as the takeaway.')
}

// 5. Architecture
{
  const slide = pptx.addSlide('MASTER')
  addTitle(slide, '04 / Under the hood', 'A clean path from click to classification', 'The interface, API, detector modules, and persistence layer stay separate so the project can grow safely.')
  const layers = [
    { x: 0.75, w: 2.7, title: 'React dashboard', body: 'Vite\nModality tabs\nUpload + result UI\nAuth state', fill: C.tealLight, accent: C.teal },
    { x: 3.95, w: 2.7, title: 'FastAPI gateway', body: '/api/analyze\n/api/detect\n/api/detect-document\nValidation + CORS', fill: 'E7EEF7', accent: C.navy },
    { x: 7.15, w: 2.7, title: 'Detector modules', body: 'Image / video\nDocument\nText\nAudio / spoof', fill: C.goldLight, accent: C.gold },
    { x: 10.35, w: 2.25, title: 'Supabase', body: 'Auth\nStorage\nReports\nRequest history', fill: C.greenLight, accent: C.green }
  ]
  layers.forEach((layer, i) => {
    slide.addShape(pptx.ShapeType.roundRect, { x: layer.x, y: 2.15, w: layer.w, h: 2.4, rectRadius: 0.05, fill: { color: layer.fill }, line: { color: layer.accent, width: 1.2 } })
    slide.addText(layer.title, { x: layer.x + 0.2, y: 2.48, w: layer.w - 0.4, h: 0.3, fontSize: 16, bold: true, color: C.ink, align: 'center', margin: 0, fit: 'shrink' })
    slide.addText(layer.body, { x: layer.x + 0.3, y: 3.13, w: layer.w - 0.6, h: 1.0, fontSize: 12, color: C.muted, align: 'center', breakLine: false, valign: 'mid', margin: 0, fit: 'shrink' })
    if (i < layers.length - 1) addFlowArrow(slide, layer.x + layer.w + 0.18, 3.17, '')
  })
  slide.addText('Contract boundary', { x: 5.0, y: 5.25, w: 2.1, h: 0.2, fontSize: 10, bold: true, color: C.teal, align: 'center', charSpacing: 1, margin: 0 })
  slide.addText('The frontend can run with demo samples, a direct FastAPI backend, or a Supabase Edge Function path.', { x: 1.6, y: 5.63, w: 10.1, h: 0.3, fontSize: 13, color: C.muted, align: 'center', margin: 0, fit: 'shrink' })
  addBuildNotes(slide, 'Reveal the stack from left to right; use the arrows as the visual motion path.')
}

// 6. Detection engine
{
  const slide = pptx.addSlide('MASTER')
  addTitle(slide, '05 / Detection engine', 'Different evidence needs different eyes', 'The codebase keeps each modality honest: specialized preprocessing, model path, and fallback behavior.')
  addCard(slide, { x: 0.7, y: 2.0, w: 3.85, h: 2.1, title: 'Image + video', body: 'Xception and ResNet18 paths. Images are resized and normalized; videos sample frames and aggregate predictions.', accent: C.teal, icon: '◈' })
  addCard(slide, { x: 4.75, y: 2.0, w: 3.85, h: 2.1, title: 'Text', body: 'DeBERTa-v3 with BiLSTM, CNN, Transformer, and cross-attention fusion for synthetic writing signals.', accent: C.navy, icon: 'T' })
  addCard(slide, { x: 8.8, y: 2.0, w: 3.85, h: 2.1, title: 'Audio', body: 'Wav2Vec2 embeddings followed by CNN, BiLSTM, attention pooling, and binary classification.', accent: C.gold, icon: '♪' })
  addCard(slide, { x: 2.72, y: 4.55, w: 3.85, h: 1.65, title: 'Documents', body: 'Designed as a hybrid visual-text path with EfficientNet, EasyOCR, and DeBERTa components.', accent: C.coral, icon: '▣' })
  addCard(slide, { x: 6.77, y: 4.55, w: 3.85, h: 1.65, title: 'Spoofing', body: 'Dedicated presentation-attack contract for replay, mask, print, and synthetic media risk.', accent: C.green, icon: '盾' })
  addBuildNotes(slide, 'Reveal the top row first, then bring in documents and spoofing as the two specialist paths.')
}

// 7. API
{
  const slide = pptx.addSlide('MASTER')
  addTitle(slide, '06 / Backend contract', 'Small endpoints, predictable responses', 'FastAPI validates inputs, routes by modality, and returns JSON that the frontend can render consistently.')
  const endpoints = [
    ['/health', 'GET', 'Service readiness'],
    ['/api/analyze', 'POST', 'Unified modality analysis'],
    ['/api/detect', 'POST', 'Legacy image / video detection'],
    ['/api/detect-document', 'POST', 'Document forgery route']
  ]
  endpoints.forEach(([endpoint, method, purpose], i) => {
    const y = 2.05 + i * 0.82
    slide.addShape(pptx.ShapeType.roundRect, { x: 0.8, y, w: 6.05, h: 0.58, rectRadius: 0.03, fill: { color: i === 1 ? C.tealLight : C.white }, line: { color: C.line } })
    addPill(slide, method, 1.05, y + 0.13, 0.72, method === 'GET' ? C.greenLight : C.tealLight, method === 'GET' ? C.green : C.teal)
    slide.addText(endpoint, { x: 1.98, y: y + 0.18, w: 2.4, h: 0.16, fontFace: 'Consolas', fontSize: 11, bold: true, color: C.ink, margin: 0, fit: 'shrink' })
    slide.addText(purpose, { x: 4.35, y: y + 0.18, w: 2.2, h: 0.16, fontSize: 10.5, color: C.muted, margin: 0, fit: 'shrink' })
  })
  slide.addShape(pptx.ShapeType.roundRect, { x: 7.45, y: 2.05, w: 5.0, h: 3.85, rectRadius: 0.04, fill: { color: C.navy }, line: { color: C.navy } })
  slide.addText('RESULT CONTRACT', { x: 7.85, y: 2.43, w: 2.2, h: 0.18, fontSize: 10, bold: true, color: '8BD2D0', charSpacing: 1.2, margin: 0 })
  slide.addText(`{
  "score": 82,
  "title": "Risk detected",
  "description": "...",
  "highlights": ["..."],
  "mode": "demo_fallback"
}`, { x: 7.85, y: 2.9, w: 3.9, h: 2.2, fontFace: 'Consolas', fontSize: 14, color: C.white, margin: 0, breakLine: false, fit: 'shrink' })
  slide.addText('The mode field makes runtime readiness visible instead of hiding it.', { x: 7.85, y: 5.35, w: 3.9, h: 0.3, fontSize: 11, color: 'C9DCE3', margin: 0, fit: 'shrink' })
}

// 8. Quality / readiness
{
  const slide = pptx.addSlide('MASTER')
  addTitle(slide, '07 / Quality and readiness', 'What is working today', 'The project is structured for a credible demo and an explicit path to production-grade model evaluation.')
  addMetric(slide, 0.85, 2.05, '6', 'analysis modes', C.teal)
  addMetric(slide, 2.8, 2.05, '4', 'API routes', C.navy)
  addMetric(slide, 4.75, 2.05, '2', 'vision models', C.gold)
  addMetric(slide, 6.7, 2.05, '5+', 'test areas', C.green)
  addCard(slide, { x: 0.85, y: 3.65, w: 5.45, h: 1.9, title: 'Validated behavior', body: 'Health checks, input validation, supported extensions, modality routing, deterministic text scoring, fallback responses, preprocessing shape, and error handling are covered by backend tests.', accent: C.green, fill: C.greenLight })
  addCard(slide, { x: 6.55, y: 3.65, w: 5.45, h: 1.9, title: 'Next validation step', body: 'Add trained checkpoint files, run held-out evaluation by modality, measure false positives and false negatives, and compare model mode against demo fallback mode.', accent: C.coral, fill: C.coralLight })
}

// 9. Limitations / roadmap
{
  const slide = pptx.addSlide('MASTER')
  addTitle(slide, '08 / Roadmap', 'Move from demonstrable plumbing to measured detection', 'The architecture is in place; the next gains come from data, evaluation, and operational hardening.')
  const roadmap = [
    ['Now', 'Working product surface', 'Multi-modal UI, API routing, normalized results, auth/history integration, tests.'],
    ['Next', 'Model readiness', 'Ship and version detector checkpoints; expose model provenance and confidence calibration.'],
    ['Then', 'Evaluation', 'Build labeled validation sets and report precision, recall, calibration, and per-modality failure cases.'],
    ['Scale', 'Production hardening', 'Authentication at the API boundary, file limits, rate controls, observability, and secure deployment.']
  ]
  roadmap.forEach(([phase, title, body], i) => {
    const y = 2.0 + i * 1.05
    slide.addShape(pptx.ShapeType.ellipse, { x: 0.88, y: y + 0.12, w: 0.44, h: 0.44, fill: { color: i === 0 ? C.teal : C.white }, line: { color: C.teal, width: 1.5 } })
    slide.addText(String(i + 1), { x: 0.88, y: y + 0.27, w: 0.44, h: 0.12, fontSize: 9, bold: true, color: i === 0 ? C.white : C.teal, align: 'center', margin: 0 })
    slide.addText(phase.toUpperCase(), { x: 1.62, y, w: 0.85, h: 0.16, fontSize: 9, bold: true, color: C.teal, charSpacing: 1.1, margin: 0 })
    slide.addText(title, { x: 2.7, y: y - 0.02, w: 3.1, h: 0.24, fontSize: 15, bold: true, color: C.ink, margin: 0 })
    slide.addText(body, { x: 6.0, y: y - 0.01, w: 5.9, h: 0.35, fontSize: 11, color: C.muted, margin: 0, fit: 'shrink' })
    if (i < roadmap.length - 1) slide.addShape(pptx.ShapeType.line, { x: 1.1, y: y + 0.62, w: 0, h: 0.43, line: { color: C.line, width: 1.4 } })
  })
  slide.addShape(pptx.ShapeType.roundRect, { x: 0.85, y: 6.2, w: 11.65, h: 0.5, rectRadius: 0.03, fill: { color: C.navy }, line: { color: C.navy } })
  slide.addText('Core message: the platform can demonstrate the workflow today; model claims should follow measured validation.', { x: 1.05, y: 6.37, w: 11.25, h: 0.16, fontSize: 11.5, bold: true, color: C.white, align: 'center', margin: 0, fit: 'shrink' })
}

// 10. Close
{
  const slide = pptx.addSlide('MASTER')
  slide.background = { color: C.teal }
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: C.teal }, line: { color: C.teal } })
  slide.addText('DEEPFAKE DEFENSE', { x: 0.78, y: 1.08, w: 4, h: 0.22, fontSize: 11, bold: true, color: 'B9EFEB', charSpacing: 1.8, margin: 0 })
  slide.addText('Make authenticity\nreviewable.', { x: 0.75, y: 1.75, w: 6.6, h: 1.5, fontFace: 'Aptos Display', fontSize: 38, bold: true, color: C.white, margin: 0, fit: 'shrink' })
  slide.addText('A clear interface for a messy trust problem.', { x: 0.8, y: 3.65, w: 5.9, h: 0.35, fontSize: 18, color: 'D8F4F1', margin: 0 })
  slide.addShape(pptx.ShapeType.roundRect, { x: 8.0, y: 1.55, w: 3.85, h: 3.85, rectRadius: 0.08, fill: { color: C.navy, transparency: 5 }, line: { color: '77C9C7', width: 1.2 } })
  slide.addText('INPUT', { x: 8.55, y: 2.1, w: 1, h: 0.16, fontSize: 9, bold: true, color: '8BD2D0', charSpacing: 1.3, margin: 0 })
  slide.addText('media\ntext\nvoice\ndocuments', { x: 8.55, y: 2.48, w: 2.5, h: 1.45, fontSize: 20, bold: true, color: C.white, margin: 0, breakLine: false })
  slide.addShape(pptx.ShapeType.line, { x: 8.55, y: 4.24, w: 2.55, h: 0, line: { color: '5C8B9C', width: 1 } })
  slide.addText('OUTPUT', { x: 8.55, y: 4.52, w: 1, h: 0.16, fontSize: 9, bold: true, color: '8BD2D0', charSpacing: 1.3, margin: 0 })
  slide.addText('risk score\nreview highlights\ntraceable report', { x: 8.55, y: 4.87, w: 2.6, h: 0.9, fontSize: 16, color: C.white, margin: 0, breakLine: false })
  slide.addText('Thank you', { x: 0.8, y: 6.55, w: 2, h: 0.25, fontSize: 13, bold: true, color: C.white, margin: 0 })
}

const outputDir = path.resolve(process.cwd(), '..', 'docs')
fs.mkdirSync(outputDir, { recursive: true })
const outputPath = path.join(outputDir, 'AI-Detection-Project-Presentation.pptx')
await pptx.writeFile({ fileName: outputPath })
console.log(`Created ${outputPath}`)
