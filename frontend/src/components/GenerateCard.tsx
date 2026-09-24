import React from 'react'

interface GenerateCardProps {
  canGenerate: boolean
  isGenerating: boolean
  signedPdfUrl: string | null
  signedFileName: string
  onGenerate: () => void
}

const GenerateIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 8 12 12 14 14" />
  </svg>
)

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

export const GenerateCard: React.FC<GenerateCardProps> = ({
  canGenerate,
  isGenerating,
  signedPdfUrl,
  signedFileName,
  onGenerate,
}) => {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-step-badge">3</div>
        <h2 className="card-title">Generate & download</h2>
      </div>

      <button
        className="btn btn-primary btn-full"
        onClick={onGenerate}
        disabled={!canGenerate || isGenerating}
        id="generate-btn"
        aria-busy={isGenerating}
      >
        {isGenerating ? (
          <>
            <span className="spinner spinner-sm" />
            Signing PDF…
          </>
        ) : (
          <>
            <GenerateIcon />
            Generate signed PDF
          </>
        )}
      </button>

      {isGenerating && (
        <div className="progress-bar-wrap" style={{ marginTop: 10 }}>
          <div className="progress-bar-fill" style={{ width: '100%' }} />
        </div>
      )}

      {!canGenerate && !isGenerating && (
        <p className="generate-hint">Add a PDF and a signature first.</p>
      )}

      {signedPdfUrl && !isGenerating && (
        <>
          <div className="divider" />
          <a
            href={signedPdfUrl}
            download={signedFileName}
            id="download-btn"
            className="btn btn-success btn-full"
            style={{ textDecoration: 'none' }}
          >
            <DownloadIcon />
            Download signed PDF
          </a>
          <p className="generate-hint" style={{ color: '#16a34a', fontWeight: 500 }}>
            Your signed document is ready!
          </p>
        </>
      )}
    </div>
  )
}
