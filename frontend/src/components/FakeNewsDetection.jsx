import { useState } from 'react'

const modalities = [
  {
    id: 'image',
    label: 'Image',
    desc: 'Upload suspicious images to detect manipulation, deepfake traces, and tampering artifacts.',
    accept: 'image/*'
  },
  {
    id: 'text',
    label: 'Text',
    desc: 'Upload or paste text to inspect for AI-generated content, semantic drift, and fake-news signals.',
    accept: '.txt,.pdf,.docx'
  },
  {
    id: 'video',
    label: 'Video',
    desc: 'Upload video evidence to review temporal consistency, lip-sync anomalies, and frame integrity.',
    accept: 'video/*'
  },
  {
    id: 'audio',
    label: 'Audio',
    desc: 'Upload audio to analyze voice cloning, synthesis artifacts, and suspicious spectral patterns.',
    accept: 'audio/*'
  },
  {
    id: 'spoof',
    label: 'Spoofing',
    desc: 'Optionally evaluate biometric and presentation attack risk in submitted media.',
    accept: 'image/*,video/*,audio/*'
  }
]

const sampleResults = {
  image: {
    title: 'Image tampering risk detected',
    score: '82%',
    description: 'Metadata mismatch and editing artifacts indicate a high possibility of manipulated content.',
    highlights: ['Lighting inconsistency', 'Compression artifact anomalies', 'Potential copy-move editing']
  },
  text: {
    title: 'Synthetic writing pattern detected',
    score: '88%',
    description: 'Stylometry and semantic drift suggest the text may have been generated or altered by AI.',
    highlights: ['Unnatural phrasing', 'Repetitive structure', 'Low stylistic coherence']
  },
  video: {
    title: 'Deepfake indicators flagged',
    score: '79%',
    description: 'Motion irregularities and facial artifact patterns are consistent with synthetic video generation.',
    highlights: ['Lip-sync misalignment', 'Frame blending artifacts', 'Unstable face landmarks']
  },
  audio: {
    title: 'Voice synthesis risk identified',
    score: '85%',
    description: 'Spectral signatures and prosody anomalies indicate a strong chance of synthetic speech.',
    highlights: ['Unnatural pitch contour', 'Background noise mismatch', 'High formant steadiness']
  },
  spoof: {
    title: 'Presentation attack risk high',
    score: '68%',
    description: 'Spoof detection flags suggest this sample may be a replay, mask, or synthetic presentation attack.',
    highlights: ['Liveness signal missing', 'Texture uniformity detected', 'Reflected-display patterns']
  }
}

function FakeNewsDetection() {
  const [activeTab, setActiveTab] = useState('image')
  const [selectedFile, setSelectedFile] = useState(null)
  const [manualText, setManualText] = useState('')
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const activeModality = modalities.find((item) => item.id === activeTab)

  const resetState = () => {
    setSelectedFile(null)
    setManualText('')
    setStatus('idle')
    setResult(null)
    setError('')
  }

  const switchTab = (tabId) => {
    setActiveTab(tabId)
    resetState()
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] ?? null
    setSelectedFile(file)
    setStatus('idle')
    setResult(null)
    setError('')
  }

  const handleRunAnalysis = () => {
    if (activeTab === 'text') {
      if (!manualText.trim() && !selectedFile) {
        setError('Paste text or upload a text file to start analysis.')
        return
      }
    } else {
      if (!selectedFile) {
        setError('Upload a file to start analysis.')
        return
      }
    }

    setError('')
    setStatus('analyzing')

    setTimeout(() => {
      setStatus('done')
      setResult(sampleResults[activeTab])
    }, 1100)
  }

  const fileLabel = selectedFile ? selectedFile.name : 'No file selected yet.'

  return (
    <section id="fake-news-module" className="panel-card fake-news-panel">
      <div className="section-heading">
        <p className="eyebrow">Fake News Detection</p>
        <h2>Analyze suspicious media and content across every modality</h2>
      </div>

      <div className="detection-tabs">
        {modalities.map((modality) => (
          <button
            key={modality.id}
            type="button"
            className={`detection-tab ${activeTab === modality.id ? 'active' : ''}`}
            onClick={() => switchTab(modality.id)}
          >
            {modality.label}
          </button>
        ))}
      </div>

      <div className="detection-main">
        <div className="detection-panel">
          <p className="detection-copy">{activeModality?.desc}</p>

          <label htmlFor="fake-news-upload" className="upload-input-label">
            <span>{activeTab === 'text' ? 'Upload text file' : 'Choose file'}</span>
            <input
              id="fake-news-upload"
              type="file"
              accept={activeModality?.accept}
              onChange={handleFileChange}
            />
          </label>

          <div className="file-summary">
            <strong>Selected</strong>
            <span>{fileLabel}</span>
          </div>

          {activeTab === 'text' && (
            <textarea
              className="manual-textarea"
              value={manualText}
              onChange={(event) => {
                setManualText(event.target.value)
                setStatus('idle')
                setResult(null)
                setError('')
              }}
              placeholder="Paste suspicious article text, social post copy, or news content here..."
            />
          )}

          {error && <p className="error-text">{error}</p>}

          <div className="analysis-actions">
            <button type="button" className="primary-btn" onClick={handleRunAnalysis}>
              Run analysis
            </button>
            <button type="button" className="ghost-btn compact" onClick={resetState}>
              Reset
            </button>
          </div>

          <div className="analysis-hint">
            <p>Supported formats: JPG, PNG, WebP, TIFF, MP4, AVI, MOV, WebM, WAV, MP3, FLAC, OGG, TXT, PDF, DOCX.</p>
          </div>
        </div>

        <div className="result-panel">
          <div className="result-header">
            <p className="eyebrow">Result preview</p>
            <h3>Fake news analysis output</h3>
          </div>

          <div className="result-box">
            {status === 'idle' && <p>Select a modality and upload content to begin analysis.</p>}
            {status === 'analyzing' && <p>Analyzing content — this may take a moment.</p>}
            {status === 'done' && result && (
              <>
                <div className="result-score">
                  <span>{result.score}</span>
                  <p>{result.title}</p>
                </div>
                <p className="result-desc">{result.description}</p>
                <ul className="result-highlights">
                  {result.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default FakeNewsDetection
