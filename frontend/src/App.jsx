import { useState } from 'react'
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

function App() {
  const [activeModule, setActiveModule] = useState(modules[0].id)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('signin')
  const [authMessage, setAuthMessage] = useState('')
  const [authData, setAuthData] = useState({ name: '', email: '', password: '' })
  const selectedModule = modules.find((module) => module.id === activeModule) ?? modules[0]

  const handleAuthSubmit = (event) => {
    event.preventDefault()
    setAuthMessage(
      authMode === 'signin'
        ? 'Welcome back! You are now signed in.'
        : 'Account created successfully. You can now continue.'
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">AI</div>
          <div>
            <p className="brand-title">Deepfake Defense</p>
            <span className="brand-subtitle">Deepfake and media authenticity platform</span>
          </div>
        </div>
        <nav className="topnav" aria-label="Primary navigation">
          <a href="#modules">Modules</a>
          <a href="#workflow">Workflow</a>
          <a href="#upload">Analyze</a>
          <div className="auth-actions">
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                setAuthMode('signin')
                setAuthOpen(true)
                setAuthMessage('')
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              className="primary-btn compact"
              onClick={() => {
                setAuthMode('signup')
                setAuthOpen(true)
                setAuthMessage('')
              }}
            >
              Sign up
            </button>
          </div>
        </nav>
      </header>

      {authOpen && (
        <div className="auth-overlay" role="dialog" aria-modal="true" aria-label="Authentication">
          <div className="auth-card">
            <div className="auth-card-head">
              <div>
                <p className="eyebrow">Secure access</p>
                <h2>{authMode === 'signin' ? 'Welcome back' : 'Create your account'}</h2>
              </div>
              <button type="button" className="close-btn" onClick={() => setAuthOpen(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="auth-form">
              {authMode === 'signup' && (
                <input
                  type="text"
                  placeholder="Full name"
                  value={authData.name}
                  onChange={(event) =>
                    setAuthData((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                />
              )}
              <input
                type="email"
                placeholder="Email address"
                value={authData.email}
                onChange={(event) =>
                  setAuthData((current) => ({ ...current, email: event.target.value }))
                }
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={authData.password}
                onChange={(event) =>
                  setAuthData((current) => ({ ...current, password: event.target.value }))
                }
                required
              />

              <div className="form-actions">
                <button type="submit" className="primary-btn">
                  {authMode === 'signin' ? 'Sign in' : 'Create account'}
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                >
                  {authMode === 'signin' ? 'Need an account?' : 'Already have one?'}
                </button>
              </div>
            </form>

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

        <section className="content-grid" id="modules">
          <div className="panel-card">
            <div className="section-heading">
              <p className="eyebrow">Detection suite</p>
              <h2>Choose a module</h2>
            </div>
            <div className="card-grid">
              {modules.map((module) => (
                <button
                  key={module.id}
                  type="button"
                  className={`module-card ${activeModule === module.id ? 'active' : ''}`}
                  onClick={() => setActiveModule(module.id)}
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
            <button type="button" className="primary-btn">
              Choose file
            </button>
            <span>Supports mp4, wav, jpg, png, pdf, and txt</span>
          </div>
        </section>
      </main>

      <footer className="footer">Built for secure digital trust and content verification.</footer>
    </div>
  )
}

export default App
