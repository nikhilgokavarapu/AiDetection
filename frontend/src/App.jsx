import { useEffect, useState } from 'react'
import FakeNewsDetection from './components/FakeNewsDetection.jsx'
import { supabase } from './lib/supabase.js'
import './App.css'

const modules = [
  {
    id: 'video',
    name: 'Deepfake Video',
    icon: '🎬',
    desc: 'Inspect facial movement, blinking, lip-sync, and temporal consistency in video content.',
    signal: 'Frame-to-frame anomaly score',
    detail: 'High confidence for manipulated facial sequences or synthetic frame blending.',
    useCases: ['Media verification', 'Identity fraud detection', 'Political content validation'],
    riskFactors: ['Facial swap synthesis', 'Lip-sync mismatches', 'Temporal inconsistencies'],
    features: ['Optical flow analysis', 'Facial landmark tracking', '3D face reconstruction detection']
  },
  {
    id: 'spoofing',
    name: 'Spoofing Detection',
    icon: '🛡️',
    desc: 'Identify presentation attacks such as replay, mask, and print-based impersonation.',
    signal: 'Presentation attack risk',
    detail: 'Flags spoofed access attempts using physical or digital impersonation cues.',
    useCases: ['Biometric security', 'Access control', 'Identity verification'],
    riskFactors: ['Replay attacks', 'Silicone masks', 'Printed photos', 'Video display attacks'],
    features: ['Liveness detection', 'Texture analysis', 'Multi-spectral imaging']
  },
  {
    id: 'image',
    name: 'Image Forensics',
    icon: '🖼️',
    desc: 'Analyze lighting, noise, compression artifacts, and editing traces across still images.',
    signal: 'Tampering likelihood',
    detail: 'Detects enhanced, stitched, or AI-generated visual changes with strong precision.',
    useCases: ['Evidence authenticity', 'Social media verification', 'News media validation'],
    riskFactors: ['Splicing artifacts', 'Copy-move forgery', 'AI-generated content', 'Lighting anomalies'],
    features: ['Noise inconsistency detection', 'JPEG compression artifacts', 'Error level analysis']
  },
  {
    id: 'text',
    name: 'Text Verification',
    icon: '✍️',
    desc: 'Verify content authenticity by examining stylometry, semantic drift, and synthetic writing cues.',
    signal: 'Authorship consistency',
    detail: 'Evaluates whether a passage aligns with the expected source or writing pattern.',
    useCases: ['Author attribution', 'News authenticity', 'AI-generated content detection'],
    riskFactors: ['Style inconsistency', 'Semantic shifts', 'Grammar patterns', 'Vocabulary anomalies'],
    features: ['Stylometry analysis', 'Entropy measurement', 'N-gram probability']
  },
  {
    id: 'audio',
    name: 'Audio Analysis',
    icon: '🎧',
    desc: 'Check voice cloning, synthetic speech, and speech artifact inconsistencies in audio files.',
    signal: 'Voice synthesis risk',
    detail: 'Exposes cloned voice patterns and abnormal waveform characteristics.',
    useCases: ['Voice biometric security', 'Call center authentication', 'Media verification'],
    riskFactors: ['Voice cloning', 'Synthetic speech', 'Background noise artifacts', 'Pitch anomalies'],
    features: ['Spectral analysis', 'Prosody detection', 'Formant frequency tracking']
  }
]

function AppContent() {
  const [activeModule, setActiveModule] = useState(modules[0].id)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [authMessage, setAuthMessage] = useState('')
  const [authData, setAuthData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const selectedModule = modules.find((module) => module.id === activeModule) ?? modules[0]

  const isAuthenticated = Boolean(user)

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 500)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false)
      return undefined
    }

    let mounted = true
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setUser(session?.user ?? null)
        setAuthLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const openAuth = () => {
    setAuthOpen(true)
    setAuthMode('login')
    setAuthMessage('')
  }

  const handleAuthSubmit = (event) => {
    event.preventDefault()
    if (!supabase) {
      setAuthMessage('Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to your .env file.')
      return
    }

    setAuthMessage('')
    const authAction = authMode === 'signup'
      ? supabase.auth.signUp({ email: authData.email, password: authData.password })
      : supabase.auth.signInWithPassword({ email: authData.email, password: authData.password })

    authAction.then(({ data, error }) => {
      if (error) {
        setAuthMessage(error.message)
        return
      }
      if (authMode === 'signup' && !data.session) {
        setAuthMessage('Check your email to confirm your account, then log in.')
        return
      }
      setAuthOpen(false)
      setAuthData({ email: '', password: '' })
    })
  }

  const handleSignOut = async () => {
    await supabase?.auth.signOut()
  }

  const handleModuleSelect = (moduleId) => {
    setActiveModule(moduleId)
  }

  return (
    <div id="top" className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">AI</div>
          <div>
            <p className="brand-title">Deepfake Defense</p>
            <span className="brand-subtitle">Deepfake and media authenticity platform</span>
          </div>
        </div>
        <nav className="topnav" aria-label="Primary navigation">
          <a href="#top">Home</a>
          <a href="#about">About</a>
          <a href="#modules">Modules</a>
          <a href="#fake-news-module">Analyzer</a>
          <a href="#showcase">Capabilities</a>
          <a href="#details">Details</a>
          <a href="#workflow">Workflow</a>
          <a href="#contact">Contact</a>
          <div className="auth-actions">
            {isAuthenticated ? (
              <>
                <span className="user-greeting">
                  Hi, {user.email?.split('@')[0]}
                </span>
                <button type="button" className="ghost-btn" onClick={handleSignOut}>
                  Sign out
                </button>
              </>
            ) : (
              <button type="button" className="primary-btn compact" onClick={openAuth}>
                Login
              </button>
            )}
          </div>
        </nav>
      </header>

      {authOpen && (
        <div className="auth-overlay" role="dialog" aria-modal="true" aria-label="Login">
          <div className="auth-card">
            <div className="auth-card-head">
              <div>
                <p className="eyebrow">Quick access</p>
                <h2>Login to continue</h2>
                <p className="auth-subtitle">
                  Use your email to unlock modules, workflow, and file analysis.
                </p>
              </div>
              <button type="button" className="close-btn" onClick={() => setAuthOpen(false)}>
                ×
              </button>
            </div>

            <div className="auth-divider">
              <span>{authMode === 'signup' ? 'Create your account' : 'Login with email'}</span>
            </div>

            <form onSubmit={handleAuthSubmit} className="auth-form">
              <input
                type="email"
                placeholder="Email address"
                value={authData.email}
                onChange={(event) =>
                  setAuthData((current) => ({ ...current, email: event.target.value }))
                }
                required
              />
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={authData.password}
                  onChange={(event) =>
                    setAuthData((current) => ({ ...current, password: event.target.value }))
                  }
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              <button type="submit" className="primary-btn login-submit" disabled={authLoading}>
                {authMode === 'signup' ? 'Create account' : 'Login'}
              </button>
            </form>

            <button
              type="button"
              className="footer-link-btn auth-switch"
              onClick={() => {
                setAuthMode((mode) => mode === 'login' ? 'signup' : 'login')
                setAuthMessage('')
              }}
            >
              {authMode === 'signup' ? 'Already have an account? Login' : 'Need an account? Sign up'}
            </button>

            {authMessage && <p className="auth-message">{authMessage}</p>}
          </div>
        </div>
      )}

      <main className="dashboard-grid">
        <section className="hero-card">
          <div className="hero-copy">
            <p className="eyebrow">Integrated detection platform</p>
            <h1>Defend against deepfakes, spoofing, tampered media, and synthetic text.</h1>
            <p className="hero-text">
              A secure and intelligent workspace for verifying authenticity across video, audio, images, text, and presentation attacks.
            </p>
            <div className="hero-actions">
              <a className="primary-btn" href="#upload">
                Start analysis
              </a>
              <a className="secondary-btn" href="#modules">
                Explore modules
              </a>
            </div>
            <div className="stats-row">
              <div className="stat">
                <strong>5+</strong>
                <span>modalities</span>
              </div>
              <div className="stat">
                <strong>24/7</strong>
                <span>threat scan</span>
              </div>
              <div className="stat">
                <strong>98%</strong>
                <span>coverage</span>
              </div>
            </div>
          </div>

          <div className="hero-panel" aria-label="Threat overview">
            <p className="panel-label">Threat score</p>
            <div className="panel-ring">94.8%</div>
            <div className="panel-grid">
              <div>
                <p>Video</p>
                <strong>High</strong>
              </div>
              <div>
                <p>Audio</p>
                <strong>Medium</strong>
              </div>
              <div>
                <p>Text</p>
                <strong>Low</strong>
              </div>
              <div>
                <p>Spoofing</p>
                <strong>High</strong>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="panel-card about-section">
          <div className="section-heading">
            <p className="eyebrow">About us</p>
            <h2>What is Deepfake Defense?</h2>
          </div>
          <div className="about-grid">
            <div className="about-block">
              <h3>Our mission</h3>
              <p>
                Deepfake Defense is an AI-powered media authenticity platform built to protect individuals,
                organizations, and institutions from manipulated digital content. We combine advanced detection
                models across video, audio, image, text, and biometric spoofing to deliver fast, reliable
                verification results.
              </p>
            </div>
            <div className="about-block">
              <h3>Why it matters</h3>
              <p>
                Synthetic media and deepfakes are growing threats to trust in news, finance, identity systems,
                and public discourse. Our platform helps analysts, security teams, and content moderators
                identify tampered or AI-generated material before it causes harm.
              </p>
            </div>
            <div className="about-block">
              <h3>Get started</h3>
              <p>
                Browse our modules and workflow to learn how detection works. You can analyze content and
                switch modules without an account; login is optional if you want a personalized session.
              </p>
              {!isAuthenticated && (
                <div className="about-auth-cta">
                  <button type="button" className="primary-btn compact" onClick={openAuth}>
                    Login (optional)
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="content-grid" id="modules">
          <div className="panel-card">
            <div className="section-heading">
              <p className="eyebrow">Detection suite</p>
              <h2>Choose a module</h2>
              {!isAuthenticated && (
                <p className="auth-hint">Login is optional. You can select modules and analyze content as a guest.</p>
              )}
            </div>
            <div className="card-grid">
              {modules.map((module) => (
                <button
                  key={module.id}
                  type="button"
                  className={`module-card ${activeModule === module.id ? 'active' : ''}`}
                  onClick={() => handleModuleSelect(module.id)}
                >
                  <span className="module-icon">{module.icon}</span>
                  <h3>{module.name}</h3>
                  <p>{module.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="panel-card insight-panel">
            <div className="section-heading">
              <p className="eyebrow">Selected module</p>
              <h2>{selectedModule.name}</h2>
            </div>
            <div className="insight-box">
              <p className="insight-label">Detection signal</p>
              <strong>{selectedModule.signal}</strong>
              <span>{selectedModule.detail}</span>
            </div>
            <div className="info-section">
              <p className="info-title">Use cases</p>
              <ul className="info-list">
                {selectedModule.useCases.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="info-section">
              <p className="info-title">Risk factors</p>
              <ul className="info-list">
                {selectedModule.riskFactors.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="info-section">
              <p className="info-title">Key features</p>
              <ul className="info-list">
                {selectedModule.features.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <FakeNewsDetection user={user} onLogin={openAuth} />

        <section id="details" className="panel-card details-section">
          <div className="section-heading">
            <p className="eyebrow">Platform details</p>
            <h2>Technical specifications & capabilities</h2>
          </div>
          <div className="details-grid">
            <div className="detail-card">
              <h3>Supported formats</h3>
              <ul className="info-list">
                <li>Video: MP4, AVI, MOV, WebM</li>
                <li>Audio: WAV, MP3, FLAC, OGG</li>
                <li>Image: JPG, PNG, WebP, TIFF</li>
                <li>Text: TXT, PDF, DOCX</li>
              </ul>
            </div>
            <div className="detail-card">
              <h3>Detection models</h3>
              <ul className="info-list">
                <li>Temporal consistency analysis for video</li>
                <li>Presentation attack detection (PAD)</li>
                <li>Forensic artifact & noise analysis</li>
                <li>Stylometry & semantic drift scoring</li>
                <li>Voice synthesis & spectral fingerprinting</li>
              </ul>
            </div>
            <div className="detail-card">
              <h3>Performance</h3>
              <ul className="info-list">
                <li>Average analysis time: under 30 seconds</li>
                <li>Confidence scoring with explainability</li>
                <li>Batch processing support</li>
                <li>API-ready architecture</li>
              </ul>
            </div>
            <div className="detail-card">
              <h3>Security</h3>
              <ul className="info-list">
                <li>End-to-end encrypted uploads</li>
                <li>No permanent storage of analyzed media</li>
                <li>Secure email authentication</li>
                <li>Role-based access controls</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="workflow" className="panel-card workflow-card">
          <div className="section-heading">
            <p className="eyebrow">Workflow</p>
            <h2>From upload to verdict in three steps</h2>
          </div>
          <div className="workflow-grid">
            <div className="workflow-card">
              <span>01</span>
              <h3>Upload content</h3>
              <p>Drop images, audio, text, or video into the secure intake panel.</p>
            </div>
            <div className="workflow-card">
              <span>02</span>
              <h3>Run analysis</h3>
              <p>Apply deepfake, spoofing, and authenticity models to each modality.</p>
            </div>
            <div className="workflow-card">
              <span>03</span>
              <h3>Review verdict</h3>
              <p>Get a clear confidence score and explanation for the final result.</p>
            </div>
          </div>
        </section>

        <section id="showcase" className="panel-card showcase-section">
          <div className="section-heading">
            <p className="eyebrow">What you can do</p>
            <h2>See the platform capabilities in action</h2>
          </div>
          <div className="showcase-grid">
            <div className="showcase-copy">
              <div className="showcase-box">
                <h3>Completed features</h3>
                <ul className="feature-list">
                  <li>Multi-modal upload support for image, text, video, and audio</li>
                  <li>Live demo result preview for fake-news analysis</li>
                  <li>Interactive module selection and guided workflow</li>
                  <li>User-friendly auth and secure access</li>
                </ul>
              </div>
              <div className="showcase-box">
                <h3>Supported file types</h3>
                <ul className="feature-list">
                  <li>Image: JPG, PNG, WebP, TIFF</li>
                  <li>Text: TXT, PDF, DOCX</li>
                  <li>Video: MP4, AVI, MOV, WebM</li>
                  <li>Audio: WAV, MP3, FLAC, OGG</li>
                </ul>
              </div>
              <div className="showcase-box">
                <h3>Example use cases</h3>
                <ul className="feature-list">
                  <li>Fake-news verification for social media posts</li>
                  <li>Deepfake detection in investigative reporting</li>
                  <li>Audio cloning and voice spoofing risk checks</li>
                  <li>Image forgery and tampering validation</li>
                </ul>
              </div>
            </div>
            <div className="demo-card">
              <div className="demo-card-header">
                <p className="eyebrow">Live demo</p>
                <h3>Sample fake-news analysis result</h3>
              </div>
              <div className="demo-metrics">
                <div>
                  <span className="metric-label">Confidence</span>
                  <strong>87%</strong>
                </div>
                <div>
                  <span className="metric-label">Risk level</span>
                  <strong>High</strong>
                </div>
                <div>
                  <span className="metric-label">Module</span>
                  <strong>Image + Text</strong>
                </div>
              </div>
              <div className="demo-summary">
                <p>AI-generated language and tampering traces detected in submitted content.</p>
              </div>
              <ul className="demo-highlights">
                <li>Semantic mismatch and abnormal phrasing</li>
                <li>Image metadata irregularities visible</li>
                <li>Audio synthesis signature flagged</li>
              </ul>
              <button
                type="button"
                className="primary-btn demo-cta"
                onClick={() => document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Try the demo flow
              </button>
            </div>
          </div>
        </section>

        <section id="upload" className="panel-card upload-card">
          <div>
            <p className="eyebrow">Upload media</p>
            <h2>Analyze suspicious files in seconds.</h2>
            <p>
              Drag and drop videos, audio, images, or text to inspect authenticity and spoof risk.
            </p>
          </div>
          <div className="upload-box">
            <p>Drop files here or</p>
            <a className="primary-btn" href="#fake-news-module">
              Open analyzer
            </a>
            <span>Supports mp4, wav, jpg, png, pdf, and txt</span>
          </div>
        </section>

        <section id="contact" className="panel-card contact-section">
          <div className="section-heading">
            <p className="eyebrow">Contact us</p>
            <h2>Get in touch with our team</h2>
          </div>
          <div className="contact-grid">
            <div className="contact-info">
              <p>
                Have questions about Deepfake Defense, partnerships, or enterprise deployment?
                Reach out to us — we typically respond within 24 hours.
              </p>
              <div className="contact-emails">
                <a href="mailto:gandhamprakashtech@gmail.com">gandhamprakashtech@gmail.com</a>
                <a href="mailto:nikhilgokavarapu9@gmail.com">nikhilgokavarapu9@gmail.com</a>
              </div>
            </div>
            <form
              className="contact-form"
              onSubmit={(event) => {
                event.preventDefault()
                alert('Thank you! Your message has been sent.')
              }}
            >
              <input type="text" placeholder="Your name" required />
              <input type="email" placeholder="Your email" required />
              <textarea placeholder="Your message" rows={4} required />
              <button type="submit" className="primary-btn">Send message</button>
            </form>
          </div>
        </section>
      </main>

      {showBackToTop && (
        <a className="back-to-top" href="#top" aria-label="Back to top" title="Back to top">
          <span aria-hidden="true">↑</span>
        </a>
      )}

      <footer className="site-footer">
        <div className="footer-columns">
          <div className="footer-col">
            <h4>Get to Know Us</h4>
            <ul>
              <li><a href="#about">About Deepfake Defense</a></li>
              <li><a href="#details">Platform Details</a></li>
              <li><a href="#modules">Detection Modules</a></li>
              <li><a href="#workflow">How It Works</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Services</h4>
            <ul>
              <li><a href="#modules">Video Analysis</a></li>
              <li><a href="#modules">Audio Verification</a></li>
              <li><a href="#modules">Image Forensics</a></li>
              <li><a href="#upload">File Upload & Scan</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Contact Us</h4>
            <ul>
              <li>
                <a href="mailto:gandhamprakashtech@gmail.com">gandhamprakashtech@gmail.com</a>
              </li>
              <li>
                <a href="mailto:nikhilgokavarapu9@gmail.com">nikhilgokavarapu9@gmail.com</a>
              </li>
              <li><a href="#contact">Send a Message</a></li>
              <li><a href="#contact">Support</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Legal & Account</h4>
            <ul>
              <li><a href="#about">Privacy Policy</a></li>
              <li><a href="#about">Terms of Service</a></li>
              <li>
                <button type="button" className="footer-link-btn" onClick={openAuth}>
                  Login
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-brand">
            <div className="brand-mark small">AI</div>
            <span>Deepfake Defense</span>
          </div>
          <p className="footer-copy">
            © {new Date().getFullYear()} Deepfake Defense. Built for secure digital trust and content verification.
          </p>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return <AppContent />
}

export default App
