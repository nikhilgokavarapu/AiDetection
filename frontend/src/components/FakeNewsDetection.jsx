import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const modalities = [
  {
    id: 'image',
    label: 'Image',
    desc: 'Upload suspicious images to detect manipulation, deepfake traces, and tampering artifacts.',
    accept: '.jpg,.jpeg,.png'
  },
  {
    id: 'document',
    label: 'Document Detection',
    desc: 'Upload a document image to check for visual tampering, altered regions, and authenticity signals.',
    accept: '.jpg,.jpeg,.png,.pdf,.tif,.tiff'
  },
  {
    id: 'text',
    label: 'Text',
    desc: 'Upload or paste text for hybrid DeBERTa-v3 analysis of synthetic writing and authorship signals.',
    accept: '.txt'
  },
  {
    id: 'video',
    label: 'Video',
    desc: 'Upload video evidence to review temporal consistency, lip-sync anomalies, and frame integrity.',
    accept: '.mp4,.avi,.mov,.webm'
  },
  {
    id: 'audio',
    label: 'Audio',
    desc: 'Upload audio to analyze voice cloning, synthesis artifacts, and suspicious spectral patterns.',
    accept: '.mp3,.wav'
  },
  {
    id: 'spoof',
    label: 'Spoofing',
    desc: 'Optionally evaluate biometric and presentation attack risk in submitted media.',
    accept: '.jpg,.jpeg,.png,.mp4,.avi,.mov,.webm,.mp3,.wav'
  }
]

function getModalityForFile(file) {
  const filename = file.name.toLowerCase()
  return modalities.find((modality) =>
    modality.accept.split(',').some((extension) => filename.endsWith(extension))
  )?.id ?? 'image'
}

function isFileSupported(file, modalityId) {
  const modality = modalities.find((item) => item.id === modalityId)
  const filename = file.name.toLowerCase()
  return Boolean(modality?.accept.split(',').some((extension) => filename.endsWith(extension)))
}

function formatFileSize(size) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

const sampleResults = {
  image: {
    title: 'Image tampering risk detected',
    score: '82%',
    description: 'Metadata mismatch and editing artifacts indicate a high possibility of manipulated content.',
    highlights: ['Lighting inconsistency', 'Compression artifact anomalies', 'Potential copy-move editing']
  },
  document: {
    title: 'Document appears authentic',
    score: '25%',
    confidence: 0.25,
    isReal: true,
    description: 'No strong document tampering signals were identified in this demo result.',
    highlights: ['Layout consistency review', 'Visual artifact scan', 'Text region integrity check']
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

function FakeNewsDetection({ user, onLogin, droppedFile, onDroppedFileHandled }) {
  const [activeTab, setActiveTab] = useState('image')
  const [selectedFile, setSelectedFile] = useState(null)
  const [manualText, setManualText] = useState('')
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [savedReports, setSavedReports] = useState([])
  const [requestHistory, setRequestHistory] = useState([])
  const [saveMessage, setSaveMessage] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [analysisCompletedAt, setAnalysisCompletedAt] = useState(null)
  const demoTimerRef = useRef(null)

  const activeModality = modalities.find((item) => item.id === activeTab)

  const completeAnalysis = (analysisResult) => {
    setResult(analysisResult)
    setAnalysisCompletedAt(new Date())
    setStatus('done')
  }

  useEffect(() => {
    if (!droppedFile) return

    const modalityId = getModalityForFile(droppedFile)
    setActiveTab(modalityId)
    setSelectedFile(isFileSupported(droppedFile, modalityId) ? droppedFile : null)
    setStatus('idle')
    setResult(null)
    setError(isFileSupported(droppedFile, modalityId) ? '' : 'This file format is not supported.')
    onDroppedFileHandled(null)
  }, [droppedFile, onDroppedFileHandled])

  useEffect(() => () => {
    if (demoTimerRef.current) window.clearTimeout(demoTimerRef.current)
  }, [])

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
    if (demoTimerRef.current) {
      window.clearTimeout(demoTimerRef.current)
      demoTimerRef.current = null
    }
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
    if (file && !isFileSupported(file, activeTab)) {
      setSelectedFile(null)
      setError('This file format is not supported for the selected modality.')
      return
    }
    setSelectedFile(file)
    setStatus('idle')
    setResult(null)
    setError('')
  }

  const handleFileDrop = (event) => {
    event.preventDefault()
    setIsDragOver(false)
    const file = event.dataTransfer.files?.[0]
    if (!file) return

    if (!isFileSupported(file, activeTab)) {
      setSelectedFile(null)
      setError('This file format is not supported for the selected modality.')
      return
    }

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

    const backendUrl = import.meta.env.VITE_BACKEND_API_URL
    if (activeTab === 'document' && backendUrl) {
      try {
        const payload = new FormData()
        payload.append('file', selectedFile)
        const response = await fetch(`${backendUrl.replace(/\/$/, '')}/api/detect-document`, {
          method: 'POST',
          body: payload
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.detail || data.error || 'The document backend failed.')

        const documentResult = data.result ?? data
        const score = Number(documentResult.score ?? ((documentResult.confidence ?? 0.5) * 100))
        const isReal = documentResult.is_real ?? documentResult.isReal ?? (
          documentResult.label ? documentResult.label === 'real' : score < 50
        )
        const confidence = Number(documentResult.confidence ?? Math.max(score, 100 - score) / 100)
        completeAnalysis({
          ...documentResult,
          title: documentResult.title || (isReal ? 'Document appears authentic' : 'Forged document detected'),
          score: `${Math.round(score)}%`,
          confidence,
          isReal,
          highlights: documentResult.highlights || [],
          description: documentResult.description || 'The document was analyzed by the authenticity detection pipeline.'
        })
      } catch (analysisError) {
        setStatus('idle')
        setError(analysisError.message || 'The document backend failed.')
      }
      return
    }

    if (backendUrl) {
      try {
        const payload = new FormData()
        payload.append('modality', activeTab)
        if (manualText.trim()) payload.append('text', manualText.trim())
        if (selectedFile) payload.append('file', selectedFile)

        const response = await fetch(`${backendUrl.replace(/\/$/, '')}/api/analyze`, {
          method: 'POST',
          body: payload
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.detail || data.error || 'The analysis backend failed.')

        const backendResult = data.result ?? data
        const score = Number(backendResult.score)
        if (!Number.isFinite(score)) throw new Error('The analysis backend returned an invalid score.')

        completeAnalysis({
          ...backendResult,
          score: `${Math.round(Math.max(0, Math.min(100, score)))}%`,
          resultId: backendResult.id,
          highlights: Array.isArray(backendResult.highlights) ? backendResult.highlights : [],
          description: backendResult.description || 'The content was analyzed by the configured detection pipeline.'
        })
      } catch (analysisError) {
        setStatus('idle')
        setError(analysisError.message || 'The analysis backend failed.')
      }
      return
    }

    if (!user || !supabase) {
      demoTimerRef.current = window.setTimeout(() => {
        completeAnalysis({ ...sampleResults[activeTab], mode: 'demo_fallback' })
      }, 1100)
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
      completeAnalysis({
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
  const reportedConfidence = Number(result?.confidence)
  const confidencePercent = Number.isFinite(reportedConfidence)
    ? Math.round(reportedConfidence <= 1 ? reportedConfidence * 100 : reportedConfidence)
    : null

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

          <label
            htmlFor="fake-news-upload"
            className={`upload-input-label ${isDragOver ? 'is-drag-over' : ''}`}
            onDragOver={(event) => {
              event.preventDefault()
              setIsDragOver(true)
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleFileDrop}
          >
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
            <button type="button" className="primary-btn" onClick={handleRunAnalysis} disabled={status === 'analyzing'}>
              {status === 'analyzing' ? 'Analyzing...' : 'Run analysis'}
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
            <p>{activeTab === 'document'
              ? 'Supported document images: JPG, JPEG, PNG, PDF, TIFF.'
              : activeTab === 'text'
                ? 'Text model: hybrid DeBERTa-v3. Paste text or upload a UTF-8 TXT file.'
                : 'Supported formats: JPG, JPEG, PNG, MP4, AVI, MOV, WebM, WAV, MP3.'}</p>
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
                {activeTab === 'document' && (
                  <div className={`document-verdict ${result.isReal ? 'is-real' : 'is-forged'}`}>
                    <span className="document-verdict-dot" aria-hidden="true" />
                    <div>
                      <span className="document-verdict-label">Authenticity</span>
                      <strong>{result.isReal ? 'Likely authentic' : 'Potentially forged'}</strong>
                    </div>
                    <span className="document-confidence">{Math.round((result.confidence ?? 0) * 100)}%</span>
                  </div>
                )}
                <div className="result-score">
                  <span>{result.score}</span>
                  <p>{result.title}</p>
                </div>

                <div className="confidence-block" aria-label="Risk score meter">
                  <div className="confidence-header">
                    <span>Risk score</span>
                    <strong>{result.score}</strong>
                  </div>
                  <div className="confidence-track">
                    <div
                      className="confidence-fill"
                      style={{ width: `${Math.max(0, Math.min(100, Number.parseInt(result.score, 10) || 0))}%` }}
                    />
                  </div>
                </div>

                <p className="result-desc">{result.description}</p>
                <ul className="result-highlights">
                  {(result.highlights || []).map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
                <section className="analysis-details" aria-label="Analysis details">
                  <h4>Analysis details</h4>
                  <dl>
                    <dt>Modality</dt>
                    <dd>{activeModality?.label || activeTab}</dd>
                    {selectedFile ? (
                      <>
                        <dt>File</dt>
                        <dd>{selectedFile.name}</dd>
                        <dt>File type</dt>
                        <dd>{selectedFile.type || 'Unknown'}</dd>
                        <dt>File size</dt>
                        <dd>{formatFileSize(selectedFile.size)}</dd>
                      </>
                    ) : activeTab === 'text' && manualText.trim() ? (
                      <>
                        <dt>Input</dt>
                        <dd>Pasted text</dd>
                        <dt>Characters</dt>
                        <dd>{manualText.trim().length.toLocaleString()}</dd>
                      </>
                    ) : null}
                    {confidencePercent !== null && (
                      <>
                        <dt>Reported confidence</dt>
                        <dd>{confidencePercent}%</dd>
                      </>
                    )}
                    {result.mode && (
                      <>
                        <dt>Analysis source</dt>
                        <dd>{result.mode === 'demo_fallback' ? 'Demo fallback' : result.mode}</dd>
                      </>
                    )}
                    {analysisCompletedAt && (
                      <>
                        <dt>Completed</dt>
                        <dd>{analysisCompletedAt.toLocaleString()}</dd>
                      </>
                    )}
                  </dl>
                </section>
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
