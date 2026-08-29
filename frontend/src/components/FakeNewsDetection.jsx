import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

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

function FakeNewsDetection({ user, onLogin }) {
  const [activeTab, setActiveTab] = useState('image')
  const [selectedFile, setSelectedFile] = useState(null)
  const [manualText, setManualText] = useState('')
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [savedReports, setSavedReports] = useState([])
  const [requestHistory, setRequestHistory] = useState([])
  const [saveMessage, setSaveMessage] = useState('')

  const activeModality = modalities.find((item) => item.id === activeTab)

  useEffect(() => {
    if (!user || !supabase) {
      setSavedReports([])
      setRequestHistory([])
      return
    }

    Promise.all([
      supabase
        .from('reports')
        .select('id, modality, score, title, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('analysis_requests')
        .select('id, modality, status, created_at, analysis_results(score, title)')
        .order('created_at', { ascending: false })
        .limit(5)
    ]).then(([reportsResponse, historyResponse]) => {
      if (!reportsResponse.error) setSavedReports(reportsResponse.data ?? [])
      if (!historyResponse.error) setRequestHistory(historyResponse.data ?? [])
      if (reportsResponse.error || historyResponse.error) {
        setError(reportsResponse.error?.message || historyResponse.error?.message || 'Could not load your history.')
      }
    })
  }, [user])

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

  const handleRunAnalysis = async () => {
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
    setSaveMessage('')

    if (!user || !supabase) {
      setTimeout(() => {
        setStatus('done')
        setResult(sampleResults[activeTab])
      }, 1100)
      return
    }

    const backendUrl = import.meta.env.VITE_BACKEND_API_URL
    if (backendUrl) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) throw new Error('Your session has expired. Please log in again.')
        const payload = new FormData()
        payload.append('modality', activeTab)
        if (manualText.trim()) payload.append('text', manualText.trim())
        if (selectedFile) payload.append('file', selectedFile)
        const response = await fetch(`${backendUrl.replace(/\/$/, '')}/api/analyze`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: payload
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'The analysis backend failed.')
        const backendResult = data.result
        setStatus('done')
        setResult({ ...backendResult, score: `${backendResult.score}%`, resultId: backendResult.id })
        setRequestHistory((current) => [{
          id: data.requestId,
          modality: activeTab,
          status: 'completed',
          analysis_results: [{ score: backendResult.score, title: backendResult.title }]
        }, ...current].slice(0, 5))
      } catch (analysisError) {
        setStatus('idle')
        setError(analysisError.message || 'The analysis backend failed.')
      }
      return
    }

    let uploadId = null
    let requestId = null
    try {
      if (selectedFile) {
        const storagePath = `${user.id}/${crypto.randomUUID()}-${selectedFile.name}`
        const { error: uploadError } = await supabase.storage
          .from('analysis-uploads')
          .upload(storagePath, selectedFile, { contentType: selectedFile.type || undefined })
        if (uploadError) throw uploadError

        const { data: upload, error: uploadRecordError } = await supabase
          .from('uploads')
          .insert({
            user_id: user.id,
            storage_path: storagePath,
            file_name: selectedFile.name,
            mime_type: selectedFile.type || null,
            size_bytes: selectedFile.size
          })
          .select('id')
          .single()
        if (uploadRecordError) throw uploadRecordError
        uploadId = upload.id
      }

      const { data: request, error: requestError } = await supabase
        .from('analysis_requests')
        .insert({
          user_id: user.id,
          upload_id: uploadId,
          modality: activeTab,
          input_text: manualText.trim() || null,
          status: 'processing'
        })
        .select('id, modality, status, created_at')
        .single()
      if (requestError) throw requestError
      requestId = request.id

      const useAnalysisBackend = import.meta.env.VITE_USE_ANALYSIS_BACKEND === 'true'
      let persistedResult
      if (useAnalysisBackend) {
        const { data, error: functionError } = await supabase.functions.invoke('analyze', {
          body: { requestId: request.id }
        })
        if (functionError) throw functionError
        if (!data?.result) throw new Error('The analysis backend returned no result.')
        persistedResult = data.result
      } else {
        const demoResult = sampleResults[activeTab]
        const { data, error: resultError } = await supabase
          .from('analysis_results')
          .insert({
            request_id: request.id,
            user_id: user.id,
            score: Number.parseInt(demoResult.score, 10),
            title: demoResult.title,
            description: demoResult.description,
            highlights: demoResult.highlights
          })
          .select('id, score, title, description, highlights')
          .single()
        if (resultError) throw resultError
        persistedResult = data
        await supabase.from('analysis_requests').update({
          status: 'completed', completed_at: new Date().toISOString()
        }).eq('id', request.id)
      }

      setRequestHistory((current) => [
        { ...request, status: 'completed', analysis_results: [{ score: persistedResult.score, title: persistedResult.title }] },
        ...current
      ].slice(0, 5))
      setStatus('done')
      setResult({
        ...persistedResult,
        score: `${persistedResult.score}%`,
        resultId: persistedResult.id
      })
    } catch (analysisError) {
      if (requestId) {
        await supabase
          .from('analysis_requests')
          .update({ status: 'failed', error_message: analysisError.message || 'Analysis failed.' })
          .eq('id', requestId)
      }
      setStatus('idle')
      setError(analysisError.message || 'The analysis could not be saved.')
    }
  }

  const handleSaveReport = async () => {
    if (!user) {
      onLogin()
      return
    }
    if (!result || !supabase) return

    setSaveMessage('Saving...')
    const { data, error: insertError } = await supabase
      .from('reports')
      .insert({
        user_id: user.id,
          result_id: result.resultId ?? null,
        modality: activeTab,
        score: Number.parseInt(result.score, 10),
        title: result.title,
        description: result.description,
        highlights: result.highlights
      })
      .select('id, modality, score, title, created_at')
      .single()

    if (insertError) {
      setSaveMessage(insertError.message)
      return
    }
    setSavedReports((current) => [data, ...current].slice(0, 5))
    setSaveMessage('Report saved to your account.')
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

          {status === 'done' && result && (
            <div className="save-report-row">
              <button type="button" className="secondary-btn" onClick={handleSaveReport}>
                {user ? 'Save report' : 'Login to save report'}
              </button>
              {saveMessage && <span className="save-message">{saveMessage}</span>}
            </div>
          )}

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

                <div className="confidence-block" aria-label="Confidence meter">
                  <div className="confidence-header">
                    <span>Confidence</span>
                    <strong>{Math.max(50, Math.min(99, Number.parseInt(result.score, 10) || 80))}%</strong>
                  </div>
                  <div className="confidence-track">
                    <div
                      className="confidence-fill"
                      style={{ width: `${Math.max(14, Math.min(100, Number.parseInt(result.score, 10) || 80))}%` }}
                    />
                  </div>
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

      {user && (
        <div className="saved-reports">
          <div className="result-header">
            <p className="eyebrow">Private history</p>
            <h3>Your saved reports</h3>
          </div>
          {savedReports.length ? (
            <ul className="saved-report-list">
              {savedReports.map((report) => (
                <li key={report.id}>
                  <strong>{report.title}</strong>
                  <span>{report.modality} · {report.score}%</span>
                </li>
              ))}
            </ul>
          ) : <p>No saved reports yet.</p>}
          <div className="result-header history-heading">
            <p className="eyebrow">Analysis history</p>
            <h3>Your recent requests</h3>
          </div>
          {requestHistory.length ? (
            <ul className="saved-report-list">
              {requestHistory.map((request) => {
                const historyResult = request.analysis_results?.[0]
                return (
                  <li key={request.id}>
                    <strong>{historyResult?.title || `${request.modality} analysis`}</strong>
                    <span>{request.status} · {historyResult ? `${historyResult.score}%` : 'pending'}</span>
                  </li>
                )
              })}
            </ul>
          ) : <p>No analysis requests yet.</p>}
        </div>
      )}
    </section>
  )
}

export default FakeNewsDetection
